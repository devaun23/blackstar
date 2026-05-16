/**
 * Blueprint coverage report.
 *
 * Builds the system × task_type × age_group × yield_tier matrix and reports
 * per-cell coverage of published items against per-tier targets.
 *
 * Targets:
 *   tier_1 → 3 published items per cell (high-yield rules need alt presentations)
 *   tier_2 → 2 published items per cell
 *   tier_3 → 1 published item per cell
 *
 * This is the scope-discipline dashboard: if cardiology has 50 nodes seeded
 * and 18 published while ethics_communication has 0 nodes seeded, the bank
 * is structurally biased — we want to see that before generating more items.
 *
 * READ-ONLY. Produces CSV at pilot/blueprint-coverage-{date}.csv + TTY table.
 */

import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^=]+)=(.+)$/);
  if (m) process.env[m[1]!] = m[2]!;
}

const TIER_TARGETS: Record<string, number> = {
  tier_1: 3,
  tier_2: 2,
  tier_3: 1,
};

interface NodeRow {
  id: string;
  shelf: string;
  system: string;
  task_type: string;
  age_group: string;
  yield_tier: string;
  topic: string;
}

interface DraftRow {
  id: string;
  status: string;
  blueprint_node_id: string;
}

interface Cell {
  shelf: string;
  system: string;
  task_type: string;
  age_group: string;
  yield_tier: string;
  nodes_seeded: number;
  items_published: number;
  target: number;
}

const ANSI = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
};

function cellKey(n: { shelf: string; system: string; task_type: string; age_group: string; yield_tier: string }): string {
  return `${n.shelf}|${n.system}|${n.task_type}|${n.age_group}|${n.yield_tier}`;
}

function highlight(s: string, status: 'critical' | 'under' | 'met' | 'over'): string {
  if (status === 'critical') return `${ANSI.red}${ANSI.bold}${s}${ANSI.reset}`;
  if (status === 'under') return `${ANSI.yellow}${s}${ANSI.reset}`;
  if (status === 'met') return `${ANSI.green}${s}${ANSI.reset}`;
  return `${ANSI.dim}${s}${ANSI.reset}`;
}

function statusFor(items: number, target: number, nodesSeeded: number): 'critical' | 'under' | 'met' | 'over' {
  if (nodesSeeded === 0) return 'critical'; // can't generate without a node
  if (items === 0 && target > 0) return 'critical';
  if (items < target) return 'under';
  if (items === target) return 'met';
  return 'over';
}

