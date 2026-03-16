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

  const { data: subs } = await s
    .from('subscriptions')
    .select('user_id, stripe_subscription_id, profiles(display_name, full_name)')
    .in('status', ['past_due', 'unpaid']);

  if (!subs?.length) return NextResponse.json({ emailed: 0 });

  let emailed = 0;
  await Promise.allSettled(
    subs.map(async (sub: any) => {
      const profile = sub.profiles;
      if (!profile) return;

      try {
        const invoices = await stripe.invoices.list({
          subscription: sub.stripe_subscription_id,
          status: 'open',
          limit: 1,
        });
        const inv = invoices.data[0];
        if (!inv) return;

        const daysPastDue = Math.floor((Date.now() - inv.created * 1000) / 86400000);
        if (![1, 3, 7].includes(daysPastDue)) return;

        const name = profile.display_name || profile.full_name || 'there';
        const amount = `$${(inv.amount_due / 100).toFixed(2)}`;

        await queueEmail({
          userId: sub.user_id,
          emailType: 'dunning',
          priority: 1, // P1 — transactional, bypasses all limits
          subject: daysPastDue >= 7 ? 'Final notice: Payment required' : `Payment failed — day ${daysPastDue}`,
          html: templates.dunning(name, daysPastDue, amount),
        });
        emailed++;
      } catch {
        // Skip
      }
    })
  );

  return NextResponse.json({ emailed });
}
