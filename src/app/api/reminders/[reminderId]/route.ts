import { NextRequest, NextResponse } from 'next/server';
import { getUser, createAdminSupabaseClient } from '@/lib/supabase/server';
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ reminderId: string }> }) {
  const user = await getUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { reminderId } = await params; const body = await req.json();
  const s = createAdminSupabaseClient();
  const { data, error } = await s.from('reminders').update(body).eq('id', reminderId).eq('user_id', user.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reminder: data });
}
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ reminderId: string }> }) {
  const user = await getUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { reminderId } = await params;
  await createAdminSupabaseClient().from('reminders').delete().eq('id', reminderId).eq('user_id', user.id);
  return NextResponse.json({ success: true });
}
