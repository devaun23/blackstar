// Runs the CCV adversarial eval set.
//
// Usage:
//   tsx scripts/run-ccv-eval.ts              # Layer 1 only (alias matcher, offline)
//   tsx scripts/run-ccv-eval.ts --stem       # Print Layer 2 cases for manual review
//
// Layer 1 (alias matcher) is pure code — it runs offline in milliseconds and is the
// right place to assert before every registry change.
//
// Layer 2 (stem triggers) requires a running CCV + Claude. This script prints the
// cases in a human-reviewable format; wiring it to a live CCV end-to-end is a
// follow-up once the pipeline is green on the happy path.

import {
  runAliasMatcherEval,
  stemTriggerEvalSet,
} from '@/lib/factory/__tests__/ccv-eval-set';

function printLayer1(): { passed: number; failed: number } {
  console.log('\n━━━ Layer 1: Alias-matcher eval ━━━\n');
  const results = runAliasMatcherEval();
  let passed = 0;
  let failed = 0;
  for (const r of results) {
    const mark = r.passed ? '✓' : '✗';
    console.log(`${mark} ${r.label}`);
    if (!r.passed) {
      console.log(`    expected: [${r.expected.join(', ')}]`);
      console.log(`    actual:   [${r.actual.join(', ')}]`);
      console.log(`    note:     ${r.rationale}`);
      failed++;
    } else {
      passed++;
    }
  }
  console.log(`\nLayer 1 summary: ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}

function printLayer2(): void {
  console.log('\n━━━ Layer 2: Stem-trigger eval set (manual review) ━━━');
  console.log(`${stemTriggerEvalSet.length} cases. To wire this up end-to-end, run each through`);
  console.log('the contraindication-validator and compare against `expected`.\n');
  const byCategory = {
    true_positive: stemTriggerEvalSet.filter((c) => c.category === 'true_positive'),
    true_negative: stemTriggerEvalSet.filter((c) => c.category === 'true_negative'),
    edge_case: stemTriggerEvalSet.filter((c) => c.category === 'edge_case'),
  };
  for (const [cat, cases] of Object.entries(byCategory)) {
    console.log(`  ${cat}: ${cases.length} cases`);
    for (const c of cases) {
      console.log(`    - ${c.label}`);
    }
  }
  console.log();
}

async function main(): Promise<void> {
  const showStem = process.argv.includes('--stem');
  const { failed } = printLayer1();
  if (showStem) printLayer2();
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('Eval runner crashed:', err);
  process.exit(2);
});
