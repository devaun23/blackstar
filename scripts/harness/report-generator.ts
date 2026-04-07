/**
 * Report Generator — produces markdown summaries from harness run results.
 *
 * Sections:
 * 1. Summary table (pass/kill/error, tokens, cost)
 * 2. Failure distribution by code
 * 3. Worst failures (manual review section, top 10)
 * 4. Validator score distribution (per-validator mean/min/max/fail%)
 * 5. Prompt versions (for reproducibility)
 */

import type {
  HarnessItemResult,
  HarnessRunMeta,
  FailureCode,
  ValidatorScore,
  PromptVersionSnapshot,
} from './types';
import { FAILURE_CODES } from './types';
import type { ValidatorType } from '../../src/lib/types/database';

/**
 * Generate the full markdown report.
 */
export function generateReport(
  meta: HarnessRunMeta,
  items: HarnessItemResult[]
): string {
  const lines: string[] = [];

  lines.push(`# Harness Run: ${meta.tag}`);
  lines.push(`**Date:** ${meta.started_at}  |  **Items:** ${meta.total_items}  |  **Cost:** $${meta.estimated_cost_usd.toFixed(2)}`);
  lines.push('');

  lines.push(generateSummarySection(meta, items));
  lines.push(generateFailureDistribution(meta));
  lines.push(generateWorstFailures(items));
  lines.push(generateValidatorScores(items));
  lines.push(generatePromptVersions(meta.prompt_versions));

  return lines.join('\n');
}

/**
 * Generate a comparison section between two runs.
 */
export function generateComparison(
  current: HarnessRunMeta,
  baseline: HarnessRunMeta,
  currentItems: HarnessItemResult[],
  baselineItems: HarnessItemResult[]
): string {
  const lines: string[] = [];

  lines.push(`## Comparison: ${current.tag} vs ${baseline.tag}`);
  lines.push('');

  const curPassRate = current.total_items > 0 ? (current.passed_count / current.total_items * 100) : 0;
  const basePassRate = baseline.total_items > 0 ? (baseline.passed_count / baseline.total_items * 100) : 0;
  const curAvgCost = current.total_items > 0 ? current.estimated_cost_usd / current.total_items : 0;
  const baseAvgCost = baseline.total_items > 0 ? baseline.estimated_cost_usd / baseline.total_items : 0;

  lines.push('| Metric | Baseline | Current | Delta |');
  lines.push('|--------|----------|---------|-------|');
  lines.push(`| Pass rate | ${basePassRate.toFixed(0)}% | ${curPassRate.toFixed(0)}% | ${formatDelta(curPassRate - basePassRate, '%')} |`);
  lines.push(`| Killed | ${baseline.killed_count} | ${current.killed_count} | ${formatDelta(current.killed_count - baseline.killed_count)} |`);
  lines.push(`| Errors | ${baseline.error_count} | ${current.error_count} | ${formatDelta(current.error_count - baseline.error_count)} |`);
  lines.push(`| Avg cost/item | $${baseAvgCost.toFixed(2)} | $${curAvgCost.toFixed(2)} | ${formatDelta(curAvgCost - baseAvgCost, '$')} |`);
  lines.push('');

  // Validator score comparison
  const curScores = computeValidatorAverages(currentItems);
  const baseScores = computeValidatorAverages(baselineItems);

  const allValidators = new Set([...curScores.keys(), ...baseScores.keys()]);
  if (allValidators.size > 0) {
    lines.push('### Validator Score Deltas');
    lines.push('| Validator | Baseline Avg | Current Avg | Delta |');
    lines.push('|-----------|-------------|-------------|-------|');
    for (const v of allValidators) {
      const baseAvg = baseScores.get(v)?.mean ?? 0;
      const curAvg = curScores.get(v)?.mean ?? 0;
      lines.push(`| ${v} | ${baseAvg.toFixed(1)} | ${curAvg.toFixed(1)} | ${formatDelta(curAvg - baseAvg)} |`);
    }
    lines.push('');
  }

  // Failure distribution diff
  const allCodes = new Set([
    ...Object.keys(current.failure_distribution),
    ...Object.keys(baseline.failure_distribution),
  ]) as Set<FailureCode>;

  if (allCodes.size > 0) {
    lines.push('### Failure Distribution Diff');
    lines.push('| Code | Baseline | Current | Delta |');
    lines.push('|------|----------|---------|-------|');
    for (const code of allCodes) {
      const baseCount = baseline.failure_distribution[code] ?? 0;
      const curCount = current.failure_distribution[code] ?? 0;
      if (baseCount === 0 && curCount === 0) continue;
      lines.push(`| ${code} | ${baseCount} | ${curCount} | ${formatDelta(curCount - baseCount)} |`);
    }
    lines.push('');
  }

  // Prompt changes
  const promptChanges = findPromptChanges(current.prompt_versions, baseline.prompt_versions);
  if (promptChanges.length > 0) {
    lines.push('### Prompt Changes');
    for (const change of promptChanges) {
      lines.push(`- **${change.agent}**: v${change.oldVersion} -> v${change.newVersion}`);
    }
    lines.push('');
  } else {
    lines.push('### Prompt Changes');
    lines.push('No prompt changes between runs.');
    lines.push('');
  }

  return lines.join('\n');
}

