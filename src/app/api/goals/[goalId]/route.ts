import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getUser, createAdminSupabaseClient } from '@/lib/supabase/server';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ goalId: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { goalId } = await params;
  const body = await req.json();
  const s = createAdminSupabaseClient();
  const { data, error } = await s.from('goals').update(body).eq('id', goalId).eq('user_id', user.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateTag('planner');
  return NextResponse.json({ goal: data });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ goalId: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { goalId } = await params;
  const s = createAdminSupabaseClient();
  await s.from('goals').delete().eq('id', goalId).eq('user_id', user.id);
  revalidateTag('planner');
  return NextResponse.json({ ok: true });
}
