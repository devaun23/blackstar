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
  let errorTaxonomyRows: { id: string; error_name: string; explanation_template: string }[] = [];
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
        rendered_text?: string | null;
      }>;

      // Build frame→letter mapping: use frame.id (A-E) as the key,
      // but verify consistency by checking rendered_text against actual choices
      const choiceByLetter: Record<string, string> = {
        A: draft.choice_a, B: draft.choice_b, C: draft.choice_c,
        D: draft.choice_d, E: draft.choice_e,
      };

      // If rendered_text is populated, verify frame positions match rendered choices.
      // If they don't, build a corrected mapping from rendered_text → actual letter.
      let frameIdToLetter: Record<string, string> = {};
      let positionMismatch = false;

      for (const frame of frames) {
        if (frame.rendered_text && choiceByLetter[frame.id]) {
          // Normalize for comparison (trim whitespace)
          const rendered = frame.rendered_text.trim().toLowerCase();
          const actual = choiceByLetter[frame.id].trim().toLowerCase();
          if (!actual.startsWith(rendered.slice(0, 20)) && !rendered.startsWith(actual.slice(0, 20))) {
            positionMismatch = true;
          }
        }
        // Default: frame.id maps to itself (frame A → letter A)
        frameIdToLetter[frame.id] = frame.id;
      }

      // If mismatch detected, try to remap by matching rendered_text to actual choices
      if (positionMismatch) {
        console.warn(`[study/next] Frame position mismatch for draft ${draft.id} — remapping by content`);
        frameIdToLetter = {};
        for (const frame of frames) {
          if (frame.rendered_text) {
            const rendered = frame.rendered_text.trim().toLowerCase();
            for (const [letter, choiceText] of Object.entries(choiceByLetter)) {
              const actual = choiceText.trim().toLowerCase();
              if (actual.startsWith(rendered.slice(0, 30)) || rendered.startsWith(actual.slice(0, 30))) {
                frameIdToLetter[frame.id] = letter;
                break;
              }
            }
          }
          // Fallback: identity mapping
          if (!frameIdToLetter[frame.id]) {
            frameIdToLetter[frame.id] = frame.id;
          }
        }
      }

      // Fetch error names for distractor cognitive_error_ids
      const errorIds = frames
        .map((f) => f.cognitive_error_id)
        .filter((id): id is string => id !== null);

      if (errorIds.length > 0) {
        const { data: errors } = await supabase
          .from('error_taxonomy')
          .select('id, error_name, explanation_template')
          .in('id', errorIds);

        errorTaxonomyRows = (errors ?? []).map((e) => ({
          id: e.id,
          error_name: e.error_name,
          explanation_template: e.explanation_template,
        }));
        const errorNameMap = new Map(
          errorTaxonomyRows.map((e) => [e.id, e.error_name])
        );

        // Map error to the ACTUAL rendered letter position
        for (const frame of frames) {
          if (frame.cognitive_error_id) {
            const actualLetter = frameIdToLetter[frame.id] ?? frame.id;
            errorMap[actualLetter] = {
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

  // Build rich explanation from all available structured data
  const richExplanation = normalizeItemDraftExplanation({
    draft,
    transferRuleText,
    errorMap,
    errorTaxonomyRows,
  });

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
    error_map: errorMap,
    transfer_rule_text: transferRuleText,
    // Flat fields kept for backward compat
    explanation_decision: draft.why_correct,
    explanation_options: [
      draft.why_wrong_a && `A: ${draft.why_wrong_a}`,
      draft.why_wrong_b && `B: ${draft.why_wrong_b}`,
      draft.why_wrong_c && `C: ${draft.why_wrong_c}`,
      draft.why_wrong_d && `D: ${draft.why_wrong_d}`,
      draft.why_wrong_e && `E: ${draft.why_wrong_e}`,
    ].filter(Boolean).join('\n'),
    explanation_summary: draft.high_yield_pearl ?? '',
    system_topic: '',
    error_bucket: '',
    difficulty: '',
    // Rich explanation payload
    richExplanation,
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
