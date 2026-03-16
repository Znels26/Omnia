import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const s = createAdminSupabaseClient();

  // Find pending referrals where the referred user has now signed up
  const { data: pendingReferrals } = await s
    .from('referrals')
    .select('id, referrer_id, referred_email')
    .eq('status', 'pending')
    .not('referred_email', 'is', null);

  if (!pendingReferrals?.length) return NextResponse.json({ converted: 0 });

  let converted = 0;
  await Promise.allSettled(
    pendingReferrals.map(async (referral: any) => {
      // Check if the referred email has signed up
      const { data: user } = await s
        .from('profiles')
        .select('id')
        .eq('email', referral.referred_email)
        .maybeSingle();

      if (!user) return;

      // Mark as converted
      await s.from('referrals').update({
        status: 'converted',
        referred_user_id: user.id,
        converted_at: new Date().toISOString(),
      }).eq('id', referral.id);

      converted++;
    })
  );

  // Aggregate referral stats for admin metrics
  const { count: totalReferrals } = await s
    .from('referrals')
    .select('*', { count: 'exact', head: true });

  const { count: convertedReferrals } = await s
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'converted');

  await s.from('admin_metrics').insert({
    metric_key: 'referrals',
    metric_value: {
      total: totalReferrals ?? 0,
      converted: convertedReferrals ?? 0,
      new_conversions_today: converted,
    },
  });

  return NextResponse.json({ converted });
}
