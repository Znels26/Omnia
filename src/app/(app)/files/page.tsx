import { getUser, getProfile } from '@/lib/supabase/server';
import { getCachedFiles } from '@/lib/cache';
import { FilesView } from '@/components/features/files/FilesView';
export const metadata = { title: 'Files — Omnia' };
export default async function FilesPage() {
  const [user, profile] = await Promise.all([getUser(), getProfile()]);
  if (!user || !profile) return null;
  const files = await getCachedFiles(user.id);
  return <FilesView profile={profile} initialFiles={files} />;
}
