import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getUser, createAdminSupabaseClient } from '@/lib/supabase/server';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ habitId: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { habitId } = await params;
  const body = await req.json();
  const s = createAdminSupabaseClient();
  const { data, error } = await s.from('habits').update(body).eq('id', habitId).eq('user_id', user.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateTag('planner');
  return NextResponse.json({ habit: data });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ habitId: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { habitId } = await params;
  const s = createAdminSupabaseClient();
  await s.from('habits').delete().eq('id', habitId).eq('user_id', user.id);
  revalidateTag('planner');
  return NextResponse.json({ ok: true });
}
