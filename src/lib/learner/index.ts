export { getLearnerProfile, getWeakestDimensions, updateAfterAttempt } from './model';
export { computeNextReview } from './scheduler';
export { selectNextQuestion } from './selector';
export { diagnoseRepairAction, getErrorRepeatCount } from './repair-engine';
export type { RepairContext, RepairDecision } from './repair-engine';
export { diagnoseGapProfile } from './gap-diagnosis';
export type { GapDiagnosis, GapBreakdown } from './gap-diagnosis';
export { analyzeTimingPatterns, getTimingFeedback } from './timing-analysis';
export type { TimingAnalysis, TimingBracket } from './timing-analysis';
export type {
  DimensionMastery,
  LearnerProfile,
  SelectionStrategy,
  AttemptDiagnosis,
} from './types';
export {
  getActionPolicy,
  getSelectionPolicy,
  RuleActionPolicy,
  RuleSelectionPolicy,
} from './policy';
export type {
  ActionPolicy,
  ActionPolicyContext,
  ActionPolicyDecision,
  SelectionPolicy,
  SelectionPolicyContext,
  SelectionPolicyDecision,
  ExperimentContext,
} from './policy';
