import { getUser, getProfile } from '@/lib/supabase/server';
import { DocumentBuilderView } from '@/components/features/documents/DocumentBuilderView';
export const metadata = { title: 'Document Builder — Omnia' };
export default async function DocumentBuilderPage() {
  const [user, profile] = await Promise.all([getUser(), getProfile()]);
  if (!user || !profile) return null;
  return <DocumentBuilderView profile={profile} />;
}
