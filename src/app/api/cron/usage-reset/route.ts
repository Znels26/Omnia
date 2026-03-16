import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const s = createAdminSupabaseClient();
  const today = new Date();

  // Find users whose billing anniversary falls on today (day of month matches period_start)
  const { data: counters } = await s
    .from('usage_counters')
    .select('user_id, period_start')
    .not('period_start', 'is', null);

  if (!counters?.length) return NextResponse.json({ reset: 0 });

  let reset = 0;
  await Promise.allSettled(
    counters.map(async (counter) => {
      const periodStart = new Date(counter.period_start);
      if (periodStart.getDate() !== today.getDate()) return;

      await s
        .from('usage_counters')
        .update({
          ai_requests_used: 0,
          ai_tokens_used: 0,
          exports_count: 0,
          invoices_count: 0,
          period_start: today.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', counter.user_id);
      reset++;
    })
  );

  return NextResponse.json({ reset });
}
