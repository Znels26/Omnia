import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getUser, createAdminSupabaseClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const s = createAdminSupabaseClient();
  const { data, error } = await s.from('goals').insert({ user_id: user.id, progress: 0, is_completed: false, ...body }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateTag('planner');
  return NextResponse.json({ goal: data }, { status: 201 });
}
