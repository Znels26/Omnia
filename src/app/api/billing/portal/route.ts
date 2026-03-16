import { NextResponse } from 'next/server';
import { getUser, createAdminSupabaseClient } from '@/lib/supabase/server';
export async function POST() {
  const user = await getUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  const s = createAdminSupabaseClient();
  const { data: sub } = await s.from('subscriptions').select('stripe_customer_id').eq('user_id', user.id).single();
  if (!sub?.stripe_customer_id) return NextResponse.json({ error: 'No billing account found' }, { status: 404 });
  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });
  const session = await stripe.billingPortal.sessions.create({ customer: sub.stripe_customer_id, return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/billing` });
  return NextResponse.json({ url: session.url });
}
