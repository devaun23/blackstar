import { createAdminClient } from '@/lib/supabase/admin';
import {
  rubricOutputSchema,
  RUBRIC_VERSION,
  RUBRIC_CRITERIA,
  type RubricOutput,
} from '@/lib/factory/schemas/rubric-score';
import type { AgentContext, AgentOutput } from '@/lib/types/factory';
import type { ItemDraftRow, AlgorithmCardRow } from '@/lib/types/database';
import { runAgent } from '../agent-helpers';

// Multi-criterion rubric scorer.
//
// Runs post-pipeline on items that have passed the binary validator gate.
// Produces 1-5 scaled scores across 8 criteria plus an overall mean. Separate
// from validators because it writes richer output (per-criterion rationale,
// overall, flagged) to its own table item_rubric_score.
//
// Use cases:
//   - Rank items for human review (score low -> review first)
//   - Detect calibration drift: track overall_score over time within a topic
//   - Identify weak dimensions (e.g., items passing validators but consistently
//     scoring 2 on distractor_plausibility -> distractor generation needs work)
//   - Ground-truth for future fine-tuning

interface RubricScorerInput {
  draft: ItemDraftRow;
  card: AlgorithmCardRow;
  model?: string;
}

function computeOverall(sub: RubricOutput['sub_scores']): number {
  const values = RUBRIC_CRITERIA.map((k) => sub[k].score);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.round(mean * 100) / 100;
}

export async function run(
  context: AgentContext,
  input: RubricScorerInput,
): Promise<AgentOutput<RubricOutput & { rubricRowId: string }>> {
  const { draft, card, model } = input;

  const result = await runAgent({
    agentType: 'rubric_scorer',
    context,
    input: {
      rubric_version: RUBRIC_VERSION,
      draft,
      card,
    },
    outputSchema: rubricOutputSchema,
    ...(model ? { model } : {}),
    buildUserMessage: (vars) => ({
      rubric_version: vars.rubric_version,
      item_draft: JSON.stringify(vars.draft, null, 2),
      algorithm_card: JSON.stringify(vars.card, null, 2),
    }),
  });

  if (!result.success) {
    return {
      success: false,
      data: null as unknown as RubricOutput & { rubricRowId: string },
      tokensUsed: result.tokensUsed,
      error: result.error,
    };
  }

  // Recompute overall + flagged from sub_scores so the stored values are canonical
  // even if the model drifted a bit on them.
  const canonicalOverall = computeOverall(result.data.sub_scores);
  const anyLow = RUBRIC_CRITERIA.some((k) => result.data.sub_scores[k].score <= 2);
  const canonical: RubricOutput = {
    ...result.data,
    overall_score: canonicalOverall,
    flagged: anyLow,
  };

  const supabase = createAdminClient();
  const { data: inserted, error } = await supabase
    .from('item_rubric_score')
    .insert({
      item_draft_id: draft.id,
      rubric_version: canonical.rubric_version,
      overall_score: canonical.overall_score,
      sub_scores: canonical.sub_scores as unknown as Record<string, unknown>,
      flagged: canonical.flagged,
      scorer_model: model ?? 'default',
      scorer_tokens: result.tokensUsed,
      raw_output: canonical as unknown as Record<string, unknown>,
    })
    .select('id')
    .single();

  if (error || !inserted) {
    return {
      success: false,
      data: null as unknown as RubricOutput & { rubricRowId: string },
      tokensUsed: result.tokensUsed,
      error: `Failed to insert item_rubric_score: ${error?.message}`,
    };
  }

  return {
    success: true,
    data: { ...canonical, rubricRowId: inserted.id },
    tokensUsed: result.tokensUsed,
  };
}
