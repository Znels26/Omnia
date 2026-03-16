import { getUser, getProfile } from '@/lib/supabase/server';
import { getCachedContent } from '@/lib/cache';
import { ContentView } from '@/components/features/content/ContentView';
export const metadata = { title: 'Content Studio — Omnia' };
export default async function ContentStudioPage() {
  const [user, profile] = await Promise.all([getUser(), getProfile()]);
  if (!user || !profile) return null;
  const items = await getCachedContent(user.id);
  return <ContentView profile={profile} initialItems={items} />;
}
