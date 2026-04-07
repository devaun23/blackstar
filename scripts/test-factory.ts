#!/usr/bin/env npx tsx
/**
 * Terminal Question Factory v2 — full pipeline with 6 validators, repair loop, explanations.
 *
 * Usage:
 *   npx tsx scripts/test-factory.ts                              # Full pipeline, ACS default
 *   npx tsx scripts/test-factory.ts --topic "Heart Failure"      # Different topic
 *   npx tsx scripts/test-factory.ts --steps extract              # Just algorithm card
 *   npx tsx scripts/test-factory.ts --steps skeleton             # Through skeleton
 *   npx tsx scripts/test-factory.ts --validate                   # + medical validator only
 *   npx tsx scripts/test-factory.ts --validate-full              # + all 6 validators
 *   npx tsx scripts/test-factory.ts --validate-full --repair     # + repair loop (max 3 cycles)
 *   npx tsx scripts/test-factory.ts --explain                    # + explanation writer
 *   npx tsx scripts/test-factory.ts --validate-full --repair --explain --save  # Everything
 */

import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { GOLD_CARDS, type GoldAlgorithmCard } from '../src/lib/factory/seeds/gold-algorithm-cards';

// ─── Load .env.local ───
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx);
    const val = trimmed.slice(eqIdx + 1);
    if (!process.env[key]) process.env[key] = val;
  }
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ERROR: ANTHROPIC_API_KEY not found in .env.local or environment');
  process.exit(1);
}

// ─── CLI args ───
const args = process.argv.slice(2);
function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : undefined;
}
const hasFlag = (name: string) => args.includes(`--${name}`);

const TOPIC_OVERRIDE = getArg('topic');
const BLUEPRINT_INDEX = getArg('blueprint') ? parseInt(getArg('blueprint')!, 10) : undefined;
const STEPS_MODE = getArg('steps') ?? 'all';
const SAVE = hasFlag('save');
const VALIDATE = hasFlag('validate');
const VALIDATE_FULL = hasFlag('validate-full');
const REPAIR = hasFlag('repair');
const EXPLAIN = hasFlag('explain');
const MAX_REPAIR_CYCLES = 3;

// ═══════════════════════════════════════════════════════════════
//  INLINED CORE: callClaude + fillTemplate
// ═══════════════════════════════════════════════════════════════

const client = new Anthropic();

interface CallClaudeResult<T> { data: T; tokensUsed: number; rawText: string; }

async function callClaude<T extends z.ZodType>(opts: {
  systemPrompt: string; userMessage: string; outputSchema: T;
  model?: string; maxTokens?: number;
}): Promise<CallClaudeResult<z.infer<T>>> {
  const { systemPrompt, userMessage, outputSchema, model = 'claude-sonnet-4-20250514', maxTokens = 4096 } = opts;
  const systemWithJson = `${systemPrompt}\n\nIMPORTANT: You MUST respond with valid JSON only. No markdown, no code fences, no explanation — just the raw JSON object.`;
  let lastRawResponse: string | undefined;
  let lastError: string | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    const messages: Anthropic.MessageParam[] = [];
    if (attempt === 0) {
      messages.push({ role: 'user', content: userMessage });
    } else {
      messages.push(
        { role: 'user', content: userMessage },
        { role: 'assistant', content: lastRawResponse! },
        { role: 'user', content: `Your previous response failed JSON validation:\n${lastError}\n\nPlease fix the JSON and respond again. Output ONLY valid JSON.` },
      );
    }
    const response = await client.messages.create({ model, max_tokens: maxTokens, system: systemWithJson, messages });
    const rawText = response.content.filter((b): b is Anthropic.TextBlock => b.type === 'text').map(b => b.text).join('');
    lastRawResponse = rawText;
    const tokensUsed = (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0);
    const cleaned = rawText.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    let parsed: unknown;
    try { parsed = JSON.parse(cleaned); } catch {
      lastError = `Invalid JSON: ${cleaned.slice(0, 200)}...`;
      if (attempt === 1) throw new Error(`Claude returned invalid JSON after 2 attempts: ${lastError}`);
      continue;
    }
    const result = outputSchema.safeParse(parsed);
    if (result.success) return { data: result.data, tokensUsed, rawText: cleaned };
    lastError = JSON.stringify(result.error.issues, null, 2);
    if (attempt === 1) throw new Error(`Schema validation failed after 2 attempts:\n${lastError}`);
  }
  throw new Error('callClaude: unexpected loop exit');
}

function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    if (!(key in vars)) throw new Error(`Missing template variable: {{${key}}}`);
    return vars[key];
  });
}

// ═══════════════════════════════════════════════════════════════
//  ZOD SCHEMAS
// ═══════════════════════════════════════════════════════════════

const algorithmCardSchema = z.object({
  entry_presentation: z.string().min(10), competing_paths: z.array(z.string()).min(2),
  hinge_feature: z.string().min(1), correct_action: z.string().min(1),
  contraindications: z.array(z.string()), source_citations: z.array(z.string()).min(1),
  time_horizon: z.string().nullable().optional(), severity_markers: z.array(z.string()).nullable().optional(),
});
const factRowSchema = z.object({
  fact_type: z.enum(['threshold', 'drug_choice', 'contraindication', 'diagnostic_criterion', 'risk_factor', 'complication', 'management_step']),
  fact_text: z.string().min(1), threshold_value: z.string().nullable().optional(),
  source_name: z.string().min(1), source_tier: z.enum(['A', 'B', 'C']), confidence: z.enum(['high', 'moderate', 'low']),
});
const algorithmExtractorOutputSchema = z.object({
  algorithm_card: algorithmCardSchema, fact_rows: z.array(factRowSchema).min(3).max(6),
});
const casePlanSchema = z.object({
  // REQUIRED: Structured generation fields
  cognitive_operation_type: z.enum(['rule_application', 'threshold_recognition', 'diagnosis_disambiguation', 'management_sequencing', 'risk_stratification']),
  transfer_rule_text: z.string().min(10),
  hinge_depth_target: z.enum(['surface', 'moderate', 'deep']),
  // REQUIRED: Decision fork constraint
  decision_fork_type: z.enum(['competing_diagnoses', 'management_tradeoff', 'contraindication', 'timing_decision', 'severity_ambiguity']),
  decision_fork_description: z.string().min(10),
  option_action_class: z.string().min(1),
  // Ontology targets
  target_cognitive_error: z.string().min(1),  // REQUIRED, not optional
  target_hinge_clue_type: z.string().optional(),
  target_action_class: z.string().optional(),
  // Difficulty
  ambiguity_level: z.number().int().min(1).max(5), distractor_strength: z.number().int().min(1).max(5),
  clinical_complexity: z.number().int().min(1).max(5),
  // Strategy
  ambiguity_strategy: z.string().nullable().optional(),
  distractor_design: z.record(z.string(), z.unknown()).nullable().optional(),
  final_decisive_clue: z.string().nullable().optional(), explanation_teaching_goal: z.string().nullable().optional(),
  // Option frames (passed through from blueprint, not generated by case planner)
  option_frames: z.array(z.object({ id: z.string(), meaning: z.string() })).optional(),
  correct_option_frame_id: z.string().optional(),
});
const questionSkeletonSchema = z.object({
  case_summary: z.string().min(10), hidden_target: z.string().min(1), correct_action: z.string().min(1),
  option_action_class: z.string().min(1),  // ALL options must be from this class
  option_frames: z.array(z.object({
    id: z.enum(['A', 'B', 'C', 'D', 'E']), class: z.string().min(1),
    meaning: z.string().min(5),
    cognitive_error_id: z.string().nullable().optional(),
  })).length(5),
  correct_option_frame_id: z.enum(['A', 'B', 'C', 'D', 'E']),
  error_mapping: z.record(z.string(), z.string()).nullable().optional(),
  // REQUIRED hinge specification
  hinge_placement: z.string().min(1),
  hinge_description: z.string().min(1),
  hinge_depth: z.enum(['surface', 'moderate', 'deep']),
  hinge_buried_by: z.string().min(1),
});
const itemPlanSchema = z.object({
  target_hinge: z.string().min(1), competing_options: z.array(z.string()).min(4).max(5),
  target_cognitive_error: z.string().min(1), noise_elements: z.array(z.string()).min(1),
  option_class: z.string().min(1), distractor_rationale: z.string().min(10), lead_in: z.string().min(1),
});
const itemDraftSchema = z.object({
  vignette: z.string().min(50), stem: z.string().min(10),
  choice_a: z.string().min(1), choice_b: z.string().min(1), choice_c: z.string().min(1),
  choice_d: z.string().min(1), choice_e: z.string().min(1),
  correct_answer: z.enum(['A', 'B', 'C', 'D', 'E']),
  why_correct: z.string().min(10),
  why_wrong_a: z.string().nullable().optional(), why_wrong_b: z.string().nullable().optional(),
  why_wrong_c: z.string().nullable().optional(), why_wrong_d: z.string().nullable().optional(),
  why_wrong_e: z.string().nullable().optional(),
  high_yield_pearl: z.string().nullable().optional(), reasoning_pathway: z.string().nullable().optional(),
  decision_hinge: z.string().nullable().optional(), competing_differential: z.string().nullable().optional(),
});
const validatorReportSchema = z.object({
  passed: z.boolean(), score: z.number().min(0).max(10),
  issues_found: z.array(z.string()), repair_instructions: z.string().nullable().optional(),
});
const explanationOutputSchema = z.object({
  why_correct: z.string().min(10),
  why_wrong_a: z.string().nullable().optional(), why_wrong_b: z.string().nullable().optional(),
  why_wrong_c: z.string().nullable().optional(), why_wrong_d: z.string().nullable().optional(),
  why_wrong_e: z.string().nullable().optional(),
  high_yield_pearl: z.string().min(10), reasoning_pathway: z.string().min(10),
  explanation_decision_logic: z.string().nullable().optional(),
  explanation_transfer_rule: z.string().nullable().optional(),
  explanation_teaching_pearl: z.string().nullable().optional(),
});

