import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { updateAfterAttempt } from '@/lib/learner/model';
import { getErrorRepeatCount } from '@/lib/learner/repair-engine';
import { getActionPolicy } from '@/lib/learner/policy';
import { getAssignment } from '@/lib/learner/experiment';
import { logAttemptEvent } from '@/lib/learner/events';
import { getTimingFeedback } from '@/lib/learner/timing-analysis';
import { deriveErrorSignature } from '@/lib/learner/error-signature';
import { incrementSession } from '@/lib/session';
import type { DimensionType, SessionMode } from '@/lib/types/database';

const attemptV2Schema = z.object({
  user_id: z.string().uuid(),
  question_type: z.enum(['item_draft', 'question']),
  question_id: z.string().uuid(),
  selected_answer: z.enum(['A', 'B', 'C', 'D', 'E']),
  time_spent_ms: z.number().int().positive().optional(),
  confidence_pre: z.number().int().min(1).max(5).optional(),
  session_id: z.string().uuid().optional(),
  session_mode: z.enum(['retention', 'training', 'assessment']).optional(),
  // Contrast loop instrumentation — client reports if this was a contrast question
  is_contrast_question: z.boolean().optional(),
  // v23 Rule 6 — metacognitive capture on wrong answers (optional, client may omit)
  self_labeled_error: z.string().max(64).optional(),
  what_were_you_thinking: z.string().max(1000).optional(),
});

