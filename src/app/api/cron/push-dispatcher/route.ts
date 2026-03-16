import { NextRequest, NextResponse } from 'next/server';
import { dispatchPushes } from '@/lib/push-scheduler';

export const runtime  = 'nodejs';
export const maxDuration = 60;

/**
 * GET /api/cron/push-dispatcher
 * Runs every 15 minutes (same cadence as email-dispatcher).
 * Processes the push_queue table with all anti-spam rules applied:
 *   - Max 3 pushes/day per user
 *   - 2-hour gap enforcement
 *   - 10pm–7am quiet hours
 *   - Priority hierarchy
 *   - Combines simultaneous notifications
 *   - Prunes dead FCM tokens
 */
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await dispatchPushes();
  return NextResponse.json(result);
}
