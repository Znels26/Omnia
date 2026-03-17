import { getUser, getProfile, createAdminSupabaseClient } from '@/lib/supabase/server';
import { getCachedDashboard } from '@/lib/cache';
import { DashboardView } from '@/components/features/dashboard/DashboardView';
export const metadata = { title: 'Dashboard — Omnia' };
export default async function DashboardPage() {
  const [user, profile] = await Promise.all([getUser(), getProfile()]);
  if (!user || !profile) return null;
  const supabase = createAdminSupabaseClient();
  const [{ tasks, reminders, notes, chats, exports, usage }, { data: autopilotProfile }] = await Promise.all([
    getCachedDashboard(user.id),
    supabase.from('user_autopilot_profile').select('*').eq('user_id', user.id).maybeSingle(),
  ]);
  return <DashboardView profile={profile} tasks={tasks} reminders={reminders} notes={notes} chats={chats} exports={exports} usage={usage} autopilotProfile={autopilotProfile} />;
}
