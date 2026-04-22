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
 *
 * Variant selection (research-backed): Prefers questions the student hasn't
 * seen before that test the same transfer_rule or confusion_set as the due
 * dimension. This prevents memorization of surface features (BMC study on
 * detrimental question bank patterns). Falls back to any matching question
 * if no unseen variants exist.
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

  // Get all question IDs this student has ever answered (for variant selection)
  const { data: allAttempts } = await supabase
    .from('attempt_v2')
    .select('question_id, item_draft_id')
    .eq('user_id', userId);

  const everAnswered = new Set<string>();
  for (const a of allAttempts ?? []) {
    if (a.question_id) everAnswered.add(a.question_id);
    if (a.item_draft_id) everAnswered.add(a.item_draft_id);
  }

  // Try to find an UNSEEN variant for each due dimension first, then fall back to any match
  for (const row of dueRows) {
    const dimType = row.dimension_type as DimensionType;
    const dimId = row.dimension_id;

    // For transfer_rule and confusion_set dimensions, prefer unseen variants
    if (dimType === 'transfer_rule' || dimType === 'confusion_set') {
      const variant = await selectUnseenVariant(supabase, dimType, dimId, everAnswered);
      if (variant) return variant;
    }

    // Fall back to any matching question (may be one they've seen before)
    const result = await selectByDimensionMatch(supabase, dimType, dimId, 'retention_due');
    if (result) return result;
  }

  return null;
}

/**
 * Finds an unseen question testing the same transfer_rule or confusion_set.
 * Prevents memorization by ensuring the student sees a different vignette
 * each time the same concept comes up for review.
 *
 * Priority: variant_group_id (strongest signal) → case_plan linkage → questions table
 */
async function selectUnseenVariant(
  supabase: ReturnType<typeof createAdminClient>,
  dimensionType: 'transfer_rule' | 'confusion_set',
  dimensionId: string,
  everAnswered: Set<string>,
): Promise<SelectedQuestion | null> {
  // Phase 0: variant_group_id lookup (strongest variant signal, from v20 IRT plumbing)
  // Find a previously answered draft for this dimension, get its variant_group_id,
  // then find unseen drafts in the same variant group.
  const variantGroupResult = await selectVariantGroupMatch(supabase, dimensionType, dimensionId, everAnswered);
  if (variantGroupResult) return variantGroupResult;

  if (dimensionType === 'transfer_rule') {
    // Find item_drafts targeting the same transfer rule via case_plan
    const { data: drafts } = await supabase
      .from('item_draft')
      .select('id, case_plan!inner(target_transfer_rule_id)')
      .eq('status', 'published')
      .eq('case_plan.target_transfer_rule_id', dimensionId)
      .limit(20);

    if (drafts) {
      const unseen = drafts.filter(d => !everAnswered.has(d.id));
      if (unseen.length > 0) {
        const pick = unseen[Math.floor(Math.random() * unseen.length)];
        return {
          questionId: pick.id,
          questionType: 'item_draft',
          strategy: { dimensionType, dimensionId, reason: 'retention_unseen_variant' },
        };
      }
    }

    // Also check questions table
    const { data: questions } = await supabase
      .from('questions')
      .select('id')
      .eq('transfer_rule_id', dimensionId)
      .limit(20);

    if (questions) {
      const unseen = questions.filter(q => !everAnswered.has(q.id));
      if (unseen.length > 0) {
        const pick = unseen[Math.floor(Math.random() * unseen.length)];
        return {
          questionId: pick.id,
          questionType: 'question',
          strategy: { dimensionType, dimensionId, reason: 'retention_unseen_variant' },
        };
      }
    }
  }

  if (dimensionType === 'confusion_set') {
    const { data: drafts } = await supabase
      .from('item_draft')
      .select('id, case_plan!inner(target_confusion_set_id)')
      .eq('status', 'published')
      .eq('case_plan.target_confusion_set_id', dimensionId)
      .limit(20);

    if (drafts) {
      const unseen = drafts.filter(d => !everAnswered.has(d.id));
      if (unseen.length > 0) {
        const pick = unseen[Math.floor(Math.random() * unseen.length)];
        return {
          questionId: pick.id,
          questionType: 'item_draft',
          strategy: { dimensionType, dimensionId, reason: 'retention_unseen_variant' },
        };
      }
    }

    const { data: questions } = await supabase
      .from('questions')
      .select('id')
      .eq('confusion_set_id', dimensionId)
      .limit(20);

    if (questions) {
      const unseen = questions.filter(q => !everAnswered.has(q.id));
      if (unseen.length > 0) {
        const pick = unseen[Math.floor(Math.random() * unseen.length)];
        return {
          questionId: pick.id,
          questionType: 'question',
          strategy: { dimensionType, dimensionId, reason: 'retention_unseen_variant' },
        };
      }
    }
  }

  return null;
}

