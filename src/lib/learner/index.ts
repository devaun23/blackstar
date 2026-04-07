export { getLearnerProfile, getWeakestDimensions, updateAfterAttempt } from './model';
export { computeNextReview } from './scheduler';
export { selectNextQuestion } from './selector';
export { diagnoseRepairAction, getErrorRepeatCount } from './repair-engine';
export type { RepairContext, RepairDecision } from './repair-engine';
export type {
  DimensionMastery,
  LearnerProfile,
  SelectionStrategy,
  AttemptDiagnosis,
} from './types';
