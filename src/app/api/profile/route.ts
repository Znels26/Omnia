import { NextRequest, NextResponse } from 'next/server';
import { getUser, createAdminSupabaseClient } from '@/lib/supabase/server';
export async function PATCH(req: NextRequest) {
  const user = await getUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const allowed = ['display_name','full_name','assistant_mode','email_notifications','timezone'];
  const updates: any = {};
  for (const k of allowed) if (k in body) updates[k] = body[k];
  const s = createAdminSupabaseClient();
  const { data, error } = await s.from('profiles').update(updates).eq('id', user.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data });
}
