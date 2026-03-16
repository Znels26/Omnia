import { getUser, getProfile, createServerSupabaseClient } from '@/lib/supabase/server';
import { InvoicesView } from '@/components/features/invoices/InvoicesView';
export const metadata = { title: 'Invoices — Omnia' };
export default async function InvoicesPage() {
  const [user, profile] = await Promise.all([getUser(), getProfile()]);
  if (!user || !profile) return null;
  const supabase = await createServerSupabaseClient();
  const { data: invoices } = await supabase.from('invoices').select('*, items:invoice_items(*)').eq('user_id', user.id).order('created_at', { ascending: false });
  return <InvoicesView profile={profile} initialInvoices={invoices || []} />;
}
