/**
 * Ingest Emma Holliday IM Review sections into Supabase.
 *
 * Parses 9 section markdown files → extracts typed evidence items →
 * upserts into di_episode + di_evidence_item tables (source = 'emma_holliday').
 *
 * Idempotent: safe to re-run. Uses ON CONFLICT on (source, episode_number) and display_id.
 *
 * Usage:
 *   npx tsx scripts/ingest-eh-sections.ts
 *   npx tsx scripts/ingest-eh-sections.ts --dry-run   # parse only, no DB writes
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { parseEHSection } from '../src/lib/di/eh-parser';
import type { ParsedEpisode } from '../src/lib/di/types';

// ─── Environment ───

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=]+)=(.+)$/);
  if (match) process.env[match[1]] = match[2];
}

const DRY_RUN = process.argv.includes('--dry-run');
const EH_DIR = path.resolve(__dirname, '../docs/sources/emma-holliday');
const MANIFEST_PATH = path.join(EH_DIR, 'manifest.json');

// ─── Supabase Client ───

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

// ─── Display ID Generator ───

function makeDisplayId(sectionNumber: number, itemIndex: number): string {
  const sec = String(sectionNumber).padStart(3, '0');
  const idx = String(itemIndex + 1).padStart(3, '0');
  return `EH.${sec}.${idx}`;
}

// ─── Main ───

async function main() {
  console.log(`\n=== Emma Holliday IM Review Ingestion ${DRY_RUN ? '(DRY RUN)' : ''} ===\n`);

  // 1. Load manifest
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const sections: Array<{ section: number; file: string; title: string }> = manifest.sections;
  console.log(`Manifest: ${sections.length} sections\n`);

  // 2. Parse all sections
  const parsed: ParsedEpisode[] = [];
  const parseErrors: Array<{ file: string; error: string }> = [];

  for (const entry of sections) {
    const filePath = path.join(EH_DIR, entry.file);
    if (!fs.existsSync(filePath)) {
      parseErrors.push({ file: entry.file, error: 'File not found' });
      continue;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const result = parseEHSection(content, entry.file);
      parsed.push(result);
    } catch (err) {
      parseErrors.push({ file: entry.file, error: String(err) });
    }
  }

  // 3. Stats
  const totalItems = parsed.reduce((sum, sec) => sum + sec.items.length, 0);
  const typeCounts: Record<string, number> = {};
  const topicCounts: Record<string, number> = {};
  let itemsWithTopics = 0;

  for (const sec of parsed) {
    for (const item of sec.items) {
      typeCounts[item.item_type] = (typeCounts[item.item_type] ?? 0) + 1;
      if (item.topic_tags.length > 0) itemsWithTopics++;
      for (const tag of item.topic_tags) {
        topicCounts[tag] = (topicCounts[tag] ?? 0) + 1;
      }
    }
  }

  console.log(`Parsed: ${parsed.length} sections, ${totalItems} items`);
  console.log(`Items with Phase 1 topic mapping: ${itemsWithTopics}/${totalItems}`);
  console.log(`\nBy type:`);
  for (const [type, count] of Object.entries(typeCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type}: ${count}`);
  }
  console.log(`\nBy Blackstar topic (top 15):`);
  const sortedTopics = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]).slice(0, 15);
  for (const [topic, count] of sortedTopics) {
    console.log(`  ${topic}: ${count}`);
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
  let sectionsUpserted = 0;
  let itemsUpserted = 0;
  const upsertErrors: Array<{ section: number; error: string }> = [];

  for (const sec of parsed) {
    // Upsert episode (section)
    const { data: episodeData, error: episodeError } = await supabase
      .from('di_episode')
      .upsert(
        {
          episode_number: sec.episode_number,
          title: sec.title,
          shelf: sec.shelf,
          topic_tags: sec.topic_tags,
          source_file: sec.source_file,
          total_items: sec.items.length,
          source: 'emma_holliday',
        },
        { onConflict: 'source,episode_number' },
      )
      .select('id')
      .single();

    if (episodeError || !episodeData) {
      upsertErrors.push({
        section: sec.episode_number,
        error: `Episode upsert: ${episodeError?.message ?? 'no data returned'}`,
      });
      continue;
    }

    sectionsUpserted++;
    const episodeId = episodeData.id;

    // Upsert evidence items in batches of 50
    const itemRows = sec.items.map((item, idx) => ({
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
      display_id: makeDisplayId(sec.episode_number, idx),
      source: 'emma_holliday',
    }));

    for (let i = 0; i < itemRows.length; i += 50) {
      const batch = itemRows.slice(i, i + 50);
      const { error: itemError } = await supabase
        .from('di_evidence_item')
        .upsert(batch, { onConflict: 'display_id' });

      if (itemError) {
        upsertErrors.push({
          section: sec.episode_number,
          error: `Item upsert batch ${i}: ${itemError.message}`,
        });
      } else {
        itemsUpserted += batch.length;
      }
    }
  }

  console.log(`\n=== Database Results ===`);
  console.log(`Sections upserted: ${sectionsUpserted}`);
  console.log(`Items upserted: ${itemsUpserted}`);

  if (upsertErrors.length > 0) {
    console.log(`\nUpsert errors (${upsertErrors.length}):`);
    for (const err of upsertErrors) {
      console.log(`  section-${err.section}: ${err.error}`);
    }
  }

  console.log('\nDone.\n');
}

main().catch(console.error);
