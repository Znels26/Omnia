import { NextRequest, NextResponse } from 'next/server';
import { getUser, createAdminSupabaseClient } from '@/lib/supabase/server';
export async function POST(req: NextRequest) {
  const user = await getUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  if (!body.title || !body.remind_at) return NextResponse.json({ error: 'title and remind_at required' }, { status: 400 });
  const s = createAdminSupabaseClient();
  const { data, error } = await s.from('reminders').insert({ user_id: user.id, title: body.title, description: body.description || null, remind_at: new Date(body.remind_at).toISOString(), recurrence: body.recurrence !== 'none' ? body.recurrence : null, status: 'pending' }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reminder: data }, { status: 201 });
}
