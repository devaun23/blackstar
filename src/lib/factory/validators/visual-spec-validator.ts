import { visualSpecSchema } from '@/lib/factory/schemas/visual-specs';
import type { VisualSpec } from '@/lib/factory/schemas/visual-specs';

export interface VisualValidationError {
  specIndex: number;
  code: string;
  message: string;
}

interface ValidationContext {
  correct_answer?: string;
  why_correct?: string;
  source_display_ids?: string[];
}

/**
 * Deterministic visual spec validator — no AI call.
 * Returns an array of errors. Empty array = all specs valid.
 */
export function validateVisualSpecs(
  specs: unknown[],
  context?: ValidationContext
): VisualValidationError[] {
  const errors: VisualValidationError[] = [];

  // Global limit: max 3 specs per item
  if (specs.length > 3) {
    errors.push({
      specIndex: -1,
      code: 'MAX_SPECS_EXCEEDED',
      message: `Item has ${specs.length} visual specs, max is 3`,
    });
  }

  // Total word count across all specs
  let totalWords = 0;

  for (let i = 0; i < specs.length; i++) {
    const raw = specs[i];

    // 1. Structural: Zod parse
    const parsed = visualSpecSchema.safeParse(raw);
    if (!parsed.success) {
      errors.push({
        specIndex: i,
        code: 'SCHEMA_INVALID',
        message: `Spec ${i} failed schema validation: ${parsed.error.issues.map(iss => iss.message).join('; ')}`,
      });
      continue;
    }

    const spec = parsed.data;

    // 2. Contract checks
    if (!spec.visual_contract.teaching_goal || spec.visual_contract.teaching_goal.trim().length === 0) {
      errors.push({
        specIndex: i,
        code: 'EMPTY_TEACHING_GOAL',
        message: `Spec ${i}: visual_contract.teaching_goal is empty`,
      });
    }

    if (!spec.visual_contract.source_refs || spec.visual_contract.source_refs.length === 0) {
      errors.push({
        specIndex: i,
        code: 'MISSING_SOURCE_REFS',
        message: `Spec ${i}: visual_contract.source_refs is empty — every visual must cite sources`,
      });
    }

    // Validate source_refs against known display IDs if available
    if (context?.source_display_ids && spec.visual_contract.source_refs) {
      for (const ref of spec.visual_contract.source_refs) {
        if (!context.source_display_ids.includes(ref)) {
          errors.push({
            specIndex: i,
            code: 'INVALID_SOURCE_REF',
            message: `Spec ${i}: source_ref '${ref}' not found in active source pack`,
          });
        }
      }
    }

    // 3. Type-specific structural checks + word counting
    const specWords = countSpecWords(spec);
    totalWords += specWords;

    validateSpecByType(spec, i, context, errors);
  }

  // Total word limit: 500
  if (totalWords > 500) {
    errors.push({
      specIndex: -1,
      code: 'TOTAL_WORDS_EXCEEDED',
      message: `Total words across all specs is ${totalWords}, max is 500`,
    });
  }

  // Reasoning usefulness: spec words should be < 60% of why_correct word count
  if (context?.why_correct && totalWords > 0) {
    const explanationWords = context.why_correct.split(/\s+/).length;
    if (totalWords > explanationWords * 0.6) {
      errors.push({
        specIndex: -1,
        code: 'VISUAL_EXCEEDS_PROSE',
        message: `Visual word count (${totalWords}) exceeds 60% of explanation word count (${explanationWords})`,
      });
    }
  }

  return errors;
}

function validateSpecByType(
  spec: VisualSpec,
  index: number,
  context: ValidationContext | undefined,
  errors: VisualValidationError[]
): void {
  switch (spec.type) {
    case 'comparison_table': {
      // Equal cell counts
      const colCount = spec.columns.length;
      for (let ri = 0; ri < spec.rows.length; ri++) {
        if (spec.rows[ri].values.length !== colCount) {
          errors.push({
            specIndex: index,
            code: 'UNEQUAL_CELL_COUNT',
            message: `Spec ${index}: row ${ri} has ${spec.rows[ri].values.length} values but table has ${colCount} columns`,
          });
        }
        // Word limit per cell
        for (const val of spec.rows[ri].values) {
          if (val.split(/\s+/).length > 15) {
            errors.push({
              specIndex: index,
              code: 'CELL_TOO_LONG',
              message: `Spec ${index}: cell value exceeds 15-word limit: "${val.substring(0, 40)}..."`,
            });
          }
        }
      }
      break;
    }

    case 'severity_ladder': {
      // Exactly 1 patient marker
      const patientCount = spec.rungs.filter(r => r.isPatientHere).length;
      if (patientCount > 1) {
        errors.push({
          specIndex: index,
          code: 'MULTIPLE_PATIENT_MARKERS',
          message: `Spec ${index}: severity ladder has ${patientCount} patient markers, max is 1`,
        });
      }
      break;
    }

    case 'management_algorithm': {
      // Validate edge references
      const nodeIds = new Set(spec.nodes.map(n => n.id));
      for (const edge of spec.edges) {
        if (!nodeIds.has(edge.from)) {
          errors.push({
            specIndex: index,
            code: 'INVALID_EDGE_REF',
            message: `Spec ${index}: edge references unknown node '${edge.from}'`,
          });
        }
        if (!nodeIds.has(edge.to)) {
          errors.push({
            specIndex: index,
            code: 'INVALID_EDGE_REF',
            message: `Spec ${index}: edge references unknown node '${edge.to}'`,
          });
        }
      }
      break;
    }

    case 'timeline': {
      // No empty events
      if (spec.events.length === 0) {
        errors.push({
          specIndex: index,
          code: 'EMPTY_TIMELINE',
          message: `Spec ${index}: timeline has no events`,
        });
      }
      break;
    }

    case 'diagnostic_funnel': {
      // No empty stages
      for (let si = 0; si < spec.stages.length; si++) {
        if (spec.stages[si].items.length === 0) {
          errors.push({
            specIndex: index,
            code: 'EMPTY_FUNNEL_STAGE',
            message: `Spec ${index}: funnel stage ${si} has no items`,
          });
        }
      }
      break;
    }

    case 'distractor_breakdown': {
      // Distractors should not include the correct answer letter
      if (context?.correct_answer) {
        for (const d of spec.distractors) {
          if (d.letter === context.correct_answer) {
            errors.push({
              specIndex: index,
              code: 'DISTRACTOR_IS_CORRECT',
              message: `Spec ${index}: distractor breakdown includes correct answer letter ${d.letter}`,
            });
          }
        }
      }
      break;
    }
  }
}

function countSpecWords(spec: VisualSpec): number {
  const text = JSON.stringify(spec);
  // Rough word count from all string values
  const strings = text.match(/"[^"]*"/g) ?? [];
  let count = 0;
  for (const s of strings) {
    // Skip keys and short tokens
    const inner = s.slice(1, -1);
    if (inner.length > 2) {
      count += inner.split(/\s+/).length;
    }
  }
  return count;
}
