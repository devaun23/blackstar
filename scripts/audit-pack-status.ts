/**
 * Audit: for every registered source pack, show its status (active/draft/retired)
 * and its minimum-evidence coverage (recs, dx, tx, thresholds, severity, red flags).
 *
 * Output groups packs into 3 buckets for triage:
 *   1. ACTIVE + PASSES → ready, already usable
 *   2. DRAFT + PASSES minimum-evidence → flip to active (low-risk, already has the fields)
 *   3. DRAFT + FAILS minimum-evidence OR retired → requires content work
 */
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(__dirname, '../.env.local');
for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
  const m = line.match(/^([^=]+)=(.+)$/);
  if (m) process.env[m[1]!] = m[2]!;
}

async function main() {
  // Directly import the PACK_REGISTRY via the module's internal structure
  // by re-exporting — instead, just enumerate known pack files on disk.
  const packDir = path.resolve(__dirname, '../src/lib/factory/source-packs');
  const files = fs.readdirSync(packDir)
    .filter((f) => f.endsWith('.ts'))
    .filter((f) => !['index.ts', 'types.ts', 'topic-source-map.ts', 'sufficiency.ts'].includes(f));

  console.log(`Found ${files.length} pack files on disk.`);

  const buckets: {
    active_ok: string[];
    active_thin: Array<{ id: string; missing: string[] }>;
    validated_ok: string[];
    validated_thin: Array<{ id: string; missing: string[] }>;
    draft_complete: Array<{ id: string; missing: string[] }>;
    draft_thin: Array<{ id: string; missing: string[] }>;
    retired: string[];
    load_error: Array<{ file: string; error: string }>;
  } = {
    active_ok: [],
    active_thin: [],
    validated_ok: [],
    validated_thin: [],
    draft_complete: [],
    draft_thin: [],
    retired: [],
    load_error: [],
  };

  const { evaluatePack } = await import('../src/lib/factory/source-packs/sufficiency');

  for (const file of files.sort()) {
    const modulePath = `../src/lib/factory/source-packs/${file.replace(/\.ts$/, '')}`;
    try {
      const mod = await import(modulePath);
      // Find the exported SourcePack — either `pack` or a PACK_* named export.
      let pack: any = mod.pack;
      if (!pack) {
        for (const key of Object.keys(mod)) {
          if (key.startsWith('PACK_')) { pack = mod[key]; break; }
        }
      }
      if (!pack || typeof pack !== 'object' || !pack.source_pack_id) {
        buckets.load_error.push({ file, error: 'no SourcePack export found' });
        continue;
      }

      const id = pack.source_pack_id as string;
      const status = pack.status as string;
      const result = evaluatePack(pack, id);

      if (status === 'active' && result.sufficient) {
        buckets.active_ok.push(id);
      } else if (status === 'active') {
        buckets.active_thin.push({ id, missing: result.missing });
      } else if (status === 'validated' && result.sufficient) {
        buckets.validated_ok.push(id);
      } else if (status === 'validated') {
        buckets.validated_thin.push({ id, missing: result.missing });
      } else if (status === 'retired' || status === 'superseded') {
        buckets.retired.push(id);
      } else if (result.sufficient) {
        buckets.draft_complete.push({ id, missing: [] });
      } else {
        buckets.draft_thin.push({ id, missing: result.missing });
      }
    } catch (e) {
      buckets.load_error.push({ file, error: String(e).slice(0, 80) });
    }
  }

  console.log('\n═══ BUCKET SUMMARY ═══');
  console.log(`active + sufficient:       ${buckets.active_ok.length.toString().padStart(4)}  (guideline-verified, usable)`);
  console.log(`active but thin:           ${buckets.active_thin.length.toString().padStart(4)}  ← fix content`);
  console.log(`validated + sufficient:    ${buckets.validated_ok.length.toString().padStart(4)}  (board-review-grounded, usable, needs future guideline verification)`);
  console.log(`validated but thin:        ${buckets.validated_thin.length.toString().padStart(4)}  ← fix content`);
  console.log(`DRAFT + sufficient:        ${buckets.draft_complete.length.toString().padStart(4)}  ← promote to validated via scripts/promote-sufficient-drafts.ts`);
  console.log(`DRAFT + thin:              ${buckets.draft_thin.length.toString().padStart(4)}  ← needs content work`);
  console.log(`retired/superseded:        ${buckets.retired.length.toString().padStart(4)}`);
  console.log(`load errors:               ${buckets.load_error.length.toString().padStart(4)}`);

  console.log('\n═══ DRAFT + SUFFICIENT (would pass sufficiency if flipped active) ═══');
  for (const { id } of buckets.draft_complete) console.log(`  ${id}`);

  console.log('\n═══ ACTIVE + THIN (marked active but fails min-evidence checks) ═══');
  for (const { id, missing } of buckets.active_thin) {
    console.log(`  ${id}`);
    for (const m of missing) console.log(`     - ${m}`);
  }

  console.log('\n═══ DRAFT + THIN (needs real content work) ═══');
  for (const { id, missing } of buckets.draft_thin.slice(0, 20)) {
    console.log(`  ${id}: ${missing.slice(0, 2).join('; ')}${missing.length > 2 ? ` (+${missing.length - 2} more)` : ''}`);
  }
  if (buckets.draft_thin.length > 20) console.log(`  ... and ${buckets.draft_thin.length - 20} more`);

  if (buckets.load_error.length > 0) {
    console.log('\n═══ LOAD ERRORS ═══');
    for (const e of buckets.load_error) console.log(`  ${e.file}: ${e.error}`);
  }
}

main().catch(console.error);