// ─── Section Generators ─────────────────────────────────────────

function generateSummarySection(meta: HarnessRunMeta, items: HarnessItemResult[]): string {
  const lines: string[] = [];
  const passRate = meta.total_items > 0 ? (meta.passed_count / meta.total_items * 100) : 0;
  const avgTokens = meta.total_items > 0 ? Math.round(meta.total_tokens / meta.total_items) : 0;
  const avgCost = meta.total_items > 0 ? meta.estimated_cost_usd / meta.total_items : 0;
  const avgRepairs = meta.total_items > 0
    ? items.reduce((sum, i) => sum + i.repair_cycles, 0) / meta.total_items
    : 0;

  lines.push('## Summary');
  lines.push('| Metric | Value |');
  lines.push('|--------|-------|');
  lines.push(`| Passed | ${meta.passed_count}/${meta.total_items} (${passRate.toFixed(0)}%) |`);
  lines.push(`| Killed | ${meta.killed_count}/${meta.total_items} |`);
  lines.push(`| Errors | ${meta.error_count}/${meta.total_items} |`);
  lines.push(`| Total tokens | ${meta.total_tokens.toLocaleString()} |`);
  lines.push(`| Avg tokens/item | ${avgTokens.toLocaleString()} |`);
  lines.push(`| Total cost | $${meta.estimated_cost_usd.toFixed(2)} |`);
  lines.push(`| Avg cost/item | $${avgCost.toFixed(2)} |`);
  lines.push(`| Avg repair cycles | ${avgRepairs.toFixed(1)} |`);
  lines.push(`| Duration | ${formatDuration(items)} |`);
  lines.push('');

  return lines.join('\n');
}

function generateFailureDistribution(meta: HarnessRunMeta): string {
  const lines: string[] = [];
  const entries = Object.entries(meta.failure_distribution)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a);

  if (entries.length === 0) {
    lines.push('## Failure Distribution');
    lines.push('No failures detected.');
    lines.push('');
    return lines.join('\n');
  }

  lines.push('## Failure Distribution');
  lines.push('| Code | Name | Count | % of items |');
  lines.push('|------|------|------:|----------:|');

  for (const [code, count] of entries) {
    const info = FAILURE_CODES[code as FailureCode];
    const pct = meta.total_items > 0 ? (count / meta.total_items * 100) : 0;
    lines.push(`| ${code} | ${info?.name ?? code} | ${count} | ${pct.toFixed(0)}% |`);
  }
  lines.push('');

  return lines.join('\n');
}

function generateWorstFailures(items: HarnessItemResult[]): string {
  const lines: string[] = [];

  // Filter to killed/error items, then sort by severity
  const worstItems = items
    .filter((i) => i.status === 'killed' || i.status === 'error')
    .sort((a, b) => {
      // Errors first, then killed, then by lowest validator score
      if (a.status === 'error' && b.status !== 'error') return -1;
      if (b.status === 'error' && a.status !== 'error') return 1;
      const aMin = Math.min(...a.validator_scores.map((v) => v.score ?? 10));
      const bMin = Math.min(...b.validator_scores.map((v) => v.score ?? 10));
      return aMin - bMin;
    })
    .slice(0, 10);

  if (worstItems.length === 0) {
    lines.push('## Worst Failures');
    lines.push('All items passed. No manual review needed.');
    lines.push('');
    return lines.join('\n');
  }

  lines.push('## Worst Failures (manual review needed)');
  lines.push('');

  for (const item of worstItems) {
    const failureCodes = item.classified_failures.map((f) => f.code).join(', ');
    lines.push(`### Item #${item.item_index + 1} — ${item.topic} (${item.status.toUpperCase()})`);
    lines.push(`- **Failures:** ${failureCodes || 'none classified'}`);

    if (item.validator_scores.length > 0) {
      const scoreStr = item.validator_scores
        .map((v) => `${v.validator_type}=${v.score ?? '?'}`)
        .join(', ');
      lines.push(`- **Scores:** ${scoreStr}`);
    }

    lines.push(`- **Repair attempts:** ${item.repair_cycles}`);

    // Show top issues
    const allIssues = item.classified_failures.flatMap((f) => f.issues).slice(0, 3);
    if (allIssues.length > 0) {
      lines.push(`- **Issues:**`);
      for (const issue of allIssues) {
        lines.push(`  - ${issue}`);
      }
    }

    if (item.draft) {
      lines.push(`- **Stem:** ${item.draft.stem.slice(0, 120)}${item.draft.stem.length > 120 ? '...' : ''}`);
    }

    if (item.error_message) {
      lines.push(`- **Error:** ${item.error_message}`);
    }

    lines.push('');
  }

  return lines.join('\n');
}

