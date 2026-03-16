import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { sendEmail, templates } from '@/lib/resend';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const s = createAdminSupabaseClient();
  const in7Days = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  // Alert 7 days and 1 day before renewal
  const { data: subs } = await s
    .from('subscriptions')
    .select('user_id, plan_tier, current_period_end, profiles(email, display_name, full_name, email_notifications)')
    .neq('plan_tier', 'free')
    .eq('status', 'active')
    .eq('cancel_at_period_end', false);

  if (!subs?.length) return NextResponse.json({ sent: 0 });

  let sent = 0;
  await Promise.allSettled(
    subs.map(async (sub: any) => {
      const profile = sub.profiles;
      if (!profile?.email_notifications || !sub.current_period_end) return;

      const renewalDay = sub.current_period_end.split('T')[0];
      if (renewalDay !== in7Days && renewalDay !== tomorrow) return;

      const planPrices: Record<string, string> = { plus: '$19/mo', pro: '$49/mo' };
      const name = profile.display_name || profile.full_name || 'there';
      const renewalDate = new Date(sub.current_period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

      await sendEmail({
        to: profile.email,
        subject: `Your Omnia ${sub.plan_tier} plan renews ${renewalDay === tomorrow ? 'tomorrow' : 'in 7 days'}`,
        html: templates.subscriptionAlert(name, sub.plan_tier, renewalDate, planPrices[sub.plan_tier] || ''),
      });
      sent++;
    })
  );

  return NextResponse.json({ sent });
}
