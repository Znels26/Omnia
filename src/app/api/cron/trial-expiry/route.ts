import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { templates } from '@/lib/resend';
import { queueEmail } from '@/lib/email-scheduler';
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

  const { data: trials } = await s
    .from('subscriptions')
    .select('user_id, stripe_subscription_id, current_period_end, profiles(display_name, full_name)')
    .eq('status', 'trialing');

  if (!trials?.length) return NextResponse.json({ emailed: 0 });

  let emailed = 0;
  const now = Date.now();

  await Promise.allSettled(
    trials.map(async (trial: any) => {
      const profile = trial.profiles;
      if (!profile || !trial.current_period_end) return;

      const daysLeft = Math.ceil((new Date(trial.current_period_end).getTime() - now) / 86400000);
      if (daysLeft !== 2 && daysLeft !== 5) return;

      const emailType = `trial_expiry_${daysLeft}d`;
      const { data: already } = await s
        .from('cron_email_log')
        .select('id')
        .eq('user_id', trial.user_id)
        .eq('email_type', emailType)
        .maybeSingle();

      if (already) return;

      const name = profile.display_name || profile.full_name || 'there';
      await queueEmail({
        userId: trial.user_id,
        emailType: 'trial_expiry',
        priority: 1, // P1 — transactional
        subject: daysLeft === 2 ? 'Your Omnia trial ends in 2 days' : 'Your Omnia trial ends in 5 days',
        html: templates.trialExpiry(name, daysLeft),
      });

      await s.from('cron_email_log').insert({ user_id: trial.user_id, email_type: emailType });
      emailed++;
    })
  );

  return NextResponse.json({ emailed });
}
