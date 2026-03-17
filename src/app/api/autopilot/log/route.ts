import { NextRequest, NextResponse } from 'next/server';
import { getUser, createAdminSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from('autopilot_log')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ log: data || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { action_type, description, outcome, reasoning, persona } = body as {
      action_type: string;
      description: string;
      outcome?: string;
      reasoning?: string;
      persona?: string;
    };

    if (!action_type || !description) {
      return NextResponse.json({ error: 'action_type and description are required' }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from('autopilot_log')
      .insert({
        user_id: user.id,
        action_type,
        description,
        outcome: outcome ?? null,
        reasoning: reasoning ?? null,
        persona: persona ?? null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ entry: data }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
