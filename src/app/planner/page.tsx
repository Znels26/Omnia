import { redirect } from 'next/navigation';
import { getUser, getProfile, createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server';
import { PlannerView } from '@/components/features/planner/PlannerView';
import { AppShell } from '@/components/layout/AppShell';
export const metadata = { title: 'Planner — Omnia' };
export default async function PlannerPage() {
  const user = await getUser();
  if (!user) redirect('/login');
  const admin = createAdminSupabaseClient();
  await admin.from('profiles').upsert({ id: user.id, email: user.email! }, { onConflict: 'id' });
  const profile = await getProfile();
  if (!profile) redirect('/login');
  const supabase = await createServerSupabaseClient();
  const [{ data: tasks }, { data: goals }, { data: habits }] = await Promise.all([
    supabase.from('tasks').select('*').eq('user_id', user.id).order('sort_order').order('created_at', { ascending: false }),
    supabase.from('goals').select('*').eq('user_id', user.id).eq('is_completed', false).order('created_at'),
    supabase.from('habits').select('*').eq('user_id', user.id).order('created_at'),
  ]);
  return <AppShell profile={profile}><PlannerView profile={profile} initialTasks={tasks || []} initialGoals={goals || []} initialHabits={habits || []} /></AppShell>;
}
