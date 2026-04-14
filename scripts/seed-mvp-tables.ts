import { createClient } from '@supabase/supabase-js';

// Inline admin client — scripts can't use @/ path aliases
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const CONFUSION_SETS = [
  {
    id: 'a1000000-0000-0000-0000-000000000001',
    name: 'Acute Dyspnea',
    conditions: [
      { name: 'CHF exacerbation', key_clues: ['orthopnea', 'JVD', 'bilateral crackles', 'BNP >400'] },
      { name: 'COPD exacerbation', key_clues: ['wheezing', 'barrel chest', 'smoking hx', 'hyperinflated CXR'] },
      { name: 'Pneumonia', key_clues: ['fever', 'productive cough', 'focal consolidation'] },
      { name: 'PE', key_clues: ['sudden onset', 'pleuritic pain', 'risk factors', 'tachycardia'] },
    ],
    discriminating_clues: {
      CHF_vs_COPD: 'BNP level + CXR pattern (bilateral infiltrates vs hyperinflation)',
      CHF_vs_pneumonia: 'Bilateral vs focal CXR findings + BNP',
      PE_vs_pneumonia: 'Sudden onset + risk factors vs fever + productive cough',
      COPD_vs_PE: 'Chronic vs acute onset + D-dimer',
    },
    common_traps: [
      'Seeing crackles and assuming CHF without checking BNP',
      'Missing PE in a patient with COPD history who has new acute dyspnea',
      'Treating pneumonia without considering PE when fever is absent',
    ],
  },
  {
    id: 'a1000000-0000-0000-0000-000000000002',
    name: 'Renal Syndromes',
    conditions: [
      { name: 'Prerenal', key_clues: ['BUN:Cr >20:1', 'FENa <1%', 'concentrated urine', 'hypovolemia signs'] },
      { name: 'ATN', key_clues: ['muddy brown casts', 'FENa >2%', 'BUN:Cr <20:1'] },
      { name: 'Nephritic', key_clues: ['RBC casts', 'hematuria', 'HTN', 'oliguria'] },
      { name: 'Nephrotic', key_clues: ['proteinuria >3.5g', 'edema', 'hyperlipidemia', 'fatty casts'] },
    ],
    discriminating_clues: {
      prerenal_vs_ATN: 'FENa <1% vs >2% and urine sediment',
      nephritic_vs_nephrotic: 'RBC casts + HTN vs fatty casts + massive proteinuria',
      ATN_vs_nephritic: 'Muddy brown casts vs RBC casts',
    },
    common_traps: [
      'Seeing edema and jumping to nephrotic without quantifying proteinuria',
      'Seeing elevated creatinine and assuming ATN without checking FENa',
      'Treating prerenal with fluids when it has progressed to ATN',
    ],
  },
  {
    id: 'a1000000-0000-0000-0000-000000000003',
    name: 'Hyponatremia',
    conditions: [
      { name: 'SIADH', key_clues: ['euvolemic', 'concentrated urine', 'low serum osm', 'high urine Na >40'] },
      { name: 'Psychogenic polydipsia', key_clues: ['dilute urine', 'low urine osm <100', 'psychiatric hx'] },
      { name: 'Diabetes insipidus', key_clues: ['polyuria', 'dilute urine', 'high serum osm'] },
      { name: 'Adrenal insufficiency', key_clues: ['hypovolemic', 'hyperkalemia', 'hypoglycemia', 'hyperpigmentation'] },
    ],
    discriminating_clues: {
      SIADH_vs_polydipsia: 'Urine osmolality — concentrated (>100) in SIADH, dilute (<100) in polydipsia',
      SIADH_vs_adrenal: 'Volume status — euvolemic in SIADH, hypovolemic in adrenal',
      DI_vs_SIADH: 'Serum osmolality — high in DI, low in SIADH',
    },
    common_traps: [
      'Diagnosing SIADH without checking volume status',
      'Missing adrenal insufficiency hyperkalemia',
      'Confusing DI polyuria with polydipsia',
    ],
  },
  {
    id: 'a1000000-0000-0000-0000-000000000004',
    name: 'Diabetic Emergencies',
    conditions: [
      { name: 'DKA', key_clues: ['Type 1', 'anion gap', 'ketones positive', 'pH <7.3', 'Kussmaul breathing'] },
      { name: 'HHS', key_clues: ['Type 2', 'glucose >600', 'hyperosmolar >320', 'minimal ketosis', 'pH >7.3'] },
    ],
    discriminating_clues: {
      DKA_vs_HHS: 'Ketone level + pH + glucose magnitude — DKA has acidosis and ketones, HHS has extreme hyperglycemia without significant acidosis',
    },
    common_traps: [
      'Assuming all diabetic emergencies are DKA',
      'Missing HHS because glucose is very high and assuming DKA',
      'Not checking pH to distinguish',
    ],
  },
  {
    id: 'a1000000-0000-0000-0000-000000000005',
    name: 'Chest Pain',
    conditions: [
      { name: 'ACS', key_clues: ['pressure/squeezing', 'troponin elevation', 'ECG changes', 'risk factors'] },
      { name: 'GERD', key_clues: ['burning', 'postprandial', 'positional relief', 'no troponin'] },
      { name: 'PE', key_clues: ['pleuritic', 'sudden', 'tachycardia', 'risk factors'] },
      { name: 'Aortic dissection', key_clues: ['tearing', 'radiates to back', 'BP differential', 'wide mediastinum'] },
    ],
    discriminating_clues: {
      ACS_vs_GERD: 'Troponin + ECG — GERD has neither',
      ACS_vs_PE: 'ECG pattern + risk factor profile',
      ACS_vs_dissection: 'Pain quality (pressure vs tearing) + BP differential + CXR',
      PE_vs_dissection: 'D-dimer vs CT angiography, pleuritic vs tearing',
    },
    common_traps: [
      'Anchoring on GERD when troponin is subtly elevated',
      'Missing dissection because it presents like ACS',
      'Treating ACS without ruling out dissection when BP is asymmetric',
    ],
  },
  {
    id: 'a1000000-0000-0000-0000-000000000006',
    name: 'Cirrhosis Complications',
    conditions: [
      { name: 'SBP', key_clues: ['ascitic PMN >250', 'fever', 'abdominal pain', 'peritoneal signs'] },
      { name: 'Hepatic encephalopathy', key_clues: ['asterixis', 'confusion', 'elevated ammonia', 'precipitant identified'] },
      { name: 'Hepatorenal syndrome', key_clues: ['rising Cr', 'low urine Na', 'no response to fluids', 'diagnosis of exclusion'] },
    ],
    discriminating_clues: {
      SBP_vs_encephalopathy: 'Ascitic fluid analysis vs mental status + asterixis',
      SBP_vs_hepatorenal: 'Fever + PMN count vs progressive renal failure',
      encephalopathy_vs_hepatorenal: 'Mental status vs renal function as primary finding',
    },
    common_traps: [
      'Seeing confusion in cirrhosis and assuming encephalopathy without ruling out SBP',
      'Missing hepatorenal because you treated as prerenal',
      'Not doing paracentesis in cirrhotic with any clinical change',
    ],
  },
  {
    id: 'a1000000-0000-0000-0000-000000000007',
    name: 'GI Bleeding',
    conditions: [
      { name: 'PUD bleed', key_clues: ['hematemesis', 'coffee-ground emesis', 'NSAID or H pylori hx', 'epigastric pain'] },
      { name: 'Variceal bleed', key_clues: ['massive hematemesis', 'cirrhosis', 'portal HTN signs', 'splenomegaly'] },
      { name: 'Lower GI bleed', key_clues: ['hematochezia', 'usually less hemodynamic compromise', 'older patient', 'diverticulosis'] },
    ],
    discriminating_clues: {
      PUD_vs_variceal: 'Cirrhosis history + volume of bleeding — variceal is typically more massive',
      upper_vs_lower: 'Hematemesis/coffee-ground vs hematochezia, BUN:Cr ratio elevation suggests upper',
    },
    common_traps: [
      'Assuming all upper GI bleeds are PUD without considering varices in cirrhotic',
      'Missing upper source when presenting as hematochezia (brisk upper bleed)',
    ],
  },
  {
    id: 'a1000000-0000-0000-0000-000000000008',
    name: 'Leg Swelling Pain',
    conditions: [
      { name: 'Cellulitis', key_clues: ['warm', 'red', 'advancing border', 'fever', 'responds to antibiotics'] },
      { name: 'DVT', key_clues: ['unilateral swelling', 'pitting edema', 'risk factors', 'calf tenderness'] },
      { name: 'Necrotizing fasciitis', key_clues: ['pain out of proportion', 'crepitus', 'rapid progression', 'systemic toxicity', 'bullae'] },
    ],
    discriminating_clues: {
      cellulitis_vs_DVT: 'Erythema + warmth vs swelling + risk factors — duplex US distinguishes',
      cellulitis_vs_nec_fasc: 'Pain:appearance ratio — nec fasc has pain far exceeding visible findings',
      DVT_vs_nec_fasc: 'Swelling vs pain out of proportion + systemic toxicity',
    },
    common_traps: [
      'Treating cellulitis when pain is out of proportion to appearance (missing nec fasc)',
      'Assuming DVT without considering cellulitis or vice versa',
      'Delaying surgical consult in suspected nec fasc',
    ],
  },
  {
    id: 'a1000000-0000-0000-0000-000000000009',
    name: 'Anemias',
    conditions: [
      { name: 'Iron deficiency', key_clues: ['low ferritin', 'high TIBC', 'low iron', 'microcytic'] },
      { name: 'Thalassemia trait', key_clues: ['normal ferritin', 'target cells', 'microcytic but mild', 'elevated RBC count', 'Mentzer <13'] },
      { name: 'Anemia of chronic disease', key_clues: ['low iron', 'low TIBC', 'normal-high ferritin', 'normocytic or microcytic'] },
    ],
    discriminating_clues: {
      iron_def_vs_thal: 'Ferritin (low vs normal) + RBC count (low vs elevated) + Mentzer index',
      iron_def_vs_ACD: 'TIBC (high vs low) + ferritin (low vs normal-high)',
      thal_vs_ACD: 'RBC count + MCV — thal has high RBC count with very low MCV',
    },
    common_traps: [
      'Seeing microcytic anemia and assuming iron deficiency without checking ferritin',
      'Missing thalassemia trait because you did not notice the elevated RBC count',
      'Giving iron to anemia of chronic disease',
    ],
  },
  {
    id: 'a1000000-0000-0000-0000-000000000010',
    name: 'Meningitis Spectrum',
    conditions: [
      { name: 'Bacterial meningitis', key_clues: ['PMN predominant CSF', 'low glucose', 'high protein', 'acute onset', 'fever + nuchal rigidity'] },
      { name: 'Viral meningitis', key_clues: ['lymphocyte predominant', 'normal glucose', 'mild protein elevation', 'less toxic'] },
      { name: 'HSV encephalitis', key_clues: ['temporal lobe MRI', 'seizures', 'behavioral changes', 'lymphocytic CSF', 'RBCs in CSF'] },
    ],
    discriminating_clues: {
      bacterial_vs_viral: 'CSF glucose (low vs normal) + WBC type (PMN vs lymphocyte) + clinical toxicity',
      viral_vs_HSV: 'Temporal lobe involvement + seizures + behavioral changes distinguish HSV',
      bacterial_vs_HSV: 'CSF profile similar but HSV has temporal lobe findings and RBCs',
    },
    common_traps: [
      'Treating all meningitis as bacterial without CSF analysis',
      'Missing HSV encephalitis because CSF looks viral',
      'Not starting empiric antibiotics while awaiting CSF in suspected bacterial',
    ],
  },
];

