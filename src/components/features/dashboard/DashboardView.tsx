'use client';
import Link from 'next/link';
import {
  MessageSquare, CalendarDays, FileText, Wand2, FileOutput,
  Bell, ArrowRight, Sparkles, Clock, Zap, BarChart3, Brain,
  FileSignature, DollarSign, Heart, CheckCircle2, FolderOpen, Bot,
} from 'lucide-react';
import { timeAgo, formatDate, PLAN_LIMITS } from '@/lib/utils';

const QUICK_ACTIONS = [
  { href: '/assistant',      label: 'Chat',     icon: MessageSquare, color: '#38aaf5', bg: 'rgba(56,170,245,0.12)' },
  { href: '/planner',        label: 'Task',     icon: CalendarDays,  color: '#fbbf24', bg: 'rgba(251,191,36,0.12)'  },
  { href: '/notes',          label: 'Note',     icon: FileText,      color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  { href: '/content-studio', label: 'Content',  icon: Wand2,         color: '#f472b6', bg: 'rgba(244,114,182,0.12)' },
  { href: '/invoices',       label: 'Invoice',  icon: FileOutput,    color: '#34d399', bg: 'rgba(52,211,153,0.12)'  },
  { href: '/reminders',      label: 'Reminder', icon: Bell,          color: '#fb923c', bg: 'rgba(251,146,60,0.12)'  },
  { href: '/files',          label: 'Files',    icon: FolderOpen,    color: '#60a5fa', bg: 'rgba(96,165,250,0.12)'  },
];

const AI_TOOLS = [
  { href: '/life-hub',        label: 'Life Hub',          desc: 'Finance & fitness tools',   icon: Heart,         color: 'hsl(340,80%,65%)',  bg: 'hsl(340 80% 55% / 0.1)', border: 'hsl(340 80% 55% / 0.2)' },
  { href: '/ai-tools',        label: 'AI Money Tools',    desc: 'Lead magnets, SEO, emails', icon: DollarSign,    color: 'hsl(142,70%,55%)',  bg: 'hsl(142 70% 40% / 0.1)', border: 'hsl(142 70% 40% / 0.2)' },
  { href: '/proposal',        label: 'Proposals',         desc: 'Win clients with AI',       icon: FileSignature, color: 'hsl(205,90%,60%)',  bg: 'hsl(205 90% 48% / 0.1)', border: 'hsl(205 90% 48% / 0.2)' },
  { href: '/settings#memory', label: 'AI Memory',         desc: 'Teach Omnia about you',     icon: Brain,         color: 'hsl(160,60%,55%)',  bg: 'hsl(160 60% 40% / 0.1)', border: 'hsl(160 60% 40% / 0.2)' },
];

const PRIORITY_COLORS: Record<string, string> = { low: '#6b7280', medium: '#fbbf24', high: '#fb923c', urgent: '#ef4444' };

const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

export function DashboardView({ profile, tasks, reminders, notes, chats, exports, usage, autopilotProfile }: any) {
  const plan = profile?.plan_tier || 'free';
  const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const name = profile?.display_name || profile?.full_name?.split(' ')[0] || 'there';
  const pendingTasks = tasks.filter((t: any) => t.status !== 'completed');

  return (
    <div className="page" style={{ paddingBottom: '80px' }}>
      <style>{`
        .qa-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
        .ai-tools-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; }
        .dash-main { display: grid; grid-template-columns: minmax(0,3fr) minmax(0,2fr); gap: 16px; }
        @media (max-width: 700px) {
          .qa-grid { grid-template-columns: repeat(4, 1fr); }
          .ai-tools-row { grid-template-columns: repeat(2, 1fr); gap: 8px; }
          .dash-main { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* ── Greeting ── */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em', color: 'hsl(240 5% 42%)', textTransform: 'uppercase', marginBottom: '4px' }}>
          {formatDate(new Date(), 'EEEE, MMMM d')}
        </p>
        <h1 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 4px' }}>{greeting}, {name} 👋</h1>
        <p style={{ color: 'hsl(240 5% 50%)', fontSize: '13px', margin: 0 }}>
          {pendingTasks.length > 0
            ? `${pendingTasks.length} task${pendingTasks.length !== 1 ? 's' : ''} pending today`
            : 'All caught up — great work!'}
        </p>
      </div>

      {/* ── Autopilot Insight Card ── */}
      {autopilotProfile && (
        <div style={{
          marginBottom: '20px',
          padding: '14px 16px',
          borderRadius: '12px',
          background: 'hsl(205 90% 48% / 0.08)',
          border: '1px solid hsl(205 90% 48% / 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
        }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'hsl(205 90% 48% / 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Zap size={18} color="hsl(205,90%,60%)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 2px', color: 'hsl(0 0% 90%)' }}>Autopilot is working for you</p>
            <p style={{ fontSize: '12px', color: 'hsl(240 5% 50%)', margin: 0 }}>
              {autopilotProfile?.persona ? `Running as The ${capitalize(autopilotProfile.persona)}` : 'Set up Autopilot to let Omnia work while you sleep'}
            </p>
          </div>
          <Link href="/autopilot" style={{ fontSize: '12px', color: 'hsl(205,90%,60%)', fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}>
            {autopilotProfile?.autopilot_enabled ? 'View →' : 'Set up →'}
          </Link>
        </div>
      )}

      {/* ── Quick Actions ── */}
      <SectionLabel>Quick Actions</SectionLabel>
      <div className="qa-grid" style={{ marginBottom: '24px' }}>
        {QUICK_ACTIONS.map(({ href, label, icon: Icon, color, bg }) => (
          <Link key={href} href={href} style={{ textDecoration: 'none' }}>
            <div className="card card-hover" style={{ padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px', textAlign: 'center', minHeight: '72px', justifyContent: 'center' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={15} color={color} />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 500, color: 'hsl(240 5% 58%)', lineHeight: 1.2 }}>{label}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* ── AI Tools ── */}
      <SectionLabel>AI Tools</SectionLabel>
      <div className="ai-tools-row" style={{ marginBottom: '28px' }}>
        {AI_TOOLS.map(({ href, label, desc, icon: Icon, color, bg, border, pro }: any) => (
          <Link key={href} href={href} style={{ textDecoration: 'none' }}>
            <div className="card card-hover" style={{ padding: '14px 16px', borderColor: border, background: bg, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'hsl(240 10% 5%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={16} color={color} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'hsl(0 0% 90%)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</p>
                  {pro && <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', background: 'hsl(262 83% 58% / 0.2)', color: 'hsl(262,83%,75%)', flexShrink: 0 }}>PRO</span>}
                </div>
                <p style={{ fontSize: '11px', color: 'hsl(240 5% 48%)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Main content grid ── */}
      <div className="dash-main">
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Tasks */}
          <DashCard title="Tasks" icon={<CalendarDays size={14} color="#fbbf24"/>} link="/planner" linkText="View all">
            {pendingTasks.length === 0 ? (
              <EmptyState icon={<CheckCircle2 size={20} color="hsl(142,70%,55%)"/>} msg="What's the first thing we're tackling today?" sub="Add your first task to get started" link="/planner" linkText="Add task" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {pendingTasks.slice(0, 5).map((t: any) => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', background: 'hsl(240 6% 9%)' }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: PRIORITY_COLORS[t.priority] || '#888', flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'hsl(0 0% 85%)' }}>{t.title}</span>
                    {t.due_date && <span style={{ fontSize: '11px', color: 'hsl(240 5% 45%)', flexShrink: 0 }}>{formatDate(t.due_date, 'MMM d')}</span>}
                  </div>
                ))}
                {pendingTasks.length > 5 && (
                  <p style={{ fontSize: '11px', color: 'hsl(240 5% 45%)', textAlign: 'center', margin: '4px 0 0' }}>+{pendingTasks.length - 5} more</p>
                )}
              </div>
            )}
          </DashCard>

          {/* Recent Chats */}
          <DashCard title="Recent Chats" icon={<MessageSquare size={14} color="#38aaf5"/>} link="/assistant" linkText="New chat">
            {chats.length === 0 ? (
              <EmptyState icon={<Sparkles size={20} color="hsl(205,90%,60%)"/>} msg="Ask me anything — I already know a bit about you" sub="Start your first conversation" link="/assistant" linkText="Chat now" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {chats.slice(0, 4).map((c: any) => (
                  <Link key={c.id} href="/assistant" style={{ textDecoration: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', background: 'hsl(240 6% 9%)', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'hsl(240 6% 11%)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'hsl(240 6% 9%)')}
                    >
                      <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: 'hsl(205 90% 48% / 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Sparkles size={11} color="hsl(205,90%,60%)" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'hsl(0 0% 85%)', margin: 0 }}>{c.title}</p>
                        <p style={{ fontSize: '11px', color: 'hsl(240 5% 45%)', margin: 0 }}>{timeAgo(c.created_at)}</p>
                      </div>
                      <ArrowRight size={12} color="hsl(240 5% 40%)" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </DashCard>

          {/* Notes */}
          <DashCard title="Notes" icon={<FileText size={14} color="#a78bfa"/>} link="/notes" linkText="View all">
            {notes.length === 0 ? (
              <EmptyState icon={<FileText size={20} color="hsl(262,83%,75%)"/>} msg="Ready to capture your first idea?" sub="Your notes live here" link="/notes" linkText="New note" />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {notes.slice(0, 4).map((n: any) => (
                  <Link key={n.id} href="/notes" style={{ textDecoration: 'none' }}>
                    <div style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid hsl(240 6% 13%)', background: 'hsl(240 6% 9%)', transition: 'border-color 0.15s' }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = 'hsl(262 83% 58% / 0.3)')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'hsl(240 6% 13%)')}
                    >
                      <p style={{ fontSize: '12.5px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'hsl(0 0% 88%)', margin: '0 0 3px' }}>{n.title || 'Untitled'}</p>
                      <p style={{ fontSize: '11px', color: 'hsl(240 5% 45%)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{n.content_preview || 'Empty note'}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </DashCard>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Reminders */}
          <DashCard title="Upcoming Reminders" icon={<Bell size={14} color="#fb923c"/>} link="/reminders" linkText="Add">
            {reminders.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'hsl(240 5% 42%)', textAlign: 'center', padding: '16px 0', margin: 0 }}>No upcoming reminders</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {reminders.slice(0, 4).map((r: any) => (
                  <div key={r.id} style={{ display: 'flex', gap: '10px', padding: '9px 10px', borderRadius: '8px', background: 'hsl(240 6% 9%)' }}>
                    <Clock size={12} color="#fb923c" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '12.5px', fontWeight: 500, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</p>
                      <p style={{ fontSize: '11px', color: 'hsl(240 5% 45%)', margin: 0 }}>{formatDate(r.remind_at, 'MMM d, h:mm a')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DashCard>

          {/* Usage */}
          <DashCard title="Plan Usage" icon={<BarChart3 size={14} color="#34d399"/>} link="/billing" linkText="Upgrade">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span className={`badge badge-${plan}`} style={{ textTransform: 'capitalize', fontSize: '12px' }}>{plan} Plan</span>
              {plan !== 'pro' && (
                <Link href="/billing" style={{ fontSize: '11px', color: 'hsl(205,90%,60%)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Zap size={10} /> Upgrade
                </Link>
              )}
            </div>
            {[
              { label: 'AI Messages', used: usage?.ai_requests_used || 0, limit: limits.ai },
              { label: 'Notes',        used: usage?.notes_count || 0,       limit: limits.notes },
              { label: 'Exports',      used: usage?.exports_count || 0,     limit: limits.exports },
            ].map(({ label, used, limit }) => {
              const pct = limit === -1 ? 0 : Math.min((used / limit) * 100, 100);
              return (
                <div key={label} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '12px', color: 'hsl(240 5% 58%)' }}>{label}</span>
                    <span style={{ fontSize: '12px', color: pct >= 80 ? (pct >= 95 ? '#ef4444' : '#fbbf24') : 'hsl(240 5% 50%)' }}>
                      {limit === -1 ? '∞' : `${used} / ${limit}`}
                    </span>
                  </div>
                  {limit !== -1 && (
                    <div className="usage-bar">
                      <div className={`usage-fill${pct >= 95 ? ' danger' : pct >= 80 ? ' warn' : ''}`} style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </div>
              );
            })}
            {plan === 'free' && (
              <Link href="/billing" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '9px', background: 'hsl(205 90% 48% / 0.1)', border: '1px solid hsl(205 90% 48% / 0.2)', color: 'hsl(205,90%,60%)', textDecoration: 'none', fontSize: '12.5px', fontWeight: 600, marginTop: '4px' }}>
                <Zap size={13} /> Upgrade for Life Hub & more
              </Link>
            )}
          </DashCard>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.07em', color: 'hsl(240 5% 38%)', textTransform: 'uppercase', marginBottom: '8px' }}>
      {children}
    </p>
  );
}

function DashCard({ title, icon, link, linkText, children }: any) {
  return (
    <div className="card" style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          {icon}
          <span style={{ fontWeight: 600, fontSize: '13px', color: 'hsl(0 0% 88%)' }}>{title}</span>
        </div>
        <Link href={link} style={{ fontSize: '11px', color: 'hsl(205,90%,55%)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 500 }}>
          {linkText} <ArrowRight size={10} />
        </Link>
      </div>
      {children}
    </div>
  );
}

function EmptyState({ icon, msg, sub, link, linkText }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '20px 0', textAlign: 'center' }}>
      {icon}
      <p style={{ fontSize: '13px', color: 'hsl(240 5% 55%)', margin: 0 }}>{msg}</p>
      <p style={{ fontSize: '11px', color: 'hsl(240 5% 40%)', margin: 0 }}>{sub}</p>
      <Link href={link} style={{ fontSize: '12px', color: 'hsl(205,90%,60%)', textDecoration: 'none', fontWeight: 600, marginTop: '4px' }}>{linkText} →</Link>
    </div>
  );
}
