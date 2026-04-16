/**
 * DI/IC → Source Pack Accelerator
 *
 * Queries board review evidence items from Supabase, classifies them into
 * SourcePack buckets, then uses Claude to produce a structured draft pack.
 *
 * Usage:
 *   npx tsx scripts/draft-source-pack.ts "Heart Failure"
 *   npx tsx scripts/draft-source-pack.ts "Heart Failure" --dry-run
 *   npx tsx scripts/draft-source-pack.ts --batch="Hyponatremia,Hyperkalemia,Hypokalemia"
 *   npx tsx scripts/draft-source-pack.ts --batch-file=topics.txt
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

// ─── Environment ───

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=]+)=(.+)$/);
  if (match) process.env[match[1]!] = match[2]!;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const anthropic = new Anthropic();

// ─── CLI Args ───

const DRY_RUN = process.argv.includes('--dry-run');
const batchArg = process.argv.find((a) => a.startsWith('--batch='))?.split('=').slice(1).join('=');
const batchFileArg = process.argv.find((a) => a.startsWith('--batch-file='))?.split('=').slice(1).join('=');
const singleTopic = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null;

// ─── Types ───

interface EvidenceItem {
  display_id: string;
  item_type: string;
  claim: string;
  section_heading: string;
  source: string;
  trigger_presentation: string | null;
  association: string | null;
  differential: Array<{ condition: string; features: string }> | null;
}

interface ClassifiedEvidence {
  recommendations: EvidenceItem[];
  diagnostic_criteria: EvidenceItem[];
  treatment_steps: EvidenceItem[];
  thresholds: EvidenceItem[];
  red_flags: EvidenceItem[];
  severity_definitions: EvidenceItem[];
  skipped: EvidenceItem[];
}

// ─── Source Pack TypeScript Template ───

const SOURCE_PACK_TYPE_DEFINITION = `
interface SourcePack {
  source_pack_id: string;        // e.g., "PACK.AHA.ACS.2023"
  source_name: string;
  canonical_url: string;
  publication_year: number;
  guideline_body: string;
  topic_tags: string[];
  allowed_decision_scopes: string[];
  excluded_decision_scopes: string[];
  recommendations: Array<{
    rec_id: string;              // e.g., "PACK.AHA.ACS.2023.REC.01"
    display_id: string;          // e.g., "AHA-ACS-R1"
    statement: string;
    normalized_claim: string;
    strength: 'strong' | 'conditional' | 'expert_consensus';
    evidence_quality: 'high' | 'moderate' | 'low' | 'very_low';
    context?: string;
    population?: string;
    provenance: { section?: string; page_or_location?: string; quote_snippet?: string };
  }>;
  diagnostic_criteria: Array<{
    criterion_id: string;
    display_id: string;
    name: string;
    components: string[];
    threshold?: string;
    interpretation: string;
    normalized_claim: string;
    provenance: { section?: string; page_or_location?: string; quote_snippet?: string };
  }>;
  thresholds: Array<{
    threshold_id: string;
    display_id: string;
    parameter: string;
    value: string;
    unit?: string;
    clinical_meaning: string;
    normalized_claim: string;
    direction: 'above' | 'below' | 'range' | 'present' | 'absent';
    provenance: { section?: string; page_or_location?: string; quote_snippet?: string };
  }>;
  treatment_steps: Array<{
    step_id: string;
    display_id: string;
    action: string;
    normalized_claim: string;
    timing?: string;
    condition?: string;
    contraindications?: string[];
    escalation?: string;
    drug_details?: { drug: string; dose?: string; route?: string; duration?: string };
    provenance: { section?: string; page_or_location?: string; quote_snippet?: string };
  }>;
  red_flags: Array<{
    flag_id: string;
    display_id: string;
    finding: string;
    implication: string;
    action: string;
    urgency: 'immediate' | 'urgent' | 'soon';
    provenance: { section?: string; page_or_location?: string; quote_snippet?: string };
  }>;
  severity_definitions: Array<{
    severity_id: string;
    display_id: string;
    level: string;
    criteria: string[];
    management_implications: string;
    provenance: { section?: string; page_or_location?: string; quote_snippet?: string };
  }>;
  source_pack_version: number;
  status: 'draft' | 'validated' | 'active' | 'superseded';
  last_normalized: string;
  normalizer_version: number;
  normalization_notes: string;
  all_item_ids: string[];
  all_display_ids: string[];
}
`;

// ─── Evidence Classification ───

function classifyEvidence(items: EvidenceItem[]): ClassifiedEvidence {
  const result: ClassifiedEvidence = {
    recommendations: [],
    diagnostic_criteria: [],
    treatment_steps: [],
    thresholds: [],
    red_flags: [],
    severity_definitions: [],
    skipped: [],
  };

  for (const item of items) {
    switch (item.item_type) {
      case 'treatment_protocol':
        result.treatment_steps.push(item);
        break;
      case 'diagnostic_criterion':
        result.diagnostic_criteria.push(item);
        break;
      case 'pharmacology':
        result.treatment_steps.push(item);
        break;
      case 'risk_factor':
        result.red_flags.push(item);
        break;
      case 'clinical_pearl': {
        // Triage clinical pearls by content keywords
        const claim = item.claim.toLowerCase();
        if (claim.includes('threshold') || claim.includes('>') || claim.includes('<') || claim.includes('≥') || claim.includes('≤') || claim.match(/\d+\s*(mg|mmhg|ml|mm|%|meq|units?)/i)) {
          result.thresholds.push(item);
        } else if (claim.includes('emergency') || claim.includes('red flag') || claim.includes('immediately') || claim.includes('life-threatening') || claim.includes('mortality')) {
          result.red_flags.push(item);
        } else if (claim.includes('mild') || claim.includes('moderate') || claim.includes('severe') || claim.includes('stage') || claim.includes('class ')) {
          result.severity_definitions.push(item);
        } else if (claim.includes('diagnos') || claim.includes('criteria') || claim.includes('dx:') || claim.includes('workup')) {
          result.diagnostic_criteria.push(item);
        } else if (claim.includes('treat') || claim.includes('tx:') || claim.includes('first-line') || claim.includes('management')) {
          result.treatment_steps.push(item);
        } else {
          result.recommendations.push(item);
        }
        break;
      }
      case 'comparison_table':
        // Comparison tables feed confusion sets, not source packs directly
        result.skipped.push(item);
        break;
      case 'pathophysiology':
      case 'mnemonic':
        result.skipped.push(item);
        break;
      default:
        result.recommendations.push(item);
    }
  }

  return result;
}

// ─── Query DI/IC Evidence ───

async function queryEvidence(topic: string): Promise<EvidenceItem[]> {
  const { data, error } = await supabase
    .from('di_evidence_item')
    .select('display_id, item_type, claim, section_heading, source, trigger_presentation, association, differential')
    .contains('topic_tags', [topic])
    .order('display_id')
    .limit(200);

  if (error) {
    console.error(`  ✗ Supabase query error for "${topic}":`, error.message);
    return [];
  }

  return (data ?? []) as EvidenceItem[];
}

// ─── Generate Pack via Claude ───

async function generatePackWithClaude(
  topic: string,
  classified: ClassifiedEvidence,
): Promise<string> {
  const formatItems = (items: EvidenceItem[]): string =>
    items.map((i) => `  [${i.display_id}] (${i.item_type}) ${i.claim}`).join('\n');

  const evidenceContext = `
TOPIC: ${topic}

CLASSIFIED EVIDENCE FROM BOARD REVIEW SOURCES (Divine Intervention + Inner Circle + Emma Holliday):

=== RECOMMENDATIONS (${classified.recommendations.length}) ===
${formatItems(classified.recommendations)}

=== DIAGNOSTIC CRITERIA (${classified.diagnostic_criteria.length}) ===
${formatItems(classified.diagnostic_criteria)}

=== TREATMENT STEPS (${classified.treatment_steps.length}) ===
${formatItems(classified.treatment_steps)}

=== THRESHOLDS (${classified.thresholds.length}) ===
${formatItems(classified.thresholds)}

=== RED FLAGS (${classified.red_flags.length}) ===
${formatItems(classified.red_flags)}

=== SEVERITY DEFINITIONS (${classified.severity_definitions.length}) ===
${formatItems(classified.severity_definitions)}

=== SKIPPED (comparison_table, pathophysiology, mnemonic) (${classified.skipped.length}) ===
${classified.skipped.length} items skipped — not part of source pack structure.
`.trim();

  const systemPrompt = `You are a medical guideline normalizer for an NBME question generation pipeline.
Your job is to convert board review evidence items into a structured SourcePack object.

${SOURCE_PACK_TYPE_DEFINITION}

RULES:
1. Every item needs a unique ID following the pattern: PACK.{BODY}.{TOPIC_ABBREV}.{YEAR}.{TYPE}.{NUMBER}
   - REC for recommendations, DC for diagnostic criteria, T for thresholds, TX for treatment steps, RF for red flags, SEV for severity
2. Every item needs a display_id following the pattern: {BODY}-{TOPIC_ABBREV}-{TYPE_LETTER}{NUMBER}
   - Example: "AHA-ACS-R1" for recommendation 1, "AHA-ACS-TX3" for treatment step 3
3. For source_pack_id, use PACK.{BODY}.{TOPIC_ABBREV}.{YEAR}
4. For guideline_body: use the most authoritative society for this topic
5. For publication_year: use the most recent guideline year you know of for this topic
6. For canonical_url: provide the DOI or guideline URL if known, otherwise use "TODO: Add guideline URL"
7. For provenance: use section names from the guideline where possible, mark as "DI/IC-derived, verify against guideline" if uncertain
8. IMPORTANT: The evidence comes from board review sources, NOT directly from guidelines.
   Every claim should be medically accurate but MAY need verification against the actual guideline.
9. Aim for MINIMUM sufficiency: ≥3 recommendations, ≥1 diagnostic criterion, ≥2 treatment steps, ≥1 threshold, ≥1 severity definition, ≥1 red flag
10. Set status to 'draft' — these packs need human verification before activation
11. Include normalization_notes explaining what was done and what needs verification
12. Populate all_item_ids and all_display_ids arrays with every item's IDs
13. Include allowed_decision_scopes and excluded_decision_scopes based on what the guideline covers

Respond with ONLY the JSON object matching the SourcePack interface. No explanation, no markdown fences.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Generate a SourcePack for the topic "${topic}" using this evidence:\n\n${evidenceContext}`,
      },
    ],
  });

  const text = response.content[0]!;
  if (text.type !== 'text') throw new Error('Unexpected response type');
  return text.text;
}

// ─── Format as TypeScript File ───

function formatAsTypeScript(topic: string, packJson: string, evidenceItems: EvidenceItem[], classified: ClassifiedEvidence): string {
  // Parse the JSON to extract the export name
  let parsed: Record<string, unknown>;
  try {
    const cleaned = packJson
      .replace(/^```(?:json)?\s*\n?/i, '')
      .replace(/\n?```\s*$/i, '')
      .trim();
    parsed = JSON.parse(cleaned);
  } catch (e) {
    console.error(`  ✗ Failed to parse Claude response as JSON:`, (e as Error).message);
    console.error(`  Raw response (first 500 chars):`, packJson.slice(0, 500));
    throw e;
  }

  const packId = parsed.source_pack_id as string;
  const exportName = packId
    .replace(/^PACK\./, 'PACK_')
    .replace(/\./g, '_');

  const diDisplayIds = evidenceItems.map((i) => i.display_id);

  const sufficiencyReport = [
    `Recommendations: ${classified.recommendations.length} items → pack`,
    `Diagnostic criteria: ${classified.diagnostic_criteria.length} items → pack`,
    `Treatment steps: ${classified.treatment_steps.length} items → pack`,
    `Thresholds: ${classified.thresholds.length} items → pack`,
    `Red flags: ${classified.red_flags.length} items → pack`,
    `Severity definitions: ${classified.severity_definitions.length} items → pack`,
    `Skipped: ${classified.skipped.length} items (comparison_table, pathophysiology, mnemonic)`,
  ].join('\n *   ');

  return `// ─── DRAFT Source Pack: ${topic} ───
// Generated by DI/IC Accelerator on ${new Date().toISOString().split('T')[0]}
// STATUS: DRAFT — requires human verification against authoritative guideline
//
// Source evidence items used (${evidenceItems.length} total):
//   ${diDisplayIds.slice(0, 20).join(', ')}${diDisplayIds.length > 20 ? ` ... and ${diDisplayIds.length - 20} more` : ''}
//
// Evidence classification summary:
//   ${sufficiencyReport}
//
// TODO: Verify all claims against the authoritative guideline
// TODO: Add accurate provenance (section, page numbers)
// TODO: Change status from 'draft' to 'active' after verification

import type { SourcePack } from './types';

export const ${exportName}: SourcePack = ${JSON.stringify(parsed, null, 2)};
`;
}

// ─── Sufficiency Check ───

function checkSufficiency(parsed: Record<string, unknown>): { sufficient: boolean; missing: string[] } {
  const missing: string[] = [];
  const recs = (parsed.recommendations as unknown[])?.length ?? 0;
  const dcs = (parsed.diagnostic_criteria as unknown[])?.length ?? 0;
  const txs = (parsed.treatment_steps as unknown[])?.length ?? 0;
  const thresholds = (parsed.thresholds as unknown[])?.length ?? 0;
  const sevs = (parsed.severity_definitions as unknown[])?.length ?? 0;
  const rfs = (parsed.red_flags as unknown[])?.length ?? 0;

  if (recs < 3) missing.push(`recommendations: ${recs}/3`);
  if (dcs < 1) missing.push(`diagnostic_criteria: ${dcs}/1`);
  if (txs < 2) missing.push(`treatment_steps: ${txs}/2`);
  if (thresholds < 1) missing.push(`thresholds: ${thresholds}/1`);
  if (sevs < 1) missing.push(`severity_definitions: ${sevs}/1`);
  if (rfs < 1) missing.push(`red_flags: ${rfs}/1`);

  return { sufficient: missing.length === 0, missing };
}

// ─── Process One Topic ───

async function processTopic(topic: string): Promise<{ success: boolean; packId?: string; file?: string }> {
  console.log(`\n═══ Processing: ${topic} ═══`);

  // 1. Query evidence
  const items = await queryEvidence(topic);
  if (items.length === 0) {
    console.log(`  ✗ No DI/IC evidence found for "${topic}". Skipping.`);
    return { success: false };
  }
  console.log(`  ✓ Found ${items.length} evidence items`);

  // 2. Classify
  const classified = classifyEvidence(items);
  console.log(`  ✓ Classified: ${classified.recommendations.length} rec, ${classified.diagnostic_criteria.length} dx, ${classified.treatment_steps.length} tx, ${classified.thresholds.length} thresh, ${classified.red_flags.length} rf, ${classified.severity_definitions.length} sev, ${classified.skipped.length} skipped`);

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would generate pack with Claude. Stopping.`);
    return { success: true };
  }

  // 3. Generate via Claude
  console.log(`  → Calling Claude to generate SourcePack...`);
  const packJson = await generatePackWithClaude(topic, classified);

  // 4. Parse and check sufficiency
  let parsed: Record<string, unknown>;
  try {
    const cleaned = packJson
      .replace(/^```(?:json)?\s*\n?/i, '')
      .replace(/\n?```\s*$/i, '')
      .trim();
    parsed = JSON.parse(cleaned);
  } catch {
    console.error(`  ✗ Claude returned invalid JSON. Raw output saved to scripts/output/failed-${topic.replace(/[^a-zA-Z0-9]/g, '-')}.json`);
    const outputDir = path.resolve(__dirname, 'output');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, `failed-${topic.replace(/[^a-zA-Z0-9]/g, '-')}.json`), packJson);
    return { success: false };
  }

  const sufficiency = checkSufficiency(parsed);
  if (sufficiency.sufficient) {
    console.log(`  ✓ Meets minimum sufficiency requirements`);
  } else {
    console.log(`  ⚠ Below sufficiency threshold: ${sufficiency.missing.join(', ')}`);
  }

  // 5. Format as TypeScript and write
  const tsContent = formatAsTypeScript(topic, JSON.stringify(parsed), items, classified);
  const packId = parsed.source_pack_id as string;
  const fileName = packId
    .replace(/^PACK\./, '')
    .replace(/\.\d{4}$/, '')
    .replace(/\./g, '-')
    .toLowerCase();

  const outPath = path.resolve(__dirname, `../src/lib/factory/source-packs/${fileName}.ts`);

  // Don't overwrite existing active packs
  if (fs.existsSync(outPath)) {
    const existing = fs.readFileSync(outPath, 'utf8');
    if (existing.includes("status: 'active'")) {
      console.log(`  ⚠ Pack file already exists and is ACTIVE: ${fileName}.ts — skipping to avoid overwrite.`);
      return { success: true, packId, file: outPath };
    }
    console.log(`  → Overwriting existing draft pack: ${fileName}.ts`);
  }

  fs.writeFileSync(outPath, tsContent);
  console.log(`  ✓ Written: src/lib/factory/source-packs/${fileName}.ts`);
  console.log(`  → Pack ID: ${packId}`);
  console.log(`  → Export: ${packId.replace(/^PACK\./, 'PACK_').replace(/\./g, '_')}`);

  return { success: true, packId, file: outPath };
}

// ─── Main ───

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  DI/IC → Source Pack Accelerator             ║');
  console.log('╚══════════════════════════════════════════════╝');
  if (DRY_RUN) console.log('  MODE: DRY RUN (no Claude calls, no file writes)\n');

  let topics: string[] = [];

  if (singleTopic) {
    topics = [singleTopic];
  } else if (batchArg) {
    topics = batchArg.split(',').map((t) => t.trim());
  } else if (batchFileArg) {
    const filePath = path.resolve(batchFileArg);
    const content = fs.readFileSync(filePath, 'utf8');
    topics = content.split('\n').map((t) => t.trim()).filter((t) => t.length > 0 && !t.startsWith('#'));
  } else {
    console.error('Usage:');
    console.error('  npx tsx scripts/draft-source-pack.ts "Heart Failure"');
    console.error('  npx tsx scripts/draft-source-pack.ts --batch="Hyponatremia,Hyperkalemia"');
    console.error('  npx tsx scripts/draft-source-pack.ts --batch-file=topics.txt');
    console.error('  Add --dry-run to preview without Claude calls.');
    process.exit(1);
  }

  console.log(`\nTopics to process: ${topics.length}`);
  topics.forEach((t, i) => console.log(`  ${i + 1}. ${t}`));

  const results: Array<{ topic: string; success: boolean; packId?: string }> = [];

  for (const topic of topics) {
    try {
      const result = await processTopic(topic);
      results.push({ topic, ...result });
    } catch (err) {
      console.error(`  ✗ Error processing "${topic}":`, (err as Error).message);
      results.push({ topic, success: false });
    }
  }

  // Summary
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║  Summary                                     ║');
  console.log('╚══════════════════════════════════════════════╝');
  const succeeded = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);
  console.log(`  ✓ Succeeded: ${succeeded.length}/${results.length}`);
  if (failed.length > 0) {
    console.log(`  ✗ Failed: ${failed.map((r) => r.topic).join(', ')}`);
  }
  succeeded.forEach((r) => {
    if (r.packId) console.log(`    ${r.topic} → ${r.packId}`);
  });
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
