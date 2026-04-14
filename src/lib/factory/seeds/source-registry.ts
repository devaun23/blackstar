import type { SourceUse } from '@/lib/types/database';

export interface SourceRegistrySeed {
  category: string;
  name: string;
  allowed_use: SourceUse;
  priority_rank: number;
  url: string | null;
  notes: string | null;
}

/**
 * Tracks source lifecycle through the pack normalization pipeline.
 * registered_only: in source_registry but no archival or pack
 * archived: raw guideline saved to docs/sources/tier-b/
 * normalized: pack file exists in source-packs/ (may be draft)
 * active: pack validated and serving to agents
 */
export const SOURCE_STATUS = {
  'ACG Acute Pancreatitis Guidelines': 'normalized',
  'AASLD Practice Guidelines': 'registered_only',
  'ACG GI Bleeding Guidelines': 'registered_only',
  'Surviving Sepsis Campaign Guidelines': 'registered_only',
  'AHA/ACC Guidelines': 'registered_only',
  'ACEP Clinical Policies': 'registered_only',
  'KDIGO Clinical Practice Guidelines': 'registered_only',
  'ADA Standards of Care in Diabetes': 'registered_only',
  'ATS/IDSA CAP Guidelines': 'registered_only',
  'IDSA Meningitis Guidelines': 'registered_only',
  'GOLD COPD Guidelines': 'registered_only',
  'GINA Asthma Guidelines': 'registered_only',
  'UpToDate': 'registered_only',
} as const;