// ═══════════════════════════════════════════════════════════════
//  SEED DATA
// ═══════════════════════════════════════════════════════════════

const BLUEPRINT_NODES: Record<string, Record<string, string>> = {
  'Acute Coronary Syndrome': { shelf: 'medicine', system: 'Cardiology', topic: 'Acute Coronary Syndrome', subtopic: 'STEMI', task_type: 'next_step', clinical_setting: 'ed', age_group: 'middle_aged', time_horizon: 'immediate', yield_tier: 'tier_1' },
  'Heart Failure': { shelf: 'medicine', system: 'Cardiology', topic: 'Heart Failure', subtopic: 'Acute Decompensated', task_type: 'next_step', clinical_setting: 'inpatient', age_group: 'elderly', time_horizon: 'hours', yield_tier: 'tier_1' },
  'Pneumonia': { shelf: 'medicine', system: 'Pulmonology', topic: 'Pneumonia', subtopic: 'Community-Acquired', task_type: 'management', clinical_setting: 'ed', age_group: 'elderly', time_horizon: 'hours', yield_tier: 'tier_1' },
  'Diabetic Ketoacidosis': { shelf: 'medicine', system: 'Endocrine', topic: 'Diabetic Ketoacidosis', subtopic: 'Initial Management', task_type: 'next_step', clinical_setting: 'ed', age_group: 'young_adult', time_horizon: 'immediate', yield_tier: 'tier_1' },
  'Pulmonary Embolism': { shelf: 'medicine', system: 'Pulmonology', topic: 'Pulmonary Embolism', subtopic: 'Diagnosis and Management', task_type: 'diagnosis', clinical_setting: 'ed', age_group: 'middle_aged', time_horizon: 'immediate', yield_tier: 'tier_1' },
  'GI Bleed': { shelf: 'medicine', system: 'Gastroenterology', topic: 'Gastrointestinal Bleeding', subtopic: 'Upper GI Bleed', task_type: 'next_step', clinical_setting: 'ed', age_group: 'elderly', time_horizon: 'immediate', yield_tier: 'tier_1' },
  'Acute Pancreatitis': { shelf: 'medicine', system: 'Gastroenterology', topic: 'Acute Pancreatitis', subtopic: 'Severity Assessment', task_type: 'management', clinical_setting: 'ed', age_group: 'middle_aged', time_horizon: 'hours', yield_tier: 'tier_1' },
  'Sepsis': { shelf: 'medicine', system: 'Infectious Disease', topic: 'Sepsis', subtopic: 'Initial Resuscitation', task_type: 'next_step', clinical_setting: 'ed', age_group: 'elderly', time_horizon: 'immediate', yield_tier: 'tier_1' },
  'Stroke': { shelf: 'medicine', system: 'Neurology', topic: 'Stroke', subtopic: 'Acute Ischemic', task_type: 'next_step', clinical_setting: 'ed', age_group: 'elderly', time_horizon: 'immediate', yield_tier: 'tier_1' },
  'Atrial Fibrillation': { shelf: 'medicine', system: 'Cardiology', topic: 'Atrial Fibrillation', subtopic: 'Rate vs Rhythm Control', task_type: 'management', clinical_setting: 'ed', age_group: 'elderly', time_horizon: 'hours', yield_tier: 'tier_1' },
};

const ERROR_TAXONOMY = [
  { error_name: 'premature_closure', definition: 'Accepting a diagnosis before it has been fully verified.', category: 'premature_closure', frequency_rank: 1 },
  { error_name: 'anchoring', definition: 'Over-relying on the first piece of information encountered.', category: 'premature_closure', frequency_rank: 2 },
  { error_name: 'wrong_algorithm_branch', definition: 'Correctly identifying the scenario but following the wrong management pathway.', category: 'next_step_error', frequency_rank: 3 },
  { error_name: 'under_triage', definition: 'Failing to recognize urgency or severity of a clinical situation.', category: 'severity_miss', frequency_rank: 4 },
  { error_name: 'over_testing', definition: 'Ordering unnecessary or premature diagnostic tests.', category: 'next_step_error', frequency_rank: 5 },
  { error_name: 'reflex_response_to_finding', definition: 'Automatically performing a standard action without considering full context.', category: 'next_step_error', frequency_rank: 6 },
  { error_name: 'treating_labs_instead_of_patient', definition: 'Treating an abnormal lab value rather than the clinical condition.', category: 'next_step_error', frequency_rank: 7 },
  { error_name: 'misreading_hemodynamic_status', definition: 'Misjudging hemodynamic stability based on incomplete vital sign interpretation.', category: 'severity_miss', frequency_rank: 8 },
  { error_name: 'skipping_required_diagnostic_step', definition: 'Jumping to treatment without a required confirmatory test.', category: 'next_step_error', frequency_rank: 9 },
  { error_name: 'premature_escalation', definition: 'Escalating care inappropriately when conservative management is indicated.', category: 'next_step_error', frequency_rank: 10 },
];

const HINGE_CLUE_TYPES = [
  { name: 'instability_clue', description: 'Vital sign or hemodynamic finding that changes urgency.' },
  { name: 'temporal_progression', description: 'Time course distinguishing acute from chronic.' },
  { name: 'contraindication', description: 'Finding that rules out an otherwise standard treatment.' },
  { name: 'lab_pattern', description: 'Lab value or pattern that pivots diagnosis or management.' },
  { name: 'imaging_discriminator', description: 'Imaging finding distinguishing competing diagnoses.' },
  { name: 'history_pivot', description: 'Historical detail that redirects the differential.' },
  { name: 'physical_exam_sign', description: 'Physical exam finding as key discriminator.' },
  { name: 'medication_side_effect', description: 'Drug effect explaining presentation or contraindicating next step.' },
  { name: 'age_specific_presentation', description: 'Age-dependent variation in disease presentation.' },
  { name: 'risk_factor_constellation', description: 'Combination of risk factors changing pre-test probability.' },
];

const ACTION_CLASSES = [
  { name: 'stabilize', priority_rank: 1, example: 'intubate, IV fluids for shock' },
  { name: 'diagnose_emergent', priority_rank: 2, example: 'STAT CT head, ECG for chest pain' },
  { name: 'treat_emergent', priority_rank: 3, example: 'tPA for stroke, PCI for STEMI' },
  { name: 'diagnose_standard', priority_rank: 4, example: 'colonoscopy, TSH for fatigue' },
  { name: 'confirm', priority_rank: 5, example: 'tissue biopsy, genetic testing' },
  { name: 'treat_standard', priority_rank: 6, example: 'metformin for T2DM, ACE-i for CHF' },
  { name: 'observe', priority_rank: 7, example: 'serial exams, repeat troponin in 6h' },
  { name: 'counsel', priority_rank: 8, example: 'smoking cessation, dietary changes' },
  { name: 'disposition', priority_rank: 9, example: 'admit to ICU, discharge with follow-up' },
];

// ═══════════════════════════════════════════════════════════════
//  PROMPT TEMPLATES — ALL AGENTS
// ═══════════════════════════════════════════════════════════════

