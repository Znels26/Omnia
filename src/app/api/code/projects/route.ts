import { NextRequest, NextResponse } from 'next/server';
import { getUser, createAdminSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// GET — list user's projects
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from('code_projects')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ projects: data ?? [] });
}

// POST — create a new project
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, description, style, type } = body as {
    name: string;
    description?: string;
    style?: string;
    type?: string;
  };

  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from('code_projects')
    .insert({
      user_id: user.id,
      name: name.trim(),
      description: description?.trim() ?? null,
      style: style ?? 'dark-modern',
      type: type ?? 'static',
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ project: data });
}

// PATCH — update project name/description/style
export async function PATCH(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { id, name, description, style } = body as {
    id: string;
    name?: string;
    description?: string;
    style?: string;
  };

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const supabase = createAdminSupabaseClient();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (name !== undefined) updates.name = name.trim();
  if (description !== undefined) updates.description = description;
  if (style !== undefined) updates.style = style;

  const { data, error } = await supabase
    .from('code_projects')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ project: data });
}

// DELETE — remove a project (cascades to files)
export async function DELETE(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from('code_projects')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
