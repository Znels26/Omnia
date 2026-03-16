import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { sendEmail, templates } from '@/lib/resend';
import Stripe from 'stripe';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ skipped: 'no stripe' });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-01-27.acacia' });
  const s = createAdminSupabaseClient();

  // Get trialing subscriptions
  const { data: trials } = await s
    .from('subscriptions')
    .select('user_id, stripe_subscription_id, current_period_end, profiles(email, display_name, full_name, email_notifications)')
    .eq('status', 'trialing');

  if (!trials?.length) return NextResponse.json({ emailed: 0 });

  let emailed = 0;
  const now = Date.now();

  await Promise.allSettled(
    trials.map(async (trial: any) => {
      const profile = trial.profiles;
      if (!profile?.email || !profile.email_notifications || !trial.current_period_end) return;

      const trialEnd = new Date(trial.current_period_end).getTime();
      const daysLeft = Math.ceil((trialEnd - now) / 86400000);

      // Send on day 5 remaining (2 days warning) and day 2 remaining (last chance)
      if (daysLeft !== 2 && daysLeft !== 5) return;

      // Check we haven't sent this specific reminder
      const emailType = `trial_expiry_${daysLeft}d`;
      const { data: already } = await s
        .from('cron_email_log')
        .select('id')
        .eq('user_id', trial.user_id)
        .eq('email_type', emailType)
        .maybeSingle();

      if (already) return;

      const name = profile.display_name || profile.full_name || 'there';
      await sendEmail({
        to: profile.email,
        subject: daysLeft === 2 ? 'Last chance: Your Omnia trial ends in 2 days' : 'Your Omnia trial ends in 5 days',
        html: templates.trialExpiry(name, daysLeft),
      });

      await s.from('cron_email_log').insert({ user_id: trial.user_id, email_type: emailType });
      emailed++;
    })
  );

  return NextResponse.json({ emailed });
}
