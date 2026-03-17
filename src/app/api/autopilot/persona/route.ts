import { NextRequest, NextResponse } from 'next/server';
import { getUser, createAdminSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { persona } = body as { persona: string };

    if (!persona || typeof persona !== 'string') {
      return NextResponse.json({ error: 'persona is required' }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient();

    const [autopilotResult, profileResult] = await Promise.all([
      supabase
        .from('user_autopilot_profile')
        .update({ persona, updated_at: new Date().toISOString() })
        .eq('user_id', user.id),
      supabase
        .from('profiles')
        .update({ persona })
        .eq('id', user.id),
    ]);

    if (autopilotResult.error) {
      return NextResponse.json({ error: autopilotResult.error.message }, { status: 500 });
    }

    if (profileResult.error) {
      return NextResponse.json({ error: profileResult.error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, persona });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
