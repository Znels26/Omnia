import { getUser, getProfile, createServerSupabaseClient } from '@/lib/supabase/server';
import { RemindersView } from '@/components/features/reminders/RemindersView';
export const metadata = { title: 'Reminders — Omnia' };
export default async function RemindersPage() {
  const [user, profile] = await Promise.all([getUser(), getProfile()]);
  if (!user || !profile) return null;
  const supabase = await createServerSupabaseClient();
  const { data: reminders } = await supabase.from('reminders').select('*').eq('user_id', user.id).order('remind_at', { ascending: true });
  return <RemindersView profile={profile} initialReminders={reminders || []} />;
}
