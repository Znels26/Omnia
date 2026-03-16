import { getUser, getProfile } from '@/lib/supabase/server';
import { getCachedDashboard } from '@/lib/cache';
import { DashboardView } from '@/components/features/dashboard/DashboardView';
export const metadata = { title: 'Dashboard — Omnia' };
export default async function DashboardPage() {
  const [user, profile] = await Promise.all([getUser(), getProfile()]);
  if (!user || !profile) return null;
  const { tasks, reminders, notes, chats, exports, usage } = await getCachedDashboard(user.id);
  return <DashboardView profile={profile} tasks={tasks} reminders={reminders} notes={notes} chats={chats} exports={exports} usage={usage} />;
}
