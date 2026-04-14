import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/admin/review-queue
 *
 * Returns item drafts awaiting human review, with validator scores
 * and case plan metadata. Physician review gate (P2 — 3.21 min/question).
 *
 * Query params:
 *   - status: filter by review_status (default: pending_review)
 *   - system: filter by blueprint system
 *   - limit: max items (default: 50)
 *   - offset: pagination offset (default: 0)
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('x-admin-key');
  if (authHeader !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get('status') ?? 'pending_review';
  const system = url.searchParams.get('system');
  const limit = parseInt(url.searchParams.get('limit') ?? '50', 10);
  const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);

  const supabase = createAdminClient();

  // Fetch drafts with review status
  let query = supabase
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

  const { data: drafts, error, count } = await query;

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

  // Build response
  const items = (drafts ?? []).map((d) => {
    const node = nodeMap.get(d.blueprint_node_id);
    return {
      ...d,
      topic: node?.topic ?? 'unknown',
      system: node?.system ?? 'unknown',
      shelf: node?.shelf ?? 'unknown',
      validator_scores: reportsByDraft.get(d.id) ?? {},
    };
  });

  // Filter by system if requested
  const filtered = system
    ? items.filter((i) => i.system === system)
    : items;

  return NextResponse.json({
    items: filtered,
    total: filtered.length,
    offset,
    limit,
  });
}
