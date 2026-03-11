import { z } from 'zod';

export const shelfEnum = z.enum([
  'medicine', 'surgery', 'pediatrics', 'obgyn', 'psychiatry', 'family_medicine', 'neurology', 'emergency_medicine',
]);

export const taskTypeEnum = z.enum([
  'next_step', 'diagnostic_test', 'diagnosis', 'stabilization', 'risk_identification', 'complication_recognition',
]);

export const clinicalSettingEnum = z.enum(['outpatient', 'inpatient', 'ed', 'icu']);
export const ageGroupEnum = z.enum(['neonate', 'infant', 'child', 'adolescent', 'young_adult', 'middle_aged', 'elderly']);
export const timeHorizonEnum = z.enum(['immediate', 'hours', 'days', 'weeks', 'chronic']);
export const yieldTierEnum = z.enum(['tier_1', 'tier_2', 'tier_3']);

export const blueprintNodeSchema = z.object({
  shelf: shelfEnum,
  system: z.string().min(1),
  topic: z.string().min(1),
  subtopic: z.string().nullable().optional(),
  task_type: taskTypeEnum,
  clinical_setting: clinicalSettingEnum,
  age_group: ageGroupEnum,
  time_horizon: timeHorizonEnum,
  yield_tier: yieldTierEnum,
  frequency_score: z.number().min(0).max(100).nullable().optional(),
  discrimination_score: z.number().min(0).max(1).nullable().optional(),
});

// Used by Blueprint Selector agent output
export const blueprintSelectorOutputSchema = z.object({
  blueprint_node_id: z.string().uuid(),
  rationale: z.string().min(1),
});

export type BlueprintNodeInput = z.infer<typeof blueprintNodeSchema>;
export type BlueprintSelectorOutput = z.infer<typeof blueprintSelectorOutputSchema>;
