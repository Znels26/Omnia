import { NextRequest, NextResponse } from 'next/server';
import { getUser, createAdminSupabaseClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { category, title, description } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 });

  const s = createAdminSupabaseClient();

  const { data: profile } = await s
    .from('profiles')
    .select('email, display_name')
    .eq('id', user.id)
    .single();

  const { error } = await s.from('problem_reports').insert({
    user_id: user.id,
    email: profile?.email || user.email,
    display_name: profile?.display_name || null,
    category: category || 'bug',
    title: title.trim(),
    description: description?.trim() || null,
    status: 'open',
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
