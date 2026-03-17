import { getUser, getProfile, createAdminSupabaseClient } from '@/lib/supabase/server';
import { AutopilotView } from '@/components/features/autopilot/AutopilotView';

export const metadata = { title: 'Autopilot — Omnia' };

export default async function AutopilotPage() {
  const [user, profile] = await Promise.all([getUser(), getProfile()]);
  if (!user || !profile) return null;

  const supabase = createAdminSupabaseClient();

  const [
    { data: autopilotProfile },
    { data: actions },
    { data: opportunities },
    { data: log },
  ] = await Promise.all([
    supabase
      .from('user_autopilot_profile')
      .select('*')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('autopilot_actions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('opportunity_queue')
      .select('*')
      .eq('user_id', user.id)
      .neq('status', 'dismissed')
      .order('relevance_score', { ascending: false })
      .limit(10),
    supabase
      .from('autopilot_log')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  return (
    <AutopilotView
      profile={profile}
      autopilotProfile={autopilotProfile}
      actions={actions ?? []}
      opportunities={opportunities ?? []}
      log={log ?? []}
    />
  );
}
