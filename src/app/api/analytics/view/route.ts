import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// Paths that should never be recorded
const SKIP = new Set(['/api', '/_next', '/favicon', '/icon', '/manifest', '/sw.js']);

/**
 * POST /api/analytics/view
 * Records a page view. Works for both authenticated and anonymous visitors.
 * Deduplicates: same session + same page within 30 minutes is ignored.
 *
 * Body: { page: string, sessionId: string, userId?: string }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.page || !body?.sessionId) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { page, sessionId, userId } = body;

  // Normalise and guard path
  const normPage = ('/' + String(page).replace(/^\//, '').split('?')[0]).slice(0, 200);
  if (SKIP.has(normPage) || normPage.startsWith('/api/') || normPage.startsWith('/_')) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const s = createAdminSupabaseClient();

  // Dedup: same session viewed same page in last 30 minutes?
  const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const { count } = await s
    .from('page_views')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', String(sessionId).slice(0, 64))
    .eq('page', normPage)
    .gte('created_at', cutoff);

  if ((count ?? 0) > 0) return NextResponse.json({ ok: true, deduped: true });

  await s.from('page_views').insert({
    page:       normPage,
    session_id: String(sessionId).slice(0, 64),
    user_id:    userId ?? null,
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
