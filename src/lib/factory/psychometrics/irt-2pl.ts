// 2-parameter logistic (2PL) IRT estimator.
//
// Model:
//   P(correct | theta, a, b) = sigmoid(a * (theta - b))
// where
//   theta = person ability (logits, prior ~ N(0, 1))
//   a     = item discrimination (higher = more informative)
//   b     = item difficulty (logits; same scale as theta)
//
// Intended use: batch fit across (responses, users, items) once response data
// crosses the threshold in MEASUREMENT_SCIENCE_ROADMAP.md §2 Phase B
// (~500 responses per item). Phase A (this file + the synthetic-data test)
// is buildable now and validates the estimator before learner data exists.
//
// Pure functions. No DB coupling. Caller provides response tuples and gets
// back fitted params + standard errors. Activation path documented in
// the roadmap; this module deliberately does not touch Supabase.

export interface Response {
  userIdx: number;
  itemIdx: number;
  correct: 0 | 1;
}

export interface ItemParams {
  a: number;  // discrimination
  b: number;  // difficulty
}

export interface FitResult {
  thetas: number[];          // by userIdx
  items: ItemParams[];       // by itemIdx
  thetaSE: number[];         // standard error of theta (Fisher information)
  iterations: number;
  converged: boolean;
}

export interface FitOptions {
  maxIterations?: number;
  tolerance?: number;
  priorThetaMean?: number;   // MAP prior mean on theta
  priorThetaVar?: number;    // MAP prior variance on theta
  priorBMean?: number;       // prior mean on b
  priorBVar?: number;        // prior variance on b
  priorAMean?: number;       // prior mean on log(a)  — a is log-normal
  priorAVar?: number;
}

const DEFAULTS: Required<FitOptions> = {
  maxIterations: 30,
  tolerance: 1e-4,
  priorThetaMean: 0,
  priorThetaVar: 1,
  priorBMean: 0,
  priorBVar: 4,         // wide — we want data to drive difficulty
  priorAMean: 0,        // log(1) = 0
  priorAVar: 1,
};

function sigmoid(x: number): number {
  if (x >= 0) {
    const z = Math.exp(-x);
    return 1 / (1 + z);
  }
  const z = Math.exp(x);
  return z / (1 + z);
}

// Parameter bounds. Far outside these ranges the likelihood is effectively
// flat (|a*(θ-b)| > 20 saturates the sigmoid), so clamping is lossless for
// real-data regimes and prevents Newton divergence on pathological iterations.
const THETA_MIN = -4;
const THETA_MAX = 4;
const B_MIN = -5;
const B_MAX = 5;
const LOG_A_MIN = -2;   // a ≥ 0.135
const LOG_A_MAX = 2;    // a ≤ 7.39
const MAX_STEP = 1.0;   // damp any Newton step larger than this to stabilize

function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x;
}

function damped(step: number): number {
  if (step > MAX_STEP) return MAX_STEP;
  if (step < -MAX_STEP) return -MAX_STEP;
  return step;
}

// ─── Per-user theta update given fixed item params ───
// Used both inside the JMLE loop and as the online-update primitive callers
// will invoke at serve time once calibration is active.
export function updateTheta(
  priorTheta: number,
  priorVar: number,
  itemResponses: Array<{ correct: 0 | 1; a: number; b: number }>,
  maxIterations = 20,
  tolerance = 1e-5,
): { theta: number; se: number } {
  let theta = priorTheta;
  for (let iter = 0; iter < maxIterations; iter++) {
    // Gradient of log-posterior wrt theta
    let grad = -(theta - priorTheta) / priorVar;
    let hess = -1 / priorVar;
    for (const r of itemResponses) {
      const p = sigmoid(r.a * (theta - r.b));
      grad += r.a * (r.correct - p);
      hess -= r.a * r.a * p * (1 - p);
    }
    if (Math.abs(hess) < 1e-10) break;
    const step = damped(grad / hess);
    theta = clamp(theta - step, THETA_MIN, THETA_MAX);
    if (Math.abs(step) < tolerance) break;
  }
  // SE from Fisher information (observed, negated hessian)
  let fisher = 1 / priorVar;
  for (const r of itemResponses) {
    const p = sigmoid(r.a * (theta - r.b));
    fisher += r.a * r.a * p * (1 - p);
  }
  return { theta, se: 1 / Math.sqrt(fisher) };
}

