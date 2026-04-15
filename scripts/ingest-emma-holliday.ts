/**
 * Ingest Emma Holliday review lecture notes into Supabase.
 *
 * Parses structured markdown files → extracts typed evidence items →
 * upserts into di_episode + di_evidence_item tables with source='emma_holliday'.
 *
 * Idempotent: safe to re-run. Uses ON CONFLICT on (source, episode_number) and display_id.
 *
 * Usage:
 *   npx tsx scripts/ingest-emma-holliday.ts
 *   npx tsx scripts/ingest-emma-holliday.ts --dry-run   # parse only, no DB writes
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
const EH_DIR = path.resolve(__dirname, '../docs/sources/emma-holliday');

// ─── Supabase Client ───

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

// ─── Display ID Generator ───

function makeDisplayId(episodeNumber: number, itemIndex: number): string {
  const ep = String(episodeNumber).padStart(3, '0');
  const idx = String(itemIndex + 1).padStart(3, '0');
  return `EH.${ep}.${idx}`;
}

// ─── Main ───

async function main() {
  console.log(`\n=== Emma Holliday Ingestion ${DRY_RUN ? '(DRY RUN)' : ''} ===\n`);

  // 1. Find all markdown files in the source directory
  const files = fs.readdirSync(EH_DIR)
    .filter((f) => f.endsWith('.md'))
    .sort();

  if (files.length === 0) {
    console.log('No markdown files found in', EH_DIR);
    return;
  }

  console.log(`Found ${files.length} file(s):\n`);
  for (const f of files) console.log(`  ${f}`);
  console.log();

  // 2. Parse all files
  const parsed: ParsedEpisode[] = [];
  const parseErrors: Array<{ file: string; error: string }> = [];

  for (const file of files) {
    const filePath = path.join(EH_DIR, file);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const result = parseEpisode(content, file);
      parsed.push(result);
    } catch (err) {
      parseErrors.push({ file, error: String(err) });
    }
  }

  // 3. Stats
  const totalItems = parsed.reduce((sum, ep) => sum + ep.items.length, 0);
  const typeCounts: Record<string, number> = {};
  const topicCounts: Record<string, number> = {};
  let itemsWithTopics = 0;

  for (const ep of parsed) {
    for (const item of ep.items) {
      typeCounts[item.item_type] = (typeCounts[item.item_type] ?? 0) + 1;
      if (item.topic_tags.length > 0) itemsWithTopics++;
      for (const tag of item.topic_tags) {
        topicCounts[tag] = (topicCounts[tag] ?? 0) + 1;
      }
    }
  }

  console.log(`Parsed: ${parsed.length} file(s), ${totalItems} items`);
  console.log(`Items with topic mapping: ${itemsWithTopics}/${totalItems}`);
  console.log(`\nBy type:`);
  for (const [type, count] of Object.entries(typeCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type}: ${count}`);
  }
  console.log(`\nBy topic:`);
  const sortedTopics = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]);
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
  let episodesUpserted = 0;
  let itemsUpserted = 0;
  const upsertErrors: Array<{ episode: number; error: string }> = [];

  for (const ep of parsed) {
    // Upsert episode
    const { data: episodeData, error: episodeError } = await supabase
      .from('di_episode')
      .upsert(
        {
          episode_number: ep.episode_number,
          title: ep.title,
          shelf: ep.shelf,
          topic_tags: ep.topic_tags,
          source_file: ep.source_file,
          total_items: ep.items.length,
          source: 'emma_holliday',
        },
        { onConflict: 'source,episode_number' },
      )
      .select('id')
      .single();

    if (episodeError || !episodeData) {
      upsertErrors.push({
        episode: ep.episode_number,
        error: `Episode upsert: ${episodeError?.message ?? 'no data returned'}`,
      });
      continue;
    }

    episodesUpserted++;
    const episodeId = episodeData.id;

    // Upsert evidence items in batches of 50
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
      display_id: makeDisplayId(ep.episode_number, idx),
      source: 'emma_holliday',
    }));

    for (let i = 0; i < itemRows.length; i += 50) {
      const batch = itemRows.slice(i, i + 50);
      const { error: itemError } = await supabase
        .from('di_evidence_item')
        .upsert(batch, { onConflict: 'display_id' });

      if (itemError) {
        upsertErrors.push({
          episode: ep.episode_number,
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
      console.log(`  ep-${err.episode}: ${err.error}`);
    }
  }

  console.log('\nDone.\n');
}

main().catch(console.error);