async function main(): Promise<void> {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const argv = process.argv.slice(2);
  const shelfFilter = argv.find((a) => a.startsWith('--shelf='))?.split('=')[1];
  const onlyGaps = argv.includes('--gaps-only');
  const noCsv = argv.includes('--no-csv');

  let nodeQuery = supabase
    .from('blueprint_node')
    .select('id, shelf, system, task_type, age_group, yield_tier, topic');
  if (shelfFilter) nodeQuery = nodeQuery.eq('shelf', shelfFilter);

  const { data: nodes, error: nErr } = await nodeQuery;
  if (nErr) throw new Error(`blueprint_node read: ${nErr.message}`);
  const nodeRows = (nodes ?? []) as NodeRow[];

  const { data: drafts, error: dErr } = await supabase
    .from('item_draft')
    .select('id, status, blueprint_node_id')
    .eq('status', 'published');
  if (dErr) throw new Error(`item_draft read: ${dErr.message}`);
  const draftRows = (drafts ?? []) as DraftRow[];

  // Index drafts by blueprint_node_id
  const itemsByNode = new Map<string, number>();
  for (const d of draftRows) {
    itemsByNode.set(d.blueprint_node_id, (itemsByNode.get(d.blueprint_node_id) ?? 0) + 1);
  }

  // Aggregate into cells
  const cells = new Map<string, Cell>();
  for (const n of nodeRows) {
    const k = cellKey(n);
    const existing = cells.get(k);
    const items = itemsByNode.get(n.id) ?? 0;
    if (existing) {
      existing.nodes_seeded += 1;
      existing.items_published += items;
    } else {
      cells.set(k, {
        shelf: n.shelf,
        system: n.system,
        task_type: n.task_type,
        age_group: n.age_group,
        yield_tier: n.yield_tier,
        nodes_seeded: 1,
        items_published: items,
        target: TIER_TARGETS[n.yield_tier] ?? 1,
      });
    }
  }

  // Items pointing to a node we filtered out (or that don't aggregate by cell)
  // — count them as "orphans" so the totals line up.
  const allNodeIds = new Set(nodeRows.map((n) => n.id));
  const orphanItems = draftRows.filter((d) => !allNodeIds.has(d.blueprint_node_id)).length;

  const cellArr = [...cells.values()].sort((a, b) => {
    const gapA = a.target - a.items_published;
    const gapB = b.target - b.items_published;
    if (gapA !== gapB) return gapB - gapA;
    if (a.system !== b.system) return a.system.localeCompare(b.system);
    if (a.task_type !== b.task_type) return a.task_type.localeCompare(b.task_type);
    return a.age_group.localeCompare(b.age_group);
  });

  const printable = onlyGaps
    ? cellArr.filter((c) => c.items_published < c.target)
    : cellArr;

  // ─── TTY summary ───
  console.log(`\n${ANSI.bold}━━━ Blueprint coverage report ━━━${ANSI.reset}`);
  console.log(`${ANSI.dim}generated ${new Date().toISOString()}${ANSI.reset}`);
  console.log(`Shelf filter: ${shelfFilter ?? '(all shelves)'}`);
  console.log(`Nodes seeded:    ${nodeRows.length}`);
  console.log(`Items published: ${draftRows.length} (orphans w/o cell match: ${orphanItems})`);
  console.log(`Cells: ${cellArr.length} (under target: ${cellArr.filter((c) => c.items_published < c.target).length})\n`);

  // ─── Per-tier rollup ───
  console.log(`${ANSI.bold}Per-tier rollup${ANSI.reset}`);
  for (const tier of ['tier_1', 'tier_2', 'tier_3'] as const) {
    const t = cellArr.filter((c) => c.yield_tier === tier);
    if (t.length === 0) continue;
    const met = t.filter((c) => c.items_published >= c.target).length;
    const target = TIER_TARGETS[tier];
    console.log(
      `  ${tier.padEnd(8)} target=${target}/cell  cells=${t.length.toString().padStart(3)}  met=${met}  under=${t.length - met}`,
    );
  }
  console.log();

  // ─── Per-system rollup ───
  const systems = [...new Set(cellArr.map((c) => c.system))].sort();
  console.log(`${ANSI.bold}Per-system rollup${ANSI.reset}`);
  console.log(`  ${'system'.padEnd(28)} nodes  pub  cells  under`);
  for (const s of systems) {
    const sys = cellArr.filter((c) => c.system === s);
    const nodes = sys.reduce((acc, c) => acc + c.nodes_seeded, 0);
    const pub = sys.reduce((acc, c) => acc + c.items_published, 0);
    const under = sys.filter((c) => c.items_published < c.target).length;
    const sBar = under === sys.length ? highlight(s.padEnd(28), 'critical') : s.padEnd(28);
    console.log(
      `  ${sBar} ${String(nodes).padStart(5)}  ${String(pub).padStart(3)}  ${String(sys.length).padStart(5)}  ${String(under).padStart(5)}`,
    );
  }
  console.log();

  // ─── Per-cell detail ───
  console.log(`${ANSI.bold}Cell detail${onlyGaps ? ' (gaps only)' : ''}${ANSI.reset}`);
  console.log(
    `  ${'system'.padEnd(28)} ${'task_type'.padEnd(22)} ${'age_group'.padEnd(14)} tier  seed  pub  tgt  gap`,
  );
  for (const c of printable) {
    const gap = c.target - c.items_published;
    const st = statusFor(c.items_published, c.target, c.nodes_seeded);
    const line =
      `  ${c.system.padEnd(28)} ${c.task_type.padEnd(22)} ${c.age_group.padEnd(14)} ` +
      `${c.yield_tier.replace('tier_', 't').padEnd(4)}  ${String(c.nodes_seeded).padStart(4)}  ` +
      `${String(c.items_published).padStart(3)}  ${String(c.target).padStart(3)}  ${String(gap).padStart(3)}`;
    console.log(highlight(line, st));
  }
  console.log();

  // ─── CSV write ───
  if (!noCsv) {
    const today = new Date().toISOString().slice(0, 10);
    const csvPath = path.resolve(__dirname, `../pilot/blueprint-coverage-${today}.csv`);
    const header = 'shelf,system,task_type,age_group,yield_tier,nodes_seeded,items_published,target,gap,status\n';
    const rows = cellArr
      .map((c) => {
        const gap = c.target - c.items_published;
        const st = statusFor(c.items_published, c.target, c.nodes_seeded);
        return [
          c.shelf, c.system, c.task_type, c.age_group, c.yield_tier,
          c.nodes_seeded, c.items_published, c.target, gap, st,
        ].join(',');
      })
      .join('\n');
    fs.writeFileSync(csvPath, header + rows + '\n');
    console.log(`${ANSI.dim}wrote CSV: ${csvPath}${ANSI.reset}\n`);
  }

  // ─── Recommendation ───
  console.log(`${ANSI.bold}Recommendation${ANSI.reset}`);
  const criticalCells = cellArr.filter((c) => statusFor(c.items_published, c.target, c.nodes_seeded) === 'critical');
  const undercoveredSystems = systems.filter((s) => {
    const sys = cellArr.filter((c) => c.system === s);
    return sys.every((c) => c.items_published < c.target);
  });

  if (undercoveredSystems.length > 0) {
    console.log(
      `  ${ANSI.red}Systems with ZERO published items in any cell:${ANSI.reset} ${undercoveredSystems.join(', ')}`,
    );
    console.log(`  → Either seed these systems (likely) or generate items in existing cells.`);
  }
  if (criticalCells.length > 0) {
    console.log(`  ${criticalCells.length} cells are critical (0 nodes seeded OR 0 published despite target > 0).`);
  }
  if (criticalCells.length === 0 && undercoveredSystems.length === 0) {
    console.log(`  ${ANSI.green}All cells at or above target. Ready to broaden to next shelf.${ANSI.reset}`);
  }
}

main().catch((err) => {
  console.error('coverage report crashed:', err);
  process.exit(2);
});
