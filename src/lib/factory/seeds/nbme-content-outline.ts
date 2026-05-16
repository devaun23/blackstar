/**
 * NBME Content Outline manifest (A4).
 *
 * The canonical map from Blackstar's `(shelf, system)` cell key to the
 * NBME Subject Examination Content Outline. Every blueprint_node must
 * map to a (shelf, system) listed here. The `item_planner` pre-flight
 * refuses to plan an item whose node's (shelf, system) isn't on the list.
 *
 * Source: USMLE Step 2 CK Content Outline (usmle.org) + per-shelf NBME
 * Subject Examination Content Outlines (nbme.org). Save the PDFs in
 * reference/nbme/ when adding new shelves.
 *
 * Adding a new system: confirm it's on the relevant outline PDF, add it
 * here with a citation comment, then proceed to seed blueprint_nodes for
 * the cells.
 */

import type { Shelf } from '@/lib/types/database';

export interface OutlineCell {
  shelf: Shelf;
  system: string;
  /** Source citation — the section of the outline that authorizes this system. */
  outline_section: string;
}

/**
 * Medicine shelf — NBME Internal Medicine Subject Examination Content Outline.
 * Citation: "Outline of the NBME Subject Examinations — Medicine,"
 *   sections "Systems" + "Multisystem / General Principles" + "Physician Task."
 */
const MEDICINE_OUTLINE: OutlineCell[] = [
  // Organ systems (NBME IM outline §1: Systems)
  { shelf: 'medicine', system: 'Cardiology',              outline_section: 'IM §1.1 Cardiovascular System' },
  { shelf: 'medicine', system: 'Pulmonary',               outline_section: 'IM §1.2 Respiratory System' },
  { shelf: 'medicine', system: 'Gastroenterology',        outline_section: 'IM §1.3 Gastrointestinal System' },
  { shelf: 'medicine', system: 'Hepatology',              outline_section: 'IM §1.3 Gastrointestinal System (hepatobiliary)' },
  { shelf: 'medicine', system: 'Nephrology',              outline_section: 'IM §1.4 Renal/Urinary System' },
  { shelf: 'medicine', system: 'Electrolytes/Acid-Base',  outline_section: 'IM §1.4 Renal/Urinary System (lyte/AB)' },
  { shelf: 'medicine', system: 'Endocrinology',           outline_section: 'IM §1.5 Endocrine System' },
  { shelf: 'medicine', system: 'Hematology/Oncology',     outline_section: 'IM §1.6 Blood & Lymphoreticular / Neoplasms' },
  { shelf: 'medicine', system: 'Infectious Disease',      outline_section: 'IM §1.7 Infectious Disease (cross-system)' },
  { shelf: 'medicine', system: 'Rheumatology',            outline_section: 'IM §1.8 Immune System / Connective Tissue' },
  { shelf: 'medicine', system: 'Neurology-within-IM',     outline_section: 'IM §1.9 Nervous System (relevant to IM)' },
  { shelf: 'medicine', system: 'Dermatology-within-IM',   outline_section: 'IM §1.10 Skin (systemic manifestations)' },
  { shelf: 'medicine', system: 'Toxicology-within-IM',    outline_section: 'IM §1.11 Poisoning & Adverse Effects' },
  { shelf: 'medicine', system: 'Critical Care/Shock',     outline_section: 'IM §1.12 Multisystem / Shock' },

  // Cross-cutting / Multisystem (NBME IM outline §2 "Physician Task" + §3 "Multisystem")
  { shelf: 'medicine', system: 'Preventive/Screening',          outline_section: 'IM §2 Health Maintenance / USPSTF' },
  { shelf: 'medicine', system: 'Geriatrics',                    outline_section: 'IM §3 Geriatric Care (multisystem)' },
  { shelf: 'medicine', system: 'Ethics & Communication',        outline_section: 'IM §2 Communication / Professional Issues' },
  { shelf: 'medicine', system: 'Patient Safety',                outline_section: 'IM §2 Patient Safety / Quality Improvement' },
  { shelf: 'medicine', system: 'Biostatistics & Epidemiology',  outline_section: 'IM §2 Biostatistics / Epidemiology / Population Health' },
];

/**
 * Add additional shelves here as Blackstar broadens beyond IM.
 * Each new shelf needs its own NBME Subject Examination outline citation.
 */
export const NBME_CONTENT_OUTLINE: OutlineCell[] = [
  ...MEDICINE_OUTLINE,
];

// Indexed for O(1) lookups in the planner pre-flight.
const _outlineIndex: Map<string, OutlineCell> = new Map(
  NBME_CONTENT_OUTLINE.map((cell) => [`${cell.shelf}|${cell.system}`, cell]),
);

export function isCellOnOutline(shelf: string, system: string): boolean {
  return _outlineIndex.has(`${shelf}|${system}`);
}

export function lookupOutlineCell(shelf: string, system: string): OutlineCell | null {
  return _outlineIndex.get(`${shelf}|${system}`) ?? null;
}

export function knownSystemsForShelf(shelf: Shelf): string[] {
  return NBME_CONTENT_OUTLINE.filter((c) => c.shelf === shelf).map((c) => c.system);
}
