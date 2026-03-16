import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // This job is a placeholder for resetting any in-memory or DB-stored hourly rate limits.
  // Current Omnia uses per-month counters, so this clears any temporary abuse flags
  // that were set within the last hour (auto-resolve after 24h).
  const s = createAdminSupabaseClient();
  const oneDayAgo = new Date(Date.now() - 86400000).toISOString();

  const { data: cleared } = await s
    .from('abuse_flags')
    .delete()
    .lt('flagged_at', oneDayAgo)
    .select('id');

  return NextResponse.json({ abuse_flags_cleared: cleared?.length ?? 0 });
}
