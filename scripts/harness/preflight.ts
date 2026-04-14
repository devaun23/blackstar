/**
 * Schema preflight check — verifies that critical ontology tables are
 * populated before a batch generation run.
 *
 * Without these tables, the case planner generates questions without
 * the ontology that makes Blackstar's contrast loop and error-mapped
 * distractors work. Supabase returns { data: [], error: null } for
 * empty tables, so this failure mode is silent without an explicit check.
 */

import { createClient } from '@supabase/supabase-js';

interface TableCheck {
  table: string;
  description: string;
  minRows: number;
}

const CRITICAL_TABLES: TableCheck[] = [
  { table: 'confusion_sets', description: 'Confusion set pairs for contrast loop', minRows: 1 },
  { table: 'transfer_rules', description: 'Transfer rules for generalization testing', minRows: 1 },
  { table: 'error_taxonomy', description: 'Cognitive error taxonomy for distractor mapping', minRows: 5 },
  { table: 'hinge_clue_type', description: 'Hinge clue types for decision hinge design', minRows: 3 },
  { table: 'action_class', description: 'Action classes for option homogeneity', minRows: 3 },
  { table: 'blueprint_node', description: 'Blueprint nodes for question generation', minRows: 10 },
  { table: 'agent_prompt', description: 'Agent prompts for pipeline agents', minRows: 10 },
];

export interface PreflightResult {
  passed: boolean;
  checks: {
    table: string;
    description: string;
    expected: number;
    actual: number;
    passed: boolean;
  }[];
}

export async function runPreflightCheck(): Promise<PreflightResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const checks = await Promise.all(
    CRITICAL_TABLES.map(async ({ table, description, minRows }) => {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        return {
          table,
          description,
          expected: minRows,
          actual: -1,
          passed: false,
          error: error.message,
        };
      }

      const actual = count ?? 0;
      return {
        table,
        description,
        expected: minRows,
        actual,
        passed: actual >= minRows,
      };
    })
  );

  return {
    passed: checks.every((c) => c.passed),
    checks,
  };
}

/**
 * Run preflight and print results. Throws if any check fails.
 */
export async function assertPreflight(): Promise<void> {
  console.log('\n  Preflight: checking ontology tables...');

  const result = await runPreflightCheck();

  for (const check of result.checks) {
    const icon = check.passed ? '  +' : '  !';
    console.log(
      `${icon} ${check.table}: ${check.actual} rows (need >= ${check.expected}) — ${check.description}`
    );
  }

  if (!result.passed) {
    const failed = result.checks.filter((c) => !c.passed);
    throw new Error(
      `Preflight FAILED: ${failed.length} table(s) missing data: ${failed.map((c) => c.table).join(', ')}.\n` +
      `Run the seed endpoint (POST /api/factory/seed) to populate ontology tables.`
    );
  }

  console.log('  Preflight: all checks passed.\n');
}
