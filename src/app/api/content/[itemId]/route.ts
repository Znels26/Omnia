import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getUser, createAdminSupabaseClient } from '@/lib/supabase/server';
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const user = await getUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { itemId } = await params; const body = await req.json();
  const s = createAdminSupabaseClient();
  const { data, error } = await s.from('content_items').update(body).eq('id', itemId).eq('user_id', user.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateTag('content');
  return NextResponse.json({ item: data });
}
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const user = await getUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { itemId } = await params;
  await createAdminSupabaseClient().from('content_items').delete().eq('id', itemId).eq('user_id', user.id);
  revalidateTag('content');
  return NextResponse.json({ success: true });
}
