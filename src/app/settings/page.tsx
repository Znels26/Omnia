import { redirect } from 'next/navigation';
import { getUser, getProfile, createAdminSupabaseClient } from '@/lib/supabase/server';
import { SettingsView } from '@/components/features/settings/SettingsView';
import { AppShell } from '@/components/layout/AppShell';
export const metadata = { title: 'Settings — Omnia' };
export default async function SettingsPage() {
  const user = await getUser();
  if (!user) redirect('/login');
  const admin = createAdminSupabaseClient();
  await admin.from('profiles').upsert({ id: user.id, email: user.email! }, { onConflict: 'id' });
  const profile = await getProfile();
  if (!profile) redirect('/login');
  return <AppShell profile={profile}><SettingsView profile={profile} /></AppShell>;
}
