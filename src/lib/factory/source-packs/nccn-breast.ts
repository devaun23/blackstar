import type { SourcePack } from './types';

export const PACK_NCCN_BREAST_2024: SourcePack = {
  source_pack_id: 'PACK.NCCN.BREAST.2024',
  source_name: 'NCCN 2024 Clinical Practice Guidelines — Breast Cancer',
  canonical_url: 'https://www.nccn.org/guidelines/guidelines-detail?category=1&id=1419',
  publication_year: 2024,
  guideline_body: 'NCCN',

  topic_tags: ['Breast Cancer', 'Breast Mass', 'BIRADS', 'DCIS', 'Sentinel Lymph Node', 'Mastectomy', 'Surgery', 'Oncology'],
  allowed_decision_scopes: [
    'breast mass workup (triple assessment)',
    'BIRADS classification and management',
    'DCIS vs invasive cancer management',
    'sentinel lymph node biopsy indications',
    'breast conservation vs mastectomy',
    'ER/PR/HER2 receptor testing and targeted therapy',
    'neoadjuvant chemotherapy indications',
  ],
  excluded_decision_scopes: [
    'male breast cancer specifics',
    'breast reconstruction surgical techniques',
    'metastatic breast cancer systemic therapy details',
    'hereditary breast cancer genetic counseling',
    'breast cancer screening guidelines (USPSTF)',
  ],

  recommendations: [
    {
      rec_id: 'PACK.NCCN.BREAST.2024.REC.01',
      display_id: 'NCCN-BR-R1',
      statement: 'All palpable breast masses require triple assessment: clinical breast exam, imaging (mammography and/or ultrasound), and tissue sampling (core needle biopsy or FNA). All three components must be concordant before concluding a lesion is benign.',
      normalized_claim: 'Breast mass workup = triple assessment (clinical exam + imaging + biopsy). All three must agree before calling a lesion benign.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Evaluation', page_or_location: 'BINV-1' },
    },
    {
      rec_id: 'PACK.NCCN.BREAST.2024.REC.02',
      display_id: 'NCCN-BR-R2',
      statement: 'BIRADS 4 (suspicious) and BIRADS 5 (highly suggestive of malignancy) lesions require tissue biopsy. BIRADS 3 lesions may be followed with short-interval imaging (6 months) if biopsy is deferred.',
      normalized_claim: 'BIRADS 4-5 → tissue biopsy required. BIRADS 3 → short-interval follow-up at 6 months or biopsy.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Imaging Assessment', page_or_location: 'BINV-1' },
    },
    {
      rec_id: 'PACK.NCCN.BREAST.2024.REC.03',
      display_id: 'NCCN-BR-R3',
      statement: 'Breast-conserving surgery (lumpectomy) with whole-breast radiation is equivalent to mastectomy for survival in early-stage invasive breast cancer (tumors ≤5cm with negative margins). Patient preference should guide the decision.',
      normalized_claim: 'Lumpectomy + radiation = mastectomy for survival in early-stage breast cancer (≤5cm, negative margins). Shared decision-making.',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Surgical Management', page_or_location: 'BINV-6' },
    },
    {
      rec_id: 'PACK.NCCN.BREAST.2024.REC.04',
      display_id: 'NCCN-BR-R4',
      statement: 'Sentinel lymph node biopsy (SLNB) is the standard for axillary staging in clinically node-negative invasive breast cancer. Full axillary lymph node dissection (ALND) is no longer required for 1-2 positive sentinel nodes if receiving breast-conserving surgery with radiation (ACOSOG Z0011).',
      normalized_claim: 'SLNB standard for axillary staging in clinically N0 invasive cancer. 1-2 positive SLNs with lumpectomy + radiation: ALND not required (Z0011).',
      strength: 'strong',
      evidence_quality: 'high',
      provenance: { section: 'Axillary Management', page_or_location: 'BINV-7' },
    },
  ],

  diagnostic_criteria: [
    {
      criterion_id: 'PACK.NCCN.BREAST.2024.DC.01',
      display_id: 'NCCN-BR-DC1',
      name: 'BIRADS (Breast Imaging Reporting and Data System) Classification',
      components: [
        'BIRADS 0: Incomplete — need additional imaging',
        'BIRADS 1: Negative — routine screening',
        'BIRADS 2: Benign — routine screening',
        'BIRADS 3: Probably benign (<2% malignancy risk) — short-interval follow-up',
        'BIRADS 4: Suspicious (2-95% malignancy risk) — biopsy recommended',
        'BIRADS 5: Highly suggestive of malignancy (>95%) — biopsy required',
        'BIRADS 6: Known biopsy-proven malignancy',
      ],
      interpretation: 'BIRADS standardizes imaging assessment and management. The key decision point is BIRADS 4 and 5 which mandate tissue biopsy.',
      normalized_claim: 'BIRADS 4-5 require biopsy. BIRADS 3 = probably benign (<2% risk), short-interval follow-up. BIRADS 0-2 = benign/incomplete.',
      provenance: { section: 'Imaging', page_or_location: 'BINV-1' },
    },
    {
      criterion_id: 'PACK.NCCN.BREAST.2024.DC.02',
      display_id: 'NCCN-BR-DC2',
      name: 'Receptor Status Classification (ER/PR/HER2)',
      components: [
        'ER-positive: ≥1% nuclear staining by IHC — eligible for endocrine therapy',
        'PR-positive: ≥1% nuclear staining by IHC — additional prognostic factor',
        'HER2-positive: IHC 3+ or FISH ratio ≥2.0 — eligible for anti-HER2 therapy',
        'Triple-negative: ER−, PR−, HER2− — chemotherapy-dependent, worst prognosis',
      ],
      interpretation: 'Receptor status determines systemic therapy. ER+ = endocrine therapy backbone. HER2+ = trastuzumab-based regimen. Triple-negative = chemotherapy only (immunotherapy emerging).',
      normalized_claim: 'ER+ (≥1%) → endocrine therapy. HER2+ (IHC 3+ or FISH ≥2.0) → trastuzumab. Triple-negative → chemotherapy.',
      provenance: { section: 'Pathology', page_or_location: 'BINV-A' },
    },
  ],

  thresholds: [
    {
      threshold_id: 'PACK.NCCN.BREAST.2024.T.01',
      display_id: 'NCCN-BR-T1',
      parameter: 'Tumor size for breast conservation eligibility',
      value: '5',
      unit: 'cm',
      clinical_meaning: 'Tumors ≤5cm are generally eligible for breast-conserving surgery (lumpectomy + radiation) if negative margins achieved and breast-to-tumor ratio is adequate. Larger tumors may be downstaged with neoadjuvant chemotherapy.',
      normalized_claim: 'Breast conservation eligible if tumor ≤5cm with negative margins. Larger tumors may be candidates after neoadjuvant chemotherapy.',
      direction: 'below',
      provenance: { section: 'Surgical Planning', page_or_location: 'BINV-6' },
    },
  ],

  treatment_steps: [
    {
      step_id: 'PACK.NCCN.BREAST.2024.TX.01',
      display_id: 'NCCN-BR-TX1',
      action: 'Lumpectomy with whole-breast radiation for early-stage invasive cancer',
      normalized_claim: 'Early-stage invasive breast cancer (≤5cm, clinically N0): lumpectomy with negative margins + whole-breast radiation. SLNB for axillary staging. Equivalent survival to mastectomy.',
      timing: 'After diagnostic workup; within 4-6 weeks of diagnosis',
      condition: 'Early-stage (T1-T2) invasive breast cancer amenable to breast conservation',
      provenance: { section: 'Surgical Treatment', page_or_location: 'BINV-6' },
    },
    {
      step_id: 'PACK.NCCN.BREAST.2024.TX.02',
      display_id: 'NCCN-BR-TX2',
      action: 'Endocrine therapy for ER-positive breast cancer',
      normalized_claim: 'ER+ breast cancer: tamoxifen for premenopausal women (5-10 years), aromatase inhibitor (letrozole, anastrozole, exemestane) for postmenopausal women (5-10 years).',
      timing: 'Initiated after completion of surgery and chemotherapy (if given)',
      condition: 'ER-positive invasive breast cancer',
      drug_details: { drug: 'Tamoxifen (premenopausal) or Aromatase inhibitor (postmenopausal)', dose: 'Tamoxifen 20mg daily / Letrozole 2.5mg daily', route: 'PO', duration: '5-10 years' },
      provenance: { section: 'Adjuvant Endocrine Therapy', page_or_location: 'BINV-14' },
    },
    {
      step_id: 'PACK.NCCN.BREAST.2024.TX.03',
      display_id: 'NCCN-BR-TX3',
      action: 'Trastuzumab-based therapy for HER2-positive breast cancer',
      normalized_claim: 'HER2+ breast cancer: trastuzumab + pertuzumab + chemotherapy. Neoadjuvant for locally advanced; adjuvant for early-stage. Total trastuzumab duration 1 year.',
      timing: 'Neoadjuvant (before surgery) for locally advanced; adjuvant (after surgery) for early-stage',
      condition: 'HER2-positive invasive breast cancer',
      drug_details: { drug: 'Trastuzumab + Pertuzumab', route: 'IV', duration: '1 year total' },
      provenance: { section: 'HER2-Targeted Therapy', page_or_location: 'BINV-15' },
    },
  ],

  red_flags: [
    {
      flag_id: 'PACK.NCCN.BREAST.2024.RF.01',
      display_id: 'NCCN-BR-RF1',
      finding: 'Inflammatory breast cancer: diffuse erythema and edema (peau d\'orange) involving ≥1/3 of breast skin, with rapid onset',
      implication: 'Aggressive subtype (T4d). Represents dermal lymphatic invasion. Do not confuse with mastitis/abscess. 5-year survival ~40%.',
      action: 'Skin punch biopsy + core biopsy of underlying mass. Neoadjuvant chemotherapy first (NOT primary surgery). Modified radical mastectomy after neoadjuvant if response achieved.',
      urgency: 'urgent',
      provenance: { section: 'Inflammatory Breast Cancer', page_or_location: 'IBC-1' },
    },
  ],

  severity_definitions: [
    {
      severity_id: 'PACK.NCCN.BREAST.2024.SEV.01',
      display_id: 'NCCN-BR-SEV1',
      level: 'DCIS (Ductal Carcinoma In Situ)',
      criteria: [
        'Non-invasive: malignant cells confined within the ductal basement membrane',
        'No stromal invasion on pathology',
        'Stage 0 breast cancer',
      ],
      management_implications:
        'Lumpectomy + radiation OR mastectomy (for extensive DCIS). No axillary staging (SLNB may be performed if mastectomy planned, as upgrade to invasive possible). Endocrine therapy (tamoxifen) reduces ipsilateral recurrence for ER+ DCIS. Not life-threatening but 20-50% progress to invasive cancer if untreated.',
      provenance: { section: 'DCIS Management', page_or_location: 'DCIS-1' },
    },
    {
      severity_id: 'PACK.NCCN.BREAST.2024.SEV.02',
      display_id: 'NCCN-BR-SEV2',
      level: 'Locally Advanced Breast Cancer (Stage III)',
      criteria: [
        'T3 (tumor >5cm) or T4 (extension to chest wall or skin)',
        'N2-N3 (ipsilateral fixed/matted axillary or internal mammary nodes)',
        'Inflammatory breast cancer (T4d)',
        'No distant metastases',
      ],
      management_implications:
        'Neoadjuvant chemotherapy first to downstage disease. Modified radical mastectomy (not breast conservation initially). Axillary dissection. Postmastectomy radiation. Adjuvant systemic therapy based on receptor status. Pathologic complete response (pCR) to neoadjuvant is a strong prognostic indicator.',
      provenance: { section: 'Locally Advanced', page_or_location: 'BINV-10' },
    },
  ],

  source_pack_version: 1,
  status: 'active',
  last_normalized: '2026-04-16',
  normalizer_version: 1,
  normalization_notes: 'Surgery pack: Breast cancer. Covers triple assessment, BIRADS, DCIS vs invasive, SLNB, breast conservation vs mastectomy, ER/PR/HER2 targeted therapy.',

  all_item_ids: [
    'PACK.NCCN.BREAST.2024.REC.01', 'PACK.NCCN.BREAST.2024.REC.02', 'PACK.NCCN.BREAST.2024.REC.03',
    'PACK.NCCN.BREAST.2024.REC.04',
    'PACK.NCCN.BREAST.2024.DC.01', 'PACK.NCCN.BREAST.2024.DC.02',
    'PACK.NCCN.BREAST.2024.T.01',
    'PACK.NCCN.BREAST.2024.TX.01', 'PACK.NCCN.BREAST.2024.TX.02', 'PACK.NCCN.BREAST.2024.TX.03',
    'PACK.NCCN.BREAST.2024.RF.01',
    'PACK.NCCN.BREAST.2024.SEV.01', 'PACK.NCCN.BREAST.2024.SEV.02',
  ],
  all_display_ids: [
    'NCCN-BR-R1', 'NCCN-BR-R2', 'NCCN-BR-R3', 'NCCN-BR-R4',
    'NCCN-BR-DC1', 'NCCN-BR-DC2',
    'NCCN-BR-T1',
    'NCCN-BR-TX1', 'NCCN-BR-TX2', 'NCCN-BR-TX3',
    'NCCN-BR-RF1',
    'NCCN-BR-SEV1', 'NCCN-BR-SEV2',
  ],
};
