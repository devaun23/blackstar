/**
 * Ingest review source episodes into Supabase.
 *
 * Supports Divine Intervention (default) and Inner Circle sources.
 * Parses markdown files → extracts typed evidence items →
 * upserts into di_episode + di_evidence_item tables.
 *
 * Idempotent: safe to re-run. Uses ON CONFLICT on (source, episode_number) and display_id.
 *
 * Usage:
 *   npx tsx scripts/ingest-di-episodes.ts                          # DI, live
 *   npx tsx scripts/ingest-di-episodes.ts --dry-run                # DI, parse only
 *   npx tsx scripts/ingest-di-episodes.ts --source=inner_circle    # IC, live
 *   npx tsx scripts/ingest-di-episodes.ts --source=inner_circle --dry-run
 *   npx tsx scripts/ingest-di-episodes.ts --source=emma_holliday   # EH Peds, live
 *   npx tsx scripts/ingest-di-episodes.ts --source=emma_holliday --dry-run
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { parseEpisode } from '../src/lib/di/parser';
import type { ParsedEpisode } from '../src/lib/di/types';
import type { ReviewSource } from '../src/lib/di/types';

// ─── Environment ───

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=]+)=(.+)$/);
  if (match) process.env[match[1]] = match[2];
}

const DRY_RUN = process.argv.includes('--dry-run');
const SOURCE_ARG = process.argv.find((a) => a.startsWith('--source='))?.split('=')[1] ?? 'divine_intervention';
const SOURCE = SOURCE_ARG as ReviewSource;

// ─── Source Configuration ───

interface SourceConfig {
  label: string;
  dir: string;
  displayIdPrefix: string;
  source: ReviewSource;
}

const SOURCE_CONFIGS: Record<string, SourceConfig> = {
  divine_intervention: {
    label: 'Divine Intervention',
    dir: path.resolve(__dirname, '../docs/sources/divine-intervention'),
    displayIdPrefix: 'DI',
    source: 'divine_intervention',
  },
  inner_circle: {
    label: 'Inner Circle',
    dir: path.resolve(__dirname, '../docs/sources/uworld-inner-circle'),
    displayIdPrefix: 'IC',
    source: 'inner_circle',
  },
  emma_holliday: {
    label: 'Emma Holliday Pediatrics',
    dir: path.resolve(__dirname, '../docs/sources/emma-holliday-peds'),
    displayIdPrefix: 'EH.PEDS',
    source: 'emma_holliday',
  },
};

const config = SOURCE_CONFIGS[SOURCE];
if (!config) {
  console.error(`Unknown source: ${SOURCE}. Available: ${Object.keys(SOURCE_CONFIGS).join(', ')}`);
  process.exit(1);
}

// ─── Supabase Client ───

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

// ─── Display ID Generator ───

function makeDisplayId(prefix: string, episodeNumber: number, itemIndex: number): string {
  const ep = String(episodeNumber).padStart(3, '0');
  const idx = String(itemIndex + 1).padStart(3, '0');
  return `${prefix}.${ep}.${idx}`;
}

// ─── Manifest Loaders ───

interface FileEntry {
  file: string;
  episodeNumber: number;
}

function loadDIManifest(dir: string): FileEntry[] {
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
  return manifest.episodes.map((e: { ep: number; file: string }) => ({
    file: e.file,
    episodeNumber: e.ep,
  }));
}

function loadICManifest(dir: string): FileEntry[] {
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
  const entries: FileEntry[] = [];
  let seq = 1;

  for (const section of manifest.sections) {
    if (!section.files || section.files.length === 0) continue;
    for (const file of section.files) {
      if (file.status !== 'uploaded') continue;
      entries.push({ file: file.file, episodeNumber: seq });
      seq++;
    }
  }

  return entries;
}

function loadEHManifest(dir: string): FileEntry[] {
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
  return manifest.sections
    .filter((s: { status: string }) => s.status === 'uploaded')
    .map((s: { section: number; file: string }) => ({
      file: s.file,
      episodeNumber: s.section,
    }));
}

function loadManifest(source: string, dir: string): FileEntry[] {
  if (source === 'inner_circle') return loadICManifest(dir);
  if (source === 'emma_holliday') return loadEHManifest(dir);
  return loadDIManifest(dir);
}

// ─── Main ───

async function main() {
  console.log(`\n=== ${config.label} Ingestion ${DRY_RUN ? '(DRY RUN)' : ''} ===\n`);

  // 1. Load manifest
  const entries = loadManifest(SOURCE, config.dir);
  console.log(`Manifest: ${entries.length} files\n`);

  // 2. Parse all files
  const parsed: ParsedEpisode[] = [];
  const parseErrors: Array<{ file: string; error: string }> = [];

  for (const entry of entries) {
    const filePath = path.join(config.dir, entry.file);
    if (!fs.existsSync(filePath)) {
      parseErrors.push({ file: entry.file, error: 'File not found' });
      continue;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      // For IC and EH files, episode number comes from manifest ordering, not frontmatter
      const episodeOverride = (SOURCE === 'inner_circle' || SOURCE === 'emma_holliday') ? entry.episodeNumber : undefined;
      const result = parseEpisode(content, entry.file, episodeOverride);
      parsed.push(result);
    } catch (err) {
      parseErrors.push({ file: entry.file, error: String(err) });
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

  console.log(`Parsed: ${parsed.length} files, ${totalItems} items`);
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
  let episodesUpserted = 0;
  let itemsUpserted = 0;
  let upsertErrors: Array<{ episode: number; error: string }> = [];

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
          source: config.source,
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
      display_id: makeDisplayId(config.displayIdPrefix, ep.episode_number, idx),
      source: config.source,
    }));

    for (let i = 0; i < itemRows.length; i += 50) {
      const batch = itemRows.slice(i, i + 50);
      const { error: itemError, count } = await supabase
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
