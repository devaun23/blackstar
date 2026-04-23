// Regression test for the policy layer.
//
// Pins the observable behavior of RuleActionPolicy against a curated set of
// 10 fixture contexts covering the six branches of the existing decision tree.
// Run before and after any refactor of repair-engine or the policy layer; the
// test must pass both times to prove no behavior change.
//
// Usage: npx tsx src/lib/learner/__tests__/policy-regression.ts
// Exits non-zero on any mismatch so CI can catch regressions if/when wired up.

import { diagnoseRepairAction, type RepairContext } from '../repair-engine';
import { RuleActionPolicy } from '../policy/rule-action-policy';

interface Fixture {
  name: string;
  ctx: RepairContext;
  expectedAction: string;
  expectedTarget: string | null;
}

const fixtures: Fixture[] = [
  {
    name: 'correct + confident + fast → advance',
    ctx: {
      userId: 'u', isCorrect: true, timeSpentMs: 20_000, confidencePre: 5,
      diagnosedCognitiveErrorId: null, diagnosedHingeMiss: false,
      diagnosedActionClassConfusion: false, errorRepeatCount: 0,
      dimensionMastery: 0.5, confusionSetId: null, lastCorrectOptionFrameId: null,
    },
    expectedAction: 'advance',
    expectedTarget: null,
  },
  {
    name: 'correct + slow → reinforce',
    ctx: {
      userId: 'u', isCorrect: true, timeSpentMs: 120_000, confidencePre: 3,
      diagnosedCognitiveErrorId: null, diagnosedHingeMiss: false,
      diagnosedActionClassConfusion: false, errorRepeatCount: 0,
      dimensionMastery: 0.5, confusionSetId: null, lastCorrectOptionFrameId: null,
    },
    expectedAction: 'reinforce',
    expectedTarget: null,
  },
  {
    name: 'correct + uncertain → reinforce',
    ctx: {
      userId: 'u', isCorrect: true, timeSpentMs: 45_000, confidencePre: 2,
      diagnosedCognitiveErrorId: null, diagnosedHingeMiss: false,
      diagnosedActionClassConfusion: false, errorRepeatCount: 0,
      dimensionMastery: 0.5, confusionSetId: null, lastCorrectOptionFrameId: null,
    },
    expectedAction: 'reinforce',
    expectedTarget: null,
  },
  {
    name: 'wrong + confusion set → contrast',
    ctx: {
      userId: 'u', isCorrect: false, timeSpentMs: 60_000, confidencePre: 3,
      diagnosedCognitiveErrorId: 'err1', diagnosedHingeMiss: false,
      diagnosedActionClassConfusion: false, errorRepeatCount: 1,
      dimensionMastery: 0.4, confusionSetId: 'cs1', lastCorrectOptionFrameId: null,
    },
    expectedAction: 'contrast',
    expectedTarget: 'confusion_set',
  },
  {
    name: 'wrong + 3x repeat cognitive error → remediate (pre-empts contrast)',
    ctx: {
      userId: 'u', isCorrect: false, timeSpentMs: 60_000, confidencePre: 3,
      diagnosedCognitiveErrorId: 'err1', diagnosedHingeMiss: false,
      diagnosedActionClassConfusion: false, errorRepeatCount: 3,
      dimensionMastery: 0.4, confusionSetId: 'cs1', lastCorrectOptionFrameId: null,
    },
    expectedAction: 'remediate',
    expectedTarget: 'cognitive_error',
  },
  {
    name: 'wrong + high mastery → transfer_test',
    ctx: {
      userId: 'u', isCorrect: false, timeSpentMs: 60_000, confidencePre: 4,
      diagnosedCognitiveErrorId: null, diagnosedHingeMiss: false,
      diagnosedActionClassConfusion: false, errorRepeatCount: 0,
      dimensionMastery: 0.85, confusionSetId: null, lastCorrectOptionFrameId: null,
    },
    expectedAction: 'transfer_test',
    expectedTarget: null,
  },
  {
    name: 'wrong + cognitive error (no confusion set) → remediate',
    ctx: {
      userId: 'u', isCorrect: false, timeSpentMs: 60_000, confidencePre: 3,
      diagnosedCognitiveErrorId: 'err2', diagnosedHingeMiss: false,
      diagnosedActionClassConfusion: false, errorRepeatCount: 1,
      dimensionMastery: 0.3, confusionSetId: null, lastCorrectOptionFrameId: null,
    },
    expectedAction: 'remediate',
    expectedTarget: 'cognitive_error',
  },
  {
    name: 'wrong + hinge miss only → reinforce',
    ctx: {
      userId: 'u', isCorrect: false, timeSpentMs: 60_000, confidencePre: 3,
      diagnosedCognitiveErrorId: null, diagnosedHingeMiss: true,
      diagnosedActionClassConfusion: false, errorRepeatCount: 0,
      dimensionMastery: 0.4, confusionSetId: null, lastCorrectOptionFrameId: null,
    },
    expectedAction: 'reinforce',
    expectedTarget: null,
  },
  {
    // Palmerton tie-breaker (Priority 6) sits below Priority 4 (cognitive error
    // → remediate). When both are present, Priority 4 wins. This fixture pins
    // that ordering so a refactor can't silently re-route it.
    name: 'wrong + cognitive error + palmerton noise → remediate (priority 4 wins)',
    ctx: {
      userId: 'u', isCorrect: false, timeSpentMs: 60_000, confidencePre: 3,
      diagnosedCognitiveErrorId: 'err3', diagnosedHingeMiss: false,
      diagnosedActionClassConfusion: false, errorRepeatCount: 1,
      dimensionMastery: 0.3, confusionSetId: null, lastCorrectOptionFrameId: null,
      palmertonGapType: 'noise',
    },
    expectedAction: 'remediate',
    expectedTarget: 'cognitive_error',
  },
  {
    name: 'wrong + no diagnosis → remediate (default)',
    ctx: {
      userId: 'u', isCorrect: false, timeSpentMs: 60_000, confidencePre: 3,
      diagnosedCognitiveErrorId: null, diagnosedHingeMiss: false,
      diagnosedActionClassConfusion: false, errorRepeatCount: 0,
      dimensionMastery: 0.3, confusionSetId: null, lastCorrectOptionFrameId: null,
    },
    expectedAction: 'remediate',
    expectedTarget: null,
  },
];

