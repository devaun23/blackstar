// NBME Lead-in Templates by Task Competency
// Source: NBME Item-Writing Guide, 6th ed., October 2024, Appendix B.
// Full text at docs/nbme-item-writing-guide-2024.md.
//
// These are the authoritative NBME lead-in phrasings, organized by Blackstar's TaskType
// enum. When the case_planner / blueprint_selector assigns a task_type to a new item,
// vignette_writer injects the matching lead-in list so Claude picks from NBME-sanctioned
// phrasings verbatim, instead of paraphrasing.
//
// Why this matters: lead-in phrasing is the single most distinctive NBME style signal.
// Generated items with "What is the diagnosis for this patient?" instead of "Which of
// the following is the most likely diagnosis?" read as AI-generated to any board student.

import type { TaskType } from '@/lib/types/database';

interface LeadInGroup {
  /** Short competency label shown in the prompt header. */
  competency: string;
  /** Ordered list of authoritative NBME lead-ins — pick one verbatim. */
  lead_ins: string[];
  /** 1-line usage note — when to pick this competency's lead-ins. */
  usage: string;
}

/**
 * Map Blackstar TaskType → one or more NBME competency groups.
 * Some task types span multiple Appendix B sections (e.g. next_step covers both
 * pharmacotherapy AND clinical interventions). In those cases multiple groups
 * are returned so the vignette_writer can pick the best-fitting lead-in based
 * on context (drug options vs. procedural options).
 */
const TASK_TYPE_TO_LEAD_INS: Record<TaskType, LeadInGroup[]> = {
  diagnosis: [
    {
      competency: 'Formulating the Diagnosis',
      usage: 'Use when the item asks the test-taker to name the condition.',
      lead_ins: [
        'Which of the following is the most likely diagnosis?',
        'Which of the following is the most likely working diagnosis?',
        'Which of the following best explains these findings?',
        'Which of the following infectious agents is the most likely cause of this patient\'s pneumonia?',
      ],
    },
    {
      competency: 'Causes and Mechanisms (when the item asks for the etiology/mechanism rather than a disease name)',
      usage: 'Use when the item is testing WHY the condition happened, not WHAT it is.',
      lead_ins: [
        'Which of the following is the most likely cause/mechanism of this effect?',
        'Which of the following is the most likely underlying cause of this patient\'s condition?',
        'Which of the following is the most likely explanation for this patient\'s condition?',
        'Which of the following pathogens is the most likely cause of this patient\'s condition?',
        'Which of the following is the most likely infectious agent?',
      ],
    },
  ],

  diagnostic_test: [
    {
      competency: 'Selecting and Interpreting Laboratory and Diagnostic Studies',
      usage: 'Use when the test-taker must choose or interpret a study.',
      lead_ins: [
        'Which of the following is the most appropriate diagnostic study at this time?',
        'Which of the following is the most appropriate initial diagnostic study?',
        'Which of the following is the most appropriate next step in evaluation?',
        'Which of the following studies is most likely to establish a diagnosis?',
        'Which of the following laboratory studies is most likely to confirm the diagnosis?',
        'Which of the following is the most likely explanation for these laboratory findings?',
      ],
    },
    {
      competency: 'Obtaining and Predicting History and Physical',
      usage: 'Use when the next step is additional history or physical exam, not a lab/imaging study.',
      lead_ins: [
        'It is most appropriate to obtain specific additional history regarding which of the following?',
        'It is most appropriate to direct the physical examination toward which of the following?',
        'The remainder of the physical examination is most likely to show which of the following?',
      ],
    },
  ],

  next_step: [
    {
      competency: 'Clinical Interventions / Treatments (non-acute)',
      usage: 'Use when the question asks for the next management step in a stable or outpatient scenario.',
      lead_ins: [
        'Which of the following is the most appropriate next step in management?',
        'Which of the following is the most appropriate initial management?',
        'Which of the following is the most appropriate management?',
        'Which of the following is the most appropriate next step following treatment?',
        'Which of the following is the most appropriate next step in monitoring this patient?',
      ],
    },
    {
      competency: 'Pharmacotherapy',
      usage: 'Use when the options are all drugs (or include "No pharmacotherapy at this time").',
      lead_ins: [
        'Which of the following is the most appropriate pharmacotherapy at this time?',
        'The most appropriate next step is to administer which of the following?',
        'Which of the following is the most appropriate next step in pharmacotherapy?',
        'The most appropriate medication for this patient will have which of the following mechanisms of action?',
      ],
    },
    {
      competency: 'Surgical / Procedural Management',
      usage: 'Use when options are surgical procedures or the decision is operative.',
      lead_ins: [
        'Which of the following is the most appropriate surgical management?',
        'Which of the following findings in this patient indicates the need for surgical intervention/intubation/transplantation/admission to another department?',
        'Which of the following is the most appropriate preoperative preparation?',
        'Which of the following is the most appropriate postoperative management?',
      ],
    },
  ],

  stabilization: [
    {
      competency: 'Immediate / Emergency Management',
      usage: 'Use in life-threatening emergencies or cases of potential organ failure.',
      lead_ins: [
        'Which of the following is the most appropriate immediate management?',
        'Which of the following is the most appropriate initial management?',
        'Which of the following is the most appropriate next step in management?',
        'Which of the following is the priority in management?',
        'Which of the following is the first priority in caring for this patient?',
        'Which of the following is the most critical factor in formulating a management plan for this patient?',
      ],
    },
  ],

  risk_identification: [
    {
      competency: 'Health Maintenance / Disease Prevention',
      usage: 'Use when the item tests which risk to watch for, or which prevention is appropriate.',
      lead_ins: [
        'For which of the following conditions is this patient at greatest risk?',
        'It is most appropriate to counsel this patient that he/she is at greatest risk for which of the following?',
        'If untreated, this patient is at greatest risk for which of the following disorders?',
        'Which of the following factors in this patient\'s history most increased the risk for developing this condition?',
        'Which of the following is most likely to have prevented this condition?',
        'Which of the following is the strongest predisposing factor in this patient for developing a chronic condition?',
        'Which of the following is the most appropriate screening test for this patient at this time?',
      ],
    },
    {
      competency: 'Preventive Intervention / Vaccination',
      usage: 'Use when the item asks which preventive measure to recommend or administer.',
      lead_ins: [
        'Which of the following vaccines is most appropriate to administer at this time?',
        'Which of the following is the most appropriate intervention?',
        'Early treatment with which of the following is most likely to have prevented this patient\'s condition?',
        'Which of the following is the most appropriate next step in management to prevent [morbidity/mortality/disability]?',
      ],
    },
  ],

  complication_recognition: [
    {
      competency: 'Determining Prognosis / Outcome',
      usage: 'Use when the item asks what will happen next or what complication will develop.',
      lead_ins: [
        'Based on these findings, this patient is most likely to develop which of the following?',
        'Which of the following is the most likely complication of this patient\'s current condition?',
        'Without treatment, which of the following is most likely to develop in this patient?',
        'Which of the following is the most likely clinical course for this patient?',
      ],
    },
    {
      competency: 'Recognizing Associated Conditions',
      usage: 'Use when the item asks for an associated finding or comorbidity.',
      lead_ins: [
        'Which of the following factors in this patient\'s history most strongly indicates a poor/good prognosis?',
        'It is most appropriate to inform this patient of which of the following risk factors?',
      ],
    },
  ],
};

