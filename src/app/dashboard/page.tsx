import { redirect } from 'next/navigation';
import { getUser, getProfile, createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server';
import { DashboardView } from '@/components/features/dashboard/DashboardView';
import { AppShell } from '@/components/layout/AppShell';

export const metadata = { title: 'Dashboard — Omnia' };

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect('/login');

  const admin = createAdminSupabaseClient();
  await admin.from('profiles').upsert({ id: user.id, email: user.email!, full_name: user.user_metadata?.full_name || '', display_name: user.user_metadata?.display_name || user.email!.split('@')[0] }, { onConflict: 'id' });
  await admin.from('usage_counters').upsert({ user_id: user.id }, { onConflict: 'user_id' });
  await admin.from('subscriptions').upsert({ user_id: user.id, plan_tier: 'free', status: 'active' }, { onConflict: 'user_id' });

  const profile = await getProfile();
  if (!profile) redirect('/login');

  const supabase = await createServerSupabaseClient();
  const [tasks, reminders, notes, chats, exps] = await Promise.all([
    supabase.from('tasks').select('*').eq('user_id', user.id).neq('status', 'completed').order('created_at', { ascending: false }).limit(5).then(r => r.data || []),
    supabase.from('reminders').select('*').eq('user_id', user.id).eq('status', 'pending').order('remind_at', { ascending: true }).limit(5).then(r => r.data || []),
    supabase.from('notes').select('*').eq('user_id', user.id).eq('is_archived', false).order('updated_at', { ascending: false }).limit(4).then(r => r.data || []),
    supabase.from('chats').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(4).then(r => r.data || []),
    supabase.from('exports').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(4).then(r => r.data || []),
  ]);
  const usage = await admin.from('usage_counters').select('*').eq('user_id', user.id).single().then(r => r.data);

  return (
    <AppShell profile={profile}>
      <DashboardView profile={profile} tasks={tasks} reminders={reminders} notes={notes} chats={chats} exports={exps} usage={usage} />
    </AppShell>
  );
}
