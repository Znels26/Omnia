import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const s = createAdminSupabaseClient();
  const now = new Date().toISOString();

  // Deactivate expired promo codes
  const { data: expired } = await s
    .from('promo_codes')
    .update({ is_active: false })
    .eq('is_active', true)
    .lt('expires_at', now)
    .select('id, code');

  return NextResponse.json({ expired: expired?.length ?? 0, codes: expired?.map((c: any) => c.code) ?? [] });
}
