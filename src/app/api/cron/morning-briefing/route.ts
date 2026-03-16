import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { templates } from '@/lib/resend';
import { queueEmail } from '@/lib/email-scheduler';
import { queuePush } from '@/lib/push-scheduler';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const s = createAdminSupabaseClient();
  const today = new Date().toISOString().split('T')[0];

  const { data: profiles } = await s
    .from('profiles')
    .select('id, display_name, full_name');

  if (!profiles?.length) return NextResponse.json({ sent: 0 });

  let sent = 0;
  await Promise.allSettled(
    profiles.map(async (profile) => {
      const name = profile.display_name || profile.full_name || 'there';
      const [{ data: tasks }, { data: reminders }, { data: goals }] = await Promise.all([
        s.from('tasks').select('title, priority').eq('user_id', profile.id).eq('scheduled_date', today).eq('status', 'pending').order('priority'),
        s.from('reminders').select('title').eq('user_id', profile.id).eq('status', 'pending').gte('remind_at', today + 'T00:00:00Z').lte('remind_at', today + 'T23:59:59Z'),
        s.from('goals').select('title, progress').eq('user_id', profile.id).eq('is_completed', false).order('created_at').limit(3),
      ]);

      if (!tasks?.length && !reminders?.length && !goals?.length) return;

      // Push notification (priority 3 — informational, respects daily limit)
      const taskCount      = tasks?.length    ?? 0;
      const reminderCount  = reminders?.length ?? 0;
      const pushBodyParts: string[] = [];
      if (taskCount)     pushBodyParts.push(`${taskCount} task${taskCount     !== 1 ? 's' : ''}`);
      if (reminderCount) pushBodyParts.push(`${reminderCount} reminder${reminderCount !== 1 ? 's' : ''}`);

      await queuePush({
        userId:   profile.id,
        type:     'morning_briefing',
        priority: 3,
        title:    `Good morning, ${name}! ☀️`,
        body:     pushBodyParts.length
          ? `You have ${pushBodyParts.join(' and ')} today.`
          : `Your Omnia briefing is ready for ${today}.`,
        url:      '/dashboard',
      });

      await queueEmail({
        userId: profile.id,
        emailType: 'morning_briefing',
        priority: 2,
        subject: `Good morning! Your Omnia briefing for ${today}`,
        html: templates.morningBriefing(name, tasks || [], reminders || [], goals || []),
      });
      sent++;
    })
  );

  return NextResponse.json({ sent });
}
