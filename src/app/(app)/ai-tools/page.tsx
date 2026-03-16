import { getUser, getProfile } from '@/lib/supabase/server';
import { AiToolsView } from '@/components/features/ai-tools/AiToolsView';

export const metadata = { title: 'AI Money Tools — Omnia' };

export default async function AiToolsPage() {
  const [user, profile] = await Promise.all([getUser(), getProfile()]);
  if (!user || !profile) return null;
  return <AiToolsView profile={profile} />;
}
