import { redirect } from 'next/navigation';
import { getUser, getProfile, createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server';
import { InvoicesView } from '@/components/features/invoices/InvoicesView';
import { AppShell } from '@/components/layout/AppShell';
export const metadata = { title: 'Invoices — Omnia' };
export default async function InvoicesPage() {
  const user = await getUser();
  if (!user) redirect('/login');
  const admin = createAdminSupabaseClient();
  await admin.from('profiles').upsert({ id: user.id, email: user.email! }, { onConflict: 'id' });
  const profile = await getProfile();
  if (!profile) redirect('/login');
  const supabase = await createServerSupabaseClient();
  const { data: invoices } = await supabase.from('invoices').select('*, items:invoice_items(*)').eq('user_id', user.id).order('created_at', { ascending: false });
  return <AppShell profile={profile}><InvoicesView profile={profile} initialInvoices={invoices || []} /></AppShell>;
}
