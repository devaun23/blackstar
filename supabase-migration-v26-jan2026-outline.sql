-- ============================================================================
-- Blackstar: Migration v26 — Jan 2026 USMLE Step 2 CK Outline Update
-- ============================================================================
-- Updates content_system, content_discipline, content_competency to match
-- the official USMLE Step 2 CK Content Outline (last updated Jan 2026).
--
-- Key changes:
--   Systems:      Remove general_principles + nutritional, add human_development + behavioral_health
--   Disciplines:  Major weight corrections (Surgery 8-14% → 20-30%, etc.)
--   Competencies: Full taxonomy replacement to Jan 2026 structure
--
-- IMPORTANT: Topic and blueprint_node remaps happen BEFORE system deletion
-- to avoid CASCADE data loss.
-- ============================================================================

BEGIN;

-- ============================================
-- 1. Content Systems: Add new systems first
-- ============================================

INSERT INTO public.content_system (code, display_name, usmle_label, weight_min, weight_max, sort_order)
VALUES
  ('human_development', 'Human Development', 'Human Development', 2, 4, 1),
  ('behavioral_health', 'Behavioral Health', 'Behavioral Health', 5, 10, 4)
ON CONFLICT (code) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  usmle_label = EXCLUDED.usmle_label,
  weight_min = EXCLUDED.weight_min,
  weight_max = EXCLUDED.weight_max,
  sort_order = EXCLUDED.sort_order;

-- ============================================
-- 2. Update existing system weights and labels
-- ============================================

UPDATE public.content_system SET weight_min = 3, weight_max = 6 WHERE code = 'blood_lymph';
UPDATE public.content_system SET weight_min = 3, weight_max = 5 WHERE code = 'immune';
UPDATE public.content_system SET weight_min = 6, weight_max = 12,
  display_name = 'Musculoskeletal, Skin & Subcutaneous Tissue',
  usmle_label = 'Musculoskeletal, Skin & Subcutaneous Tissue'
  WHERE code = 'musculoskeletal';
UPDATE public.content_system SET weight_min = 3, weight_max = 7 WHERE code = 'pregnancy';
UPDATE public.content_system SET weight_min = 7, weight_max = 13,
  display_name = 'Renal, Urinary & Reproductive',
  usmle_label = 'Renal & Urinary System & Reproductive Systems'
  WHERE code = 'renal_urinary_reproductive';
UPDATE public.content_system SET weight_min = 3, weight_max = 7 WHERE code = 'endocrine';
UPDATE public.content_system SET weight_min = 4, weight_max = 8 WHERE code = 'multisystem';
UPDATE public.content_system SET weight_min = 3, weight_max = 5,
  usmle_label = 'Biostatistics & Epidemiology/Population Health & Interpretation of Medical Literature'
  WHERE code = 'biostatistics';
UPDATE public.content_system SET weight_min = 10, weight_max = 15,
  usmle_label = 'Social Sciences: Legal/Ethical Issues & Professionalism/Systems-Based Practice & Patient Safety'
  WHERE code = 'social_sciences';

-- Cardiovascular (6-12%), Respiratory (5-10%), GI (5-10%), Nervous (5-10%) unchanged

-- ============================================
-- 3. Re-sort all systems to Jan 2026 outline order
-- ============================================

UPDATE public.content_system SET sort_order = 1  WHERE code = 'human_development';
UPDATE public.content_system SET sort_order = 2  WHERE code = 'immune';
UPDATE public.content_system SET sort_order = 3  WHERE code = 'blood_lymph';
UPDATE public.content_system SET sort_order = 4  WHERE code = 'behavioral_health';
UPDATE public.content_system SET sort_order = 5  WHERE code = 'nervous_system';
UPDATE public.content_system SET sort_order = 6  WHERE code = 'musculoskeletal';
UPDATE public.content_system SET sort_order = 7  WHERE code = 'cardiovascular';
UPDATE public.content_system SET sort_order = 8  WHERE code = 'respiratory';
UPDATE public.content_system SET sort_order = 9  WHERE code = 'gastrointestinal';
UPDATE public.content_system SET sort_order = 10 WHERE code = 'renal_urinary_reproductive';
UPDATE public.content_system SET sort_order = 11 WHERE code = 'pregnancy';
UPDATE public.content_system SET sort_order = 12 WHERE code = 'endocrine';
UPDATE public.content_system SET sort_order = 13 WHERE code = 'multisystem';
UPDATE public.content_system SET sort_order = 14 WHERE code = 'biostatistics';
UPDATE public.content_system SET sort_order = 15 WHERE code = 'social_sciences';

-- ============================================
-- 4. Remap content_topic rows BEFORE deleting deprecated systems
--    (content_topic has ON DELETE CASCADE — must remap first!)
-- ============================================

-- general_principles topics → multisystem (pharmacology + cross-system)
UPDATE public.content_topic SET content_system_id = (
  SELECT id FROM public.content_system WHERE code = 'multisystem'
) WHERE content_system_id = (
  SELECT id FROM public.content_system WHERE code = 'general_principles'
) AND topic_name NOT IN ('Genetic Disorders', 'Immunology Basics');

-- general_principles → human_development (genetics)
UPDATE public.content_topic SET content_system_id = (
  SELECT id FROM public.content_system WHERE code = 'human_development'
) WHERE content_system_id = (
  SELECT id FROM public.content_system WHERE code = 'general_principles'
) AND topic_name = 'Genetic Disorders';

