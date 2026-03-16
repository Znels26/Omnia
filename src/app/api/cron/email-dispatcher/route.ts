import { NextRequest, NextResponse } from 'next/server';
import { dispatchEmails } from '@/lib/email-scheduler';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();
  const result = await dispatchEmails();

  // Clean up processed queue entries older than 30 days
  const s = createAdminSupabaseClient();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  await s
    .from('email_queue')
    .delete()
    .in('status', ['sent', 'skipped', 'failed'])
    .lt('processed_at', thirtyDaysAgo);

  return NextResponse.json({
    ...result,
    duration_ms: Date.now() - start,
  });
}
