import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const s = createAdminSupabaseClient();

  // Find files with processing_status = 'failed' older than 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const { data: orphans } = await s
    .from('files')
    .delete()
    .eq('processing_status', 'failed')
    .lt('created_at', sevenDaysAgo)
    .select('id, storage_path');

  // Find files where user no longer exists (cascades handle this, but clean up storage_url nulls)
  const { data: nullStorage } = await s
    .from('files')
    .delete()
    .is('storage_url', null)
    .lt('created_at', sevenDaysAgo)
    .select('id');

  return NextResponse.json({
    failed_files_removed: orphans?.length ?? 0,
    null_storage_removed: nullStorage?.length ?? 0,
  });
}
