import { getUser, getProfile } from '@/lib/supabase/server';
import { getCachedSubscription } from '@/lib/cache';
import { BillingView } from '@/components/features/billing/BillingView';
export const metadata = { title: 'Billing — Omnia' };
export default async function BillingPage() {
  const [user, profile] = await Promise.all([getUser(), getProfile()]);
  if (!user || !profile) return null;
  const sub = await getCachedSubscription(user.id);
  return <BillingView profile={profile} subscription={sub} />;
}
