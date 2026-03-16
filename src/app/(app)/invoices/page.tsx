import { getUser, getProfile } from '@/lib/supabase/server';
import { getCachedInvoices } from '@/lib/cache';
import { InvoicesView } from '@/components/features/invoices/InvoicesView';
export const metadata = { title: 'Invoices — Omnia' };
export default async function InvoicesPage() {
  const [user, profile] = await Promise.all([getUser(), getProfile()]);
  if (!user || !profile) return null;
  const invoices = await getCachedInvoices(user.id);
  return <InvoicesView profile={profile} initialInvoices={invoices} />;
}
