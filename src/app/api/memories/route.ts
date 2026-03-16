import { NextRequest, NextResponse } from 'next/server';
import { getUser, createAdminSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const s = createAdminSupabaseClient();
  const { data } = await s.from('memories').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
  return NextResponse.json({ memories: data || [] });
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: 'content required' }, { status: 400 });
  const s = createAdminSupabaseClient();
  const { data, error } = await s.from('memories').insert({ user_id: user.id, content: content.trim() }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ memory: data }, { status: 201 });
}
