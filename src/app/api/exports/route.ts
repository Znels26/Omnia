import { NextRequest, NextResponse } from 'next/server';
import { getUser, createAdminSupabaseClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { title, content, format } = await req.json();
  if (!title || !content || !format) return NextResponse.json({ error: 'title, content, format required' }, { status: 400 });
  const s = createAdminSupabaseClient();
  const { data: exp, error } = await s.from('exports').insert({ user_id: user.id, title, format, status: 'completed', input_content: content }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { data: u } = await s.from('usage_counters').select('exports_count').eq('user_id', user.id).single();
  if (u) await s.from('usage_counters').update({ exports_count: (u.exports_count || 0) + 1 }).eq('user_id', user.id);
  return NextResponse.json({ export: exp }, { status: 201 });
}
