import { redirect } from 'next/navigation';
import { getUser, getProfile, createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server';
import { BillingView } from '@/components/features/billing/BillingView';
import { AppShell } from '@/components/layout/AppShell';
export const metadata = { title: 'Billing — Omnia' };
export default async function BillingPage() {
  const user = await getUser();
  if (!user) redirect('/login');
  const admin = createAdminSupabaseClient();
  await admin.from('profiles').upsert({ id: user.id, email: user.email! }, { onConflict: 'id' });
  const profile = await getProfile();
  if (!profile) redirect('/login');
  const supabase = await createServerSupabaseClient();
  const { data: sub } = await supabase.from('subscriptions').select('*').eq('user_id', user.id).single();
  return <AppShell profile={profile}><BillingView profile={profile} subscription={sub} /></AppShell>;
}
