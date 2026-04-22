// CCV (Contraindication Cross-Check Validator) registry.
//
// Each entry describes one high-yield intervention that could be keyed as a
// correct answer. For that intervention we enumerate the contraindications and,
// for each, a list of stem_triggers — high-confidence phrase examples that the
// blind-auditor prompt pattern-matches against.
//
// stem_triggers is NOT an exhaustive whitelist. The CCV prompt independently
// asks the model "does any detail in this stem constitute a contraindication
// even if not explicitly listed?" — so triggers seed pattern recognition, they
// don't box it in. That said: the richer the trigger list, the lower the false-
// negative rate, so include multiple phrasings (literal + paraphrased).
//
// Severity determines routing:
//   absolute -> auto-reject, structured fail reason back to case_planner
//   relative -> item_status='needs_human_review' (MS4 decides whether to drop
//               the stem detail or change the key)
//
// A bad entry is worse than no entry — a mis-classified severity creates false
// confidence. Favor 5 rigorously-authored entries over 10 mediocre ones.
//
// Provenance: every entry carries source_citation + verification_status. All
// current entries are draft_unverified pending expert review and source
// attribution. The CCV still consults them (false positives route to human
// review anyway), but any downstream gate that treats an entry as ground truth
// should check production_eligible first.

export interface ContraindicationEntry {
  id: string;
  text: string;
  stem_triggers: string[];
}

// Extend this union when new states (e.g. 'source_cited', 'expert_verified')
// are introduced. Single-member on purpose — forces every entry to declare a
// state, and prevents silent typos from compiling.
export type VerificationStatus = 'draft_unverified';

export interface ContraindicationSeed {
  intervention_id: string;
  display_name: string;
  aliases: string[];
  absolute_contraindications: ContraindicationEntry[];
  relative_contraindications: ContraindicationEntry[];
  source_citation: string;
  verification_status: VerificationStatus;
  review_required: boolean;
  production_eligible: boolean;
}

