// Maps DI frontmatter topic tags → Blackstar blueprint_node.topic values
// Maps to all Step 2 CK and shelf exam topics. The original 20 IM topics
// from Phase 1 are still here; new topics are added as content is ingested.

/**
 * Known Blackstar topics. This is NOT a hard filter — it's a type-safe
 * reference for the mapping tables below. Topics not in this list can
 * still exist in blueprint_node; they just won't be auto-resolved from
 * DI tags until a mapping is added here.
 */
export const KNOWN_TOPICS = [
  // Phase 1 IM topics (original 20)
  'Acute Coronary Syndrome',
  'Pulmonary Embolism',
  'Deep Vein Thrombosis',
  'Sepsis',
  'GI Bleed',
  'Acute Pancreatitis',
  'Cirrhosis / SBP',
  'Acute Kidney Injury',
  'DKA / HHS',
  'Stroke',
  'Transient Ischemic Attack',
  'Syncope',
  'Heart Failure',
  'COPD Exacerbation',
  'Asthma Exacerbation',
  'Community-Acquired Pneumonia',
  'Infective Endocarditis',
  'Meningitis',
  'Hypercalcemia',
  'Arrhythmias',

  // Psychiatry topics
  'Bipolar Disorder',
  'Major Depressive Disorder',
  'Psychotic Disorders',
  'Anxiety Disorders',
  'OCD',
  'PTSD',
  'Personality Disorders',
  'Substance Use Disorders',
  'Delirium',
  'Dementia',
  'Eating Disorders',
  'Sleep Disorders',
  'ADHD',
  'Child & Adolescent Psychiatry',
  'Factitious Disorders',

  // Pediatrics topics
  'Neonatology',
  'Pediatric Genetics / Syndromes',
  'Immunodeficiency',
  'Growth and Development',
  'Congenital Heart Disease',
  'Pediatric Respiratory',
  'Pediatric Endocrine',
  'Pediatric Renal',
  'Pediatric Heme-Onc',
  'Pediatric Infectious Disease',
  'Pediatric MSK / Rheumatology',
  'Pediatric Neurology',
] as const;

export type KnownTopic = (typeof KNOWN_TOPICS)[number];

// Keep Phase1Topic as alias for backward compatibility with existing imports
export type Phase1Topic = KnownTopic;
export { KNOWN_TOPICS as PHASE1_TOPICS };

/**
 * DI frontmatter tag → Blackstar topic(s).
 * A single DI tag can map to multiple Blackstar topics (e.g., 'gi' covers
 * GI Bleed, Pancreatitis, and Cirrhosis). The parser uses section headings
 * to disambiguate when possible.
 */
