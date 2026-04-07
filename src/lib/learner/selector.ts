import { createAdminClient } from '@/lib/supabase/admin';
import type { DimensionType, RepairAction, SessionMode } from '@/lib/types/database';
import type { SelectionStrategy, DimensionMastery } from './types';
import { getWeakestDimensions } from './model';

interface SelectedQuestion {
  questionId: string;
  questionType: 'item_draft' | 'question';
  strategy: SelectionStrategy;
}

interface SelectionOpts {
  sessionMode?: SessionMode | null;
  sessionId?: string | null;
  forceDimension?: { type: DimensionType; id: string } | null;
}

/**
 * Returns the count of dimensions due for spaced review.
 */
export async function getDueReviewCount(userId: string): Promise<number> {
  const supabase = createAdminClient();
  const { count } = await supabase
    .from('learner_model')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .lte('next_review_due', new Date().toISOString());

  return count ?? 0;
}

/**
 * Selects a question for retention mode — only items due for review.
 */
export async function selectRetentionQuestion(
  userId: string
): Promise<SelectedQuestion | null> {
  const supabase = createAdminClient();

  // Get dimensions due for review, most overdue first
  const { data: dueRows } = await supabase
    .from('learner_model')
    .select('dimension_type, dimension_id')
    .eq('user_id', userId)
    .lte('next_review_due', new Date().toISOString())
    .order('next_review_due', { ascending: true })
    .limit(10);

  if (!dueRows || dueRows.length === 0) return null;

  // Try to find a question for each due dimension
  for (const row of dueRows) {
    const result = await selectByDimensionMatch(
      supabase,
      row.dimension_type as DimensionType,
      row.dimension_id,
      'retention_due'
    );
    if (result) return result;
  }

  return null;
}

/**
 * Selects a random question for assessment mode, excluding already-served questions.
 */
export async function selectAssessmentQuestion(
  sessionId: string
): Promise<SelectedQuestion | null> {
  const supabase = createAdminClient();

  // Get IDs already served in this session
  const { data: served } = await supabase
    .from('attempt_v2')
    .select('question_id, item_draft_id')
    .eq('session_id', sessionId);

  const servedQuestionIds = new Set(
    (served ?? []).map(a => (a as { question_id: string | null; item_draft_id: string | null }).question_id).filter(Boolean)
  );
  const servedDraftIds = new Set(
    (served ?? []).map(a => (a as { question_id: string | null; item_draft_id: string | null }).item_draft_id).filter(Boolean)
  );

  // Try MVP questions first
  const { data: questions } = await supabase
    .from('questions')
    .select('id')
    .limit(100);

  if (questions) {
    const available = questions.filter(q => !servedQuestionIds.has(q.id));
    if (available.length > 0) {
      const pick = available[Math.floor(Math.random() * available.length)];
      return {
        questionId: pick.id,
        questionType: 'question',
        strategy: { dimensionType: 'topic', dimensionId: 'assessment', reason: 'random_assessment' },
      };
    }
  }

  // Try item_drafts
  const { data: drafts } = await supabase
    .from('item_draft')
    .select('id')
    .eq('status', 'published')
    .limit(100);

  if (drafts) {
    const available = drafts.filter(d => !servedDraftIds.has(d.id));
    if (available.length > 0) {
      const pick = available[Math.floor(Math.random() * available.length)];
      return {
        questionId: pick.id,
        questionType: 'item_draft',
        strategy: { dimensionType: 'topic', dimensionId: 'assessment', reason: 'random_assessment' },
      };
    }
  }

  return null;
}

/**
 * Selects the next question for adaptive delivery.
 *
 * Strategy:
 * 1. Check if last attempt had a repair_action → follow that strategy
 *    - contrast: DETERMINISTIC — same confusion_set, different correct answer
 * 2. Otherwise, find weakest dimension → find a question targeting it
 * 3. Fallback: serve due-for-review questions, then random
 */
export async function selectNextQuestion(
  userId: string,
  lastRepairAction?: RepairAction | null,
  lastDimensionType?: DimensionType | null,
  lastDimensionId?: string | null,
  lastCorrectOptionFrameId?: string | null,
  opts?: SelectionOpts,
): Promise<SelectedQuestion | null> {
  const supabase = createAdminClient();

  // Mode-specific dispatch
  if (opts?.sessionMode === 'retention') {
    return selectRetentionQuestion(userId);
  }

  if (opts?.sessionMode === 'assessment' && opts.sessionId) {
    return selectAssessmentQuestion(opts.sessionId);
  }

  // Training mode with forced dimension — skip repair/weakness logic
  if (opts?.forceDimension) {
    const result = await selectByDimensionMatch(
      supabase,
      opts.forceDimension.type,
      opts.forceDimension.id,
      'forced_training'
    );
    if (result) return result;
    // Fall through to general selection if no match for forced dimension
  }

  // 1. If we have a repair action from the last attempt, follow it
  if (lastRepairAction && lastDimensionType && lastDimensionId) {
    const repairResult = await selectForRepair(
      supabase, lastRepairAction, lastDimensionType, lastDimensionId, lastCorrectOptionFrameId
    );
    if (repairResult) return repairResult;
  }

  // 2. Find weakest dimensions across all types
  const weakest = await getWeakestDimensions(userId, 3);
  if (weakest.length > 0) {
    const result = await selectForDimension(supabase, weakest[0]);
    if (result) return result;
  }

  // 3. Fallback: any published item_draft or question not recently served
  return selectFallback(supabase, userId);
}

