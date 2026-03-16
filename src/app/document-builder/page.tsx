import { redirect } from 'next/navigation';
import { getUser, getProfile, createAdminSupabaseClient } from '@/lib/supabase/server';
import { DocumentBuilderView } from '@/components/features/documents/DocumentBuilderView';
import { AppShell } from '@/components/layout/AppShell';
export const metadata = { title: 'Document Builder — Omnia' };
export default async function DocumentBuilderPage() {
  const user = await getUser();
  if (!user) redirect('/login');
  const admin = createAdminSupabaseClient();
  await admin.from('profiles').upsert({ id: user.id, email: user.email! }, { onConflict: 'id' });
  const profile = await getProfile();
  if (!profile) redirect('/login');
  return <AppShell profile={profile}><DocumentBuilderView profile={profile} /></AppShell>;
}
