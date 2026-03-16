import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const s = createAdminSupabaseClient();

  // Aggregate total usage per feature across all users
  const [
    { count: totalUsers },
    { count: tasksUsers },
    { count: notesUsers },
    { count: invoiceUsers },
    { count: contentUsers },
    { count: exportUsers },
    { count: goalUsers },
  ] = await Promise.all([
    s.from('profiles').select('*', { count: 'exact', head: true }),
    s.from('tasks').select('user_id', { count: 'exact', head: true }),
    s.from('notes').select('user_id', { count: 'exact', head: true }),
    s.from('invoices').select('user_id', { count: 'exact', head: true }),
    s.from('content_items').select('user_id', { count: 'exact', head: true }),
    s.from('exports').select('user_id', { count: 'exact', head: true }),
    s.from('goals').select('user_id', { count: 'exact', head: true }),
  ]);

  const stats = {
    total_users: totalUsers,
    tasks_users: tasksUsers,
    notes_users: notesUsers,
    invoice_users: invoiceUsers,
    content_users: contentUsers,
    export_users: exportUsers,
    goal_users: goalUsers,
  };

  await s.from('admin_metrics').insert({
    metric_key: 'feature_usage_stats',
    metric_value: stats,
  });

  return NextResponse.json(stats);
}
