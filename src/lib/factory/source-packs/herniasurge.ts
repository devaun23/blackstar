import type { SourcePack } from './types';

export const PACK_HS_HERNIA_2018: SourcePack = {
  source_pack_id: 'PACK.HS.HERNIA.2018',
  source_name: 'HerniaSurge 2018 International Guidelines for Groin Hernia Management',
  canonical_url: 'https://doi.org/10.1007/s10029-017-1668-x',
  publication_year: 2018,
  guideline_body: 'HerniaSurge',

  topic_tags: ['Inguinal Hernia', 'Groin Hernia', 'Hernia Repair', 'Mesh Repair', 'Surgery'],
  allowed_decision_scopes: [
    'inguinal hernia classification (direct vs indirect)',
    'incarcerated vs strangulated hernia',
    'mesh repair techniques (Lichtenstein, laparoscopic)',
    'watchful waiting for minimal symptoms',
    'emergent hernia repair indications',
    'femoral hernia management',
  ],
  excluded_decision_scopes: [
    'incisional hernia management',
    'parastomal hernia',
    'hiatal hernia repair',
    'pediatric inguinal hernia',
    'sportsman hernia (athletic pubalgia)',
  ],

  recommendations: [
    {
      rec_id: 'PACK.HS.HERNIA.2018.REC.01',
      display_id: 'HS-R1',
      statement: 'Mesh-based repair is recommended over suture repair for inguinal hernia in adults. The Lichtenstein open tension-free mesh repair is the gold standard open technique.',
      normalized_claim: 'Mesh repair preferred over suture repair for inguinal hernia. Lichtenstein tension-free mesh is gold standard open technique.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Surgical Technique', page_or_location: 'Chapter 11' },
    },
    {
      rec_id: 'PACK.HS.HERNIA.2018.REC.02',
      display_id: 'HS-R2',
      statement: 'Laparoscopic repair (TEP or TAPP) is recommended for bilateral and recurrent inguinal hernias. It offers faster recovery and less chronic pain compared to open repair, but requires greater technical expertise.',
      normalized_claim: 'Laparoscopic TEP/TAPP preferred for bilateral and recurrent inguinal hernias. Faster recovery, less chronic pain, but higher learning curve.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Laparoscopic Repair', page_or_location: 'Chapter 12' },
    },
    {
      rec_id: 'PACK.HS.HERNIA.2018.REC.03',
      display_id: 'HS-R3',
      statement: 'Watchful waiting is an acceptable strategy for men with minimally symptomatic or asymptomatic inguinal hernias. The risk of incarceration in watchful waiting patients is low (0.2%/year).',
      normalized_claim: 'Watchful waiting acceptable for minimally symptomatic inguinal hernia. Incarceration risk ~0.2%/year. Repair when symptoms warrant.',
      strength: 'conditional',
      evidence_quality: 'moderate',
      population: 'Men with minimal symptoms; does not apply to femoral hernias',
      provenance: { section: 'Indications for Surgery', page_or_location: 'Chapter 5' },
    },
    {
      rec_id: 'PACK.HS.HERNIA.2018.REC.04',
      display_id: 'HS-R4',
      statement: 'Femoral hernias should always be repaired due to high incarceration and strangulation risk. All groin hernias in women should be explored with consideration of femoral hernia.',
      normalized_claim: 'Femoral hernias: always repair (high strangulation risk). In women with groin hernia, always consider/exclude femoral hernia.',
      strength: 'strong',
      evidence_quality: 'moderate',
      provenance: { section: 'Femoral Hernia', page_or_location: 'Chapter 18' },
    },
  ],

  diagnostic_criteria: [
    {
      criterion_id: 'PACK.HS.HERNIA.2018.DC.01',
      display_id: 'HS-DC1',
      name: 'Direct vs Indirect Inguinal Hernia Classification',
      components: [
        'Indirect: hernia sac passes through the internal (deep) inguinal ring, lateral to the inferior epigastric vessels. Follows the inguinal canal, may extend into scrotum.',
        'Direct: hernia protrudes through the posterior wall of the inguinal canal (Hesselbach triangle), medial to the inferior epigastric vessels. Rarely enters scrotum.',
        'Hesselbach triangle boundaries: inguinal ligament (inferiorly), inferior epigastric vessels (laterally), lateral border of rectus abdominis (medially)',
      ],
      interpretation: 'Distinction is primarily surgical/anatomic. Indirect hernias are more common and more likely to incarcerate due to narrow neck at internal ring. Direct hernias have wide base, lower incarceration risk.',
      normalized_claim: 'Indirect inguinal hernia = lateral to inferior epigastric vessels (through internal ring). Direct = medial (Hesselbach triangle). Indirect more likely to incarcerate.',
      provenance: { section: 'Anatomy and Classification', page_or_location: 'Chapter 3' },
    },
  ],

  thresholds: [
    {
      threshold_id: 'PACK.HS.HERNIA.2018.T.01',
      display_id: 'HS-T1',
      parameter: 'Incarceration risk with watchful waiting',
      value: '0.2',
      unit: '% per year',
      clinical_meaning: 'Annual incarceration risk during watchful waiting is approximately 0.2%, supporting the safety of observation in minimally symptomatic inguinal hernias.',
      normalized_claim: 'Inguinal hernia incarceration risk during watchful waiting is ~0.2%/year, supporting safety of observation for asymptomatic hernias.',
      direction: 'below',
      provenance: { section: 'Indications for Surgery', page_or_location: 'Chapter 5' },
    },
  ],

  treatment_steps: [
    {
      step_id: 'PACK.HS.HERNIA.2018.TX.01',
      display_id: 'HS-TX1',
      action: 'Elective Lichtenstein mesh repair for symptomatic inguinal hernia',
      normalized_claim: 'Symptomatic inguinal hernia: elective Lichtenstein tension-free mesh repair under local, regional, or general anesthesia. Prophylactic antibiotics reduce surgical site infection in open mesh repair.',
      timing: 'Elective scheduling based on symptoms',
      condition: 'Symptomatic unilateral primary inguinal hernia',
      provenance: { section: 'Open Mesh Repair', page_or_location: 'Chapter 11' },
    },
    {
      step_id: 'PACK.HS.HERNIA.2018.TX.02',
      display_id: 'HS-TX2',
      action: 'Emergent surgery for strangulated inguinal hernia',
      normalized_claim: 'Strangulated hernia: emergent surgery. Assess bowel viability. If viable, reduce and repair. If non-viable, resect necrotic bowel. Mesh may be used even in contaminated field with appropriate antibiotics.',
      timing: 'Emergent — within hours',
      condition: 'Strangulated inguinal hernia with signs of bowel ischemia',
      contraindications: ['Patient refusal'],
      provenance: { section: 'Emergency Surgery', page_or_location: 'Chapter 16' },
    },
    {
      step_id: 'PACK.HS.HERNIA.2018.TX.03',
      display_id: 'HS-TX3',
      action: 'Manual reduction of incarcerated (non-strangulated) hernia',
      normalized_claim: 'Incarcerated non-strangulated hernia: attempt gentle manual reduction with analgesia/sedation and Trendelenburg position. If successful, schedule elective repair. If unsuccessful or strangulation suspected, emergent surgery.',
      timing: 'Upon presentation',
      condition: 'Incarcerated inguinal hernia without strangulation signs',
      contraindications: ['Signs of strangulation', 'Peritonitis', 'Suspected bowel necrosis'],
      provenance: { section: 'Emergency Management', page_or_location: 'Chapter 16' },
    },
  ],

  red_flags: [
    {
      flag_id: 'PACK.HS.HERNIA.2018.RF.01',
      display_id: 'HS-RF1',
      finding: 'Incarcerated hernia with overlying skin erythema, fever, tachycardia, and severe tenderness',
      implication: 'Strangulated hernia with bowel ischemia or necrosis. Risk of perforation and peritonitis.',
      action: 'Emergent surgical exploration. Do not attempt manual reduction if strangulation is suspected. Anticipate bowel resection.',
      urgency: 'immediate',
      provenance: { section: 'Emergency Surgery', page_or_location: 'Chapter 16' },
    },
  ],

  severity_definitions: [
    {
      severity_id: 'PACK.HS.HERNIA.2018.SEV.01',
      display_id: 'HS-SEV1',
      level: 'Reducible Inguinal Hernia',
      criteria: [
        'Groin bulge that reduces spontaneously or with gentle pressure',
        'No significant pain beyond mild discomfort',
        'No signs of incarceration or obstruction',
      ],
      management_implications:
        'Elective repair when symptomatic. Watchful waiting acceptable for minimal symptoms (incarceration risk 0.2%/yr). Counsel on warning signs of incarceration.',
      provenance: { section: 'Classification', page_or_location: 'Chapter 3' },
    },
    {
      severity_id: 'PACK.HS.HERNIA.2018.SEV.02',
      display_id: 'HS-SEV2',
      level: 'Strangulated Inguinal Hernia',
      criteria: [
        'Irreducible hernia with compromised blood supply to contents',
        'Severe pain, tenderness, overlying skin changes (erythema, warmth)',
        'Signs of bowel obstruction (nausea, vomiting, distension)',
        'Systemic toxicity (fever, tachycardia, leukocytosis)',
      ],
      management_implications:
        'Surgical emergency. Emergent exploration, bowel viability assessment, possible resection. Do not attempt manual reduction. IV antibiotics, fluid resuscitation, NPO. Mortality increases with delay.',
      provenance: { section: 'Emergency Surgery', page_or_location: 'Chapter 16' },
    },
  ],

  source_pack_version: 1,
  status: 'active',
  last_normalized: '2026-04-16',
  normalizer_version: 1,
  normalization_notes: 'Surgery pack: Inguinal hernia. Covers direct vs indirect classification, mesh repair (Lichtenstein), laparoscopic approach, watchful waiting, incarceration/strangulation management.',

  all_item_ids: [
    'PACK.HS.HERNIA.2018.REC.01', 'PACK.HS.HERNIA.2018.REC.02', 'PACK.HS.HERNIA.2018.REC.03',
    'PACK.HS.HERNIA.2018.REC.04',
    'PACK.HS.HERNIA.2018.DC.01',
    'PACK.HS.HERNIA.2018.T.01',
    'PACK.HS.HERNIA.2018.TX.01', 'PACK.HS.HERNIA.2018.TX.02', 'PACK.HS.HERNIA.2018.TX.03',
    'PACK.HS.HERNIA.2018.RF.01',
    'PACK.HS.HERNIA.2018.SEV.01', 'PACK.HS.HERNIA.2018.SEV.02',
  ],
  all_display_ids: [
    'HS-R1', 'HS-R2', 'HS-R3', 'HS-R4',
    'HS-DC1',
    'HS-T1',
    'HS-TX1', 'HS-TX2', 'HS-TX3',
    'HS-RF1',
    'HS-SEV1', 'HS-SEV2',
  ],
};
