/**
 * Promote draft source packs that pass sufficiency checks from 'draft' → 'validated'.
 *
 * Rationale:
 *   - 'draft' = extracted from board-review sources, unverified, not usable at generation time
 *   - 'validated' = content passes sufficiency (≥3 recs, ≥1 dx, ≥2 tx, thresholds, severity, red flags,
 *                   competing pathways, management hinge) — usable for generation
 *   - 'active' = guideline-verified, fully promoted (requires human review)
 *
 * This script only touches packs that ALREADY pass evidence-sufficiency checks.
 * Packs with thin content remain 'draft'; packs already 'active' or 'validated'
 * are left alone.
 *
 * Usage:
 *   npx tsx scripts/promote-sufficient-drafts.ts --dry-run   # show what would change
 *   npx tsx scripts/promote-sufficient-drafts.ts             # apply
 */
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(__dirname, '../.env.local');
for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
  const m = line.match(/^([^=]+)=(.+)$/);
  if (m) process.env[m[1]!] = m[2]!;
}

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  const packDir = path.resolve(__dirname, '../src/lib/factory/source-packs');
  const files = fs.readdirSync(packDir)
    .filter((f) => f.endsWith('.ts'))
    .filter((f) => !['index.ts', 'types.ts', 'topic-source-map.ts', 'sufficiency.ts'].includes(f));

  const { evaluatePack } = await import('../src/lib/factory/source-packs/sufficiency');

  const promoted: string[] = [];
  const skipped_thin: Array<{ id: string; missing: string[] }> = [];
  const skipped_not_draft: string[] = [];
  const errors: Array<{ file: string; error: string }> = [];

  for (const file of files.sort()) {
    const modulePath = `../src/lib/factory/source-packs/${file.replace(/\.ts$/, '')}`;
    let pack: any;
    try {
      const mod = await import(modulePath);
      pack = mod.pack;
      if (!pack) {
        for (const key of Object.keys(mod)) {
          if (key.startsWith('PACK_')) { pack = mod[key]; break; }
        }
      }
      if (!pack || !pack.source_pack_id) {
        errors.push({ file, error: 'no SourcePack export found' });
        continue;
      }
    } catch (e) {
      errors.push({ file, error: String(e).slice(0, 80) });
      continue;
    }

    const id = pack.source_pack_id as string;
    const status = pack.status as string;

    if (status !== 'draft') {
      skipped_not_draft.push(`${id} (status=${status})`);
      continue;
    }

    const result = evaluatePack(pack, id);
    if (!result.sufficient) {
      skipped_thin.push({ id, missing: result.missing });
      continue;
    }

    // Edit the file: change `"status": "draft"` → `"status": "validated"` in the pack object only.
    // Note: packs use JSON-style quoted keys since they're emitted by the accelerator.
    const filePath = path.join(packDir, file);
    const raw = fs.readFileSync(filePath, 'utf8');
    // Match both JSON-style ("status": "draft") and TS-style (status: 'draft'/"draft")
    const patterns = [
      '"status": "draft"',
      "'status': 'draft'",
      'status: "draft"',
      "status: 'draft'",
    ];
    let marker = '';
    let occurrences = 0;
    for (const p of patterns) {
      const n = raw.split(p).length - 1;
      if (n > 0) { marker = p; occurrences = n; break; }
    }
    if (occurrences !== 1) {
      errors.push({ file, error: `no single-match draft marker found (tried ${patterns.length} patterns)` });
      continue;
    }
    const replacement = marker.replace('draft', 'validated');
    const updated = raw.replace(marker, replacement);

    if (!DRY_RUN) {
      fs.writeFileSync(filePath, updated);
    }
    promoted.push(id);
  }

  console.log(`\n═══ Promotion Summary ${DRY_RUN ? '(DRY RUN)' : ''} ═══`);
  console.log(`Promoted draft → validated:  ${promoted.length}`);
  console.log(`Skipped (still thin):        ${skipped_thin.length}`);
  console.log(`Skipped (already promoted):  ${skipped_not_draft.length}`);
  console.log(`Errors:                      ${errors.length}`);

  if (promoted.length > 0) {
    console.log('\nPromoted:');
    for (const id of promoted.slice(0, 20)) console.log(`  ✓ ${id}`);
    if (promoted.length > 20) console.log(`  ... and ${promoted.length - 20} more`);
  }

  if (skipped_thin.length > 0) {
    console.log('\nStill draft (need content work):');
    for (const { id, missing } of skipped_thin) {
      console.log(`  ✗ ${id}: ${missing.slice(0, 2).join('; ')}${missing.length > 2 ? ` (+${missing.length - 2})` : ''}`);
    }
  }

  if (errors.length > 0) {
    console.log('\nErrors:');
    for (const e of errors) console.log(`  ! ${e.file}: ${e.error}`);
  }

  if (DRY_RUN) console.log('\nRe-run without --dry-run to apply.\n');
}

main().catch(console.error);