export const diTagToTopics: Record<string, KnownTopic[]> = {
  // Cardiovascular
  'acs': ['Acute Coronary Syndrome'],
  'coronary-artery-disease': ['Acute Coronary Syndrome'],
  'cardiology': ['Acute Coronary Syndrome', 'Heart Failure', 'Arrhythmias', 'Syncope', 'Infective Endocarditis'],
  'cardiovascular': ['Acute Coronary Syndrome', 'Heart Failure', 'Arrhythmias', 'Syncope'],
  'heart-failure': ['Heart Failure'],
  'arrhythmias': ['Arrhythmias'],
  'murmurs': ['Heart Failure'],
  'valvular-disease': ['Infective Endocarditis'],
  'valvular-heart-disease': ['Infective Endocarditis'],
  'endocarditis': ['Infective Endocarditis'],
  'endocarditis-prophylaxis': ['Infective Endocarditis'],
  'cardiogenic-shock': ['Acute Coronary Syndrome', 'Heart Failure'],
  'post-MI-complications': ['Acute Coronary Syndrome'],
  'hocm': ['Syncope'],
  'hemodynamics': ['Sepsis', 'Heart Failure'],
  'pericarditis': ['Acute Coronary Syndrome'],
  'acls': ['Arrhythmias'],

  // Pulmonary
  'pulmonary-embolism': ['Pulmonary Embolism'],
  'venous-disease': ['Pulmonary Embolism', 'Deep Vein Thrombosis'],
  'pulmonology': ['COPD Exacerbation', 'Asthma Exacerbation', 'Community-Acquired Pneumonia', 'Pulmonary Embolism'],
  'copd': ['COPD Exacerbation'],
  'asthma': ['Asthma Exacerbation'],
  'pneumonia': ['Community-Acquired Pneumonia'],
  'pna': ['Community-Acquired Pneumonia'],
  'anticoagulation': ['Pulmonary Embolism', 'Deep Vein Thrombosis'],

  // GI
  'gi': ['GI Bleed', 'Acute Pancreatitis', 'Cirrhosis / SBP'],
  'pancreatitis': ['Acute Pancreatitis'],
  'cirrhosis': ['Cirrhosis / SBP'],
  'hepatology': ['Cirrhosis / SBP'],
  'hepatobiliary': ['Cirrhosis / SBP'],
  'hepatic-encephalopathy': ['Cirrhosis / SBP'],
  'hepatitis': ['Cirrhosis / SBP'],
  'viral-hepatitis': ['Cirrhosis / SBP'],
  'peptic-ulcer-disease': ['GI Bleed'],
  'ibd': ['GI Bleed'],

  // Renal
  'nephrology': ['Acute Kidney Injury'],
  'electrolytes': ['Acute Kidney Injury'],
  'potassium': ['Acute Kidney Injury'],
  'sodium': ['Acute Kidney Injury'],
  'calcium': ['Hypercalcemia', 'Acute Kidney Injury'],
  'acid-base': ['Acute Kidney Injury'],

  // Endocrine
  'endocrinology': ['DKA / HHS', 'Hypercalcemia'],
  'dka': ['DKA / HHS'],
  'hhs': ['DKA / HHS'],
  'diabetes-medications': ['DKA / HHS'],
  'hyperthyroidism': ['Arrhythmias'],
  'thyroid-storm': ['Arrhythmias'],

  // Neurology
  'stroke': ['Stroke', 'Transient Ischemic Attack'],
  'stroke-localization': ['Stroke'],

  // Infectious Disease
  'infectious-disease': ['Sepsis', 'Community-Acquired Pneumonia', 'Meningitis', 'Infective Endocarditis'],
  'sepsis': ['Sepsis'],
  'meningitis': ['Meningitis'],
  'antibiotics': ['Sepsis', 'Community-Acquired Pneumonia', 'Meningitis'],
  'critical-care': ['Sepsis'],

  // Pharmacology (maps to conditions the drugs treat)
  'pharmacology': ['Acute Coronary Syndrome', 'Heart Failure', 'Arrhythmias', 'Pulmonary Embolism'],
  'antihypertensives': ['Heart Failure'],
  'antiplatelet': ['Acute Coronary Syndrome'],
  'reversal-agents': ['Pulmonary Embolism', 'Deep Vein Thrombosis'],

  // Syncope
  'syncope': ['Syncope'],

  // ── Psychiatry ──
  'mood-disorders': ['Bipolar Disorder', 'Major Depressive Disorder'],
  'bipolar': ['Bipolar Disorder'],
  'depression': ['Major Depressive Disorder'],
  'psychotic-disorders': ['Psychotic Disorders'],
  'schizophrenia': ['Psychotic Disorders'],
  'anxiety': ['Anxiety Disorders', 'OCD', 'PTSD'],
  'ocd': ['OCD'],
  'ptsd': ['PTSD'],
  'personality-disorders': ['Personality Disorders'],
  'substance-use': ['Substance Use Disorders'],
  'substance-abuse': ['Substance Use Disorders'],
  'alcohol': ['Substance Use Disorders'],
  'delirium-dementia': ['Delirium', 'Dementia'],
  'delirium': ['Delirium'],
  'dementia': ['Dementia'],
  'eating-disorders': ['Eating Disorders'],
  'sleep-disorders': ['Sleep Disorders'],
  'child-psychiatry': ['ADHD', 'Child & Adolescent Psychiatry'],
  'adhd': ['ADHD'],
  'development': ['Child & Adolescent Psychiatry'],
  'factitious-malingering': ['Factitious Disorders'],
  'psychopharmacology': ['Bipolar Disorder', 'Major Depressive Disorder', 'Psychotic Disorders', 'Anxiety Disorders'],

  // ── Pediatrics ──
  'neonatology': ['Neonatology'],
  'newborn-screening': ['Neonatology'],
  'jaundice': ['Neonatology'],
  'respiratory-distress': ['Neonatology'],
  'torch': ['Neonatology', 'Pediatric Infectious Disease'],
  'genetics': ['Pediatric Genetics / Syndromes'],
  'chromosomal-disorders': ['Pediatric Genetics / Syndromes'],
  'immunodeficiency': ['Immunodeficiency'],
  'growth-development': ['Growth and Development'],
  'milestones': ['Growth and Development'],
  'immunizations': ['Growth and Development'],
  'chd': ['Congenital Heart Disease'],
  'congenital-heart': ['Congenital Heart Disease'],
  'cystic-fibrosis': ['Pediatric Respiratory'],
  'pediatric-asthma': ['Pediatric Respiratory'],
  'pediatric-diabetes': ['Pediatric Endocrine'],
  'nephrotic': ['Pediatric Renal'],
  'nephritic': ['Pediatric Renal'],
  'sickle-cell': ['Pediatric Heme-Onc'],
  'pediatric-anemia': ['Pediatric Heme-Onc'],
  'pediatric-oncology': ['Pediatric Heme-Onc'],
  'exanthems': ['Pediatric Infectious Disease'],
  'pediatric-meningitis': ['Pediatric Infectious Disease'],
  'hip-dysplasia': ['Pediatric MSK / Rheumatology'],
  'kawasaki': ['Pediatric MSK / Rheumatology'],
  'jra': ['Pediatric MSK / Rheumatology'],
  'seizures': ['Pediatric Neurology'],
  'hydrocephalus': ['Pediatric Neurology'],
  'neuromuscular': ['Pediatric Neurology'],
};

