import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getUser, createAdminSupabaseClient } from '@/lib/supabase/server';
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ noteId: string }> }) {
  const user = await getUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { noteId } = await params; const body = await req.json();
  const s = createAdminSupabaseClient();
  const { data, error } = await s.from('notes').update({ ...body, last_edited_at: new Date().toISOString() }).eq('id', noteId).eq('user_id', user.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateTag('notes'); revalidateTag('dashboard');
  return NextResponse.json({ note: data });
}
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ noteId: string }> }) {
  const user = await getUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { noteId } = await params;
  const s = createAdminSupabaseClient();
  await s.from('notes').delete().eq('id', noteId).eq('user_id', user.id);
  const { data: u } = await s.from('usage_counters').select('notes_count').eq('user_id', user.id).single();
  if (u) await s.from('usage_counters').update({ notes_count: Math.max(0, (u.notes_count || 0) - 1) }).eq('user_id', user.id);
  revalidateTag('notes'); revalidateTag('dashboard');
  return NextResponse.json({ success: true });
}
