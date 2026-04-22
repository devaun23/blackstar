/**
 * USMLE Step 2 CK Content Topic Catalog (Jan 2026 outline)
 * Full testable universe organized by content_system.code.
 * Source: USMLE Step 2 CK Content Outline and Specifications (last updated Jan 2026)
 *
 * Each topic maps to a content_system via system_code.
 * is_high_yield flags topics that appear frequently on exams.
 * category groups related topics within a system.
 */
export interface ContentTopicSeed {
  system_code: string;
  topic_name: string;
  category: string | null;
  is_high_yield: boolean;
}

export const contentTopics: ContentTopicSeed[] = [
  // ═══════════════════════════════════════════
  // CARDIOVASCULAR
  // ═══════════════════════════════════════════
  { system_code: 'cardiovascular', topic_name: 'Acute Coronary Syndrome', category: 'Ischemic Heart Disease', is_high_yield: true },
  { system_code: 'cardiovascular', topic_name: 'Stable Angina', category: 'Ischemic Heart Disease', is_high_yield: false },
  { system_code: 'cardiovascular', topic_name: 'Unstable Angina / NSTEMI', category: 'Ischemic Heart Disease', is_high_yield: true },
  { system_code: 'cardiovascular', topic_name: 'STEMI', category: 'Ischemic Heart Disease', is_high_yield: true },
  { system_code: 'cardiovascular', topic_name: 'Heart Failure', category: 'Heart Failure', is_high_yield: true },
  { system_code: 'cardiovascular', topic_name: 'CHF Exacerbation', category: 'Heart Failure', is_high_yield: true },
  { system_code: 'cardiovascular', topic_name: 'Diastolic Heart Failure (HFpEF)', category: 'Heart Failure', is_high_yield: false },
  { system_code: 'cardiovascular', topic_name: 'Atrial Fibrillation', category: 'Arrhythmias', is_high_yield: true },
  { system_code: 'cardiovascular', topic_name: 'Atrial Flutter', category: 'Arrhythmias', is_high_yield: false },
  { system_code: 'cardiovascular', topic_name: 'Supraventricular Tachycardia', category: 'Arrhythmias', is_high_yield: false },
  { system_code: 'cardiovascular', topic_name: 'Ventricular Tachycardia', category: 'Arrhythmias', is_high_yield: true },
  { system_code: 'cardiovascular', topic_name: 'Ventricular Fibrillation', category: 'Arrhythmias', is_high_yield: true },
  { system_code: 'cardiovascular', topic_name: 'AV Blocks', category: 'Arrhythmias', is_high_yield: false },
  { system_code: 'cardiovascular', topic_name: 'Long QT Syndrome', category: 'Arrhythmias', is_high_yield: false },
  { system_code: 'cardiovascular', topic_name: 'Hypertension', category: 'Vascular', is_high_yield: true },
  { system_code: 'cardiovascular', topic_name: 'Hypertensive Emergency', category: 'Vascular', is_high_yield: true },
  { system_code: 'cardiovascular', topic_name: 'Aortic Dissection', category: 'Vascular', is_high_yield: true },
  { system_code: 'cardiovascular', topic_name: 'Aortic Aneurysm', category: 'Vascular', is_high_yield: false },
  { system_code: 'cardiovascular', topic_name: 'Peripheral Artery Disease', category: 'Vascular', is_high_yield: false },
  { system_code: 'cardiovascular', topic_name: 'Deep Vein Thrombosis', category: 'Vascular', is_high_yield: true },
  { system_code: 'cardiovascular', topic_name: 'Syncope', category: 'Clinical Presentations', is_high_yield: true },
  { system_code: 'cardiovascular', topic_name: 'Chest Pain', category: 'Clinical Presentations', is_high_yield: true },
  { system_code: 'cardiovascular', topic_name: 'Infective Endocarditis', category: 'Valvular Disease', is_high_yield: true },
  { system_code: 'cardiovascular', topic_name: 'Aortic Stenosis', category: 'Valvular Disease', is_high_yield: true },
  { system_code: 'cardiovascular', topic_name: 'Mitral Regurgitation', category: 'Valvular Disease', is_high_yield: false },
  { system_code: 'cardiovascular', topic_name: 'Mitral Stenosis', category: 'Valvular Disease', is_high_yield: false },
  { system_code: 'cardiovascular', topic_name: 'Pericarditis', category: 'Pericardial Disease', is_high_yield: true },
  { system_code: 'cardiovascular', topic_name: 'Cardiac Tamponade', category: 'Pericardial Disease', is_high_yield: true },
  { system_code: 'cardiovascular', topic_name: 'Myocarditis', category: 'Myocardial Disease', is_high_yield: false },
  { system_code: 'cardiovascular', topic_name: 'Hypertrophic Cardiomyopathy', category: 'Myocardial Disease', is_high_yield: true },
  { system_code: 'cardiovascular', topic_name: 'Dilated Cardiomyopathy', category: 'Myocardial Disease', is_high_yield: false },
  { system_code: 'cardiovascular', topic_name: 'Shock (Cardiogenic)', category: 'Critical Care', is_high_yield: true },

  // ═══════════════════════════════════════════
  // RESPIRATORY
  // ═══════════════════════════════════════════
  { system_code: 'respiratory', topic_name: 'Community-Acquired Pneumonia', category: 'Infections', is_high_yield: true },
  { system_code: 'respiratory', topic_name: 'Hospital-Acquired Pneumonia', category: 'Infections', is_high_yield: false },
  { system_code: 'respiratory', topic_name: 'Aspiration Pneumonia', category: 'Infections', is_high_yield: false },
  { system_code: 'respiratory', topic_name: 'Tuberculosis', category: 'Infections', is_high_yield: true },
  { system_code: 'respiratory', topic_name: 'Lung Abscess', category: 'Infections', is_high_yield: false },
  { system_code: 'respiratory', topic_name: 'Pulmonary Embolism', category: 'Vascular', is_high_yield: true },
  { system_code: 'respiratory', topic_name: 'COPD', category: 'Obstructive', is_high_yield: true },
  { system_code: 'respiratory', topic_name: 'COPD Exacerbation', category: 'Obstructive', is_high_yield: true },
  { system_code: 'respiratory', topic_name: 'Asthma', category: 'Obstructive', is_high_yield: true },
  { system_code: 'respiratory', topic_name: 'Asthma Exacerbation', category: 'Obstructive', is_high_yield: true },
  { system_code: 'respiratory', topic_name: 'Bronchiectasis', category: 'Obstructive', is_high_yield: false },
  { system_code: 'respiratory', topic_name: 'Pleural Effusion', category: 'Pleural Disease', is_high_yield: true },
  { system_code: 'respiratory', topic_name: 'Pneumothorax', category: 'Pleural Disease', is_high_yield: true },
  { system_code: 'respiratory', topic_name: 'Tension Pneumothorax', category: 'Pleural Disease', is_high_yield: true },
  { system_code: 'respiratory', topic_name: 'Acute Respiratory Distress Syndrome (ARDS)', category: 'Critical Care', is_high_yield: true },
  { system_code: 'respiratory', topic_name: 'Respiratory Failure', category: 'Critical Care', is_high_yield: true },
  { system_code: 'respiratory', topic_name: 'Mechanical Ventilation', category: 'Critical Care', is_high_yield: false },
  { system_code: 'respiratory', topic_name: 'Lung Cancer', category: 'Neoplasms', is_high_yield: true },
  { system_code: 'respiratory', topic_name: 'Solitary Pulmonary Nodule', category: 'Neoplasms', is_high_yield: false },
  { system_code: 'respiratory', topic_name: 'Interstitial Lung Disease', category: 'Restrictive', is_high_yield: false },
  { system_code: 'respiratory', topic_name: 'Idiopathic Pulmonary Fibrosis', category: 'Restrictive', is_high_yield: false },
  { system_code: 'respiratory', topic_name: 'Sarcoidosis', category: 'Restrictive', is_high_yield: true },
  { system_code: 'respiratory', topic_name: 'Obstructive Sleep Apnea', category: 'Sleep', is_high_yield: true },
  { system_code: 'respiratory', topic_name: 'Pulmonary Hypertension', category: 'Vascular', is_high_yield: false },
  { system_code: 'respiratory', topic_name: 'Cough (Chronic)', category: 'Clinical Presentations', is_high_yield: false },
  { system_code: 'respiratory', topic_name: 'Dyspnea', category: 'Clinical Presentations', is_high_yield: false },
  { system_code: 'respiratory', topic_name: 'Hemoptysis', category: 'Clinical Presentations', is_high_yield: false },

  // ═══════════════════════════════════════════
  // GASTROINTESTINAL
  // ═══════════════════════════════════════════
  { system_code: 'gastrointestinal', topic_name: 'GI Bleed (Upper)', category: 'Bleeding', is_high_yield: true },
  { system_code: 'gastrointestinal', topic_name: 'GI Bleed (Lower)', category: 'Bleeding', is_high_yield: true },
  { system_code: 'gastrointestinal', topic_name: 'Acute Pancreatitis', category: 'Pancreas', is_high_yield: true },
  { system_code: 'gastrointestinal', topic_name: 'Chronic Pancreatitis', category: 'Pancreas', is_high_yield: false },
  { system_code: 'gastrointestinal', topic_name: 'Pancreatic Cancer', category: 'Pancreas', is_high_yield: false },
  { system_code: 'gastrointestinal', topic_name: 'Cirrhosis', category: 'Liver', is_high_yield: true },
  { system_code: 'gastrointestinal', topic_name: 'Spontaneous Bacterial Peritonitis', category: 'Liver', is_high_yield: true },
  { system_code: 'gastrointestinal', topic_name: 'Hepatic Encephalopathy', category: 'Liver', is_high_yield: true },
  { system_code: 'gastrointestinal', topic_name: 'Hepatitis B', category: 'Liver', is_high_yield: true },
  { system_code: 'gastrointestinal', topic_name: 'Hepatitis C', category: 'Liver', is_high_yield: true },
  { system_code: 'gastrointestinal', topic_name: 'Alcoholic Hepatitis', category: 'Liver', is_high_yield: false },
  { system_code: 'gastrointestinal', topic_name: 'Non-Alcoholic Fatty Liver Disease', category: 'Liver', is_high_yield: false },
  { system_code: 'gastrointestinal', topic_name: 'Hepatocellular Carcinoma', category: 'Liver', is_high_yield: false },
  { system_code: 'gastrointestinal', topic_name: 'Cholelithiasis', category: 'Biliary', is_high_yield: true },
  { system_code: 'gastrointestinal', topic_name: 'Cholecystitis', category: 'Biliary', is_high_yield: true },
  { system_code: 'gastrointestinal', topic_name: 'Choledocholithiasis', category: 'Biliary', is_high_yield: false },
  { system_code: 'gastrointestinal', topic_name: 'Cholangitis', category: 'Biliary', is_high_yield: true },
  { system_code: 'gastrointestinal', topic_name: 'GERD', category: 'Esophagus', is_high_yield: true },
  { system_code: 'gastrointestinal', topic_name: 'Esophageal Varices', category: 'Esophagus', is_high_yield: true },
  { system_code: 'gastrointestinal', topic_name: 'Barrett Esophagus', category: 'Esophagus', is_high_yield: false },
  { system_code: 'gastrointestinal', topic_name: 'Esophageal Cancer', category: 'Esophagus', is_high_yield: false },
  { system_code: 'gastrointestinal', topic_name: 'Achalasia', category: 'Esophagus', is_high_yield: false },
  { system_code: 'gastrointestinal', topic_name: 'Peptic Ulcer Disease', category: 'Stomach', is_high_yield: true },
  { system_code: 'gastrointestinal', topic_name: 'Gastric Cancer', category: 'Stomach', is_high_yield: false },
  { system_code: 'gastrointestinal', topic_name: 'Gastroparesis', category: 'Stomach', is_high_yield: false },
  { system_code: 'gastrointestinal', topic_name: 'Small Bowel Obstruction', category: 'Intestine', is_high_yield: true },
  { system_code: 'gastrointestinal', topic_name: 'Large Bowel Obstruction', category: 'Intestine', is_high_yield: false },
  { system_code: 'gastrointestinal', topic_name: 'Appendicitis', category: 'Intestine', is_high_yield: true },
  { system_code: 'gastrointestinal', topic_name: 'Diverticulitis', category: 'Intestine', is_high_yield: true },
  { system_code: 'gastrointestinal', topic_name: 'Inflammatory Bowel Disease (Crohn)', category: 'Intestine', is_high_yield: true },
  { system_code: 'gastrointestinal', topic_name: 'Inflammatory Bowel Disease (Ulcerative Colitis)', category: 'Intestine', is_high_yield: true },
  { system_code: 'gastrointestinal', topic_name: 'Irritable Bowel Syndrome', category: 'Intestine', is_high_yield: false },
  { system_code: 'gastrointestinal', topic_name: 'Celiac Disease', category: 'Intestine', is_high_yield: false },
  { system_code: 'gastrointestinal', topic_name: 'Colorectal Cancer', category: 'Neoplasms', is_high_yield: true },
  { system_code: 'gastrointestinal', topic_name: 'Colorectal Cancer Screening', category: 'Neoplasms', is_high_yield: true },
  { system_code: 'gastrointestinal', topic_name: 'Clostridioides difficile Infection', category: 'Infections', is_high_yield: true },
  { system_code: 'gastrointestinal', topic_name: 'Acute Mesenteric Ischemia', category: 'Vascular', is_high_yield: true },
  { system_code: 'gastrointestinal', topic_name: 'Ischemic Colitis', category: 'Vascular', is_high_yield: false },
  { system_code: 'gastrointestinal', topic_name: 'Abdominal Pain (Acute)', category: 'Clinical Presentations', is_high_yield: true },
  { system_code: 'gastrointestinal', topic_name: 'Diarrhea (Acute)', category: 'Clinical Presentations', is_high_yield: false },
  { system_code: 'gastrointestinal', topic_name: 'Diarrhea (Chronic)', category: 'Clinical Presentations', is_high_yield: false },
  { system_code: 'gastrointestinal', topic_name: 'Jaundice', category: 'Clinical Presentations', is_high_yield: false },

  // ═══════════════════════════════════════════
  // ENDOCRINE
  // ═══════════════════════════════════════════
  { system_code: 'endocrine', topic_name: 'Diabetic Ketoacidosis', category: 'Diabetes', is_high_yield: true },
  { system_code: 'endocrine', topic_name: 'Hyperosmolar Hyperglycemic State', category: 'Diabetes', is_high_yield: true },
  { system_code: 'endocrine', topic_name: 'Type 2 Diabetes Management', category: 'Diabetes', is_high_yield: true },
  { system_code: 'endocrine', topic_name: 'Type 1 Diabetes', category: 'Diabetes', is_high_yield: true },
  { system_code: 'endocrine', topic_name: 'Hypoglycemia', category: 'Diabetes', is_high_yield: true },
  { system_code: 'endocrine', topic_name: 'Diabetic Nephropathy', category: 'Diabetes Complications', is_high_yield: false },
  { system_code: 'endocrine', topic_name: 'Diabetic Neuropathy', category: 'Diabetes Complications', is_high_yield: false },
  { system_code: 'endocrine', topic_name: 'Diabetic Retinopathy', category: 'Diabetes Complications', is_high_yield: false },
  { system_code: 'endocrine', topic_name: 'Hypothyroidism', category: 'Thyroid', is_high_yield: true },
  { system_code: 'endocrine', topic_name: 'Hyperthyroidism', category: 'Thyroid', is_high_yield: true },
  { system_code: 'endocrine', topic_name: 'Thyroid Storm', category: 'Thyroid', is_high_yield: true },
  { system_code: 'endocrine', topic_name: 'Thyroid Nodule', category: 'Thyroid', is_high_yield: true },
  { system_code: 'endocrine', topic_name: 'Thyroid Cancer', category: 'Thyroid', is_high_yield: false },
  { system_code: 'endocrine', topic_name: 'Myxedema Coma', category: 'Thyroid', is_high_yield: false },
  { system_code: 'endocrine', topic_name: 'Hypercalcemia', category: 'Calcium/Parathyroid', is_high_yield: true },
  { system_code: 'endocrine', topic_name: 'Hypocalcemia', category: 'Calcium/Parathyroid', is_high_yield: false },
  { system_code: 'endocrine', topic_name: 'Primary Hyperparathyroidism', category: 'Calcium/Parathyroid', is_high_yield: true },
  { system_code: 'endocrine', topic_name: 'Adrenal Insufficiency', category: 'Adrenal', is_high_yield: true },
  { system_code: 'endocrine', topic_name: 'Cushing Syndrome', category: 'Adrenal', is_high_yield: true },
  { system_code: 'endocrine', topic_name: 'Pheochromocytoma', category: 'Adrenal', is_high_yield: true },
  { system_code: 'endocrine', topic_name: 'Primary Aldosteronism', category: 'Adrenal', is_high_yield: false },
  { system_code: 'endocrine', topic_name: 'Adrenal Crisis', category: 'Adrenal', is_high_yield: true },
  { system_code: 'endocrine', topic_name: 'Pituitary Adenoma', category: 'Pituitary', is_high_yield: false },
  { system_code: 'endocrine', topic_name: 'Hypopituitarism', category: 'Pituitary', is_high_yield: false },
  { system_code: 'endocrine', topic_name: 'Diabetes Insipidus', category: 'Pituitary', is_high_yield: true },
  { system_code: 'endocrine', topic_name: 'SIADH', category: 'Pituitary', is_high_yield: true },
  { system_code: 'endocrine', topic_name: 'Metabolic Syndrome', category: 'Metabolic', is_high_yield: false },
  { system_code: 'endocrine', topic_name: 'Osteoporosis', category: 'Bone', is_high_yield: true },
  { system_code: 'endocrine', topic_name: 'Dyslipidemia', category: 'Metabolic', is_high_yield: true },

  // ═══════════════════════════════════════════
  // RENAL, URINARY & MALE REPRODUCTIVE
  // ═══════════════════════════════════════════
  { system_code: 'renal_urinary_reproductive', topic_name: 'Acute Kidney Injury', category: 'Renal', is_high_yield: true },
  { system_code: 'renal_urinary_reproductive', topic_name: 'Chronic Kidney Disease', category: 'Renal', is_high_yield: true },
  { system_code: 'renal_urinary_reproductive', topic_name: 'Nephrotic Syndrome', category: 'Renal', is_high_yield: true },
  { system_code: 'renal_urinary_reproductive', topic_name: 'Nephritic Syndrome', category: 'Renal', is_high_yield: true },
  { system_code: 'renal_urinary_reproductive', topic_name: 'Urinary Tract Infection', category: 'Urinary', is_high_yield: true },
  { system_code: 'renal_urinary_reproductive', topic_name: 'Pyelonephritis', category: 'Urinary', is_high_yield: true },
  { system_code: 'renal_urinary_reproductive', topic_name: 'Nephrolithiasis', category: 'Urinary', is_high_yield: true },
  { system_code: 'renal_urinary_reproductive', topic_name: 'Hyperkalemia', category: 'Electrolytes', is_high_yield: true },
  { system_code: 'renal_urinary_reproductive', topic_name: 'Hypokalemia', category: 'Electrolytes', is_high_yield: true },
  { system_code: 'renal_urinary_reproductive', topic_name: 'Hypernatremia', category: 'Electrolytes', is_high_yield: true },
  { system_code: 'renal_urinary_reproductive', topic_name: 'Hyponatremia', category: 'Electrolytes', is_high_yield: true },
  { system_code: 'renal_urinary_reproductive', topic_name: 'Metabolic Acidosis', category: 'Acid-Base', is_high_yield: true },
  { system_code: 'renal_urinary_reproductive', topic_name: 'Metabolic Alkalosis', category: 'Acid-Base', is_high_yield: false },
  { system_code: 'renal_urinary_reproductive', topic_name: 'Respiratory Acidosis', category: 'Acid-Base', is_high_yield: false },
  { system_code: 'renal_urinary_reproductive', topic_name: 'Respiratory Alkalosis', category: 'Acid-Base', is_high_yield: false },
  { system_code: 'renal_urinary_reproductive', topic_name: 'Renal Artery Stenosis', category: 'Renal', is_high_yield: false },
  { system_code: 'renal_urinary_reproductive', topic_name: 'Polycystic Kidney Disease', category: 'Renal', is_high_yield: false },
  { system_code: 'renal_urinary_reproductive', topic_name: 'Benign Prostatic Hyperplasia', category: 'Male Reproductive', is_high_yield: false },
  { system_code: 'renal_urinary_reproductive', topic_name: 'Prostate Cancer', category: 'Male Reproductive', is_high_yield: false },
  { system_code: 'renal_urinary_reproductive', topic_name: 'Testicular Torsion', category: 'Male Reproductive', is_high_yield: true },
  { system_code: 'renal_urinary_reproductive', topic_name: 'Testicular Cancer', category: 'Male Reproductive', is_high_yield: false },
  { system_code: 'renal_urinary_reproductive', topic_name: 'Bladder Cancer', category: 'Urinary', is_high_yield: false },
  { system_code: 'renal_urinary_reproductive', topic_name: 'Renal Cell Carcinoma', category: 'Renal', is_high_yield: false },
  { system_code: 'renal_urinary_reproductive', topic_name: 'Urinary Incontinence', category: 'Urinary', is_high_yield: false },

  // ═══════════════════════════════════════════
  // NERVOUS SYSTEM & SPECIAL SENSES
  // ═══════════════════════════════════════════
  { system_code: 'nervous_system', topic_name: 'Stroke (Ischemic)', category: 'Cerebrovascular', is_high_yield: true },
  { system_code: 'nervous_system', topic_name: 'Stroke (Hemorrhagic)', category: 'Cerebrovascular', is_high_yield: true },
  { system_code: 'nervous_system', topic_name: 'Transient Ischemic Attack', category: 'Cerebrovascular', is_high_yield: true },
  { system_code: 'nervous_system', topic_name: 'Subarachnoid Hemorrhage', category: 'Cerebrovascular', is_high_yield: true },
  { system_code: 'nervous_system', topic_name: 'Meningitis (Bacterial)', category: 'Infections', is_high_yield: true },
  { system_code: 'nervous_system', topic_name: 'Meningitis (Viral)', category: 'Infections', is_high_yield: false },
  { system_code: 'nervous_system', topic_name: 'Encephalitis', category: 'Infections', is_high_yield: false },
  { system_code: 'nervous_system', topic_name: 'Brain Abscess', category: 'Infections', is_high_yield: false },
  { system_code: 'nervous_system', topic_name: 'Seizures / Epilepsy', category: 'Seizures', is_high_yield: true },
  { system_code: 'nervous_system', topic_name: 'Status Epilepticus', category: 'Seizures', is_high_yield: true },
  { system_code: 'nervous_system', topic_name: 'Headache (Migraine)', category: 'Headache', is_high_yield: true },
  { system_code: 'nervous_system', topic_name: 'Headache (Tension)', category: 'Headache', is_high_yield: false },
  { system_code: 'nervous_system', topic_name: 'Headache (Cluster)', category: 'Headache', is_high_yield: false },
  { system_code: 'nervous_system', topic_name: 'Increased Intracranial Pressure', category: 'Emergencies', is_high_yield: true },
  { system_code: 'nervous_system', topic_name: 'Epidural Hematoma', category: 'Trauma', is_high_yield: true },
  { system_code: 'nervous_system', topic_name: 'Subdural Hematoma', category: 'Trauma', is_high_yield: true },
  { system_code: 'nervous_system', topic_name: 'Concussion / Traumatic Brain Injury', category: 'Trauma', is_high_yield: false },
  { system_code: 'nervous_system', topic_name: 'Multiple Sclerosis', category: 'Demyelinating', is_high_yield: true },
  { system_code: 'nervous_system', topic_name: 'Guillain-Barré Syndrome', category: 'Peripheral Neuropathy', is_high_yield: true },
  { system_code: 'nervous_system', topic_name: 'Myasthenia Gravis', category: 'Neuromuscular', is_high_yield: true },
  { system_code: 'nervous_system', topic_name: 'Parkinson Disease', category: 'Degenerative', is_high_yield: true },
  { system_code: 'nervous_system', topic_name: 'Alzheimer Disease', category: 'Degenerative', is_high_yield: false },
  { system_code: 'nervous_system', topic_name: 'Delirium', category: 'Altered Mental Status', is_high_yield: true },
  { system_code: 'nervous_system', topic_name: 'Normal Pressure Hydrocephalus', category: 'Degenerative', is_high_yield: false },
  { system_code: 'nervous_system', topic_name: 'Spinal Cord Compression', category: 'Emergencies', is_high_yield: true },
  { system_code: 'nervous_system', topic_name: 'Cauda Equina Syndrome', category: 'Emergencies', is_high_yield: true },
  { system_code: 'nervous_system', topic_name: 'Bell Palsy', category: 'Cranial Nerves', is_high_yield: false },
  { system_code: 'nervous_system', topic_name: 'Trigeminal Neuralgia', category: 'Cranial Nerves', is_high_yield: false },
  { system_code: 'nervous_system', topic_name: 'Brain Tumors', category: 'Neoplasms', is_high_yield: false },
  { system_code: 'nervous_system', topic_name: 'Vertigo (Peripheral vs Central)', category: 'Special Senses', is_high_yield: true },
  { system_code: 'nervous_system', topic_name: 'Hearing Loss', category: 'Special Senses', is_high_yield: false },
  { system_code: 'nervous_system', topic_name: 'Glaucoma', category: 'Special Senses', is_high_yield: false },
  { system_code: 'nervous_system', topic_name: 'Retinal Detachment', category: 'Special Senses', is_high_yield: false },

  // ═══════════════════════════════════════════
  // BLOOD & LYMPHORETICULAR
  // ═══════════════════════════════════════════
  { system_code: 'blood_lymph', topic_name: 'Iron Deficiency Anemia', category: 'Anemia', is_high_yield: true },
  { system_code: 'blood_lymph', topic_name: 'Anemia of Chronic Disease', category: 'Anemia', is_high_yield: false },
  { system_code: 'blood_lymph', topic_name: 'Vitamin B12 Deficiency', category: 'Anemia', is_high_yield: true },
  { system_code: 'blood_lymph', topic_name: 'Folate Deficiency', category: 'Anemia', is_high_yield: false },
  { system_code: 'blood_lymph', topic_name: 'Sickle Cell Disease', category: 'Hemoglobinopathy', is_high_yield: true },
  { system_code: 'blood_lymph', topic_name: 'Thalassemia', category: 'Hemoglobinopathy', is_high_yield: false },
  { system_code: 'blood_lymph', topic_name: 'Hemolytic Anemia', category: 'Anemia', is_high_yield: true },
  { system_code: 'blood_lymph', topic_name: 'G6PD Deficiency', category: 'Anemia', is_high_yield: false },
  { system_code: 'blood_lymph', topic_name: 'Thrombocytopenia', category: 'Platelets', is_high_yield: true },
  { system_code: 'blood_lymph', topic_name: 'Immune Thrombocytopenic Purpura (ITP)', category: 'Platelets', is_high_yield: true },
  { system_code: 'blood_lymph', topic_name: 'Thrombotic Thrombocytopenic Purpura (TTP)', category: 'Platelets', is_high_yield: true },
  { system_code: 'blood_lymph', topic_name: 'Heparin-Induced Thrombocytopenia', category: 'Platelets', is_high_yield: true },
  { system_code: 'blood_lymph', topic_name: 'Disseminated Intravascular Coagulation', category: 'Coagulation', is_high_yield: true },
  { system_code: 'blood_lymph', topic_name: 'Hemophilia', category: 'Coagulation', is_high_yield: false },
  { system_code: 'blood_lymph', topic_name: 'Von Willebrand Disease', category: 'Coagulation', is_high_yield: false },
  { system_code: 'blood_lymph', topic_name: 'Deep Vein Thrombosis / PE (Coagulation)', category: 'Coagulation', is_high_yield: true },
  { system_code: 'blood_lymph', topic_name: 'Anticoagulation Management', category: 'Coagulation', is_high_yield: true },
  { system_code: 'blood_lymph', topic_name: 'Lymphoma', category: 'Neoplasms', is_high_yield: true },
  { system_code: 'blood_lymph', topic_name: 'Leukemia (Acute)', category: 'Neoplasms', is_high_yield: true },
  { system_code: 'blood_lymph', topic_name: 'Leukemia (Chronic)', category: 'Neoplasms', is_high_yield: false },
  { system_code: 'blood_lymph', topic_name: 'Multiple Myeloma', category: 'Neoplasms', is_high_yield: true },
  { system_code: 'blood_lymph', topic_name: 'Transfusion Reactions', category: 'Transfusion', is_high_yield: true },
  { system_code: 'blood_lymph', topic_name: 'Blood Product Selection', category: 'Transfusion', is_high_yield: false },

  // ═══════════════════════════════════════════
  // MULTISYSTEM PROCESSES & DISORDERS
  // ═══════════════════════════════════════════
  { system_code: 'multisystem', topic_name: 'Sepsis', category: 'Critical Care', is_high_yield: true },
  { system_code: 'multisystem', topic_name: 'Septic Shock', category: 'Critical Care', is_high_yield: true },
  { system_code: 'multisystem', topic_name: 'Anaphylaxis', category: 'Emergencies', is_high_yield: true },
  { system_code: 'multisystem', topic_name: 'Systemic Lupus Erythematosus', category: 'Autoimmune', is_high_yield: true },
  { system_code: 'multisystem', topic_name: 'Rheumatoid Arthritis', category: 'Autoimmune', is_high_yield: true },
  { system_code: 'multisystem', topic_name: 'Vasculitis', category: 'Autoimmune', is_high_yield: false },
  { system_code: 'multisystem', topic_name: 'Scleroderma', category: 'Autoimmune', is_high_yield: false },
  { system_code: 'multisystem', topic_name: 'HIV/AIDS', category: 'Infections', is_high_yield: true },
  { system_code: 'multisystem', topic_name: 'COVID-19', category: 'Infections', is_high_yield: false },
  { system_code: 'multisystem', topic_name: 'Sexually Transmitted Infections', category: 'Infections', is_high_yield: true },
  { system_code: 'multisystem', topic_name: 'Cellulitis / Skin Infections', category: 'Infections', is_high_yield: true },
  { system_code: 'multisystem', topic_name: 'Osteomyelitis', category: 'Infections', is_high_yield: false },
  { system_code: 'multisystem', topic_name: 'Fever of Unknown Origin', category: 'Clinical Presentations', is_high_yield: false },
  { system_code: 'multisystem', topic_name: 'Drug Overdose / Toxicology', category: 'Toxicology', is_high_yield: true },
  { system_code: 'multisystem', topic_name: 'Alcohol Withdrawal', category: 'Toxicology', is_high_yield: true },
  { system_code: 'multisystem', topic_name: 'Opioid Overdose', category: 'Toxicology', is_high_yield: true },
  { system_code: 'multisystem', topic_name: 'Acetaminophen Toxicity', category: 'Toxicology', is_high_yield: true },
  { system_code: 'multisystem', topic_name: 'Burns', category: 'Trauma', is_high_yield: false },
  { system_code: 'multisystem', topic_name: 'Hypothermia', category: 'Environmental', is_high_yield: false },
  { system_code: 'multisystem', topic_name: 'Heat Stroke', category: 'Environmental', is_high_yield: false },
  { system_code: 'multisystem', topic_name: 'Amyloidosis', category: 'Systemic', is_high_yield: false },

  // ═══════════════════════════════════════════
  // IMMUNE SYSTEM
  // ═══════════════════════════════════════════
  { system_code: 'immune', topic_name: 'Allergic Rhinitis', category: 'Allergy', is_high_yield: false },
  { system_code: 'immune', topic_name: 'Drug Allergies', category: 'Allergy', is_high_yield: true },
  { system_code: 'immune', topic_name: 'Food Allergies', category: 'Allergy', is_high_yield: false },
  { system_code: 'immune', topic_name: 'Immunodeficiency Disorders', category: 'Immunodeficiency', is_high_yield: false },
  { system_code: 'immune', topic_name: 'Transplant Rejection', category: 'Transplant', is_high_yield: false },
  { system_code: 'immune', topic_name: 'Immunosuppressive Therapy', category: 'Transplant', is_high_yield: false },
  { system_code: 'immune', topic_name: 'Hypersensitivity Reactions', category: 'Allergy', is_high_yield: true },
  { system_code: 'immune', topic_name: 'Angioedema', category: 'Allergy', is_high_yield: false },

  // ═══════════════════════════════════════════
  // MUSCULOSKELETAL & CONNECTIVE TISSUE
  // ═══════════════════════════════════════════
  { system_code: 'musculoskeletal', topic_name: 'Osteoarthritis', category: 'Joint Disease', is_high_yield: true },
  { system_code: 'musculoskeletal', topic_name: 'Gout', category: 'Joint Disease', is_high_yield: true },
  { system_code: 'musculoskeletal', topic_name: 'Pseudogout', category: 'Joint Disease', is_high_yield: false },
  { system_code: 'musculoskeletal', topic_name: 'Septic Arthritis', category: 'Joint Disease', is_high_yield: true },
  { system_code: 'musculoskeletal', topic_name: 'Compartment Syndrome', category: 'Emergencies', is_high_yield: true },
  { system_code: 'musculoskeletal', topic_name: 'Low Back Pain', category: 'Spine', is_high_yield: true },
  { system_code: 'musculoskeletal', topic_name: 'Fractures (Hip)', category: 'Fractures', is_high_yield: true },
  { system_code: 'musculoskeletal', topic_name: 'Fractures (General)', category: 'Fractures', is_high_yield: false },
  { system_code: 'musculoskeletal', topic_name: 'Soft Tissue Injuries', category: 'Musculoskeletal', is_high_yield: false },
  { system_code: 'musculoskeletal', topic_name: 'Melanoma', category: 'Skin', is_high_yield: true },
  { system_code: 'musculoskeletal', topic_name: 'Basal Cell Carcinoma', category: 'Skin', is_high_yield: false },
  { system_code: 'musculoskeletal', topic_name: 'Squamous Cell Carcinoma (Skin)', category: 'Skin', is_high_yield: false },
  { system_code: 'musculoskeletal', topic_name: 'Psoriasis', category: 'Skin', is_high_yield: false },
  { system_code: 'musculoskeletal', topic_name: 'Dermatitis', category: 'Skin', is_high_yield: false },
  { system_code: 'musculoskeletal', topic_name: 'Pressure Ulcers', category: 'Skin', is_high_yield: false },

  // ═══════════════════════════════════════════
  // PREGNANCY, CHILDBIRTH & PUERPERIUM
  // ═══════════════════════════════════════════
  { system_code: 'pregnancy', topic_name: 'Preeclampsia', category: 'Hypertensive Disorders', is_high_yield: true },
  { system_code: 'pregnancy', topic_name: 'Eclampsia', category: 'Hypertensive Disorders', is_high_yield: true },
  { system_code: 'pregnancy', topic_name: 'Gestational Diabetes', category: 'Medical Complications', is_high_yield: true },
  { system_code: 'pregnancy', topic_name: 'Ectopic Pregnancy', category: 'Early Pregnancy', is_high_yield: true },
  { system_code: 'pregnancy', topic_name: 'Spontaneous Abortion', category: 'Early Pregnancy', is_high_yield: true },
  { system_code: 'pregnancy', topic_name: 'Placenta Previa', category: 'Placental Disorders', is_high_yield: true },
  { system_code: 'pregnancy', topic_name: 'Placental Abruption', category: 'Placental Disorders', is_high_yield: true },
  { system_code: 'pregnancy', topic_name: 'Postpartum Hemorrhage', category: 'Postpartum', is_high_yield: true },
  { system_code: 'pregnancy', topic_name: 'Postpartum Depression', category: 'Postpartum', is_high_yield: true },
  { system_code: 'pregnancy', topic_name: 'Normal Labor and Delivery', category: 'Labor', is_high_yield: true },
  { system_code: 'pregnancy', topic_name: 'Preterm Labor', category: 'Labor', is_high_yield: true },
  { system_code: 'pregnancy', topic_name: 'Premature Rupture of Membranes', category: 'Labor', is_high_yield: true },
  { system_code: 'pregnancy', topic_name: 'Fetal Heart Rate Monitoring', category: 'Labor', is_high_yield: true },
  { system_code: 'pregnancy', topic_name: 'Prenatal Care', category: 'Preventive', is_high_yield: true },
  { system_code: 'pregnancy', topic_name: 'HELLP Syndrome', category: 'Hypertensive Disorders', is_high_yield: true },
  { system_code: 'pregnancy', topic_name: 'Rh Isoimmunization', category: 'Medical Complications', is_high_yield: false },
  { system_code: 'pregnancy', topic_name: 'Gestational Trophoblastic Disease', category: 'Early Pregnancy', is_high_yield: false },
  { system_code: 'pregnancy', topic_name: 'Mastitis', category: 'Postpartum', is_high_yield: false },
  { system_code: 'pregnancy', topic_name: 'Cesarean Delivery Indications', category: 'Labor', is_high_yield: false },
  { system_code: 'pregnancy', topic_name: 'Shoulder Dystocia', category: 'Labor', is_high_yield: false },

  // ═══════════════════════════════════════════
  // BIOSTATISTICS & EPIDEMIOLOGY
  // ═══════════════════════════════════════════
  { system_code: 'biostatistics', topic_name: 'Sensitivity and Specificity', category: 'Test Characteristics', is_high_yield: true },
  { system_code: 'biostatistics', topic_name: 'Positive and Negative Predictive Value', category: 'Test Characteristics', is_high_yield: true },
  { system_code: 'biostatistics', topic_name: 'Likelihood Ratios', category: 'Test Characteristics', is_high_yield: false },
  { system_code: 'biostatistics', topic_name: 'Number Needed to Treat / Harm', category: 'Treatment Effects', is_high_yield: true },
  { system_code: 'biostatistics', topic_name: 'Relative Risk vs Odds Ratio', category: 'Study Design', is_high_yield: true },
  { system_code: 'biostatistics', topic_name: 'Absolute Risk Reduction', category: 'Treatment Effects', is_high_yield: true },
  { system_code: 'biostatistics', topic_name: 'Study Design Types', category: 'Study Design', is_high_yield: true },
  { system_code: 'biostatistics', topic_name: 'Bias Types', category: 'Study Design', is_high_yield: true },
  { system_code: 'biostatistics', topic_name: 'Confounding', category: 'Study Design', is_high_yield: true },
  { system_code: 'biostatistics', topic_name: 'Statistical Significance (p-value)', category: 'Statistics', is_high_yield: true },
  { system_code: 'biostatistics', topic_name: 'Confidence Intervals', category: 'Statistics', is_high_yield: false },
  { system_code: 'biostatistics', topic_name: 'Screening Guidelines', category: 'Epidemiology', is_high_yield: true },
  { system_code: 'biostatistics', topic_name: 'Incidence vs Prevalence', category: 'Epidemiology', is_high_yield: true },
  { system_code: 'biostatistics', topic_name: 'Intention to Treat Analysis', category: 'Study Design', is_high_yield: false },
  { system_code: 'biostatistics', topic_name: 'Meta-Analysis', category: 'Study Design', is_high_yield: false },

  // ═══════════════════════════════════════════
  // SOCIAL SCIENCES
  // ═══════════════════════════════════════════
  { system_code: 'social_sciences', topic_name: 'Informed Consent', category: 'Ethics', is_high_yield: true },
  { system_code: 'social_sciences', topic_name: 'Capacity and Competence', category: 'Ethics', is_high_yield: true },
  { system_code: 'social_sciences', topic_name: 'Advance Directives', category: 'Ethics', is_high_yield: true },
  { system_code: 'social_sciences', topic_name: 'End-of-Life Care / Palliative Care', category: 'Ethics', is_high_yield: true },
  { system_code: 'social_sciences', topic_name: 'Confidentiality and HIPAA', category: 'Ethics', is_high_yield: true },
  { system_code: 'social_sciences', topic_name: 'Minors and Consent', category: 'Ethics', is_high_yield: true },
  { system_code: 'social_sciences', topic_name: 'Reportable Conditions', category: 'Legal', is_high_yield: true },
  { system_code: 'social_sciences', topic_name: 'Child Abuse and Neglect', category: 'Legal', is_high_yield: true },
  { system_code: 'social_sciences', topic_name: 'Elder Abuse', category: 'Legal', is_high_yield: false },
  { system_code: 'social_sciences', topic_name: 'Intimate Partner Violence', category: 'Legal', is_high_yield: true },
  { system_code: 'social_sciences', topic_name: 'Medical Error Disclosure', category: 'Patient Safety', is_high_yield: true },
  { system_code: 'social_sciences', topic_name: 'Quality Improvement', category: 'Patient Safety', is_high_yield: false },
  { system_code: 'social_sciences', topic_name: 'Breaking Bad News', category: 'Communication', is_high_yield: true },
  { system_code: 'social_sciences', topic_name: 'Motivational Interviewing', category: 'Communication', is_high_yield: false },
  { system_code: 'social_sciences', topic_name: 'Cultural Competency', category: 'Communication', is_high_yield: false },
  { system_code: 'social_sciences', topic_name: 'Health Disparities', category: 'Population Health', is_high_yield: false },
  { system_code: 'social_sciences', topic_name: 'Social Determinants of Health', category: 'Population Health', is_high_yield: false },
  { system_code: 'social_sciences', topic_name: 'Disability Determination', category: 'Legal', is_high_yield: false },

  // ═══════════════════════════════════════════
  // MULTISYSTEM — formerly General Principles (pharmacology, cross-system)
  // ═══════════════════════════════════════════
  { system_code: 'multisystem', topic_name: 'Pharmacokinetics', category: 'Pharmacology', is_high_yield: false },
  { system_code: 'multisystem', topic_name: 'Pharmacodynamics', category: 'Pharmacology', is_high_yield: false },
  { system_code: 'multisystem', topic_name: 'Drug-Drug Interactions', category: 'Pharmacology', is_high_yield: true },
  { system_code: 'multisystem', topic_name: 'Adverse Drug Reactions', category: 'Pharmacology', is_high_yield: true },
  { system_code: 'multisystem', topic_name: 'Pain Management', category: 'General', is_high_yield: true },
  { system_code: 'multisystem', topic_name: 'Wound Healing', category: 'General', is_high_yield: false },
  { system_code: 'multisystem', topic_name: 'Inflammation', category: 'General', is_high_yield: false },
  { system_code: 'multisystem', topic_name: 'Neoplasia (General Principles)', category: 'General', is_high_yield: false },
  { system_code: 'human_development', topic_name: 'Genetic Disorders', category: 'Genetics', is_high_yield: false },
  { system_code: 'immune', topic_name: 'Immunology Basics', category: 'Immunology', is_high_yield: false },

  // ═══════════════════════════════════════════
  // GASTROINTESTINAL — formerly Nutritional & Digestive (nutrition topics)
  // ═══════════════════════════════════════════
  { system_code: 'gastrointestinal', topic_name: 'Malnutrition', category: 'Nutrition', is_high_yield: false },
  { system_code: 'gastrointestinal', topic_name: 'Vitamin Deficiencies', category: 'Nutrition', is_high_yield: true },
  { system_code: 'gastrointestinal', topic_name: 'Obesity Management', category: 'Nutrition', is_high_yield: true },
  { system_code: 'behavioral_health', topic_name: 'Eating Disorders', category: 'Behavioral', is_high_yield: false },
  { system_code: 'gastrointestinal', topic_name: 'Refeeding Syndrome', category: 'Nutrition', is_high_yield: false },
  { system_code: 'gastrointestinal', topic_name: 'Enteral and Parenteral Nutrition', category: 'Nutrition', is_high_yield: false },

  // ═══════════════════════════════════════════
  // HUMAN DEVELOPMENT (new Jan 2026)
  // ═══════════════════════════════════════════
  { system_code: 'human_development', topic_name: 'Growth & Development Milestones', category: 'Development', is_high_yield: true },
  { system_code: 'human_development', topic_name: 'Congenital Anomalies', category: 'Congenital', is_high_yield: false },
  { system_code: 'human_development', topic_name: 'Fetal Development', category: 'Embryology', is_high_yield: false },
  { system_code: 'human_development', topic_name: 'Developmental Delay', category: 'Development', is_high_yield: true },
  { system_code: 'human_development', topic_name: 'Chromosomal Abnormalities', category: 'Genetics', is_high_yield: true },

  // ═══════════════════════════════════════════
  // BEHAVIORAL HEALTH (new Jan 2026)
  // ═══════════════════════════════════════════
  { system_code: 'behavioral_health', topic_name: 'Major Depressive Disorder', category: 'Mood Disorders', is_high_yield: true },
  { system_code: 'behavioral_health', topic_name: 'Bipolar Disorder', category: 'Mood Disorders', is_high_yield: true },
  { system_code: 'behavioral_health', topic_name: 'Generalized Anxiety Disorder', category: 'Anxiety Disorders', is_high_yield: true },
  { system_code: 'behavioral_health', topic_name: 'Panic Disorder', category: 'Anxiety Disorders', is_high_yield: false },
  { system_code: 'behavioral_health', topic_name: 'Obsessive-Compulsive Disorder', category: 'Anxiety Disorders', is_high_yield: false },
  { system_code: 'behavioral_health', topic_name: 'Post-Traumatic Stress Disorder', category: 'Trauma-Related', is_high_yield: true },
  { system_code: 'behavioral_health', topic_name: 'Schizophrenia', category: 'Psychotic Disorders', is_high_yield: true },
  { system_code: 'behavioral_health', topic_name: 'Substance Use Disorders', category: 'Substance Use', is_high_yield: true },
  { system_code: 'behavioral_health', topic_name: 'Personality Disorders', category: 'Personality', is_high_yield: false },
  { system_code: 'behavioral_health', topic_name: 'Somatic Symptom Disorder', category: 'Somatic', is_high_yield: false },
  { system_code: 'behavioral_health', topic_name: 'Attention-Deficit/Hyperactivity Disorder', category: 'Neurodevelopmental', is_high_yield: true },
  { system_code: 'behavioral_health', topic_name: 'Autism Spectrum Disorder', category: 'Neurodevelopmental', is_high_yield: false },
  { system_code: 'behavioral_health', topic_name: 'Adjustment Disorder', category: 'Trauma-Related', is_high_yield: false },
  { system_code: 'behavioral_health', topic_name: 'Suicidal Ideation Assessment', category: 'Emergencies', is_high_yield: true },
];