// ─── Per-item (a, b) update given fixed thetas ───
// Alternating Newton on (b, log a) — log a is natural parameterization so a
// stays positive. Priors keep it stable when an item has few responses.
function updateItem(
  current: ItemParams,
  itemResponses: Array<{ correct: 0 | 1; theta: number }>,
  opts: Required<FitOptions>,
): ItemParams {
  let b = current.b;
  let logA = Math.log(Math.max(current.a, 1e-3));

  for (let iter = 0; iter < 10; iter++) {
    const a = Math.exp(logA);
    let dB = -(b - opts.priorBMean) / opts.priorBVar;
    let ddB = -1 / opts.priorBVar;
    let dLogA = -(logA - opts.priorAMean) / opts.priorAVar;
    let ddLogA = -1 / opts.priorAVar;
    for (const r of itemResponses) {
      const diff = r.theta - b;
      const p = sigmoid(a * diff);
      const pq = p * (1 - p);
      const resid = r.correct - p;
      dB += -a * resid;
      ddB += -a * a * pq;
      dLogA += a * diff * resid;
      ddLogA += -(a * diff) * (a * diff) * pq + a * diff * resid;
    }
    // Guard against near-singular Hessian blocks.
    if (Math.abs(ddB) < 1e-10 || Math.abs(ddLogA) < 1e-10) break;
    // Damp + clamp: diagonal Newton without damping can diverge far from
    // optimum (we saw b → -1500 in synthetic data). Damped step stabilizes
    // the iterations; clamping keeps params inside the regime where the 2PL
    // likelihood is identifiable.
    const stepB = damped(dB / ddB);
    const stepA = damped(dLogA / ddLogA);
    b = clamp(b - stepB, B_MIN, B_MAX);
    logA = clamp(logA - stepA, LOG_A_MIN, LOG_A_MAX);
    if (Math.abs(stepB) < 1e-5 && Math.abs(stepA) < 1e-5) break;
  }

  return { a: Math.exp(logA), b };
}

// ─── Batch JMLE fit ───
// Alternates theta update (per user) and item update (per item) until convergence.
// Reasonable for N users × M items × K responses up to mid-thousands.
export function fit2PL(
  numUsers: number,
  numItems: number,
  responses: Response[],
  options: FitOptions = {},
): FitResult {
  const opts: Required<FitOptions> = { ...DEFAULTS, ...options };

  const thetas: number[] = new Array(numUsers).fill(opts.priorThetaMean);
  const items: ItemParams[] = new Array(numItems).fill(0).map(() => ({ a: 1, b: 0 }));

  const userResponses: Response[][] = Array.from({ length: numUsers }, () => []);
  const itemResponses: Response[][] = Array.from({ length: numItems }, () => []);
  for (const r of responses) {
    userResponses[r.userIdx].push(r);
    itemResponses[r.itemIdx].push(r);
  }

  let iter = 0;
  let maxDelta = Infinity;
  for (; iter < opts.maxIterations && maxDelta > opts.tolerance; iter++) {
    maxDelta = 0;

    // Theta step
    for (let u = 0; u < numUsers; u++) {
      const prev = thetas[u];
      const input = userResponses[u].map(r => ({
        correct: r.correct,
        a: items[r.itemIdx].a,
        b: items[r.itemIdx].b,
      }));
      const { theta } = updateTheta(opts.priorThetaMean, opts.priorThetaVar, input, 5, 1e-4);
      thetas[u] = theta;
      maxDelta = Math.max(maxDelta, Math.abs(theta - prev));
    }

    // Resolve identifiability after each theta-step. 2PL likelihood is invariant
    // under θ → k*θ + c, a → a/k, b → k*b + c. We fix the gauge by forcing
    // theta to mean 0 and sd 1 each iteration, propagating the transform to
    // (a, b). Without this, the estimator drifts toward a compressed-theta /
    // inflated-a regime that hits a-clamps and loses correlation with truth.
    const meanTheta = thetas.reduce((s, t) => s + t, 0) / numUsers;
    let ss = 0;
    for (let u = 0; u < numUsers; u++) ss += (thetas[u] - meanTheta) ** 2;
    const sdTheta = Math.sqrt(ss / Math.max(1, numUsers - 1));
    const k = sdTheta > 1e-6 ? sdTheta : 1;
    const c = meanTheta;
    for (let u = 0; u < numUsers; u++) thetas[u] = (thetas[u] - c) / k;
    for (let i = 0; i < numItems; i++) {
      items[i].b = (items[i].b - c) / k;
      items[i].a = items[i].a * k;
    }

    // Item step
    for (let i = 0; i < numItems; i++) {
      const prev = items[i];
      const input = itemResponses[i].map(r => ({
        correct: r.correct,
        theta: thetas[r.userIdx],
      }));
      const next = updateItem(prev, input, opts);
      maxDelta = Math.max(maxDelta, Math.abs(next.a - prev.a), Math.abs(next.b - prev.b));
      items[i] = next;
    }
  }

  // Final theta SEs with converged item params
  const thetaSE: number[] = new Array(numUsers).fill(1);
  for (let u = 0; u < numUsers; u++) {
    const input = userResponses[u].map(r => ({
      correct: r.correct,
      a: items[r.itemIdx].a,
      b: items[r.itemIdx].b,
    }));
    const { se } = updateTheta(opts.priorThetaMean, opts.priorThetaVar, input);
    thetaSE[u] = se;
  }

  return {
    thetas,
    items,
    thetaSE,
    iterations: iter,
    converged: maxDelta <= opts.tolerance,
  };
}

// ─── Fisher information at theta for an item ───
// Used by the information-theoretic selector once Phase B activates (roadmap §7).
export function fisherInformation(theta: number, a: number, b: number): number {
  const p = sigmoid(a * (theta - b));
  return a * a * p * (1 - p);
}
