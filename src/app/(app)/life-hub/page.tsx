import { getUser, getProfile } from '@/lib/supabase/server';
import { LifeHubView } from '@/components/features/life-hub/LifeHubView';

export const metadata = { title: 'Life Hub — Omnia' };

export default async function LifeHubPage() {
  const [user, profile] = await Promise.all([getUser(), getProfile()]);
  if (!user || !profile) return null;
  return <LifeHubView profile={profile} />;
}
