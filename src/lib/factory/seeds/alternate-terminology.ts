export interface AlternateTerminologySeed {
  nbme_phrasing: string;
  clinical_concept: string;
  context: string;
}

export const alternateTerminology: AlternateTerminologySeed[] = [
  {
    nbme_phrasing: 'most appropriate next step in management',
    clinical_concept: 'next_step',
    context: 'Standard stem asking for the immediate next action',
  },
  {
    nbme_phrasing: 'most likely diagnosis',
    clinical_concept: 'diagnosis',
    context: 'Asking for the single best diagnosis given the presentation',
  },
  {
    nbme_phrasing: 'most appropriate pharmacotherapy',
    clinical_concept: 'drug_choice',
    context: 'Asking specifically for medication selection',
  },
  {
    nbme_phrasing: 'best initial diagnostic study',
    clinical_concept: 'diagnostic_test',
    context: 'First-line imaging or lab to order',
  },
  {
    nbme_phrasing: 'which of the following is most likely to confirm the diagnosis',
    clinical_concept: 'confirmatory_test',
    context: 'Gold standard or definitive test',
  },
  {
    nbme_phrasing: 'most important initial step',
    clinical_concept: 'stabilization',
    context: 'Often implies ABCs or hemodynamic stabilization before workup',
  },
  {
    nbme_phrasing: 'which of the following is the strongest risk factor',
    clinical_concept: 'risk_identification',
    context: 'Epidemiologic or clinical risk factor recognition',
  },
  {
    nbme_phrasing: 'most likely complication',
    clinical_concept: 'complication_recognition',
    context: 'Predicting disease progression or treatment side effects',
  },
  {
    nbme_phrasing: 'mechanism of action',
    clinical_concept: 'pharmacology_mechanism',
    context: 'How a drug works at the molecular level',
  },
  {
    nbme_phrasing: 'underlying pathophysiology',
    clinical_concept: 'pathophysiology',
    context: 'Disease mechanism at the organ/system level',
  },
  {
    nbme_phrasing: 'screening is most appropriate',
    clinical_concept: 'screening',
    context: 'Preventive medicine and age-appropriate screening',
  },
  {
    nbme_phrasing: 'counseling regarding',
    clinical_concept: 'patient_education',
    context: 'Lifestyle modification or risk reduction advice',
  },
  {
    nbme_phrasing: 'best explains the findings',
    clinical_concept: 'pathophysiology',
    context: 'Connecting clinical presentation to underlying mechanism',
  },
  {
    nbme_phrasing: 'most appropriate setting for further management',
    clinical_concept: 'disposition',
    context: 'ICU vs floor vs outpatient decision',
  },
  {
    nbme_phrasing: 'contraindicated in this patient',
    clinical_concept: 'contraindication',
    context: 'Identifying absolute or relative contraindications',
  },
  {
    nbme_phrasing: 'should have been done before',
    clinical_concept: 'sequencing_error',
    context: 'Testing awareness of proper diagnostic/treatment order',
  },
  {
    nbme_phrasing: 'most appropriate follow-up',
    clinical_concept: 'surveillance',
    context: 'Post-treatment monitoring or interval follow-up',
  },
  {
    nbme_phrasing: 'expected laboratory finding',
    clinical_concept: 'lab_pattern',
    context: 'Predicting lab results from clinical scenario',
  },
  {
    nbme_phrasing: 'would have prevented this outcome',
    clinical_concept: 'prevention',
    context: 'Retrospective identification of missed prevention opportunity',
  },
  {
    nbme_phrasing: 'consent should include discussion of',
    clinical_concept: 'informed_consent',
    context: 'Medical ethics and shared decision-making',
  },
];
