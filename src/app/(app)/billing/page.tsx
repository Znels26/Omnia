import { getUser, getProfile, createServerSupabaseClient } from '@/lib/supabase/server';
import { BillingView } from '@/components/features/billing/BillingView';
export const metadata = { title: 'Billing — Omnia' };
export default async function BillingPage() {
  const [user, profile] = await Promise.all([getUser(), getProfile()]);
  if (!user || !profile) return null;
  const supabase = await createServerSupabaseClient();
  const { data: sub } = await supabase.from('subscriptions').select('*').eq('user_id', user.id).single();
  return <BillingView profile={profile} subscription={sub} />;
}
