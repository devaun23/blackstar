// NBME CCSS topic mapping
//
// The 15 CCSS items in docs/sources/nbme-ccss/section-1/ use kebab-case topics
// in their frontmatter. But the rest of the Blackstar factory (DI, IC, AMBOSS,
// Emma Holliday, blueprint_node.topic) uses Title Case with spaces
// (e.g. "Anaphylaxis", "Heart Failure"). This module bridges the two.
//
// Strategy:
//   1. Each CCSS item emits multiple topic_tags to maximize match opportunities:
//      - Title Case of the specific `topic` field (e.g., "Latent Tuberculosis")
//      - A hand-curated mapping to an existing blueprint_node topic when one exists
//        (e.g., latent-tuberculosis → "Tuberculosis")
//      - Title Case of the `system` field as a broad fallback (e.g., "Infectious Disease")
//   2. resolveDIContext() does `.contains('topic_tags', [topic])` — any match hits.
//
// Why multi-tag: blueprints may refer to the condition at different specificities.
// A blueprint for "Tuberculosis" should see the latent-TB NBME item; a future more-
// specific blueprint for "Latent Tuberculosis" should too.

/**
 * Hand-curated map from NBME CCSS kebab-case topic → Title Case tags that match
 * existing blueprint_node.topic values (as of 2026-04-22). Extend when more
 * blueprint nodes are added.
 *
 * Values are arrays so a single CCSS item can fan out to multiple blueprint
 * topics (e.g., SLE pericarditis → both "Pericarditis" and "SLE").
 */
const CCSS_TOPIC_TO_BLUEPRINT: Record<string, string[]> = {
  'latent-tuberculosis': ['Tuberculosis', 'Latent Tuberculosis'],
  'heart-failure-diagnosis': ['Heart Failure', 'CHF Exacerbation'],
  'anaphylaxis': ['Anaphylaxis'],
  'pericarditis-sle': ['Pericarditis', 'SLE'],
  'recurrent-uti-pregnancy': ['UTI/Pyelonephritis'],
  'hepatitis-a': ['Hepatitis A'],
  'progressive-supranuclear-palsy': ['Parkinson Disease', 'Progressive Supranuclear Palsy'],
  // Topics without current blueprint matches — still emit a Title Case variant
  // so future blueprints at matching names (or case-insensitive queries) will hit.
  'transient-synovitis': ['Transient Synovitis'],
  'testicular-torsion': ['Testicular Torsion'],
  'end-of-life-goals-of-care': ['End-of-Life Care', 'Goals of Care'],
  'ectopic-pregnancy': ['Ectopic Pregnancy'],
  'congenital-diaphragmatic-hernia': ['Congenital Diaphragmatic Hernia'],
  'infectious-mononucleosis': ['Infectious Mononucleosis'],
  'caudal-regression-syndrome': ['Caudal Regression Syndrome'],
  'osteomalacia-vitamin-d-deficiency': ['Osteomalacia', 'Vitamin D Deficiency'],
};

/**
 * System-level Title Case names. Emitted as a secondary topic_tag for each item
 * to support broad system-scoped queries.
 */
const SYSTEM_TO_TITLE: Record<string, string> = {
  'infectious-disease': 'Infectious Disease',
  musculoskeletal: 'Musculoskeletal',
  reproductive: 'Reproductive',
  pulmonary: 'Pulmonary',
  cardiovascular: 'Cardiovascular',
  neurology: 'Neurology',
  'allergy-immunology': 'Allergy/Immunology',
  endocrinology: 'Endocrinology',
  'gi-hepatology': 'GI/Hepatology',
  'renal-urinary': 'Renal/Urinary',
  'ethics-palliative': 'Ethics/Palliative',
};

/**
 * Fallback Title Case generator for topics not in the curated map.
 * "latent-tuberculosis" → "Latent Tuberculosis", "slefoo_bar" → "Slefoo Bar".
 */
function kebabToTitleCase(raw: string): string {
  return raw
    .trim()
    .replace(/[_-]+/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .map((w) => w[0]!.toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Build the topic_tags array for an NBME CCSS item from its frontmatter.
 * Emits (in order): curated blueprint-matching tags (if any), fallback Title Case
 * of the specific topic, Title Case system name. Duplicates removed.
 */
export function resolveNbmeTopicTags(frontmatter: {
  topic?: string | null;
  system?: string | null;
}): string[] {
  const tags = new Set<string>();

  if (frontmatter.topic) {
    const normalized = frontmatter.topic.trim().toLowerCase();
    const curated = CCSS_TOPIC_TO_BLUEPRINT[normalized];
    if (curated) {
      for (const t of curated) tags.add(t);
    } else {
      // Fallback — no hand-curated mapping exists for this kebab topic.
      tags.add(kebabToTitleCase(normalized));
    }
  }

  if (frontmatter.system) {
    const normalized = frontmatter.system.trim().toLowerCase();
    const mapped = SYSTEM_TO_TITLE[normalized];
    tags.add(mapped ?? kebabToTitleCase(normalized));
  }

  return [...tags].filter((t) => t.length > 0);
}
