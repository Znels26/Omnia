import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { sendEmail, templates } from '@/lib/resend';

export const runtime = 'nodejs';
export const maxDuration = 60;

const IMPROVEMENTS = [
  'We shipped AI memory that remembers your preferences, smarter task suggestions, and a completely redesigned Life Hub with 22 tools.',
  'The Content Studio now supports 6 writing modes, the invoice builder has PDF exports, and AI responses are 3x faster.',
  'We added financial insights, fitness tracking, and habit streaks — plus a brand new onboarding experience to get you up to speed instantly.',
];

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const s = createAdminSupabaseClient();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const thirtyOneDaysAgo = new Date(Date.now() - 31 * 86400000).toISOString();

  // Find subscriptions that were cancelled exactly 30 days ago
  const { data: cancelledSubs } = await s
    .from('subscriptions')
    .select('user_id, profiles(email, display_name, full_name, email_notifications)')
    .eq('status', 'canceled')
    .gte('updated_at', thirtyOneDaysAgo)
    .lt('updated_at', thirtyDaysAgo);

  if (!cancelledSubs?.length) return NextResponse.json({ sent: 0 });

  let sent = 0;
  await Promise.allSettled(
    cancelledSubs.map(async (sub: any) => {
      const profile = sub.profiles;
      if (!profile?.email_notifications) return;

      const { data: already } = await s
        .from('cron_email_log')
        .select('id')
        .eq('user_id', sub.user_id)
        .eq('email_type', 'win_back')
        .maybeSingle();

      if (already) return;

      const name = profile.display_name || profile.full_name || 'there';
      const improvement = IMPROVEMENTS[Math.floor(Math.random() * IMPROVEMENTS.length)];

      await sendEmail({
        to: profile.email,
        subject: `${name}, a lot has changed at Omnia`,
        html: templates.winBack(name, improvement),
      });

      await s.from('cron_email_log').insert({ user_id: sub.user_id, email_type: 'win_back' });
      sent++;
    })
  );

  return NextResponse.json({ sent });
}
