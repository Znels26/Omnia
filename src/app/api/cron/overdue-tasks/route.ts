import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { templates } from '@/lib/resend';
import { queueEmail } from '@/lib/email-scheduler';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const s = createAdminSupabaseClient();
  const today = new Date().toISOString().split('T')[0];

  const { data: profiles } = await s.from('profiles').select('id, display_name, full_name');
  if (!profiles?.length) return NextResponse.json({ sent: 0 });

  let sent = 0;
  await Promise.allSettled(
    profiles.map(async (profile) => {
      const { data: tasks } = await s
        .from('tasks')
        .select('title, due_date, priority')
        .eq('user_id', profile.id)
        .eq('status', 'pending')
        .lt('due_date', today)
        .not('due_date', 'is', null)
        .order('due_date');

      if (!tasks?.length) return;

      await queueEmail({
        userId: profile.id,
        emailType: 'overdue_tasks',
        priority: 2,
        subject: `You have ${tasks.length} overdue task${tasks.length > 1 ? 's' : ''} — Omnia`,
        html: templates.overdueTasks(profile.display_name || 'there', tasks),
      });
      sent++;
    })
  );

  return NextResponse.json({ sent });
}
