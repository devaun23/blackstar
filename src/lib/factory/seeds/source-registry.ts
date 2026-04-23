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
  'UWorld Inner Circle Step 2 CK Notes': 'registered_only',
  'USPSTF Screening Recommendations': 'registered_only',
  'Emma Holliday Psychiatry Shelf Review': 'registered_only',
  'Emma Holliday High Yield IM Review': 'registered_only',
  'NBME Psychiatry Shelf Exam Content Outline': 'registered_only',
  'Emma Holliday Pediatrics Shelf Review': 'registered_only',
  'NBME Comprehensive Clinical Science Self-Assessment': 'registered_only',
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
    category: 'outline',
    name: 'NBME Psychiatry Shelf Exam Content Outline',
    allowed_use: 'scope',
    priority_rank: 7,
    url: 'https://www.nbme.org/assessment-products/clinical-science-shelf-exams',
    notes: 'Defines testable topics for the Psychiatry shelf.',
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
  {
    category: 'review',
    name: 'Cho et al. 2024 — KT + LLMs Systematic Review',
    allowed_use: 'scope',
    priority_rank: 8,
    url: 'https://arxiv.org/abs/2412.09248',
    notes: 'Systematic review of Knowledge Tracing taxonomy (BKT/FAM/DKT/attention/graph) + LLM integration patterns. Methodology reference only — never cite for clinical facts. Audit doc: docs/ARCHITECTURE_AUDIT_KT_LLM_PAPER_2026-04-22.md. Memory: reference_kt_llm_systematic_review.md.',
  },

  // --- Content sources (guidelines, references, review notes) ---
  // Priority determines conflict resolution: lower number wins.
  // Guidelines (10-21): define correct answers, thresholds, management
  // References (30): secondary fallback
  // Review notes (50+): question design, difficulty, reasoning patterns, learner traps

  // ── Guidelines ──
  {
    category: 'guideline',
    name: 'AHA/ACC Guidelines',
    allowed_use: 'content',
    priority_rank: 10,
    url: 'https://www.ahajournals.org/guidelines',
    notes: 'Cardiology management guidelines. Primary source for ACS, CHF, endocarditis, arrhythmia questions.',
  },
  {
    category: 'guideline',
    name: 'ACEP Clinical Policies',
    allowed_use: 'content',
    priority_rank: 11,
    url: 'https://www.acep.org/clinical-policies',
    notes: 'Emergency medicine clinical policies. Source for ED management of syncope, PE, stroke.',
  },
  {
    category: 'guideline',
    name: 'Surviving Sepsis Campaign Guidelines',
    allowed_use: 'content',
    priority_rank: 12,
    url: 'https://www.sccm.org/SurvivingSepsisCampaign/Guidelines',
    notes: 'Sepsis and septic shock management. Primary source for sepsis questions. Source pack: PACK.SSC.SEPSIS.2021',
  },
  {
    category: 'guideline',
    name: 'AASLD Practice Guidelines',
    allowed_use: 'content',
    priority_rank: 13,
    url: 'https://www.aasld.org/practice-guidelines',
    notes: 'Hepatology guidelines. Source for cirrhosis, SBP, hepatic encephalopathy. Source pack: PACK.AASLD.CSBP.2021',
  },
  {
    category: 'guideline',
    name: 'KDIGO Clinical Practice Guidelines',
    allowed_use: 'content',
    priority_rank: 14,
    url: 'https://kdigo.org/guidelines/',
    notes: 'Nephrology guidelines. Source for AKI staging and management.',
  },
  {
    category: 'guideline',
    name: 'ADA Standards of Care in Diabetes',
    allowed_use: 'content',
    priority_rank: 15,
    url: 'https://diabetesjournals.org/care/issue/47/Supplement_1',
    notes: 'Diabetes management guidelines. Source for DKA, HHS management.',
  },
  {
    category: 'guideline',
    name: 'ATS/IDSA CAP Guidelines',
    allowed_use: 'content',
    priority_rank: 16,
    url: 'https://www.atsjournals.org/doi/full/10.1164/rccm.201908-1581ST',
    notes: 'Community-acquired pneumonia management guidelines.',
  },
  {
    category: 'guideline',
    name: 'IDSA Meningitis Guidelines',
    allowed_use: 'content',
    priority_rank: 17,
    url: 'https://academic.oup.com/cid/article/39/9/1267/402089',
    notes: 'Bacterial meningitis management. Source for empiric therapy and diagnostic workup.',
  },
  {
    category: 'guideline',
    name: 'GOLD COPD Guidelines',
    allowed_use: 'content',
    priority_rank: 18,
    url: 'https://goldcopd.org/gold-reports/',
    notes: 'COPD classification and exacerbation management.',
  },
  {
    category: 'guideline',
    name: 'GINA Asthma Guidelines',
    allowed_use: 'content',
    priority_rank: 19,
    url: 'https://ginasthma.org/gina-reports/',
    notes: 'Asthma classification and acute exacerbation management.',
  },
  {
    category: 'guideline',
    name: 'ACG Acute Pancreatitis Guidelines',
    allowed_use: 'content',
    priority_rank: 20,
    url: 'https://journals.lww.com/ajg/fulltext/2024/01000/american_college_of_gastroenterology_guidelines.14.aspx',
    notes: 'ACG 2024 guideline for acute pancreatitis. Source pack: PACK.ACG.AP.2024.',
  },
  {
    category: 'guideline',
    name: 'ACG GI Bleeding Guidelines',
    allowed_use: 'content',
    priority_rank: 21,
    url: 'https://journals.lww.com/ajg/fulltext/2021/05000/acg_clinical_guideline__upper_gastrointestinal_and.14.aspx',
    notes: 'ACG 2021 guideline for upper and lower GI bleeding. Source pack: PACK.ACG.GIB.2021.',
  },
  {
    category: 'guideline',
    name: 'ACC/AHA/HRS Syncope Guidelines',
    allowed_use: 'content',
    priority_rank: 23,
    url: 'https://doi.org/10.1161/CIR.0000000000000499',
    notes: 'Syncope evaluation and risk stratification. Source pack: PACK.ACCAHA.SYNC.2017.',
  },
  {
    category: 'guideline',
    name: 'ACC/AHA/HFSA Heart Failure Guidelines',
    allowed_use: 'content',
    priority_rank: 24,
    url: 'https://doi.org/10.1161/CIR.0000000000001063',
    notes: 'Heart failure management including GDMT. Source pack: PACK.ACCAHA.HF.2022.',
  },
  {
    category: 'guideline',
    name: 'ACC/AHA/ACCP/HRS Atrial Fibrillation Guideline',
    allowed_use: 'content',
    priority_rank: 25,
    url: 'https://doi.org/10.1161/CIR.0000000000001193',
    notes: 'AFib rate/rhythm control and anticoagulation. Source pack: PACK.ACCAHA.AFIB.2023.',
  },
  {
    category: 'guideline',
    name: 'ACC/AHA Hypertension Guideline',
    allowed_use: 'content',
    priority_rank: 26,
    url: 'https://doi.org/10.1161/HYP.0000000000000065',
    notes: 'HTN staging, initial therapy, hypertensive emergency. Source pack: PACK.ACCAHA.HTN.2017.',
  },
  {
    category: 'guideline',
    name: 'AHA/ASA Acute Ischemic Stroke Guidelines',
    allowed_use: 'content',
    priority_rank: 27,
    url: 'https://doi.org/10.1161/STR.0000000000000211',
    notes: 'Acute stroke management including tPA and thrombectomy. Source pack: PACK.AHA.STROKE.2019.',
  },
  {
    category: 'guideline',
    name: 'AHA/ASA TIA Guideline',
    allowed_use: 'content',
    priority_rank: 28,
    url: 'https://doi.org/10.1161/STR.0000000000000375',
    notes: 'TIA evaluation, DAPT, carotid management. Source pack: PACK.AHA.TIA.2021.',
  },
  {
    category: 'guideline',
    name: 'USPSTF Screening Recommendations',
    allowed_use: 'content',
    priority_rank: 22,
    url: 'https://www.uspreventiveservicestaskforce.org/uspstf/recommendation-topics',
    notes: 'Preventive screening guidelines. Primary source for age/sex-specific cancer screening, metabolic screening, and risk-factor-based screening questions.',
  },

  // ── References ──
  {
    category: 'reference',
    name: 'UpToDate',
    allowed_use: 'content',
    priority_rank: 30,
    url: 'https://www.uptodate.com',
    notes: 'Evidence-based clinical decision support. Secondary source when society guidelines are insufficient.',
  },

  // ── Review notes (directly available to agents for question design) ──
  {
    category: 'qbank',
    name: 'UWorld Step 2 CK',
    allowed_use: 'content',
    priority_rank: 50,
    url: null,
    notes: 'Question design, vignette complexity, distractor quality, difficulty calibration. Facts must cite a guideline.',
  },
  {
    category: 'qbank',
    name: 'AMBOSS Step 2 CK',
    allowed_use: 'content',
    priority_rank: 51,
    url: null,
    notes: 'Explanation structure, clinical reasoning emphasis, learner trap patterns. Facts must cite a guideline.',
  },
  {
    category: 'review',
    name: 'Divine Intervention Podcast Notes',
    allowed_use: 'content',
    priority_rank: 52,
    url: 'https://divineinterventionpodcasts.com',
    notes: 'Board review podcast notes (115 episodes). Clinical patterns, high-yield focus areas, reasoning shortcuts. Facts must cite a guideline.',
  },
  {
    category: 'review',
    name: 'UWorld Inner Circle Step 2 CK Notes',
    allowed_use: 'content',
    priority_rank: 53,
    url: null,
    notes: 'Comprehensive Step 2 CK review notes. Clinical reasoning, decision forks, management algorithms. Facts must cite a guideline.',
  },
  {
    category: 'review',
    name: 'Emma Holliday Surgery Shelf Review',
    allowed_use: 'content',
    priority_rank: 54,
    url: null,
    notes: 'High-yield surgery shelf exam review by Emma Holliday Ramahi. Covers pre-op, trauma, GI, hepatobiliary, vascular, endocrine, breast, oncology, pedi-surg, urology, ortho, transplant, anesthesia. Facts must cite a guideline.',
  },
  {
    category: 'review',
    name: 'Emma Holliday Psychiatry Shelf Review',
    allowed_use: 'content',
    priority_rank: 55,
    url: null,
    notes: 'High-yield psychiatry shelf exam review by Emma Holliday Ramahi. Covers mood disorders, psychopharmacology, psychotic disorders, anxiety, personality disorders, substance use, delirium/dementia, child psychiatry. Facts must cite a guideline.',
  },
  {
    category: 'review',
    name: 'Emma Holliday High Yield IM Review',
    allowed_use: 'content',
    priority_rank: 56,
    url: null,
    notes: 'Single-lecture IM shelf exam review by Emma Holliday Ramahi. 9 systems: cardiology, pulm, GI, ID, nephro, heme/onc, rheum/derm, endo, neuro. High-yield buzzwords, clinical pearls, associations. Facts must cite a guideline.',
  },
  {
    category: 'review',
    name: 'Emma Holliday Pediatrics Shelf Review',
    allowed_use: 'content',
    priority_rank: 57,
    url: null,
    notes: 'High-yield pediatrics shelf exam review by Emma Holliday Ramahi. Covers neonatology, genetics, immunodeficiency, growth/dev, CHD, respiratory, endocrine, renal, heme-onc, infectious disease, MSK, neurology. Facts must cite a guideline.',
  },
  {
    category: 'qbank',
    name: 'NBME Comprehensive Clinical Science Self-Assessment',
    allowed_use: 'content',
    priority_rank: 49,
    url: 'https://www.nbme.org/assessment-products/clinical-science-shelf-exams',
    notes: 'Official NBME self-assessment items. Gold standard for question design, vignette quality, distractor plausibility, and clinical reasoning patterns. Facts must cite a guideline.',
  },
];