/**
 * POST /api/study/attempt-v2
 * Records an attempt with diagnostic data and updates the learner model.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = attemptV2Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const {
    user_id, question_type, question_id, selected_answer,
    time_spent_ms, confidence_pre, session_id, session_mode,
    is_contrast_question,
    self_labeled_error, what_were_you_thinking,
  } = parsed.data;

  const supabase = createAdminClient();

  // Determine correctness and diagnose errors
  let isCorrect = false;
  let diagnosedCognitiveErrorId: string | null = null;
  let diagnosedHingeMiss = false;
  let diagnosedActionClassConfusion = false;
  let errorName: string | undefined;
  // Contrast loop metadata
  let confusionSetId: string | null = null;
  let correctOptionFrameId: string | null = null;

  // Dimensions to update
  const dimensionUpdates: { type: DimensionType; id: string; label: string }[] = [];

  if (question_type === 'question') {
    const { data: question } = await supabase
      .from('questions')
      .select('correct_answer, error_map, error_bucket, system_topic, confusion_set_id, transfer_rule_id')
      .eq('id', question_id)
      .single();

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    isCorrect = selected_answer === question.correct_answer;

    // Diagnose from error_map
    if (!isCorrect) {
      const errorMap = question.error_map as Record<string, string> | null;
      errorName = errorMap?.[selected_answer] ?? undefined;

      if (errorName) {
        const { data: errorRow } = await supabase
          .from('error_taxonomy')
          .select('id')
          .eq('error_name', errorName)
          .single();
        if (errorRow) {
          diagnosedCognitiveErrorId = errorRow.id;
          dimensionUpdates.push({ type: 'cognitive_error', id: errorRow.id, label: errorName });
        }
      }
    }

    // Always update topic dimension
    dimensionUpdates.push({ type: 'topic', id: question.system_topic, label: question.system_topic });

    // Update confusion set dimension if linked
    if (question.confusion_set_id) {
      confusionSetId = question.confusion_set_id;
      dimensionUpdates.push({ type: 'confusion_set', id: question.confusion_set_id, label: question.confusion_set_id });
    }

    // Update transfer rule dimension if linked
    if (question.transfer_rule_id) {
      dimensionUpdates.push({ type: 'transfer_rule', id: question.transfer_rule_id, label: question.transfer_rule_id });
    }

  } else {
    // item_draft
    const { data: draft } = await supabase
      .from('item_draft')
      .select('correct_answer, case_plan_id, blueprint_node_id')
      .eq('id', question_id)
      .single();

    if (!draft) {
      return NextResponse.json({ error: 'Item draft not found' }, { status: 404 });
    }

    isCorrect = selected_answer === draft.correct_answer;

    // If we have a case plan, extract ontology dimensions
    if (draft.case_plan_id) {
      const { data: casePlan } = await supabase
        .from('case_plan')
        .select('target_transfer_rule_id, target_confusion_set_id, target_cognitive_error_id, target_hinge_clue_type_id, target_action_class_id, correct_option_frame_id')
        .eq('id', draft.case_plan_id)
        .single();

      if (casePlan) {
        // Capture contrast loop metadata
        confusionSetId = casePlan.target_confusion_set_id ?? null;
        correctOptionFrameId = casePlan.correct_option_frame_id ?? null;

        if (casePlan.target_cognitive_error_id) {
          dimensionUpdates.push({
            type: 'cognitive_error',
            id: casePlan.target_cognitive_error_id,
            label: casePlan.target_cognitive_error_id,
          });
          if (!isCorrect) {
            diagnosedCognitiveErrorId = casePlan.target_cognitive_error_id;
          }
        }
        if (casePlan.target_confusion_set_id) {
          dimensionUpdates.push({
            type: 'confusion_set',
            id: casePlan.target_confusion_set_id,
            label: casePlan.target_confusion_set_id,
          });
        }
        if (casePlan.target_transfer_rule_id) {
          dimensionUpdates.push({
            type: 'transfer_rule',
            id: casePlan.target_transfer_rule_id,
            label: casePlan.target_transfer_rule_id,
          });
        }
        if (casePlan.target_action_class_id) {
          dimensionUpdates.push({
            type: 'action_class',
            id: casePlan.target_action_class_id,
            label: casePlan.target_action_class_id,
          });
          if (!isCorrect) diagnosedActionClassConfusion = true;
        }
        if (casePlan.target_hinge_clue_type_id) {
          dimensionUpdates.push({
            type: 'hinge_clue_type',
            id: casePlan.target_hinge_clue_type_id,
            label: casePlan.target_hinge_clue_type_id,
          });
          if (!isCorrect) diagnosedHingeMiss = true;
        }
      }
    }

    // Get topic from blueprint node
    if (draft.blueprint_node_id) {
      const { data: node } = await supabase
        .from('blueprint_node')
        .select('topic')
        .eq('id', draft.blueprint_node_id)
        .single();
      if (node) {
        dimensionUpdates.push({ type: 'topic', id: node.topic, label: node.topic });
      }
    }
  }

  // Insert attempt with Phase 1 instrumentation
  const isContrastQ = is_contrast_question ?? false;
  const { data: attempt, error: insertErr } = await supabase
    .from('attempt_v2')
    .insert({
      user_id,
      item_draft_id: question_type === 'item_draft' ? question_id : null,
      question_id: question_type === 'question' ? question_id : null,
      selected_answer,
      is_correct: isCorrect,
      time_spent_ms: time_spent_ms ?? null,
      confidence_pre: confidence_pre ?? null,
      diagnosed_cognitive_error_id: diagnosedCognitiveErrorId,
      diagnosed_hinge_miss: diagnosedHingeMiss,
      diagnosed_action_class_confusion: diagnosedActionClassConfusion,
      session_id: session_id ?? null,
      session_mode: (session_mode as SessionMode) ?? null,
      // Phase 1 instrumentation
      is_contrast_question: isContrastQ,
      contrast_success: isContrastQ ? isCorrect : null,
      confusion_set_id: confusionSetId,
      // v23 Rule 6 — metacognitive capture (null when client omits or answer correct)
      self_labeled_error: self_labeled_error ?? null,
      what_were_you_thinking: what_were_you_thinking ?? null,
    })
    .select('id')
    .single();

  if (insertErr || !attempt) {
    return NextResponse.json({ error: insertErr?.message ?? 'Insert failed' }, { status: 500 });
  }

  // Baseline event — one attempt_submitted row per attempt. Phase B adds the
  // client-emitted events (option_hover, section_expand, etc.) alongside this.
  await logAttemptEvent({
    attemptId: attempt.id,
    eventType: 'attempt_submitted',
    metadata: {
      selected_answer,
      is_correct: isCorrect,
      time_spent_ms: time_spent_ms ?? null,
      confidence_pre: confidence_pre ?? null,
      is_contrast_question: isContrastQ ?? false,
    },
  });

  // Update learner model for each dimension
  for (const dim of dimensionUpdates) {
    await updateAfterAttempt(
      user_id, dim.type, dim.id, dim.label,
      isCorrect, time_spent_ms ?? null, errorName
    );
  }

  // Diagnose repair action
  const errorRepeatCount = diagnosedCognitiveErrorId
    ? await getErrorRepeatCount(user_id, diagnosedCognitiveErrorId)
    : 0;

  // Get mastery for the primary dimension (first topic dimension)
  const topicDim = dimensionUpdates.find(d => d.type === 'topic');
  let dimensionMastery: number | null = null;
  if (topicDim) {
    const { data: masteryRow } = await supabase
      .from('learner_model')
      .select('mastery_level')
      .eq('user_id', user_id)
      .eq('dimension_type', 'topic')
      .eq('dimension_id', topicDim.id)
      .single();
    dimensionMastery = masteryRow?.mastery_level ?? null;
  }

  // Look up Palmerton gap type for the diagnosed error
  let palmertonGapType: 'skills' | 'noise' | 'consistency' | null = null;
  if (diagnosedCognitiveErrorId) {
    const { data: gapRow } = await supabase
      .from('error_taxonomy')
      .select('palmerton_gap_type')
      .eq('id', diagnosedCognitiveErrorId)
      .single();
    palmertonGapType = (gapRow?.palmerton_gap_type as typeof palmertonGapType) ?? null;
  }

  const experiment = await getAssignment(user_id);
  const actionPolicy = getActionPolicy(experiment);
  const repairDecision = await actionPolicy.choose({
    userId: user_id,
    attemptId: attempt.id,
    isCorrect,
    timeSpentMs: time_spent_ms ?? null,
    confidencePre: confidence_pre ?? null,
    diagnosedCognitiveErrorId,
    diagnosedHingeMiss,
    diagnosedActionClassConfusion,
    errorRepeatCount,
    dimensionMastery,
    confusionSetId,
    lastCorrectOptionFrameId: correctOptionFrameId,
    palmertonGapType,
  });

  // Update attempt with repair action
  await supabase
    .from('attempt_v2')
    .update({ repair_action: repairDecision.action })
    .eq('id', attempt.id);

  // Increment session counters if this attempt belongs to a session
  let sessionComplete = false;
  if (session_id) {
    try {
      const result = await incrementSession(session_id, isCorrect);
      sessionComplete = result.justCompleted;
    } catch {
      // Session may not exist (legacy client-side sessions) — non-fatal
    }
  }

  // Resolve error name for the diagnosed cognitive error (for UI display)
  let diagnosedErrorName: string | null = null;
  if (diagnosedCognitiveErrorId) {
    if (errorName) {
      diagnosedErrorName = errorName;
    } else {
      const { data: errorRow } = await supabase
        .from('error_taxonomy')
        .select('error_name')
        .eq('id', diagnosedCognitiveErrorId)
        .single();
      diagnosedErrorName = errorRow?.error_name ?? null;
    }
  }

  // Error signature — pure derivation from the signals just computed.
  // Drives "why YOU missed it" explanation lead in the study feedback UI.
  const errorSignature = deriveErrorSignature({
    is_correct: isCorrect,
    selected_answer,
    time_spent_ms: time_spent_ms ?? null,
    confidence_pre: confidence_pre ?? null,
    diagnosed_cognitive_error_name: diagnosedErrorName,
    diagnosed_hinge_miss: diagnosedHingeMiss,
    diagnosed_action_class_confusion: diagnosedActionClassConfusion,
    confusion_set_id: confusionSetId,
    option_error_name: diagnosedErrorName,
  });

  // Timing feedback (Palmerton 2-minute rule)
  let timingFeedback: string | null = null;
  if (time_spent_ms) {
    // Get user's average time for context
    const { data: avgRow } = await supabase
      .from('learner_model')
      .select('avg_time_ms')
      .eq('user_id', user_id)
      .eq('dimension_type', 'topic')
      .not('avg_time_ms', 'is', null)
      .limit(1)
      .single();

    timingFeedback = getTimingFeedback(time_spent_ms, avgRow?.avg_time_ms ?? null);
  }

  // v23 Rule 9 — user_progression_phase drives the selector system-clustering behavior.
  // The generated column is derived from total_attempts on any learner_model row.
  // We aggregate across dimensions to get the user's global phase.
  let userProgressionPhase: 'system_clustered' | 'partially_mixed' | 'fully_random' = 'system_clustered';
  {
    const { data: phaseRow } = await supabase
      .from('learner_model')
      .select('total_attempts')
      .eq('user_id', user_id)
      .eq('dimension_type', 'topic')
      .order('total_attempts', { ascending: false })
      .limit(1)
      .maybeSingle();
    const totalAttempts = phaseRow?.total_attempts ?? 0;
    userProgressionPhase =
      totalAttempts < 200 ? 'system_clustered'
      : totalAttempts < 800 ? 'partially_mixed'
      : 'fully_random';
  }

  // v23 Rule 2 — easy-miss signal: if the user missed an item tagged
  // easy_recognition, repair shifts to content-gap remediation rather than a
  // cognitive-error correction.
  let easyRecognitionMiss = false;
  if (!isCorrect && question_type === 'item_draft') {
    const { data: draftDiff } = await supabase
      .from('item_draft')
      .select('case_plan_id')
      .eq('id', question_id)
      .single();
    if (draftDiff?.case_plan_id) {
      const { data: cp } = await supabase
        .from('case_plan')
        .select('difficulty_class')
        .eq('id', draftDiff.case_plan_id)
        .single();
      easyRecognitionMiss = cp?.difficulty_class === 'easy_recognition';
    }
  }

  return NextResponse.json({
    attemptId: attempt.id,
    isCorrect,
    diagnosedCognitiveErrorId,
    diagnosedErrorName,
    diagnosedHingeMiss,
    diagnosedActionClassConfusion,
    errorRepeatCount,
    dimensionsUpdated: dimensionUpdates.map(d => `${d.type}:${d.id}`),
    repairAction: repairDecision.action,
    repairReason: repairDecision.reason,
    repairTargetDimensionType: repairDecision.targetDimensionType,
    repairTargetDimensionId: repairDecision.targetDimensionId,
    // Contrast loop metadata — client passes these to /study/next for contrast selection
    lastCorrectOptionFrameId: correctOptionFrameId,
    sessionComplete,
    // Palmerton timing feedback
    timingFeedback,
    // v23 Rule 9 — guides selector system-clustering
    userProgressionPhase,
    // v23 Rule 2 — easy-miss content-gap signal (UI copies this)
    easyRecognitionMiss,
    // v24 — drives adaptive explanation display depth (<0.4 novice / 0.4-0.7 targeted / >0.7 expert)
    dimensionMastery,
    topicDimensionId: topicDim?.id ?? null,
    // "Why YOU missed it" — keys the explanation-lead UI in study-feedback.
    errorSignature,
  });
}