function generateValidatorScores(items: HarnessItemResult[]): string {
  const lines: string[] = [];
  const stats = computeValidatorAverages(items);

  if (stats.size === 0) {
    return '';
  }

  lines.push('## Validator Score Distribution');
  lines.push('| Validator | Mean | Min | Max | Fail% |');
  lines.push('|-----------|-----:|----:|----:|------:|');

  for (const [vtype, s] of stats) {
    lines.push(`| ${vtype} | ${s.mean.toFixed(1)} | ${s.min.toFixed(1)} | ${s.max.toFixed(1)} | ${s.failPct.toFixed(0)}% |`);
  }
  lines.push('');

  return lines.join('\n');
}

function generatePromptVersions(versions: PromptVersionSnapshot[]): string {
  if (versions.length === 0) return '';

  const lines: string[] = [];
  lines.push('## Prompt Versions');
  lines.push('| Agent | Prompt ID | Version |');
  lines.push('|-------|-----------|---------|');

  for (const v of versions) {
    lines.push(`| ${v.agent_type} | ${v.prompt_id.slice(0, 8)}... | ${v.version} |`);
  }
  lines.push('');

  return lines.join('\n');
}

// ─── Helpers ────────────────────────────────────────────────────

interface ValidatorStats {
  mean: number;
  min: number;
  max: number;
  failPct: number;
}

function computeValidatorAverages(
  items: HarnessItemResult[]
): Map<ValidatorType, ValidatorStats> {
  const byType = new Map<ValidatorType, { scores: number[]; failCount: number; total: number }>();

  for (const item of items) {
    for (const vs of item.validator_scores) {
      if (!byType.has(vs.validator_type)) {
        byType.set(vs.validator_type, { scores: [], failCount: 0, total: 0 });
      }
      const entry = byType.get(vs.validator_type)!;
      entry.total++;
      if (vs.score !== null) entry.scores.push(vs.score);
      if (!vs.passed) entry.failCount++;
    }
  }

  const result = new Map<ValidatorType, ValidatorStats>();
  for (const [vtype, entry] of byType) {
    if (entry.scores.length === 0) continue;
    result.set(vtype, {
      mean: entry.scores.reduce((a, b) => a + b, 0) / entry.scores.length,
      min: Math.min(...entry.scores),
      max: Math.max(...entry.scores),
      failPct: (entry.failCount / entry.total) * 100,
    });
  }

  return result;
}

function formatDelta(value: number, unit: string = ''): string {
  const sign = value >= 0 ? '+' : '';
  if (unit === '$') return `${sign}$${value.toFixed(2)}`;
  if (unit === '%') return `${sign}${value.toFixed(0)}%`;
  return `${sign}${value}`;
}

function formatDuration(items: HarnessItemResult[]): string {
  const totalMs = items.reduce((sum, i) => sum + i.duration_ms, 0);
  const seconds = Math.round(totalMs / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainSec = seconds % 60;
  return `${minutes}m ${remainSec}s`;
}

function findPromptChanges(
  current: PromptVersionSnapshot[],
  baseline: PromptVersionSnapshot[]
): Array<{ agent: string; oldVersion: number; newVersion: number }> {
  const changes: Array<{ agent: string; oldVersion: number; newVersion: number }> = [];
  const baseMap = new Map(baseline.map((p) => [p.agent_type, p]));

  for (const cur of current) {
    const base = baseMap.get(cur.agent_type);
    if (base && base.version !== cur.version) {
      changes.push({
        agent: cur.agent_type,
        oldVersion: base.version,
        newVersion: cur.version,
      });
    }
  }

  return changes;
}