export const contraindicationSeeds: ContraindicationSeed[] = [
  // ─── 1. SYSTEMIC THROMBOLYSIS — fully authored (Q2 bug class) ───
  {
    intervention_id: 'thrombolysis_systemic',
    display_name: 'Systemic thrombolysis (alteplase / tPA / tenecteplase)',
    aliases: [
      'alteplase',
      'tpa',
      't-pa',
      'tenecteplase',
      'reteplase',
      'systemic thrombolytic',
      'systemic thrombolysis',
      'iv thrombolysis',
      'intravenous thrombolytic',
    ],
    absolute_contraindications: [
      {
        id: 'ich_ever',
        text: 'Prior intracranial hemorrhage (any time)',
        stem_triggers: [
          'history of intracranial hemorrhage',
          'prior hemorrhagic stroke',
          'previous brain bleed',
          'remote ICH',
          'subarachnoid hemorrhage in the past',
        ],
      },
      {
        id: 'recent_ischemic_stroke',
        text: 'Ischemic stroke within 3 months',
        stem_triggers: [
          'ischemic stroke 2 months ago',
          'recent CVA',
          'stroke 6 weeks ago',
          'cerebral infarct last month',
        ],
      },
      {
        id: 'active_internal_bleed',
        text: 'Active internal bleeding (excluding menses)',
        stem_triggers: [
          'active GI bleed',
          'hematemesis on arrival',
          'melena for 2 days',
          'bright red blood per rectum',
        ],
      },
      {
        id: 'recent_head_trauma',
        text: 'Significant closed head or facial trauma within 3 months',
        stem_triggers: [
          'head trauma 2 weeks ago',
          'recent fall with LOC',
          'facial trauma last month',
          'TBI in the past 3 months',
        ],
      },
      {
        id: 'intracranial_neoplasm',
        text: 'Known intracranial neoplasm, AVM, or aneurysm',
        stem_triggers: [
          'known brain tumor',
          'cerebral AVM',
          'unruptured aneurysm',
          'intracranial metastasis',
        ],
      },
      {
        id: 'aortic_dissection_suspected',
        text: 'Suspected aortic dissection',
        stem_triggers: [
          'tearing chest pain radiating to back',
          'widened mediastinum',
          'aortic dissection on CT',
          'unequal upper extremity pulses',
        ],
      },
    ],
    relative_contraindications: [
      {
        id: 'recent_major_surgery',
        text: 'Major surgery within 14 days',
        stem_triggers: [
          'recent surgery',
          'post-operative day 5',
          'post-op day 7',
          'underwent orthopedic surgery 5 days ago',
          'total hip arthroplasty last week',
          'CABG 10 days ago',
          'laparotomy 2 weeks ago',
        ],
      },
      {
        id: 'recent_gi_bleed',
        text: 'GI or GU bleed within 3 weeks',
        stem_triggers: [
          'GI bleed 2 weeks ago',
          'recent upper GI hemorrhage',
          'gross hematuria last week',
        ],
      },
      {
        id: 'inr_elevated',
        text: 'INR > 1.7 or current anticoagulation',
        stem_triggers: [
          'INR 2.1',
          'INR 1.9',
          'on warfarin with INR 2.5',
          'therapeutically anticoagulated',
        ],
      },
      {
        id: 'severe_htn_uncontrolled',
        text: 'Severe uncontrolled HTN (SBP > 180 or DBP > 110 despite treatment)',
        stem_triggers: [
          'blood pressure 195/115 despite labetalol',
          'uncontrolled hypertension with SBP over 180',
          'refractory hypertension on two agents',
        ],
      },
      {
        id: 'pregnancy',
        text: 'Pregnancy',
        stem_triggers: [
          'pregnant at 24 weeks',
          'gravid',
          'currently pregnant',
          'positive beta-hCG',
        ],
      },
      {
        id: 'traumatic_cpr',
        text: 'Traumatic or prolonged CPR (> 10 min) within 3 weeks',
        stem_triggers: [
          'CPR for 20 minutes',
          'prolonged resuscitation',
          'ROSC after 15 minutes of compressions',
        ],
      },
    ],
    source_citation: 'TBD',
    verification_status: 'draft_unverified',
    review_required: true,
    production_eligible: false,
  },

  // ─── 2. THERAPEUTIC ANTICOAGULATION (DOAC / LMWH / unfractionated heparin / warfarin) ───
  {
    intervention_id: 'therapeutic_anticoagulation',
    display_name: 'Therapeutic anticoagulation (heparin, LMWH, DOACs, warfarin)',
    aliases: [
      'heparin drip', 'unfractionated heparin', 'heparin infusion',
      'enoxaparin', 'lovenox', 'lmwh', 'dalteparin',
      'apixaban', 'eliquis', 'rivaroxaban', 'xarelto', 'dabigatran', 'pradaxa', 'edoxaban',
      'warfarin', 'coumadin',
      'therapeutic anticoagulation', 'full-dose anticoagulation', 'full anticoagulation',
    ],
    absolute_contraindications: [
      {
        id: 'active_major_bleeding',
        text: 'Active major bleeding',
        stem_triggers: [
          'active GI bleed', 'hematemesis', 'melena with hemoglobin drop',
          'active intracranial hemorrhage', 'acute hemorrhagic stroke',
          'ongoing bright red blood per rectum', 'retroperitoneal hematoma on CT',
        ],
      },
      {
        id: 'severe_thrombocytopenia',
        text: 'Severe thrombocytopenia (platelets <50,000 for therapeutic)',
        stem_triggers: [
          'platelets of 18,000', 'platelet count 22',
          'platelets 35 000', 'thrombocytopenia with plts 28',
        ],
      },
      {
        id: 'known_hit',
        text: 'Known or suspected HIT (heparin-induced thrombocytopenia) — for heparin and LMWH specifically',
        stem_triggers: [
          'platelets dropped from 220 to 85 on day 6 of heparin',
          'positive PF4 antibody', '4Ts score of 6',
          'HIT diagnosed previously',
        ],
      },
      {
        id: 'recent_neurosurgery',
        text: 'Recent neurosurgery or spine surgery (<14 days)',
        stem_triggers: [
          'craniotomy 5 days ago', 'post-op day 3 after laminectomy',
          'recent spinal fusion', 's/p tumor resection last week',
        ],
      },
    ],
    relative_contraindications: [
      {
        id: 'recent_gi_bleed_anticoag',
        text: 'GI bleed within 3 weeks',
        stem_triggers: [
          'upper GI bleed 2 weeks ago', 'recent peptic ulcer hemorrhage',
          'colonoscopy last week with polypectomy bleeding',
        ],
      },
      {
        id: 'high_fall_risk_elderly',
        text: 'High fall risk in an elderly patient',
        stem_triggers: [
          '88-year-old with recurrent falls', 'fell three times this month',
          'lives alone, fell and was found on the floor',
        ],
      },
      {
        id: 'pregnancy_anticoag',
        text: 'Pregnancy — warfarin and DOACs specifically (use LMWH)',
        stem_triggers: [
          '24 weeks pregnant', 'pregnant at 12 weeks',
          'gravid with new DVT', 'positive beta-hCG',
        ],
      },
      {
        id: 'severe_renal_doac',
        text: 'Severe renal impairment (CrCl <15-30) — DOAC-dependent',
        stem_triggers: [
          'ESRD on hemodialysis', 'CrCl of 18', 'eGFR 12',
          'dialysis three times weekly',
        ],
      },
      {
        id: 'planned_invasive_procedure',
        text: 'Planned invasive procedure within 48 hours',
        stem_triggers: [
          'scheduled for lumbar puncture tomorrow',
          'surgery planned for tomorrow morning',
          'biopsy in 24 hours',
        ],
      },
    ],
    source_citation: 'TBD',
    verification_status: 'draft_unverified',
    review_required: true,
    production_eligible: false,
  },

  // ─── 3. BETA-BLOCKERS ───
  {
    intervention_id: 'beta_blocker',
    display_name: 'Beta-blockers (metoprolol, carvedilol, propranolol, atenolol, labetalol)',
    aliases: [
      'metoprolol', 'lopressor', 'toprol',
      'carvedilol', 'coreg',
      'propranolol', 'inderal',
      'atenolol', 'tenormin',
      'labetalol',
      'esmolol',
      'bisoprolol',
      'beta blocker', 'beta-blocker', 'beta blockade',
    ],
    absolute_contraindications: [
      {
        id: 'decompensated_hf_acute',
        text: 'Acute decompensated heart failure (acute pulmonary edema, cardiogenic shock)',
        stem_triggers: [
          'acute pulmonary edema on CXR', 'cardiogenic shock',
          'crackles to the apices with hypotension',
          'SBP 80 with cool extremities', 'CI of 1.6',
        ],
      },
      {
        id: 'severe_bradycardia',
        text: 'Severe bradycardia (HR <50) without pacemaker',
        stem_triggers: [
          'heart rate 42', 'HR of 38', 'sinus bradycardia 44 bpm',
          'junctional rhythm at 40',
        ],
      },
      {
        id: 'high_degree_av_block',
        text: 'Second-degree Mobitz II or third-degree AV block without pacemaker',
        stem_triggers: [
          'third-degree heart block',
          'complete heart block on EKG',
          'Mobitz type II AV block',
          'PR 0.32 with dropped beats',
        ],
      },
      {
        id: 'cocaine_induced_chest_pain',
        text: 'Cocaine-induced chest pain (unopposed alpha-mediated coronary vasospasm)',
        stem_triggers: [
          'used cocaine 2 hours ago',
          'positive urine tox for cocaine with chest pain',
          'crack cocaine use this morning',
          'sympathomimetic toxidrome after cocaine',
        ],
      },
    ],
    relative_contraindications: [
      {
        id: 'severe_reactive_airway',
        text: 'Severe reactive airway disease (asthma — relative for cardioselective)',
        stem_triggers: [
          'status asthmaticus', 'severe asthma exacerbation with wheezing',
          'FEV1 of 35% predicted',
        ],
      },
      {
        id: 'severe_pad',
        text: 'Severe peripheral artery disease with rest pain',
        stem_triggers: [
          'rest pain in the foot', 'critical limb ischemia',
          'ABI of 0.3',
        ],
      },
      {
        id: 'pheochromocytoma_no_alpha',
        text: 'Pheochromocytoma without prior alpha-blockade',
        stem_triggers: [
          'elevated plasma metanephrines',
          'adrenal mass with paroxysmal HTN',
          'pheochromocytoma diagnosed this week',
        ],
      },
    ],
    source_citation: 'TBD',
    verification_status: 'draft_unverified',
    review_required: true,
    production_eligible: false,
  },

  // ─── 4. NON-DIHYDROPYRIDINE CALCIUM CHANNEL BLOCKERS (diltiazem, verapamil) ───
  {
    intervention_id: 'non_dhp_ccb',
    display_name: 'Non-dihydropyridine calcium channel blockers (diltiazem, verapamil)',
    aliases: [
      'diltiazem', 'cardizem',
      'verapamil', 'calan',
      'non-dhp ccb', 'non-dihydropyridine calcium channel blocker',
    ],
    absolute_contraindications: [
      {
        id: 'hfref_non_dhp',
        text: 'HFrEF (LVEF <40%) — negative inotropy worsens heart failure',
        stem_triggers: [
          'EF of 28%', 'LVEF 32%', 'HFrEF on echo',
          'reduced ejection fraction of 30 percent',
        ],
      },
      {
        id: 'wpw_afib',
        text: 'Pre-excited atrial fibrillation (WPW with afib) — can accelerate accessory-pathway conduction to VF',
        stem_triggers: [
          'WPW with atrial fibrillation',
          'delta wave with irregular wide-complex tachycardia',
          'pre-excited afib',
        ],
      },
      {
        id: 'severe_bradycardia_ccb',
        text: 'Severe bradycardia or high-degree AV block without pacemaker',
        stem_triggers: [
          'heart rate 44 with 2nd degree block',
          'third-degree heart block',
        ],
      },
    ],
    relative_contraindications: [],
    source_citation: 'TBD',
    verification_status: 'draft_unverified',
    review_required: true,
    production_eligible: false,
  },

  // ─── 5. ACE INHIBITORS / ARBs ───
  {
    intervention_id: 'ace_arb',
    display_name: 'ACE inhibitors / angiotensin receptor blockers',
    aliases: [
      'lisinopril', 'enalapril', 'captopril', 'ramipril', 'benazepril',
      'losartan', 'valsartan', 'irbesartan', 'olmesartan', 'candesartan',
      'ace inhibitor', 'ace-i', 'acei', 'arb', 'angiotensin receptor blocker',
    ],
    absolute_contraindications: [
      {
        id: 'pregnancy_ace',
        text: 'Pregnancy — teratogenic across all trimesters',
        stem_triggers: [
          '24 weeks pregnant', 'pregnant at 8 weeks',
          'gravid with new-onset hypertension', 'positive beta-hCG',
        ],
      },
      {
        id: 'bilateral_ras',
        text: 'Bilateral renal artery stenosis (or RAS in solitary kidney)',
        stem_triggers: [
          'bilateral renal artery stenosis on imaging',
          'RAS on both sides', 'solitary kidney with RAS',
        ],
      },
      {
        id: 'prior_acei_angioedema',
        text: 'Prior ACEi-induced angioedema',
        stem_triggers: [
          'lip swelling after lisinopril',
          'angioedema on enalapril previously',
          'tongue swelling after starting ACE',
        ],
      },
      {
        id: 'hyperkalemia_ace',
        text: 'Hyperkalemia (K+ >5.5)',
        stem_triggers: [
          'K+ of 5.8', 'potassium 6.1',
          'serum potassium 5.6 mEq/L',
        ],
      },
    ],
    relative_contraindications: [
      {
        id: 'aki_ace',
        text: 'Acute kidney injury or volume depletion',
        stem_triggers: [
          'creatinine rose from 1.0 to 2.4',
          'AKI with oliguria',
          'severe dehydration with pre-renal AKI',
        ],
      },
    ],
    source_citation: 'TBD',
    verification_status: 'draft_unverified',
    review_required: true,
    production_eligible: false,
  },

  // ─── 6. METFORMIN ───
  {
    intervention_id: 'metformin',
    display_name: 'Metformin',
    aliases: ['metformin', 'glucophage'],
    absolute_contraindications: [
      {
        id: 'egfr_below_30',
        text: 'eGFR <30 mL/min/1.73m² — lactic acidosis risk',
        stem_triggers: [
          'eGFR of 22', 'creatinine clearance 25',
          'GFR 18', 'ESRD on dialysis',
        ],
      },
      {
        id: 'lactic_acidosis_active',
        text: 'Acute or unstable heart failure, sepsis, or any condition with tissue hypoperfusion',
        stem_triggers: [
          'septic shock with lactate of 6',
          'cardiogenic shock',
          'lactate 5.8 mmol/L',
        ],
      },
    ],
    relative_contraindications: [
      {
        id: 'upcoming_contrast',
        text: 'Iodinated contrast administration within 48h — hold metformin',
        stem_triggers: [
          'scheduled for CT with contrast tomorrow',
          'needs angiography today',
        ],
      },
      {
        id: 'egfr_30_45',
        text: 'eGFR 30-45 — reduce dose, do not initiate',
        stem_triggers: [
          'eGFR of 38', 'creatinine clearance 42',
        ],
      },
    ],
    source_citation: 'TBD',
    verification_status: 'draft_unverified',
    review_required: true,
    production_eligible: false,
  },

  // ─── 7. NSAIDs ───
  {
    intervention_id: 'nsaids',
    display_name: 'NSAIDs (ibuprofen, naproxen, ketorolac, indomethacin)',
    aliases: [
      'ibuprofen', 'motrin', 'advil',
      'naproxen', 'aleve',
      'ketorolac', 'toradol',
      'indomethacin', 'indocin',
      'diclofenac', 'celecoxib', 'celebrex',
      'nsaid', 'nsaids', 'non-steroidal',
    ],
    absolute_contraindications: [
      {
        id: 'active_peptic_ulcer',
        text: 'Active peptic ulcer or acute GI bleed',
        stem_triggers: [
          'active GI bleed', 'gastric ulcer on EGD',
          'melena with active bleeding',
        ],
      },
      {
        id: 'severe_aki',
        text: 'Acute kidney injury or severe CKD (eGFR <30)',
        stem_triggers: [
          'AKI with creatinine of 3.2',
          'eGFR of 22',
          'rising creatinine over the past 48 hours',
        ],
      },
      {
        id: 'third_trimester_pregnancy',
        text: 'Third trimester pregnancy — premature ductus closure',
        stem_triggers: [
          '32 weeks pregnant',
          'third trimester',
          '36 weeks gestation',
        ],
      },
    ],
    relative_contraindications: [
      {
        id: 'heart_failure_nsaid',
        text: 'Decompensated heart failure — fluid retention, worsening renal function',
        stem_triggers: [
          'HFrEF with recent decompensation',
          'pulmonary edema on admission',
        ],
      },
      {
        id: 'on_anticoag_nsaid',
        text: 'Concurrent anticoagulation',
        stem_triggers: [
          'on warfarin with INR 2.5',
          'taking apixaban for atrial fibrillation',
        ],
      },
    ],
    source_citation: 'TBD',
    verification_status: 'draft_unverified',
    review_required: true,
    production_eligible: false,
  },

  // ─── 8. SGLT2 INHIBITORS ───
  {
    intervention_id: 'sglt2_inhibitor',
    display_name: 'SGLT2 inhibitors (empagliflozin, dapagliflozin, canagliflozin)',
    aliases: [
      'empagliflozin', 'jardiance',
      'dapagliflozin', 'farxiga',
      'canagliflozin', 'invokana',
      'sglt2', 'sglt-2 inhibitor', 'gliflozin',
    ],
    absolute_contraindications: [
      {
        id: 't1dm_sglt2',
        text: 'Type 1 diabetes — euglycemic DKA risk',
        stem_triggers: [
          'type 1 diabetes since childhood',
          'T1DM on insulin pump',
          'GAD-65 antibody positive',
        ],
      },
      {
        id: 'dka_active',
        text: 'Active diabetic ketoacidosis or history of recurrent DKA',
        stem_triggers: [
          'anion gap metabolic acidosis with positive ketones',
          'pH 7.15 with ketonemia',
          'recurrent DKA admissions',
        ],
      },
    ],
    relative_contraindications: [
      {
        id: 'recurrent_gu_infection',
        text: 'Recurrent UTI or genital mycotic infection',
        stem_triggers: [
          'three UTIs in the past six months',
          'recurrent vaginal yeast infections',
        ],
      },
    ],
    source_citation: 'TBD',
    verification_status: 'draft_unverified',
    review_required: true,
    production_eligible: false,
  },

  // ─── 9. ASPIRIN (as antiplatelet) ───
  {
    intervention_id: 'aspirin',
    display_name: 'Aspirin (antiplatelet dosing)',
    aliases: ['aspirin', 'asa', 'acetylsalicylic acid', 'baby aspirin', '81 mg aspirin', '325 mg aspirin'],
    absolute_contraindications: [
      {
        id: 'active_bleeding_asa',
        text: 'Active major bleeding',
        stem_triggers: [
          'active GI bleed',
          'ICH on CT',
          'hemorrhagic stroke on imaging',
        ],
      },
      {
        id: 'aspirin_allergy',
        text: 'Aspirin hypersensitivity (Samter triad: asthma + nasal polyps + ASA sensitivity)',
        stem_triggers: [
          'asthma exacerbation after taking aspirin',
          'nasal polyps and aspirin-induced bronchospasm',
          'Samter triad',
        ],
      },
    ],
    relative_contraindications: [
      {
        id: 'children_viral',
        text: 'Children with viral illness — Reye syndrome risk',
        stem_triggers: [
          '8-year-old with influenza',
          '6-year-old with varicella',
          'child with viral prodrome',
        ],
      },
    ],
    source_citation: 'TBD',
    verification_status: 'draft_unverified',
    review_required: true,
    production_eligible: false,
  },

  // ─── 10. NITRATES (nitroglycerin, isosorbide) ───
  {
    intervention_id: 'nitrates',
    display_name: 'Nitrates (nitroglycerin IV/SL, isosorbide)',
    aliases: [
      'nitroglycerin', 'ntg', 'nitro', 'sublingual nitroglycerin', 'iv nitroglycerin',
      'isosorbide', 'imdur', 'ismo', 'isosorbide mononitrate', 'isosorbide dinitrate',
    ],
    absolute_contraindications: [
      {
        id: 'pde5_recent',
        text: 'PDE-5 inhibitor use within 24-48 hours (sildenafil/tadalafil) — severe hypotension',
        stem_triggers: [
          'took sildenafil this morning',
          'on Viagra 12 hours ago',
          'tadalafil last night',
        ],
      },
      {
        id: 'rv_infarct',
        text: 'Right ventricular infarction (inferior MI with RV involvement) — preload-dependent',
        stem_triggers: [
          'inferior MI with ST elevation in V4R',
          'RV infarct on echo',
          'inferior STEMI with hypotension',
        ],
      },
      {
        id: 'severe_aortic_stenosis',
        text: 'Severe aortic stenosis',
        stem_triggers: [
          'severe aortic stenosis with valve area 0.7',
          'mean gradient of 50 mm Hg across AV',
        ],
      },
      {
        id: 'hypotension_nitrate',
        text: 'Hypotension (SBP <90)',
        stem_triggers: [
          'SBP of 82', 'blood pressure 84/52',
          'hypotensive with MAP 58',
        ],
      },
    ],
    relative_contraindications: [],
    source_citation: 'TBD',
    verification_status: 'draft_unverified',
    review_required: true,
    production_eligible: false,
  },

  // ─── 11. INSULIN (in DKA context with K+ <3.3) ───
  {
    intervention_id: 'insulin_dka_low_k',
    display_name: 'Insulin in DKA — contraindicated if K+ <3.3',
    aliases: [
      'insulin drip', 'regular insulin', 'insulin infusion',
      'iv insulin', 'insulin bolus',
    ],
    absolute_contraindications: [
      {
        id: 'k_below_3_3_in_dka',
        text: 'Serum potassium <3.3 mEq/L in the setting of DKA — insulin drives K+ intracellularly, can precipitate lethal hypokalemia',
        stem_triggers: [
          'K+ of 2.9',
          'potassium 3.1 mEq/L',
          'serum potassium of 2.8',
          'hypokalemia with K+ 3.2 in DKA',
        ],
      },
    ],
    relative_contraindications: [],
    source_citation: 'TBD',
    verification_status: 'draft_unverified',
    review_required: true,
    production_eligible: false,
  },

  // ─── 12. SYSTEMIC CORTICOSTEROIDS (high dose) ───
  {
    intervention_id: 'systemic_corticosteroids',
    display_name: 'Systemic corticosteroids (prednisone, methylprednisolone, dexamethasone)',
    aliases: [
      'prednisone', 'methylprednisolone', 'solu-medrol', 'medrol',
      'dexamethasone', 'decadron',
      'hydrocortisone', 'systemic steroids', 'high-dose steroids',
      'iv steroids', 'pulse steroids',
    ],
    absolute_contraindications: [
      {
        id: 'untreated_systemic_infection',
        text: 'Active untreated systemic fungal, mycobacterial, or severe bacterial infection',
        stem_triggers: [
          'disseminated histoplasmosis',
          'active pulmonary TB not yet on therapy',
          'untreated cryptococcal meningitis',
        ],
      },
      {
        id: 'live_vaccine_recent',
        text: 'Recent live vaccine administration',
        stem_triggers: [
          'MMR vaccine last week',
          'yellow fever vaccine 5 days ago',
        ],
      },
    ],
    relative_contraindications: [
      {
        id: 'psoriasis_steroid',
        text: 'Psoriasis — rebound flare and erythroderma on taper',
        stem_triggers: [
          'widespread plaque psoriasis',
          'known psoriasis presenting with unrelated issue',
        ],
      },
      {
        id: 'uncontrolled_diabetes_steroid',
        text: 'Uncontrolled diabetes — worsening hyperglycemia',
        stem_triggers: [
          'A1c of 11%',
          'glucose of 380 on admission',
        ],
      },
    ],
    source_citation: 'TBD',
    verification_status: 'draft_unverified',
    review_required: true,
    production_eligible: false,
  },

  // ─── 13. BENZODIAZEPINES ───
  {
    intervention_id: 'benzodiazepines',
    display_name: 'Benzodiazepines (lorazepam, diazepam, midazolam, alprazolam)',
    aliases: [
      'lorazepam', 'ativan',
      'diazepam', 'valium',
      'midazolam', 'versed',
      'alprazolam', 'xanax',
      'clonazepam', 'klonopin',
      'benzodiazepine', 'benzo',
    ],
    absolute_contraindications: [
      {
        id: 'severe_respiratory_depression',
        text: 'Severe respiratory depression without airway support',
        stem_triggers: [
          'respiratory rate of 6',
          'CO2 of 68 with somnolence',
          'obtunded with shallow breathing',
        ],
      },
      {
        id: 'acute_narrow_angle_glaucoma',
        text: 'Acute narrow-angle glaucoma',
        stem_triggers: [
          'acute angle-closure glaucoma',
          'painful red eye with halos around lights',
        ],
      },
    ],
    relative_contraindications: [
      {
        id: 'elderly_falls_benzo',
        text: 'Elderly with fall risk or cognitive impairment (Beers criteria)',
        stem_triggers: [
          '84-year-old with recent falls',
          'mild cognitive impairment',
        ],
      },
      {
        id: 'opioid_coadministration',
        text: 'Concurrent opioid use — synergistic respiratory depression',
        stem_triggers: [
          'on chronic oxycodone',
          'taking methadone for MAT',
        ],
      },
    ],
    source_citation: 'TBD',
    verification_status: 'draft_unverified',
    review_required: true,
    production_eligible: false,
  },

  // ─── 14. OPIOIDS (morphine, fentanyl, oxycodone) ───
  {
    intervention_id: 'opioids',
    display_name: 'Opioids (morphine, fentanyl, hydromorphone, oxycodone)',
    aliases: [
      'morphine', 'fentanyl', 'hydromorphone', 'dilaudid',
      'oxycodone', 'percocet', 'oxycontin',
      'hydrocodone', 'vicodin',
      'codeine', 'tramadol',
      'opioid', 'narcotic',
    ],
    absolute_contraindications: [
      {
        id: 'respiratory_depression_opioid',
        text: 'Severe respiratory depression or COPD with hypercarbia',
        stem_triggers: [
          'respiratory rate of 8',
          'PaCO2 of 72',
          'obtunded with shallow respirations',
        ],
      },
      {
        id: 'head_injury_elevated_icp',
        text: 'Head injury with elevated ICP — obscures exam, worsens hypercarbia',
        stem_triggers: [
          'head trauma with papilledema',
          'elevated ICP on monitoring',
          'traumatic brain injury with unequal pupils',
        ],
      },
    ],
    relative_contraindications: [
      {
        id: 'biliary_opioid_morphine',
        text: 'Biliary colic/cholecystitis — morphine causes sphincter of Oddi spasm (use hydromorphone)',
        stem_triggers: [
          'acute cholecystitis',
          'biliary colic with RUQ pain',
        ],
      },
    ],
    source_citation: 'TBD',
    verification_status: 'draft_unverified',
    review_required: true,
    production_eligible: false,
  },

  // ─── 15. DIGOXIN ───
  {
    intervention_id: 'digoxin',
    display_name: 'Digoxin',
    aliases: ['digoxin', 'lanoxin', 'digitalis'],
    absolute_contraindications: [
      {
        id: 'dig_toxicity',
        text: 'Digoxin toxicity (high serum level, hyperkalemia, classic EKG changes)',
        stem_triggers: [
          'digoxin level of 3.2',
          'scooped ST depressions',
          'hyperkalemia in digoxin-toxic patient',
        ],
      },
      {
        id: 'wpw_dig',
        text: 'WPW with afib — accelerates accessory-pathway conduction',
        stem_triggers: [
          'WPW with atrial fibrillation',
          'pre-excited afib on EKG',
        ],
      },
      {
        id: 'high_degree_block_dig',
        text: 'Second/third-degree AV block without pacemaker',
        stem_triggers: [
          'complete heart block',
          'Mobitz II on telemetry',
        ],
      },
    ],
    relative_contraindications: [
      {
        id: 'renal_failure_dig',
        text: 'Renal failure — accumulates without dose adjustment',
        stem_triggers: [
          'CKD stage 4',
          'eGFR of 24',
        ],
      },
    ],
    source_citation: 'TBD',
    verification_status: 'draft_unverified',
    review_required: true,
    production_eligible: false,
  },

  // ─── 16. STATINS ───
  {
    intervention_id: 'statins',
    display_name: 'HMG-CoA reductase inhibitors (atorvastatin, rosuvastatin, simvastatin)',
    aliases: [
      'atorvastatin', 'lipitor',
      'rosuvastatin', 'crestor',
      'simvastatin', 'zocor',
      'pravastatin', 'pitavastatin', 'lovastatin',
      'statin',
    ],
    absolute_contraindications: [
      {
        id: 'active_liver_disease',
        text: 'Active liver disease (ALT/AST >3× ULN, decompensated cirrhosis)',
        stem_triggers: [
          'AST 180 ALT 210',
          'decompensated cirrhosis with ascites',
          'acute hepatitis with transaminases over 1000',
        ],
      },
      {
        id: 'pregnancy_statin',
        text: 'Pregnancy',
        stem_triggers: [
          '22 weeks pregnant',
          'pregnant and on statin',
        ],
      },
    ],
    relative_contraindications: [
      {
        id: 'rhabdo_risk',
        text: 'Rhabdomyolysis history or concurrent gemfibrozil',
        stem_triggers: [
          'prior statin-induced rhabdomyolysis',
          'CK of 18,000 on simvastatin',
        ],
      },
    ],
    source_citation: 'TBD',
    verification_status: 'draft_unverified',
    review_required: true,
    production_eligible: false,
  },

  // ─── 17. CLOZAPINE ───
  {
    intervention_id: 'clozapine',
    display_name: 'Clozapine',
    aliases: ['clozapine', 'clozaril'],
    absolute_contraindications: [
      {
        id: 'clozapine_anc',
        text: 'ANC <1500/µL or history of clozapine-induced agranulocytosis',
        stem_triggers: [
          'ANC of 1200',
          'absolute neutrophil count 900',
          'agranulocytosis on clozapine previously',
        ],
      },
      {
        id: 'uncontrolled_seizures',
        text: 'Uncontrolled seizure disorder',
        stem_triggers: [
          'two breakthrough seizures this month',
          'refractory epilepsy',
        ],
      },
      {
        id: 'myocarditis_clozapine',
        text: 'Clozapine-induced myocarditis (suspected or prior)',
        stem_triggers: [
          'new chest pain and troponin rise 3 weeks after starting clozapine',
          'eosinophilia with new cardiomyopathy on clozapine',
        ],
      },
    ],
    relative_contraindications: [],
    source_citation: 'TBD',
    verification_status: 'draft_unverified',
    review_required: true,
    production_eligible: false,
  },

  // ─── 18. FLUOROQUINOLONES ───
  {
    intervention_id: 'fluoroquinolones',
    display_name: 'Fluoroquinolones (ciprofloxacin, levofloxacin, moxifloxacin)',
    aliases: [
      'ciprofloxacin', 'cipro',
      'levofloxacin', 'levaquin',
      'moxifloxacin', 'avelox',
      'fluoroquinolone',
    ],
    absolute_contraindications: [
      {
        id: 'long_qt',
        text: 'Long QT syndrome or concurrent QT-prolonging drug with QTc >500',
        stem_triggers: [
          'QTc of 520',
          'congenital long QT syndrome',
          'on ondansetron with QTc prolongation',
        ],
      },
      {
        id: 'fq_tendon_rupture',
        text: 'Prior fluoroquinolone-induced tendon rupture',
        stem_triggers: [
          'prior Achilles tendon rupture on ciprofloxacin',
          'tendon rupture after levofloxacin',
        ],
      },
    ],
    relative_contraindications: [
      {
        id: 'pediatric_fq',
        text: 'Pediatric patients (cartilage toxicity — relative)',
        stem_triggers: [
          '9-year-old with UTI',
          '12-year-old pediatric patient',
        ],
      },
      {
        id: 'myasthenia_gravis_fq',
        text: 'Myasthenia gravis — worsens weakness',
        stem_triggers: [
          'known myasthenia gravis',
          'positive AChR antibodies with ptosis',
        ],
      },
    ],
    source_citation: 'TBD',
    verification_status: 'draft_unverified',
    review_required: true,
    production_eligible: false,
  },

  // ─── 19. COLONOSCOPY (procedure) ───
  {
    intervention_id: 'colonoscopy',
    display_name: 'Colonoscopy',
    aliases: ['colonoscopy', 'lower endoscopy', 'flexible sigmoidoscopy for ...'],
    absolute_contraindications: [
      {
        id: 'acute_diverticulitis_colo',
        text: 'Acute diverticulitis — perforation risk',
        stem_triggers: [
          'acute diverticulitis on CT',
          'Hinchey stage 1 diverticulitis',
          'CT showing pericolonic inflammation and fat stranding',
        ],
      },
      {
        id: 'suspected_perforation',
        text: 'Suspected bowel perforation',
        stem_triggers: [
          'free air on upright CXR',
          'pneumoperitoneum on CT',
          'peritoneal signs on exam',
        ],
      },
      {
        id: 'fulminant_colitis',
        text: 'Fulminant colitis or toxic megacolon',
        stem_triggers: [
          'toxic megacolon on KUB',
          'transverse colon diameter >6 cm with systemic toxicity',
        ],
      },
    ],
    relative_contraindications: [
      {
        id: 'recent_mi_colo',
        text: 'Recent MI (within 6 weeks) — relative',
        stem_triggers: [
          'NSTEMI 3 weeks ago',
          'acute coronary syndrome last month',
        ],
      },
    ],
    source_citation: 'TBD',
    verification_status: 'draft_unverified',
    review_required: true,
    production_eligible: false,
  },

  // ─── 20. IV IODINATED CONTRAST ───
  {
    intervention_id: 'iv_iodinated_contrast',
    display_name: 'IV iodinated contrast',
    aliases: [
      'iv contrast', 'iodinated contrast', 'ct with contrast', 'ct angiogram',
      'cta', 'ct angiography', 'coronary angiography', 'cardiac catheterization',
    ],
    absolute_contraindications: [
      {
        id: 'prior_severe_reaction',
        text: 'Prior severe anaphylactoid reaction to iodinated contrast',
        stem_triggers: [
          'anaphylaxis after prior CT with contrast',
          'airway compromise after contrast last year',
          'intubated after previous contrast exposure',
        ],
      },
    ],
    relative_contraindications: [
      {
        id: 'aki_contrast',
        text: 'AKI or eGFR <30',
        stem_triggers: [
          'creatinine of 3.2',
          'eGFR of 22',
          'AKI with rising creatinine',
        ],
      },
      {
        id: 'metformin_contrast',
        text: 'Metformin use — hold 48h post-contrast',
        stem_triggers: [
          'on metformin for T2DM',
          'daily metformin 1000 mg',
        ],
      },
      {
        id: 'uncontrolled_hyperthyroidism',
        text: 'Uncontrolled hyperthyroidism — Jod-Basedow phenomenon',
        stem_triggers: [
          'TSH undetectable with FT4 of 4.8',
          'thyroid storm',
        ],
      },
    ],
    source_citation: 'TBD',
    verification_status: 'draft_unverified',
    review_required: true,
    production_eligible: false,
  },
];
