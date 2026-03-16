import { NextRequest, NextResponse } from 'next/server';
import { getUser, createAdminSupabaseClient } from '@/lib/supabase/server';
export async function POST(req: NextRequest) {
  const user = await getUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const s = createAdminSupabaseClient();
  const { data: u } = await s.from('usage_counters').select('notes_count').eq('user_id', user.id).single();
  const { data: p } = await s.from('profiles').select('plan_tier').eq('id', user.id).single();
  const limits: any = { free: 10, plus: 100, pro: -1 };
  const limit = limits[p?.plan_tier || 'free'];
  if (limit !== -1 && (u?.notes_count || 0) >= limit) return NextResponse.json({ error: `Note limit (${limit}) reached. Upgrade to add more.`, upgradeRequired: true }, { status: 429 });
  const { data, error } = await s.from('notes').insert({ user_id: user.id, title: body.title || 'Untitled Note', content: body.content || '', content_preview: (body.content || '').replace(/[#*`]/g,'').trim().slice(0,200), word_count: (body.content || '').split(/\s+/).filter(Boolean).length, folder_id: body.folder_id || null }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await s.from('usage_counters').update({ notes_count: (u?.notes_count || 0) + 1 }).eq('user_id', user.id);
  return NextResponse.json({ note: data }, { status: 201 });
}
