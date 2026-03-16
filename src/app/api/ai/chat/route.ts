import { NextRequest, NextResponse } from 'next/server';
import { getUser, createAdminSupabaseClient } from '@/lib/supabase/server';
export async function GET() {
  const user = await getUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const s = createAdminSupabaseClient();
  const { data } = await s.from('chats').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100);
  return NextResponse.json({ chats: data || [] });
}
export async function POST(req: NextRequest) {
  const user = await getUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const s = createAdminSupabaseClient();
  const { data, error } = await s.from('chats').insert({ user_id: user.id, mode: body.mode || 'general', title: body.title || 'New Chat' }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ chat: data });
}
