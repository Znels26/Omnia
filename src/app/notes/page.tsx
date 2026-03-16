import { redirect } from 'next/navigation';
import { getUser, getProfile, createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase/server';
import { NotesView } from '@/components/features/notes/NotesView';
import { AppShell } from '@/components/layout/AppShell';
export const metadata = { title: 'Notes — Omnia' };
export default async function NotesPage() {
  const user = await getUser();
  if (!user) redirect('/login');
  const admin = createAdminSupabaseClient();
  await admin.from('profiles').upsert({ id: user.id, email: user.email! }, { onConflict: 'id' });
  const profile = await getProfile();
  if (!profile) redirect('/login');
  const supabase = await createServerSupabaseClient();
  const [{ data: notes }, { data: folders }] = await Promise.all([
    supabase.from('notes').select('*').eq('user_id', user.id).eq('is_archived', false).order('is_pinned', { ascending: false }).order('updated_at', { ascending: false }).limit(100),
    supabase.from('note_folders').select('*').eq('user_id', user.id),
  ]);
  return <AppShell profile={profile}><NotesView profile={profile} initialNotes={notes || []} initialFolders={folders || []} /></AppShell>;
}