/**
 * Selects a question based on a repair strategy.
 */
async function selectForRepair(
  supabase: ReturnType<typeof createAdminClient>,
  repairAction: RepairAction,
  dimensionType: DimensionType,
  dimensionId: string,
  lastCorrectOptionFrameId?: string | null,
): Promise<SelectedQuestion | null> {
  // Map repair action to the right query strategy
  switch (repairAction) {
    case 'reinforce':
      return selectByDimensionMatch(supabase, dimensionType, dimensionId, 'reinforce');

    case 'contrast':
      // DETERMINISTIC: same confusion_set, different correct answer.
      // This is the core learning mechanism — bypasses scheduler entirely.
      if (dimensionType === 'confusion_set') {
        return selectContrastQuestion(supabase, dimensionId, lastCorrectOptionFrameId ?? null);
      }
      // Fallback if somehow contrast was called without confusion_set dimension
      return selectByDimensionMatch(supabase, dimensionType, dimensionId, 'contrast');

    case 'remediate':
      // Same cognitive error, lower difficulty
      return selectByDimensionMatch(supabase, dimensionType, dimensionId, 'remediate');

    case 'transfer_test':
      // Same transfer rule, different clinical setting
      return selectByDimensionMatch(supabase, dimensionType, dimensionId, 'transfer_test');

    case 'advance':
    default:
      return null; // advance = normal selection, no special repair query
  }
}

/**
 * DETERMINISTIC contrast selection.
 * Finds a question from the SAME confusion set with a DIFFERENT correct answer.
 * This is the core product mechanism — error → contrast → correction.
 */
async function selectContrastQuestion(
  supabase: ReturnType<typeof createAdminClient>,
  confusionSetId: string,
  excludeCorrectOptionFrameId: string | null,
): Promise<SelectedQuestion | null> {
  // Strategy 1: item_draft via case_plan with different correct_option_frame_id
  if (excludeCorrectOptionFrameId) {
    const { data: drafts } = await supabase
      .from('item_draft')
      .select('id, case_plan!inner(target_confusion_set_id, correct_option_frame_id)')
      .eq('status', 'published')
      .eq('case_plan.target_confusion_set_id', confusionSetId)
      .neq('case_plan.correct_option_frame_id', excludeCorrectOptionFrameId)
      .limit(5);

    if (drafts && drafts.length > 0) {
      const pick = drafts[Math.floor(Math.random() * drafts.length)];
      return {
        questionId: pick.id,
        questionType: 'item_draft',
        strategy: { dimensionType: 'confusion_set', dimensionId: confusionSetId, reason: 'contrast_different_correct' },
      };
    }
  }

  // Strategy 2: any question from same confusion set (even if same correct answer)
  const { data: sameCsQuestions } = await supabase
    .from('questions')
    .select('id')
    .eq('confusion_set_id', confusionSetId)
    .limit(5);

  if (sameCsQuestions && sameCsQuestions.length > 0) {
    const pick = sameCsQuestions[Math.floor(Math.random() * sameCsQuestions.length)];
    return {
      questionId: pick.id,
      questionType: 'question',
      strategy: { dimensionType: 'confusion_set', dimensionId: confusionSetId, reason: 'contrast_same_set' },
    };
  }

  // Strategy 3: any item_draft from same confusion set (without correct answer filter)
  const { data: anyDrafts } = await supabase
    .from('item_draft')
    .select('id, case_plan!inner(target_confusion_set_id)')
    .eq('status', 'published')
    .eq('case_plan.target_confusion_set_id', confusionSetId)
    .limit(5);

  if (anyDrafts && anyDrafts.length > 0) {
    const pick = anyDrafts[Math.floor(Math.random() * anyDrafts.length)];
    return {
      questionId: pick.id,
      questionType: 'item_draft',
      strategy: { dimensionType: 'confusion_set', dimensionId: confusionSetId, reason: 'contrast_same_set_fallback' },
    };
  }

  // No contrast available — return null (caller falls through to normal selection)
  return null;
}

/**
 * Finds a question that matches a specific dimension.
 */
