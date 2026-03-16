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

  churnRisk: (name: string) =>
    base("We miss you, " + name + " 👋", `
<p>Hey ${name}, it looks like you haven't been on Omnia in a while.</p>
<p>Here's what's been added since your last visit:</p>
<ul>
<li>Improved AI memory — remembers your preferences across sessions</li>
<li>Faster Life Hub with all 22 tools refreshed</li>
<li>Smarter task scheduling with AI suggestions</li>
</ul>
<p>Your data is safe and ready when you come back.</p>
<div class="divider"></div>
<a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="btn">Come Back to Omnia →</a>
`),

  upgradePrompt: (name: string, limitHit: string) =>
    base("You're maxing out Omnia ⚡", `
<p>Hey ${name}, great news — you're getting serious value out of Omnia!</p>
<p>You've hit your <strong>${limitHit}</strong> limit. Upgrade to unlock more:</p>
<ul>
<li>Unlimited AI messages</li>
<li>250+ file uploads</li>
<li>500 exports/month</li>
<li>Priority support</li>
<li>Advanced AI memory</li>
</ul>
<a href="${process.env.NEXT_PUBLIC_APP_URL}/billing" class="btn">Upgrade Now →</a>
`),

  dunning: (name: string, day: number, amount: string) =>
    base(day >= 7 ? "Final notice: Payment failed ⚠️" : "Payment failed — action needed 💳", `
<p>Hey ${name},</p>
${day === 1 ? `<p>Your payment of <strong>${amount}</strong> didn't go through. This is just a heads-up — we'll retry automatically.</p>` : ''}
${day === 3 ? `<p>We've tried to charge <strong>${amount}</strong> again but it failed. Please update your payment method to keep your subscription active.</p>` : ''}
${day >= 7 ? `<p>This is your final notice. Your payment of <strong>${amount}</strong> has failed and your subscription will be cancelled if not resolved today.</p>` : ''}
<a href="${process.env.NEXT_PUBLIC_APP_URL}/billing" class="btn">Update Payment →</a>
`),

  trialExpiry: (name: string, daysLeft: number) =>
    base(daysLeft > 0 ? `Your trial ends in ${daysLeft} day${daysLeft > 1 ? 's' : ''} ⏳` : "Your trial has ended", `
<p>Hey ${name},</p>
${daysLeft > 0 ? `<p>Your free trial expires in <strong>${daysLeft} day${daysLeft > 1 ? 's' : ''}</strong>. Don't lose access to your data and AI tools.</p>` : '<p>Your free trial has ended. Your account has been moved to the free plan.</p>'}
<p>Upgrade now to keep everything running:</p>
<ul>
<li>All your notes, tasks, and invoices stay intact</li>
<li>Unlimited AI messages</li>
<li>Full Life Hub access</li>
</ul>
<a href="${process.env.NEXT_PUBLIC_APP_URL}/billing" class="btn">${daysLeft > 0 ? 'Upgrade Before It Expires' : 'Reactivate Now'} →</a>
`),

  downgraded: (name: string) =>
    base("Your plan has been updated", `
<p>Hey ${name}, your subscription has ended and your account has been moved to the <strong>free plan</strong>.</p>
<p>You can still access:</p>
<ul>
<li>30 AI messages/month</li>
<li>20 notes</li>
<li>Basic planner</li>
</ul>
<p>Your existing data is safe. Upgrade anytime to restore full access.</p>
<a href="${process.env.NEXT_PUBLIC_APP_URL}/billing" class="btn">Reactivate Subscription →</a>
`),

  onboardingNudge: (name: string, step: string) =>
    base("You're almost set up, " + name + "! 🚀", `
<p>Hey ${name}, you're so close to getting the most out of Omnia.</p>
<p>Next step: <strong>${step}</strong></p>
<p>It only takes a minute and unlocks a much better experience.</p>
<a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="btn">Complete Setup →</a>
`),

  firstWin: (name: string, type: string, title: string) =>
    base("Your first " + type + "! 🎉", `
<p>Hey ${name}, you just completed your first <strong>${type}</strong>:</p>
<h2>${title}</h2>
<p>That's how it starts. Keep the momentum going — small wins add up to big results.</p>
<a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="btn">Keep Going →</a>
`),

  goalDeadlineReminder: (name: string, goalTitle: string, daysLeft: number, aiMotivation: string) =>
    base(`Goal due in ${daysLeft} days: ${goalTitle}`, `
<p>Hey ${name}, your goal is coming up fast.</p>
<h2>${goalTitle}</h2>
<p style="color:#f59e0b">⏳ ${daysLeft} days remaining</p>
<div class="divider"></div>
<p>${aiMotivation}</p>
<div class="divider"></div>
<a href="${process.env.NEXT_PUBLIC_APP_URL}/planner" class="btn">Update Progress →</a>
`),

  inactiveFeatureNudge: (name: string, featureName: string, featureDescription: string, link: string) =>
    base("Did you know about " + featureName + "? 💡", `
<p>Hey ${name}, here's a tip you might have missed.</p>
<h2>${featureName}</h2>
<p>${featureDescription}</p>
<p>It's already included in your plan — give it a try!</p>
<a href="${process.env.NEXT_PUBLIC_APP_URL}${link}" class="btn">Try It Now →</a>
`),

  milestoneCelebration: (name: string, count: number, item: string) =>
    base(`${count} ${item}! You're on a roll 🏆`, `
<p>Hey ${name}, you just hit a big milestone:</p>
<div style="text-align:center;padding:24px 0">
<span style="font-size:48px;font-weight:800;color:#f59e0b">${count}</span>
<p style="font-size:18px;font-weight:600;color:#fff;margin:4px 0">${item}</p>
</div>
<p>That's a serious achievement. Keep pushing — you're building something great.</p>
<a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="btn">View Dashboard →</a>
`),

  contentIdeas: (name: string, ideas: string[]) =>
    base("Your 5 AI content ideas this week 💡", `
<p>Hey ${name}, here are 5 personalised content ideas generated just for you.</p>
<div class="divider"></div>
<ul>${ideas.map((idea, i) => `<li><strong>${i + 1}.</strong> ${idea}</li>`).join('')}</ul>
<div class="divider"></div>
<a href="${process.env.NEXT_PUBLIC_APP_URL}/create" class="btn">Create Content →</a>
`),

  financialInsight: (name: string, insight: string) =>
    base("Your weekly financial insight 💰", `
<p>Hey ${name}, here's your AI-powered financial analysis for the week.</p>
<div class="divider"></div>
<p>${insight.replace(/\n/g, '</p><p>')}</p>
<div class="divider"></div>
<a href="${process.env.NEXT_PUBLIC_APP_URL}/life-hub" class="btn">View Money Tools →</a>
`),

  fitnessInsight: (name: string, insight: string) =>
    base("Your weekly fitness progress 💪", `
<p>Hey ${name}, here's your personalised fitness analysis.</p>
<div class="divider"></div>
<p>${insight.replace(/\n/g, '</p><p>')}</p>
<div class="divider"></div>
<a href="${process.env.NEXT_PUBLIC_APP_URL}/life-hub" class="btn">View Fitness Tracker →</a>
`),

  winBack: (name: string, improvementHighlight: string) =>
    base("A lot has changed at Omnia, " + name, `
<p>Hey ${name}, it's been a while since you last used Omnia.</p>
<p>Here's what's new and improved since you left:</p>
<p>${improvementHighlight}</p>
<p>We'd love to have you back. Your account is still active and your data is safe.</p>
<a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="btn">Come Back →</a>
`),

  nps: (name: string) =>
    base("Quick question, " + name + " 🙏", `
<p>Hey ${name}, you've been using Omnia for a while now and your feedback means a lot to us.</p>
<p style="font-size:16px;font-weight:600;color:#fff">How likely are you to recommend Omnia to a friend?</p>
<div style="display:flex;gap:8px;flex-wrap:wrap;margin:16px 0">
${[1,2,3,4,5,6,7,8,9,10].map(n => `<a href="${process.env.NEXT_PUBLIC_APP_URL}/nps?score=${n}" style="display:inline-block;width:36px;height:36px;line-height:36px;text-align:center;border-radius:8px;background:#1e1e2e;color:#e2e8f0;text-decoration:none;font-weight:600;font-size:13px">${n}</a>`).join('')}
</div>
<p style="font-size:12px;color:#475569">1 = Not at all likely · 10 = Extremely likely</p>
`),

  testimonialRequest: (name: string) =>
    base("Would you share your story? ⭐", `
<p>Hey ${name}, you've been an Omnia user for 30 days now — that's amazing!</p>
<p>Would you mind leaving a quick review? It takes less than 2 minutes and helps other people discover Omnia.</p>
<a href="${process.env.NEXT_PUBLIC_APP_URL}/review" class="btn">Leave a Review →</a>
<p style="font-size:12px;color:#475569;margin-top:12px">You'll never get this email again — we only ask once.</p>
`),

  upgradeAnniversary: (name: string, planTier: string, bonusTip: string) =>
    base("Happy anniversary, " + name + "! 🎂", `
<p>Hey ${name}, it's been exactly one year since you upgraded to <strong>${planTier}</strong>. Thank you for being an incredible Omnia member.</p>
<div class="divider"></div>
<h2>Pro Tip of the Month</h2>
<p>${bonusTip}</p>
<div class="divider"></div>
<a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="btn">Open Omnia →</a>
`),

  adminAlert: (subject: string, body: string) =>
    base(`⚠️ Admin Alert: ${subject}`, `<p>${body.replace(/\n/g, '</p><p>')}</p>`),
};
