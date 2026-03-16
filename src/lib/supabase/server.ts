import { createServerClient } from '@supabase/ssr';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { cache } from 'react';

const OWNER_EMAIL = 'zacharynelson96@gmail.com';
const VIP_EMAILS = ['stephaniephillipsmc@gmail.com'];

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
          catch { /* server component */ }
        },
      },
    }
  );
}

export function createAdminSupabaseClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// cache() deduplicates calls within the same server request —
// layout + page both call getUser/getProfile but Supabase only hits once.
export const getUser = cache(async () => {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch { return null; }
});

export const getProfile = cache(async () => {
  try {
    const user = await getUser();
    if (!user) return null;
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!data) return null;
    // Owner + VIP accounts always get pro tier
    if (data.email === OWNER_EMAIL || VIP_EMAILS.includes(data.email)) return { ...data, plan_tier: 'pro' };
    return data;
  } catch { return null; }
});
