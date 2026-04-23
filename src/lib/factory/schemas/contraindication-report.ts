import { z } from 'zod';
import { validatorReportSchema } from './validator-report';

// CCV (Contraindication Cross-Check Validator) output schema.
//
// Extends validatorReportSchema so the core {passed, score, issues_found,
// repair_instructions, failure_category} fields slot into the existing
// validator_report table columns. The CCV-specific fields are stored in
// raw_output (JSONB) and consumed by the pipeline's routing logic.
//
// trigger_found semantics:
//   'yes'     -> at least one stem detail triggers a listed/inferred contraindication
//   'no'      -> stem is clean; keyed answer is safe
//   'unknown' -> keyed answer looks like a pharmacologic/procedural intervention but
//                no registry entry matched. Route to needs_human_review because the
//                registry is the source of severity classification and we can't route
//                without it.

export const contraindicationSeverityEnum = z.enum(['absolute', 'relative', 'unknown']);
export const contraindicationSourceEnum = z.enum(['registry', 'card_contraindications', 'llm_inferred']);
export const contraindicationConfidenceEnum = z.enum(['high', 'medium', 'low']);
export const triggerFoundEnum = z.enum(['yes', 'no', 'unknown']);

export const contraindicationTriggerSchema = z.object({
  stem_detail: z.string().describe('Exact phrase from the stem that triggered the match.'),
  contraindication_id: z.string().nullable().describe('Registry entry id, or null if LLM-inferred.'),
  contraindication_text: z.string().describe('Human-readable contraindication description.'),
  source: contraindicationSourceEnum,
  severity: contraindicationSeverityEnum,
  confidence: contraindicationConfidenceEnum,
});

export const contraindicationReportSchema = validatorReportSchema.extend({
  trigger_found: triggerFoundEnum,
  matched_intervention_id: z.string().nullable().describe(
    'intervention_id from the registry that matched the keyed answer text, or null if no match.',
  ),
  keyed_answer_option: z.enum(['A', 'B', 'C', 'D', 'E']),
  triggers: z.array(contraindicationTriggerSchema),
});

export type ContraindicationTrigger = z.infer<typeof contraindicationTriggerSchema>;
export type ContraindicationReportInput = z.infer<typeof contraindicationReportSchema>;
