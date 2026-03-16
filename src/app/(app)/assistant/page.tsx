import { getUser, getProfile, createServerSupabaseClient } from '@/lib/supabase/server';
import { AssistantView } from '@/components/features/assistant/AssistantView';
export const metadata = { title: 'AI Assistant — Omnia' };
export default async function AssistantPage() {
  const [user, profile] = await Promise.all([getUser(), getProfile()]);
  if (!user || !profile) return null;
  const supabase = await createServerSupabaseClient();
  const { data: chats } = await supabase.from('chats').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
  return <AssistantView profile={profile} initialChats={chats || []} />;
}
