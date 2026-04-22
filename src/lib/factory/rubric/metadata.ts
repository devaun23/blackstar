// Assemble RubricMetadata from existing item_draft + case_plan + blueprint_node
// + confusion_sets + error_taxonomy rows. Populates the 15 required-metadata
// fields from BLACKSTAR_MASTER_RUBRIC.md §Required metadata so the rubric
// evaluator can emit a complete score_object.

import type {
  ItemDraftRow,
  CasePlanRow,
  BlueprintNodeRow,
  ConfusionSetRow,
  YieldTier,
} from '@/lib/types/database';
import type {
  MasterRubricMetadata,
} from '@/lib/factory/schemas/master-rubric';

export interface MetadataAssemblyInput {
  draft: ItemDraftRow;
  casePlan: CasePlanRow | null;
  node: BlueprintNodeRow | null;
  confusionSet: ConfusionSetRow | null;
  /** error_name strings resolved from case_plan.target_cognitive_error_id + any secondary. */
  cognitiveErrorNames: string[];
  /** Optional hints from case_plan — nullable for pre-v27 items. */
  nextItemIfPass?: string | null;
  nextItemIfFail?: string | null;
}

// ─── Enum mappers: case_plan enums → rubric-schema enums ────────────────────

function mapHingeDepth(depth: string | null | undefined): 'early' | 'middle' | 'late' | 'buried_late' {
  switch (depth) {
    case 'surface': return 'early';
    case 'moderate': return 'middle';
    case 'deep': return 'late';
    default: return 'middle';
  }
}

function mapDifficultyTarget(
  dc: string | null | undefined,
): 'easy' | 'medium' | 'hard' | 'nbme_hard' {
  switch (dc) {
    case 'easy_recognition': return 'easy';
    case 'decision_fork': return 'medium';
    case 'hard_discrimination': return 'hard';
    default: return 'medium';
  }
}

function mapUserStage(
  tier: YieldTier | null | undefined,
): 'novice' | 'intermediate' | 'advanced' {
  switch (tier) {
    case 'tier_1': return 'novice';
    case 'tier_2': return 'intermediate';
    case 'tier_3': return 'advanced';
    default: return 'intermediate';
  }
}

// ─── Main assembler ────────────────────────────────────────────────────────

export function assembleMetadata(input: MetadataAssemblyInput): MasterRubricMetadata {
  const { draft, casePlan, node, confusionSet, cognitiveErrorNames } = input;

  // Blueprint node composite — matches the rubric's §Required metadata description.
  const blueprintNode = node
    ? [node.topic, node.subtopic, node.task_type].filter(Boolean).join(' / ')
    : 'unknown';

  // Concepts tested: prefer case_plan.reasoning_steps; fallback to topic.
  const concepts: string[] = casePlan?.reasoning_steps?.length
    ? casePlan.reasoning_steps.map((s) => s.what_student_must_recognize)
    : node?.topic ? [node.topic] : ['unspecified'];

  // Confusion set names from the linked confusion_sets row.
  const confusionConditions = Array.isArray(confusionSet?.conditions)
    ? (confusionSet.conditions as string[])
    : [];

  const tags = [
    node?.shelf,
    node?.system,
    node?.task_type,
    casePlan?.decision_fork_type,
  ].filter((x): x is string => !!x);

  return {
    shelf: node?.shelf ?? 'unknown',
    system: node?.system ?? 'unknown',
    blueprint_node: blueprintNode,
    concepts_tested: concepts.length > 0 ? concepts : ['unspecified'],
    cognitive_operation: casePlan?.cognitive_operation_type ?? 'unspecified',
    transfer_rule_text: casePlan?.transfer_rule_text ?? '',
    hinge_clue: casePlan?.final_decisive_clue ?? '',
    hinge_depth_target: mapHingeDepth(casePlan?.hinge_depth_target),
    confusion_set: confusionConditions.length > 0 ? confusionConditions : ['unspecified'],
    cognitive_error_targets: cognitiveErrorNames.length > 0 ? cognitiveErrorNames : ['unspecified'],
    difficulty_target: mapDifficultyTarget(casePlan?.difficulty_class),
    intended_user_stage: mapUserStage(node?.yield_tier),
    explanation_goal: casePlan?.explanation_teaching_goal ?? '',
    tags,
    next_item_if_fail: input.nextItemIfFail ?? null,
    next_item_if_pass: input.nextItemIfPass ?? null,
  };

  void draft; // Currently unused — reserved for future metadata derivation.
}
