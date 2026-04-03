import { NextRequest, NextResponse } from 'next/server';
import { getUser, createAdminSupabaseClient } from '@/lib/supabase/server';
export async function POST(req: NextRequest) {
  const user = await getUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return NextResponse.json({ error: 'Stripe not configured yet. Add STRIPE_SECRET_KEY to enable billing.' }, { status: 503 });
  const { tier, interval = 'monthly', promoCode } = await req.json();
  const priceIds: any = { plus: { monthly: process.env.STRIPE_PLUS_PRICE_ID_MONTHLY, yearly: process.env.STRIPE_PLUS_PRICE_ID_YEARLY }, pro: { monthly: process.env.STRIPE_PRO_PRICE_ID_MONTHLY, yearly: process.env.STRIPE_PRO_PRICE_ID_YEARLY } };
  const priceId = priceIds[tier]?.[interval === 'yearly' ? 'yearly' : 'monthly'];
  if (!priceId) return NextResponse.json({ error: 'Price ID not configured. Add Stripe price IDs to environment variables.' }, { status: 503 });
  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });
  const s = createAdminSupabaseClient();
  const { data: profile } = await s.from('profiles').select('email').eq('id', user.id).single();
  const { data: sub } = await s.from('subscriptions').select('stripe_customer_id').eq('user_id', user.id).single();
  let customerId = sub?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: profile?.email || user.email!, metadata: { omnia_user_id: user.id } });
    customerId = customer.id;
    await s.from('subscriptions').upsert({ user_id: user.id, stripe_customer_id: customerId }, { onConflict: 'user_id' });
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Resolve promo code to a Stripe promotion code ID
  let discounts: { promotion_code: string }[] | undefined;
  if (promoCode && typeof promoCode === 'string') {
    try {
      const codes = await stripe.promotionCodes.list({ code: promoCode.trim().toUpperCase(), active: true, limit: 1 });
      if (codes.data.length > 0) discounts = [{ promotion_code: codes.data[0].id }];
    } catch { /* ignore lookup errors, proceed without discount */ }
  }

  const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/billing?success=true`,
    cancel_url: `${appUrl}/billing`,
    subscription_data: { trial_period_days: 7 },
    metadata: { omnia_user_id: user.id },
    ...(discounts ? { discounts } : { allow_promotion_codes: true }),
  };

  const session = await stripe.checkout.sessions.create(sessionParams);
  return NextResponse.json({ url: session.url });
}
