import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { sendEmail, templates } from '@/lib/resend';

export const runtime = 'nodejs';
export const maxDuration = 30;

const LIMITS: Record<string, Record<string, number>> = {
  free: { ai_requests_used: 24, notes_count: 16, files_count: 8, exports_count: 4, invoices_count: 8 },
  plus: { ai_requests_used: 400, exports_count: 40, invoices_count: 20 },
};

const LIMIT_LABELS: Record<string, string> = {
  ai_requests_used: 'AI messages',
  notes_count: 'notes',
  files_count: 'file uploads',
  exports_count: 'exports',
  invoices_count: 'invoices',
};

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const s = createAdminSupabaseClient();
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const { data: rows } = await s
    .from('usage_counters')
    .select('user_id, ai_requests_used, notes_count, files_count, exports_count, invoices_count, profiles(email, display_name, full_name, plan_tier, email_notifications)');

  if (!rows?.length) return NextResponse.json({ emailed: 0 });

  let emailed = 0;
  await Promise.allSettled(
    rows.map(async (row: any) => {
      const profile = row.profiles;
      if (!profile?.email_notifications || profile.plan_tier === 'pro') return;

      const planLimits = LIMITS[profile.plan_tier] ?? {};
      const hitLimit = Object.entries(planLimits).find(
        ([key, threshold]) => (row[key] ?? 0) >= threshold
      );
      if (!hitLimit) return;

      // Don't email again within 7 days
      const { data: recent } = await s
        .from('cron_email_log')
        .select('sent_at')
        .eq('user_id', row.user_id)
        .eq('email_type', 'upgrade_prompt')
        .gte('sent_at', sevenDaysAgo)
        .maybeSingle();

      if (recent) return;

      const name = profile.display_name || profile.full_name || 'there';
      const limitLabel = LIMIT_LABELS[hitLimit[0]] ?? hitLimit[0];

      await sendEmail({
        to: profile.email,
        subject: "You're getting serious about Omnia ⚡",
        html: templates.upgradePrompt(name, `80%+ of your ${limitLabel} limit`),
      });

      await s.from('cron_email_log').upsert(
        { user_id: row.user_id, email_type: 'upgrade_prompt', sent_at: new Date().toISOString() },
        { onConflict: 'user_id,email_type', ignoreDuplicates: false }
      );
      emailed++;
    })
  );

  return NextResponse.json({ emailed });
}
