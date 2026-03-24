import { redirect } from 'next/navigation';
import { getUser, getProfile, createAdminSupabaseClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/AppShell';
import { PageViewTracker } from '@/components/analytics/PageViewTracker';

const OWNER_EMAIL = 'zacharynelson96@gmail.com';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect('/login');

  // Fast path: established users already have a profile — skip DB writes entirely.
  // Only run the init upserts when the profile is missing (first login or data loss).
  let profile = await getProfile();

  if (!profile) {
    const admin = createAdminSupabaseClient();
    await Promise.all([
      admin.from('profiles').upsert({
        id: user.id,
        email: user.email!,
        display_name: user.user_metadata?.display_name || user.email!.split('@')[0],
        full_name: user.user_metadata?.full_name || '',
      }, { onConflict: 'id' }),
      admin.from('usage_counters').upsert({ user_id: user.id }, { onConflict: 'user_id' }),
      admin.from('subscriptions').upsert({ user_id: user.id, plan_tier: 'free', status: 'active' }, { onConflict: 'user_id' }),
    ]);
    // Fetch directly via admin (React.cache already returned null, won't re-run)
    const { data } = await admin.from('profiles').select('*').eq('id', user.id).single();
    profile = data;
    if (!profile) redirect('/login');
  }

  // Derive owner status from the auth user email (guaranteed correct) rather than
  // the profiles DB row, which may differ in case or be stale.
  const isOwner = user.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();
  if (isOwner) profile = { ...profile, plan_tier: 'pro', is_owner: true };

  return (
    <>
      <PageViewTracker userId={user.id} />
      <AppShell profile={profile}>{children}</AppShell>
    </>
  );
}
