import { redirect } from 'next/navigation';
import { getUser, getProfile, createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server';
import { ContentView } from '@/components/features/content/ContentView';
import { AppShell } from '@/components/layout/AppShell';
export const metadata = { title: 'Content Studio — Omnia' };
export default async function ContentStudioPage() {
  const user = await getUser();
  if (!user) redirect('/login');
  const admin = createAdminSupabaseClient();
  await admin.from('profiles').upsert({ id: user.id, email: user.email! }, { onConflict: 'id' });
  const profile = await getProfile();
  if (!profile) redirect('/login');
  const supabase = await createServerSupabaseClient();
  const { data: items } = await supabase.from('content_items').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
  return <AppShell profile={profile}><ContentView profile={profile} initialItems={items || []} /></AppShell>;
}
