import { getProfile } from '@/lib/supabase/server';
import { CodeStudioView } from '@/components/features/code-studio/CodeStudioView';

export const metadata = { title: 'Code Studio | Omnia' };

export default async function CodeStudioPage() {
  const profile = await getProfile();
  return <CodeStudioView profile={profile} />;
}
