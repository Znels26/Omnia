import { NextRequest, NextResponse } from 'next/server';
import { getUser, createAdminSupabaseClient } from '@/lib/supabase/server';
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
  const user = await getUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { fileId } = await params;
  const s = createAdminSupabaseClient();
  const { data: f } = await s.from('files').select('storage_path').eq('id', fileId).eq('user_id', user.id).single();
  if (f?.storage_path) await s.storage.from('omnia-files').remove([f.storage_path]);
  await s.from('files').delete().eq('id', fileId).eq('user_id', user.id);
  return NextResponse.json({ success: true });
}
