import { z } from 'zod';

// ─── Visual Contract (every spec carries this) ───
export const visualContractSchema = z.object({
  supports: z.enum(['testing', 'explanation', 'both']),
  teaching_goal: z.string().max(120),
  tested_hinge: z.string().max(120).optional(),
  source_refs: z.array(z.string()).min(1),
});

export type VisualContract = z.infer<typeof visualContractSchema>;

// ─── Comparison Table ───
export const comparisonTableSpecSchema = z.object({
  type: z.literal('comparison_table'),
  title: z.string().max(80),
  columns: z.array(z.string().max(80)).min(2).max(5),
  rows: z.array(z.object({
    label: z.string().max(80),
    values: z.array(z.string()),
    isDiscriminating: z.boolean().optional(),
  })).min(2).max(10),
  highlightColumn: z.number().optional(),
  visual_contract: visualContractSchema,
});

// ─── Severity Ladder ───
export const severityLadderSpecSchema = z.object({
  type: z.literal('severity_ladder'),
  title: z.string().max(80),
  classification: z.string().max(80),
  rungs: z.array(z.object({
    level: z.string().max(40),
    severity: z.enum(['critical', 'high', 'moderate', 'low']),
    criteria: z.array(z.string().max(80)).min(1).max(3),
    management: z.string().max(80),
    isPatientHere: z.boolean().optional(),
  })).min(2).max(6),
  visual_contract: visualContractSchema,
});

// ─── Management Algorithm ───
export const managementAlgorithmSpecSchema = z.object({
  type: z.literal('management_algorithm'),
  title: z.string().max(80),
  nodes: z.array(z.object({
    id: z.string(),
    label: z.string().max(80),
    nodeType: z.enum(['start', 'decision', 'action', 'outcome']),
  })).max(12),
  edges: z.array(z.object({
    from: z.string(),
    to: z.string(),
    label: z.string().max(40).optional(),
  })).max(20),
  visual_contract: visualContractSchema,
});

// ─── Timeline ───
export const timelineSpecSchema = z.object({
  type: z.literal('timeline'),
  title: z.string().max(80),
  events: z.array(z.object({
    time: z.string().max(40),
    label: z.string().max(80),
    detail: z.string().max(100).optional(),
    isCurrentPhase: z.boolean().optional(),
  })).min(2).max(8),
  visual_contract: visualContractSchema,
});

// ─── Diagnostic Funnel ───
export const diagnosticFunnelSpecSchema = z.object({
  type: z.literal('diagnostic_funnel'),
  title: z.string().max(80),
  stages: z.array(z.object({
    label: z.string().max(80),
    items: z.array(z.string().max(60)).max(5),
    narrowsTo: z.string().max(80).optional(),
  })).min(2).max(5),
  visual_contract: visualContractSchema,
});

// ─── Distractor Breakdown ───
export const distractorBreakdownSpecSchema = z.object({
  type: z.literal('distractor_breakdown'),
  title: z.string().max(80),
  distractors: z.array(z.object({
    letter: z.enum(['A', 'B', 'C', 'D', 'E']),
    option: z.string().max(80),
    whyTempting: z.string().max(120),
    whyWrong: z.string().max(120),
    cognitiveError: z.string().max(60),
  })).min(3).max(4),
  visual_contract: visualContractSchema,
});

// ─── Discriminated Union ───
export const visualSpecSchema = z.discriminatedUnion('type', [
  comparisonTableSpecSchema,
  severityLadderSpecSchema,
  managementAlgorithmSpecSchema,
  timelineSpecSchema,
  diagnosticFunnelSpecSchema,
  distractorBreakdownSpecSchema,
]);

export type VisualSpec = z.infer<typeof visualSpecSchema>;
export type ComparisonTableSpec = z.infer<typeof comparisonTableSpecSchema>;
export type SeverityLadderSpec = z.infer<typeof severityLadderSpecSchema>;
export type ManagementAlgorithmSpec = z.infer<typeof managementAlgorithmSpecSchema>;
export type TimelineSpec = z.infer<typeof timelineSpecSchema>;
export type DiagnosticFunnelSpec = z.infer<typeof diagnosticFunnelSpecSchema>;
export type DistractorBreakdownSpec = z.infer<typeof distractorBreakdownSpecSchema>;

export type VisualRequirementType = VisualSpec['type'] | 'ekg_strip' | 'none';
export type AssetMode = 'deterministic_render' | 'curated_image' | 'ai_overlay';
