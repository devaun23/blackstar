/**
 * Ingest NBME CCSS items into Supabase.
 *
 * Parses markdown files from docs/sources/nbme-ccss/section-N/ → extracts typed
 * evidence items → upserts into di_episode + di_evidence_item tables with
 * source = 'nbme'.
 *
 * Idempotent: safe to re-run. Uses ON CONFLICT on (source, episode_number) for
 * episodes and display_id for evidence items.
 *
 * Usage:
 *   npx tsx scripts/ingest-nbme-ccss.ts
 *   npx tsx scripts/ingest-nbme-ccss.ts --dry-run   # parse only, no DB writes
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { parseNbmeCcssItem } from '../src/lib/nbme/parser';
import type { ParsedEpisode } from '../src/lib/di/types';

// ─── Environment ───

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=]+)=(.+)$/);
  if (match) process.env[match[1]] = match[2];
}

const DRY_RUN = process.argv.includes('--dry-run');
const NBME_DIR = path.resolve(__dirname, '../docs/sources/nbme-ccss');
const MANIFEST_PATH = path.join(NBME_DIR, 'manifest.json');

// ─── Supabase Client ───

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

// ─── Display ID Generator ───
// Format: NBME.{section:02}.{item:03}.{idx:02}
// Derives section/item from episode_number (= section*1000 + item) produced by the parser.
function makeDisplayId(episodeNumber: number, itemIndex: number): string {
  const section = Math.floor(episodeNumber / 1000);
  const item = episodeNumber % 1000;
  const s = String(section).padStart(2, '0');
  const i = String(item).padStart(3, '0');
  const idx = String(itemIndex + 1).padStart(2, '0');
  return `NBME.${s}.${i}.${idx}`;
}

// ─── Main ───

interface ManifestFileEntry {
  file: string;
  item?: number;
  topic?: string;
  shelf?: string;
  answer?: string;
  status?: string;
}

interface ManifestSection {
  id: string;
  name?: string;
  items: ManifestFileEntry[];
}

async function main() {
  console.log(`\n=== NBME CCSS Ingestion ${DRY_RUN ? '(DRY RUN)' : ''} ===\n`);

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const sections: ManifestSection[] = manifest.sections ?? [];
  // Flatten: walk each section's items, skipping entries not marked 'uploaded'.
  const fileEntries: Array<{ file: string }> = [];
  for (const section of sections) {
    for (const entry of section.items) {
      if (entry.status && entry.status !== 'uploaded') continue;
      fileEntries.push({ file: entry.file });
    }
  }
  console.log(`Manifest: ${fileEntries.length} uploaded items across ${sections.length} section(s)\n`);

  const parsed: ParsedEpisode[] = [];
  const parseErrors: Array<{ file: string; error: string }> = [];

  for (const entry of fileEntries) {
    const filePath = path.join(NBME_DIR, entry.file);
    if (!fs.existsSync(filePath)) {
      parseErrors.push({ file: entry.file, error: 'File not found' });
      continue;
    }
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const episode = parseNbmeCcssItem(content, entry.file);
      parsed.push(episode);
    } catch (err) {
      parseErrors.push({ file: entry.file, error: String(err) });
    }
  }

  const totalItems = parsed.reduce((sum, ep) => sum + ep.items.length, 0);
  const typeCounts: Record<string, number> = {};
  const topicCounts: Record<string, number> = {};
  let itemsWithTopics = 0;

  for (const episode of parsed) {
    for (const it of episode.items) {
      typeCounts[it.item_type] = (typeCounts[it.item_type] ?? 0) + 1;
      if (it.topic_tags.length > 0) itemsWithTopics++;
      for (const tag of it.topic_tags) {
        topicCounts[tag] = (topicCounts[tag] ?? 0) + 1;
      }
    }
  }

  console.log(`Parsed: ${parsed.length} items, ${totalItems} evidence rows`);
  console.log(`Items with topic mapping: ${itemsWithTopics}/${totalItems}`);
  console.log(`\nBy type:`);
  for (const [t, c] of Object.entries(typeCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${t}: ${c}`);
  }
  console.log(`\nBy topic:`);
  for (const [t, c] of Object.entries(topicCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${t}: ${c}`);
  }

  if (parseErrors.length > 0) {
    console.log(`\nParse errors (${parseErrors.length}):`);
    for (const err of parseErrors) console.log(`  ${err.file}: ${err.error}`);
  }

  if (DRY_RUN) {
    console.log('\n--- DRY RUN complete. No database writes. ---\n');
    return;
  }

  // Upsert
  const supabase = getSupabase();
  let itemsUpserted = 0;
  let evidenceUpserted = 0;
  const upsertErrors: Array<{ ref: string; error: string }> = [];

  for (const episode of parsed) {
    const ref = `${Math.floor(episode.episode_number / 1000)}.${episode.episode_number % 1000}`;

    const { data: episodeData, error: episodeError } = await supabase
      .from('di_episode')
      .upsert(
        {
          episode_number: episode.episode_number,
          title: episode.title,
          shelf: episode.shelf,
          topic_tags: episode.topic_tags,
          source_file: episode.source_file,
          total_items: episode.items.length,
          source: 'nbme',
        },
        { onConflict: 'source,episode_number' },
      )
      .select('id')
      .single();

    if (episodeError || !episodeData) {
      upsertErrors.push({
        ref,
        error: `Episode upsert: ${episodeError?.message ?? 'no data'}`,
      });
      continue;
    }

    itemsUpserted++;
    const episodeId = episodeData.id;

    const rows = episode.items.map((it, idx) => ({
      episode_id: episodeId,
      item_type: it.item_type,
      section_heading: it.section_heading,
      claim: it.claim,
      raw_text: it.raw_text,
      trigger_presentation: it.trigger_presentation,
      association: it.association,
      differential: it.differential,
      mnemonic_text: it.mnemonic_text,
      topic_tags: it.topic_tags,
      shelf: it.shelf,
      display_id: makeDisplayId(episode.episode_number, idx),
      source: 'nbme',
    }));

    for (let i = 0; i < rows.length; i += 50) {
      const batch = rows.slice(i, i + 50);
      const { error: itemError } = await supabase
        .from('di_evidence_item')
        .upsert(batch, { onConflict: 'display_id' });

      if (itemError) {
        upsertErrors.push({ ref, error: `Item batch ${i}: ${itemError.message}` });
      } else {
        evidenceUpserted += batch.length;
      }
    }
  }

  console.log(`\n=== Database Results ===`);
  console.log(`CCSS items upserted: ${itemsUpserted}`);
  console.log(`Evidence rows upserted: ${evidenceUpserted}`);

  if (upsertErrors.length > 0) {
    console.log(`\nUpsert errors (${upsertErrors.length}):`);
    for (const err of upsertErrors) console.log(`  ${err.ref}: ${err.error}`);
  }

  console.log('\nDone.\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
