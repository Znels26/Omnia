import { getUser, getProfile, createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server';
import { DashboardView } from '@/components/features/dashboard/DashboardView';
export const metadata = { title: 'Dashboard — Omnia' };
export default async function DashboardPage() {
  const [user, profile] = await Promise.all([getUser(), getProfile()]);
  if (!user || !profile) return null;
  const [supabase, admin] = [await createServerSupabaseClient(), createAdminSupabaseClient()];
  const [tasks, reminders, notes, chats, exps, usage] = await Promise.all([
    supabase.from('tasks').select('*').eq('user_id', user.id).neq('status', 'completed').order('created_at', { ascending: false }).limit(5).then(r => r.data || []),
    supabase.from('reminders').select('*').eq('user_id', user.id).eq('status', 'pending').order('remind_at', { ascending: true }).limit(5).then(r => r.data || []),
    supabase.from('notes').select('*').eq('user_id', user.id).eq('is_archived', false).order('updated_at', { ascending: false }).limit(4).then(r => r.data || []),
    supabase.from('chats').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(4).then(r => r.data || []),
    supabase.from('exports').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(4).then(r => r.data || []),
    admin.from('usage_counters').select('*').eq('user_id', user.id).single().then(r => r.data),
  ]);
  return <DashboardView profile={profile} tasks={tasks} reminders={reminders} notes={notes} chats={chats} exports={exps} usage={usage} />;
}
