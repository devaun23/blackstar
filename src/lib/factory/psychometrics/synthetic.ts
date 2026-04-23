// Synthetic-data generator for validating the 2PL IRT estimator.
//
// Generates ground-truth (θ, a, b) from plausible priors, simulates a response
// matrix with realistic missingness (not every user sees every item), and
// exposes helpers to measure estimator recovery.
//
// Recovery metrics:
//   - Pearson correlation (true vs estimated) — should be > 0.85 for theta and b
//     at moderate sample size (200 users × 50 items, 40% response rate).
//   - Root mean square error (RMSE) on θ and b — should be < 0.4 logits.
//   - Spearman correlation on a — discrimination is the hardest to recover, we
//     accept lower r ~ 0.6-0.8.
//
// These thresholds are calibrated from the generator defaults below; tighten if
// sample size grows or the estimator improves.

import type { Response } from './irt-2pl';

export interface TruthParams {
  theta: number[];
  a: number[];
  b: number[];
}

export interface SyntheticDataset {
  truth: TruthParams;
  responses: Response[];
  numUsers: number;
  numItems: number;
  responseRate: number;  // fraction of user x item cells that were observed
}

interface GenerateOptions {
  numUsers: number;
  numItems: number;
  responseRate?: number;      // probability of observing each (user, item) cell
  seed?: number;
  thetaSd?: number;           // true theta ~ N(0, thetaSd²)
  aMedian?: number;           // true a ~ Lognormal around aMedian
  aLogSd?: number;
  bSd?: number;               // true b ~ N(0, bSd²)
}

// Small deterministic RNG (mulberry32). We need reproducibility in CI tests
// more than we need cryptographic quality.
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// Box-Muller transform for standard normal samples.
function gauss(rng: () => number): number {
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function sigmoid(x: number): number {
  if (x >= 0) return 1 / (1 + Math.exp(-x));
  const z = Math.exp(x);
  return z / (1 + z);
}

export function generateDataset(opts: GenerateOptions): SyntheticDataset {
  const {
    numUsers,
    numItems,
    responseRate = 0.4,
    seed = 42,
    thetaSd = 1.0,
    aMedian = 1.0,
    aLogSd = 0.4,
    bSd = 1.2,
  } = opts;
  const rng = mulberry32(seed);

  const theta: number[] = [];
  for (let u = 0; u < numUsers; u++) theta.push(gauss(rng) * thetaSd);

  const a: number[] = [];
  const b: number[] = [];
  for (let i = 0; i < numItems; i++) {
    a.push(aMedian * Math.exp(gauss(rng) * aLogSd));
    b.push(gauss(rng) * bSd);
  }

  const responses: Response[] = [];
  let observed = 0;
  for (let u = 0; u < numUsers; u++) {
    for (let i = 0; i < numItems; i++) {
      if (rng() >= responseRate) continue;
      observed++;
      const p = sigmoid(a[i]! * (theta[u]! - b[i]!));
      const correct = (rng() < p ? 1 : 0) as 0 | 1;
      responses.push({ userIdx: u, itemIdx: i, correct });
    }
  }

  return {
    truth: { theta, a, b },
    responses,
    numUsers,
    numItems,
    responseRate: observed / (numUsers * numItems),
  };
}

// ─── Metrics ───

export function pearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return NaN;
  const n = x.length;
  let sx = 0, sy = 0;
  for (let i = 0; i < n; i++) { sx += x[i]!; sy += y[i]!; }
  const mx = sx / n, my = sy / n;
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i]! - mx;
    const dy = y[i]! - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }
  const denom = Math.sqrt(dx2 * dy2);
  return denom > 0 ? num / denom : NaN;
}

export function rmse(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return NaN;
  let s = 0;
  for (let i = 0; i < x.length; i++) {
    const d = x[i]! - y[i]!;
    s += d * d;
  }
  return Math.sqrt(s / x.length);
}

// Scale-invariant RMSE: rescale y to match x's standard deviation (and center
// to match mean) before measuring. This is the right metric for 2PL where the
// parameter scale is a gauge degree of freedom — RMSE of raw values confounds
// "recovery quality" with "how the estimator landed on the unidentifiable scale."
export function rmseScaled(truth: number[], est: number[]): number {
  if (truth.length !== est.length || truth.length === 0) return NaN;
  const mean = (arr: number[]): number => arr.reduce((s, v) => s + v, 0) / arr.length;
  const sd = (arr: number[], m: number): number =>
    Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / Math.max(1, arr.length - 1));
  const mT = mean(truth);
  const sdT = sd(truth, mT);
  const mE = mean(est);
  const sdE = sd(est, mE);
  if (sdE < 1e-6) return NaN;
  const k = sdT / sdE;
  let s = 0;
  for (let i = 0; i < truth.length; i++) {
    const eNorm = k * (est[i]! - mE) + mT;
    const d = truth[i]! - eNorm;
    s += d * d;
  }
  return Math.sqrt(s / truth.length);
}

// ─── Post-hoc alignment ───
// The estimator is scale/location-invariant (any (θ, a, b) and (k*θ+c, a/k, k*b+c)
// give the same likelihood). To fairly compare recovery to ground truth, we first
// affine-transform the estimated theta to match the ground-truth mean and SD,
// then propagate the same transform to (a, b).

export function alignToTruth(
  trueTheta: number[],
  estTheta: number[],
  estA: number[],
  estB: number[],
): { theta: number[]; a: number[]; b: number[] } {
  const mean = (arr: number[]): number => arr.reduce((s, v) => s + v, 0) / arr.length;
  const sd = (arr: number[], m: number): number =>
    Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / Math.max(1, arr.length - 1));
  const mTrue = mean(trueTheta);
  const sdTrue = sd(trueTheta, mTrue);
  const mEst = mean(estTheta);
  const sdEst = sd(estTheta, mEst);
  if (sdEst < 1e-6) return { theta: estTheta, a: estA, b: estB };
  const k = sdTrue / sdEst;
  const c = mTrue - k * mEst;
  const theta = estTheta.map((t) => k * t + c);
  const a = estA.map((aa) => aa / k);
  const b = estB.map((bb) => k * bb + c);
  return { theta, a, b };
}
