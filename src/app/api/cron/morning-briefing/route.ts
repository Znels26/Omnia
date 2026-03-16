import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { sendEmail, templates } from '@/lib/resend';

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
    .select('id, email, display_name, full_name')
    .eq('email_notifications', true);

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

      await sendEmail({
        to: profile.email,
        subject: `Good morning! Your Omnia briefing for ${today}`,
        html: templates.morningBriefing(name, tasks || [], reminders || [], goals || []),
      });
      sent++;
    })
  );

  return NextResponse.json({ sent });
}
