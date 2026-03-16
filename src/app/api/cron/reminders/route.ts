import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { templates } from '@/lib/resend';
import { queueEmail } from '@/lib/email-scheduler';
import { sendPushNow } from '@/lib/push-scheduler';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const s = createAdminSupabaseClient();
  const now = new Date();
  const windowStart = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
  const windowEnd = now.toISOString();

  // Fetch reminders that fire within this 15-min window
  const { data: reminders } = await s
    .from('reminders')
    .select('id, user_id, title, description, recurrence, remind_at, profiles(display_name, full_name)')
    .eq('status', 'pending')
    .gte('remind_at', windowStart)
    .lte('remind_at', windowEnd);

  if (!reminders?.length) return NextResponse.json({ fired: 0 });

  let fired = 0;
  await Promise.allSettled(
    reminders.map(async (r: any) => {
      const profile = r.profiles;
      const name = profile?.display_name || profile?.full_name || 'there';

      // Push first (priority 1 — urgent, bypasses queue and sends immediately)
      await sendPushNow(
        r.user_id,
        `Reminder: ${r.title}`,
        r.description || 'Tap to open Omnia',
        '/reminders'
      );

      await queueEmail({
        userId: r.user_id,
        emailType: 'reminder',
        priority: 2,
        subject: `Reminder: ${r.title}`,
        html: templates.reminder(name, r.title, r.description),
      });

      // Mark as dismissed
      await s.from('reminders').update({ status: 'dismissed' }).eq('id', r.id);

      // If recurring, create next occurrence
      if (r.recurrence && r.recurrence !== 'once') {
        const nextDate = new Date(r.remind_at);
        if (r.recurrence === 'daily') nextDate.setDate(nextDate.getDate() + 1);
        if (r.recurrence === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
        if (r.recurrence === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
        await s.from('reminders').insert({
          user_id: r.user_id,
          title: r.title,
          description: r.description,
          remind_at: nextDate.toISOString(),
          recurrence: r.recurrence,
          status: 'pending',
        });
      }

      fired++;
    })
  );

  return NextResponse.json({ fired });
}
