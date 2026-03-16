import { NextRequest, NextResponse } from 'next/server';
import { getUser, createAdminSupabaseClient } from '@/lib/supabase/server';
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  const user = await getUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { chatId } = await params; const body = await req.json();
  const s = createAdminSupabaseClient();
  const allowed = ['title','is_pinned','is_archived','mode'];
  const updates: any = {};
  for (const k of allowed) if (k in body) updates[k] = body[k];
  const { data, error } = await s.from('chats').update(updates).eq('id', chatId).eq('user_id', user.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ chat: data });
}
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  const user = await getUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { chatId } = await params;
  const s = createAdminSupabaseClient();
  await s.from('chats').delete().eq('id', chatId).eq('user_id', user.id);
  return NextResponse.json({ success: true });
}
