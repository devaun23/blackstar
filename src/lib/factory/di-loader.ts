// ─── Review Source Loader ───
// Retrieves board review evidence items (Divine Intervention, Inner Circle, etc.)
// for agent consumption. Queries the di_evidence_item table across all sources.
// Agents receive review items as a supplemental context block alongside guideline source packs.

import { createAdminClient } from '@/lib/supabase/admin';
import type { DIEvidenceItemRow, DIItemType, ReviewSource } from '@/lib/di/types';

interface DILoaderOptions {
  /** Filter by item type(s). If omitted, returns all types. */
  itemTypes?: DIItemType[];
  /** Maximum items to return. Defaults to 50. */
  maxItems?: number;
  /** Filter by specific review source(s). If omitted, returns from all sources. */
  sources?: ReviewSource[];
  /** Filter by shelf (e.g., 'psychiatry', 'medicine'). If omitted, returns from all shelves. */
  shelf?: string;
}

function formatItem(item: Pick<DIEvidenceItemRow, 'display_id' | 'item_type' | 'claim'>): string {
  const typeLabel = item.item_type.replace(/_/g, ' ');
  return `[${item.display_id}] (${typeLabel}) ${item.claim}`;
}

/**
 * Resolve board review context for a topic, formatted for agent consumption.
 * Pulls from all review sources (DI + IC) by default.
 * Returns empty string if no relevant content exists (graceful degradation).
 */
export async function resolveDIContext(
  topic: string,
  options?: DILoaderOptions,
): Promise<string> {
  const maxItems = options?.maxItems ?? 50;
  const supabase = createAdminClient();

  let query = supabase
    .from('di_evidence_item')
    .select('display_id, item_type, claim, section_heading, source')
    .contains('topic_tags', [topic])
    .order('display_id')
    .limit(maxItems);

  if (options?.itemTypes && options.itemTypes.length > 0) {
    query = query.in('item_type', options.itemTypes);
  }

  if (options?.sources && options.sources.length > 0) {
    query = query.in('source', options.sources);
  }

  if (options?.shelf) {
    query = query.eq('shelf', options.shelf);
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    return '';
  }

  type ResultItem = Pick<DIEvidenceItemRow, 'display_id' | 'item_type' | 'claim' | 'section_heading' | 'source'>;
  const items = data as ResultItem[];

  // Group by source then section heading for readability
  const bySource = new Map<string, Map<string, ResultItem[]>>();
  for (const item of items) {
    const src = item.source;
    if (!bySource.has(src)) bySource.set(src, new Map());
    const sections = bySource.get(src)!;
    const heading = item.section_heading;
    if (!sections.has(heading)) sections.set(heading, []);
    sections.get(heading)!.push(item);
  }

  const sourceLabels: Record<string, string> = {
    divine_intervention: 'Divine Intervention Podcast Notes',
    inner_circle: 'UWorld Inner Circle Notes',
    amboss: 'AMBOSS Step 2 CK Notes',
    emma_holliday: 'Emma Holliday Review Notes',
  };

  const lines: string[] = [];
  lines.push('═══ BOARD REVIEW REFERENCE ═══');

  for (const [source, sections] of bySource) {
    const label = sourceLabels[source] ?? source;
    lines.push('');
    lines.push(`── ${label} ──`);

    for (const [heading, sectionItems] of sections) {
      lines.push(`  [${heading}]`);
      for (const item of sectionItems) {
        lines.push(`  ${formatItem(item)}`);
      }
    }
  }

  return lines.join('\n');
}