-- general_principles → immune (immunology)
UPDATE public.content_topic SET content_system_id = (
  SELECT id FROM public.content_system WHERE code = 'immune'
) WHERE content_system_id = (
  SELECT id FROM public.content_system WHERE code = 'general_principles'
) AND topic_name = 'Immunology Basics';

-- nutritional → behavioral_health (eating disorders)
UPDATE public.content_topic SET content_system_id = (
  SELECT id FROM public.content_system WHERE code = 'behavioral_health'
) WHERE content_system_id = (
  SELECT id FROM public.content_system WHERE code = 'nutritional'
) AND topic_name = 'Eating Disorders';

-- nutritional → gastrointestinal (remaining nutrition topics)
UPDATE public.content_topic SET content_system_id = (
  SELECT id FROM public.content_system WHERE code = 'gastrointestinal'
) WHERE content_system_id = (
  SELECT id FROM public.content_system WHERE code = 'nutritional'
) AND topic_name != 'Eating Disorders';

-- ============================================
-- 5. Remap blueprint_node.content_system_id BEFORE deleting
--    (blueprint_node has ON DELETE SET NULL — remap to preserve data)
-- ============================================

UPDATE public.blueprint_node SET content_system_id = (
  SELECT id FROM public.content_system WHERE code = 'multisystem'
) WHERE content_system_id = (
  SELECT id FROM public.content_system WHERE code = 'general_principles'
);

UPDATE public.blueprint_node SET content_system_id = (
  SELECT id FROM public.content_system WHERE code = 'gastrointestinal'
) WHERE content_system_id = (
  SELECT id FROM public.content_system WHERE code = 'nutritional'
);

-- ============================================
-- 6. Delete deprecated systems (now safe — all FKs remapped)
-- ============================================

DELETE FROM public.content_system WHERE code IN ('general_principles', 'nutritional');

-- ============================================
-- 7. Content Disciplines: Update weight ranges
-- ============================================

UPDATE public.content_discipline SET weight_min = 20, weight_max = 30 WHERE code = 'surgery';
UPDATE public.content_discipline SET weight_min = 17, weight_max = 27 WHERE code = 'pediatrics';
UPDATE public.content_discipline SET weight_min = 10, weight_max = 20 WHERE code = 'obstetrics_gynecology';
UPDATE public.content_discipline SET weight_min = 10, weight_max = 15 WHERE code = 'psychiatry';
-- medicine (55-65%) unchanged

-- ============================================
-- 8. Content Competencies: Delete old codes not in Jan 2026
-- ============================================

DELETE FROM public.content_competency WHERE code IN (
  'clinical_informatics',
  'mixed_competency',
  'patient_care_systems',
  'communication',
  'biostatistics_epi',
  'emergency_medicine_comp',
  'management'
);

-- ============================================
-- 9. Content Competencies: Upsert Jan 2026 taxonomy
-- ============================================

INSERT INTO public.content_competency (code, display_name, usmle_label, weight_min, weight_max, maps_to_task_types, sort_order)
VALUES
  ('medical_knowledge', 'Applying Foundational Science', 'Medical Knowledge: Applying Foundational Science Concepts', 0, 0, ARRAY['diagnosis'], 1),
  ('history_physical', 'History & Physical Exam', 'Patient Care: History and Physical Exam', 13, 17, ARRAY['diagnosis','risk_identification'], 2),
  ('lab_diagnostic', 'Laboratory/Diagnostic Studies', 'Patient Care: Laboratory/Diagnostic Studies', 16, 20, ARRAY['diagnostic_test'], 3),
  ('diagnosis', 'Diagnosis', 'Patient Care: Diagnosis', 5, 9, ARRAY['diagnosis'], 4),
  ('prognosis_outcome', 'Prognosis/Outcome', 'Patient Care: Prognosis/Outcome', 8, 12, ARRAY['complication_recognition','risk_identification'], 5),
  ('health_maintenance', 'Health Maintenance/Disease Prevention', 'Patient Care: Health Maintenance/Disease Prevention', 8, 12, ARRAY['risk_identification','diagnostic_test'], 6),
  ('pharmacotherapy', 'Pharmacotherapy', 'Patient Care: Pharmacotherapy', 6, 10, ARRAY['next_step'], 7),
  ('clinical_interventions', 'Clinical Interventions', 'Patient Care: Clinical Interventions', 12, 16, ARRAY['next_step','stabilization'], 8),
  ('practice_based_learning', 'Practice-Based Learning & Improvement', 'Practice-Based Learning & Improvement', 3, 5, ARRAY[]::text[], 9),
  ('professionalism', 'Professionalism', 'Professionalism', 5, 7, ARRAY[]::text[], 10),
  ('systems_based_practice', 'Systems-Based Practice & Patient Safety', 'Systems-Based Practice & Patient Safety', 5, 7, ARRAY[]::text[], 11)
ON CONFLICT (code) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  usmle_label = EXCLUDED.usmle_label,
  weight_min = EXCLUDED.weight_min,
  weight_max = EXCLUDED.weight_max,
  maps_to_task_types = EXCLUDED.maps_to_task_types,
  sort_order = EXCLUDED.sort_order;

COMMIT;
