import type { BlueprintNodeInput } from '@/lib/factory/schemas';
import { MEDICINE_NODES } from './exam-content-specs';

/**
 * Extract DB-layer fields from MedicineNodeSpec for blueprint_nodes seeding.
 * MedicineNodeSpec is the rich spec layer; BlueprintNodeInput is the DB projection.
 */
function extractBlueprintNode(spec: (typeof MEDICINE_NODES)[number]): BlueprintNodeInput {
  return {
    shelf: spec.shelf,
    system: spec.system,
    topic: spec.topic,
    subtopic: spec.subtopic ?? undefined,
    task_type: spec.task_type,
    clinical_setting: spec.clinical_setting,
    age_group: spec.age_group,
    time_horizon: spec.time_horizon,
    yield_tier: spec.yield_tier,
    frequency_score: spec.frequency_score,
  };
}

export const blueprintNodes: BlueprintNodeInput[] = MEDICINE_NODES.map(extractBlueprintNode);
