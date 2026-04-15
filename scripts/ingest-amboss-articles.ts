/**
 * Ingest AMBOSS behavioral science articles into Supabase.
 *
 * Parses markdown files from docs/sources/amboss/ → extracts typed evidence items →
 * upserts into di_episode + di_evidence_item tables (with source = 'amboss').
 *
 * Idempotent: safe to re-run. Uses ON CONFLICT on (source, episode_number) and display_id.
 *
 * Usage:
 *   npx tsx scripts/ingest-amboss-articles.ts
 *   npx tsx scripts/ingest-amboss-articles.ts --dry-run   # parse only, no DB writes
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { parseAmbossArticle } from '../src/lib/amboss/parser';
import type { ParsedEpisode } from '../src/lib/di/types';

// ─── Environment ───

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=]+)=(.+)$/);
  if (match) process.env[match[1]] = match[2];
}

const DRY_RUN = process.argv.includes('--dry-run');
const AMBOSS_DIR = path.resolve(__dirname, '../docs/sources/amboss');
const MANIFEST_PATH = path.join(AMBOSS_DIR, 'manifest.json');

// ─── Supabase Client ───

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

// ─── Display ID Generator ───

function makeDisplayId(articleNumber: number, itemIndex: number): string {
  const art = String(articleNumber).padStart(3, '0');
  const idx = String(itemIndex + 1).padStart(3, '0');
  return `AM.${art}.${idx}`;
}

// ─── Main ───

async function main() {
  console.log(`\n=== AMBOSS Ingestion ${DRY_RUN ? '(DRY RUN)' : ''} ===\n`);

  // 1. Load manifest
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const articles: Array<{ article_number: number; file: string }> = manifest.articles;
  console.log(`Manifest: ${articles.length} articles\n`);

  // 2. Parse all articles
  const parsed: ParsedEpisode[] = [];
  const parseErrors: Array<{ file: string; error: string }> = [];

  for (const entry of articles) {
    const filePath = path.join(AMBOSS_DIR, entry.file);
    if (!fs.existsSync(filePath)) {
      parseErrors.push({ file: entry.file, error: 'File not found' });
      continue;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const result = parseAmbossArticle(content, entry.file);
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

  console.log(`Parsed: ${parsed.length} articles, ${totalItems} items`);
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
  let articlesUpserted = 0;
  let itemsUpserted = 0;
  const upsertErrors: Array<{ article: number; error: string }> = [];

  for (const ep of parsed) {
    // Upsert article as an episode row
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
          source: 'amboss',
        },
        { onConflict: 'source,episode_number' },
      )
      .select('id')
      .single();

    if (episodeError || !episodeData) {
      upsertErrors.push({
        article: ep.episode_number,
        error: `Article upsert: ${episodeError?.message ?? 'no data returned'}`,
      });
      continue;
    }

    articlesUpserted++;
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
      source: 'amboss',
    }));

    for (let i = 0; i < itemRows.length; i += 50) {
      const batch = itemRows.slice(i, i + 50);
      const { error: itemError } = await supabase
        .from('di_evidence_item')
        .upsert(batch, { onConflict: 'display_id' });

      if (itemError) {
        upsertErrors.push({
          article: ep.episode_number,
          error: `Item upsert batch ${i}: ${itemError.message}`,
        });
      } else {
        itemsUpserted += batch.length;
      }
    }
  }

  console.log(`\n=== Database Results ===`);
  console.log(`Articles upserted: ${articlesUpserted}`);
  console.log(`Items upserted: ${itemsUpserted}`);

  if (upsertErrors.length > 0) {
    console.log(`\nUpsert errors (${upsertErrors.length}):`);
    for (const err of upsertErrors) {
      console.log(`  article-${err.article}: ${err.error}`);
    }
  }

  console.log('\nDone.\n');
}

main().catch(console.error);
