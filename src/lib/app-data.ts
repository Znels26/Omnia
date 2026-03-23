import { getUser, getProfile, createAdminSupabaseClient } from '@/lib/supabase/server';

async function ensureProfile(userId: string, email: string, metadata: any) {
  const admin = createAdminSupabaseClient();
  await admin.from('profiles').upsert({
    id: userId, email,
    full_name: metadata?.full_name || '',
    display_name: metadata?.display_name || email.split('@')[0],
  }, { onConflict: 'id' });
  await admin.from('usage_counters').upsert({ user_id: userId }, { onConflict: 'user_id' });
  await admin.from('subscriptions').upsert({ user_id: userId, plan_tier: 'free', status: 'active' }, { onConflict: 'user_id' });
}

export async function getAppData() {
  const user = await getUser();
  if (!user) return null;

  let profile = await getProfile();
  if (!profile) {
    await ensureProfile(user.id, user.email!, user.user_metadata);
    profile = await getProfile();
  }
  return profile;
}
