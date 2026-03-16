import { redirect } from 'next/navigation';
import { getUser } from '@/lib/supabase/server';
import { AdminView } from '@/components/features/admin/AdminView';

const OWNER_EMAIL = 'zacharynelson96@gmail.com';

export const metadata = { title: 'Owner Dashboard — Omnia' };

export default async function AdminPage() {
  const user = await getUser();
  if (!user || user.email !== OWNER_EMAIL) redirect('/dashboard');
  return <AdminView />;
}
