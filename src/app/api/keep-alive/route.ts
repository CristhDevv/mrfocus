import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  return handleKeepAlive(req);
}

export async function POST(req: NextRequest) {
  return handleKeepAlive(req);
}

async function handleKeepAlive(req: NextRequest) {
  const startTime = Date.now();
  const nowIso = new Date().toISOString();
  const userAgent = req.headers.get('user-agent') || 'cron/unknown';
  const isVercelCron = req.headers.get('x-vercel-cron') === '1' || userAgent.includes('vercel');

  let supabaseReadSuccess = false;
  let supabaseWriteSuccess = false;
  let supabaseError: string | null = null;
  let projectsCount = 0;
  let updatedPingCount = 0;

  // 1. Supabase Read Query (Counts as user activity)
  try {
    const { data: projData, error: projErr, count } = await supabase
      .from('projects')
      .select('id', { count: 'exact', head: false })
      .limit(5);

    if (projErr) {
      supabaseError = projErr.message;
    } else {
      supabaseReadSuccess = true;
      projectsCount = count ?? (projData?.length || 0);
    }
  } catch (err: any) {
    supabaseError = err.message || 'Unknown read error';
  }

  // 2. Supabase Write / Upsert Query (Heartbeat registry)
  try {
    const source = isVercelCron ? 'vercel-cron' : (userAgent.includes('github') ? 'github-actions' : 'http-ping');
    
    // First read current ping count
    const { data: currentHeartbeat } = await supabase
      .from('system_heartbeats')
      .select('ping_count')
      .eq('id', 'primary_heartbeat')
      .maybeSingle();

    const nextCount = (currentHeartbeat?.ping_count ? Number(currentHeartbeat.ping_count) : 0) + 1;
    updatedPingCount = nextCount;

    const { error: upsertErr } = await supabase
      .from('system_heartbeats')
      .upsert({
        id: 'primary_heartbeat',
        last_ping: nowIso,
        ping_count: nextCount,
        source: source,
        metadata: {
          userAgent,
          isVercelCron,
          executedAt: nowIso,
          projectsCount,
        },
      });

    if (!upsertErr) {
      supabaseWriteSuccess = true;
    } else if (!supabaseError) {
      supabaseError = upsertErr.message;
    }
  } catch (err: any) {
    if (!supabaseError) supabaseError = err.message || 'Unknown upsert error';
  }

  // 3. Local SQLite Heartbeat (if local DB is active)
  let localDbSuccess = false;
  try {
    const localRes = db.prepare('SELECT count(*) as count FROM projects').get() as { count: number };
    if (localRes) localDbSuccess = true;
  } catch {
    // Local DB may be ephemeral on serverless, which is expected
  }

  const durationMs = Date.now() - startTime;
  const isHealthy = supabaseReadSuccess || supabaseWriteSuccess;

  return NextResponse.json(
    {
      status: isHealthy ? 'healthy' : 'degraded',
      message: isHealthy
        ? 'Supabase keep-alive query executed successfully (activity recorded).'
        : 'Failed to connect to Supabase.',
      timestamp: nowIso,
      latencyMs: durationMs,
      supabase: {
        healthy: isHealthy,
        readSuccess: supabaseReadSuccess,
        writeSuccess: supabaseWriteSuccess,
        projectsCount,
        pingCount: updatedPingCount,
        error: supabaseError,
      },
      localDb: {
        healthy: localDbSuccess,
      },
    },
    {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