const TRANSFER_RULES = [
  { rule_text: 'If hemodynamically unstable, stabilize before any diagnostic refinement.', category: 'severity_miss' },
  { rule_text: 'In any acute presentation, scan the vitals before reading the history — unstable vitals change everything.', category: 'severity_miss' },
  { rule_text: 'If two interventions are both correct, the one addressing the immediate threat to life comes first.', category: 'severity_miss' },
  { rule_text: 'If you know the diagnosis, ask: is the question testing diagnosis, confirmation, or management?', category: 'next_step_error' },
  { rule_text: 'Naming the disease is never the final step — always ask what do I DO about it.', category: 'next_step_error' },
  { rule_text: 'When the diagnosis is obvious, the question is probably testing management priority or timing.', category: 'next_step_error' },
  { rule_text: 'If one detail jumps out, look for a second detail that contradicts it before committing.', category: 'premature_closure' },
  { rule_text: 'In chest pain, lethal causes must be excluded before benign ones are accepted.', category: 'premature_closure' },
  { rule_text: 'When the stem says despite treatment or fails to improve, reopen the differential.', category: 'premature_closure' },
  { rule_text: 'In hyponatremia, volume status and urine studies matter more than the sodium value alone.', category: 'confusion_set_miss' },
  { rule_text: 'In AKI, urine indices and sediment often separate the diagnostic fork.', category: 'confusion_set_miss' },
  { rule_text: 'In acute dyspnea, CXR pattern plus BNP plus history separates cardiac from pulmonary from embolic.', category: 'confusion_set_miss' },
  { rule_text: 'In anemia workup, ferritin is the single most useful first test.', category: 'confusion_set_miss' },
  { rule_text: 'Sensitivity rules out (SnNOut), specificity rules in (SpPIn).', category: 'test_interpretation_miss' },
  { rule_text: 'In ABG interpretation, always calculate the anion gap before interpreting the pH.', category: 'test_interpretation_miss' },
  { rule_text: 'Do not treat the lab value — treat the patient. Abnormal labs in asymptomatic patients may need monitoring, not intervention.', category: 'test_interpretation_miss' },
  { rule_text: 'In STEMI, time to reperfusion is the outcome — every minute of delay costs myocardium.', category: 'next_step_error' },
  { rule_text: 'Empiric antibiotics before culture results in sepsis — do not wait for confirmation.', category: 'severity_miss' },
  { rule_text: 'In stroke, image FIRST to distinguish ischemic from hemorrhagic — treatment is opposite.', category: 'next_step_error' },
  { rule_text: 'When two answers seem equally correct, ask which one is the MOST immediate priority.', category: 'next_step_error' },
];

