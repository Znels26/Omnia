import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const s = createAdminSupabaseClient();
  const results: Record<string, number> = {};

  // Clear failed exports older than 48h
  const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString();
  const { data: failedExports } = await s
    .from('exports')
    .delete()
    .eq('status', 'failed')
    .lt('created_at', twoDaysAgo)
    .select('id');
  results.failed_exports_cleared = failedExports?.length ?? 0;

  // Clear old pending exports (stuck jobs) older than 1h
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
  const { data: stuckExports } = await s
    .from('exports')
    .delete()
    .eq('status', 'pending')
    .lt('created_at', oneHourAgo)
    .select('id');
  results.stuck_exports_cleared = stuckExports?.length ?? 0;

  // Archive notes content older than 180 days that have no activity (clear heavy content preview)
  const sixMonthsAgo = new Date(Date.now() - 180 * 86400000).toISOString();
  const { data: oldNotes } = await s
    .from('notes')
    .update({ content_preview: null, ai_summary: null })
    .lt('updated_at', sixMonthsAgo)
    .eq('is_archived', true)
    .select('id');
  results.note_previews_cleared = oldNotes?.length ?? 0;

  return NextResponse.json({ optimized: results });
}