/**
 * Section heading keywords → specific Blackstar topic.
 * Used to disambiguate within multi-topic episodes. The parser checks
 * if a section heading contains these keywords to narrow the topic assignment.
 */
export const headingToTopic: Record<string, KnownTopic> = {
  // ACS
  'acs': 'Acute Coronary Syndrome',
  'stemi': 'Acute Coronary Syndrome',
  'nstemi': 'Acute Coronary Syndrome',
  'myocardial infarction': 'Acute Coronary Syndrome',
  'mi ': 'Acute Coronary Syndrome',
  'troponin': 'Acute Coronary Syndrome',
  'coronary': 'Acute Coronary Syndrome',
  'angina': 'Acute Coronary Syndrome',
  'post-mi': 'Acute Coronary Syndrome',

  // PE / DVT
  'pulmonary embolism': 'Pulmonary Embolism',
  'pe ': 'Pulmonary Embolism',
  'wells': 'Pulmonary Embolism',
  'd-dimer': 'Pulmonary Embolism',
  'dvt': 'Deep Vein Thrombosis',
  'deep vein': 'Deep Vein Thrombosis',
  'anticoagul': 'Pulmonary Embolism',

  // Heart Failure
  'heart failure': 'Heart Failure',
  'chf': 'Heart Failure',
  'hfref': 'Heart Failure',
  'hfpef': 'Heart Failure',
  'bnp': 'Heart Failure',
  'diuretic': 'Heart Failure',

  // Arrhythmias
  'arrhythmia': 'Arrhythmias',
  'afib': 'Arrhythmias',
  'atrial fibrillation': 'Arrhythmias',
  'svt': 'Arrhythmias',
  'vtach': 'Arrhythmias',
  'bradycardia': 'Arrhythmias',
  'tachycardia': 'Arrhythmias',
  'long qt': 'Arrhythmias',
  'wpw': 'Arrhythmias',

  // GI
  'gi bleed': 'GI Bleed',
  'upper gi': 'GI Bleed',
  'lower gi': 'GI Bleed',
  'melena': 'GI Bleed',
  'hematemesis': 'GI Bleed',
  'variceal': 'GI Bleed',
  'pancreatitis': 'Acute Pancreatitis',
  'pancrea': 'Acute Pancreatitis',
  'ranson': 'Acute Pancreatitis',
  'cirrhosis': 'Cirrhosis / SBP',
  'sbp': 'Cirrhosis / SBP',
  'ascites': 'Cirrhosis / SBP',
  'hepatic encephalopathy': 'Cirrhosis / SBP',
  'portal hypertension': 'Cirrhosis / SBP',
  'hepatorenal': 'Cirrhosis / SBP',

  // Renal
  'aki': 'Acute Kidney Injury',
  'acute kidney': 'Acute Kidney Injury',
  'renal failure': 'Acute Kidney Injury',
  'creatinine': 'Acute Kidney Injury',
  'dialysis': 'Acute Kidney Injury',
  'electrolyte': 'Acute Kidney Injury',
  'hyperkalemia': 'Acute Kidney Injury',
  'hyponatremia': 'Acute Kidney Injury',

  // DKA / HHS
  'dka': 'DKA / HHS',
  'diabetic ketoacidosis': 'DKA / HHS',
  'hhs': 'DKA / HHS',
  'hyperosmolar': 'DKA / HHS',
  'insulin': 'DKA / HHS',
  'anion gap': 'DKA / HHS',

  // Stroke / TIA
  'stroke': 'Stroke',
  'tpa': 'Stroke',
  'thrombolytic': 'Stroke',
  'tia': 'Transient Ischemic Attack',
  'transient ischemic': 'Transient Ischemic Attack',
  'abcd2': 'Transient Ischemic Attack',

  // Syncope
  'syncope': 'Syncope',
  'vasovagal': 'Syncope',

  // Pneumonia
  'pneumonia': 'Community-Acquired Pneumonia',
  'curb-65': 'Community-Acquired Pneumonia',
  'cap ': 'Community-Acquired Pneumonia',
  'copd': 'COPD Exacerbation',
  'asthma': 'Asthma Exacerbation',

  // Infectious
  'endocarditis': 'Infective Endocarditis',
  'duke': 'Infective Endocarditis',
  'meningitis': 'Meningitis',
  'csf': 'Meningitis',
  'sepsis': 'Sepsis',
  'septic shock': 'Sepsis',
  'vasopressor': 'Sepsis',

  // Hypercalcemia
  'hypercalcemia': 'Hypercalcemia',
  'calcium': 'Hypercalcemia',
  'pth': 'Hypercalcemia',

  // ── Psychiatry ──
  // Mood disorders
  'bipolar': 'Bipolar Disorder',
  'mania': 'Bipolar Disorder',
  'manic': 'Bipolar Disorder',
  'lithium': 'Bipolar Disorder',
  'mood stabilizer': 'Bipolar Disorder',
  'valproate': 'Bipolar Disorder',
  'carbamazepine': 'Bipolar Disorder',
  'lamotrigine': 'Bipolar Disorder',
  'depressive disorder': 'Major Depressive Disorder',
  'mdd': 'Major Depressive Disorder',
  'antidepressant': 'Major Depressive Disorder',
  'ssri': 'Major Depressive Disorder',
  'maoi': 'Major Depressive Disorder',
  'tricyclic': 'Major Depressive Disorder',
  'tca': 'Major Depressive Disorder',
  'snri': 'Major Depressive Disorder',
  'bupropion': 'Major Depressive Disorder',
  'atypical depression': 'Major Depressive Disorder',
  'bereavement': 'Major Depressive Disorder',
  'adjustment disorder': 'Major Depressive Disorder',

  // Psychotic disorders
  'schizophrenia': 'Psychotic Disorders',
  'schizoaffective': 'Psychotic Disorders',
  'psychotic': 'Psychotic Disorders',
  'delusion': 'Psychotic Disorders',
  'antipsychotic': 'Psychotic Disorders',
  'haloperidol': 'Psychotic Disorders',
  'clozapine': 'Psychotic Disorders',
  'eps': 'Psychotic Disorders',
  'tardive dyskinesia': 'Psychotic Disorders',
  'neuroleptic malignant': 'Psychotic Disorders',
  'nms': 'Psychotic Disorders',

  // Anxiety disorders
  'anxiety': 'Anxiety Disorders',
  'panic': 'Anxiety Disorders',
  'phobia': 'Anxiety Disorders',
  'gad': 'Anxiety Disorders',
  'generalized anxiety': 'Anxiety Disorders',
  'buspirone': 'Anxiety Disorders',
  'benzodiazepine': 'Anxiety Disorders',
  'ocd': 'OCD',
  'obsessive': 'OCD',
  'compulsive': 'OCD',
  'ptsd': 'PTSD',
  'post-traumatic': 'PTSD',
  'posttraumatic': 'PTSD',

  // Personality disorders
  'personality disorder': 'Personality Disorders',
  'cluster a': 'Personality Disorders',
  'cluster b': 'Personality Disorders',
  'cluster c': 'Personality Disorders',
  'borderline': 'Personality Disorders',
  'antisocial': 'Personality Disorders',
  'narcissistic': 'Personality Disorders',
  'histrionic': 'Personality Disorders',
  'schizoid': 'Personality Disorders',
  'schizotypal': 'Personality Disorders',
  'avoidant': 'Personality Disorders',
  'dependent': 'Personality Disorders',

  // Substance use
  'substance': 'Substance Use Disorders',
  'alcohol withdrawal': 'Substance Use Disorders',
  'delirium tremens': 'Substance Use Disorders',
  'opioid': 'Substance Use Disorders',
  'naloxone': 'Substance Use Disorders',
  'cocaine': 'Substance Use Disorders',
  'pcp': 'Substance Use Disorders',
  'cannabis': 'Substance Use Disorders',
  'wernicke': 'Substance Use Disorders',
  'korsakoff': 'Substance Use Disorders',

  // Delirium & dementia
  'delirium': 'Delirium',
  'alzheimer': 'Dementia',
  'frontotemporal': 'Dementia',
  'pick': 'Dementia',
  'lewy body': 'Dementia',
  'vascular dementia': 'Dementia',
  'creutzfeldt': 'Dementia',
  'normal pressure hydrocephalus': 'Dementia',
  'nph': 'Dementia',
  'neurosyphilis': 'Dementia',

  // Eating disorders
  'anorexia': 'Eating Disorders',
  'bulimia': 'Eating Disorders',
  'eating disorder': 'Eating Disorders',
  'refeeding': 'Eating Disorders',

  // Sleep disorders
  'insomnia': 'Sleep Disorders',
  'sleep apnea': 'Sleep Disorders',
  'narcolepsy': 'Sleep Disorders',
  'restless leg': 'Sleep Disorders',
  'sleep': 'Sleep Disorders',

  // Child psychiatry
  'adhd': 'ADHD',
  'methylphenidate': 'ADHD',
  'conduct disorder': 'Child & Adolescent Psychiatry',
  'oppositional defiant': 'Child & Adolescent Psychiatry',
  'tourette': 'Child & Adolescent Psychiatry',
  'autism': 'Child & Adolescent Psychiatry',
  'asperger': 'Child & Adolescent Psychiatry',
  'rett': 'Child & Adolescent Psychiatry',
  'intellectual disability': 'Child & Adolescent Psychiatry',
  'fragile x': 'Child & Adolescent Psychiatry',
  'down syndrome': 'Child & Adolescent Psychiatry',
  'development': 'Child & Adolescent Psychiatry',
  'enuresis': 'Child & Adolescent Psychiatry',
  'encopresis': 'Child & Adolescent Psychiatry',

  // Factitious
  'factitious': 'Factitious Disorders',
  'munchausen': 'Factitious Disorders',
  'malingering': 'Factitious Disorders',

  // ── Pediatrics ──
  // Neonatology
  'newborn': 'Neonatology',
  'neonatal': 'Neonatology',
  'apgar': 'Neonatology',
  'jaundice': 'Neonatology',
  'hyperbilirubinemia': 'Neonatology',
  'kernicterus': 'Neonatology',
  'torch': 'Neonatology',
  'rds': 'Neonatology',
  'meconium aspiration': 'Neonatology',
  'pyloric stenosis': 'Neonatology',
  'intussusception': 'Neonatology',
  'hirschsprung': 'Neonatology',
  'necrotizing enterocolitis': 'Neonatology',
  'gastroschisis': 'Neonatology',
  'omphalocele': 'Neonatology',
  'cryptorchidism': 'Neonatology',
  'hypospadias': 'Neonatology',
  'congenital adrenal': 'Neonatology',
  'infant of diabetic': 'Neonatology',

  // Genetics / Syndromes
  'down syndrome': 'Pediatric Genetics / Syndromes',
  'trisomy': 'Pediatric Genetics / Syndromes',
  'turner': 'Pediatric Genetics / Syndromes',
  'klinefelter': 'Pediatric Genetics / Syndromes',
  'fragile x': 'Pediatric Genetics / Syndromes',
  'prader-willi': 'Pediatric Genetics / Syndromes',
  'angelman': 'Pediatric Genetics / Syndromes',
  'williams': 'Pediatric Genetics / Syndromes',
  'fetal alcohol': 'Pediatric Genetics / Syndromes',
  'neurofibromatosis': 'Pediatric Genetics / Syndromes',
  'pierre robin': 'Pediatric Genetics / Syndromes',

  // Immunodeficiency
  'bruton': 'Immunodeficiency',
  'scid': 'Immunodeficiency',
  'digeorge': 'Immunodeficiency',
  'wiskott': 'Immunodeficiency',
  'granulomatous disease': 'Immunodeficiency',
  'iga deficiency': 'Immunodeficiency',

  // Growth & Development
  'milestone': 'Growth and Development',
  'reflex': 'Growth and Development',
  'immunization': 'Growth and Development',
  'vaccine': 'Growth and Development',
  'growth': 'Growth and Development',
  'potty training': 'Growth and Development',
  'enuresis': 'Growth and Development',

  // Congenital Heart Disease
  'tetralogy': 'Congenital Heart Disease',
  'transposition': 'Congenital Heart Disease',
  'vsd': 'Congenital Heart Disease',
  'asd': 'Congenital Heart Disease',
  'coarctation': 'Congenital Heart Disease',
  'pda': 'Congenital Heart Disease',
  'truncus': 'Congenital Heart Disease',
  'ebstein': 'Congenital Heart Disease',
  'endocardial cushion': 'Congenital Heart Disease',
  'hocm': 'Congenital Heart Disease',
  'rheumatic fever': 'Congenital Heart Disease',

  // Pediatric Respiratory
  'cystic fibrosis': 'Pediatric Respiratory',

  // Pediatric Renal
  'nephrotic': 'Pediatric Renal',
  'nephritic': 'Pediatric Renal',
  'berger': 'Pediatric Renal',
  'iga nephropathy': 'Pediatric Renal',
  'post-strep': 'Pediatric Renal',
  'goodpasture': 'Pediatric Renal',
  'alport': 'Pediatric Renal',
  'kidney stone': 'Pediatric Renal',

  // Pediatric Heme-Onc
  'sickle cell': 'Pediatric Heme-Onc',
  'thalassemia': 'Pediatric Heme-Onc',
  'iron deficiency': 'Pediatric Heme-Onc',
  'lead poisoning': 'Pediatric Heme-Onc',
  'blackfan': 'Pediatric Heme-Onc',
  'fanconi': 'Pediatric Heme-Onc',
  'itp': 'Pediatric Heme-Onc',
  'hemophilia': 'Pediatric Heme-Onc',
  'von willebrand': 'Pediatric Heme-Onc',
  'hus': 'Pediatric Heme-Onc',
  'henoch': 'Pediatric Heme-Onc',
  'hsp': 'Pediatric Heme-Onc',
  'leukemia': 'Pediatric Heme-Onc',
  'lymphoma': 'Pediatric Heme-Onc',
  'neuroblastoma': 'Pediatric Heme-Onc',
  'wilms': 'Pediatric Heme-Onc',

  // Pediatric Infectious Disease
  'roseola': 'Pediatric Infectious Disease',
  'fifth disease': 'Pediatric Infectious Disease',
  'erythema infectiosum': 'Pediatric Infectious Disease',
  'scarlet fever': 'Pediatric Infectious Disease',
  'measles': 'Pediatric Infectious Disease',
  'rubella': 'Pediatric Infectious Disease',
  'hand-foot': 'Pediatric Infectious Disease',
  'mumps': 'Pediatric Infectious Disease',
  'lyme': 'Pediatric Infectious Disease',
  'rocky mountain': 'Pediatric Infectious Disease',
  'impetigo': 'Pediatric Infectious Disease',
  'scalded skin': 'Pediatric Infectious Disease',
  'croup': 'Pediatric Infectious Disease',
  'epiglottitis': 'Pediatric Infectious Disease',
  'bronchiolitis': 'Pediatric Infectious Disease',
  'whooping cough': 'Pediatric Infectious Disease',
  'pertussis': 'Pediatric Infectious Disease',
  'otitis': 'Pediatric Infectious Disease',

  // Pediatric MSK / Rheumatology
  'legg-calve': 'Pediatric MSK / Rheumatology',
  'perthes': 'Pediatric MSK / Rheumatology',
  'osgood': 'Pediatric MSK / Rheumatology',
  'slipped capital': 'Pediatric MSK / Rheumatology',
  'scfe': 'Pediatric MSK / Rheumatology',
  'hip dysplasia': 'Pediatric MSK / Rheumatology',
  'kawasaki': 'Pediatric MSK / Rheumatology',
  'jra': 'Pediatric MSK / Rheumatology',
  'juvenile rheumatoid': 'Pediatric MSK / Rheumatology',
  'ewing': 'Pediatric MSK / Rheumatology',
  'osteosarcoma': 'Pediatric MSK / Rheumatology',

  // Pediatric Neurology
  'febrile seizure': 'Pediatric Neurology',
  'infantile spasm': 'Pediatric Neurology',
  'absence seizure': 'Pediatric Neurology',
  'hydrocephalus': 'Pediatric Neurology',
  'dandy-walker': 'Pediatric Neurology',
  'tay-sachs': 'Pediatric Neurology',
  'werdnig': 'Pediatric Neurology',
  'charcot-marie': 'Pediatric Neurology',
  'friedreich': 'Pediatric Neurology',
};

/**
 * Resolve Blackstar topics for a DI evidence item.
 *
 * Strategy:
 * 1. Check section heading against headingToTopic keywords (most specific)
 * 2. If no heading match, use episode-level DI tags via diTagToTopics
 * 3. Return deduplicated array of matching topics
 *
 * Returns empty array for unmapped content — those items are still stored
 * but won't be auto-linked to blueprint nodes until mappings are added.
 */
export function resolveTopics(
  sectionHeading: string,
  episodeTags: string[],
): KnownTopic[] {
  const topics = new Set<KnownTopic>();

  // 1. Section heading matching (highest specificity)
  const headingLower = sectionHeading.toLowerCase();
  for (const [keyword, topic] of Object.entries(headingToTopic)) {
    if (headingLower.includes(keyword)) {
      topics.add(topic);
    }
  }

  // If heading matched specific topics, use those (more precise)
  if (topics.size > 0) return [...topics];

  // 2. Fall back to episode-level tag mapping
  for (const tag of episodeTags) {
    const mapped = diTagToTopics[tag];
    if (mapped) {
      for (const t of mapped) topics.add(t);
    }
  }

  return [...topics];
}