async function main() {
  const policy = new RuleActionPolicy();
  let failed = 0;

  for (const fx of fixtures) {
    const direct = diagnoseRepairAction(fx.ctx);
    const viaPolicy = await policy.choose(fx.ctx);

    const expectedOk =
      direct.action === fx.expectedAction &&
      direct.targetDimensionType === fx.expectedTarget;

    const policyAgreesWithDirect =
      direct.action === viaPolicy.action &&
      direct.targetDimensionType === viaPolicy.targetDimensionType &&
      direct.targetDimensionId === viaPolicy.targetDimensionId &&
      direct.reason === viaPolicy.reason;

    if (expectedOk && policyAgreesWithDirect && viaPolicy.policyName === 'rule_action_v1') {
      console.log(`✓ ${fx.name}`);
    } else {
      failed++;
      console.log(`✗ ${fx.name}`);
      console.log(`    direct:     action=${direct.action} target=${direct.targetDimensionType} targetId=${direct.targetDimensionId}`);
      console.log(`    via policy: action=${viaPolicy.action} target=${viaPolicy.targetDimensionType} targetId=${viaPolicy.targetDimensionId} name=${viaPolicy.policyName}`);
      console.log(`    expected:   action=${fx.expectedAction} target=${fx.expectedTarget}`);
    }
  }

  if (failed > 0) {
    console.log(`\n${failed}/${fixtures.length} FAILED`);
    process.exit(1);
  }
  console.log(`\n${fixtures.length}/${fixtures.length} passed`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
