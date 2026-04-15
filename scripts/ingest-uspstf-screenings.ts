/**
 * Ingest USPSTF screening recommendations into Supabase.
 *
 * All data is hardcoded — no file parsing needed.
 * Idempotent: safe to re-run. Uses ON CONFLICT on display_id.
 *
 * Usage:
 *   npx tsx scripts/ingest-uspstf-screenings.ts
 *   npx tsx scripts/ingest-uspstf-screenings.ts --dry-run
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

// ─── Environment ───

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=]+)=(.+)$/);
  if (match) process.env[match[1]] = match[2];
}

const DRY_RUN = process.argv.includes('--dry-run');

// ─── Supabase Client ───

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

// ─── USPSTF Screening Data ───

type Grade = 'A' | 'B' | 'C' | 'D' | 'I';

interface ScreeningRow {
  display_id: string;
  condition: string;
  screening_test: string;
  sex: string | null;
  age_start: number | null;
  age_end: number | null;
  risk_group: string | null;
  population_detail: string | null;
  grade: Grade;
  is_recommended: boolean;
  frequency_text: string | null;
  frequency_months: number | null;
  special_notes: string | null;
  topic_tags: string[];
}

const SCREENINGS: ScreeningRow[] = [
  // ════════════════════════════════════════
  // BREAST CANCER
  // ════════════════════════════════════════
  {
    display_id: 'USPSTF.BREAST.001',
    condition: 'Breast Cancer',
    screening_test: 'Mammography',
    sex: 'female',
    age_start: 40,
    age_end: 49,
    risk_group: 'general',
    population_detail: 'Women ages 40-49, if risk factors present (family history)',
    grade: 'C',
    is_recommended: true,
    frequency_text: 'Individual decision if risk factors present',
    frequency_months: null,
    special_notes: 'Risk factors — Modifiable: HRT, nulliparity, increased age at first live birth, alcohol. Non-modifiable: genetic mutation or breast cancer in 1st degree relative, white race, increased age, early menarche or later menopause, excessive estrogen exposure without progesterone.',
    topic_tags: ['Preventive Medicine'],
  },
  {
    display_id: 'USPSTF.BREAST.002',
    condition: 'Breast Cancer',
    screening_test: 'Mammography',
    sex: 'female',
    age_start: 50,
    age_end: 74,
    risk_group: 'general',
    population_detail: 'Women ages 50-74',
    grade: 'B',
    is_recommended: true,
    frequency_text: 'Every 2 years',
    frequency_months: 24,
    special_notes: null,
    topic_tags: ['Preventive Medicine'],
  },

  // ════════════════════════════════════════
  // LUNG CANCER
  // ════════════════════════════════════════
  {
    display_id: 'USPSTF.LUNG.001',
    condition: 'Lung Cancer',
    screening_test: 'Low-dose chest CT',
    sex: null,
    age_start: 50,
    age_end: 80,
    risk_group: 'smoker_20py',
    population_detail: 'Current smoker with 20-year pack history or quit within 15 years',
    grade: 'B',
    is_recommended: true,
    frequency_text: 'Yearly',
    frequency_months: 12,
    special_notes: 'Termination of screening: quit for >15 years, or health problems that limit life expectancy.',
    topic_tags: ['Preventive Medicine'],
  },

  // ════════════════════════════════════════
  // COLORECTAL CANCER — General Population
  // ════════════════════════════════════════
  {
    display_id: 'USPSTF.CRC.001',
    condition: 'Colorectal Cancer',
    screening_test: 'FOBT or FIT',
    sex: null,
    age_start: 45,
    age_end: 75,
    risk_group: 'general',
    population_detail: 'Adults ages 45-75, average risk',
    grade: 'A',
    is_recommended: true,
    frequency_text: 'Yearly',
    frequency_months: 12,
    special_notes: null,
    topic_tags: ['Preventive Medicine'],
  },
  {
    display_id: 'USPSTF.CRC.002',
    condition: 'Colorectal Cancer',
    screening_test: 'Stool FIT-DNA',
    sex: null,
    age_start: 45,
    age_end: 75,
    risk_group: 'general',
    population_detail: 'Adults ages 45-75, average risk',
    grade: 'A',
    is_recommended: true,
    frequency_text: 'Every 1-3 years',
    frequency_months: null,
    special_notes: null,
    topic_tags: ['Preventive Medicine'],
  },
  {
    display_id: 'USPSTF.CRC.003',
    condition: 'Colorectal Cancer',
    screening_test: 'CT Colonography',
    sex: null,
    age_start: 45,
    age_end: 75,
    risk_group: 'general',
    population_detail: 'Adults ages 45-75, average risk',
    grade: 'A',
    is_recommended: true,
    frequency_text: 'Every 5 years',
    frequency_months: 60,
    special_notes: null,
    topic_tags: ['Preventive Medicine'],
  },
  {
    display_id: 'USPSTF.CRC.004',
    condition: 'Colorectal Cancer',
    screening_test: 'Sigmoidoscopy',
    sex: null,
    age_start: 45,
    age_end: 75,
    risk_group: 'general',
    population_detail: 'Adults ages 45-75, average risk',
    grade: 'A',
    is_recommended: true,
    frequency_text: 'Every 5 years',
    frequency_months: 60,
    special_notes: null,
    topic_tags: ['Preventive Medicine'],
  },
  {
    display_id: 'USPSTF.CRC.005',
    condition: 'Colorectal Cancer',
    screening_test: 'Sigmoidoscopy + Annual FIT',
    sex: null,
    age_start: 45,
    age_end: 75,
    risk_group: 'general',
    population_detail: 'Adults ages 45-75, average risk',
    grade: 'A',
    is_recommended: true,
    frequency_text: 'Sigmoidoscopy every 10 years + FIT yearly',
    frequency_months: null,
    special_notes: null,
    topic_tags: ['Preventive Medicine'],
  },
  {
    display_id: 'USPSTF.CRC.006',
    condition: 'Colorectal Cancer',
    screening_test: 'Colonoscopy',
    sex: null,
    age_start: 45,
    age_end: 75,
    risk_group: 'general',
    population_detail: 'Adults ages 45-75, average risk',
    grade: 'A',
    is_recommended: true,
    frequency_text: 'Every 10 years',
    frequency_months: 120,
    special_notes: null,
    topic_tags: ['Preventive Medicine'],
  },

  // ════════════════════════════════════════
  // COLORECTAL CANCER — High-Risk Groups
  // ════════════════════════════════════════
  {
    display_id: 'USPSTF.CRC.007',
    condition: 'Colorectal Cancer',
    screening_test: 'Colonoscopy',
    sex: null,
    age_start: 10,
    age_end: 12,
    risk_group: 'FAP',
    population_detail: 'Familial adenomatous polyposis (FAP), starting age 10-12',
    grade: 'B',
    is_recommended: true,
    frequency_text: 'Yearly',
    frequency_months: 12,
    special_notes: null,
    topic_tags: ['Preventive Medicine'],
  },
  {
    display_id: 'USPSTF.CRC.008',
    condition: 'Colorectal Cancer',
    screening_test: 'Colonoscopy',
    sex: null,
    age_start: 20,
    age_end: 25,
    risk_group: 'Lynch',
    population_detail: 'Lynch syndrome (HNPCC), starting age 20-25',
    grade: 'B',
    is_recommended: true,
    frequency_text: 'Every 1-2 years',
    frequency_months: null,
    special_notes: 'Genetic testing for Lynch syndrome recommended. Most common extracolonic malignancy associated with Lynch syndrome is endometrial cancer. Hysterectomy with bilateral salpingo-oophorectomy at end of childbearing age (~40 years) is recommended for women with Lynch syndrome.',
    topic_tags: ['Preventive Medicine'],
  },
  {
    display_id: 'USPSTF.CRC.009',
    condition: 'Colorectal Cancer',
    screening_test: 'Colonoscopy',
    sex: null,
    age_start: null,
    age_end: null,
    risk_group: 'IBD',
    population_detail: 'Inflammatory bowel disease, starting 8 years post-diagnosis',
    grade: 'B',
    is_recommended: true,
    frequency_text: 'Every 1-2 years',
    frequency_months: null,
    special_notes: 'Begin screening 8 years after diagnosis.',
    topic_tags: ['Preventive Medicine'],
  },
  {
    display_id: 'USPSTF.CRC.010',
    condition: 'Colorectal Cancer',
    screening_test: 'Colonoscopy',
    sex: null,
    age_start: 40,
    age_end: null,
    risk_group: 'FH_first_degree',
    population_detail: 'Family history: 1st degree relative diagnosed <60, starting age 40 or 10 years prior to dx age',
    grade: 'B',
    is_recommended: true,
    frequency_text: 'Every 3-5 years',
    frequency_months: null,
    special_notes: 'Start at age 40 or 10 years prior to age of relative\'s diagnosis, whichever is earlier.',
    topic_tags: ['Preventive Medicine'],
  },

  // ════════════════════════════════════════
  // CERVICAL CANCER
  // ════════════════════════════════════════
  {
    display_id: 'USPSTF.CERV.001',
    condition: 'Cervical Cancer',
    screening_test: 'Pap smear',
    sex: 'female',
    age_start: 21,
    age_end: 29,
    risk_group: 'general',
    population_detail: 'Women ages 21-29',
    grade: 'A',
    is_recommended: true,
    frequency_text: 'Every 3 years',
    frequency_months: 36,
    special_notes: null,
    topic_tags: ['Preventive Medicine'],
  },
  {
    display_id: 'USPSTF.CERV.002',
    condition: 'Cervical Cancer',
    screening_test: 'Pap smear alone or Pap smear + HPV co-testing',
    sex: 'female',
    age_start: 30,
    age_end: 65,
    risk_group: 'general',
    population_detail: 'Women ages 30-65',
    grade: 'A',
    is_recommended: true,
    frequency_text: 'Cytology alone every 3 years, or cytology + HPV every 5 years',
    frequency_months: null,
    special_notes: null,
    topic_tags: ['Preventive Medicine'],
  },
  {
    display_id: 'USPSTF.CERV.003',
    condition: 'Cervical Cancer',
    screening_test: 'Pap smear',
    sex: 'female',
    age_start: null,
    age_end: null,
    risk_group: 'HIV',
    population_detail: 'HIV-positive women, from onset of sexual intercourse or time of diagnosis',
    grade: 'A',
    is_recommended: true,
    frequency_text: 'Annually until 3 or more normal results, then routine',
    frequency_months: 12,
    special_notes: 'Begin at onset of sexual intercourse or time of HIV diagnosis.',
    topic_tags: ['Preventive Medicine'],
  },
  {
    display_id: 'USPSTF.CERV.004',
    condition: 'Cervical Cancer',
    screening_test: 'Annual Pap smear with HPV',
    sex: 'female',
    age_start: null,
    age_end: null,
    risk_group: 'immunosuppressed',
    population_detail: 'Immunosuppressed women, from onset of sexual intercourse',
    grade: 'A',
    is_recommended: true,
    frequency_text: 'Annually',
    frequency_months: 12,
    special_notes: 'Begin at onset of sexual intercourse. Annual Pap with HPV co-testing.',
    topic_tags: ['Preventive Medicine'],
  },

  // ════════════════════════════════════════
  // BLADDER CANCER
  // ════════════════════════════════════════
  {
    display_id: 'USPSTF.BLADDER.001',
    condition: 'Bladder Cancer',
    screening_test: 'None',
    sex: null,
    age_start: null,
    age_end: null,
    risk_group: 'general',
    population_detail: 'General population',
    grade: 'D',
    is_recommended: false,
    frequency_text: null,
    frequency_months: null,
    special_notes: 'Not recommended. High rates of false positives.',
    topic_tags: ['Preventive Medicine'],
  },

  // ════════════════════════════════════════
  // PROSTATE CANCER
  // ════════════════════════════════════════
  {
    display_id: 'USPSTF.PROSTATE.001',
    condition: 'Prostate Cancer',
    screening_test: 'PSA',
    sex: 'male',
    age_start: 55,
    age_end: 69,
    risk_group: 'general',
    population_detail: 'Men ages 55-69',
    grade: 'C',
    is_recommended: true,
    frequency_text: 'Individual decision',
    frequency_months: null,
    special_notes: 'Controversial. Individual decision based on shared decision-making. Potential benefits of screening are small and harms are significant.',
    topic_tags: ['Preventive Medicine'],
  },

  // ════════════════════════════════════════
  // ABDOMINAL AORTIC ANEURYSM
  // ════════════════════════════════════════
  {
    display_id: 'USPSTF.AAA.001',
    condition: 'Abdominal Aortic Aneurysm',
    screening_test: 'Abdominal ultrasound',
    sex: 'male',
    age_start: 65,
    age_end: 75,
    risk_group: 'ever_smoked',
    population_detail: 'Men ages 65-75 who have ever smoked',
    grade: 'B',
    is_recommended: true,
    frequency_text: 'Once',
    frequency_months: null,
    special_notes: 'Not recommended in women. Ultrasound is less expensive than CT/MRI.',
    topic_tags: ['Preventive Medicine'],
  },

  // ════════════════════════════════════════
  // DIABETES MELLITUS
  // ════════════════════════════════════════
  {
    display_id: 'USPSTF.DM.001',
    condition: 'Diabetes Mellitus',
    screening_test: 'Fasting glucose, HbA1c, or oral glucose tolerance test',
    sex: null,
    age_start: 35,
    age_end: 70,
    risk_group: 'overweight_obese',
    population_detail: 'Adults ages 35-70 who are overweight (BMI >= 25) or obese (BMI >= 30)',
    grade: 'B',
    is_recommended: true,
    frequency_text: 'Every 3 years',
    frequency_months: 36,
    special_notes: 'Recommended for overweight (BMI >= 25) or obese (BMI >= 30) adults.',
    topic_tags: ['Preventive Medicine'],
  },

  // ════════════════════════════════════════
  // HYPERLIPIDEMIA
  // ════════════════════════════════════════
  {
    display_id: 'USPSTF.LIPID.001',
    condition: 'Hyperlipidemia',
    screening_test: 'Lipid panel',
    sex: 'male',
    age_start: 35,
    age_end: null,
    risk_group: 'general',
    population_detail: 'Men ages 35+',
    grade: 'A',
    is_recommended: true,
    frequency_text: 'Every 5 years',
    frequency_months: 60,
    special_notes: null,
    topic_tags: ['Preventive Medicine'],
  },
  {
    display_id: 'USPSTF.LIPID.002',
    condition: 'Hyperlipidemia',
    screening_test: 'Lipid panel',
    sex: 'female',
    age_start: 45,
    age_end: null,
    risk_group: 'general',
    population_detail: 'Women ages 45+',
    grade: 'A',
    is_recommended: true,
    frequency_text: 'Every 5 years',
    frequency_months: 60,
    special_notes: null,
    topic_tags: ['Preventive Medicine'],
  },
  {
    display_id: 'USPSTF.LIPID.003',
    condition: 'Hyperlipidemia',
    screening_test: 'Lipid panel',
    sex: null,
    age_start: 20,
    age_end: null,
    risk_group: 'CVD_risk_factors',
    population_detail: 'Adults 20+ with diabetes, HTN, CAD, carotid disease, peripheral vascular disease, or aortic disease',
    grade: 'B',
    is_recommended: true,
    frequency_text: 'Every 5 years',
    frequency_months: 60,
    special_notes: 'Risk conditions: diabetes, HTN, CAD, carotid disease, peripheral vascular disease, aortic disease.',
    topic_tags: ['Preventive Medicine'],
  },

  // ════════════════════════════════════════
  // HYPERTENSION
  // ════════════════════════════════════════
  {
    display_id: 'USPSTF.HTN.001',
    condition: 'Hypertension',
    screening_test: 'Blood pressure measurement',
    sex: null,
    age_start: 18,
    age_end: null,
    risk_group: 'general',
    population_detail: 'All adults ages 18+',
    grade: 'A',
    is_recommended: true,
    frequency_text: 'Every 2 years',
    frequency_months: 24,
    special_notes: null,
    topic_tags: ['Preventive Medicine'],
  },

  // ════════════════════════════════════════
  // OSTEOPOROSIS
  // ════════════════════════════════════════
  {
    display_id: 'USPSTF.OSTEO.001',
    condition: 'Osteoporosis',
    screening_test: 'DEXA (dual-energy X-ray absorptiometry)',
    sex: 'female',
    age_start: null,
    age_end: 65,
    risk_group: 'postmenopausal',
    population_detail: 'Postmenopausal women under 65 with risk factors',
    grade: 'B',
    is_recommended: true,
    frequency_text: null,
    frequency_months: null,
    special_notes: 'T-score 1 to 2.5 SD below normal = osteopenia. T-score > 2.5 SD below normal = osteoporosis.',
    topic_tags: ['Preventive Medicine'],
  },
  {
    display_id: 'USPSTF.OSTEO.002',
    condition: 'Osteoporosis',
    screening_test: 'DEXA (dual-energy X-ray absorptiometry)',
    sex: 'female',
    age_start: 65,
    age_end: null,
    risk_group: 'general',
    population_detail: 'All women ages 65+',
    grade: 'B',
    is_recommended: true,
    frequency_text: null,
    frequency_months: null,
    special_notes: 'T-score 1 to 2.5 SD below normal = osteopenia. T-score > 2.5 SD below normal = osteoporosis.',
    topic_tags: ['Preventive Medicine'],
  },

  // ════════════════════════════════════════
  // INTIMATE PARTNER VIOLENCE
  // ════════════════════════════════════════
  {
    display_id: 'USPSTF.IPV.001',
    condition: 'Intimate Partner Violence',
    screening_test: 'Screening questionnaire',
    sex: 'female',
    age_start: null,
    age_end: null,
    risk_group: 'childbearing_age',
    population_detail: 'All women of childbearing age and appropriate patients',
    grade: 'B',
    is_recommended: true,
    frequency_text: null,
    frequency_months: null,
    special_notes: 'Cannot report without patient\'s consent.',
    topic_tags: ['Preventive Medicine'],
  },
];

// ─── Main ───

async function main() {
  console.log(`\n=== USPSTF Screening Ingestion ${DRY_RUN ? '(DRY RUN)' : ''} ===\n`);
  console.log(`Total recommendations: ${SCREENINGS.length}\n`);

  // Stats
  const byCondition: Record<string, number> = {};
  const byGrade: Record<string, number> = {};
  let recommended = 0;
  let notRecommended = 0;

  for (const s of SCREENINGS) {
    byCondition[s.condition] = (byCondition[s.condition] ?? 0) + 1;
    byGrade[s.grade] = (byGrade[s.grade] ?? 0) + 1;
    if (s.is_recommended) recommended++;
    else notRecommended++;
  }

  console.log('By condition:');
  for (const [condition, count] of Object.entries(byCondition).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${condition}: ${count}`);
  }

  console.log('\nBy grade:');
  for (const [grade, count] of Object.entries(byGrade).sort()) {
    console.log(`  Grade ${grade}: ${count}`);
  }

  console.log(`\nRecommended: ${recommended}, Not recommended: ${notRecommended}`);

  if (DRY_RUN) {
    console.log('\n--- DRY RUN complete. No database writes. ---\n');
    return;
  }

  // Upsert to Supabase
  const supabase = getSupabase();
  let upserted = 0;
  const errors: Array<{ display_id: string; error: string }> = [];

  for (let i = 0; i < SCREENINGS.length; i += 50) {
    const batch = SCREENINGS.slice(i, i + 50);
    const { error } = await supabase
      .from('uspstf_screening')
      .upsert(batch, { onConflict: 'display_id' });

    if (error) {
      for (const row of batch) {
        errors.push({ display_id: row.display_id, error: error.message });
      }
    } else {
      upserted += batch.length;
    }
  }

  console.log(`\n=== Database Results ===`);
  console.log(`Rows upserted: ${upserted}`);

  if (errors.length > 0) {
    console.log(`\nErrors (${errors.length}):`);
    for (const err of errors) {
      console.log(`  ${err.display_id}: ${err.error}`);
    }
  }

  console.log('\nDone.\n');
}

main().catch(console.error);
