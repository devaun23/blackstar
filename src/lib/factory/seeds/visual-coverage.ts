import type { VisualRequirementType, AssetMode } from '@/lib/factory/schemas/visual-specs';

export interface VisualCoverage {
  topic_id: string;
  blueprint_node_id?: string;
  task_type?: string;
  topic: string;
  explanation_visual: VisualRequirementType;
  fallback_visual?: VisualRequirementType;
  primary_visual: VisualRequirementType;
  image_essential: boolean;
  allowed_asset_mode: AssetMode;
  visual_priority: 'required' | 'preferred' | 'optional';
  max_visual_count: number;
  visual_contract: {
    supports: 'testing' | 'explanation' | 'both';
    teaching_goal: string;
    tested_hinge?: string;
  };
  notes?: string;
}

export const visualCoverage: VisualCoverage[] = [
  {
    topic_id: 'TOPIC.MED.AP',
    topic: 'Acute Pancreatitis',
    explanation_visual: 'severity_ladder',
    fallback_visual: 'management_algorithm',
    primary_visual: 'none',
    image_essential: false,
    allowed_asset_mode: 'deterministic_render',
    visual_priority: 'preferred',
    max_visual_count: 1,
    visual_contract: {
      supports: 'explanation',
      teaching_goal: 'Show Revised Atlanta severity classification to explain management choice',
      tested_hinge: 'Organ failure duration (>48h) distinguishes severe from moderate',
    },
  },
  {
    topic_id: 'TOPIC.MED.CSBP',
    topic: 'Cirrhosis / SBP',
    explanation_visual: 'comparison_table',
    fallback_visual: 'diagnostic_funnel',
    primary_visual: 'none',
    image_essential: false,
    allowed_asset_mode: 'deterministic_render',
    visual_priority: 'preferred',
    max_visual_count: 1,
    visual_contract: {
      supports: 'explanation',
      teaching_goal: 'Compare SBP vs secondary peritonitis paracentesis values',
    },
  },
  {
    topic_id: 'TOPIC.MED.GIB',
    topic: 'GI Bleed',
    explanation_visual: 'management_algorithm',
    fallback_visual: 'comparison_table',
    primary_visual: 'none',
    image_essential: false,
    allowed_asset_mode: 'deterministic_render',
    visual_priority: 'preferred',
    max_visual_count: 1,
    visual_contract: {
      supports: 'explanation',
      teaching_goal: 'Show upper vs lower GI bleed management algorithm',
    },
  },
];

/**
 * Look up visual coverage for a topic by matching topic name.
 * Returns undefined if no visual coverage is defined.
 */
export function getVisualCoverage(topic: string): VisualCoverage | undefined {
  return visualCoverage.find(
    vc => vc.topic.toLowerCase() === topic.toLowerCase()
  );
}
