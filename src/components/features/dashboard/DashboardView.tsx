'use client';
import Link from 'next/link';
import {
  MessageSquare, CalendarDays, FileText, Wand2, FileOutput,
  Bell, ArrowRight, Sparkles, Clock, Zap, BarChart3, Brain,
  FileSignature, Layers, ClipboardList, DollarSign, Heart,
} from 'lucide-react';
import { timeAgo, formatDate, PLAN_LIMITS } from '@/lib/utils';

const QUICK_ACTIONS = [
  { href: '/assistant',      label: 'New Chat',   icon: MessageSquare, color: '#38aaf5', bg: 'rgba(56,170,245,0.1)' },
  { href: '/planner',        label: 'Add Task',   icon: CalendarDays,  color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
  { href: '/notes',          label: 'New Note',   icon: FileText,      color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  { href: '/content-studio', label: 'Create',     icon: Wand2,         color: '#f472b6', bg: 'rgba(244,114,182,0.1)' },
  { href: '/invoices',       label: 'Invoice',    icon: FileOutput,    color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
  { href: '/reminders',      label: 'Reminder',   icon: Bell,          color: '#fb923c', bg: 'rgba(251,146,60,0.1)' },
];

const AI_TOOLS = [
  { href: '/life-hub',        label: 'Life Hub',            desc: 'Finance & fitness — 22 AI tools',    icon: Heart,         color: 'hsl(340,80%,65%)',   bg: 'hsl(340 80% 55% / 0.08)',  border: 'hsl(340 80% 55% / 0.18)' },
  { href: '/proposal',       label: 'Proposal Generator',  desc: 'Write client proposals in seconds',  icon: FileSignature, color: 'hsl(205,90%,60%)',  bg: 'hsl(205 90% 48% / 0.08)',  border: 'hsl(205 90% 48% / 0.18)' },
  { href: '/ai-tools',       label: 'AI Money Tools',      desc: 'Lead magnets, SEO blogs, emails',    icon: DollarSign,    color: 'hsl(142,70%,55%)',   bg: 'hsl(142 70% 40% / 0.08)',  border: 'hsl(142 70% 40% / 0.18)' },
  { href: '/my-stack',       label: 'Replace My Stack',    desc: 'See what Omnia replaces',            icon: Layers,        color: 'hsl(262,83%,75%)',   bg: 'hsl(262 83% 58% / 0.08)',  border: 'hsl(262 83% 58% / 0.18)' },
  { href: '/settings#memory',label: 'AI Memory',           desc: 'Teach Omnia about you',              icon: Brain,         color: 'hsl(160,60%,55%)',   bg: 'hsl(160 60% 40% / 0.08)',  border: 'hsl(160 60% 40% / 0.18)' },
];

const PRIORITY_COLORS: any = { low: '#6b7280', medium: '#fbbf24', high: '#fb923c', urgent: '#ef4444' };

export function DashboardView({ profile, tasks, reminders, notes, chats, exports, usage }: any) {
  const plan = profile?.plan_tier || 'free';
  const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const name = profile?.display_name || profile?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="page" style={{ paddingBottom: '80px' }}>
      <DashboardStyles />

      {/* ── Greeting ── */}
      <div style={{ marginBottom: '22px' }}>
        <p style={{ fontSize: '13px', color: 'hsl(240 5% 50%)', marginBottom: '3px' }}>{formatDate(new Date(), 'EEEE, MMMM d')}</p>
        <h1 style={{ fontSize: '23px', fontWeight: 700, margin: '0 0 3px' }}>{greeting}, {name} 👋</h1>
        <p style={{ color: 'hsl(240 5% 55%)', fontSize: '13px', margin: 0 }}>
          {tasks.length > 0 ? `${tasks.length} task${tasks.length !== 1 ? 's' : ''} pending` : 'All caught up!'}
        </p>
      </div>

      {/* ── Quick Actions ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', marginBottom: '22px' }} className="quick-grid">
        {QUICK_ACTIONS.map(({ href, label, icon: Icon, color, bg }) => (
          <Link key={href} href={href} style={{ textDecoration: 'none' }}>
            <div className="card card-hover" style={{ padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px', textAlign: 'center' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={16} color={color} />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 500, color: 'hsl(240 5% 60%)', lineHeight: 1.2 }}>{label}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* ── AI Tools row ── */}
      <div style={{ marginBottom: '22px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em', color: 'hsl(240 5% 42%)', textTransform: 'uppercase', marginBottom: '10px' }}>AI Tools</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }} className="ai-tools-grid">
          {AI_TOOLS.map(({ href, label, desc, icon: Icon, color, bg, border }) => (
            <Link key={href} href={href} style={{ textDecoration: 'none' }}>
              <div className="card card-hover" style={{ padding: '14px', borderColor: border, background: bg, display: 'flex', flexDirection: 'column', gap: '8px', height: '100%' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'hsl(240 10% 6%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={15} color={color} />
                </div>
                <div>
                  <p style={{ fontSize: '12.5px', fontWeight: 600, color: 'hsl(0 0% 90%)', margin: '0 0 2px' }}>{label}</p>
                  <p style={{ fontSize: '11px', color: 'hsl(240 5% 48%)', lineHeight: 1.4, margin: 0 }}>{desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Main content grid ── */}
      <div className="dash-grid">
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Section title="Tasks" icon={<CalendarDays size={14} color="#fbbf24"/>} link="/planner">
            {tasks.length === 0
              ? <Empty msg="No pending tasks" link="/planner" linkText="Add task" />
              : tasks.map((t: any) => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '8px', background: 'hsl(240 6% 9%)' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: PRIORITY_COLORS[t.priority] || '#888', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                  {t.due_date && <span style={{ fontSize: '11px', color: 'hsl(240 5% 50%)', flexShrink: 0 }}>{formatDate(t.due_date, 'MMM d')}</span>}
                </div>
              ))
            }
          </Section>

          <Section title="Recent Chats" icon={<MessageSquare size={14} color="#38aaf5"/>} link="/assistant">
            {chats.length === 0
              ? <Empty msg="No chats yet" link="/assistant" linkText="Start chatting" />
              : chats.map((c: any) => (
                <Link key={c.id} href="/assistant" style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '8px', background: 'hsl(240 6% 9%)' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'hsl(205 90% 48% / 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Sparkles size={12} color="hsl(205,90%,60%)" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'hsl(0 0% 88%)', margin: 0 }}>{c.title}</p>
                      <p style={{ fontSize: '11px', color: 'hsl(240 5% 50%)', margin: 0 }}>{c.message_count || 0} msgs · {timeAgo(c.created_at)}</p>
                    </div>
                  </div>
                </Link>
              ))
            }
          </Section>

          <Section title="Recent Notes" icon={<FileText size={14} color="#a78bfa"/>} link="/notes">
            {notes.length === 0
              ? <Empty msg="No notes yet" link="/notes" linkText="Create note" />
              : <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {notes.map((n: any) => (
                    <Link key={n.id} href="/notes" style={{ textDecoration: 'none' }}>
                      <div style={{ padding: '10px', borderRadius: '8px', border: '1px solid hsl(240 6% 14%)', background: 'hsl(240 6% 9%)' }}>
                        <p style={{ fontSize: '12px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'hsl(0 0% 88%)', margin: '0 0 2px' }}>{n.title || 'Untitled'}</p>
                        <p style={{ fontSize: '11px', color: 'hsl(240 5% 50%)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{n.content_preview || 'Empty'}</p>
                      </div>
                    </Link>
                  ))}
                </div>
            }
          </Section>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Section title="Reminders" icon={<Bell size={14} color="#fb923c"/>} link="/reminders">
            {reminders.length === 0
              ? <p style={{ fontSize: '12px', color: 'hsl(240 5% 50%)', textAlign: 'center', padding: '12px 0', margin: 0 }}>No upcoming reminders</p>
              : reminders.map((r: any) => (
                <div key={r.id} style={{ display: 'flex', gap: '8px', padding: '8px', borderRadius: '8px', background: 'hsl(240 6% 9%)' }}>
                  <Clock size={12} color="#fb923c" style={{ flexShrink: 0, marginTop: '3px' }} />
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: 500, margin: '0 0 1px' }}>{r.title}</p>
                    <p style={{ fontSize: '11px', color: 'hsl(240 5% 50%)', margin: 0 }}>{formatDate(r.remind_at, 'MMM d, h:mm a')}</p>
                  </div>
                </div>
              ))
            }
          </Section>

          <Section title="Usage" icon={<BarChart3 size={14} color="#34d399"/>} link="/billing">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span className={`badge badge-${plan}`} style={{ textTransform: 'capitalize' }}>{plan} Plan</span>
            </div>
            {[
              { label: 'AI Messages', used: usage?.ai_requests_used || 0, limit: limits.ai },
              { label: 'Notes',       used: usage?.notes_count || 0,       limit: limits.notes },
              { label: 'Exports',     used: usage?.exports_count || 0,     limit: limits.exports },
            ].map(({ label, used, limit }) => (
              <div key={label} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: 'hsl(240 5% 60%)' }}>{label}</span>
                  <span style={{ fontSize: '12px', color: 'hsl(240 5% 55%)' }}>{limit === -1 ? '∞' : `${used}/${limit}`}</span>
                </div>
                {limit !== -1 && (
                  <div className="usage-bar">
                    <div
                      className={`usage-fill${used/limit >= 0.95 ? ' danger' : used/limit >= 0.8 ? ' warn' : ''}`}
                      style={{ width: `${Math.min((used/limit)*100, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
            {plan === 'free' && (
              <Link href="/billing" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px', borderRadius: '8px', background: 'hsl(205 90% 48% / 0.1)', border: '1px solid hsl(205 90% 48% / 0.2)', color: 'hsl(205,90%,60%)', textDecoration: 'none', fontSize: '12px', fontWeight: 600, marginTop: '8px' }}>
                <Zap size={13} /> Upgrade to Plus
              </Link>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}

const DashboardStyles = () => (
  <style>{`
    .quick-grid    { grid-template-columns: repeat(6,1fr) !important; }
    .ai-tools-grid { grid-template-columns: repeat(5,1fr) !important; }
    .dash-grid     { display: grid; grid-template-columns: minmax(0,3fr) minmax(0,2fr); gap: 16px; }

    @media (max-width: 1100px) {
      .ai-tools-grid { grid-template-columns: repeat(3,1fr) !important; }
    }
    @media (max-width: 900px) {
      .ai-tools-grid { grid-template-columns: repeat(3,1fr) !important; }
    }
    @media (max-width: 640px) {
      .quick-grid    { grid-template-columns: repeat(3,1fr) !important; }
      .ai-tools-grid { grid-template-columns: repeat(2,1fr) !important; }
      .dash-grid     { grid-template-columns: 1fr !important; }
    }
  `}</style>
);

function Section({ title, icon, link, children }: any) {
  return (
    <div className="card" style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          {icon}
          <span style={{ fontWeight: 600, fontSize: '13.5px' }}>{title}</span>
        </div>
        <Link href={link} style={{ fontSize: '11px', color: 'hsl(205,90%,60%)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
          View all <ArrowRight size={10} />
        </Link>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>{children}</div>
    </div>
  );
}

function Empty({ msg, link, linkText }: any) {
  return (
    <div className="empty" style={{ padding: '16px' }}>
      <p style={{ fontSize: '13px', color: 'hsl(240 5% 50%)', margin: '0 0 6px' }}>{msg}</p>
      <Link href={link} style={{ fontSize: '12px', color: 'hsl(205,90%,60%)', textDecoration: 'none' }}>{linkText}</Link>
    </div>
  );
}
