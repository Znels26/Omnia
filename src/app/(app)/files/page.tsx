import { getUser, getProfile, createServerSupabaseClient } from '@/lib/supabase/server';
import { FilesView } from '@/components/features/files/FilesView';
export const metadata = { title: 'Files — Omnia' };
export default async function FilesPage() {
  const [user, profile] = await Promise.all([getUser(), getProfile()]);
  if (!user || !profile) return null;
  const supabase = await createServerSupabaseClient();
  const { data: files } = await supabase.from('files').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
  return <FilesView profile={profile} initialFiles={files || []} />;
}
