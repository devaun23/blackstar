import { createAdminClient } from '@/lib/supabase/admin';
import { blueprintSelectorOutputSchema } from '@/lib/factory/schemas';
import type { BlueprintSelectorOutput } from '@/lib/factory/schemas';
import type { AgentContext, AgentOutput } from '@/lib/types/factory';
import type { BlueprintNodeRow, ContentSystemRow } from '@/lib/types/database';
import { runAgent } from '../agent-helpers';

interface BlueprintSelectorInput {
  shelf?: string;
  yieldTier?: string;
}

/**
 * Queries underserved blueprint nodes and asks Claude to pick the best target.
 * Enhanced with content_system weight distributions for coverage-aware selection.
 */
export async function run(
  context: AgentContext,
  input: BlueprintSelectorInput
): Promise<AgentOutput<BlueprintSelectorOutput>> {
  const supabase = createAdminClient();

  // Query content_system weights for coverage context
  const { data: systems } = await supabase
    .from('content_system')
    .select('*')
    .order('sort_order');

  // Query content_competency weights
  const { data: competencies } = await supabase
    .from('content_competency')
    .select('*')
    .order('sort_order');

  // Build weight distribution summary
  let systemWeights = 'No content system data available.';
  if (systems && systems.length > 0) {
    // Compute current coverage per system from published items
    const { data: coverageData } = await supabase
      .from('blueprint_node')
      .select('content_system_id, published_count');

    const publishedBySystem = new Map<string, number>();
    let totalPublished = 0;
    if (coverageData) {
      for (const node of coverageData) {
        if (node.content_system_id) {
          const current = publishedBySystem.get(node.content_system_id) ?? 0;
          publishedBySystem.set(node.content_system_id, current + node.published_count);
          totalPublished += node.published_count;
        }
      }
    }

    systemWeights = (systems as ContentSystemRow[])
      .map((s) => {
        const published = publishedBySystem.get(s.id) ?? 0;
        const actualPct = totalPublished > 0 ? ((published / totalPublished) * 100).toFixed(1) : '0.0';
        return `- ${s.display_name} (${s.code}): target ${s.weight_min}-${s.weight_max}%, current ${actualPct}% (${published} items)`;
      })
      .join('\n');
  }

  let competencyWeights = 'No competency data available.';
  if (competencies && competencies.length > 0) {
    competencyWeights = competencies
      .map((c: { display_name: string; code: string; weight_min: number; weight_max: number; maps_to_task_types: string[] }) =>
        `- ${c.display_name} (${c.code}): target ${c.weight_min}-${c.weight_max}%, task_types: [${c.maps_to_task_types.join(', ')}]`
      )
      .join('\n');
  }

  // Query candidate nodes, ordered by coverage gap
  let query = supabase
    .from('blueprint_node')
    .select('*')
    .order('published_count', { ascending: true })
    .order('last_used_at', { ascending: true, nullsFirst: true })
    .limit(10);

  if (input.shelf) {
    query = query.eq('shelf', input.shelf);
  }
  // yield_tier is a priority hint, not a hard gate — all tiers are eligible
  // Pass it to the agent prompt so Claude can weight higher-tier nodes
  if (input.yieldTier) {
    query = query.order('yield_tier', { ascending: true });
  }

  const { data: candidates, error } = await query;

  if (error || !candidates || candidates.length === 0) {
    return {
      success: false,
      data: null as unknown as BlueprintSelectorOutput,
      tokensUsed: 0,
      error: error?.message ?? 'No blueprint nodes found',
    };
  }

  const candidatesSummary = (candidates as BlueprintNodeRow[])
    .map((n) =>
      `- ID: ${n.id} | ${n.shelf} / ${n.system} / ${n.topic} | task: ${n.task_type} | setting: ${n.clinical_setting} | age: ${n.age_group} | tier: ${n.yield_tier} | published: ${n.published_count} | last_used: ${n.last_used_at ?? 'never'}`
    )
    .join('\n');

  return runAgent({
    agentType: 'blueprint_selector',
    context,
    input: {
      candidates: candidatesSummary,
      system_weights: systemWeights,
      competency_weights: competencyWeights,
    },
    outputSchema: blueprintSelectorOutputSchema,
    buildUserMessage: (data) => data,
  });
}
