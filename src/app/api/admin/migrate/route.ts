import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/admin/migrate
 * Executes raw SQL statements via a temporary plpgsql function.
 * Admin-protected. Creates _exec_migration function on first use.
 *
 * Body: { sql: string } — the full migration SQL to execute
 *
 * IMPORTANT: Remove this route after migrations are applied!
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get('x-admin-key');
  if (authHeader !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { sql } = await request.json();
  if (!sql || typeof sql !== 'string') {
    return NextResponse.json({ error: 'Missing sql field' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // Step 1: Ensure _exec_migration function exists
  // Try calling it first
  const { error: testError } = await supabase.rpc('_exec_migration', { query: 'SELECT 1' });

  if (testError?.code === 'PGRST202') {
    // Function doesn't exist. We can't create it via PostgREST either.
    // Return instructions to create it manually.
    return NextResponse.json({
      error: 'The _exec_migration helper function does not exist.',
      action: 'Please run this SQL in the Supabase SQL Editor first:',
      sql_to_run: `CREATE OR REPLACE FUNCTION public._exec_migration(query text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN EXECUTE query; END; $$;`,
    }, { status: 428 });
  }

  // Step 2: Split SQL into statements and execute each
  const statements = splitStatements(sql);
  const results: { statement: string; ok: boolean; error?: string }[] = [];

  for (const stmt of statements) {
    const { error } = await supabase.rpc('_exec_migration', { query: stmt });
    results.push({
      statement: stmt.substring(0, 100),
      ok: !error,
      error: error?.message,
    });
  }

  const failures = results.filter(r => !r.ok);
  return NextResponse.json({
    total: results.length,
    succeeded: results.filter(r => r.ok).length,
    failed: failures.length,
    failures,
  }, { status: failures.length > 0 ? 207 : 200 });
}

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
      if (stmt && stmt !== ';') {
        statements.push(stmt);
      }
      current = '';
    }
  }
  if (current.trim()) statements.push(current.trim());
  return statements;
}
