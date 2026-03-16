import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const s = createAdminSupabaseClient();
  const results: Record<string, number> = {};

  // Clean up read notifications older than 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const { data: oldNotifs } = await s
    .from('notifications')
    .delete()
    .eq('is_read', true)
    .lt('created_at', thirtyDaysAgo)
    .select('id');
  results.old_notifications_purged = oldNotifs?.length ?? 0;

  // Clean up sent/delivered reminders older than 30 days
  const { data: oldReminders } = await s
    .from('reminders')
    .delete()
    .eq('status', 'sent')
    .lt('created_at', thirtyDaysAgo)
    .select('id');
  results.old_reminders_purged = oldReminders?.length ?? 0;

  // Clean up old admin_metrics records beyond 90 days
  const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString();
  const { data: oldMetrics } = await s
    .from('admin_metrics')
    .delete()
    .lt('calculated_at', ninetyDaysAgo)
    .select('id');
  results.old_metrics_purged = oldMetrics?.length ?? 0;

  return NextResponse.json({ cleaned: results });
}