async function main() {
  const supabase = createAdminClient();

  // Seed confusion sets — upsert by name
  console.log('Seeding confusion sets...');
  for (const cs of CONFUSION_SETS) {
    const { error } = await supabase
      .from('confusion_sets')
      .upsert(
        {
          id: cs.id,
          name: cs.name,
          conditions: cs.conditions,
          discriminating_clues: cs.discriminating_clues,
          common_traps: cs.common_traps,
        },
        { onConflict: 'id' }
      );
    if (error) {
      console.error(`  Failed: ${cs.name} — ${error.message}`);
    } else {
      console.log(`  OK: ${cs.name}`);
    }
  }

  // Seed transfer rules — upsert by rule_text
  console.log('\nSeeding transfer rules...');
  for (const tr of TRANSFER_RULES) {
    // Check if exists
    const { data: existing } = await supabase
      .from('transfer_rules')
      .select('id')
      .eq('rule_text', tr.rule_text)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`  Skip (exists): ${tr.rule_text.slice(0, 60)}...`);
      continue;
    }

    const { error } = await supabase
      .from('transfer_rules')
      .insert(tr);
    if (error) {
      console.error(`  Failed: ${tr.rule_text.slice(0, 60)}... — ${error.message}`);
    } else {
      console.log(`  OK: ${tr.rule_text.slice(0, 60)}...`);
    }
  }

  // Verify counts
  const { count: csCount } = await supabase.from('confusion_sets').select('*', { count: 'exact', head: true });
  const { count: trCount } = await supabase.from('transfer_rules').select('*', { count: 'exact', head: true });
  console.log(`\nDone. confusion_sets: ${csCount}, transfer_rules: ${trCount}`);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
