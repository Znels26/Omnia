import { redirect } from 'next/navigation';
import { getUser, getProfile, createAdminSupabaseClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/AppShell';

// This layout wraps all app pages so AppShell (sidebar + nav) persists
// between navigations — only the page content re-renders.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect('/login');

  // Ensure user records exist (idempotent)
  const admin = createAdminSupabaseClient();
  await Promise.all([
    admin.from('profiles').upsert({ id: user.id, email: user.email!, display_name: user.user_metadata?.display_name || user.email!.split('@')[0], full_name: user.user_metadata?.full_name || '' }, { onConflict: 'id' }),
    admin.from('usage_counters').upsert({ user_id: user.id }, { onConflict: 'user_id' }),
    admin.from('subscriptions').upsert({ user_id: user.id, plan_tier: 'free', status: 'active' }, { onConflict: 'user_id' }),
  ]);

  const profile = await getProfile();
  if (!profile) redirect('/login');

  return <AppShell profile={profile}>{children}</AppShell>;
}
