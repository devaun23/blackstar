/**
 * Version Tracker — snapshots prompt versions at run start and enables comparison.
 *
 * Queries the agent_prompt table to capture which prompt version was active
 * for each agent during the run. This makes runs reproducible and enables
 * identifying which prompt changes caused quality shifts.
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import type { PromptVersionSnapshot, HarnessRunMeta, HarnessItemResult } from './types';

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Snapshot all active prompt versions from the DB.
 */
export async function snapshotPromptVersions(): Promise<PromptVersionSnapshot[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('agent_prompt')
    .select('id, agent_type, version, updated_at')
    .eq('is_active', true)
    .order('agent_type');

  if (error) {
    console.warn(`Warning: Could not snapshot prompt versions: ${error.message}`);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    agent_type: row.agent_type as PromptVersionSnapshot['agent_type'],
    prompt_id: row.id as string,
    version: (row.version as number) ?? 1,
    updated_at: row.updated_at as string,
  }));
}

/**
 * Load a previous run's metadata from disk.
 */
export function loadRunMeta(runId: string): HarnessRunMeta | null {
  const metaPath = path.resolve(process.cwd(), 'harness-runs', runId, 'meta.json');
  if (!fs.existsSync(metaPath)) {
    console.error(`Run not found: ${metaPath}`);
    return null;
  }

  const content = fs.readFileSync(metaPath, 'utf-8');
  return JSON.parse(content) as HarnessRunMeta;
}

/**
 * Load a previous run's items from disk (JSONL format).
 */
export function loadRunItems(runId: string): HarnessItemResult[] {
  const itemsPath = path.resolve(process.cwd(), 'harness-runs', runId, 'items.jsonl');
  if (!fs.existsSync(itemsPath)) {
    console.error(`Items file not found: ${itemsPath}`);
    return [];
  }

  const content = fs.readFileSync(itemsPath, 'utf-8');
  return content
    .trim()
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line) as HarnessItemResult);
}

/**
 * List available run IDs (directory names in harness-runs/).
 */
export function listRuns(): string[] {
  const runsDir = path.resolve(process.cwd(), 'harness-runs');
  if (!fs.existsSync(runsDir)) return [];

  return fs
    .readdirSync(runsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()
    .reverse(); // newest first
}
