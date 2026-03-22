import { getUser, getProfile } from '@/lib/supabase/server';
import { MyStackView } from '@/components/features/stack/MyStackView';
export const metadata = { title: 'My Stack — Omnia' };
export default async function MyStackPage() {
  const [user, profile] = await Promise.all([getUser(), getProfile()]);
  if (!user || !profile) return null;
  return <MyStackView />;
}