const PROMPTS: Record<string, { system: string; user: string }> = {
  // ─── GENERATION AGENTS ───
  algorithm_extractor: {
    system: `You are a clinical algorithm architect for USMLE Step 2 CK. Given a medical topic, you construct the core decision algorithm that a test-taker must know.\n\nYour algorithm card must include:\n- Entry presentation: How the patient typically presents\n- Competing paths: At least 2 differential diagnosis pathways\n- Hinge feature: The single clinical finding that distinguishes the correct path\n- Correct action: The evidence-based next step in management\n- Contraindications: Actions that would be harmful\n- Source citations: Guidelines or evidence supporting this algorithm\n\nYou also produce 3-6 supporting fact rows — verified clinical micro-facts with source attribution.`,
    user: `Blueprint node:\n- Shelf: {{shelf}}\n- System: {{system}}\n- Topic: {{topic}}\n- Subtopic: {{subtopic}}\n- Task type: {{task_type}}\n- Clinical setting: {{clinical_setting}}\n- Age group: {{age_group}}\n- Time horizon: {{time_horizon}}\n\nConstruct the clinical decision algorithm and supporting facts. Return JSON with:\n- algorithm_card: { entry_presentation, competing_paths[], hinge_feature, correct_action, contraindications[], source_citations[] }\n- fact_rows: [{ fact_type, fact_text, threshold_value (or null), source_name, source_tier, confidence }] (3-6 facts)`,
  },

  case_planner: {
    system: `You are a reasoning-first case planner for USMLE Step 2 CK questions. You design the cognitive architecture of a question BEFORE any prose is written.

You MUST answer these 5 questions:

1. COGNITIVE OPERATION TYPE (REQUIRED — pick exactly one):
   - rule_application: Apply a known management rule to a specific scenario
   - threshold_recognition: Recognize when a value/finding crosses a decision threshold
   - diagnosis_disambiguation: Distinguish between competing diagnoses using hinge features
   - management_sequencing: Choose the correct next step in a clinical sequence
   - risk_stratification: Classify severity, urgency, or risk level correctly

2. TRANSFER RULE TEXT (REQUIRED):
   Format: "When [clinical pattern], always [correct action] before [tempting alternative]"
   This must be a generalizable principle that works across multiple scenarios.

3. HINGE DEPTH TARGET (REQUIRED — pick one):
   - surface: Hinge in last 1-2 sentences, easy to spot
   - moderate: Hinge mid-vignette, requires filtering noise
   - deep: Hinge early or embedded in a detail most readers skip

4. TARGET COGNITIVE ERROR (REQUIRED): Which specific error from the taxonomy this item exploits

5. DIFFICULTY: ambiguity_level, distractor_strength, clinical_complexity (1-5 each)

CRITICAL SAFETY RULES:
- Hard contraindications ALWAYS take precedence over heuristic rules
- Never design a question where a "clever" rule application leads to patient harm

ANTI-PROTOCOL-RECALL RULE:
- The question MUST test clinical JUDGMENT, not protocol APPLICATION
- The correct answer must require WEIGHING competing factors, not following a flowchart

DOMINANT PATHWAY RULE (NON-NEGOTIABLE):
- The case MUST have ONE clearly best answer. No scenario may result in multiple equally suboptimal choices.
- When a contraindication blocks the standard approach, the alternative becomes the dominant correct pathway — it is NOT "suboptimal," it is the ONLY correct choice.
- Example: STEMI + fibrinolytic contraindication → PCI transfer is dominant, regardless of delay. Do NOT frame PCI as "suboptimal due to timing."

DECISION FORK REQUIREMENT (CRITICAL):
- Every question MUST have a real decision fork — at least 2 plausible answers until the hinge resolves it
- If the diagnosis or management is obvious from the presentation alone, REJECT the design
- Pick one fork type:
  * competing_diagnoses: ≥2 diagnoses are plausible until the final hinge
  * management_tradeoff: ≥2 valid treatments; a patient-specific factor tips the balance
  * contraindication: Standard treatment is blocked by a patient factor; must choose alternative
  * timing_decision: When to act matters — emergent vs urgent vs conservative
  * severity_ambiguity: Same presentation could be mild or severe; a finding determines which

OPTION HOMOGENEITY REQUIREMENT:
- ALL 5 answer options MUST be from the SAME action class
- Pick ONE class: "management_steps" OR "diagnostic_tests" OR "medications" OR "diagnoses"
- Do NOT mix (e.g., medications + tests = REJECTED)`,
    user: `Blueprint node:\n{{blueprint_node}}\n\nAlgorithm card:\n{{algorithm_card}}\n\nSupporting facts:\n{{fact_rows}}\n\nError taxonomy:\n{{error_taxonomy}}\n\nHinge clue types:\n{{hinge_clue_types}}\n\nAction classes:\n{{action_classes}}\n\nNBME trap to avoid:\n{{nbme_trap}}\n\nKnown transfer rule for this topic:\n{{known_transfer_rule}}\n{{blueprint_constraint}}\n\nDesign a case plan. Return JSON with:\n- cognitive_operation_type: "rule_application"|"threshold_recognition"|"diagnosis_disambiguation"|"management_sequencing"|"risk_stratification" (REQUIRED)\n- transfer_rule_text: string in "When [pattern], always [action] before [alternative]" format (REQUIRED)\n- hinge_depth_target: "surface"|"moderate"|"deep" (REQUIRED)\n- decision_fork_type: "competing_diagnoses"|"management_tradeoff"|"contraindication"|"timing_decision"|"severity_ambiguity" (REQUIRED)\n- decision_fork_description: string describing the genuine ambiguity (REQUIRED, min 10 chars)\n- option_action_class: string — the single class ALL options must share (REQUIRED)\n- target_cognitive_error: string from error taxonomy (REQUIRED)\n- target_hinge_clue_type: string from hinge clue types\n- target_action_class: string from action classes\n- ambiguity_level: number (1-5)\n- distractor_strength: number (1-5)\n- clinical_complexity: number (1-5)\n- ambiguity_strategy: string\n- distractor_design: { [option]: reason_its_tempting }\n- final_decisive_clue: string\n- explanation_teaching_goal: string`,
  },

  skeleton_writer: {
    system: `You are a question skeleton architect for USMLE Step 2 CK. Before any prose is written, you construct the logical skeleton.

EVERY wrong option archetype MUST have a cognitive_error field — no nulls, no blanks.
Each wrong option MUST map to a DISTINCT cognitive error. Do not reuse errors across options.

HINGE SPECIFICATION is REQUIRED:
- hinge_placement: WHERE in the vignette the pivotal finding appears
- hinge_description: WHAT the pivotal finding is
- hinge_depth: Must match the case_plan's hinge_depth_target (surface/moderate/deep)
- hinge_buried_by: What noise or detail OBSCURES the hinge clue

The skeleton constrains the vignette writer — it cannot add options or change the hinge after this point.`,
    user: `Blueprint node:\n{{blueprint_node}}\n\nAlgorithm card:\n{{algorithm_card}}\n\nSupporting facts:\n{{fact_rows}}\n\nCase plan:\n{{case_plan}}\n\nDiscriminators (what distinguishes each competing diagnosis):\n{{discriminators}}\n\nBuild the question skeleton. Return JSON with:\n- case_summary: string\n- hidden_target: string\n- correct_action: string\n- option_action_class: string (REQUIRED — must match case_plan.option_action_class. ALL options including correct must be from this class)\n- option_frames: [{ id: "A"-"E", class: string (must match option_action_class), meaning: string (from case_plan — DO NOT CHANGE), cognitive_error_id: string or null (null for correct, REQUIRED for distractors) }] (exactly 5 items)\n- correct_option_frame_id: "A"-"E" (from case_plan)\n- error_mapping: { [letter]: cognitive_error_name }\n- hinge_placement: string (REQUIRED)\n- hinge_description: string (REQUIRED)\n- hinge_depth: "surface"|"moderate"|"deep" (REQUIRED, must match case_plan.hinge_depth_target)\n- hinge_buried_by: string (REQUIRED — what noise obscures the hinge)`,
  },

  item_planner: {
    system: `You are an NBME-style item architect. Given an algorithm card, facts, error taxonomy, and question skeleton, you design the blueprint for a single-best-answer question.\n\nYour plan must specify:\n- target_hinge: What clinical finding distinguishes the correct answer\n- competing_options: 5 answer choices, all from the same option class\n- target_cognitive_error: Which cognitive error this item exploits\n- noise_elements: 1-3 clinically plausible but irrelevant details\n- option_class: The category all options belong to\n- distractor_rationale: Why each wrong answer is tempting\n- lead_in: The specific question stem matched to the task type\n\nDesign principles:\n- Hinge in final 1-2 sentences\n- Wrong answers correct for a DIFFERENT scenario\n- Noise = real chart data\n- Target cognitive error makes the most common wrong answer feel right\n\nSTRICT OPTION SYMMETRY RULES (NBME Chapter 3):\n- ALL 5 options MUST be from the SAME action class (all medications, all tests, all management steps — NEVER mix)\n- All options must have PARALLEL grammatical structure (all start with verbs, or all are noun phrases)\n- All options must be at the SAME level of specificity (not mixing "aspirin 325mg" with "pain management")\n- The correct answer must NOT be longer than 1.3x the average distractor length\n- Each option should be 2-8 words. If the correct action needs elaboration, simplify it to match distractors\n- Options must be orderable (alphabetical, by urgency, or by invasiveness)\n- NEVER combine two actions in one option (e.g., "obtain cultures and start antibiotics" = TWO actions, split them)`,
    user: `Blueprint node:\n{{blueprint_node}}\n\nAlgorithm card:\n{{algorithm_card}}\n\nSupporting facts:\n{{fact_rows}}\n\nError taxonomy:\n{{error_taxonomy}}\n\nQuestion skeleton:\n{{question_skeleton}}\n\nDesign an item plan. Return JSON with:\n- target_hinge: string\n- competing_options: string[] (5 options)\n- target_cognitive_error: string\n- noise_elements: string[] (1-3 items)\n- option_class: string\n- distractor_rationale: string\n- lead_in: string`,
  },

  vignette_writer: {
    system: `You are an NBME-style vignette writer following "Constructing Written Test Questions" (4th ed., 2016).

VIGNETTE TEMPLATE (in order):
1. Age, gender
2. Site of care
3. Presenting complaint + duration
4. Patient history (only if relevant)
5. Physical findings
6. Diagnostic studies
7. Initial treatment, subsequent findings
-> The hinge MUST land in the FINAL 1-2 sentences.

COVER-THE-OPTIONS RULE: The stem must be answerable BEFORE seeing choices.

OPTION HOMOGENEITY (STRICTLY ENFORCED — VIOLATION = AUTOMATIC KILL):
- ALL 5 answer choices MUST be from the SAME action class specified in the question skeleton's option_action_class field
- If option_action_class = "reperfusion_strategies" → ALL options must be types of reperfusion (PCI, fibrinolytics, transfer for PCI, etc.)
- If option_action_class = "diagnostic_tests" → ALL options must be tests
- If option_action_class = "medications" → ALL options must be drugs
- NEVER mix: a diagnostic test with a treatment, a medication with a procedure, monitoring with intervention
- NEVER include an option that is clearly from a different category than the others
- If you cannot think of 5 plausible options from the SAME class, reduce to 4 options (A-D) rather than adding a mismatched option

RULES:
- Cold chart style — medical record, no teaching voice
- Maximum 120 words for vignette
- Use the lead-in from the item plan
- No "all of the above" or "none of the above"
- Don't telegraph the answer
- Include noise elements naturally
- Wrong answers plausible for a different scenario
- No isolated fact recall — require synthesis

LATE HINGE ENFORCEMENT:
- The distinguishing finding (hinge) MUST appear in the LAST 1-2 sentences
- Early sentences should be AMBIGUOUS — at least 2 choices plausible from the first half
- Structure: demographics -> setting -> complaint -> history -> vitals -> exam -> labs/imaging -> HINGE (last)

OPTION ABSTRACTION LEVEL RULE:
- ALL options must be at the SAME level of specificity
- BAD: "Administer alteplase 100mg IV" vs "Transfer patient" (one is drug-dose-route, other is action)
- GOOD: "Fibrinolytic therapy" vs "Transfer for primary PCI" vs "Medical management" vs "Observation" (all management-level)
- NEVER include drug names with doses when other options are general management actions
- If one option says "Administer [specific drug]", ALL options must say "Administer [specific drug]"

OPTION LENGTH RULE:
- Each option must be 2-8 words maximum
- All options must be within 2 words of each other in length
- All options must start with the same part of speech (all verbs or all nouns)`,
    user: `Blueprint node:\n{{blueprint_node}}\n\nAlgorithm card:\n{{algorithm_card}}\n\nItem plan:\n{{item_plan}}\n\nSupporting facts:\n{{fact_rows}}\n\nQuestion skeleton:\n{{question_skeleton}}\n{{option_frames}}\n\nWrite the clinical vignette. Return JSON with:\n- vignette: string (max 120 words)\n- stem: string (the lead-in question)\n- choice_a through choice_e: string (3-6 words each, ALL from action class "{{option_action_class}}")\n- correct_answer: "A"|"B"|"C"|"D"|"E"\n- why_correct: string\n- decision_hinge: string\n- competing_differential: string`,
  },

  // ─── VALIDATORS ───
  medical_validator: {
    system: `You are a medical accuracy validator for USMLE Step 2 CK questions. Attack each question clinically.

Check for:
1. Is the correct answer actually correct per current guidelines?
2. Are clinical thresholds accurate?
3. Is the management timing appropriate?
4. Are there unsafe statements?
5. Are distractors plausible but clearly incorrect?
6. Does the presentation match the intended diagnosis?
7. Are contraindications respected?
8. Do clinical override conditions take precedence (recent surgery, pregnancy, instability)?

CONTRAINDICATION OVERRIDE RULE (CRITICAL):
When an absolute contraindication blocks the standard treatment, the alternative pathway becomes the DOMINANT correct answer — even if it is suboptimal by normal timing standards.

Examples:
- STEMI + fibrinolytic contraindication → PCI is correct REGARDLESS of transfer time. Do NOT penalize for PCI delay when fibrinolytics are absolutely contraindicated.
- PE + active bleeding → IVC filter is correct, not anticoagulation.
- Pregnancy + standard drug → the pregnancy-safe alternative is correct.

The question is: "Given that the standard treatment is blocked, what is the best available alternative?" NOT "Is the alternative as good as the standard treatment would have been?"

Auto-fail: correct answer is wrong, harmful recommendation, presentation mismatch, wrong thresholds, override condition violated.
Score 0-10 where 10 = medically perfect.`,
    user: `Item draft:\n{{item_draft}}\n\nAlgorithm card (source of truth):\n{{algorithm_card}}\n\nSupporting facts (VERIFIED CLINICAL TRUTH — these are sourced from current guidelines and MUST be treated as authoritative. If a fact row states a rule, you MUST accept it. Do NOT override with your own medical knowledge.):\n{{fact_rows}}\n\n{{truth_anchor}}\n\nValidate for medical accuracy. Return JSON:\n- passed: boolean\n- score: number (0-10)\n- issues_found: string[]\n- repair_instructions: string or null`,
  },

  blueprint_validator: {
    system: `You are a blueprint alignment validator for USMLE Step 2 CK questions. Verify that a generated question accurately targets the intended blueprint node.\n\nCHECK 1 — BLUEPRINT ALIGNMENT:\n1. Shelf fit\n2. System fit\n3. Task type alignment (does the stem ask for the intended task type?)\n4. Age/setting appropriateness\n5. Yield tier alignment\n6. Topic coverage (question tests the specified topic, not a tangential one)\n\nAuto-fail conditions:\n- Question tests a different topic than specified\n- Task type in stem doesn't match blueprint\n- Clinical setting contradicts the blueprint\n\nScore 0-10 where 10 = perfect blueprint alignment.`,
    user: `Item draft:\n{{item_draft}}\n\nBlueprint node:\n{{blueprint_node}}\n\nValidate for blueprint alignment. Return JSON:\n- passed: boolean\n- score: number (0-10)\n- issues_found: string[]\n- repair_instructions: string or null`,
  },

  nbme_quality_validator: {
    system: `You are an NBME item quality validator per "Constructing Written Test Questions" (4th ed., 2016).\n\nCHECK 1 — ITEM STRUCTURE:\n1. Late hinge: distinguishing finding in final 1-2 sentences?\n2. Not obvious early\n3. Multiple plausible options before hinge\n4. Neutrality (no teaching voice)\n5. Cold chart style\n6. No classic buzzwords making answer trivially obvious\n7. Stem clarity\n8. Single best answer\n\nCHECK 2 — IRRELEVANT DIFFICULTY (Chapter 3):\n9. Options concise\n10. Numeric consistency\n11. No vague frequency terms\n12. No "none of the above"\n13. Homogeneous/parallel options\n14. No negative phrasing\n15. Logical option ordering\n\nCHECK 3 — TESTWISENESS FLAWS:\n16. No grammatical cues\n17. No collectively exhaustive subsets\n18. No absolute terms\n19. No length imbalance (correct answer NOT notably longer)\n20. No clang clues (stem word repeated only in correct answer)\n21. No convergence (correct answer NOT identifiable by counting shared elements)\n\nAuto-fail: answer obvious from first sentence, teaching voice, only 1 plausible option, early hinge, convergence, clang clue.\nScore 0-10 where 10 = publication-ready NBME quality.`,
    user: `Item draft:\n{{item_draft}}\n\nValidate for NBME quality. Return JSON:\n- passed: boolean\n- score: number (0-10)\n- issues_found: string[]\n- repair_instructions: string or null`,
  },

  option_symmetry_validator: {
    system: `You are an option symmetry validator for USMLE questions per NBME Chapter 3.

CHECK 1 — OPTION HOMOGENEITY:
1. Same action class (all medications, all tests, all diagnoses)
2. Same pathway family
3. Similar specificity level
4. Parallel grammatical structure

CHECK 2 — DISTRACTOR QUALITY:
5. No weak distractors (every wrong answer correct for a different scenario)
6. No impossible/absurd options
7. All options rank-orderable on correctness continuum

CHECK 3 — TESTWISENESS:
8. Length balance (correct NOT >1.5x average distractor length)
9. No convergence (correct NOT identifiable by counting shared terms)
10. No collectively exhaustive subset
11. Numeric format consistency
12. Neutral ordering

CONTRAINDICATION FORK EXCEPTION (READ CAREFULLY):
When the decision_fork_type is "contraindication", the options INTENTIONALLY span a management spectrum — from the standard treatment (which is blocked) to the correct alternative to conservative/delayed approaches. This is how real NBME questions test contraindication recognition.

In contraindication forks, options are VALID if:
- They all answer the same clinical question ("what do you do for this STEMI?")
- They represent a plausible spectrum of management aggressiveness
- The contraindicated option is included as a strong distractor (this is BY DESIGN, not an error)
- No option is clinically absurd or joke-level implausible

In contraindication forks, do NOT penalize for:
- "Mixed action classes" when options represent a management decision spectrum
- Mixing aggressive vs conservative approaches (that IS the decision being tested)
- Including the contraindicated treatment as a distractor

In contraindication forks, DO still check:
- Length balance across options
- No convergence or testwiseness flaws
- No grammatical inconsistency
- All options are clinically coherent responses to the scenario

Auto-fail (all fork types): absurd distractor, convergence, correct >2x shortest distractor.
Auto-fail (NON-contraindication only): mixed action classes.`,
    user: `Item draft:\n{{item_draft}}\n\nItem plan:\n{{item_plan}}\n\nDecision fork type: {{decision_fork_type}}\n\nValidate option symmetry. If decision_fork_type is "contraindication", apply the relaxed management-spectrum rules. Return JSON:\n- passed: boolean\n- score: number (0-10)\n- issues_found: string[]\n- repair_instructions: string or null`,
  },

  explanation_validator: {
    system: `You are an explanation quality validator for USMLE Step 2 CK questions.\n\nCheck for:\n1. Decision logic: Does why_correct explain REASONING, not just restate the answer?\n2. No diagnosis lecture: Avoids teaching the disease from scratch?\n3. Cognitive error labeling: Identifies what error leads to common wrong answers?\n4. Conciseness: Focused and board-useful?\n5. Why-wrong quality: Each why_wrong explains why tempting AND why wrong in THIS scenario?\n6. High-yield pearl: Genuinely high-yield and board-relevant?\n7. Reasoning pathway: Step-by-step clinical reasoning?\n\nAuto-fail: disease lecture instead of decision explanation, why_correct just restates answer, missing why_wrong, vague reasoning.\nScore 0-10 where 10 = publication-ready explanation.`,
    user: `Item draft:\n{{item_draft}}\n\nAlgorithm card:\n{{algorithm_card}}\n\nValidate explanations. Return JSON:\n- passed: boolean\n- score: number (0-10)\n- issues_found: string[]\n- repair_instructions: string or null`,
  },

  exam_translation_validator: {
    system: `You are an exam translation validator for USMLE Step 2 CK. You assess whether a question is a genuine board-style decision fork or disguised guideline recall.\n\nThis is the most critical quality gate. A question can be medically correct, well-formatted, and blueprint-aligned — and still fail here.\n\nYou are asking:\n1. DECISION or RECALL? Decision = "Given these findings, what do you DO?" Recall = "What is the most common cause of X?"\n2. Does the item test timing, priority, or branch choice?\n3. Is the hinge clinically meaningful but exam-compressed?\n4. Does it feel like something Step 2 CK would actually test?\n5. Are competing options genuinely competing?\n\nAuto-fail: guideline recall disguised as question, pathognomonic buzzword eliminates all ambiguity, only one plausible action, asks "what is" instead of "what do you do", correct answer determinable without hinge.\nScore 0-10 where 10 = perfect decision fork.`,
    user: `Item draft:\n{{item_draft}}\n\nAlgorithm card:\n{{algorithm_card}}\n\nBlueprint node:\n{{blueprint_node}}\n\nValidate as board-style decision fork. Return JSON:\n- passed: boolean\n- score: number (0-10)\n- issues_found: string[]\n- repair_instructions: string or null`,
  },

  // ─── REPAIR + EXPLANATION ───
  repair_agent: {
    system: `You are a targeted repair agent for USMLE Step 2 CK questions. You receive a failed item draft with all validator reports and must fix the specific issues.\n\nRULES:\n1. Make TARGETED repairs — do not regenerate the entire question\n2. Preserve what's working — only change what validators flagged\n3. Maintain all NBME formatting rules (cold chart style, late hinge, max 120 words)\n4. Address ALL flagged issues\n5. Priority: medical accuracy > blueprint alignment > NBME quality > option symmetry > explanation quality\n6. Keep the same option class and general structure unless validators require changing them\n\nReturn the complete updated item draft.`,
    user: `Failed item draft:\n{{item_draft}}\n\nValidator reports:\n{{validator_reports}}\n\nAlgorithm card:\n{{algorithm_card}}\n\nSupporting facts:\n{{fact_rows}}\n\nRepair the specific issues. Return complete JSON with all item draft fields:\n- vignette, stem, choice_a through choice_e, correct_answer\n- why_correct, why_wrong_a through why_wrong_e\n- high_yield_pearl, reasoning_pathway, decision_hinge, competing_differential`,
  },

  explanation_writer: {
    system: `You are an explanation writer for USMLE Step 2 CK questions. You write board-focused explanations that teach clinical decision-making.\n\nYour explanations must:\n1. why_correct: Explain the REASONING chain, not just "the answer is X because X"\n2. why_wrong for each incorrect option: Why it's tempting AND why it's wrong in THIS scenario\n3. high_yield_pearl: One sentence a student should memorize — discrete, testable\n4. reasoning_pathway: Step-by-step clinical reasoning from presentation to answer\n5. explanation_decision_logic: The core decision rule being tested\n6. explanation_transfer_rule: The generalizable principle (if applicable)\n7. explanation_teaching_pearl: What the student should take away for future questions\n\nStyle: Decision-focused, not disease-focused. Concise. Reference the cognitive error being tested. Board-useful.`,
    user: `Item draft:\n{{item_draft}}\n\nAlgorithm card:\n{{algorithm_card}}\n\nSupporting facts:\n{{fact_rows}}\n\nWrite comprehensive explanations. Return JSON:\n- why_correct: string (reasoning chain)\n- why_wrong_a through why_wrong_e: string or null\n- high_yield_pearl: string\n- reasoning_pathway: string\n- explanation_decision_logic: string or null\n- explanation_transfer_rule: string or null\n- explanation_teaching_pearl: string or null`,
  },
};

