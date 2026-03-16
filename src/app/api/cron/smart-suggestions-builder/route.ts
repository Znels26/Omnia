import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const s = createAdminSupabaseClient();

  // Pre-calculate task suggestions: find users with overdue tasks and no pending high-priority tasks
  const today = new Date().toISOString().split('T')[0];

  const { data: overdueByUser } = await s
    .from('tasks')
    .select('user_id, title, due_date, priority')
    .lt('due_date', today)
    .eq('status', 'pending')
    .order('due_date', { ascending: true });

  // Group overdue tasks by user
  const userTasks: Record<string, any[]> = {};
  for (const task of overdueByUser ?? []) {
    if (!userTasks[task.user_id]) userTasks[task.user_id] = [];
    userTasks[task.user_id].push(task);
  }

  // Store as admin metrics for dashboard display
  const stats = {
    users_with_overdue: Object.keys(userTasks).length,
    total_overdue_tasks: overdueByUser?.length ?? 0,
    high_priority_overdue: (overdueByUser ?? []).filter((t: any) => t.priority === 'high').length,
  };

  await s.from('admin_metrics').insert({
    metric_key: 'smart_suggestions',
    metric_value: stats,
  });

  return NextResponse.json(stats);
}
