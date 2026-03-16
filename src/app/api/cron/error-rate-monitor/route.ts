import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { sendEmail, templates } from '@/lib/resend';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const s = createAdminSupabaseClient();
  const fifteenMinsAgo = new Date(Date.now() - 15 * 60000).toISOString();

  // Check for spike in failed exports (proxy for API errors)
  const { count: failedExports } = await s
    .from('exports')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'failed')
    .gte('created_at', fifteenMinsAgo);

  // Check for spike in stuck pending exports
  const { count: stuckExports } = await s
    .from('exports')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')
    .lt('created_at', fifteenMinsAgo);

  const errorCount = (failedExports ?? 0) + (stuckExports ?? 0);
  const ERROR_THRESHOLD = 10;

  if (errorCount > ERROR_THRESHOLD) {
    const adminEmail = process.env.ADMIN_EMAIL || 'zacharynelson96@gmail.com';
    await sendEmail({
      to: adminEmail,
      subject: `🚨 Omnia: Error spike detected (${errorCount} errors in 15min)`,
      html: templates.adminAlert('Error Rate Spike', `In the last 15 minutes:\n\n- Failed exports: ${failedExports ?? 0}\n- Stuck exports: ${stuckExports ?? 0}\n\nTotal: ${errorCount} errors — threshold is ${ERROR_THRESHOLD}`),
    });
  }

  return NextResponse.json({ error_count: errorCount, alerted: errorCount > ERROR_THRESHOLD });
}
