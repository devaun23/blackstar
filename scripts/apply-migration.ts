/**
 * Migration runner for Supabase.
 *
 * Since direct Postgres connections aren't available from this network (IPv6-only),
 * this script works in two modes:
 *
 * 1. BOOTSTRAP: Run with --bootstrap to get a SQL snippet to paste into the
 *    Supabase SQL Editor (one-time setup of _exec_migration function)
 *
 * 2. APPLY: Run with migration files to execute them via the _exec_migration RPC function
 *
 * Usage:
 *   npx tsx scripts/apply-migration.ts --bootstrap
 *   npx tsx scripts/apply-migration.ts file1.sql file2.sql ...
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=]+)=(.+)$/);
  if (match) process.env[match[1]] = match[2];
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

function splitStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let dollarDepth = 0;

  for (const line of sql.split('\n')) {
    if (line.trim().startsWith('--') && dollarDepth === 0) continue;
    const dollarMatches = line.match(/\$\$/g);
    if (dollarMatches) {
      dollarDepth += dollarMatches.length;
      if (dollarDepth % 2 === 0) dollarDepth = 0;
    }
    current += line + '\n';
    if (dollarDepth === 0 && line.trim().endsWith(';')) {
      const stmt = current.trim();
      if (stmt && stmt !== ';') statements.push(stmt);
      current = '';
    }
  }
  if (current.trim()) statements.push(current.trim());
  return statements;
}

async function checkBootstrap(): Promise<boolean> {
  const { error } = await supabase.rpc('_exec_migration', { query: 'SELECT 1' });
  return !error;
}

async function applyFile(filePath: string): Promise<{ ok: number; fail: number }> {
  const sql = fs.readFileSync(filePath, 'utf8');
  const stmts = splitStatements(sql);
  console.log(`  ${stmts.length} statements`);
  let ok = 0, fail = 0;

  for (const stmt of stmts) {
    const preview = stmt.replace(/\s+/g, ' ').substring(0, 80);
    const { error } = await supabase.rpc('_exec_migration', { query: stmt });
    if (error) {
      // Some "errors" are actually OK (IF NOT EXISTS, already exists, etc.)
      if (error.message.includes('already exists') || error.message.includes('does not exist')) {
        console.log(`  SKIP: ${preview}`);
        ok++;
      } else {
        console.error(`  FAIL: ${preview}`);
        console.error(`        ${error.message}`);
        fail++;
      }
    } else {
      console.log(`  OK: ${preview}`);
      ok++;
    }
  }
  return { ok, fail };
}

async function main() {
  const args = process.argv.slice(2);

  if (args[0] === '--bootstrap') {
    console.log('=== BOOTSTRAP: Paste this SQL into the Supabase SQL Editor ===\n');
    console.log(`CREATE OR REPLACE FUNCTION public._exec_migration(query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  EXECUTE query;
END;
$$;`);
    console.log('\n=== After running the above, re-run this script with migration files ===');
    return;
  }

  if (args.length === 0) {
    console.log('Usage:');
    console.log('  npx tsx scripts/apply-migration.ts --bootstrap');
    console.log('  npx tsx scripts/apply-migration.ts file1.sql file2.sql');
    return;
  }

  // Check if bootstrap function exists
  const ready = await checkBootstrap();
  if (!ready) {
    console.error('ERROR: _exec_migration function not found.');
    console.error('Run with --bootstrap first and paste the SQL into Supabase SQL Editor.');
    process.exit(1);
  }

  console.log('_exec_migration function found. Applying migrations...\n');
  let totalOk = 0, totalFail = 0;

  for (const file of args) {
    const filePath = path.resolve(file);
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }
    console.log(`\n=== ${path.basename(filePath)} ===`);
    const { ok, fail } = await applyFile(filePath);
    totalOk += ok;
    totalFail += fail;
  }

  console.log(`\n=== DONE: ${totalOk} succeeded, ${totalFail} failed ===`);
  if (totalFail > 0) process.exit(1);
}

main();
