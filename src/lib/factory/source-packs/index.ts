// ─── Pack Registry Index ───
// Central registry for all source packs. Dynamic imports keep the bundle lean.

import type { SourcePack, PackStatus } from './types';

const PACK_REGISTRY: Record<string, () => Promise<SourcePack>> = {
  // ── Original packs ──
  'PACK.ACG.AP.2024': () =>
    import('./acg-acute-pancreatitis').then((m) => m.pack),
  'PACK.AASLD.CSBP.2021': () =>
    import('./aasld-cirrhosis-sbp').then((m) => m.pack),
  'PACK.ACG.GIB.2021': () =>
    import('./acg-gi-bleeding').then((m) => m.pack),
  'PACK.SSC.SEPSIS.2021': () =>
    import('./surviving-sepsis-2021').then((m) => m.pack),
  'PACK.AHA.ACS.2023': () =>
    import('./aha-acs').then((m) => m.PACK_AHA_ACS_2023),
  'PACK.AHA.PE.2024': () =>
    import('./aha-pe').then((m) => m.PACK_AHA_PE_2024),
  'PACK.KDIGO.AKI.2024': () =>
    import('./kdigo-aki').then((m) => m.PACK_KDIGO_AKI_2024),

  // ── Phase 1: High-priority IM ──
  'PACK.ADA.DKAHHS.2024': () =>
    import('./ada-dka-hhs').then((m) => m.PACK_ADA_DKAHHS_2024),
  'PACK.ADA.T2DM.2024': () =>
    import('./ada-type2-diabetes').then((m) => m.PACK_ADA_T2DM_2024),
  'PACK.ATSIDSA.CAP.2019': () =>
    import('./ats-idsa-cap').then((m) => m.PACK_ATSIDSA_CAP_2019),
  'PACK.IDSA.MENING.2004': () =>
    import('./idsa-meningitis').then((m) => m.PACK_IDSA_MENING_2004),
  'PACK.GOLD.COPD.2024': () =>
    import('./gold-copd').then((m) => m.PACK_GOLD_COPD_2024),
  'PACK.GINA.ASTHMA.2024': () =>
    import('./gina-asthma').then((m) => m.PACK_GINA_ASTHMA_2024),
  'PACK.ACCAHA.HF.2022': () =>
    import('./acc-aha-heart-failure').then((m) => m.PACK_ACCAHA_HF_2022),
  'PACK.ACCAHA.AFIB.2023': () =>
    import('./acc-aha-atrial-fibrillation').then((m) => m.PACK_ACCAHA_AFIB_2023),
  'PACK.ACCAHA.HTN.2017': () =>
    import('./acc-aha-hypertension').then((m) => m.PACK_ACCAHA_HTN_2017),
  'PACK.AHA.STROKE.2019': () =>
    import('./aha-stroke').then((m) => m.PACK_AHA_STROKE_2019),
  'PACK.AHA.TIA.2021': () =>
    import('./aha-tia').then((m) => m.PACK_AHA_TIA_2021),
  'PACK.ACCAHA.SYNC.2017': () =>
    import('./acc-aha-syncope').then((m) => m.PACK_ACCAHA_SYNC_2017),

  // ── Phase 2: Remaining IM — Cardiology/Nephro ──
  'PACK.AHA.IE.2015': () =>
    import('./aha-infective-endocarditis').then((m) => m.PACK_AHA_IE_2015),
  'PACK.ACCAHA.VHD.2020': () =>
    import('./acc-aha-valvular').then((m) => m.PACK_ACCAHA_VHD_2020),
  'PACK.ACCAHA.PERI.2015': () =>
    import('./acc-aha-pericardial').then((m) => m.PACK_ACCAHA_PERI_2015),
  'PACK.AHA.ACLS.2020': () =>
    import('./aha-cardiac-arrest').then((m) => m.PACK_AHA_ACLS_2020),
  'PACK.ACCAHA.PAD.2016': () =>
    import('./acc-aha-pad').then((m) => m.PACK_ACCAHA_PAD_2016),
  'PACK.ACCAHA.CHOL.2018': () =>
    import('./acc-aha-dyslipidemia').then((m) => m.PACK_ACCAHA_CHOL_2018),
  'PACK.KDIGO.CKD.2024': () =>
    import('./kdigo-ckd').then((m) => m.PACK_KDIGO_CKD_2024),

  // ── Phase 2: Remaining IM — Endo/GI/Nephro ──
  'PACK.ATA.THY.2015': () =>
    import('./ata-thyroid').then((m) => m.PACK_ATA_THY_2015),
  'PACK.ES.ADRENAL.2016': () =>
    import('./es-adrenal').then((m) => m.PACK_ES_ADRENAL_2016),
  'PACK.ES.OSTEO.2020': () =>
    import('./es-osteoporosis').then((m) => m.PACK_ES_OSTEO_2020),
  'PACK.ES.HCALC.2022': () =>
    import('./es-hypercalcemia').then((m) => m.PACK_ES_HCALC_2022),
  'PACK.AASLD.HEPB.2018': () =>
    import('./aasld-hepatitis-b').then((m) => m.PACK_AASLD_HEPB_2018),
  'PACK.AASLD.HEPC.2024': () =>
    import('./aasld-hepatitis-c').then((m) => m.PACK_AASLD_HEPC_2024),
  'PACK.KDIGO.GN.2021': () =>
    import('./kdigo-glomerulonephritis').then((m) => m.PACK_KDIGO_GN_2021),

  // ── Phase 2: Remaining IM — ID/GI/STI ──
  'PACK.ES.PHEO.2014': () =>
    import('./es-pheochromocytoma').then((m) => m.PACK_ES_PHEO_2014),
  'PACK.DHHS.HIV.2024': () =>
    import('./idsa-hiv').then((m) => m.PACK_DHHS_HIV_2024),
  'PACK.ACG.IBD.2019': () =>
    import('./acg-ibd').then((m) => m.PACK_ACG_IBD_2019),
  'PACK.ACG.GERD.2022': () =>
    import('./acg-gerd').then((m) => m.PACK_ACG_GERD_2022),
  'PACK.ACG.CDIFF.2021': () =>
    import('./acg-cdiff').then((m) => m.PACK_ACG_CDIFF_2021),
  'PACK.IDSA.UTI.2011': () =>
    import('./idsa-uti').then((m) => m.PACK_IDSA_UTI_2011),
  'PACK.CDC.STI.2021': () =>
    import('./cdc-sti').then((m) => m.PACK_CDC_STI_2021),

  // ── Phase 2: Remaining IM — Rheumatology ──
  'PACK.ACR.RA.2021': () =>
    import('./acr-ra').then((m) => m.PACK_ACR_RA_2021),
  'PACK.ACR.GOUT.2020': () =>
    import('./acr-gout').then((m) => m.PACK_ACR_GOUT_2020),
  'PACK.ACR.SLE.2019': () =>
    import('./acr-sle').then((m) => m.PACK_ACR_SLE_2019),
  'PACK.ACR.VASC.2021': () =>
    import('./acr-vasculitis').then((m) => m.PACK_ACR_VASC_2021),

  // ── Phase 2: Remaining IM — Hematology/Oncology/ID ──
  'PACK.CHEST.VTE.2021': () =>
    import('./chest-vte').then((m) => m.PACK_CHEST_VTE_2021),
  'PACK.ASH.SCD.2020': () =>
    import('./ash-sickle-cell').then((m) => m.PACK_ASH_SCD_2020),
  'PACK.ASH.TTP.2020': () =>
    import('./ash-ttp-hus').then((m) => m.PACK_ASH_TTP_2020),
  'PACK.ASCO.TLS.2015': () =>
    import('./asco-tumor-lysis').then((m) => m.PACK_ASCO_TLS_2015),
  'PACK.IDSA.SSTI.2014': () =>
    import('./idsa-ssti').then((m) => m.PACK_IDSA_SSTI_2014),

  // ── Neurology ──
  'PACK.AAN.EPIL.2018': () =>
    import('./aan-epilepsy').then((m) => m.PACK_AAN_EPIL_2018),
  'PACK.AAN.MS.2018': () =>
    import('./aan-ms').then((m) => m.PACK_AAN_MS_2018),
  'PACK.AAN.HA.2021': () =>
    import('./aan-headache').then((m) => m.PACK_AAN_HA_2021),
  'PACK.AAN.DEM.2018': () =>
    import('./aan-dementia').then((m) => m.PACK_AAN_DEM_2018),
  'PACK.AAN.NM.2016': () =>
    import('./aan-neuromuscular').then((m) => m.PACK_AAN_NM_2016),

  // ── Surgery ──
  'PACK.ACS.ATLS.2018': () =>
    import('./acs-atls-trauma').then((m) => m.PACK_ACS_ATLS_2018),
  'PACK.WSES.APPY.2020': () =>
    import('./wses-appendicitis').then((m) => m.PACK_WSES_APPY_2020),
  'PACK.TG.CHOLE.2018': () =>
    import('./tg-cholecystitis').then((m) => m.PACK_TG_CHOLE_2018),
  'PACK.WSES.SBO.2017': () =>
    import('./wses-sbo').then((m) => m.PACK_WSES_SBO_2017),
  'PACK.HS.HERNIA.2018': () =>
    import('./herniasurge').then((m) => m.PACK_HS_HERNIA_2018),
  'PACK.ABA.BURNS.2016': () =>
    import('./aba-burns').then((m) => m.PACK_ABA_BURNS_2016),
  'PACK.ACCAHA.PERIOP.2014': () =>
    import('./acc-aha-periop').then((m) => m.PACK_ACCAHA_PERIOP_2014),
  'PACK.NCCN.BREAST.2024': () =>
    import('./nccn-breast').then((m) => m.PACK_NCCN_BREAST_2024),
  'PACK.ATA.THYSURG.2015': () =>
    import('./ata-thyroid-nodule-surg').then((m) => m.PACK_ATA_THYSURG_2015),
  'PACK.WSES.ABD.2020': () =>
    import('./wses-acute-abdomen').then((m) => m.PACK_WSES_ABD_2020),

  // ── OB/GYN ──
  'PACK.ACOG.PREEC.2020': () =>
    import('./acog-preeclampsia').then((m) => m.PACK_ACOG_PREEC_2020),
  'PACK.ACOG.GDM.2018': () =>
    import('./acog-gdm').then((m) => m.PACK_ACOG_GDM_2018),
  'PACK.ACOG.PTL.2021': () =>
    import('./acog-preterm-labor').then((m) => m.PACK_ACOG_PTL_2021),
  'PACK.ACOG.ECTOP.2018': () =>
    import('./acog-ectopic').then((m) => m.PACK_ACOG_ECTOP_2018),
  'PACK.ACOG.RH.2018': () =>
    import('./acog-rh').then((m) => m.PACK_ACOG_RH_2018),
  'PACK.ACOG.LABOR.2019': () =>
    import('./acog-labor').then((m) => m.PACK_ACOG_LABOR_2019),
  'PACK.ACOG.PPH.2017': () =>
    import('./acog-pph').then((m) => m.PACK_ACOG_PPH_2017),
  'PACK.ACOG.PRENA.2020': () =>
    import('./acog-prenatal').then((m) => m.PACK_ACOG_PRENA_2020),
  'PACK.ACOG.PLAC.2019': () =>
    import('./acog-placental').then((m) => m.PACK_ACOG_PLAC_2019),
  'PACK.ACOG.PROM.2020': () =>
    import('./acog-prom').then((m) => m.PACK_ACOG_PROM_2020),
  'PACK.ASCCP.CERV.2019': () =>
    import('./asccp-cervical').then((m) => m.PACK_ASCCP_CERV_2019),
  'PACK.ACOG.AUB.2021': () =>
    import('./acog-aub').then((m) => m.PACK_ACOG_AUB_2021),
  'PACK.CDC.CONTRA.2024': () =>
    import('./cdc-contraception').then((m) => m.PACK_CDC_CONTRA_2024),
  'PACK.ACOG.OVAR.2016': () =>
    import('./acog-ovarian').then((m) => m.PACK_ACOG_OVAR_2016),
  'PACK.NAMS.MENO.2022': () =>
    import('./nams-menopause').then((m) => m.PACK_NAMS_MENO_2022),

  // ── Pediatrics ──
  'PACK.AHA.KAWA.2017': () =>
    import('./aha-kawasaki').then((m) => m.PACK_AHA_KAWA_2017),
  'PACK.AAP.NRP.2020': () =>
    import('./aap-nrp').then((m) => m.PACK_AAP_NRP_2020),
  'PACK.AAP.JAUN.2022': () =>
    import('./aap-jaundice').then((m) => m.PACK_AAP_JAUN_2022),
  'PACK.AAP.BRONCH.2014': () =>
    import('./aap-bronchiolitis').then((m) => m.PACK_AAP_BRONCH_2014),
  'PACK.AAP.AOM.2013': () =>
    import('./aap-aom').then((m) => m.PACK_AAP_AOM_2013),
  'PACK.AAP.FSEZ.2011': () =>
    import('./aap-febrile-seizures').then((m) => m.PACK_AAP_FSEZ_2011),
  'PACK.AAP.PUTI.2016': () =>
    import('./aap-pedi-uti').then((m) => m.PACK_AAP_PUTI_2016),
  'PACK.AAP.ADHD.2019': () =>
    import('./aap-adhd').then((m) => m.PACK_AAP_ADHD_2019),
  'PACK.CDC.IMMUN.2024': () =>
    import('./cdc-immunizations').then((m) => m.PACK_CDC_IMMUN_2024),
  'PACK.CDC.MILES.2022': () =>
    import('./cdc-milestones').then((m) => m.PACK_CDC_MILES_2022),
  'PACK.AAP.CROUP.2019': () =>
    import('./aap-croup').then((m) => m.PACK_AAP_CROUP_2019),
  'PACK.GINA.PASTHMA.2024': () =>
    import('./gina-peds-asthma').then((m) => m.PACK_GINA_PASTHMA_2024),

  // ── Psychiatry ──
  'PACK.APA.MDD.2023': () =>
    import('./apa-mdd').then((m) => m.PACK_APA_MDD_2023),
  'PACK.APA.BPD.2023': () =>
    import('./apa-bipolar').then((m) => m.PACK_APA_BPD_2023),
  'PACK.APA.SCZ.2020': () =>
    import('./apa-schizophrenia').then((m) => m.PACK_APA_SCZ_2020),
  'PACK.ASAM.OUD.2020': () =>
    import('./asam-oud').then((m) => m.PACK_ASAM_OUD_2020),
  'PACK.APA.AUD.2018': () =>
    import('./apa-aud').then((m) => m.PACK_APA_AUD_2018),
  'PACK.APA.ANXPTSD.2017': () =>
    import('./apa-anxiety-ptsd').then((m) => m.PACK_APA_ANXPTSD_2017),
  'PACK.APA.EAT.2023': () =>
    import('./apa-eating').then((m) => m.PACK_APA_EAT_2023),

  // ── Preventive Medicine ──
  'PACK.USPSTF.SCREEN.2024': () =>
    import('./uspstf-screening').then((m) => m.PACK_USPSTF_SCREEN_2024),
  'PACK.CDC.ADIMMUN.2024': () =>
    import('./cdc-adult-immun').then((m) => m.PACK_CDC_ADIMMUN_2024),

  // ── DI/IC Accelerator Drafts — Electrolytes/Acid-Base ──
  'PACK.ASN.HK.2023': () =>
    import('./asn-hk').then((m) => m.PACK_ASN_HK_2023),
  'PACK.ENDOCRINE.HYPOKALEMIA.2023': () =>
    import('./endocrine-hypokalemia').then((m) => m.PACK_ENDOCRINE_HYPOKALEMIA_2023),
  'PACK.ES.HYPOCA.2023': () =>
    import('./es-hypoca').then((m) => m.PACK_ES_HYPOCA_2023),
  'PACK.AACEP.AGMA.2023': () =>
    import('./aacep-agma').then((m) => m.PACK_AACEP_AGMA_2023),
  'PACK.AACE.METALK.2023': () =>
    import('./aace-metalk').then((m) => m.PACK_AACE_METALK_2023),

  // ── DI/IC Drafts — Toxicology ──
  'PACK.AASLD.APAP.2023': () =>
    import('./aasld-apap').then((m) => m.PACK_AASLD_APAP_2023),
  'PACK.SAMHSA.OOD.2023': () =>
    import('./samhsa-ood').then((m) => m.PACK_SAMHSA_OOD_2023),
  'PACK.APA.ALCWD.2022': () =>
    import('./apa-alcwd').then((m) => m.PACK_APA_ALCWD_2022),
  'PACK.AANS.SS_NMS.2023': () =>
    import('./aans-ss_nms').then((m) => m.PACK_AANS_SS_NMS_2023),

  // ── DI/IC Drafts — Dermatology ──
  'PACK.AAD.MEL.2019': () =>
    import('./aad-mel').then((m) => m.PACK_AAD_MEL_2019),
  'PACK.DERMATOLOGY.SJSTEN.2023': () =>
    import('./dermatology-sjsten').then((m) => m.PACK_DERMATOLOGY_SJSTEN_2023),
  'PACK.AAD.PSO.2019': () =>
    import('./aad-pso').then((m) => m.PACK_AAD_PSO_2019),
  'PACK.AAD.EN.2019': () =>
    import('./aad-en').then((m) => m.PACK_AAD_EN_2019),

  // ── DI/IC Drafts — Critical Care ──
  'PACK.ACS.ANAPH.2023': () =>
    import('./acs-anaph').then((m) => m.PACK_ACS_ANAPH_2023),
  'PACK.ATS.ARDS.2012': () =>
    import('./ats-ards').then((m) => m.PACK_ATS_ARDS_2012),
  'PACK.ACS.HYPO.2022': () =>
    import('./acs-hypo').then((m) => m.PACK_ACS_HYPO_2022),
  'PACK.ACCP.TP.2019': () =>
    import('./accp-tp').then((m) => m.PACK_ACCP_TP_2019),

  // ── DI/IC Drafts — Pulmonary ──
  'PACK.BTS.PE.2010': () =>
    import('./bts-pe').then((m) => m.PACK_BTS_PE_2010),
  'PACK.ATS.PNEUMOTHORAX.2023': () =>
    import('./ats-pneumothorax').then((m) => m.PACK_ATS_PNEUMOTHORAX_2023),
  'PACK.ATS.ILD.2022': () =>
    import('./ats-ild').then((m) => m.PACK_ATS_ILD_2022),
  'PACK.AASM.OSA.2020': () =>
    import('./aasm-osa').then((m) => m.PACK_AASM_OSA_2020),
  'PACK.ATS.SARC.2020': () =>
    import('./ats-sarc').then((m) => m.PACK_ATS_SARC_2020),
  'PACK.ESC.PAH.2022': () =>
    import('./esc-pah').then((m) => m.PACK_ESC_PAH_2022),

  // ── DI/IC Drafts — Gastroenterology ──
  'PACK.AGA.PUD.2022': () =>
    import('./aga-pud').then((m) => m.PACK_AGA_PUD_2022),
  'PACK.ACG.SBO.2023': () =>
    import('./acg-sbo').then((m) => m.PACK_ACG_SBO_2023),
  'PACK.ACG.CD.2023': () =>
    import('./acg-cd').then((m) => m.PACK_ACG_CD_2023),
  'PACK.ACG.DIV.2020': () =>
    import('./acg-div').then((m) => m.PACK_ACG_DIV_2020),

  // ── DI/IC Drafts — Hepatology ──
  'PACK.AASLD.AH.2019': () =>
    import('./aasld-ah').then((m) => m.PACK_AASLD_AH_2019),
  'PACK.ACG.DILI.2014': () =>
    import('./acg-dili').then((m) => m.PACK_ACG_DILI_2014),
  'PACK.AASLD.AIH.2019': () =>
    import('./aasld-aih').then((m) => m.PACK_AASLD_AIH_2019),

  // ── DI/IC Drafts — Nephrology ──
  'PACK.AHA.RAS.2023': () =>
    import('./aha-ras').then((m) => m.PACK_AHA_RAS_2023),
  'PACK.AUA.NEPHRO.2019': () =>
    import('./aua-nephro').then((m) => m.PACK_AUA_NEPHRO_2019),
  'PACK.KDIGO.RTA.2021': () =>
    import('./kdigo-rta').then((m) => m.PACK_KDIGO_RTA_2021),

  // ── DI/IC Drafts — Hematology/Oncology ──
  'PACK.ACG.IDA.2020': () =>
    import('./acg-ida').then((m) => m.PACK_ACG_IDA_2020),
  'PACK.AHS.B12DEF.2020': () =>
    import('./ahs-b12def').then((m) => m.PACK_AHS_B12DEF_2020),
  'PACK.ASH.HA.2023': () =>
    import('./ash-ha').then((m) => m.PACK_ASH_HA_2023),
  'PACK.ASH.PANCYTO.2023': () =>
    import('./ash-pancyto').then((m) => m.PACK_ASH_PANCYTO_2023),
  'PACK.NCCN.LYMPH.2023': () =>
    import('./nccn-lymph').then((m) => m.PACK_NCCN_LYMPH_2023),
  'PACK.ASH.THROMBOCYTOPENIA.2023': () =>
    import('./ash-thrombocytopenia').then((m) => m.PACK_ASH_THROMBOCYTOPENIA_2023),

  // ── DI/IC Drafts — Neurology ──
  'PACK.MDS.PD.2019': () =>
    import('./mds-pd').then((m) => m.PACK_MDS_PD_2019),
  'PACK.AHA.SAH.2019': () =>
    import('./aha-sah').then((m) => m.PACK_AHA_SAH_2019),

  // ── DI/IC Drafts — Rheumatology ──
  'PACK.ACR.CPPD.2023': () =>
    import('./acr-cppd').then((m) => m.PACK_ACR_CPPD_2023),
  'PACK.ACR.PMR_GCA.2023': () =>
    import('./acr-pmr_gca').then((m) => m.PACK_ACR_PMR_GCA_2023),
  'PACK.ACR.AS.2019': () =>
    import('./acr-as').then((m) => m.PACK_ACR_AS_2019),

  // ── DI/IC Drafts — Infectious Disease ──
  'PACK.CDC.TB.2020': () =>
    import('./cdc-tb').then((m) => m.PACK_CDC_TB_2020),

  // ── DI/IC Drafts — Preventive/Screening ──
  'PACK.USPSTF.CRC.2021': () =>
    import('./uspstf-crc').then((m) => m.PACK_USPSTF_CRC_2021),
  'PACK.ACOG.CCS.2020': () =>
    import('./acog-ccs').then((m) => m.PACK_ACOG_CCS_2020),

  // ── Step 4 Packs (priority gaps — 2026-04-16) ──
  'PACK.AAN.VM.2023': () => import('./aan-vm').then((m) => m.PACK_AAN_VM_2023),
  'PACK.ADA.DN.2023': () => import('./ada-dn').then((m) => m.PACK_ADA_DN_2023),
  'PACK.ADA.HYPOGLY.2023': () => import('./ada-hypogly').then((m) => m.PACK_ADA_HYPOGLY_2023),
  'PACK.ADA.T1DM.2023': () => import('./ada-t1dm').then((m) => m.PACK_ADA_T1DM_2023),
  'PACK.AGA.CP.2020': () => import('./aga-cp').then((m) => m.PACK_AGA_CP_2020),
  'PACK.AHA.HS.2019': () => import('./aha-hs').then((m) => m.PACK_AHA_HS_2019),
  'PACK.AHA.HTN_EMER.2017': () => import('./aha-htn_emer').then((m) => m.PACK_AHA_HTN_EMER_2017),
  'PACK.ASH.ACD.2023': () => import('./ash-acd').then((m) => m.PACK_ASH_ACD_2023),
  'PACK.ATS.ASPIR.2019': () => import('./ats-aspir').then((m) => m.PACK_ATS_ASPIR_2019),
  'PACK.ATS.HAP.2016': () => import('./ats-hap').then((m) => m.PACK_ATS_HAP_2016),
  'PACK.IDSA.ENC.2023': () => import('./idsa-enc').then((m) => m.PACK_IDSA_ENC_2023),
  'PACK.IDSA.SA.2023': () => import('./idsa-sa').then((m) => m.PACK_IDSA_SA_2023),
  'PACK.OARSI.OA.2019': () => import('./oarsi-oa').then((m) => m.PACK_OARSI_OA_2019),

  // ── Gap Closure Batches (2026-04-16) ──

  // Cardiovascular / Respiratory
  'PACK.AHA.AAA.2022': () => import('./aha-aaa').then((m) => m.PACK_AHA_AAA_2022),
  'PACK.IDSA.LA.2023': () => import('./idsa-la').then((m) => m.PACK_IDSA_LA_2023),
  'PACK.ATS.BRONCH.2017': () => import('./ats-bronch').then((m) => m.PACK_ATS_BRONCH_2017),
  'PACK.ACCP.LC.2023': () => import('./accp-lc').then((m) => m.PACK_ACCP_LC_2023),

  // GI / Hepatology
  'PACK.NCCN.PANC.2024': () => import('./nccn-panc').then((m) => m.PACK_NCCN_PANC_2024),
  'PACK.AASLD.NAFLD.2023': () => import('./aasld-nafld').then((m) => m.PACK_AASLD_NAFLD_2023),
  'PACK.AASLD.HCC.2022': () => import('./aasld-hcc').then((m) => m.PACK_AASLD_HCC_2022),
  'PACK.AGA.ACHAL.2020': () => import('./aga-achal').then((m) => m.PACK_AGA_ACHAL_2020),
  'PACK.AGA.GC.2022': () => import('./aga-gc').then((m) => m.PACK_AGA_GC_2022),
  'PACK.AGA.GASTROPARESIS.2022': () => import('./aga-gastroparesis').then((m) => m.PACK_AGA_GASTROPARESIS_2022),
  'PACK.NCCN.EC.2024': () => import('./nccn-ec').then((m) => m.PACK_NCCN_EC_2024),

  // Endocrine
  'PACK.ENDOCRINE.PA.2020': () => import('./endocrine-pa').then((m) => m.PACK_ENDOCRINE_PA_2020),
  'PACK.ENDO.DI.2019': () => import('./endo-di').then((m) => m.PACK_ENDO_DI_2019),
  'PACK.ESE.SIADH.2024': () => import('./ese-siadh').then((m) => m.PACK_ESE_SIADH_2024),

  // Urology
  'PACK.AUA.TT.2023': () => import('./aua-tt').then((m) => m.PACK_AUA_TT_2023),
  'PACK.AUA.RCC.2023': () => import('./aua-rcc').then((m) => m.PACK_AUA_RCC_2023),

  // Neurology / Ophthalmology / ENT
  'PACK.IDSA.BA.2023': () => import('./idsa-ba').then((m) => m.PACK_IDSA_BA_2023),
  'PACK.AAN.BP.2012': () => import('./aan-bp').then((m) => m.PACK_AAN_BP_2012),
  'PACK.AAN.TN.2019': () => import('./aan-tn').then((m) => m.PACK_AAN_TN_2019),
  'PACK.WHO.BRAINTUMOR.2021': () => import('./who-braintumor').then((m) => m.PACK_WHO_BRAINTUMOR_2021),
  'PACK.AAO.VERTIGO.2019': () => import('./aao-vertigo').then((m) => m.PACK_AAO_VERTIGO_2019),
  'PACK.AAO.GLAU.2020': () => import('./aao-glau').then((m) => m.PACK_AAO_GLAU_2020),
  'PACK.AAO.RD.2019': () => import('./aao-rd').then((m) => m.PACK_AAO_RD_2019),

  // Hematology
  'PACK.WFH.HEM.2020': () => import('./wfh-hem').then((m) => m.PACK_WFH_HEM_2020),
  'PACK.ASH.VWD.2021': () => import('./ash-vwd').then((m) => m.PACK_ASH_VWD_2021),
  'PACK.NCCN.MM.2024': () => import('./nccn-mm').then((m) => m.PACK_NCCN_MM_2024),
  'PACK.ASH.LEUK.2023': () => import('./ash-leuk').then((m) => m.PACK_ASH_LEUK_2023),

  // Transplant / Ortho / OB / General
  'PACK.UNOS.TRANSPLANT_REJ.2023': () => import('./unos-transplant_rej').then((m) => m.PACK_UNOS_TRANSPLANT_REJ_2023),
  'PACK.AAFOS.CS.2019': () => import('./aafos-cs').then((m) => m.PACK_AAFOS_CS_2019),
  'PACK.ACOG.PPD.2022': () => import('./acog-ppd').then((m) => m.PACK_ACOG_PPD_2022),
  'PACK.AMA.OBM.2022': () => import('./ama-obm').then((m) => m.PACK_AMA_OBM_2022),
  'PACK.WHO.PAIN.2019': () => import('./who-pain').then((m) => m.PACK_WHO_PAIN_2019),
};

