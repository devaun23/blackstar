import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Runs migration SQL via Supabase's pg_net / REST SQL endpoint.
 * Falls back to direct pg connection if DATABASE_URL is set.
 */
async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  const sqlPath = resolve(import.meta.dirname, '..', 'supabase-migration-v2.sql');
  const sql = readFileSync(sqlPath, 'utf-8');

  // Try direct pg connection first if DATABASE_URL is set
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    const pg = await import('pg');
    const client = new pg.default.Client({ connectionString: dbUrl });
    await client.connect();
    console.log('Running migration via direct connection...');
    await client.query(sql);
    console.log('Migration complete.');

    const { rows } = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'blueprint_node'
      ORDER BY ordinal_position
    `);
    console.log('blueprint_node columns:', rows.map((r: { column_name: string }) => r.column_name).join(', '));
    await client.end();
    return;
  }

  // Fallback: use Supabase's built-in SQL via rpc (requires a helper function)
  // Split into individual statements since rpc can't handle multi-statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Running ${statements.length} statements via Supabase REST...`);

  for (const stmt of statements) {
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ query: stmt }),
    });

    if (!res.ok) {
      const body = await res.text();
      // 404 means the exec_sql function doesn't exist — expected
      if (res.status === 404) {
        console.error('exec_sql RPC not found. Please run the migration manually:');
        console.error('1. Go to Supabase Dashboard → SQL Editor');
        console.error('2. Paste the contents of supabase-migration-v2.sql');
        console.error('3. Click "Run"');
        console.error('\nOr provide DATABASE_URL in .env.local');
        process.exit(1);
      }
      throw new Error(`Statement failed (${res.status}): ${body}\nSQL: ${stmt.slice(0, 100)}`);
    }
  }

  console.log('Migration complete via REST.');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
