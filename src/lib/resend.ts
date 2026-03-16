import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL || 'Omnia <hello@omnia.app>';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailPayload) {
  const { error } = await resend.emails.send({ from: FROM, to, subject, html });
  if (error) throw new Error(error.message);
}

// ── Email template helpers ────────────────────────────────────────────────────

function base(title: string, body: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0a0a0f;color:#e2e8f0;margin:0;padding:0}
.wrap{max-width:600px;margin:0 auto;padding:32px 24px}
.card{background:#111118;border:1px solid #1e1e2e;border-radius:12px;padding:28px}
h1{font-size:22px;font-weight:700;color:#fff;margin:0 0 8px}
h2{font-size:16px;font-weight:600;color:#93c5fd;margin:20px 0 8px}
p{font-size:14px;line-height:1.6;color:#94a3b8;margin:0 0 12px}
.tag{display:inline-block;background:#1e3a5f;color:#93c5fd;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:600}
.divider{height:1px;background:#1e1e2e;margin:20px 0}
.btn{display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 22px;border-radius:8px;font-size:14px;font-weight:600;margin-top:8px}
.footer{text-align:center;font-size:11px;color:#475569;margin-top:24px}
ul{padding-left:18px;margin:0 0 12px}
li{font-size:14px;color:#94a3b8;line-height:1.7}
</style></head><body>
<div class="wrap">
<div style="display:flex;align-items:center;gap:10px;margin-bottom:24px">
<div style="width:32px;height:32px;background:#1d3a5f;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px">✦</div>
<span style="font-weight:700;font-size:18px;color:#fff">Omnia</span>
</div>
<div class="card">
<h1>${title}</h1>
${body}
</div>
<div class="footer">Omnia · You're receiving this because you have email notifications enabled.<br>
<a href="${process.env.NEXT_PUBLIC_APP_URL}/settings" style="color:#475569">Manage notifications</a></div>
</div></body></html>`;
}

export const templates = {
  morningBriefing: (name: string, tasks: any[], reminders: any[], goals: any[]) =>
    base('Good morning! ☀️', `
<p>Here's your daily briefing, ${name}.</p>
${tasks.length ? `<h2>Today's Tasks</h2><ul>${tasks.slice(0,5).map((t: any) => `<li>${t.title}${t.priority === 'high' ? ' 🔴' : ''}</li>`).join('')}</ul>` : ''}
${reminders.length ? `<h2>Reminders Today</h2><ul>${reminders.map((r: any) => `<li>${r.title}</li>`).join('')}</ul>` : ''}
${goals.length ? `<h2>Active Goals</h2><ul>${goals.slice(0,3).map((g: any) => `<li>${g.title} — ${g.progress}%</li>`).join('')}</ul>` : ''}
<div class="divider"></div>
<a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="btn">Open Dashboard →</a>
`),

  weeklyReview: (name: string, summary: string) =>
    base('Your Weekly Review 📊', `
<p>Hey ${name}, here's your AI-generated weekly summary.</p>
<div class="divider"></div>
<p>${summary.replace(/\n/g, '</p><p>')}</p>
<div class="divider"></div>
<a href="${process.env.NEXT_PUBLIC_APP_URL}/planner" class="btn">Plan Next Week →</a>
`),

  overdueTasks: (name: string, tasks: any[]) =>
    base('Overdue Tasks Need Attention ⏰', `
<p>Hey ${name}, you have ${tasks.length} overdue task${tasks.length > 1 ? 's' : ''}.</p>
<ul>${tasks.slice(0,8).map((t: any) => `<li>${t.title} <span style="color:#f87171;font-size:12px">(due ${t.due_date})</span></li>`).join('')}</ul>
<a href="${process.env.NEXT_PUBLIC_APP_URL}/planner" class="btn">Review Tasks →</a>
`),

  invoiceChaser: (clientName: string, invoiceNumber: string, amount: string, daysOverdue: number, senderEmail: string) =>
    base(`Invoice ${invoiceNumber} — Friendly Reminder`, `
<p>Dear ${clientName},</p>
<p>This is a friendly reminder that invoice <strong>${invoiceNumber}</strong> for <strong>${amount}</strong> is now <strong>${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue</strong>.</p>
<p>Please arrange payment at your earliest convenience. If you have any questions, reply to this email.</p>
<p>Thank you for your business.</p>
<p style="color:#64748b;font-size:12px;margin-top:16px">Sent on behalf of ${senderEmail} via Omnia</p>
`),

  goalCheckin: (name: string, analysis: string) =>
    base('Weekly Goal Check-in 🎯', `
<p>Hey ${name}, here's your AI goal progress review.</p>
<div class="divider"></div>
<p>${analysis.replace(/\n/g, '</p><p>')}</p>
<div class="divider"></div>
<a href="${process.env.NEXT_PUBLIC_APP_URL}/planner" class="btn">Update Goals →</a>
`),

  reminder: (name: string, title: string, description: string) =>
    base(`Reminder: ${title}`, `
<p>Hey ${name}, this is your reminder:</p>
<h2>${title}</h2>
${description ? `<p>${description}</p>` : ''}
<a href="${process.env.NEXT_PUBLIC_APP_URL}/reminders" class="btn">View Reminders →</a>
`),

  subscriptionAlert: (name: string, planTier: string, renewalDate: string, amount: string) =>
    base('Subscription Renewing Soon 💳', `
<p>Hey ${name}, your <strong>${planTier} plan</strong> renews on <strong>${renewalDate}</strong> for <strong>${amount}</strong>.</p>
<p>No action needed — your subscription will auto-renew. If you'd like to make changes, visit billing.</p>
<a href="${process.env.NEXT_PUBLIC_APP_URL}/billing" class="btn">Manage Billing →</a>
`),

  upsell: (name: string, planTier: string, usageStat: string) =>
    base('Unlock More with Omnia Plus ⚡', `
<p>Hey ${name}, you're on the <strong>${planTier}</strong> plan and ${usageStat}.</p>
<h2>Upgrade to get:</h2>
<ul>
<li>Unlimited AI requests</li>
<li>Advanced content tools</li>
<li>Priority email support</li>
<li>Background job automations</li>
</ul>
<a href="${process.env.NEXT_PUBLIC_APP_URL}/billing" class="btn">Upgrade Now →</a>
`),

  clientRetention: (name: string, clientName: string, lastInvoiceDate: string) =>
    base(`Client Alert: ${clientName} 👀`, `
<p>Hey ${name}, <strong>${clientName}</strong> hasn't had an invoice since <strong>${lastInvoiceDate}</strong>. They might be at risk of churning.</p>
<p>Consider reaching out to check in or send a new proposal.</p>
<a href="${process.env.NEXT_PUBLIC_APP_URL}/invoices" class="btn">View Invoices →</a>
`),

  proposalFollowUp: (clientName: string, projectType: string, sentDate: string, senderEmail: string) =>
    base(`Following Up: ${projectType} Proposal`, `
<p>Dear ${clientName},</p>
<p>I wanted to follow up on the proposal I sent on <strong>${sentDate}</strong> for <strong>${projectType}</strong>.</p>
<p>Please let me know if you have any questions or would like to discuss further. I'm happy to adjust the scope or timeline to fit your needs.</p>
<p>Looking forward to hearing from you.</p>
<p style="color:#64748b;font-size:12px;margin-top:16px">Sent on behalf of ${senderEmail} via Omnia</p>
`),
};
