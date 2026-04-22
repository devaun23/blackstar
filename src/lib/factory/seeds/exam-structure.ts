/**
 * USMLE Step 2 CK Exam Structure Metadata (Jan 2026)
 * Static reference data consumed by agents during question generation.
 * Source: AMBOSS Step 2 CK description (Jan 2026); USMLE Content Outline
 *
 * Not stored in DB — this is a TypeScript constant imported at prompt-build time
 * so agents understand exam format constraints (timing, question types, option ranges).
 */

export interface QuestionFormat {
  name: string;
  description: string;
  frequency: 'most_common' | 'occasional' | 'rare';
  questions_per_vignette?: number;
}

export interface ExamStructureMetadata {
  exam_name: string;
  outline_version: string;
  total_questions_max: number;
  blocks: number;
  block_duration_minutes: number;
  questions_per_block_max: number;
  seconds_per_question: number;
  break_time_minutes: number;
  question_formats: QuestionFormat[];
  options_range: { min: number; max: number };
  media_types: string[];
  passing_score: { score: number; effective_date: string };
  score_distribution: { mean: number; sd: number; period: string };
}

export const STEP2CK_EXAM_STRUCTURE: ExamStructureMetadata = {
  exam_name: 'USMLE Step 2 CK',
  outline_version: 'Jan 2026',
  total_questions_max: 318,
  blocks: 8,
  block_duration_minutes: 60,
  questions_per_block_max: 40,
  seconds_per_question: 90,
  break_time_minutes: 45,
  question_formats: [
    {
      name: 'Single-item',
      description:
        'Most common format. Clinical vignette + question + 3-26 lettered options ' +
        'in alphabetical or logical order. One best answer (other options may be partially correct). ' +
        'May include image, audio, or video findings, plus graphic or tabular material.',
      frequency: 'most_common',
      questions_per_vignette: 1,
    },
    {
      name: 'Sequential item set',
      description:
        'Clinical vignette with 2-3 associated multiple-choice questions. ' +
        'Each question has one best answer. Questions must be answered in sequential order.',
      frequency: 'occasional',
      questions_per_vignette: 3,
    },
    {
      name: 'Abstract format',
      description:
        'Summary of an experiment or clinical investigation presented as a medical journal abstract ' +
        'with 2 multiple-choice questions. Focus on interpretation of medical literature: ' +
        'biostatistics, epidemiology, diagnostic studies, pharmacotherapy, clinical intervention. ' +
        'Typically 1-2 per exam.',
      frequency: 'rare',
      questions_per_vignette: 2,
    },
    {
      name: 'Patient chart format',
      description:
        'Stem resembles a patient note (SOAP format). Introduced since 2021. ' +
        'Same breadth of topics and answering approach as classic clinical vignettes.',
      frequency: 'occasional',
      questions_per_vignette: 1,
    },
  ],
  options_range: { min: 3, max: 26 },
  media_types: ['image', 'audio', 'video', 'graphic', 'table'],
  passing_score: { score: 218, effective_date: '2025-07-01' },
  score_distribution: { mean: 250, sd: 15, period: '2024-2025' },
};
