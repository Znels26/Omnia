import { NextRequest, NextResponse } from 'next/server';
import { getUser, createAdminSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { enabled } = body as { enabled: boolean };

    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'enabled must be a boolean' }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient();

    const upsertPayload: Record<string, unknown> = {
      user_id: user.id,
      autopilot_enabled: enabled,
      updated_at: new Date().toISOString(),
    };

    if (enabled) {
      upsertPayload.autopilot_activated_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('user_autopilot_profile')
      .upsert(upsertPayload, { onConflict: 'user_id' })
      .select('onboarding_complete')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (enabled && data && !data.onboarding_complete) {
      return NextResponse.json({ enabled, needsOnboarding: true });
    }

    return NextResponse.json({ enabled, needsOnboarding: false });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