// ═══════════════════════════════════════════════════════════════
//  TERMINAL OUTPUT
// ═══════════════════════════════════════════════════════════════

const B = '\x1b[1m', D = '\x1b[2m', G = '\x1b[32m', Y = '\x1b[33m', C = '\x1b[36m', R = '\x1b[31m', M = '\x1b[35m', W = '\x1b[37m', X = '\x1b[0m';

function header(step: number | string, name: string) {
  console.log(`\n${B}${C}${'━'.repeat(60)}${X}`);
  console.log(`${B}${C}  STEP ${step}: ${name}${X}`);
  console.log(`${B}${C}${'━'.repeat(60)}${X}`);
}
function meta(tokens: number, ms: number) { console.log(`  ${D}Tokens: ${tokens.toLocaleString()} | Time: ${(ms / 1000).toFixed(1)}s${X}`); }
function kv(key: string, val: string | number | null | undefined) { if (val != null) console.log(`  ${Y}${key}:${X} ${val}`); }
function ok(msg: string) { console.log(`  ${G}${msg}${X}`); }
function fail(msg: string) { console.log(`  ${R}${msg}${X}`); }

// ═══════════════════════════════════════════════════════════════
//  PIPELINE
// ═══════════════════════════════════════════════════════════════

interface ValidatorResult { name: string; passed: boolean; score: number; issues: string[]; repair: string | null; tokens: number; ms: number; }

