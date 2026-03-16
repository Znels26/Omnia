import { getUser, getProfile } from '@/lib/supabase/server';
import { getCachedNotes } from '@/lib/cache';
import { NotesView } from '@/components/features/notes/NotesView';
export const metadata = { title: 'Notes — Omnia' };
export default async function NotesPage() {
  const [user, profile] = await Promise.all([getUser(), getProfile()]);
  if (!user || !profile) return null;
  const { notes, folders } = await getCachedNotes(user.id);
  return <NotesView profile={profile} initialNotes={notes} initialFolders={folders} />;
}
