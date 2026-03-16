import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const s = createAdminSupabaseClient();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Find users who were active today (sent chat messages)
  const { data: activeToday } = await s
    .from('chat_messages')
    .select('user_id')
    .gte('created_at', new Date().toISOString().split('T')[0] + 'T00:00:00Z')
    .eq('role', 'user');

  const activeUserIds = new Set((activeToday ?? []).map((m: any) => m.user_id));

  let updated = 0;
  for (const userId of activeUserIds) {
    const { data: streak } = await s
      .from('user_streaks')
      .select('login_streak, login_streak_best, last_login_date')
      .eq('user_id', userId)
      .maybeSingle();

    const lastDate = streak?.last_login_date;
    const currentStreak = streak?.login_streak ?? 0;
    const bestStreak = streak?.login_streak_best ?? 0;

    const newStreak = lastDate === yesterday ? currentStreak + 1 : lastDate === today ? currentStreak : 1;
    const newBest = Math.max(newStreak, bestStreak);

    await s.from('user_streaks').upsert({
      user_id: userId,
      login_streak: newStreak,
      login_streak_best: newBest,
      last_login_date: today,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    updated++;
  }

  return NextResponse.json({ updated });
}
