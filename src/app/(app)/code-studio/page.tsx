import { getUser, getProfile } from '@/lib/supabase/server';
import { CodeStudioView } from '@/components/features/code-studio/CodeStudioView';

export const metadata = { title: 'Code Studio — Omnia' };

export default async function CodeStudioPage() {
  const [user, profile] = await Promise.all([getUser(), getProfile()]);
  if (!user || !profile) return null;
  return <CodeStudioView profile={profile} />;
}
