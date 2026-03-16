import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/resend';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  const type = req.nextUrl.searchParams.get('type') ?? 'all';

  if (!token) {
    return NextResponse.redirect(new URL('/settings', req.url));
  }

  let userId: string;
  try {
    userId = Buffer.from(token, 'base64url').toString('utf8');
  } catch {
    return NextResponse.redirect(new URL('/settings', req.url));
  }

  const s = createAdminSupabaseClient();

  // Verify user exists
  const { data: profile } = await s
    .from('profiles')
    .select('id, email, display_name, full_name')
    .eq('id', userId)
    .maybeSingle();

  if (!profile) {
    return NextResponse.redirect(new URL('/settings', req.url));
  }

  if (type === 'all') {
    // Set email_notifications = false immediately
    await s.from('profiles').update({ email_notifications: false }).eq('id', userId);

    // Log the unsubscribe
    await s.from('email_unsubscribes').upsert(
      { user_id: userId, email_type: 'all' },
      { onConflict: 'user_id,email_type', ignoreDuplicates: true }
    );

    // Send one final confirmation email (bypass queue — this is the last ever email)
    const name = profile.display_name || profile.full_name || 'there';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';

    await sendEmail({
      to: profile.email,
      subject: "You've been unsubscribed from Omnia",
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0a0a0f;color:#e2e8f0;margin:0;padding:0}
.wrap{max-width:600px;margin:0 auto;padding:32px 24px}
.card{background:#111118;border:1px solid #1e1e2e;border-radius:12px;padding:28px}
h1{font-size:20px;font-weight:700;color:#fff;margin:0 0 8px}
p{font-size:14px;line-height:1.6;color:#94a3b8;margin:0 0 12px}
a{color:#60a5fa}
</style></head><body>
<div class="wrap">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px">
    <div style="width:32px;height:32px;background:#1d3a5f;border-radius:8px;text-align:center;line-height:32px;font-size:16px">✦</div>
    <span style="font-weight:700;font-size:18px;color:#fff">Omnia</span>
  </div>
  <div class="card">
    <h1>You've been unsubscribed</h1>
    <p>Hey ${name}, you've been successfully removed from all Omnia emails.</p>
    <p>You'll only receive emails if your payment fails or there's a security alert on your account.</p>
    <p>Changed your mind? You can re-enable emails anytime in your
      <a href="${appUrl}/settings">account settings</a>.
    </p>
  </div>
  <div style="text-align:center;font-size:11px;color:#475569;margin-top:24px">
    Omnia · omnia-ai.space · hello@omnia-ai.space<br>
    123 Example Street, Sydney NSW 2000, Australia
  </div>
</div>
</body></html>`,
    });

  } else {
    // Unsubscribe from a specific email type only
    await s.from('email_unsubscribes').upsert(
      { user_id: userId, email_type: type },
      { onConflict: 'user_id,email_type', ignoreDuplicates: true }
    );
  }

  // Redirect to settings with confirmation
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  return NextResponse.redirect(
    new URL(`/settings?unsubscribed=${type}`, appUrl)
  );
}
