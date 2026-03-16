import { getUser, getProfile } from '@/lib/supabase/server';
import { SettingsView } from '@/components/features/settings/SettingsView';
export const metadata = { title: 'Settings — Omnia' };
export default async function SettingsPage() {
  const [user, profile] = await Promise.all([getUser(), getProfile()]);
  if (!user || !profile) return null;
  return <SettingsView profile={profile} />;
}
