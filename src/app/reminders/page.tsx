import { redirect } from 'next/navigation';
import { getUser, getProfile, createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server';
import { RemindersView } from '@/components/features/reminders/RemindersView';
import { AppShell } from '@/components/layout/AppShell';
export const metadata = { title: 'Reminders — Omnia' };
export default async function RemindersPage() {
  const user = await getUser();
  if (!user) redirect('/login');
  const admin = createAdminSupabaseClient();
  await admin.from('profiles').upsert({ id: user.id, email: user.email! }, { onConflict: 'id' });
  const profile = await getProfile();
  if (!profile) redirect('/login');
  const supabase = await createServerSupabaseClient();
  const { data: reminders } = await supabase.from('reminders').select('*').eq('user_id', user.id).order('remind_at', { ascending: true });
  return <AppShell profile={profile}><RemindersView profile={profile} initialReminders={reminders || []} /></AppShell>;
}