/** Load a pack by ID. Returns null if not registered or not active. */
export async function loadPack(sourcePackId: string): Promise<SourcePack | null> {
  const loader = PACK_REGISTRY[sourcePackId];
  if (!loader) return null;

  try {
    const pack = await loader();
    if (pack.status !== 'active') return null;
    return pack;
  } catch {
    // Pack file doesn't exist yet (Phase D stubs)
    return null;
  }
}

/** Check a pack's status without loading the full content. */
export async function getPackStatus(
  sourcePackId: string
): Promise<PackStatus | 'not_registered'> {
  const loader = PACK_REGISTRY[sourcePackId];
  if (!loader) return 'not_registered';

  try {
    const pack = await loader();
    return pack.status;
  } catch {
    return 'not_registered';
  }
}

/** List all pack IDs that are currently active. */
export async function listActivePacks(): Promise<string[]> {
  const results: string[] = [];
  for (const [id, loader] of Object.entries(PACK_REGISTRY)) {
    try {
      const pack = await loader();
      if (pack.status === 'active') results.push(id);
    } catch {
      // Skip packs that can't be loaded
    }
  }
  return results;
}

/** Find a pack by its source_name field. */
export async function getPackBySourceName(
  name: string
): Promise<SourcePack | null> {
  for (const loader of Object.values(PACK_REGISTRY)) {
    try {
      const pack = await loader();
      if (pack.source_name === name && pack.status === 'active') return pack;
    } catch {
      // Skip
    }
  }
  return null;
}
