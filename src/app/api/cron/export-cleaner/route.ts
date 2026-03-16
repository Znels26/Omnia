import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const s = createAdminSupabaseClient();
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  // Delete completed exports older than 7 days
  const { data: deleted } = await s
    .from('exports')
    .delete()
    .eq('status', 'completed')
    .lt('created_at', sevenDaysAgo)
    .select('id');

  return NextResponse.json({ deleted: deleted?.length ?? 0 });
}
