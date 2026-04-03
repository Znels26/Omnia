import { NextRequest, NextResponse } from 'next/server';
import { getUser, createAdminSupabaseClient } from '@/lib/supabase/server';

const OWNER_EMAIL = 'zacharynelson96@gmail.com';

export async function PATCH(req: NextRequest) {
  const user = await getUser();
  if (!user || user.email?.toLowerCase() !== OWNER_EMAIL.toLowerCase()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id, status } = await req.json();
  if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 });

  const s = createAdminSupabaseClient();
  const { error } = await s
    .from('problem_reports')
    .update({ status })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
