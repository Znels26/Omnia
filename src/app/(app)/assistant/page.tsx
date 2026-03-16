import { getUser, getProfile } from '@/lib/supabase/server';
import { getCachedChats } from '@/lib/cache';
import { AssistantView } from '@/components/features/assistant/AssistantView';
export const metadata = { title: 'AI Assistant — Omnia' };
export default async function AssistantPage() {
  const [user, profile] = await Promise.all([getUser(), getProfile()]);
  if (!user || !profile) return null;
  const chats = await getCachedChats(user.id);
  return <AssistantView profile={profile} initialChats={chats} />;
}
