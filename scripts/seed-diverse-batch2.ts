/**
 * Seed Diverse Batch 2: 5 MORE scope-diverse IM questions.
 * Adds to existing questions (does NOT delete batch 1).
 *
 * Batch 1 covered: Pulm, Nephro, Hepato, Endo, Rheum
 * Batch 2 covers: Heme/Onc, Neuro, ID, Derm-within-IM, Preventive
 *
 * Topics: TTP, Multiple Sclerosis, C. difficile, SJS/TEN, Colon Cancer Screening
 *
 * All questions follow NBME item-writing standards:
 * - Dual temperature, mm Hg spacing, reference ranges for abnormal labs
 * - Named specific drugs, single action per option, correct answer not longest
 * - Near-miss distractor, process-before-conclusion explanations
 * - Contrast-based option analysis, 2-sentence pearls + "what would change"
 *
 * Run with: npx tsx scripts/seed-diverse-batch2.ts
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// ─── Confusion sets ───
const CONFUSION_SETS = [
  {
    name: 'thrombotic_microangiopathy_differential',
    conditions: ['TTP', 'HUS', 'DIC', 'HELLP syndrome', 'HIT'],
    discriminating_clues: [
      { condition: 'TTP', clue: 'ADAMTS13 activity <10%, schistocytes on smear, severe thrombocytopenia, normal coagulation studies (PT/PTT normal), fever + neurologic symptoms', clue_type: 'lab_pattern' },
      { condition: 'HUS', clue: 'Preceding bloody diarrhea (Shiga toxin), renal failure predominant, children > adults, normal ADAMTS13', clue_type: 'clinical_context' },
      { condition: 'DIC', clue: 'Elevated PT/PTT, low fibrinogen, elevated D-dimer, schistocytes PLUS coagulopathy — the key distinction from TTP', clue_type: 'lab_pattern' },
      { condition: 'HELLP syndrome', clue: 'Third trimester pregnant woman, hemolysis + elevated liver enzymes + low platelets, RUQ pain', clue_type: 'clinical_context' },
      { condition: 'HIT', clue: 'Platelet drop 5-10 days after heparin initiation, 4T score, thrombosis (not bleeding), no schistocytes', clue_type: 'temporal_progression' },
    ],
    common_traps: ['Giving platelet transfusions in TTP — platelets fuel the microvascular thrombosis and worsen outcomes. Treat with plasma exchange, not platelets.'],
  },
  {
    name: 'relapsing_neurologic_deficits_differential',
    conditions: ['Multiple sclerosis', 'Neuromyelitis optica', 'CNS vasculitis', 'Neurosarcoidosis'],
    discriminating_clues: [
      { condition: 'Multiple sclerosis', clue: 'Young woman, relapsing-remitting course, MRI showing periventricular/juxtacortical white matter lesions disseminated in space and time, oligoclonal bands in CSF', clue_type: 'imaging' },
      { condition: 'Neuromyelitis optica', clue: 'Severe optic neuritis + longitudinally extensive transverse myelitis (≥3 vertebral segments), AQP4-IgG positive, more severe attacks than MS', clue_type: 'serologic_pattern' },
      { condition: 'CNS vasculitis', clue: 'Headache + encephalopathy + focal deficits, irregular vessel narrowing on angiography, elevated ESR/CRP', clue_type: 'imaging' },
      { condition: 'Neurosarcoidosis', clue: 'Cranial neuropathies (especially CN VII), hilar lymphadenopathy, elevated ACE, non-caseating granulomas on biopsy', clue_type: 'clinical_criteria' },
    ],
    common_traps: ['Diagnosing MS on the first episode — MS requires dissemination in BOTH space and time. A single episode is a clinically isolated syndrome (CIS), not MS.'],
  },
  {
    name: 'antibiotic_associated_diarrhea_severity',
    conditions: ['Non-severe C. difficile', 'Severe C. difficile', 'Fulminant C. difficile', 'Antibiotic-associated diarrhea (non-C. diff)'],
    discriminating_clues: [
      { condition: 'Non-severe C. diff', clue: 'WBC <15,000, Cr <1.5, responds to oral vancomycin 125mg QID', clue_type: 'lab_pattern' },
      { condition: 'Severe C. diff', clue: 'WBC ≥15,000 OR Cr ≥1.5, needs oral vancomycin (NOT metronidazole)', clue_type: 'lab_pattern' },
      { condition: 'Fulminant C. diff', clue: 'Hypotension, ileus, megacolon, lactic acidosis, WBC ≥25,000 — needs vancomycin (oral + rectal) PLUS IV metronidazole, surgical consultation', clue_type: 'vital_sign_pattern' },
      { condition: 'Non-C. diff AAD', clue: 'Negative C. diff toxin/PCR, mild watery diarrhea, resolves with stopping offending antibiotic', clue_type: 'lab_pattern' },
    ],
    common_traps: ['Using metronidazole for severe C. diff — IDSA/SHEA 2021 guidelines removed metronidazole as first-line for ALL severities. Oral vancomycin or fidaxomicin is now standard.'],
  },
  {
    name: 'severe_drug_reaction_spectrum',
    conditions: ['SJS', 'TEN', 'DRESS syndrome', 'Drug-induced urticaria/angioedema'],
    discriminating_clues: [
      { condition: 'SJS', clue: '<10% BSA detachment, targetoid lesions with necrotic centers, mucosal involvement (≥2 sites), Nikolsky sign positive, 1-3 weeks after drug exposure', clue_type: 'physical_exam_sign' },
      { condition: 'TEN', clue: '≥30% BSA detachment (SJS/TEN overlap 10-30%), same pathology as SJS but more extensive, higher mortality (25-35%)', clue_type: 'physical_exam_sign' },
      { condition: 'DRESS', clue: 'Fever + rash + eosinophilia + internal organ involvement (hepatitis, nephritis), 2-8 weeks after drug exposure (later than SJS), no epidermal detachment', clue_type: 'lab_pattern' },
      { condition: 'Drug urticaria/angioedema', clue: 'Wheals (raised, pruritic), no epidermal necrosis, no mucosal involvement, resolves quickly after drug withdrawal', clue_type: 'temporal_progression' },
    ],
    common_traps: ['Missing mucosal involvement in SJS — examine oral mucosa, conjunctivae, and genitalia. Mucosal erosions without skin findings can be the presenting feature.'],
  },
  {
    name: 'colorectal_cancer_screening_guidelines',
    conditions: ['Average risk (age 45-75)', 'High risk (family hx)', 'Lynch syndrome', 'Post-polypectomy surveillance'],
    discriminating_clues: [
      { condition: 'Average risk', clue: 'Start at age 45, colonoscopy every 10 years OR FIT annually OR stool DNA every 3 years, stop at 75 if prior screens normal', clue_type: 'guideline_criteria' },
      { condition: 'High risk (family hx)', clue: 'First-degree relative with CRC <60 or ≥2 FDR at any age → colonoscopy starting at age 40 OR 10 years before youngest affected relative, every 5 years', clue_type: 'guideline_criteria' },
      { condition: 'Lynch syndrome', clue: 'MSI-high tumor, MLH1/MSH2/MSH6/PMS2 germline mutation, colonoscopy every 1-2 years starting age 20-25', clue_type: 'genetic' },
      { condition: 'Post-polypectomy', clue: 'Low-risk adenoma (1-2 tubular <10mm) → 7-10 year follow-up; high-risk (≥3, ≥10mm, villous, HGD) → 3 year follow-up', clue_type: 'guideline_criteria' },
    ],
    common_traps: ['Recommending FIT or stool DNA as follow-up after a positive screening FIT — a positive non-invasive test always requires diagnostic colonoscopy, never repeat non-invasive testing.'],
  },
];

// ─── Transfer rules ───
const TRANSFER_RULES = [
  { rule_text: 'When thrombocytopenia occurs with microangiopathic hemolytic anemia (schistocytes) but normal coagulation studies (PT/PTT), the process is thrombotic (TTP/HUS), not consumptive (DIC). The coagulation studies are the discriminator — DIC consumes clotting factors, TTP does not.', category: 'diagnostic_disambiguation', topic: 'TTP' },
  { rule_text: 'Relapsing neurologic deficits disseminated in space and time in a young woman, with periventricular white matter lesions on MRI and oligoclonal bands in CSF — the pattern is demyelinating disease. A single episode is a clinically isolated syndrome; MS requires evidence of both spatial and temporal dissemination.', category: 'pattern_recognition', topic: 'Multiple Sclerosis' },
  { rule_text: 'In C. difficile infection, treatment intensity is driven by severity markers (WBC ≥15,000, Cr ≥1.5), not by symptom duration or stool frequency. Oral vancomycin is first-line for ALL severities — metronidazole is no longer recommended as initial therapy.', category: 'severity_escalation', topic: 'C. difficile' },
  { rule_text: 'When skin detachment with mucosal involvement follows drug exposure by 1-3 weeks, the differential is SJS vs TEN — distinguished solely by the percentage of body surface area detached (<10% = SJS, ≥30% = TEN). The immediate management is the same: stop the offending drug, transfer to burn unit, supportive care.', category: 'severity_escalation', topic: 'SJS/TEN' },
  { rule_text: 'A positive non-invasive colorectal cancer screening test (FIT, stool DNA) always requires diagnostic colonoscopy — never repeat the non-invasive test. The non-invasive test is a gate to colonoscopy, not a substitute for it.', category: 'diagnostic_disambiguation', topic: 'Colon Cancer Screening' },
];

// ─── The 5 Questions ───
interface QuestionSeed {
  vignette: string;
  stem: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  option_e: string;
  correct_answer: string;
  error_map: Record<string, string>;
  transfer_rule_text: string;
  explanation_decision: string;
  explanation_options: string;
  explanation_summary: string;
  system_topic: string;
  error_bucket: string;
  difficulty: string;
  confusion_set_name: string;
  transfer_rule_match: string;
}

const QUESTIONS: QuestionSeed[] = [
  // ═══ Q6: TTP — Hematology/Oncology, tier_1 ═══
  {
    system_topic: 'heme',
    difficulty: 'hard',
    error_bucket: 'confusion_set_miss',
    confusion_set_name: 'thrombotic_microangiopathy_differential',
    transfer_rule_match: 'thrombocytopenia occurs with microangiopathic',
    vignette: 'A 34-year-old woman presents to the emergency department with a 3-day history of fatigue, confusion, and dark urine. She has no significant medical history and does not take any medications. Her temperature is 38.3°C (100.9°F), pulse is 108/min, respirations are 18/min, and blood pressure is 132/84 mm Hg. Physical examination reveals scleral icterus and petechiae on the lower extremities. She is oriented to person only. Laboratory studies show: hemoglobin 7.2 g/dL (normal 12.0–16.0), platelet count 18,000/mm³ (normal 150,000–400,000), reticulocyte count 8.2% (normal 0.5–1.5%), LDH 1,840 U/L (normal 140–280), indirect bilirubin 4.8 mg/dL (normal 0.1–1.0), haptoglobin <10 mg/dL (normal 30–200), creatinine 1.8 mg/dL (normal 0.6–1.2). Prothrombin time and partial thromboplastin time are normal. Peripheral blood smear shows schistocytes.',
    stem: 'Which of the following is the most appropriate initial treatment?',
    option_a: 'Platelet transfusion',
    option_b: 'Plasma exchange',
    option_c: 'Intravenous heparin',
    option_d: 'High-dose corticosteroids alone',
    option_e: 'Fresh frozen plasma infusion',
    correct_answer: 'B',
    error_map: { A: 'severity_miss', C: 'confusion_set_miss', D: 'next_step_error', E: 'next_step_error' },
    transfer_rule_text: 'When thrombocytopenia occurs with microangiopathic hemolytic anemia (schistocytes) but normal coagulation studies (PT/PTT), the process is thrombotic (TTP/HUS), not consumptive (DIC). The coagulation studies are the discriminator — DIC consumes clotting factors, TTP does not.',
    explanation_decision: 'What is the clinical pattern? Severe thrombocytopenia + microangiopathic hemolytic anemia (schistocytes, elevated LDH, low haptoglobin, indirect hyperbilirubinemia) + neurologic changes + fever + renal dysfunction. What does this narrow to? The combination of MAHA with thrombocytopenia and NORMAL coagulation studies (PT/PTT normal) points to a thrombotic microangiopathy — not DIC, which would consume clotting factors. What is the discriminating feature? The normal PT/PTT is the hinge. TTP is a medical emergency with >90% mortality if untreated; plasma exchange is the definitive treatment and must be initiated immediately — it replaces the deficient ADAMTS13 and removes the offending antibody.',
    explanation_options: 'Platelet transfusion (A) vs plasma exchange: this is the critical near-miss — platelets are the intuitive response to a count of 18,000, but in TTP, transfused platelets fuel the ongoing microvascular thrombosis and can precipitate stroke, MI, or death. Platelets are contraindicated unless life-threatening bleeding is present. Heparin (C) vs plasma exchange: heparin treats HIT-associated thrombosis and DIC, but TTP is not a coagulopathy — anticoagulation does not address the underlying ADAMTS13 deficiency. Corticosteroids alone (D) vs plasma exchange: steroids are adjunctive therapy in TTP (suppress the autoantibody against ADAMTS13), but they are insufficient as monotherapy — plasma exchange is required. FFP infusion (E) vs plasma exchange: FFP provides ADAMTS13 and can be used as a temporizing measure while arranging plasma exchange, but infusion alone is less effective than exchange because it does not remove the pathologic antibody.',
    explanation_summary: 'TTP mortality drops from >90% to ~10-20% with prompt plasma exchange — few treatments in medicine have this dramatic an impact on survival. If this patient\'s PT and PTT had been elevated along with low fibrinogen, the diagnosis would shift to DIC, and the management would be treating the underlying cause plus supportive care with FFP and cryoprecipitate rather than plasma exchange.',
  },

  // ═══ Q7: MULTIPLE SCLEROSIS — Neurology-within-IM, tier_1 ═══
  {
    system_topic: 'neuro',
    difficulty: 'medium',
    error_bucket: 'premature_closure',
    confusion_set_name: 'relapsing_neurologic_deficits_differential',
    transfer_rule_match: 'relapsing neurologic deficits disseminated',
    vignette: 'A 28-year-old woman presents with a 5-day history of progressive numbness and tingling in both legs ascending to the umbilicus, with difficulty walking. Six months ago, she had an episode of painful vision loss in the right eye that resolved over 3 weeks without treatment. She does not take any medications. Her temperature is 36.8°C (98.2°F), pulse is 74/min, and blood pressure is 116/72 mm Hg. Neurologic examination reveals decreased visual acuity in the right eye with a relative afferent pupillary defect. There is a sensory level at T10 bilaterally, 4/5 strength in both lower extremities, hyperreflexia in the lower extremities, and bilateral Babinski signs. MRI of the brain shows multiple periventricular and juxtacortical T2-hyperintense lesions. MRI of the spinal cord shows a single enhancing lesion at T9. Cerebrospinal fluid analysis shows oligoclonal bands not present in serum.',
    stem: 'Which of the following is the most likely diagnosis?',
    option_a: 'Multiple sclerosis',
    option_b: 'Neuromyelitis optica spectrum disorder',
    option_c: 'Clinically isolated syndrome',
    option_d: 'Acute disseminated encephalomyelitis',
    option_e: 'CNS lymphoma',
    correct_answer: 'A',
    error_map: { B: 'confusion_set_miss', C: 'test_interpretation_miss', D: 'premature_closure', E: 'premature_closure' },
    transfer_rule_text: 'Relapsing neurologic deficits disseminated in space and time in a young woman, with periventricular white matter lesions on MRI and oligoclonal bands in CSF — the pattern is demyelinating disease. A single episode is a clinically isolated syndrome; MS requires evidence of both spatial and temporal dissemination.',
    explanation_decision: 'What is the clinical pattern? A young woman with TWO separate neurologic episodes — optic neuritis 6 months ago and now transverse myelitis — affecting different parts of the CNS. What does this narrow to? Two episodes disseminated in both space (optic nerve + spinal cord + brain periventricular lesions) and time (6 months apart) in a young woman is the hallmark of relapsing-remitting multiple sclerosis. What is the discriminating feature? The McDonald criteria require dissemination in space (≥2 CNS regions) AND time (≥2 attacks or new lesions on follow-up MRI). This patient satisfies both — the prior optic neuritis plus the current myelitis plus the brain lesions establish MS.',
    explanation_options: 'Neuromyelitis optica (B) vs MS: NMO causes severe optic neuritis and longitudinally extensive transverse myelitis (≥3 vertebral segments), but this patient\'s spinal cord lesion is described as a single segment at T9, and she has multiple BRAIN lesions — NMO typically has few or no brain lesions in the classic pattern. Clinically isolated syndrome (C) vs MS: this is the near-miss — CIS is a SINGLE demyelinating episode. This patient has had TWO episodes separated by 6 months, which satisfies temporal dissemination and rules out CIS. ADEM (D) vs MS: ADEM is typically a monophasic illness following infection or vaccination, usually in children, with large multifocal lesions — not the relapsing course seen here. CNS lymphoma (E) vs MS: lymphoma presents with single enhancing mass lesions in immunocompromised patients, not multiple periventricular lesions with oligoclonal bands.',
    explanation_summary: 'MS diagnosis requires dissemination in BOTH space and time — a single episode, no matter how convincing, is only CIS until the second event proves the relapsing pattern. If this patient had presented with her first episode only (the optic neuritis) without the spinal cord involvement or brain lesions, the diagnosis would be clinically isolated syndrome and the management would focus on whether to initiate disease-modifying therapy based on MRI risk stratification.',
  },

  // ═══ Q8: C. DIFFICILE — Infectious Disease, tier_1 ═══
  {
    system_topic: 'ID',
    difficulty: 'medium',
    error_bucket: 'next_step_error',
    confusion_set_name: 'antibiotic_associated_diarrhea_severity',
    transfer_rule_match: 'C. difficile infection, treatment intensity',
    vignette: 'A 68-year-old man is hospitalized for community-acquired pneumonia and has been receiving ceftriaxone and azithromycin for 5 days. He develops profuse watery diarrhea (8 episodes daily) with abdominal cramping and low-grade fever. His temperature is 38.1°C (100.6°F), pulse is 92/min, and blood pressure is 128/76 mm Hg. Abdominal examination reveals diffuse tenderness without guarding or rebound. Laboratory studies show: WBC 22,000/mm³ (normal 4,500–11,000), creatinine 1.9 mg/dL (normal 0.6–1.2; baseline 0.8 mg/dL). Stool PCR for Clostridioides difficile toxin B is positive.',
    stem: 'Which of the following is the most appropriate treatment?',
    option_a: 'Oral metronidazole 500 mg three times daily',
    option_b: 'Oral vancomycin 125 mg four times daily',
    option_c: 'Oral fidaxomicin 200 mg twice daily',
    option_d: 'Intravenous metronidazole 500 mg three times daily',
    option_e: 'Fecal microbiota transplantation',
    correct_answer: 'B',
    error_map: { A: 'next_step_error', C: 'next_step_error', D: 'severity_miss', E: 'premature_closure' },
    transfer_rule_text: 'In C. difficile infection, treatment intensity is driven by severity markers (WBC ≥15,000, Cr ≥1.5), not by symptom duration or stool frequency. Oral vancomycin is first-line for ALL severities — metronidazole is no longer recommended as initial therapy.',
    explanation_decision: 'What is the clinical pattern? Antibiotic-associated diarrhea in a hospitalized patient on cephalosporins, confirmed C. difficile positive by PCR, with WBC 22,000 and creatinine 1.9 (above 1.5 and above baseline). What does this narrow to? This is SEVERE C. difficile infection by IDSA/SHEA criteria — WBC ≥15,000 OR creatinine ≥1.5× baseline defines severity. What is the discriminating feature? Per the 2021 IDSA/SHEA guidelines, oral vancomycin (or fidaxomicin) is first-line for ALL C. difficile — including non-severe. Metronidazole is no longer recommended as initial therapy for any severity. The severity classification determines whether additional measures (rectal vancomycin, IV metronidazole, surgical consultation) are needed, but oral vancomycin is the backbone for all.',
    explanation_options: 'Oral metronidazole (A) vs oral vancomycin: this is the highest-yield near-miss — metronidazole was formerly acceptable for non-severe C. diff, but the 2021 IDSA/SHEA guidelines removed it as first-line for ALL severities due to inferior cure rates. Students using older references will choose metronidazole. Fidaxomicin (C) vs vancomycin: fidaxomicin is equally effective and has lower recurrence rates, but both are correct first-line agents — the question asks for the most appropriate treatment, and vancomycin remains the standard first-line in most guidelines; fidaxomicin is an acceptable alternative but not the most tested answer. IV metronidazole (D) vs oral vancomycin: IV metronidazole is ADDED to oral vancomycin in fulminant C. diff (hypotension, ileus, megacolon), but this patient does not have fulminant features — using IV metronidazole alone misses the oral vancomycin backbone. Fecal transplant (E) vs vancomycin: FMT is reserved for recurrent C. diff (≥2 recurrences after standard therapy), not first-episode treatment.',
    explanation_summary: 'Oral vancomycin is first-line for ALL C. difficile severities since 2021 — metronidazole\'s demotion is one of the most commonly tested guideline updates on recent board exams. If this patient had presented with hypotension, ileus, or WBC ≥25,000, the severity would escalate to fulminant, and the management would add IV metronidazole plus rectal vancomycin to the oral vancomycin.',
  },

  // ═══ Q9: SJS/TEN — Dermatology-within-IM, tier_1 ═══
  {
    system_topic: 'derm',
    difficulty: 'hard',
    error_bucket: 'severity_miss',
    confusion_set_name: 'severe_drug_reaction_spectrum',
    transfer_rule_match: 'skin detachment with mucosal involvement',
    vignette: 'A 52-year-old man presents to the emergency department with a 4-day history of fever, malaise, and a painful rash that began on his trunk and spread to involve his face and extremities. He was started on allopurinol 300 mg daily 3 weeks ago for gout. His other medications include lisinopril 10 mg daily and atorvastatin 40 mg daily. His temperature is 39.2°C (102.6°F), pulse is 104/min, and blood pressure is 108/68 mm Hg. Physical examination reveals confluent erythematous macules with central dusky necrosis covering approximately 25% of body surface area. Gentle lateral pressure on uninvolved skin produces epidermal separation. Oral examination reveals hemorrhagic erosions of the lips and buccal mucosa. Bilateral conjunctival injection with purulent discharge is present. Genital examination reveals erosions of the glans.',
    stem: 'Which of the following is the most appropriate immediate management?',
    option_a: 'Discontinue allopurinol and transfer to a burn unit',
    option_b: 'Intravenous corticosteroids',
    option_c: 'Oral antihistamines and topical corticosteroids',
    option_d: 'Skin biopsy to confirm diagnosis before treatment',
    option_e: 'Intravenous immunoglobulin (IVIG)',
    correct_answer: 'A',
    error_map: { B: 'next_step_error', C: 'severity_miss', D: 'premature_closure', E: 'next_step_error' },
    transfer_rule_text: 'When skin detachment with mucosal involvement follows drug exposure by 1-3 weeks, the differential is SJS vs TEN — distinguished solely by the percentage of body surface area detached (<10% = SJS, ≥30% = TEN). The immediate management is the same: stop the offending drug, transfer to burn unit, supportive care.',
    explanation_decision: 'What is the clinical pattern? Confluent skin necrosis with epidermal detachment (positive Nikolsky sign) involving 25% BSA, plus mucosal involvement at three sites (oral, conjunctival, genital), occurring 3 weeks after allopurinol initiation. What does this narrow to? This is SJS/TEN overlap (10-30% BSA detachment) — allopurinol is one of the highest-risk causative drugs. The positive Nikolsky sign (lateral pressure causing epidermal separation) confirms full-thickness epidermal necrosis. What is the discriminating feature? The immediate priority is twofold: (1) stop the causative drug immediately — every day of continued exposure after onset increases mortality, and (2) transfer to a burn unit or ICU for fluid resuscitation, wound care, and temperature management. No other intervention takes priority over these two actions.',
    explanation_options: 'IV corticosteroids (B) vs drug discontinuation + burn unit: systemic steroids in SJS/TEN are controversial — some studies show harm (increased infection, delayed wound healing), others show no benefit. No guideline recommends steroids as FIRST-LINE management; drug withdrawal and supportive care always come first. Antihistamines + topical steroids (C) vs burn unit transfer: this treats urticaria, not SJS/TEN — applying topical steroids to necrotic, detaching epidermis is both ineffective and harmful. This option represents a dangerous severity miss. Skin biopsy (D) vs immediate management: biopsy confirms the diagnosis histologically (full-thickness epidermal necrosis) but must NOT delay drug discontinuation and transfer — treatment is clinical and urgent. IVIG (E) vs drug discontinuation: IVIG is used in some centers as adjunctive therapy (theoretical Fas-ligand blockade), but evidence is mixed and it never replaces the two immediate priorities of stopping the drug and burn unit transfer.',
    explanation_summary: 'In SJS/TEN, each additional day of causative drug exposure after symptom onset increases mortality — immediate drug withdrawal is the single most impactful intervention. If this patient had presented with a drug rash, eosinophilia, and hepatitis WITHOUT epidermal detachment (rash but no Nikolsky sign), the diagnosis would shift to DRESS syndrome, and the management would include systemic corticosteroids as a primary treatment rather than burn unit transfer.',
  },

  // ═══ Q10: COLON CANCER SCREENING — Preventive/Screening, tier_1 ═══
  {
    system_topic: 'preventive',
    difficulty: 'medium',
    error_bucket: 'next_step_error',
    confusion_set_name: 'colorectal_cancer_screening_guidelines',
    transfer_rule_match: 'positive non-invasive colorectal',
    vignette: 'A 52-year-old man presents for a routine health maintenance visit. He has no gastrointestinal symptoms and no personal history of colorectal polyps or cancer. His father was diagnosed with colon cancer at age 72. He does not smoke and drinks alcohol socially. Physical examination, including digital rectal examination, is unremarkable. A fecal immunochemical test (FIT) performed at his last visit 2 weeks ago returned positive.',
    stem: 'Which of the following is the most appropriate next step in management?',
    option_a: 'Repeat fecal immunochemical test in 3 months',
    option_b: 'Colonoscopy',
    option_c: 'CT colonography',
    option_d: 'Stool DNA test (Cologuard)',
    option_e: 'Flexible sigmoidoscopy',
    correct_answer: 'B',
    error_map: { A: 'next_step_error', C: 'next_step_error', D: 'next_step_error', E: 'next_step_error' },
    transfer_rule_text: 'A positive non-invasive colorectal cancer screening test (FIT, stool DNA) always requires diagnostic colonoscopy — never repeat the non-invasive test. The non-invasive test is a gate to colonoscopy, not a substitute for it.',
    explanation_decision: 'What is the clinical pattern? An asymptomatic 52-year-old man with a positive FIT. His father was diagnosed with colon cancer at 72 — this does not change his risk category because the affected first-degree relative was diagnosed AFTER age 60 (high-risk family history requires FDR <60 or ≥2 FDRs at any age). What does this narrow to? A positive FIT requires diagnostic colonoscopy regardless of the patient\'s risk category or symptoms. What is the discriminating feature? The FIT is a SCREENING test — its role is to identify patients who need colonoscopy, not to diagnose cancer. A positive FIT has approximately a 3-5% positive predictive value for colorectal cancer and 20-30% for advanced adenomas. The ONLY appropriate response to a positive FIT is colonoscopy.',
    explanation_options: 'Repeat FIT (A) vs colonoscopy: this is the highest-yield trap — repeating a non-invasive test after a positive result is NEVER appropriate because it creates false reassurance. A subsequent negative FIT does not negate the first positive result. CT colonography (C) vs colonoscopy: CT colonography is a valid primary SCREENING modality, but after a positive FIT, the patient needs a therapeutic procedure that can biopsy and remove polyps — CT colonography cannot do this and would only delay definitive evaluation. Stool DNA (D) vs colonoscopy: ordering another non-invasive screening test after a positive screening test makes no clinical sense — the patient has already been flagged and needs direct visualization. Flexible sigmoidoscopy (E) vs colonoscopy: sigmoidoscopy only visualizes the distal colon and would miss right-sided lesions — after a positive FIT (which detects bleeding anywhere in the GI tract), complete colonic evaluation with colonoscopy is required.',
    explanation_summary: 'Approximately 5% of positive FIT results lead to a cancer diagnosis, and 20-30% reveal advanced adenomas — a positive FIT is not a false alarm but a meaningful clinical finding requiring colonoscopy. If this patient\'s father had been diagnosed with colon cancer at age 55 (before age 60), the screening strategy would have been different from the start — colonoscopy beginning at age 40 or 10 years before the youngest affected relative, repeated every 5 years, bypassing FIT entirely.',
  },
];

// ─── Main ───
async function main() {
  console.log('=== Seed Diverse Batch 2: 5 More Scope-Proving Questions ===\n');

  // Step 1: Insert confusion sets
  console.log('Inserting confusion sets...');
  const csMap = new Map<string, string>();

  for (const cs of CONFUSION_SETS) {
    const { data, error } = await supabase
      .from('confusion_sets')
      .upsert(
        {
          name: cs.name,
          conditions: cs.conditions,
          discriminating_clues: cs.discriminating_clues,
          common_traps: cs.common_traps,
        },
        { onConflict: 'name' }
      )
      .select('id')
      .single();

    if (error) {
      console.error(`  FAIL: ${cs.name} — ${error.message}`);
    } else {
      csMap.set(cs.name, data.id);
      console.log(`  Created: ${cs.name} → ${data.id}`);
    }
  }

  // Step 2: Insert transfer rules
  console.log('\nInserting transfer rules...');
  const trMap = new Map<string, string>();

  for (const tr of TRANSFER_RULES) {
    const key = tr.rule_text.toLowerCase().slice(0, 40);
    const { data, error } = await supabase
      .from('transfer_rules')
      .insert({
        rule_text: tr.rule_text,
        category: tr.category,
        topic: tr.topic,
      })
      .select('id')
      .single();
    if (error) {
      // May already exist from prior run
      console.error(`  SKIP: ${tr.rule_text.slice(0, 50)} — ${error.message}`);
    } else {
      trMap.set(key, data.id);
      console.log(`  Created: ${tr.rule_text.slice(0, 60)}... → ${data.id}`);
    }
  }

  // Step 3: Insert questions
  console.log('\nInserting 5 scope-diverse questions (batch 2)...');
  let inserted = 0;

  for (let i = 0; i < QUESTIONS.length; i++) {
    const q = QUESTIONS[i];
    const confusionSetId = csMap.get(q.confusion_set_name) ?? null;

    let transferRuleId: string | null = null;
    for (const [key, id] of trMap.entries()) {
      if (key.includes(q.transfer_rule_match.toLowerCase().slice(0, 30))) {
        transferRuleId = id;
        break;
      }
    }

    const { error } = await supabase.from('questions').insert({
      vignette: q.vignette,
      stem: q.stem,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      option_e: q.option_e,
      correct_answer: q.correct_answer,
      error_map: q.error_map,
      transfer_rule_text: q.transfer_rule_text,
      transfer_rule_id: transferRuleId,
      explanation_decision: q.explanation_decision,
      explanation_options: q.explanation_options,
      explanation_summary: q.explanation_summary,
      system_topic: q.system_topic,
      error_bucket: q.error_bucket,
      difficulty: q.difficulty,
      confusion_set_id: confusionSetId,
    });

    if (error) {
      console.error(`  Q${i + 6} FAIL: ${error.message}`);
    } else {
      inserted++;
      console.log(`  Q${i + 6} OK: [${q.system_topic}] ${q.stem.slice(0, 60)}... cs=${confusionSetId ? 'yes' : 'NO'} tr=${transferRuleId ? 'yes' : 'NO'}`);
    }
  }

  console.log(`\n=== Done: ${inserted}/${QUESTIONS.length} questions inserted ===`);

  // Step 4: Verify total
  const { data: verify, count } = await supabase
    .from('questions')
    .select('system_topic, difficulty, stem', { count: 'exact' });
  console.log(`\nTotal questions in DB: ${count}`);
  if (verify) {
    for (const q of verify) {
      console.log(`  [${q.system_topic}] ${q.difficulty} — ${q.stem.slice(0, 60)}...`);
    }
  }
}

main().catch(console.error);
