import { getUser, getProfile, createServerSupabaseClient } from '@/lib/supabase/server';
import { PlannerView } from '@/components/features/planner/PlannerView';
export const metadata = { title: 'Planner — Omnia' };
export default async function PlannerPage() {
  const [user, profile] = await Promise.all([getUser(), getProfile()]);
  if (!user || !profile) return null;
  const supabase = await createServerSupabaseClient();
  const [{ data: tasks }, { data: goals }, { data: habits }] = await Promise.all([
    supabase.from('tasks').select('*').eq('user_id', user.id).order('sort_order').order('created_at', { ascending: false }),
    supabase.from('goals').select('*').eq('user_id', user.id).eq('is_completed', false).order('created_at'),
    supabase.from('habits').select('*').eq('user_id', user.id).order('created_at'),
  ]);
  return <PlannerView profile={profile} initialTasks={tasks || []} initialGoals={goals || []} initialHabits={habits || []} />;
}