/**
 * Return the flat list of NBME-authoritative lead-ins for a given task type.
 * Useful when the caller wants to sample or log.
 */
export function getNbmeLeadIns(taskType: TaskType): string[] {
  const groups = TASK_TYPE_TO_LEAD_INS[taskType];
  if (!groups) return [];
  return groups.flatMap((g) => g.lead_ins);
}

/**
 * Render a prompt-ready block of authoritative NBME lead-ins for the given task type.
 * Returns an empty string when no templates exist for the task type (defensive).
 *
 * The block includes: a header identifying the task type, one subsection per
 * competency group with its usage note, and the lead-ins as a bulleted list.
 */
export function formatNbmeLeadInsBlock(taskType: TaskType): string {
  const groups = TASK_TYPE_TO_LEAD_INS[taskType];
  if (!groups || groups.length === 0) {
    return `NBME lead-in templates: no authoritative templates registered for task_type="${taskType}". Use a closed, focused lead-in that satisfies the cover-the-options rule.`;
  }

  const lines: string[] = [];
  lines.push(`═══ NBME AUTHORITATIVE LEAD-INS — task_type="${taskType}" ═══`);
  lines.push('');
  lines.push('BINDING: Pick ONE lead-in from the options below and use it VERBATIM.');
  lines.push('Do not paraphrase, shorten, or combine. The specific NBME phrasing is the style signal.');
  lines.push('');

  for (const group of groups) {
    lines.push(`-- ${group.competency} --`);
    lines.push(`   (${group.usage})`);
    for (const li of group.lead_ins) {
      lines.push(`   • ${li}`);
    }
    lines.push('');
  }

  lines.push('If multiple groups fit, pick the one whose "Usage" best matches the item\'s option set.');

  return lines.join('\n').trim();
}
