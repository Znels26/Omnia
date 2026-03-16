import { NextRequest, NextResponse } from 'next/server';
import { getUser, createAdminSupabaseClient } from '@/lib/supabase/server';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ memoryId: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { memoryId } = await params;
  await createAdminSupabaseClient().from('memories').delete().eq('id', memoryId).eq('user_id', user.id);
  return NextResponse.json({ success: true });
}
