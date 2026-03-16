import { NextRequest, NextResponse } from 'next/server';
import { getUser, createAdminSupabaseClient } from '@/lib/supabase/server';
export async function GET(_req: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  const user = await getUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { chatId } = await params;
  const s = createAdminSupabaseClient();
  const { data } = await s.from('chat_messages').select('*').eq('chat_id', chatId).eq('user_id', user.id).order('created_at', { ascending: true });
  return NextResponse.json({ messages: data || [] });
}