async function runStep<T extends z.ZodType>(
  step: number | string, name: string, agentType: string,
  templateVars: Record<string, string>, schema: T,
): Promise<{ data: z.infer<T>; tokens: number; ms: number }> {
  header(step, name);
  const prompt = PROMPTS[agentType];
  if (!prompt) throw new Error(`No prompt for agent: ${agentType}`);
  const userMessage = fillTemplate(prompt.user, templateVars);
  const start = Date.now();
  const result = await callClaude({ systemPrompt: prompt.system, userMessage, outputSchema: schema });
  const ms = Date.now() - start;
  meta(result.tokensUsed, ms);
  return { data: result.data, tokens: result.tokensUsed, ms };
}

async function runValidator(
  name: string, agentType: string, templateVars: Record<string, string>,
): Promise<ValidatorResult> {
  const prompt = PROMPTS[agentType];
  if (!prompt) throw new Error(`No prompt for validator: ${agentType}`);
  const userMessage = fillTemplate(prompt.user, templateVars);
  const start = Date.now();
  const result = await callClaude({ systemPrompt: prompt.system, userMessage, outputSchema: validatorReportSchema });
  const ms = Date.now() - start;
  return {
    name, passed: result.data.passed, score: result.data.score,
    issues: result.data.issues_found, repair: result.data.repair_instructions ?? null,
    tokens: result.tokensUsed, ms,
  };
}

function printQuestion(q: z.infer<typeof itemDraftSchema>) {
  console.log(`\n${B}${G}${'═'.repeat(60)}${X}`);
  console.log(`${B}${G}  GENERATED QUESTION${X}`);
  console.log(`${B}${G}${'═'.repeat(60)}${X}\n`);
  console.log(`${q.vignette}\n`);
  console.log(`${B}${q.stem}${X}\n`);
  for (const [letter, key] of [['A', 'choice_a'], ['B', 'choice_b'], ['C', 'choice_c'], ['D', 'choice_d'], ['E', 'choice_e']] as const) {
    const mark = letter === q.correct_answer ? `${G}${B}` : '';
    console.log(`  ${mark}${B}${letter}.${X} ${mark}${(q as Record<string, string>)[key]}${mark ? X : ''}`);
  }
  console.log(`\n  ${G}${B}Answer: ${q.correct_answer}${X}`);
  kv('Hinge', q.decision_hinge);
  kv('Differential', q.competing_differential);
  console.log(`  ${C}Why correct:${X} ${q.why_correct}`);
  for (const letter of ['a', 'b', 'c', 'd', 'e'] as const) {
    const val = (q as Record<string, string | null>)[`why_wrong_${letter}`];
    if (val) console.log(`  ${D}Why not ${letter.toUpperCase()}: ${val}${X}`);
  }
}

