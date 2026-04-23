/**
 * Synthetic-recovery validation for the 2PL IRT estimator.
 *
 * Generates response data from known (θ, a, b), fits the estimator, and
 * reports how well it recovers the truth. This is the Phase A validation
 * gate — it must pass before we trust the estimator on real learner data.
 *
 * Thresholds are empirical: if recovery falls below them, either the
 * estimator has a bug or the sample regime is too small for these defaults.
 *
 * Usage:
 *   npx tsx scripts/test-irt-2pl-synthetic.ts
 */

import { fit2PL } from '../src/lib/factory/psychometrics/irt-2pl';
import {
  generateDataset,
  pearsonCorrelation,
  rmseScaled,
  alignToTruth,
} from '../src/lib/factory/psychometrics/synthetic';

interface Scenario {
  label: string;
  numUsers: number;
  numItems: number;
  responseRate: number;
  // Recovery thresholds below which the scenario counts as a regression.
  rThetaMin: number;
  rBMin: number;
  rAMin: number;
  rmseThetaMax: number;
  rmseBMax: number;
}

// Thresholds below use scale-normalized RMSE (rmseScaled), which is the right
// metric for 2PL since the raw parameter scale is a gauge choice. r(a) at
// moderate N is known to be variance-dominated, so we accept a low bar.
const SCENARIOS: Scenario[] = [
  {
    label: 'small-pilot (50 users × 30 items, 60% response rate)',
    numUsers: 50,
    numItems: 30,
    responseRate: 0.6,
    rThetaMin: 0.65,
    rBMin: 0.75,
    rAMin: 0.25,
    rmseThetaMax: 0.85,
    rmseBMax: 0.9,
  },
  {
    label: 'moderate (200 users × 50 items, 40% response rate)',
    numUsers: 200,
    numItems: 50,
    responseRate: 0.4,
    rThetaMin: 0.8,
    rBMin: 0.8,
    rAMin: 0.15,
    rmseThetaMax: 0.7,
    rmseBMax: 0.85,
  },
  {
    label: 'large (500 users × 100 items, 30% response rate)',
    numUsers: 500,
    numItems: 100,
    responseRate: 0.3,
    rThetaMin: 0.88,
    rBMin: 0.88,
    rAMin: 0.5,
    rmseThetaMax: 0.55,
    rmseBMax: 0.6,
  },
];

function runScenario(s: Scenario): { passed: boolean; line: string; details: string } {
  const start = Date.now();
  const data = generateDataset({
    numUsers: s.numUsers,
    numItems: s.numItems,
    responseRate: s.responseRate,
    seed: 1337 + s.numUsers,
  });

  const fit = fit2PL(data.numUsers, data.numItems, data.responses, {
    maxIterations: 40,
    tolerance: 1e-4,
  });

  const aligned = alignToTruth(
    data.truth.theta,
    fit.thetas,
    fit.items.map((it) => it.a),
    fit.items.map((it) => it.b),
  );

  const rTheta = pearsonCorrelation(data.truth.theta, aligned.theta);
  const rB = pearsonCorrelation(data.truth.b, aligned.b);
  const rA = pearsonCorrelation(data.truth.a, aligned.a);
  const rmseTheta = rmseScaled(data.truth.theta, aligned.theta);
  const rmseB = rmseScaled(data.truth.b, aligned.b);

  const passed =
    rTheta >= s.rThetaMin &&
    rB >= s.rBMin &&
    rA >= s.rAMin &&
    rmseTheta <= s.rmseThetaMax &&
    rmseB <= s.rmseBMax;

  const elapsed = ((Date.now() - start) / 1000).toFixed(2);
  const mark = passed ? '✓' : '✗';

  const line = `${mark} ${s.label}   r(θ)=${rTheta.toFixed(3)}  r(b)=${rB.toFixed(3)}  r(a)=${rA.toFixed(3)}  RMSE(θ)=${rmseTheta.toFixed(3)}  RMSE(b)=${rmseB.toFixed(3)}  [${fit.iterations} iter, ${elapsed}s${fit.converged ? '' : ', NOT CONVERGED'}]`;

  const details = passed
    ? ''
    : '\n' +
      `   thresholds: r(θ)≥${s.rThetaMin}, r(b)≥${s.rBMin}, r(a)≥${s.rAMin}, RMSE(θ)≤${s.rmseThetaMax}, RMSE(b)≤${s.rmseBMax}\n` +
      `   observed:   r(θ)=${rTheta.toFixed(3)}  r(b)=${rB.toFixed(3)}  r(a)=${rA.toFixed(3)}  RMSE(θ)=${rmseTheta.toFixed(3)}  RMSE(b)=${rmseB.toFixed(3)}`;

  return { passed, line, details };
}

function main(): void {
  console.log('\n━━━ 2PL IRT synthetic recovery ━━━\n');
  let failed = 0;
  for (const s of SCENARIOS) {
    const { passed, line, details } = runScenario(s);
    console.log(line);
    if (!passed) {
      console.log(details);
      failed++;
    }
  }
  console.log();
  if (failed === 0) {
    console.log('✓ All scenarios pass. Estimator is safe to run on real data once Phase B thresholds are met.');
    process.exit(0);
  } else {
    console.log(`✗ ${failed}/${SCENARIOS.length} scenarios failed.`);
    process.exit(1);
  }
}

main();
