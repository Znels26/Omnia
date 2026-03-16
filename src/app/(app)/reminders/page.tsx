import { getUser, getProfile } from '@/lib/supabase/server';
import { getCachedReminders } from '@/lib/cache';
import { RemindersView } from '@/components/features/reminders/RemindersView';
export const metadata = { title: 'Reminders — Omnia' };
export default async function RemindersPage() {
  const [user, profile] = await Promise.all([getUser(), getProfile()]);
  if (!user || !profile) return null;
  const reminders = await getCachedReminders(user.id);
  return <RemindersView profile={profile} initialReminders={reminders} />;
}
