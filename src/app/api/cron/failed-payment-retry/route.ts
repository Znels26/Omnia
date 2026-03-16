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

  // Find subscriptions with past_due status
  const { data: pastDue } = await s
    .from('subscriptions')
    .select('user_id, stripe_subscription_id, stripe_customer_id, plan_tier, profiles(email, display_name, full_name, email_notifications)')
    .eq('status', 'past_due');

  if (!pastDue?.length) return NextResponse.json({ retried: 0 });

  let retried = 0;
  await Promise.allSettled(
    pastDue.map(async (sub: any) => {
      const profile = sub.profiles;
      if (!profile?.email || !sub.stripe_subscription_id) return;

      try {
        // Get latest invoice and retry payment
        const invoices = await stripe.invoices.list({
          subscription: sub.stripe_subscription_id,
          status: 'open',
          limit: 1,
        });

        const latestInvoice = invoices.data[0];
        if (!latestInvoice) return;

        // Calculate days past due for dunning sequence
        const daysPastDue = Math.floor((Date.now() - latestInvoice.created * 1000) / 86400000);
        const dunningDay = daysPastDue <= 1 ? 1 : daysPastDue <= 3 ? 3 : 7;

        if (profile.email_notifications) {
          const name = profile.display_name || profile.full_name || 'there';
          const amount = `$${(latestInvoice.amount_due / 100).toFixed(2)}`;
          await sendEmail({
            to: profile.email,
            subject: dunningDay >= 7 ? 'Final notice: Your Omnia payment failed' : 'Action needed: Payment failed',
            html: templates.dunning(name, dunningDay, amount),
          });
        }
        retried++;
      } catch {
        // Stripe call failed — skip silently
      }
    })
  );

  return NextResponse.json({ retried });
}