export const sourceRegistry: SourceRegistrySeed[] = [
  // --- Scope sources (define what's testable) ---
  {
    category: 'outline',
    name: 'USMLE Step 2 CK Content Outline',
    allowed_use: 'scope',
    priority_rank: 1,
    url: 'https://www.usmle.org/prepare-your-exam',
    notes: 'Primary authority for what topics are in scope for Step 2 CK.',
  },
  {
    category: 'outline',
    name: 'NBME Medicine Shelf Exam Content Outline',
    allowed_use: 'scope',
    priority_rank: 2,
    url: 'https://www.nbme.org/assessment-products/clinical-science-shelf-exams',
    notes: 'Defines testable topics for the Medicine shelf.',
  },
  {
    category: 'outline',
    name: 'NBME Surgery Shelf Exam Content Outline',
    allowed_use: 'scope',
    priority_rank: 3,
    url: 'https://www.nbme.org/assessment-products/clinical-science-shelf-exams',
    notes: 'Defines testable topics for the Surgery shelf.',
  },
  {
    category: 'guide',
    name: 'NBME Item Writing Guide',
    allowed_use: 'scope',
    priority_rank: 4,
    url: 'https://www.nbme.org/item-writing-guide',
    notes: 'Defines NBME question construction standards: single best answer, vignette format, cold chart style.',
  },
  {
    category: 'outline',
    name: 'NBME Medicine Shelf Content Outline — Subsystem Topics',
    allowed_use: 'scope',
    priority_rank: 5,
    url: 'https://www.nbme.org/assessment-products/clinical-science-shelf-exams',
    notes: 'Detailed topic-level breakdown for Medicine shelf. Maps to 15 IM subsystems used in MedicineNodeSpec.',
  },
  {
    category: 'outline',
    name: 'USMLE Step 2 CK Physician Task Profiles',
    allowed_use: 'scope',
    priority_rank: 6,
    url: 'https://www.usmle.org/prepare-your-exam',
    notes: 'Defines physician task distribution across Step 2 CK. Informs task_type weighting in blueprint generation.',
  },

  // --- Truth sources (define correct answers) ---
  {
    category: 'guideline',
    name: 'AHA/ACC Guidelines',
    allowed_use: 'truth',
    priority_rank: 10,
    url: 'https://www.ahajournals.org/guidelines',
    notes: 'Cardiology management guidelines. Primary source for ACS, CHF, endocarditis, arrhythmia questions.',
  },
  {
    category: 'guideline',
    name: 'ACEP Clinical Policies',
    allowed_use: 'truth',
    priority_rank: 11,
    url: 'https://www.acep.org/clinical-policies',
    notes: 'Emergency medicine clinical policies. Source for ED management of syncope, PE, stroke.',
  },
  {
    category: 'guideline',
    name: 'Surviving Sepsis Campaign Guidelines',
    allowed_use: 'truth',
    priority_rank: 12,
    url: 'https://www.sccm.org/SurvivingSepsisCampaign/Guidelines',
    notes: 'Sepsis and septic shock management. Primary source for sepsis questions. Source pack: PACK.SSC.SEPSIS.2021',
  },
  {
    category: 'guideline',
    name: 'AASLD Practice Guidelines',
    allowed_use: 'truth',
    priority_rank: 13,
    url: 'https://www.aasld.org/practice-guidelines',
    notes: 'Hepatology guidelines. Source for cirrhosis, SBP, hepatic encephalopathy. Source pack: PACK.AASLD.CSBP.2021',
  },
  {
    category: 'guideline',
    name: 'KDIGO Clinical Practice Guidelines',
    allowed_use: 'truth',
    priority_rank: 14,
    url: 'https://kdigo.org/guidelines/',
    notes: 'Nephrology guidelines. Source for AKI staging and management.',
  },
  {
    category: 'guideline',
    name: 'ADA Standards of Care in Diabetes',
    allowed_use: 'truth',
    priority_rank: 15,
    url: 'https://diabetesjournals.org/care/issue/47/Supplement_1',
    notes: 'Diabetes management guidelines. Source for DKA, HHS management.',
  },
  {
    category: 'guideline',
    name: 'ATS/IDSA CAP Guidelines',
    allowed_use: 'truth',
    priority_rank: 16,
    url: 'https://www.atsjournals.org/doi/full/10.1164/rccm.201908-1581ST',
    notes: 'Community-acquired pneumonia management guidelines.',
  },
  {
    category: 'guideline',
    name: 'IDSA Meningitis Guidelines',
    allowed_use: 'truth',
    priority_rank: 17,
    url: 'https://academic.oup.com/cid/article/39/9/1267/402089',
    notes: 'Bacterial meningitis management. Source for empiric therapy and diagnostic workup.',
  },
  {
    category: 'guideline',
    name: 'GOLD COPD Guidelines',
    allowed_use: 'truth',
    priority_rank: 18,
    url: 'https://goldcopd.org/gold-reports/',
    notes: 'COPD classification and exacerbation management.',
  },
  {
    category: 'guideline',
    name: 'GINA Asthma Guidelines',
    allowed_use: 'truth',
    priority_rank: 19,
    url: 'https://ginasthma.org/gina-reports/',
    notes: 'Asthma classification and acute exacerbation management.',
  },
  // ─── NEW: ACG Pancreatitis (Phase 1.5 target) ───
  {
    category: 'guideline',
    name: 'ACG Acute Pancreatitis Guidelines',
    allowed_use: 'truth',
    priority_rank: 20,
    url: 'https://journals.lww.com/ajg/fulltext/2024/01000/american_college_of_gastroenterology_guidelines.14.aspx',
    notes: 'ACG 2024 guideline for acute pancreatitis. Source pack: PACK.ACG.AP.2024. Phase 1.5 exemplar.',
  },
  // ─── NEW: ACG GI Bleeding (Phase 1.5 target) ───
  {
    category: 'guideline',
    name: 'ACG GI Bleeding Guidelines',
    allowed_use: 'truth',
    priority_rank: 21,
    url: 'https://journals.lww.com/ajg/fulltext/2021/05000/acg_clinical_guideline__upper_gastrointestinal_and.14.aspx',
    notes: 'ACG 2021 guideline for upper and lower GI bleeding. Source pack: PACK.ACG.GIB.2021. Phase 1.5 target.',
  },
  {
    category: 'reference',
    name: 'UpToDate',
    allowed_use: 'truth',
    priority_rank: 30,
    url: 'https://www.uptodate.com',
    notes: 'Evidence-based clinical decision support. Secondary source when society guidelines are insufficient.',
  },

  // --- Inspiration sources (inform style, not truth) ---
  {
    category: 'qbank',
    name: 'UWorld Step 2 CK',
    allowed_use: 'inspiration',
    priority_rank: 50,
    url: null,
    notes: 'Style reference for vignette complexity and distractor quality. Cannot define scope or truth.',
  },
  {
    category: 'qbank',
    name: 'AMBOSS Step 2 CK',
    allowed_use: 'inspiration',
    priority_rank: 51,
    url: null,
    notes: 'Style reference for explanation structure and clinical reasoning emphasis. Cannot define scope or truth.',
  },
  {
    category: 'reference',
    name: 'Divine Intervention Podcast Notes',
    allowed_use: 'inspiration',
    priority_rank: 52,
    url: 'https://divineinterventionpodcasts.com',
    notes: 'Board review podcast notes (100+ episodes). Raw storage for future pipeline integration. Covers IM, peds, neuro, OB/GYN, surgery, pharm, and more.',
  },
];
