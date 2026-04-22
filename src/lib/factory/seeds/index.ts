export { blueprintNodes } from './blueprint-nodes';
export { errorTaxonomy } from './error-taxonomy';
export type { ErrorTaxonomySeed } from './error-taxonomy';
export { sourceRegistry } from './source-registry';
export type { SourceRegistrySeed } from './source-registry';
export { agentPrompts } from './agent-prompts';
export type { AgentPromptSeed } from './agent-prompts';
export { contentSystems, systemToCodeMap } from './content-systems';
export type { ContentSystemSeed } from './content-systems';
export { contentCompetencies } from './content-competencies';
export type { ContentCompetencySeed } from './content-competencies';
export { contentDisciplines } from './content-disciplines';
export type { ContentDisciplineSeed } from './content-disciplines';
export { contentTopics } from './content-topics';
export type { ContentTopicSeed } from './content-topics';

// v7 reasoning ontology seeds
export { hingeClueTypes } from './hinge-clue-types';
export type { HingeClueTypeSeed } from './hinge-clue-types';
export { actionClasses } from './action-classes';
export type { ActionClassSeed } from './action-classes';
export { alternateTerminology } from './alternate-terminology';
export type { AlternateTerminologySeed } from './alternate-terminology';
export { patternFamilies } from './pattern-families';
export type { PatternFamilySeed } from './pattern-families';

// Content graph seeds (confusion sets, transfer rules)
export { confusionSets } from './confusion-sets';
export type { ConfusionSetSeed } from './confusion-sets';
export { transferRules } from './transfer-rules';
export type { TransferRuleSeed } from './transfer-rules';

// v25 CCV — contraindication registry (safety gate)
export { contraindicationSeeds } from './contraindications';
export type { ContraindicationSeed, ContraindicationEntry } from './contraindications';

// Exam structure metadata (format, timing, scoring)
export { STEP2CK_EXAM_STRUCTURE } from './exam-structure';
export type { ExamStructureMetadata, QuestionFormat } from './exam-structure';

// Exam content specs — spec-layer metadata for Medicine expansion
export {
  MEDICINE_NODES,
  MEDICINE_FUNNELS,
  computeFrequencyScore,
  generateNodeId,
  resetNodeCounters,
  CARDIOLOGY_DEFAULTS,
  GI_DEFAULTS,
  HEPATOLOGY_DEFAULTS,
  ENDOCRINE_DEFAULTS,
  PULM_DEFAULTS,
  NEPH_DEFAULTS,
  HEME_DEFAULTS,
  ID_DEFAULTS,
  RHEUM_DEFAULTS,
  LYTE_DEFAULTS,
  NEURO_DEFAULTS,
  PREV_DEFAULTS,
  DERM_DEFAULTS,
  TOX_DEFAULTS,
  CRIT_DEFAULTS,
} from './exam-content-specs';
export type {
  MedicineNodeSpec,
  SubsystemDefaults,
  PresentationFunnel,
  NegativeSpace,
} from './exam-content-specs';
