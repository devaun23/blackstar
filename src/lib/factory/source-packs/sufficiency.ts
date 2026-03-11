// ─── Source Sufficiency Gate ───
// Blocks generation if evidence is thin. Checks both item counts and
// reasoning viability (competing pathways, management hinges).

import type { SourcePack } from './types';
import { topicSourceMap } from './topic-source-map';
import { loadPack } from './index';

export interface SufficiencyResult {
  sufficient: boolean;
  topic: string;
  missing: string[];
  coverage: {
    has_primary_source: boolean;
    has_diagnostic_criteria: boolean;
    has_treatment_pathway: boolean;
    has_at_least_one_threshold: boolean;
    has_severity_definitions: boolean;
    has_competing_pathways: boolean;
    has_management_or_severity_hinge: boolean;
    recommendation_count: number;
    treatment_step_count: number;
    red_flag_count: number;
  };
}

const MINIMUM_REQUIREMENTS = {
  recommendations: 3,
  diagnostic_criteria: 1,
  treatment_steps: 2,
  thresholds: 1,
  severity_definitions: 1,
  red_flags: 1,
};

function hasCompetingPathways(pack: SourcePack): boolean {
  const conditions = new Set(
    pack.treatment_steps
      .map((s) => s.condition)
      .filter((c): c is string => c !== undefined && c !== '')
  );
  return conditions.size >= 2;
}

function hasManagementHinge(pack: SourcePack): boolean {
  // At least one threshold or severity definition that would serve as a
  // hinge feature for a board question (i.e. it changes management)
  const hasThresholdWithMeaning = pack.thresholds.some(
    (t) => t.clinical_meaning.length > 0
  );
  const hasSeverityWithImplications = pack.severity_definitions.some(
    (s) => s.management_implications.length > 0
  );
  return hasThresholdWithMeaning || hasSeverityWithImplications;
}

function evaluatePack(pack: SourcePack, topic: string): SufficiencyResult {
  const missing: string[] = [];

  if (pack.recommendations.length < MINIMUM_REQUIREMENTS.recommendations) {
    missing.push(
      `Need ≥${MINIMUM_REQUIREMENTS.recommendations} recommendations, have ${pack.recommendations.length}`
    );
  }
  if (pack.diagnostic_criteria.length < MINIMUM_REQUIREMENTS.diagnostic_criteria) {
    missing.push(
      `Need ≥${MINIMUM_REQUIREMENTS.diagnostic_criteria} diagnostic criteria, have ${pack.diagnostic_criteria.length}`
    );
  }
  if (pack.treatment_steps.length < MINIMUM_REQUIREMENTS.treatment_steps) {
    missing.push(
      `Need ≥${MINIMUM_REQUIREMENTS.treatment_steps} treatment steps, have ${pack.treatment_steps.length}`
    );
  }
  if (pack.thresholds.length < MINIMUM_REQUIREMENTS.thresholds) {
    missing.push(
      `Need ≥${MINIMUM_REQUIREMENTS.thresholds} threshold, have ${pack.thresholds.length}`
    );
  }
  if (pack.severity_definitions.length < MINIMUM_REQUIREMENTS.severity_definitions) {
    missing.push(
      `Need ≥${MINIMUM_REQUIREMENTS.severity_definitions} severity definition, have ${pack.severity_definitions.length}`
    );
  }
  if (pack.red_flags.length < MINIMUM_REQUIREMENTS.red_flags) {
    missing.push(
      `Need ≥${MINIMUM_REQUIREMENTS.red_flags} red flag, have ${pack.red_flags.length}`
    );
  }

  const competing = hasCompetingPathways(pack);
  if (!competing) {
    missing.push('No competing pathways — need ≥2 treatment steps with different conditions');
  }

  const hinge = hasManagementHinge(pack);
  if (!hinge) {
    missing.push('No management/severity hinge — need threshold or severity definition with management implications');
  }

  const coverage = {
    has_primary_source: true,
    has_diagnostic_criteria: pack.diagnostic_criteria.length >= MINIMUM_REQUIREMENTS.diagnostic_criteria,
    has_treatment_pathway: pack.treatment_steps.length >= MINIMUM_REQUIREMENTS.treatment_steps,
    has_at_least_one_threshold: pack.thresholds.length >= MINIMUM_REQUIREMENTS.thresholds,
    has_severity_definitions: pack.severity_definitions.length >= MINIMUM_REQUIREMENTS.severity_definitions,
    has_competing_pathways: competing,
    has_management_or_severity_hinge: hinge,
    recommendation_count: pack.recommendations.length,
    treatment_step_count: pack.treatment_steps.length,
    red_flag_count: pack.red_flags.length,
  };

  return {
    sufficient: missing.length === 0,
    topic,
    missing,
    coverage,
  };
}

/**
 * Check whether a topic has sufficient source evidence for generation.
 * For scoped topics (those in topicSourceMap), missing packs cause a hard
 * `source_insufficient` error — the pipeline does NOT silently degrade.
 */
export async function checkSourceSufficiency(topic: string): Promise<SufficiencyResult> {
  const config = topicSourceMap[topic];

  if (!config) {
    // Topic not in map — no source pack exists
    return {
      sufficient: false,
      topic,
      missing: [`No source pack configuration for topic "${topic}"`],
      coverage: {
        has_primary_source: false,
        has_diagnostic_criteria: false,
        has_treatment_pathway: false,
        has_at_least_one_threshold: false,
        has_severity_definitions: false,
        has_competing_pathways: false,
        has_management_or_severity_hinge: false,
        recommendation_count: 0,
        treatment_step_count: 0,
        red_flag_count: 0,
      },
    };
  }

  const primaryPack = await loadPack(config.primary);

  if (!primaryPack) {
    return {
      sufficient: false,
      topic,
      missing: [`Primary source pack "${config.primary}" not found or not active`],
      coverage: {
        has_primary_source: false,
        has_diagnostic_criteria: false,
        has_treatment_pathway: false,
        has_at_least_one_threshold: false,
        has_severity_definitions: false,
        has_competing_pathways: false,
        has_management_or_severity_hinge: false,
        recommendation_count: 0,
        treatment_step_count: 0,
        red_flag_count: 0,
      },
    };
  }

  return evaluatePack(primaryPack, topic);
}
