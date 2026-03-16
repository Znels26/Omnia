import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

export const runtime = 'nodejs';
export const maxDuration = 60;

const TIER_MAP: Record<string, string> = {
  [process.env.STRIPE_PLUS_PRICE_ID_MONTHLY ?? '']: 'plus',
  [process.env.STRIPE_PLUS_PRICE_ID_YEARLY ?? '']: 'plus',
  [process.env.STRIPE_PRO_PRICE_ID_MONTHLY ?? '']: 'pro',
  [process.env.STRIPE_PRO_PRICE_ID_YEARLY ?? '']: 'pro',
};

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ skipped: 'no stripe' });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-01-27.acacia' });
  const s = createAdminSupabaseClient();

  const { data: subs } = await s
    .from('subscriptions')
    .select('user_id, stripe_subscription_id, plan_tier, status')
    .not('stripe_subscription_id', 'is', null);

  if (!subs?.length) return NextResponse.json({ synced: 0 });

  let synced = 0;
  let mismatches = 0;

  await Promise.allSettled(
    subs.map(async (sub) => {
      if (!sub.stripe_subscription_id) return;
      try {
        const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
        const priceId = stripeSub.items.data[0]?.price.id ?? '';
        const correctTier = TIER_MAP[priceId] ?? 'free';
        const correctStatus = stripeSub.status;

        if (sub.plan_tier !== correctTier || sub.status !== correctStatus) {
          await s.from('subscriptions').update({
            plan_tier: correctTier,
            status: correctStatus,
            current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          }).eq('user_id', sub.user_id);

          await s.from('profiles').update({ plan_tier: correctTier }).eq('id', sub.user_id);
          mismatches++;
        }
        synced++;
      } catch {
        // Subscription may have been deleted from Stripe
      }
    })
  );

  return NextResponse.json({ synced, mismatches });
}
