import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
export const runtime = 'nodejs';
export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeKey || !webhookSecret) return NextResponse.json({ error: 'Stripe not configured' }, { status: 400 });
  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 });
  let event: any;
  try { event = stripe.webhooks.constructEvent(body, sig, webhookSecret); }
  catch { return NextResponse.json({ error: 'Invalid signature' }, { status: 400 }); }
  const s = createAdminSupabaseClient();
  const PRICE_TO_PLAN: Record<string, string> = {
    [process.env.STRIPE_PLUS_PRICE_ID_MONTHLY || '']: 'plus',
    [process.env.STRIPE_PLUS_PRICE_ID_YEARLY || '']: 'plus',
    [process.env.STRIPE_PRO_PRICE_ID_MONTHLY || '']: 'pro',
    [process.env.STRIPE_PRO_PRICE_ID_YEARLY || '']: 'pro',
  };
  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.created') {
    const sub = event.data.object;
    const userId = sub.metadata?.omnia_user_id;
    if (userId) {
      const tier = PRICE_TO_PLAN[sub.items.data[0]?.price.id] || 'free';
      await s.from('subscriptions').upsert({ user_id: userId, stripe_subscription_id: sub.id, plan_tier: tier, status: sub.status, current_period_end: new Date(sub.current_period_end * 1000).toISOString() }, { onConflict: 'user_id' });
      await s.from('profiles').update({ plan_tier: tier }).eq('id', userId);
    }
  }
  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    const userId = sub.metadata?.omnia_user_id;
    if (userId) {
      await s.from('subscriptions').update({ plan_tier: 'free', status: 'canceled' }).eq('user_id', userId);
      await s.from('profiles').update({ plan_tier: 'free' }).eq('id', userId);
    }
  }
  return NextResponse.json({ received: true });
}
