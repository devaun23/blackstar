/**
 * Ingest UWorld Inner Circle section files into Supabase.
 *
 * Parses all IC section markdown files → extracts typed evidence items →
 * upserts into di_episode + di_evidence_item tables (with source='inner_circle').
 *
 * Idempotent: safe to re-run. Uses ON CONFLICT on (source, episode_number) and display_id.
 *
 * Usage:
 *   npx tsx scripts/ingest-ic-sections.ts
 *   npx tsx scripts/ingest-ic-sections.ts --dry-run
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { parseEpisode } from '../src/lib/di/parser';
import type { ParsedEpisode } from '../src/lib/di/types';

// ─── Environment ───

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=]+)=(.+)$/);
  if (match) process.env[match[1]] = match[2];
}

const DRY_RUN = process.argv.includes('--dry-run');
const IC_DIR = path.resolve(__dirname, '../docs/sources/uworld-inner-circle');
const MANIFEST_PATH = path.join(IC_DIR, 'manifest.json');

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

function makeDisplayId(sectionIndex: number, itemIndex: number): string {
  const sec = String(sectionIndex).padStart(3, '0');
  const idx = String(itemIndex + 1).padStart(3, '0');
  return `IC.${sec}.${idx}`;
}

async function main() {
  console.log(`\n=== Inner Circle Ingestion ${DRY_RUN ? '(DRY RUN)' : ''} ===\n`);

  // 1. Load manifest and collect all files
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const allFiles: Array<{ file: string; sectionIndex: number }> = [];
  let sectionCounter = 1;

  for (const section of manifest.sections) {
    if (!section.files) continue;
    for (const entry of section.files) {
      if (entry.status === 'uploaded') {
        allFiles.push({ file: entry.file, sectionIndex: sectionCounter++ });
      }
    }
  }

  console.log(`Manifest: ${allFiles.length} files across ${manifest.sections.length} sections\n`);

  // 2. Parse all files
  const parsed: Array<ParsedEpisode & { sectionIndex: number }> = [];
  const parseErrors: Array<{ file: string; error: string }> = [];

  for (const entry of allFiles) {
    const filePath = path.join(IC_DIR, entry.file);
    if (!fs.existsSync(filePath)) {
      parseErrors.push({ file: entry.file, error: 'File not found' });
      continue;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      // parseEpisode expects an episode_number in frontmatter; IC files use section numbers
      // The parser will use the `episode` field from frontmatter or default to 0
      // We'll override with our sequential sectionIndex
      const result = parseEpisode(content, entry.file);
      // Override episode_number with section index for IC
      result.episode_number = result.episode_number || entry.sectionIndex;
      parsed.push({ ...result, sectionIndex: entry.sectionIndex });
    } catch (err) {
      parseErrors.push({ file: entry.file, error: String(err) });
    }
  }

  // 3. Stats
  const totalItems = parsed.reduce((sum, ep) => sum + ep.items.length, 0);
  const typeCounts: Record<string, number> = {};
  const shelfCounts: Record<string, number> = {};

  for (const ep of parsed) {
    for (const item of ep.items) {
      typeCounts[item.item_type] = (typeCounts[item.item_type] ?? 0) + 1;
    }
    const shelf = ep.shelf ?? 'unknown';
    shelfCounts[shelf] = (shelfCounts[shelf] ?? 0) + ep.items.length;
  }

  console.log(`Parsed: ${parsed.length} files, ${totalItems} items`);
  console.log(`\nBy type:`);
  for (const [type, count] of Object.entries(typeCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type}: ${count}`);
  }
  console.log(`\nBy shelf:`);
  for (const [shelf, count] of Object.entries(shelfCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${shelf}: ${count}`);
  }

  if (parseErrors.length > 0) {
    console.log(`\nParse errors (${parseErrors.length}):`);
    for (const err of parseErrors) {
      console.log(`  ${err.file}: ${err.error}`);
    }
  }

  if (DRY_RUN) {
    console.log('\n--- DRY RUN complete. No database writes. ---\n');
    return;
  }

  // 4. Upsert to Supabase
  const supabase = getSupabase();
  let episodesUpserted = 0;
  let itemsUpserted = 0;
  let upsertErrors: Array<{ file: string; error: string }> = [];

  for (const ep of parsed) {
    const { data: episodeData, error: episodeError } = await supabase
      .from('di_episode')
      .upsert(
        {
          episode_number: ep.sectionIndex,
          title: ep.title,
          shelf: ep.shelf,
          topic_tags: ep.topic_tags,
          source_file: ep.source_file,
          total_items: ep.items.length,
          source: 'inner_circle',
        },
        { onConflict: 'source,episode_number' },
      )
      .select('id')
      .single();

    if (episodeError || !episodeData) {
      upsertErrors.push({
        file: ep.source_file,
        error: `Episode upsert: ${episodeError?.message ?? 'no data returned'}`,
      });
      continue;
    }

    episodesUpserted++;
    const episodeId = episodeData.id;

    const itemRows = ep.items.map((item, idx) => ({
      episode_id: episodeId,
      item_type: item.item_type,
      section_heading: item.section_heading,
      claim: item.claim,
      raw_text: item.raw_text,
      trigger_presentation: item.trigger_presentation,
      association: item.association,
      differential: item.differential,
      mnemonic_text: item.mnemonic_text,
      topic_tags: item.topic_tags,
      shelf: item.shelf,
      display_id: makeDisplayId(ep.sectionIndex, idx),
      source: 'inner_circle',
    }));

    for (let i = 0; i < itemRows.length; i += 50) {
      const batch = itemRows.slice(i, i + 50);
      const { error: itemError } = await supabase
        .from('di_evidence_item')
        .upsert(batch, { onConflict: 'display_id' });

      if (itemError) {
        upsertErrors.push({
          file: ep.source_file,
          error: `Item upsert batch ${i}: ${itemError.message}`,
        });
      } else {
        itemsUpserted += batch.length;
      }
    }
  }

  console.log(`\n=== Database Results ===`);
  console.log(`Episodes upserted: ${episodesUpserted}`);
  console.log(`Items upserted: ${itemsUpserted}`);

  if (upsertErrors.length > 0) {
    console.log(`\nUpsert errors (${upsertErrors.length}):`);
    for (const err of upsertErrors) {
      console.log(`  ${err.file}: ${err.error}`);
    }
  }

  console.log('\nDone.\n');
}

main().catch(console.error);
