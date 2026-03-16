import { getUser, getProfile } from '@/lib/supabase/server';
import { getCachedPlanner } from '@/lib/cache';
import { PlannerView } from '@/components/features/planner/PlannerView';
export const metadata = { title: 'Planner — Omnia' };
export default async function PlannerPage() {
  const [user, profile] = await Promise.all([getUser(), getProfile()]);
  if (!user || !profile) return null;
  const { tasks, goals, habits } = await getCachedPlanner(user.id);
  return <PlannerView profile={profile} initialTasks={tasks} initialGoals={goals} initialHabits={habits} />;
}
