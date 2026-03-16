import { getUser, getProfile, createServerSupabaseClient } from '@/lib/supabase/server';
import { ContentView } from '@/components/features/content/ContentView';
export const metadata = { title: 'Content Studio — Omnia' };
export default async function ContentStudioPage() {
  const [user, profile] = await Promise.all([getUser(), getProfile()]);
  if (!user || !profile) return null;
  const supabase = await createServerSupabaseClient();
  const { data: items } = await supabase.from('content_items').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
  return <ContentView profile={profile} initialItems={items || []} />;
}