function printValidatorReport(results: ValidatorResult[]) {
  console.log(`\n${B}${M}${'═'.repeat(60)}${X}`);
  console.log(`${B}${M}  VALIDATOR REPORT CARD${X}`);
  console.log(`${B}${M}${'═'.repeat(60)}${X}\n`);
  const totalTokens = results.reduce((s, r) => s + r.tokens, 0);
  const totalMs = results.reduce((s, r) => s + r.ms, 0);
  console.log(`  ${D}6 validators | ${totalTokens.toLocaleString()} tokens | ${(totalMs / 1000).toFixed(1)}s${X}\n`);

  let allPassed = true;
  let autoKill = false;
  for (const r of results) {
    const icon = r.passed ? `${G}PASS${X}` : `${R}FAIL${X}`;
    const scoreColor = r.score >= 7 ? G : r.score >= 4 ? Y : R;
    console.log(`  ${icon} ${B}${r.name}${X} ${scoreColor}${r.score}/10${X}`);
    if (!r.passed) allPassed = false;
    if (r.name === 'Medical' && r.score < 3) autoKill = true;
    for (const issue of r.issues) console.log(`       ${R}- ${issue}${X}`);
  }

  console.log('');
  if (autoKill) {
    console.log(`  ${R}${B}VERDICT: AUTO-KILL (medical score < 3)${X}`);
  } else if (allPassed) {
    console.log(`  ${G}${B}VERDICT: ALL VALIDATORS PASSED${X}`);
  } else {
    const failCount = results.filter(r => !r.passed).length;
    console.log(`  ${Y}${B}VERDICT: ${failCount} VALIDATOR(S) FAILED — repairable${X}`);
  }
  return { allPassed, autoKill, totalTokens };
}

// ═══════════════════════════════════════════════════════════
//  OPTION SYMMETRY NORMALIZER (deterministic, no Claude)
// ═══════════════════════════════════════════════════════════

const VERB_SYNONYMS: Record<string, string[]> = {
  'Arrange': ['Coordinate', 'Organize', 'Initiate', 'Begin'],
  'Administer': ['Give', 'Provide', 'Deliver', 'Apply'],
  'Start': ['Begin', 'Initiate', 'Commence'],
  'Begin': ['Start', 'Initiate', 'Commence'],
  'Give': ['Administer', 'Provide', 'Deliver'],
  'Obtain': ['Order', 'Request', 'Perform'],
  'Order': ['Obtain', 'Request'],
  'Request': ['Obtain', 'Order', 'Arrange'],
  'Perform': ['Conduct', 'Complete', 'Execute'],
  'Initiate': ['Start', 'Begin', 'Commence'],
};

interface SymmetryCheck {
  valid: boolean;
  issues: string[];
  maxLengthRatio: number;
  repeatedFirstWords: string[];
}

function checkOptionSymmetry(options: string[]): SymmetryCheck {
  const issues: string[] = [];
  const lengths = options.map(o => o.length);
  const maxLen = Math.max(...lengths);
  const minLen = Math.min(...lengths);
  const ratio = minLen > 0 ? maxLen / minLen : 99;

  if (ratio > 1.8) {
    issues.push(`Length ratio ${ratio.toFixed(1)} exceeds 1.8 (${maxLen} vs ${minLen} chars)`);
  }

  // Check for repeated first words
  const firstWords = options.map(o => o.split(/\s+/)[0].toLowerCase());
  const wordCounts = new Map<string, number>();
  for (const w of firstWords) wordCounts.set(w, (wordCounts.get(w) ?? 0) + 1);
  const repeated = [...wordCounts.entries()].filter(([, c]) => c > 1).map(([w]) => w);
  if (repeated.length > 0) {
    issues.push(`Repeated first word(s): ${repeated.join(', ')}`);
  }

  return { valid: issues.length === 0, issues, maxLengthRatio: ratio, repeatedFirstWords: repeated };
}

function normalizeOptions(draft: z.infer<typeof itemDraftSchema>): z.infer<typeof itemDraftSchema> {
  const keys = ['choice_a', 'choice_b', 'choice_c', 'choice_d', 'choice_e'] as const;
  const options = keys.map(k => (draft as Record<string, string>)[k]);

  // Fix 1: Deduplicate first words using synonyms
  const firstWords = options.map(o => o.split(/\s+/)[0]);
  const seen = new Set<string>();
  const normalized = options.map((opt, i) => {
    const word = firstWords[i];
    const lower = word.toLowerCase();
    if (seen.has(lower)) {
      // Find a synonym not already used
      const syns = VERB_SYNONYMS[word] ?? VERB_SYNONYMS[word.charAt(0).toUpperCase() + word.slice(1)] ?? [];
      for (const syn of syns) {
        if (!seen.has(syn.toLowerCase())) {
          seen.add(syn.toLowerCase());
          return syn + opt.slice(word.length);
        }
      }
    }
    seen.add(lower);
    return opt;
  });

  // Fix 2: Strip drug doses/specifics if mixing abstraction levels
  // Detect: if any option has parenthetical or dose info but others don't
  const hasParens = normalized.map(o => /\(.*\)/.test(o) || /\d+\s*(mg|mcg|mL|units|IU)/i.test(o));
  const parenCount = hasParens.filter(Boolean).length;
  const stripped = parenCount > 0 && parenCount < 3
    ? normalized.map(o => o.replace(/\s*\(.*?\)/g, '').replace(/\s+\d+\s*(mg|mcg|mL|units|IU)\b/gi, '').trim())
    : normalized;

  const result = { ...draft };
  for (let i = 0; i < keys.length; i++) {
    (result as Record<string, string>)[keys[i]] = stripped[i];
  }
  return result;
}

const optionRewriteSchema = z.object({
  choice_a: z.string().min(1),
  choice_b: z.string().min(1),
  choice_c: z.string().min(1),
  choice_d: z.string().min(1),
  choice_e: z.string().min(1),
});

