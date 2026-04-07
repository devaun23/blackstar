import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { selectNextQuestion } from '@/lib/learner/selector';
import { normalizeItemDraftExplanation, normalizeQuestionExplanation } from '@/lib/api/normalize-explanation';
import type { RepairAction, DimensionType, SessionMode } from '@/lib/types/database';

/**
 * GET /api/study/next
 * Returns the next adaptive question for the user.
 * Query params: userId, lastRepairAction?, lastDimensionType?, lastDimensionId?,
 *               sessionMode?, sessionId?, forceDimensionType?, forceDimensionId?
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  const lastRepairAction = searchParams.get('lastRepairAction') as RepairAction | null;
  const lastDimensionType = searchParams.get('lastDimensionType') as DimensionType | null;
  const lastDimensionId = searchParams.get('lastDimensionId');
  const lastCorrectOptionFrameId = searchParams.get('lastCorrectOptionFrameId');
  const sessionMode = searchParams.get('sessionMode') as SessionMode | null;
  const sessionId = searchParams.get('sessionId');
  const forceDimensionType = searchParams.get('forceDimensionType') as DimensionType | null;
  const forceDimensionId = searchParams.get('forceDimensionId');

  const selection = await selectNextQuestion(
    userId,
    lastRepairAction,
    lastDimensionType,
    lastDimensionId,
    lastCorrectOptionFrameId,
    {
      sessionMode,
      sessionId,
      forceDimension: forceDimensionType && forceDimensionId
        ? { type: forceDimensionType, id: forceDimensionId }
        : null,
    },
  );

  if (!selection) {
    return NextResponse.json({ error: 'No questions available' }, { status: 404 });
  }

  // Fetch the full question data
  const supabase = createAdminClient();

  if (selection.questionType === 'question') {
    const { data: question, error } = await supabase
      .from('questions')
      .select('*')
      .eq('id', selection.questionId)
      .single();

    if (error || !question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const richExplanation = normalizeQuestionExplanation(question);

    return NextResponse.json({
      questionType: 'question',
      question: { ...question, richExplanation },
      strategy: selection.strategy,
    });
  }

  // item_draft — normalize to the shape the study UI expects
  const { data: draft, error } = await supabase
    .from('item_draft')
    .select('*, question_skeleton_id, case_plan_id')
    .eq('id', selection.questionId)
    .single();

  if (error || !draft) {
    return NextResponse.json({ error: 'Item draft not found' }, { status: 404 });
  }

  // Build error_map from skeleton option_frames + error_taxonomy
  let errorMap: Record<string, { error_id: string; error_name: string; meaning: string }> = {};
  let transferRuleText: string | null = null;

  if (draft.question_skeleton_id) {
    const { data: skeleton } = await supabase
      .from('question_skeleton')
      .select('option_frames, correct_option_frame_id')
      .eq('id', draft.question_skeleton_id)
      .single();

    if (skeleton?.option_frames) {
      const frames = skeleton.option_frames as Array<{
        id: string;
        meaning: string;
        cognitive_error_id: string | null;
      }>;

      // Fetch error names for distractor cognitive_error_ids
      const errorIds = frames
        .map((f) => f.cognitive_error_id)
        .filter((id): id is string => id !== null);

      if (errorIds.length > 0) {
        const { data: errors } = await supabase
          .from('error_taxonomy')
          .select('id, error_name')
          .in('id', errorIds);

        const errorNameMap = new Map(
          (errors ?? []).map((e) => [e.id, e.error_name])
        );

        for (const frame of frames) {
          if (frame.cognitive_error_id) {
            errorMap[frame.id] = {
              error_id: frame.cognitive_error_id,
              error_name: errorNameMap.get(frame.cognitive_error_id) ?? 'unknown',
              meaning: frame.meaning,
            };
          }
        }
      }
    }
  }

  let confusionSetId: string | null = null;
  let correctOptionFrameId: string | null = null;

  if (draft.case_plan_id) {
    const { data: casePlan } = await supabase
      .from('case_plan')
      .select('transfer_rule_text, cognitive_operation_type, hinge_depth_target, target_confusion_set_id, correct_option_frame_id')
      .eq('id', draft.case_plan_id)
      .single();

    if (casePlan) {
      transferRuleText = casePlan.transfer_rule_text;
      confusionSetId = casePlan.target_confusion_set_id;
      correctOptionFrameId = casePlan.correct_option_frame_id;
    }
  }

  // Normalize field names: choice_* → option_* for study UI compatibility
  const normalizedQuestion = {
    id: draft.id,
    vignette: draft.vignette,
    stem: draft.stem,
    option_a: draft.choice_a,
    option_b: draft.choice_b,
    option_c: draft.choice_c,
    option_d: draft.choice_d,
    option_e: draft.choice_e,
    correct_answer: draft.correct_answer,
    why_correct: draft.why_correct,
    why_wrong_a: draft.why_wrong_a,
    why_wrong_b: draft.why_wrong_b,
    why_wrong_c: draft.why_wrong_c,
    why_wrong_d: draft.why_wrong_d,
    why_wrong_e: draft.why_wrong_e,
    high_yield_pearl: draft.high_yield_pearl,
    reasoning_pathway: draft.reasoning_pathway,
    decision_hinge: draft.decision_hinge,
    error_map: errorMap,
    transfer_rule_text: transferRuleText,
    // Contrast loop metadata — client sends these back on next attempt
    confusion_set_id: confusionSetId,
    correct_option_frame_id: correctOptionFrameId,
  };

  return NextResponse.json({
    questionType: 'item_draft',
    question: normalizedQuestion,
    strategy: selection.strategy,
  });
}
