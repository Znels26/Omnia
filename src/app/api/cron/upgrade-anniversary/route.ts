import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { sendEmail, templates } from '@/lib/resend';

export const runtime = 'nodejs';
export const maxDuration = 60;

const BONUS_TIPS = [
  'Try the AI memory feature — tell Omnia your preferences once and it will remember them across every conversation.',
  'Use the /task command in AI chat to instantly create tasks from your conversation without switching views.',
  'The weekly review email gives you an AI-generated summary of your progress every Sunday at 7pm.',
  'You can export any note, task list, or invoice to PDF directly from the action menu.',
  'Chain habits together in the Life Hub for more powerful routine tracking.',
];

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const s = createAdminSupabaseClient();
  const today = new Date();
  const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()).toISOString().split('T')[0];

  // Find subscriptions created exactly 1 year ago
  const { data: anniversarySubs } = await s
    .from('subscriptions')
    .select('user_id, plan_tier, profiles(email, display_name, full_name, email_notifications)')
    .neq('plan_tier', 'free')
    .gte('created_at', oneYearAgo + 'T00:00:00Z')
    .lt('created_at', oneYearAgo + 'T23:59:59Z');

  if (!anniversarySubs?.length) return NextResponse.json({ sent: 0 });

  let sent = 0;
  await Promise.allSettled(
    anniversarySubs.map(async (sub: any) => {
      const profile = sub.profiles;
      if (!profile?.email_notifications) return;

      const { data: already } = await s
        .from('cron_email_log')
        .select('id')
        .eq('user_id', sub.user_id)
        .eq('email_type', `anniversary_${oneYearAgo}`)
        .maybeSingle();

      if (already) return;

      const name = profile.display_name || profile.full_name || 'there';
      const tip = BONUS_TIPS[Math.floor(Math.random() * BONUS_TIPS.length)];

      await sendEmail({
        to: profile.email,
        subject: `Happy 1-year anniversary, ${name}! 🎂`,
        html: templates.upgradeAnniversary(name, sub.plan_tier, tip),
      });

      await s.from('cron_email_log').insert({ user_id: sub.user_id, email_type: `anniversary_${oneYearAgo}` });
      sent++;
    })
  );

  return NextResponse.json({ sent });
}