async function main() {
  const pipelineStart = Date.now();
  let totalTokens = 0;

  const topicKey = TOPIC_OVERRIDE ?? 'Acute Coronary Syndrome';
  const node = BLUEPRINT_NODES[topicKey];
  if (!node) {
    console.error(`Unknown topic: "${topicKey}". Available: ${Object.keys(BLUEPRINT_NODES).join(', ')}`);
    process.exit(1);
  }

  const flags = [VALIDATE && 'validate', VALIDATE_FULL && 'validate-full', REPAIR && 'repair', EXPLAIN && 'explain'].filter(Boolean).join(' + ');
  console.log(`\n${B}${M}${'═'.repeat(60)}${X}`);
  console.log(`${B}${M}  QUESTION FACTORY v2 — Terminal Mode${X}`);
  console.log(`${B}${M}  Topic: ${topicKey} | Steps: ${STEPS_MODE}${flags ? ` | ${flags}` : ''}${X}`);
  console.log(`${B}${M}${'═'.repeat(60)}${X}`);

  const nodeJson = JSON.stringify(node, null, 2);

  // ─── STEP 1: Algorithm Extraction (gold card or Claude) ───
  const goldCard = GOLD_CARDS.find(gc => gc.topic === topicKey);
  let card: z.infer<typeof algorithmCardSchema>;
  let facts: z.infer<typeof factRowSchema>[];

  if (goldCard) {
    header(1, 'Algorithm Card (GOLD — verified truth)');
    card = {
      entry_presentation: goldCard.entry_presentation,
      competing_paths: goldCard.competing_paths,
      hinge_feature: goldCard.hinge_feature,
      correct_action: goldCard.correct_action,
      contraindications: goldCard.contraindications,
      source_citations: goldCard.source_citations,
    };
    facts = goldCard.fact_rows;
    console.log(`  ${G}Using gold card: ${goldCard.topic} (0 tokens)${X}`);
    kv('Entry', card.entry_presentation.slice(0, 100));
    kv('Hinge', card.hinge_feature);
    kv('Action', card.correct_action);
    kv('Facts', `${facts.length} verified`);
    kv('Transfer rule', goldCard.transfer_rule);
    kv('NBME trap', goldCard.nbme_trap);
  } else {
    const extraction = await runStep(1, 'Algorithm Extractor', 'algorithm_extractor', {
      shelf: node.shelf, system: node.system, topic: node.topic, subtopic: node.subtopic,
      task_type: node.task_type, clinical_setting: node.clinical_setting,
      age_group: node.age_group, time_horizon: node.time_horizon,
    }, algorithmExtractorOutputSchema);
    totalTokens += extraction.tokens;
    card = extraction.data.algorithm_card;
    facts = extraction.data.fact_rows;
    kv('Entry', card.entry_presentation.slice(0, 100));
    kv('Hinge', card.hinge_feature);
    kv('Action', card.correct_action);
    kv('Facts', `${facts.length} extracted`);
  }

  if (STEPS_MODE === 'extract') { finish(totalTokens, pipelineStart); return; }

  const cardJson = JSON.stringify(card, null, 2);
  const factsJson = JSON.stringify(facts, null, 2);
  const errorsJson = JSON.stringify(ERROR_TAXONOMY, null, 2);
  const hingeJson = JSON.stringify(HINGE_CLUE_TYPES, null, 2);
  const actionJson = JSON.stringify(ACTION_CLASSES, null, 2);

  // ─── STEP 1.5: Blueprint Selection ───
  let selectedBlueprint: (typeof GOLD_CARDS)[number]['question_blueprints'][number] | null = null;
  if (goldCard && goldCard.question_blueprints.length > 0) {
    const bpIdx = BLUEPRINT_INDEX ?? Math.floor(Math.random() * goldCard.question_blueprints.length);
    selectedBlueprint = goldCard.question_blueprints[bpIdx];
    header('1.5', 'Blueprint Selection');
    console.log(`  ${G}Selected blueprint ${bpIdx}/${goldCard.question_blueprints.length - 1}${X}`);
    kv('Task type', selectedBlueprint.task_type);
    kv('Scenario', selectedBlueprint.scenario_seed);
    kv('Fork hinge', selectedBlueprint.hinge_clue);
    kv('Target error', selectedBlueprint.target_cognitive_error);
    kv('Transfer rule', selectedBlueprint.transfer_rule);
    kv('Confusion', selectedBlueprint.target_confusion.join(' vs '));
  }

  // ─── STEP 2: Case Planning ───
  // Build the binding blueprint constraint for the case planner
  const blueprintConstraint = selectedBlueprint
    ? `\n\nBINDING QUESTION BLUEPRINT (you MUST instantiate this exact fork — do NOT invent a different scenario):\n` +
      `- Scenario: ${selectedBlueprint.scenario_seed}\n` +
      `- Decision fork hinge: ${selectedBlueprint.hinge_clue}\n` +
      `- Target cognitive error: ${selectedBlueprint.target_cognitive_error}\n` +
      `- Transfer rule: ${selectedBlueprint.transfer_rule}\n` +
      `- Competing conditions: ${selectedBlueprint.target_confusion.join(', ')}\n` +
      `- Task type: ${selectedBlueprint.task_type}\n\n` +
      `Your case plan MUST be about this specific clinical scenario. Do NOT default to a "classic" presentation.`
    : '';

  const casePlan = await runStep(2, 'Case Planner', 'case_planner', {
    blueprint_node: nodeJson, algorithm_card: cardJson, fact_rows: factsJson,
    error_taxonomy: errorsJson, hinge_clue_types: hingeJson, action_classes: actionJson,
    nbme_trap: goldCard?.nbme_trap ?? 'No specific NBME trap defined for this topic.',
    known_transfer_rule: selectedBlueprint?.transfer_rule ?? goldCard?.transfer_rule ?? 'No known transfer rule — derive one from the algorithm card.',
    blueprint_constraint: blueprintConstraint,
  }, casePlanSchema);
  totalTokens += casePlan.tokens;
  kv('Cognitive op', casePlan.data.cognitive_operation_type);
  kv('Transfer rule', casePlan.data.transfer_rule_text);
  kv('Hinge depth', casePlan.data.hinge_depth_target);
  kv('Fork type', casePlan.data.decision_fork_type);
  kv('Fork desc', casePlan.data.decision_fork_description);
  kv('Option class', casePlan.data.option_action_class);
  kv('Error target', casePlan.data.target_cognitive_error);
  kv('Difficulty', `${casePlan.data.ambiguity_level}/${casePlan.data.distractor_strength}/${casePlan.data.clinical_complexity}`);

  if (STEPS_MODE === 'plan') { finish(totalTokens, pipelineStart); return; }

  const casePlanJson = JSON.stringify(casePlan.data, null, 2);

  // ─── STEP 3: Skeleton Writing ───
  const skeleton = await runStep(3, 'Skeleton Writer', 'skeleton_writer', {
    blueprint_node: nodeJson, algorithm_card: cardJson, fact_rows: factsJson, case_plan: casePlanJson,
    discriminators: goldCard ? JSON.stringify(goldCard.discriminators, null, 2) : 'No discriminators available — derive from algorithm card competing paths.',
  }, questionSkeletonSchema);
  totalTokens += skeleton.tokens;
  kv('Case', skeleton.data.case_summary);
  kv('Hidden target', skeleton.data.hidden_target);
  kv('Correct', skeleton.data.correct_action);
  kv('Hinge depth', skeleton.data.hinge_depth);
  kv('Buried by', skeleton.data.hinge_buried_by);
  for (const frame of skeleton.data.option_frames) {
    const marker = frame.id === skeleton.data.correct_option_frame_id ? '✓' : '✗';
    console.log(`    ${Y}${frame.id}${X} ${marker}: ${frame.meaning} ${D}(${frame.cognitive_error_id ?? 'correct'})${X}`);
  }

  if (STEPS_MODE === 'skeleton') { finish(totalTokens, pipelineStart); return; }

  const skeletonJson = JSON.stringify(skeleton.data, null, 2);

  // ─── STEP 4: Item Planning ───
  const itemPlan = await runStep(4, 'Item Planner', 'item_planner', {
    blueprint_node: nodeJson, algorithm_card: cardJson, fact_rows: factsJson,
    error_taxonomy: errorsJson, question_skeleton: skeletonJson,
  }, itemPlanSchema);
  totalTokens += itemPlan.tokens;
  kv('Hinge', itemPlan.data.target_hinge);
  kv('Error', itemPlan.data.target_cognitive_error);
  kv('Lead-in', itemPlan.data.lead_in);

  // ─── STEP 5: Vignette Writer ───
  const itemPlanJson = JSON.stringify(itemPlan.data, null, 2);
  const optionActionClass = skeleton.data.option_action_class ?? casePlan.data.option_action_class ?? 'management_steps';

  // Build option frames constraint if blueprint has pre-specified options
  const optionFramesConstraint = selectedBlueprint?.option_frames
    ? `\n\nPRE-SPECIFIED ANSWER OPTIONS (MANDATORY — use these EXACT meanings, do NOT invent alternatives):\n` +
      selectedBlueprint.option_frames.map(f => `${f.id}. ${f.meaning}`).join('\n') +
      `\n\nCorrect answer: ${selectedBlueprint.correct_option}\n` +
      `You MUST write exactly these 5 options as concise NBME choices (3-6 words each). Rewrite the meaning into polished clinical language. Do NOT add, remove, or substitute any option.`
    : '';

  const vignette = await runStep(5, 'Vignette Writer', 'vignette_writer', {
    blueprint_node: nodeJson, algorithm_card: cardJson, item_plan: itemPlanJson,
    fact_rows: factsJson, question_skeleton: skeletonJson,
    option_action_class: optionActionClass,
    option_frames: optionFramesConstraint,
  }, itemDraftSchema);
  totalTokens += vignette.tokens;

  let currentDraft = vignette.data;

  // ─── STEP 5.5: Option Symmetry Normalization ───
  const preCheck = checkOptionSymmetry([currentDraft.choice_a, currentDraft.choice_b, currentDraft.choice_c, currentDraft.choice_d, currentDraft.choice_e]);
  if (!preCheck.valid) {
    header('5.5', 'Option Symmetry Normalizer');
    console.log(`  ${Y}Pre-normalization issues:${X}`);
    for (const issue of preCheck.issues) console.log(`    ${Y}- ${issue}${X}`);

    // Step 1: Deterministic normalization
    currentDraft = normalizeOptions(currentDraft);
    const postCheck = checkOptionSymmetry([currentDraft.choice_a, currentDraft.choice_b, currentDraft.choice_c, currentDraft.choice_d, currentDraft.choice_e]);

    if (!postCheck.valid) {
      // Step 2: Ask Claude to rewrite ONLY the options (one retry)
      console.log(`  ${Y}Deterministic fix insufficient. Asking Claude to rewrite options only...${X}`);
      const rewriteResult = await callClaude({
        systemPrompt: `You rewrite ONLY the 5 answer choices for an NBME-style question. You do NOT change the vignette, stem, or correct answer.

RULES:
- All 5 options must be 3-6 words each
- All must be within 2 words of each other in length
- All must start with the same part of speech (all verbs or all nouns)
- All must be at the same abstraction level (all generic management actions, OR all specific drug names — never mixed)
- No two options may share the same first word
- The correct answer must remain option ${currentDraft.correct_answer}
- The medical content of each option must be preserved — only change phrasing, not meaning`,
        userMessage: `Vignette:\n${currentDraft.vignette}\n\nStem:\n${currentDraft.stem}\n\nCurrent options:\nA. ${currentDraft.choice_a}\nB. ${currentDraft.choice_b}\nC. ${currentDraft.choice_c}\nD. ${currentDraft.choice_d}\nE. ${currentDraft.choice_e}\n\nCorrect answer: ${currentDraft.correct_answer}\n\nRewrite ALL 5 options to have equal length, same structure, and same abstraction level. Return JSON with choice_a through choice_e only.`,
        outputSchema: optionRewriteSchema,
      });
      totalTokens += rewriteResult.tokensUsed;
      currentDraft = { ...currentDraft, ...rewriteResult.data };
      console.log(`  ${G}Options rewritten (${rewriteResult.tokensUsed} tokens)${X}`);
    } else {
      console.log(`  ${G}Deterministic normalization fixed all issues${X}`);
    }
  }

  printQuestion(currentDraft);

  // Build truth anchor for gold-card-generated items
  const truthAnchor = goldCard
    ? `TRUTH ANCHOR (from verified gold card — these rules are AUTHORITATIVE):\n` +
      `- Transfer rule: ${goldCard.transfer_rule}\n` +
      `- Escalation rule: ${goldCard.escalation_rule}\n` +
      `- NBME trap: ${goldCard.nbme_trap}\n` +
      `- Contraindications: ${goldCard.contraindications.join('; ')}\n\n` +
      `If the item's correct answer aligns with these verified rules, it IS medically correct. Do NOT penalize for guideline timing thresholds when a contraindication override is in effect.`
    : '';

  // ─── STEP 6: Validation ───
  if (VALIDATE && !VALIDATE_FULL) {
    // Single medical validator (backward compat)
    const v = await runValidator('Medical', 'medical_validator', {
      item_draft: JSON.stringify(currentDraft, null, 2), algorithm_card: cardJson, fact_rows: factsJson, truth_anchor: truthAnchor,
    });
    totalTokens += v.tokens;
    header(6, 'Medical Validator');
    meta(v.tokens, v.ms);
    if (v.passed) ok(`PASSED (${v.score}/10)`); else {
      fail(`FAILED (${v.score}/10)`);
      for (const i of v.issues) console.log(`    ${R}- ${i}${X}`);
    }
  }

  if (VALIDATE_FULL) {
    header(6, 'Full Validator Suite (6 validators in parallel)');
    const draftJson = JSON.stringify(currentDraft, null, 2);

    // Run all 6 in parallel
    const validatorStart = Date.now();
    const results = await Promise.all([
      runValidator('Medical', 'medical_validator', { item_draft: draftJson, algorithm_card: cardJson, fact_rows: factsJson, truth_anchor: truthAnchor }),
      runValidator('Blueprint', 'blueprint_validator', { item_draft: draftJson, blueprint_node: nodeJson }),
      runValidator('NBME Quality', 'nbme_quality_validator', { item_draft: draftJson }),
      runValidator('Option Symmetry', 'option_symmetry_validator', { item_draft: draftJson, item_plan: itemPlanJson, decision_fork_type: casePlan.data.decision_fork_type }),
      runValidator('Explanation', 'explanation_validator', { item_draft: draftJson, algorithm_card: cardJson }),
      runValidator('Exam Translation', 'exam_translation_validator', { item_draft: draftJson, algorithm_card: cardJson, blueprint_node: nodeJson }),
    ]);
    meta(results.reduce((s, r) => s + r.tokens, 0), Date.now() - validatorStart);

    let report = printValidatorReport(results);
    totalTokens += report.totalTokens;

    // ─── OPTION SYMMETRY HARD KILL ───
    // If option symmetry fails on first pass, the question design is wrong — don't try to repair
    // EXCEPTION: contraindication forks intentionally span management spectrum
    const symmetryResult = results.find(r => r.name === 'Option Symmetry');
    const isContraindicationFork = casePlan.data.decision_fork_type === 'contraindication';
    if (symmetryResult && !symmetryResult.passed && symmetryResult.score < 5 && !isContraindicationFork) {
      console.log(`\n  ${R}${B}OPTION SYMMETRY HARD KILL (score ${symmetryResult.score}/10 < 5)${X}`);
      console.log(`  ${R}Mixed action classes = bad question design, not fixable by repair${X}`);
      report.autoKill = true;
    } else if (symmetryResult && !symmetryResult.passed && isContraindicationFork) {
      console.log(`\n  ${Y}Option symmetry ${symmetryResult.score}/10 — contraindication fork (management spectrum allowed)${X}`);
    }

    // ─── REPAIR LOOP ───
    if (REPAIR && !report.allPassed && !report.autoKill) {
      for (let cycle = 1; cycle <= MAX_REPAIR_CYCLES; cycle++) {
        const failedValidators = results.filter(r => !r.passed);
        if (failedValidators.length === 0) break;

        header(`7.${cycle}`, `Repair Cycle ${cycle}/${MAX_REPAIR_CYCLES}`);
        const reportsForRepair = failedValidators.map(r =>
          `[${r.name}] Score: ${r.score}/10\nIssues: ${r.issues.join('; ')}\nRepair: ${r.repair ?? 'none'}`
        ).join('\n\n');

        const repairResult = await runStep(`7.${cycle}`, 'Repair Agent', 'repair_agent', {
          item_draft: JSON.stringify(currentDraft, null, 2),
          validator_reports: reportsForRepair,
          algorithm_card: cardJson,
          fact_rows: factsJson,
        }, itemDraftSchema);
        totalTokens += repairResult.tokens;
        currentDraft = repairResult.data;

        console.log(`  ${D}Re-validating repaired draft...${X}`);
        const revalidateStart = Date.now();
        const reResults = await Promise.all([
          runValidator('Medical', 'medical_validator', { item_draft: JSON.stringify(currentDraft, null, 2), algorithm_card: cardJson, fact_rows: factsJson }),
          runValidator('Blueprint', 'blueprint_validator', { item_draft: JSON.stringify(currentDraft, null, 2), blueprint_node: nodeJson }),
          runValidator('NBME Quality', 'nbme_quality_validator', { item_draft: JSON.stringify(currentDraft, null, 2) }),
          runValidator('Option Symmetry', 'option_symmetry_validator', { item_draft: JSON.stringify(currentDraft, null, 2), item_plan: itemPlanJson, decision_fork_type: casePlan.data.decision_fork_type }),
          runValidator('Explanation', 'explanation_validator', { item_draft: JSON.stringify(currentDraft, null, 2), algorithm_card: cardJson }),
          runValidator('Exam Translation', 'exam_translation_validator', { item_draft: JSON.stringify(currentDraft, null, 2), algorithm_card: cardJson, blueprint_node: nodeJson }),
        ]);
        meta(reResults.reduce((s, r) => s + r.tokens, 0), Date.now() - revalidateStart);

        report = printValidatorReport(reResults);
        totalTokens += report.totalTokens;

        // Update results array for next cycle
        for (let i = 0; i < results.length; i++) {
          results[i] = reResults[i];
        }

        if (report.allPassed) {
          ok('Repair successful!');
          printQuestion(currentDraft);
          break;
        }
        if (report.autoKill) {
          fail('Auto-killed after repair — medical score < 3');
          break;
        }
        if (cycle === MAX_REPAIR_CYCLES) {
          fail(`Max repair cycles (${MAX_REPAIR_CYCLES}) reached — item killed`);
        }
      }
    }
  }

  // ─── STEP 8: Explanation Writer ───
  if (EXPLAIN) {
    const explResult = await runStep(8, 'Explanation Writer', 'explanation_writer', {
      item_draft: JSON.stringify(currentDraft, null, 2),
      algorithm_card: cardJson,
      fact_rows: factsJson,
    }, explanationOutputSchema);
    totalTokens += explResult.tokens;

    const expl = explResult.data;
    console.log(`\n${B}${C}  STRUCTURED EXPLANATION${X}`);
    console.log(`  ${C}Why correct:${X} ${expl.why_correct}`);
    for (const letter of ['a', 'b', 'c', 'd', 'e'] as const) {
      const val = (expl as Record<string, string | null>)[`why_wrong_${letter}`];
      if (val) console.log(`  ${Y}Why not ${letter.toUpperCase()}:${X} ${val}`);
    }
    console.log(`  ${G}Pearl:${X} ${expl.high_yield_pearl}`);
    console.log(`  ${C}Reasoning:${X} ${expl.reasoning_pathway}`);
    if (expl.explanation_decision_logic) console.log(`  ${M}Decision logic:${X} ${expl.explanation_decision_logic}`);
    if (expl.explanation_transfer_rule) console.log(`  ${M}Transfer rule:${X} ${expl.explanation_transfer_rule}`);
    if (expl.explanation_teaching_pearl) console.log(`  ${M}Teaching pearl:${X} ${expl.explanation_teaching_pearl}`);

    // Merge explanation into draft for saving
    currentDraft = { ...currentDraft, ...expl };
  }

  // ─── Save ───
  if (SAVE) {
    const fullOutput = {
      topic: topicKey, node, algorithm_card: card, facts,
      case_plan: casePlan.data, skeleton: skeleton.data, item_plan: itemPlan.data,
      question: currentDraft,
      meta: { totalTokens, totalMs: Date.now() - pipelineStart, timestamp: new Date().toISOString() },
    };
    const outDir = path.resolve('scripts/output');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.resolve(outDir, `question-${Date.now()}.json`);
    fs.writeFileSync(outPath, JSON.stringify(fullOutput, null, 2));
    console.log(`\n  ${G}Saved to ${outPath}${X}`);
  }

  finish(totalTokens, pipelineStart);
}

function finish(tokens: number, start: number) {
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n${D}${'─'.repeat(60)}${X}`);
  console.log(`${D}  Total: ${tokens.toLocaleString()} tokens | ${elapsed}s${X}`);
  console.log(`${D}${'─'.repeat(60)}${X}\n`);
}

main().catch((err) => {
  console.error(`\n${R}FATAL: ${err.message}${X}`);
  if (err.stack) console.error(`${D}${err.stack}${X}`);
  process.exit(1);
});
