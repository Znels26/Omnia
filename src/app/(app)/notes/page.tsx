import { getUser, getProfile, createServerSupabaseClient } from '@/lib/supabase/server';
import { NotesView } from '@/components/features/notes/NotesView';
export const metadata = { title: 'Notes — Omnia' };
export default async function NotesPage() {
  const [user, profile] = await Promise.all([getUser(), getProfile()]);
  if (!user || !profile) return null;
  const supabase = await createServerSupabaseClient();
  const [{ data: notes }, { data: folders }] = await Promise.all([
    supabase.from('notes').select('*').eq('user_id', user.id).eq('is_archived', false).order('is_pinned', { ascending: false }).order('updated_at', { ascending: false }).limit(100),
    supabase.from('note_folders').select('*').eq('user_id', user.id),
  ]);
  return <NotesView profile={profile} initialNotes={notes || []} initialFolders={folders || []} />;
}
