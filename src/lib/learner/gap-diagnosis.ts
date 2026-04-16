import { createAdminClient } from '@/lib/supabase/admin';
import type { PalmertonGapType } from '@/lib/factory/seeds/error-taxonomy';

export interface GapBreakdown {
  percentage: number;
  count: number;
  topErrors: string[];
}

export interface GapDiagnosis {
  skillsGap: GapBreakdown;
  noiseGap: GapBreakdown;
  consistencyGap: GapBreakdown;
  dominantGap: PalmertonGapType;
  totalErrorsAnalyzed: number;
  confidenceLevel: 'low' | 'medium' | 'high';
  recommendation: string;
}

const MIN_ERRORS_FOR_DIAGNOSIS = 10;

const GAP_RECOMMENDATIONS: Record<PalmertonGapType, string> = {
  skills: 'Focus on interpretation drills. You know the conditions but struggle with findings like lab patterns, vital signs, and imaging.',
  noise: 'Focus on compare-and-contrast practice. You know the content but get pulled between similar-looking options. Be the Judge, not the Lawyer.',
  consistency: 'Focus on process execution. You know what to do but don\'t do it every time. The fix is discipline, not more content.',
};

/**
 * Analyzes a student's error history and classifies their dominant
 * Palmerton gap type (skills, noise, consistency).
 *
 * Returns null if insufficient data (< 10 diagnosed errors).
 */
export async function diagnoseGapProfile(userId: string): Promise<GapDiagnosis | null> {
  const supabase = createAdminClient();

  // Fetch wrong attempts with diagnosed cognitive errors
  const { data: attempts } = await supabase
    .from('attempt_v2')
    .select('diagnosed_cognitive_error_id')
    .eq('user_id', userId)
    .eq('is_correct', false)
    .not('diagnosed_cognitive_error_id', 'is', null);

  const wrongAttempts = (attempts ?? []) as { diagnosed_cognitive_error_id: string }[];

  if (wrongAttempts.length < MIN_ERRORS_FOR_DIAGNOSIS) {
    return null;
  }

  // Fetch error taxonomy with gap types
  const errorIds = [...new Set(wrongAttempts.map(a => a.diagnosed_cognitive_error_id))];
  const { data: errors } = await supabase
    .from('error_taxonomy')
    .select('id, error_name, palmerton_gap_type')
    .in('id', errorIds);

  const errorMap = new Map<string, { error_name: string; gap_type: PalmertonGapType }>();
  for (const err of (errors ?? []) as { id: string; error_name: string; palmerton_gap_type: PalmertonGapType | null }[]) {
    if (err.palmerton_gap_type) {
      errorMap.set(err.id, { error_name: err.error_name, gap_type: err.palmerton_gap_type });
    }
  }

  // Count by gap type
  const gapCounts: Record<PalmertonGapType, { count: number; errors: Map<string, number> }> = {
    skills: { count: 0, errors: new Map() },
    noise: { count: 0, errors: new Map() },
    consistency: { count: 0, errors: new Map() },
  };

  let classified = 0;
  for (const attempt of wrongAttempts) {
    const err = errorMap.get(attempt.diagnosed_cognitive_error_id);
    if (!err) continue;
    classified++;
    const gap = gapCounts[err.gap_type];
    gap.count++;
    gap.errors.set(err.error_name, (gap.errors.get(err.error_name) ?? 0) + 1);
  }

  if (classified < MIN_ERRORS_FOR_DIAGNOSIS) {
    return null;
  }

  // Compute percentages and top errors
  function buildBreakdown(gap: { count: number; errors: Map<string, number> }): GapBreakdown {
    const topErrors = [...gap.errors.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);

    return {
      percentage: Math.round((gap.count / classified) * 100),
      count: gap.count,
      topErrors,
    };
  }

  const skillsGap = buildBreakdown(gapCounts.skills);
  const noiseGap = buildBreakdown(gapCounts.noise);
  const consistencyGap = buildBreakdown(gapCounts.consistency);

  // Dominant gap = highest count
  const dominant: PalmertonGapType =
    skillsGap.count >= noiseGap.count && skillsGap.count >= consistencyGap.count
      ? 'skills'
      : noiseGap.count >= consistencyGap.count
        ? 'noise'
        : 'consistency';

  // Confidence level based on sample size
  const confidenceLevel: 'low' | 'medium' | 'high' =
    classified < 30 ? 'low' : classified < 50 ? 'medium' : 'high';

  return {
    skillsGap,
    noiseGap,
    consistencyGap,
    dominantGap: dominant,
    totalErrorsAnalyzed: classified,
    confidenceLevel,
    recommendation: GAP_RECOMMENDATIONS[dominant],
  };
}
