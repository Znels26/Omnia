import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const s = createAdminSupabaseClient();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  // Delete chats with 0 messages older than 30 days
  const { data: deleted, error } = await s
    .from('chats')
    .delete()
    .eq('message_count', 0)
    .lt('created_at', thirtyDaysAgo)
    .select('id');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ deleted: deleted?.length ?? 0 });
}
