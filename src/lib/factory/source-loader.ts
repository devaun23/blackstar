// ─── Source Loader ───
// Converts structured source packs into compact agent-consumable text.
// Agents see display_id aliases. The validator maps display_id → canonical ID
// via all_display_ids for internal validation.

import type {
  SourcePack,
  Recommendation,
  DiagnosticCriterion,
  Threshold,
  TreatmentStep,
  RedFlag,
  SeverityDefinition,
} from './source-packs/types';
import type { TopicSourceConfig } from './source-packs/topic-source-map';
import { topicSourceMap } from './source-packs/topic-source-map';
import { loadPack } from './source-packs/index';

function formatRecommendation(r: Recommendation): string {
  return `[${r.display_id}] (${r.strength}/${r.evidence_quality}) ${r.statement}`;
}

function formatDiagnosticCriterion(dc: DiagnosticCriterion): string {
  const components = dc.components.join('; ');
  return `[${dc.display_id}] ${dc.name}: ${components}${dc.threshold ? ` (threshold: ${dc.threshold})` : ''} → ${dc.interpretation}`;
}

function formatThreshold(t: Threshold): string {
  const unit = t.unit ? ` ${t.unit}` : '';
  return `[${t.display_id}] ${t.parameter} ${t.value}${unit} → ${t.clinical_meaning}`;
}

function formatTreatmentStep(tx: TreatmentStep): string {
  const parts = [tx.action];
  if (tx.drug_details) {
    const d = tx.drug_details;
    const drugParts = [d.drug, d.dose, d.route, d.duration].filter(Boolean);
    parts.push(`(${drugParts.join(', ')})`);
  }
  if (tx.timing) parts.push(`— ${tx.timing}`);
  if (tx.condition) parts.push(`— ${tx.condition}`);
  return `[${tx.display_id}] ${parts.join(' ')}`;
}

function formatRedFlag(rf: RedFlag): string {
  return `[${rf.display_id}] ${rf.finding} → ${rf.implication} → ${rf.action}`;
}

function formatSeverity(s: SeverityDefinition): string {
  return `[${s.display_id}] ${s.level}: ${s.criteria.join('; ')} → ${s.management_implications}`;
}

function formatPack(
  pack: SourcePack,
  role: 'PRIMARY' | 'SECONDARY',
  allowedScopes?: string[]
): string {
  const lines: string[] = [];

  lines.push(`═══ ${role} SOURCE: ${pack.source_name} (${pack.publication_year}) ═══`);
  lines.push(`PACK ID: ${pack.source_pack_id}`);
  lines.push(`SCOPE: ${pack.topic_tags.join(', ')}`);

  if (role === 'SECONDARY' && allowedScopes) {
    lines.push(`ALLOWED SCOPES: ${allowedScopes.join(', ')}`);
  }

  // Recommendations
  const recs =
    role === 'SECONDARY' && allowedScopes
      ? pack.recommendations.filter((r) =>
          allowedScopes.some(
            (scope) =>
              r.statement.toLowerCase().includes(scope.toLowerCase()) ||
              (r.context && r.context.toLowerCase().includes(scope.toLowerCase()))
          )
        )
      : pack.recommendations;

  if (recs.length > 0) {
    lines.push('');
    lines.push('RECOMMENDATIONS:');
    recs.forEach((r) => lines.push(formatRecommendation(r)));
  }

  // Diagnostic Criteria
  const dcs =
    role === 'PRIMARY' ? pack.diagnostic_criteria : [];
  if (dcs.length > 0) {
    lines.push('');
    lines.push('DIAGNOSTIC CRITERIA:');
    dcs.forEach((dc) => lines.push(formatDiagnosticCriterion(dc)));
  }

  // Thresholds
  const thresholds =
    role === 'SECONDARY' && allowedScopes
      ? pack.thresholds.filter((t) =>
          allowedScopes.some(
            (scope) =>
              t.parameter.toLowerCase().includes(scope.toLowerCase()) ||
              t.clinical_meaning.toLowerCase().includes(scope.toLowerCase())
          )
        )
      : pack.thresholds;

  if (thresholds.length > 0) {
    lines.push('');
    lines.push('THRESHOLDS:');
    thresholds.forEach((t) => lines.push(formatThreshold(t)));
  }

  // Severity
  if (role === 'PRIMARY' && pack.severity_definitions.length > 0) {
    lines.push('');
    lines.push('SEVERITY:');
    pack.severity_definitions.forEach((s) => lines.push(formatSeverity(s)));
  }

  // Treatment Steps
  const txSteps =
    role === 'SECONDARY' && allowedScopes
      ? pack.treatment_steps.filter((tx) =>
          allowedScopes.some(
            (scope) =>
              tx.action.toLowerCase().includes(scope.toLowerCase()) ||
              (tx.condition && tx.condition.toLowerCase().includes(scope.toLowerCase()))
          )
        )
      : pack.treatment_steps;

  if (txSteps.length > 0) {
    lines.push('');
    lines.push('TREATMENT:');
    txSteps.forEach((tx) => lines.push(formatTreatmentStep(tx)));
  }

  // Red Flags
  if (role === 'PRIMARY' && pack.red_flags.length > 0) {
    lines.push('');
    lines.push('RED FLAGS:');
    pack.red_flags.forEach((rf) => lines.push(formatRedFlag(rf)));
  }

  lines.push('');
  lines.push(
    `CITATION FORMAT: Use "${pack.source_name} [display_id]"`
  );

  return lines.join('\n');
}

function formatForAgent(
  primaryPack: SourcePack,
  secondaryPacks: Array<{ pack: SourcePack; allowedScopes: string[] }>,
  config: TopicSourceConfig
): string {
  const sections: string[] = [];

  // Primary
  sections.push(formatPack(primaryPack, 'PRIMARY'));
  sections.push(`PRECEDENCE: ${config.precedence_rule}`);

  // Secondary sources (scoped)
  for (const { pack, allowedScopes } of secondaryPacks) {
    sections.push('');
    sections.push(formatPack(pack, 'SECONDARY', allowedScopes));
  }

  if (config.conflict_resolution) {
    sections.push('');
    sections.push(`CONFLICT RESOLUTION: ${config.conflict_resolution}`);
  }

  return sections.join('\n');
}

/**
 * Resolve the full source context for a topic, formatted for agent consumption.
 * Returns empty string if no source pack is configured (will be caught by sufficiency gate).
 */
export async function resolveSourceContext(topic: string): Promise<string> {
  const config = topicSourceMap[topic];
  if (!config) return '';

  const primaryPack = await loadPack(config.primary);
  if (!primaryPack) return '';

  const secondaryPacks: Array<{ pack: SourcePack; allowedScopes: string[] }> = [];

  if (config.secondary) {
    for (const sec of config.secondary) {
      const pack = await loadPack(sec.source_pack_id);
      if (pack) {
        secondaryPacks.push({ pack, allowedScopes: sec.allowed_scopes });
      }
    }
  }

  return formatForAgent(primaryPack, secondaryPacks, config);
}
