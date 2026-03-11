import { NextResponse } from 'next/server';
import { runPipeline } from '@/lib/factory/pipeline';
import type { PipelineConfig } from '@/lib/types/factory';

/**
 * POST /api/factory/run
 * Triggers a full pipeline run. Admin-protected.
 * Body: { blueprintNodeId?, shelf?, yieldTier?, mockMode? }
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get('x-admin-key');
  if (authHeader !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let config: PipelineConfig;
  try {
    config = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const result = await runPipeline(config);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
