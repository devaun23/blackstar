import type { SourcePack } from './types';

export const PACK_AAP_AOM_2013: SourcePack = {
  source_pack_id: 'PACK.AAP.AOM.2013',
  source_name: 'AAP 2013 Clinical Practice Guideline: The Diagnosis and Management of Acute Otitis Media',
  source_registry_id: 'REG.AAP.AOM',
  canonical_url: 'https://doi.org/10.1542/peds.2012-3488',
  publication_year: 2013,
  guideline_body: 'AAP',

  topic_tags: ['Acute Otitis Media', 'Otitis Media with Effusion', 'Pediatric ENT', 'Antibiotics'],
  allowed_decision_scopes: [
    'AOM diagnosis',
    'AOM vs OME differentiation',
    'observation vs antibiotic decision',
    'first-line antibiotic selection',
    'treatment failure management',
    'tympanostomy tube indications',
  ],
  excluded_decision_scopes: [
    'chronic suppurative otitis media',
    'cholesteatoma management',
    'hearing loss evaluation beyond OME',
    'mastoiditis surgical management',
  ],

  recommendations: [
    {
      rec_id: 'PACK.AAP.AOM.2013.REC.01',
      display_id: 'AAP-AOM-R1',
      statement: 'Clinicians should diagnose AOM in children who present with moderate to severe bulging of the tympanic membrane or new onset otorrhea not due to otitis externa.',
      normalized_claim: 'AOM diagnosis requires moderate-severe TM bulging or new-onset otorrhea (not otitis externa); mild bulging alone is insufficient without other signs.',
      strength: 'strong',
      evidence_quality: 'moderate',
      provenance: { section: 'Diagnosis', page_or_location: 'Section 2.1' },
    },
    {
      rec_id: 'PACK.AAP.AOM.2013.REC.02',
      display_id: 'AAP-AOM-R2',
      statement: 'Amoxicillin (80-90 mg/kg/day) is the first-line antibiotic for AOM when antibiotics are indicated.',
      normalized_claim: 'Amoxicillin 80-90 mg/kg/day divided BID is first-line for AOM; covers S. pneumoniae, the most common and most virulent pathogen.',
      strength: 'strong',
      evidence_quality: 'moderate',
      provenance: { section: 'Antibiotic Selection', page_or_location: 'Section 3.2' },
    },
    {
      rec_id: 'PACK.AAP.AOM.2013.REC.03',
      display_id: 'AAP-AOM-R3',
      statement: 'An observation option (watchful waiting for 48-72 hours with safety-net antibiotic prescription) may be offered for select children with non-severe AOM.',
      normalized_claim: 'Observation option for 48-72h is appropriate for: age >=2 years with unilateral non-severe AOM, or age 6-23 months with unilateral non-severe AOM without otorrhea.',
      strength: 'conditional',
      evidence_quality: 'moderate',
      context: 'Requires reliable follow-up and a safety-net antibiotic prescription',
      provenance: { section: 'Initial Management', page_or_location: 'Section 3.1' },
    },
  ],

  diagnostic_criteria: [
    {
      criterion_id: 'PACK.AAP.AOM.2013.DC.01',
      display_id: 'AAP-AOM-DC1',
      name: 'AOM Diagnostic Criteria',
      components: [
        'Moderate to severe bulging of the tympanic membrane',
        'OR new onset of otorrhea not due to otitis externa',
        'OR mild bulging of TM PLUS recent (<48h) onset of ear pain (or ear tugging in nonverbal child) OR intense TM erythema',
        'Middle ear effusion must be present (confirmed by pneumatic otoscopy, tympanometry, or acoustic reflectometry)',
      ],
      threshold: 'Must distinguish from OME which has effusion WITHOUT signs of acute infection',
      interpretation: 'AOM = acute infection of middle ear with effusion + signs of inflammation. OME = effusion without acute infection signs. Pneumatic otoscopy is the gold standard diagnostic tool.',
      normalized_claim: 'AOM requires middle ear effusion plus acute inflammatory signs (TM bulging, otorrhea, or erythema with pain); OME has effusion without acute signs.',
      provenance: { section: 'Diagnosis', page_or_location: 'Section 2.1' },
    },
  ],

  thresholds: [
    {
      threshold_id: 'PACK.AAP.AOM.2013.T.01',
      display_id: 'AAP-AOM-T1',
      parameter: 'Age threshold for mandatory antibiotic treatment',
      value: '6',
      unit: 'months',
      clinical_meaning: 'Children <6 months with AOM should receive antibiotics (no observation option) due to higher risk of complications and immune immaturity.',
      normalized_claim: 'Children <6 months with AOM require antibiotics; observation option not appropriate.',
      direction: 'below',
      provenance: { section: 'Treatment by Age', page_or_location: 'Table 3' },
    },
    {
      threshold_id: 'PACK.AAP.AOM.2013.T.02',
      display_id: 'AAP-AOM-T2',
      parameter: 'Recurrent AOM episodes for tympanostomy tube referral',
      value: '3',
      unit: 'episodes in 6 months or 4 in 12 months',
      clinical_meaning: 'Children with >=3 episodes in 6 months or >=4 in 12 months (with >=1 recent) meet criteria for ENT referral for tympanostomy tubes.',
      normalized_claim: 'Recurrent AOM (>=3 episodes/6mo or >=4/12mo) warrants ENT referral for tympanostomy tubes.',
      direction: 'above',
      provenance: { section: 'Recurrent AOM', page_or_location: 'Section 4.1' },
    },
  ],

  treatment_steps: [
    {
      step_id: 'PACK.AAP.AOM.2013.TX.01',
      display_id: 'AAP-AOM-TX1',
      action: 'First-line antibiotic therapy with amoxicillin',
      normalized_claim: 'Amoxicillin 80-90 mg/kg/day divided BID for 10 days (<2 years) or 5-7 days (>=2 years with mild disease).',
      timing: 'At diagnosis or after failed 48-72h observation',
      condition: 'AOM requiring antibiotic treatment (bilateral, severe, age <6 months, or otorrhea)',
      drug_details: { drug: 'Amoxicillin', dose: '80-90 mg/kg/day', route: 'PO divided BID', duration: '10 days (<2yr) or 5-7 days (>=2yr)' },
      contraindications: ['Penicillin allergy (use cefdinir, cefuroxime, or azithromycin)'],
      provenance: { section: 'Antibiotic Selection', page_or_location: 'Section 3.2' },
    },
    {
      step_id: 'PACK.AAP.AOM.2013.TX.02',
      display_id: 'AAP-AOM-TX2',
      action: 'Second-line therapy for treatment failure',
      normalized_claim: 'Amoxicillin-clavulanate (90 mg/kg/day amoxicillin component) for treatment failure after 48-72h of amoxicillin; covers beta-lactamase-producing H. influenzae and M. catarrhalis.',
      timing: 'After 48-72 hours of failed first-line therapy',
      condition: 'Persistent AOM symptoms after 48-72 hours of amoxicillin',
      drug_details: { drug: 'Amoxicillin-clavulanate', dose: '90 mg/kg/day (amoxicillin component)', route: 'PO divided BID' },
      escalation: 'If second-line fails: tympanocentesis for culture or IM ceftriaxone x 3 days',
      provenance: { section: 'Treatment Failure', page_or_location: 'Section 3.3' },
    },
    {
      step_id: 'PACK.AAP.AOM.2013.TX.03',
      display_id: 'AAP-AOM-TX3',
      action: 'Tympanostomy tubes for recurrent AOM',
      normalized_claim: 'Tympanostomy tubes recommended for recurrent AOM (>=3 episodes/6mo or >=4/12mo) to reduce episode frequency and antibiotic exposure.',
      timing: 'After meeting recurrence criteria',
      condition: 'Recurrent AOM meeting frequency criteria',
      provenance: { section: 'Surgical Management', page_or_location: 'Section 4.1' },
    },
  ],

  red_flags: [
    {
      flag_id: 'PACK.AAP.AOM.2013.RF.01',
      display_id: 'AAP-AOM-RF1',
      finding: 'Acute mastoiditis: postauricular swelling, erythema, and tenderness with protruding pinna in a child with AOM',
      implication: 'Intracranial complication risk (epidural abscess, lateral sinus thrombosis, meningitis). Requires parenteral antibiotics and likely surgical drainage.',
      action: 'IV antibiotics (ceftriaxone + clindamycin or vancomycin). CT temporal bone. ENT consultation for possible mastoidectomy.',
      urgency: 'immediate',
      provenance: { section: 'Complications', page_or_location: 'Section 5.1' },
    },
  ],

  severity_definitions: [
    {
      severity_id: 'PACK.AAP.AOM.2013.SEV.01',
      display_id: 'AAP-AOM-SEV1',
      level: 'Non-severe AOM',
      criteria: [
        'Mild otalgia for <48 hours',
        'Temperature <39C (102.2F)',
        'No otorrhea',
        'Unilateral in child >=2 years',
      ],
      management_implications:
        'Observation option appropriate for children >=2 years with unilateral non-severe AOM. Provide safety-net antibiotic prescription to fill if symptoms worsen or do not improve in 48-72 hours. Pain management with ibuprofen or acetaminophen.',
      provenance: { section: 'Severity Classification', page_or_location: 'Table 3' },
    },
    {
      severity_id: 'PACK.AAP.AOM.2013.SEV.02',
      display_id: 'AAP-AOM-SEV2',
      level: 'Severe AOM',
      criteria: [
        'Moderate-severe otalgia',
        'Temperature >=39C (102.2F)',
        'Otorrhea present',
        'OR bilateral AOM in child <2 years',
      ],
      management_implications:
        'Immediate antibiotic therapy with amoxicillin 80-90 mg/kg/day. No observation option. Duration 10 days for children <2 years. Adequate pain management. Re-evaluate if no improvement in 48-72 hours; escalate to amoxicillin-clavulanate.',
      provenance: { section: 'Severity Classification', page_or_location: 'Table 3' },
    },
  ],

  source_pack_version: 1,
  status: 'active',
  last_normalized: '2026-04-16',
  normalizer_version: 1,
  normalization_notes: 'Pediatrics pack for AOM per AAP 2013 guideline. Covers diagnosis, observation option, antibiotic selection, treatment failure, and recurrent AOM management.',

  all_item_ids: [
    'PACK.AAP.AOM.2013.REC.01', 'PACK.AAP.AOM.2013.REC.02', 'PACK.AAP.AOM.2013.REC.03',
    'PACK.AAP.AOM.2013.DC.01',
    'PACK.AAP.AOM.2013.T.01', 'PACK.AAP.AOM.2013.T.02',
    'PACK.AAP.AOM.2013.TX.01', 'PACK.AAP.AOM.2013.TX.02', 'PACK.AAP.AOM.2013.TX.03',
    'PACK.AAP.AOM.2013.RF.01',
    'PACK.AAP.AOM.2013.SEV.01', 'PACK.AAP.AOM.2013.SEV.02',
  ],
  all_display_ids: [
    'AAP-AOM-R1', 'AAP-AOM-R2', 'AAP-AOM-R3',
    'AAP-AOM-DC1',
    'AAP-AOM-T1', 'AAP-AOM-T2',
    'AAP-AOM-TX1', 'AAP-AOM-TX2', 'AAP-AOM-TX3',
    'AAP-AOM-RF1',
    'AAP-AOM-SEV1', 'AAP-AOM-SEV2',
  ],
};