/**
 * Finds an unseen draft in the same variant_group as a previously answered draft.
 * variant_group_id groups items that test the same transfer_rule/confusion_set
 * with different clinical surface features — the strongest anti-memorization signal.
 */
async function selectVariantGroupMatch(
  supabase: ReturnType<typeof createAdminClient>,
  dimensionType: DimensionType,
  dimensionId: string,
  everAnswered: Set<string>,
): Promise<SelectedQuestion | null> {
  // Find a draft the student has answered for this dimension that has a variant_group_id
  const casePlanField = dimensionType === 'transfer_rule'
    ? 'target_transfer_rule_id'
    : 'target_confusion_set_id';

  const { data: answeredDrafts } = await supabase
    .from('item_draft')
    .select(`id, variant_group_id, case_plan!inner(${casePlanField})`)
    .eq('status', 'published')
    .not('variant_group_id', 'is', null)
    .eq(`case_plan.${casePlanField}`, dimensionId)
    .limit(20);

  if (!answeredDrafts || answeredDrafts.length === 0) return null;

  // Filter to drafts the student has actually answered
  const answeredWithGroup = answeredDrafts.filter(d => everAnswered.has(d.id) && d.variant_group_id);
  if (answeredWithGroup.length === 0) return null;

  // Collect all variant_group_ids from answered drafts
  const variantGroupIds = new Set(answeredWithGroup.map(d => d.variant_group_id as string));

  // Find unseen drafts in any of those variant groups
  for (const groupId of variantGroupIds) {
    const { data: variants } = await supabase
      .from('item_draft')
      .select('id')
      .eq('variant_group_id', groupId)
      .eq('status', 'published')
      .limit(20);

    if (variants) {
      const unseen = variants.filter(v => !everAnswered.has(v.id));
      if (unseen.length > 0) {
        const pick = unseen[Math.floor(Math.random() * unseen.length)];
        return {
          questionId: pick.id,
          questionType: 'item_draft',
          strategy: { dimensionType, dimensionId, reason: 'variant_group_unseen' },
        };
      }
    }
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

  // Try MVP questions (only those wired to a confusion set)
  const { data: questions } = await supabase
    .from('questions')
    .select('id')
    .not('confusion_set_id', 'is', null)
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
 * Gets the set of question/draft IDs already served in a session.
 */
async function getServedIds(
  supabase: ReturnType<typeof createAdminClient>,
  sessionId: string | null | undefined,
): Promise<Set<string>> {
  if (!sessionId) return new Set();
  const { data: served } = await supabase
    .from('attempt_v2')
    .select('question_id, item_draft_id')
    .eq('session_id', sessionId);

  const ids = new Set<string>();
  for (const a of served ?? []) {
    if (a.question_id) ids.add(a.question_id);
    if (a.item_draft_id) ids.add(a.item_draft_id);
  }
  return ids;
}

/**
 * v23 Rule 9 — derive the user's progression phase from total attempts.
 * <200 → system_clustered, <800 → partially_mixed, ≥800 → fully_random.
 * Reads the max total_attempts across topic dimensions (the broadest proxy).
 */
async function getUserProgressionPhase(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
): Promise<'system_clustered' | 'partially_mixed' | 'fully_random'> {
  const { data: row } = await supabase
    .from('learner_model')
    .select('total_attempts')
    .eq('user_id', userId)
    .eq('dimension_type', 'topic')
    .order('total_attempts', { ascending: false })
    .limit(1)
    .maybeSingle();
  const total = row?.total_attempts ?? 0;
  if (total < 200) return 'system_clustered';
  if (total < 800) return 'partially_mixed';
  return 'fully_random';
}

/**
 * v23 Rule 9 — system-clustered selection.
 * Early users (first ~200 attempts) learn from same-system blocks of 4-6 questions
 * before switching systems. This builds pattern density before cross-system mixing.
 * Returns null if no candidate matches — caller falls through to adaptive flow.
 */
async function selectClusteredBySystem(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  servedIds: Set<string>,
): Promise<SelectedQuestion | null> {
  // Get the last 3 attempts' systems to infer the current cluster
  const { data: recent } = await supabase
    .from('attempt_v2')
    .select('item_draft_id, created_at')
    .eq('user_id', userId)
    .not('item_draft_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(6);

  if (!recent || recent.length === 0) return null;

  // Look up systems for recent drafts
  const draftIds = recent.map(r => r.item_draft_id).filter(Boolean) as string[];
  const { data: drafts } = await supabase
    .from('item_draft')
    .select('id, blueprint_node_id')
    .in('id', draftIds);
  const nodeIds = [...new Set((drafts ?? []).map(d => d.blueprint_node_id).filter(Boolean) as string[])];
  if (nodeIds.length === 0) return null;

  const { data: nodes } = await supabase
    .from('blueprint_node')
    .select('id, system')
    .in('id', nodeIds);
  const nodeSystemMap = new Map((nodes ?? []).map(n => [n.id, n.system]));

  // Determine the current cluster system (most common in last 3 attempts)
  const recentSystems: string[] = [];
  for (const r of recent.slice(0, 3)) {
    const draft = (drafts ?? []).find(d => d.id === r.item_draft_id);
    const system = draft?.blueprint_node_id ? nodeSystemMap.get(draft.blueprint_node_id) : undefined;
    if (system) recentSystems.push(system);
  }
  if (recentSystems.length === 0) return null;

  const systemCounts: Record<string, number> = {};
  for (const s of recentSystems) systemCounts[s] = (systemCounts[s] ?? 0) + 1;
  const currentSystem = Object.entries(systemCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (!currentSystem) return null;

  // Count consecutive attempts in this system — switch after 4-6
  let consecutive = 0;
  for (const r of recent) {
    const draft = (drafts ?? []).find(d => d.id === r.item_draft_id);
    const system = draft?.blueprint_node_id ? nodeSystemMap.get(draft.blueprint_node_id) : undefined;
    if (system === currentSystem) consecutive++;
    else break;
  }
  if (consecutive >= 5) return null;  // let main flow pick a new system

  // Find an unseen published item in the current system
  const { data: sameSystemNodes } = await supabase
    .from('blueprint_node')
    .select('id')
    .eq('system', currentSystem);
  const sameSystemIds = (sameSystemNodes ?? []).map(n => n.id);
  if (sameSystemIds.length === 0) return null;

  const { data: candidates } = await supabase
    .from('item_draft')
    .select('id, blueprint_node_id')
    .eq('status', 'published')
    .in('blueprint_node_id', sameSystemIds)
    .limit(50);

  const unseen = (candidates ?? []).filter(c => !servedIds.has(c.id));
  if (unseen.length === 0) return null;

  const pick = unseen[Math.floor(Math.random() * unseen.length)];
  return {
    questionId: pick.id,
    questionType: 'item_draft',
    strategy: {
      dimensionType: 'topic',
      dimensionId: currentSystem,
      reason: `system_clustered_${currentSystem}_${consecutive + 1}`,
    },
  };
}

/**
 * Selects the next question for adaptive delivery.
 *
 * Strategy:
 * 1. Check if last attempt had a repair_action → follow that strategy
 *    - contrast: DETERMINISTIC — same confusion_set, different correct answer
 * 2. Otherwise, find weakest dimension → find a question targeting it
 * 3. Fallback: serve due-for-review questions, then random
 *
 * ALL paths filter out questions already served in this session.
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
  const servedIds = await getServedIds(supabase, opts?.sessionId);

  // Mode-specific dispatch
  if (opts?.sessionMode === 'retention') {
    return selectRetentionQuestion(userId);
  }

  if (opts?.sessionMode === 'assessment' && opts.sessionId) {
    return selectAssessmentQuestion(opts.sessionId);
  }

  // ─── Calibration mode: diagnostic sweep for new users ───
  // First 15 questions rotate through content systems to establish baseline mastery.
  // After 15 attempts across ≥3 systems, adaptive routing takes over.
  {
    const { count: totalAttempts } = await supabase
      .from('attempt_v2')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if ((totalAttempts ?? 0) < 15) {
      // Get systems the user has already been tested on
      const { data: answeredDrafts } = await supabase
        .from('attempt_v2')
        .select('item_draft_id')
        .eq('user_id', userId);

      const answeredIds = new Set((answeredDrafts ?? []).map(a => a.item_draft_id).filter(Boolean));

      // Find published questions from systems not yet covered
      const { data: candidates } = await supabase
        .from('item_draft')
        .select('id, blueprint_node_id')
        .eq('status', 'published')
        .not('id', 'in', `(${[...answeredIds].join(',') || '00000000-0000-0000-0000-000000000000'})`)
        .limit(50);

      if (candidates && candidates.length > 0) {
        // Get blueprint nodes to check systems
        const nodeIds = [...new Set(candidates.map(c => c.blueprint_node_id).filter(Boolean))];
        const { data: nodes } = await supabase
          .from('blueprint_node')
          .select('id, system')
          .in('id', nodeIds);

        const nodeSystemMap = new Map((nodes ?? []).map(n => [n.id, n.system]));

        // Get systems already covered
        const coveredSystems = new Set<string>();
        for (const id of answeredIds) {
          const { data: draft } = await supabase
            .from('item_draft')
            .select('blueprint_node_id')
            .eq('id', id)
            .single();
          if (draft?.blueprint_node_id) {
            const system = nodeSystemMap.get(draft.blueprint_node_id);
            if (system) coveredSystems.add(system);
          }
        }

        // Prefer questions from uncovered systems
        const uncoveredCandidates = candidates.filter(c => {
          const system = nodeSystemMap.get(c.blueprint_node_id ?? '');
          return system && !coveredSystems.has(system);
        });

        const pool = uncoveredCandidates.length > 0 ? uncoveredCandidates : candidates;
        const pick = pool[Math.floor(Math.random() * pool.length)];
        return {
          questionId: pick.id,
          questionType: 'item_draft',
          strategy: { dimensionType: 'topic', dimensionId: 'calibration', reason: 'calibration_sweep' },
        };
      }
    }
  }

  // 1. If we have a repair action from the last attempt, follow it (highest priority)
  if (lastRepairAction && lastDimensionType && lastDimensionId) {
    const repairResult = await selectForRepair(
      supabase, lastRepairAction, lastDimensionType, lastDimensionId, lastCorrectOptionFrameId, servedIds
    );
    if (repairResult) return repairResult;
  }

  // v23 Rule 9 — System-clustering phase gate.
  // user_progression_phase derives from total_attempts across any learner_model dimension.
  // In 'system_clustered' (< 200 attempts) we bias selection to the same system as the
  // previous 2-3 attempts so early users build pattern density. In 'partially_mixed'
  // (< 800) we allow cross-system but maintain topic-diversity. In 'fully_random'
  // (≥ 800) we skip this gate entirely and fall through to the standard adaptive flow.
  const progressionPhase = await getUserProgressionPhase(supabase, userId);
  if (progressionPhase === 'system_clustered') {
    const clustered = await selectClusteredBySystem(supabase, userId, servedIds);
    if (clustered) return clustered;
  }

  // 2. Auto-mix: ~30% retention / ~70% training
  //    Check if items are due for review and probabilistically interleave them
  const dueCount = await getDueReviewCount(userId);
  if (dueCount > 0 && Math.random() < 0.3) {
    const retentionResult = await selectRetentionQuestion(userId);
    if (retentionResult && !servedIds.has(retentionResult.questionId)) {
      return retentionResult;
    }
  }

  // 3. Find weakest dimensions across all types
  const weakest = await getWeakestDimensions(userId, 3);
  if (weakest.length > 0) {
    const result = await selectForDimension(supabase, weakest[0], servedIds);
    if (result) return result;
  }

  // 3. Fallback: any published item_draft or question not recently served
  return selectFallback(supabase, userId, servedIds);
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
  servedIds?: Set<string>,
): Promise<SelectedQuestion | null> {
  // Map repair action to the right query strategy
  switch (repairAction) {
    case 'reinforce':
      return selectByDimensionMatch(supabase, dimensionType, dimensionId, 'reinforce', servedIds);

    case 'contrast':
      // DETERMINISTIC: same confusion_set, different correct answer.
      // This is the core learning mechanism — bypasses scheduler entirely.
      if (dimensionType === 'confusion_set') {
        return selectContrastQuestion(supabase, dimensionId, lastCorrectOptionFrameId ?? null, servedIds);
      }
      // Fallback if somehow contrast was called without confusion_set dimension
      return selectByDimensionMatch(supabase, dimensionType, dimensionId, 'contrast', servedIds);

    case 'remediate':
      // Same cognitive error, lower difficulty
      return selectByDimensionMatch(supabase, dimensionType, dimensionId, 'remediate', servedIds);

    case 'transfer_test':
      // Same transfer rule, different clinical setting
      return selectByDimensionMatch(supabase, dimensionType, dimensionId, 'transfer_test', servedIds);

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
  servedIds?: Set<string>,
): Promise<SelectedQuestion | null> {
  // Strategy 1: item_draft via case_plan with different correct_option_frame_id
  if (excludeCorrectOptionFrameId) {
    const { data: drafts } = await supabase
      .from('item_draft')
      .select('id, case_plan!inner(target_confusion_set_id, correct_option_frame_id)')
      .eq('status', 'published')
      .eq('case_plan.target_confusion_set_id', confusionSetId)
      .neq('case_plan.correct_option_frame_id', excludeCorrectOptionFrameId)
      .limit(10);

    if (drafts && drafts.length > 0) {
      const available = servedIds ? drafts.filter(d => !servedIds.has(d.id)) : drafts;
      if (available.length > 0) {
        const pick = available[Math.floor(Math.random() * available.length)];
        return {
          questionId: pick.id,
          questionType: 'item_draft',
          strategy: { dimensionType: 'confusion_set', dimensionId: confusionSetId, reason: 'contrast_different_correct' },
        };
      }
    }
  }

  // Strategy 2: any question from same confusion set (even if same correct answer)
  const { data: sameCsQuestions } = await supabase
    .from('questions')
    .select('id')
    .eq('confusion_set_id', confusionSetId)
    .limit(10);

  if (sameCsQuestions && sameCsQuestions.length > 0) {
    const available = servedIds ? sameCsQuestions.filter(q => !servedIds.has(q.id)) : sameCsQuestions;
    if (available.length > 0) {
      const pick = available[Math.floor(Math.random() * available.length)];
      return {
        questionId: pick.id,
        questionType: 'question',
        strategy: { dimensionType: 'confusion_set', dimensionId: confusionSetId, reason: 'contrast_same_set' },
      };
    }
  }

  // Strategy 3: any item_draft from same confusion set (without correct answer filter)
  const { data: anyDrafts } = await supabase
    .from('item_draft')
    .select('id, case_plan!inner(target_confusion_set_id)')
    .eq('status', 'published')
    .eq('case_plan.target_confusion_set_id', confusionSetId)
    .limit(10);

  if (anyDrafts && anyDrafts.length > 0) {
    const available = servedIds ? anyDrafts.filter(d => !servedIds.has(d.id)) : anyDrafts;
    if (available.length > 0) {
      const pick = available[Math.floor(Math.random() * available.length)];
      return {
        questionId: pick.id,
        questionType: 'item_draft',
        strategy: { dimensionType: 'confusion_set', dimensionId: confusionSetId, reason: 'contrast_same_set_fallback' },
      };
    }
  }

  // No contrast available — return null (caller falls through to normal selection)
  return null;
}

/**
 * Finds a question that matches a specific dimension, excluding already-served IDs.
 */
async function selectByDimensionMatch(
  supabase: ReturnType<typeof createAdminClient>,
  dimensionType: DimensionType,
  dimensionId: string,
  reason: string,
  servedIds?: Set<string>,
): Promise<SelectedQuestion | null> {
  // Helper: pick a random unserved item from a list
  function pickUnserved(items: { id: string }[], type: 'item_draft' | 'question'): SelectedQuestion | null {
    const available = servedIds ? items.filter(i => !servedIds.has(i.id)) : items;
    if (available.length === 0) return null;
    const pick = available[Math.floor(Math.random() * available.length)];
    return {
      questionId: pick.id,
      questionType: type,
      strategy: { dimensionType, dimensionId, reason },
    };
  }

  // Try item_draft (v2 pipeline) first via case_plan linkages
  if (dimensionType === 'cognitive_error') {
    const { data } = await supabase
      .from('item_draft')
      .select('id, case_plan!inner(target_cognitive_error_id)')
      .eq('status', 'published')
      .eq('case_plan.target_cognitive_error_id', dimensionId)
      .limit(10);
    if (data && data.length > 0) {
      const result = pickUnserved(data, 'item_draft');
      if (result) return result;
    }
  }

  if (dimensionType === 'confusion_set') {
    const { data } = await supabase
      .from('questions')
      .select('id')
      .eq('confusion_set_id', dimensionId)
      .limit(10);
    if (data && data.length > 0) {
      const result = pickUnserved(data, 'question');
      if (result) return result;
    }
  }

  if (dimensionType === 'transfer_rule') {
    const { data } = await supabase
      .from('questions')
      .select('id')
      .eq('transfer_rule_id', dimensionId)
      .limit(10);
    if (data && data.length > 0) {
      const result = pickUnserved(data, 'question');
      if (result) return result;
    }
  }

  if (dimensionType === 'topic') {
    const { data } = await supabase
      .from('questions')
      .select('id')
      .eq('system_topic', dimensionId)
      .limit(10);
    if (data && data.length > 0) {
      const result = pickUnserved(data, 'question');
      if (result) return result;
    }
  }

  if (dimensionType === 'action_class') {
    const { data } = await supabase
      .from('item_draft')
      .select('id, case_plan!inner(target_action_class_id)')
      .eq('status', 'published')
      .eq('case_plan.target_action_class_id', dimensionId)
      .limit(10);
    if (data && data.length > 0) {
      const result = pickUnserved(data, 'item_draft');
      if (result) return result;
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
  servedIds?: Set<string>,
): Promise<SelectedQuestion | null> {
  const bracket = getDifficultyBracket(dim.masteryLevel);

  // Try difficulty-filtered selection first (via case_plan.clinical_complexity)
  const { data: filtered } = await supabase
    .from('item_draft')
    .select('id, case_plan!inner(clinical_complexity)')
    .eq('status', 'published')
    .gte('case_plan.clinical_complexity', bracket.min)
    .lte('case_plan.clinical_complexity', bracket.max)
    .limit(10);

  if (filtered && filtered.length > 0) {
    const available = servedIds ? filtered.filter(d => !servedIds.has(d.id)) : filtered;
    if (available.length > 0) {
      const pick = available[Math.floor(Math.random() * available.length)];
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
  }

  // Fallback: unfiltered dimension match
  return selectByDimensionMatch(supabase, dim.dimensionType, dim.dimensionId, 'weakest_dimension', servedIds);
}

/**
 * Fallback: serve any published question or item_draft.
 */
async function selectFallback(
  supabase: ReturnType<typeof createAdminClient>,
  _userId: string,
  servedIds?: Set<string>,
): Promise<SelectedQuestion | null> {
  // Try MVP questions (only those wired to a confusion set)
  const { data: questions } = await supabase
    .from('questions')
    .select('id')
    .not('confusion_set_id', 'is', null)
    .limit(20);

  if (questions && questions.length > 0) {
    const available = servedIds ? questions.filter(q => !servedIds.has(q.id)) : questions;
    if (available.length > 0) {
      const pick = available[Math.floor(Math.random() * available.length)];
      return {
        questionId: pick.id,
        questionType: 'question',
        strategy: { dimensionType: 'topic', dimensionId: 'fallback', reason: 'no_targeting_available' },
      };
    }
  }

  // Try published item_drafts
  const { data: drafts } = await supabase
    .from('item_draft')
    .select('id')
    .eq('status', 'published')
    .limit(20);

  if (drafts && drafts.length > 0) {
    const available = servedIds ? drafts.filter(d => !servedIds.has(d.id)) : drafts;
    if (available.length > 0) {
      const pick = available[Math.floor(Math.random() * available.length)];
      return {
        questionId: pick.id,
        questionType: 'item_draft',
        strategy: { dimensionType: 'topic', dimensionId: 'fallback', reason: 'no_targeting_available' },
      };
    }
  }

  return null;
}
