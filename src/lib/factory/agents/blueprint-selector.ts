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

  // ── Diversity-Enforced Candidate Selection ──
  // Instead of ORDER BY published_count (which ties when all are 0 and
  // returns insertion-order bias), we enforce one candidate per system.
  // This guarantees Claude picks from a diverse slate of organ systems.

  // Step 1: Fetch ALL nodes (or shelf-filtered) with minimal data
  let allQuery = supabase
    .from('blueprint_node')
    .select('id, shelf, system, topic, subtopic, task_type, clinical_setting, age_group, time_horizon, yield_tier, frequency_score, published_count, last_used_at');

  if (input.shelf) {
    allQuery = allQuery.eq('shelf', input.shelf);
  }

  const { data: allNodes, error } = await allQuery;

  if (error || !allNodes || allNodes.length === 0) {
    return {
      success: false,
      data: null as unknown as BlueprintSelectorOutput,
      tokensUsed: 0,
      error: error?.message ?? 'No blueprint nodes found',
    };
  }

  // Step 2: Pick one candidate per system (least-published, random tiebreak)
  // Group by system → within each system, deduplicate by topic → pick lowest published_count
  const systemBuckets = new Map<string, typeof allNodes>();
  for (const node of allNodes) {
    const bucket = systemBuckets.get(node.system) ?? [];
    bucket.push(node);
    systemBuckets.set(node.system, bucket);
  }

  const candidates: typeof allNodes = [];
  for (const [, nodes] of systemBuckets) {
    // Deduplicate by topic — keep only the least-published node per topic
    const topicBest = new Map<string, (typeof nodes)[0]>();
    for (const node of nodes) {
      const existing = topicBest.get(node.topic);
      if (!existing || node.published_count < existing.published_count) {
        topicBest.set(node.topic, node);
      }
    }

    // From the topic-deduped set, pick the one with lowest published_count
    // Random tiebreak among ties (shuffle before sort)
    const deduped = [...topicBest.values()];
    // Fisher-Yates shuffle for random tiebreaking
    for (let i = deduped.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deduped[i], deduped[j]] = [deduped[j], deduped[i]];
    }
    deduped.sort((a, b) => a.published_count - b.published_count);

    if (deduped.length > 0) {
      candidates.push(deduped[0]);
    }
  }

  // Step 3: If we have more than 10 systems, trim to 10 (least-published first, random tiebreak)
  // Shuffle for random tie-breaking, then sort by published_count
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  candidates.sort((a, b) => a.published_count - b.published_count);
  const finalCandidates = candidates.slice(0, 10);

  const candidatesSummary = (finalCandidates as BlueprintNodeRow[])
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