async function selectByDimensionMatch(
  supabase: ReturnType<typeof createAdminClient>,
  dimensionType: DimensionType,
  dimensionId: string,
  reason: string,
): Promise<SelectedQuestion | null> {
  // Try item_draft (v2 pipeline) first via case_plan linkages
  if (dimensionType === 'cognitive_error') {
    const { data } = await supabase
      .from('item_draft')
      .select('id, case_plan!inner(target_cognitive_error_id)')
      .eq('status', 'published')
      .eq('case_plan.target_cognitive_error_id', dimensionId)
      .limit(1)
      .single();
    if (data) {
      return {
        questionId: data.id,
        questionType: 'item_draft',
        strategy: { dimensionType, dimensionId, reason },
      };
    }
  }

  if (dimensionType === 'confusion_set') {
    // Try MVP questions table (has confusion_set_id)
    const { data } = await supabase
      .from('questions')
      .select('id')
      .eq('confusion_set_id', dimensionId)
      .limit(1)
      .single();
    if (data) {
      return {
        questionId: data.id,
        questionType: 'question',
        strategy: { dimensionType, dimensionId, reason },
      };
    }
  }

  if (dimensionType === 'transfer_rule') {
    const { data } = await supabase
      .from('questions')
      .select('id')
      .eq('transfer_rule_id', dimensionId)
      .limit(1)
      .single();
    if (data) {
      return {
        questionId: data.id,
        questionType: 'question',
        strategy: { dimensionType, dimensionId, reason },
      };
    }
  }

  if (dimensionType === 'topic') {
    const { data } = await supabase
      .from('questions')
      .select('id')
      .eq('system_topic', dimensionId)
      .limit(1)
      .single();
    if (data) {
      return {
        questionId: data.id,
        questionType: 'question',
        strategy: { dimensionType, dimensionId, reason },
      };
    }
  }

  if (dimensionType === 'action_class') {
    const { data } = await supabase
      .from('item_draft')
      .select('id, case_plan!inner(target_action_class_id)')
      .eq('status', 'published')
      .eq('case_plan.target_action_class_id', dimensionId)
      .limit(1)
      .single();
    if (data) {
      return {
        questionId: data.id,
        questionType: 'item_draft',
        strategy: { dimensionType, dimensionId, reason },
      };
    }
  }

  return null;
}

/**
 * Maps mastery level to a difficulty bracket (clinical_complexity range).
 * Used to serve appropriately challenging questions.
 */
function getDifficultyBracket(masteryLevel: number): { min: number; max: number } {
  if (masteryLevel < 0.3) return { min: 1, max: 2 };  // easy
  if (masteryLevel < 0.6) return { min: 2, max: 3 };  // medium
  if (masteryLevel < 0.8) return { min: 3, max: 4 };  // hard
  return { min: 4, max: 5 };                            // expert
}

/**
 * Finds a question targeting the weakest dimension, filtered by difficulty bracket.
 * Falls back to unfiltered selection if no difficulty-matched questions exist.
 */
async function selectForDimension(
  supabase: ReturnType<typeof createAdminClient>,
  dim: DimensionMastery,
): Promise<SelectedQuestion | null> {
  const bracket = getDifficultyBracket(dim.masteryLevel);

  // Try difficulty-filtered selection first (via case_plan.clinical_complexity)
  const { data: filtered } = await supabase
    .from('item_draft')
    .select('id, case_plan!inner(clinical_complexity)')
    .eq('status', 'published')
    .gte('case_plan.clinical_complexity', bracket.min)
    .lte('case_plan.clinical_complexity', bracket.max)
    .limit(5);

  if (filtered && filtered.length > 0) {
    const pick = filtered[Math.floor(Math.random() * filtered.length)];
    return {
      questionId: pick.id,
      questionType: 'item_draft',
      strategy: {
        dimensionType: dim.dimensionType,
        dimensionId: dim.dimensionId,
        reason: `difficulty_matched_${bracket.min}-${bracket.max}`,
      },
    };
  }

  // Fallback: unfiltered dimension match
  return selectByDimensionMatch(supabase, dim.dimensionType, dim.dimensionId, 'weakest_dimension');
}

/**
 * Fallback: serve any published question or item_draft.
 */
async function selectFallback(
  supabase: ReturnType<typeof createAdminClient>,
  _userId: string,
): Promise<SelectedQuestion | null> {
  // Try MVP questions first (more likely to have content)
  const { data: question } = await supabase
    .from('questions')
    .select('id')
    .limit(1)
    .single();

  if (question) {
    return {
      questionId: question.id,
      questionType: 'question',
      strategy: { dimensionType: 'topic', dimensionId: 'fallback', reason: 'no_targeting_available' },
    };
  }

  // Try published item_drafts
  const { data: draft } = await supabase
    .from('item_draft')
    .select('id')
    .eq('status', 'published')
    .limit(1)
    .single();

  if (draft) {
    return {
      questionId: draft.id,
      questionType: 'item_draft',
      strategy: { dimensionType: 'topic', dimensionId: 'fallback', reason: 'no_targeting_available' },
    };
  }

  return null;
}
