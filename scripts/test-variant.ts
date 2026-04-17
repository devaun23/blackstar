/**
 * Quick test: generate a variant from an existing item_draft.
 *
 * Usage: npx tsx scripts/test-variant.ts <source-draft-id>
 */

import * as fs from 'fs';
import * as path from 'path';

// Load .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=]+)=(.+)$/);
  if (match) process.env[match[1]] = match[2];
}

import { generateVariant } from '../src/lib/factory/variant-generator';

async function main() {
  const sourceDraftId = process.argv[2];
  if (!sourceDraftId) {
    console.error('Usage: npx tsx scripts/test-variant.ts <source-draft-id>');
    process.exit(1);
  }

  console.log(`Generating variant for draft: ${sourceDraftId}`);
  console.log('---');

  const result = await generateVariant(sourceDraftId);

  console.log('---');
  console.log(`Status: ${result.status}`);
  console.log(`New draft ID: ${result.itemDraftId ?? 'none'}`);
  console.log(`Total tokens: ${result.totalTokens}`);
  console.log(`Duration: ${(result.totalDurationMs / 1000).toFixed(1)}s`);
  console.log(`Steps: ${result.steps.length}`);
  for (const step of result.steps) {
    console.log(`  ${step.agent}: ${step.success ? 'OK' : 'FAIL'} (${step.tokensUsed} tokens)`);
    if (!step.success && step.error) {
      console.log(`    Error: ${step.error}`);
    }
    if (!step.success && step.output) {
      console.log(`    Output: ${JSON.stringify(step.output).substring(0, 300)}`);
    }
  }

  // Check variant_group_id
  if (result.itemDraftId) {
    const { createAdminClient } = await import('../src/lib/supabase/admin');
    const supabase = createAdminClient();

    const { data: sourceDraft } = await supabase
      .from('item_draft')
      .select('variant_group_id')
      .eq('id', sourceDraftId)
      .single();

    const { data: newDraft } = await supabase
      .from('item_draft')
      .select('variant_group_id')
      .eq('id', result.itemDraftId)
      .single();

    console.log('---');
    console.log(`Source variant_group_id: ${sourceDraft?.variant_group_id ?? 'null'}`);
    console.log(`New variant_group_id:    ${newDraft?.variant_group_id ?? 'null'}`);
    console.log(`Match: ${sourceDraft?.variant_group_id === newDraft?.variant_group_id ? 'YES' : 'NO'}`);
  }
}

main().catch(console.error);
