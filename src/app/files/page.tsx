import { redirect } from 'next/navigation';
import { getUser, getProfile, createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server';
import { FilesView } from '@/components/features/files/FilesView';
import { AppShell } from '@/components/layout/AppShell';
export const metadata = { title: 'Files — Omnia' };
export default async function FilesPage() {
  const user = await getUser();
  if (!user) redirect('/login');
  const admin = createAdminSupabaseClient();
  await admin.from('profiles').upsert({ id: user.id, email: user.email! }, { onConflict: 'id' });
  const profile = await getProfile();
  if (!profile) redirect('/login');
  const supabase = await createServerSupabaseClient();
  const { data: files } = await supabase.from('files').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
  return <AppShell profile={profile}><FilesView profile={profile} initialFiles={files || []} /></AppShell>;
}
