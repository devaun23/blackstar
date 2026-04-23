import { NextResponse } from 'next/server';
import { createAdminClient, verifyAdminKey } from '@/lib/supabase/admin';
import type { MasterDomainScores, MasterRubricScore, PublishDecision } from '@/lib/factory/schemas/master-rubric';

// Keep in sync with masterDomainScoresSchema in
// src/lib/factory/schemas/master-rubric.ts. Used to compute
// weakest_domain as the domain with lowest (score / max) ratio.
const DOMAIN_MAX: Record<keyof MasterDomainScores, number> = {
  medical_correctness_scope: 15,
  blueprint_alignment: 8,
  nbme_stem_fidelity: 12,
  hinge_design_ambiguity: 10,
  option_set_quality_symmetry: 12,
  key_integrity: 5,
  explanation_quality: 15,
  learner_modeling_value: 8,
  adaptive_sequencing_utility: 5,
  production_readiness: 10,
};

function weakestDomain(scores: MasterDomainScores): keyof MasterDomainScores {
  let worst: keyof MasterDomainScores = 'medical_correctness_scope';
  let worstRatio = Infinity;
  for (const key of Object.keys(DOMAIN_MAX) as Array<keyof MasterDomainScores>) {
    const ratio = scores[key] / DOMAIN_MAX[key];
    if (ratio < worstRatio) {
      worstRatio = ratio;
      worst = key;
    }
  }
  return worst;
}

/**
 * GET /api/admin/review-queue
 *
 * Returns item drafts awaiting human review, with validator scores
 * and case plan metadata. Physician review gate (P2 — 3.21 min/question).
 *
 * Query params:
 *   - status: filter by review_status (default: pending_review)
 *   - system: filter by blueprint system
 *   - sort: 'created' (default) | 'rubric' — rubric sorts hard-gate fails first,
 *     then lowest total_score ascending; items lacking a rubric_score row sort last.
 *   - limit: max items (default: 50)
 *   - offset: pagination offset (default: 0)
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('x-admin-key');
  if (!verifyAdminKey(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get('status') ?? 'pending_review';
  const system = url.searchParams.get('system');
  const sort = url.searchParams.get('sort') ?? 'created';
  const limit = parseInt(url.searchParams.get('limit') ?? '50', 10);
  const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);

  const supabase = createAdminClient();

  // Fetch drafts with review status.
  // Sort=rubric applies its ordering AFTER we join rubric_score below —
  // the DB-level order stays created_at so pagination remains stable even
  // for items lacking rubric rows.
  const query = supabase
    .from('item_draft')
    .select(`
      id, stem, vignette, choice_a, choice_b, choice_c, choice_d, choice_e,
      correct_answer, why_correct, why_wrong_a, why_wrong_b, why_wrong_c, why_wrong_d, why_wrong_e,
      high_yield_pearl, status, review_status, review_notes, reviewed_at,
      explanation_decision_logic, explanation_hinge_id, explanation_error_diagnosis,
      explanation_transfer_rule, explanation_teaching_pearl,
      case_plan_id, question_skeleton_id, blueprint_node_id,
      created_at, repair_count
    `)
    .eq('review_status', status)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);

  const { data: drafts, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch validator scores for each draft
  const draftIds = (drafts ?? []).map((d) => d.id);
  const { data: reports } = await supabase
    .from('validator_report')
    .select('item_draft_id, validator_type, passed, score, issues_found')
    .in('item_draft_id', draftIds.length > 0 ? draftIds : ['__none__']);

  // Group reports by draft ID (keep latest per validator type)
  const reportsByDraft = new Map<string, Record<string, { passed: boolean; score: number | null; issues: string[] }>>();
  for (const r of reports ?? []) {
    if (!reportsByDraft.has(r.item_draft_id)) {
      reportsByDraft.set(r.item_draft_id, {});
    }
    reportsByDraft.get(r.item_draft_id)![r.validator_type] = {
      passed: r.passed,
      score: r.score,
      issues: r.issues_found ?? [],
    };
  }

  // Fetch blueprint nodes for system/topic info
  const nodeIds = [...new Set((drafts ?? []).map((d) => d.blueprint_node_id).filter(Boolean))];
  const { data: nodes } = await supabase
    .from('blueprint_node')
    .select('id, topic, system, shelf')
    .in('id', nodeIds.length > 0 ? nodeIds : ['__none__']);

  const nodeMap = new Map((nodes ?? []).map((n) => [n.id, n]));

  // Fetch Master Rubric scores (master_v1). One item can have multiple rows
  // across re-runs; keep the most recent per item.
  const { data: rubricRows } = await supabase
    .from('rubric_score')
    .select('item_draft_id, rubric_version, hard_gate_pass, total_score, publish_decision, score_object, created_at')
    .eq('rubric_version', 'master_v1')
    .in('item_draft_id', draftIds.length > 0 ? draftIds : ['__none__'])
    .order('created_at', { ascending: false });

  interface RubricSummary {
    total_score: number;
    publish_decision: PublishDecision;
    hard_gate_pass: boolean;
    weakest_domain: keyof MasterDomainScores | null;
  }
  const rubricByDraft = new Map<string, RubricSummary>();
  for (const r of (rubricRows ?? []) as Array<{
    item_draft_id: string;
    hard_gate_pass: boolean;
    total_score: number;
    publish_decision: PublishDecision;
    score_object: MasterRubricScore | null;
  }>) {
    if (rubricByDraft.has(r.item_draft_id)) continue;  // keep first (newest due to order)
    const scores = r.score_object?.scores;
    rubricByDraft.set(r.item_draft_id, {
      total_score: r.total_score,
      publish_decision: r.publish_decision,
      hard_gate_pass: r.hard_gate_pass,
      weakest_domain: scores ? weakestDomain(scores) : null,
    });
  }

  // Build response
  const items = (drafts ?? []).map((d) => {
    const node = nodeMap.get(d.blueprint_node_id);
    const rubric = rubricByDraft.get(d.id) ?? null;
    return {
      ...d,
      topic: node?.topic ?? 'unknown',
      system: node?.system ?? 'unknown',
      shelf: node?.shelf ?? 'unknown',
      validator_scores: reportsByDraft.get(d.id) ?? {},
      rubric_total_score: rubric?.total_score ?? null,
      rubric_publish_decision: rubric?.publish_decision ?? null,
      rubric_hard_gate_pass: rubric?.hard_gate_pass ?? null,
      rubric_weakest_domain: rubric?.weakest_domain ?? null,
    };
  });

  // Filter by system if requested
  const filtered = system
    ? items.filter((i) => i.system === system)
    : items;

  // sort=rubric: hard-gate fails first (worst first), then ascending total_score.
  // Items without any rubric row sort last so the review queue surfaces the
  // items that have signal, not legacy items predating v26.
  if (sort === 'rubric') {
    filtered.sort((a, b) => {
      const aHas = a.rubric_total_score !== null;
      const bHas = b.rubric_total_score !== null;
      if (aHas !== bHas) return aHas ? -1 : 1;
      if (!aHas) return 0;
      const aGate = a.rubric_hard_gate_pass === false ? 0 : 1;  // false = worse = first
      const bGate = b.rubric_hard_gate_pass === false ? 0 : 1;
      if (aGate !== bGate) return aGate - bGate;
      return (a.rubric_total_score ?? 0) - (b.rubric_total_score ?? 0);
    });
  }

  return NextResponse.json({
    items: filtered,
    total: filtered.length,
    offset,
    limit,
    sort,
  });
}
