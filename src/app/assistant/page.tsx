import { redirect } from 'next/navigation';
import { getUser, getProfile, createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server';
import { AssistantView } from '@/components/features/assistant/AssistantView';
import { AppShell } from '@/components/layout/AppShell';
export const metadata = { title: 'AI Assistant — Omnia' };
export default async function AssistantPage() {
  const user = await getUser();
  if (!user) redirect('/login');
  const admin = createAdminSupabaseClient();
  await admin.from('profiles').upsert({ id: user.id, email: user.email!, display_name: user.user_metadata?.display_name || user.email!.split('@')[0] }, { onConflict: 'id' });
  const profile = await getProfile();
  if (!profile) redirect('/login');
  const supabase = await createServerSupabaseClient();
  const { data: chats } = await supabase.from('chats').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
  return <AppShell profile={profile}><AssistantView profile={profile} initialChats={chats || []} /></AppShell>;
}
