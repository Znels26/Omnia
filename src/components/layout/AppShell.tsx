"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
LayoutDashboard, MessageSquare, CalendarDays, FileText,
FolderOpen, Wand2, FileOutput, Receipt, Bell, Settings,
CreditCard, LogOut, Sparkles, Menu, X, FileSignature, Layers, ShieldCheck,
DollarSign, CalendarClock, Share2, Heart, Code2, Zap
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { PWAInstallBanner } from './PWAInstallBanner';
import { NotificationPrompt } from '@/components/notifications/NotificationPrompt';

const NAV = [
{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
{ href: '/autopilot', label: 'Autopilot', icon: Zap },
{ href: '/assistant', label: 'AI Assistant', icon: MessageSquare },
{ href: '/planner', label: 'Planner', icon: CalendarDays },
{ href: '/notes', label: 'Notes', icon: FileText },
{ href: '/files', label: 'Files', icon: FolderOpen },
{ href: '/content-studio', label: 'Content Studio', icon: Wand2 },
{ href: '/ai-tools', label: 'AI Money Tools', icon: DollarSign },
{ href: '/life-hub', label: 'Life Hub', icon: Heart },
{ href: '/document-builder', label: 'Doc Builder', icon: FileOutput },
{ href: '/invoices', label: 'Invoices', icon: Receipt },
{ href: '/reminders', label: 'Reminders', icon: Bell },
{ href: '/proposal', label: 'Proposals', icon: FileSignature },
{ href: '/my-stack', label: 'My Stack', icon: Layers },
{ href: '/settings', label: 'Settings', icon: Settings },
{ href: '/billing', label: 'Billing', icon: CreditCard },
];

const COMING_SOON = [
{ label: 'Code Studio', icon: Code2 },
{ label: 'Content Scheduler', icon: CalendarClock },
{ label: 'Social Auto-Poster', icon: Share2 },
];

const MOBILE_NAV = [
{ href: '/dashboard', label: 'Home', icon: LayoutDashboard },
{ href: '/assistant', label: 'AI', icon: MessageSquare },
{ href: '/planner', label: 'Planner', icon: CalendarDays },
{ href: '/autopilot', label: 'Autopilot', icon: Zap },
{ href: '/content-studio', label: 'Create', icon: Wand2 },
];

export function AppShell({ profile, children }: { profile: any; children: React.ReactNode }) {
const pathname = usePathname();
const router = useRouter();
const [menuOpen, setMenuOpen] = useState(false);

const signOut = async () => {
await createClient().auth.signOut();
router.push('/login');
};

const isOwner = profile?.email === 'zacharynelson96@gmail.com';
const initial = (profile?.display_name || profile?.email || 'U')[0].toUpperCase();
const planColor: Record<string, string> = { free: '#888', plus: 'hsl(205,90%,60%)', pro: 'hsl(262,83%,75%)' };

const NavLink = ({ href, label, icon: Icon }: any) => {
const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
return (
<Link
href={href}
onClick={() => setMenuOpen(false)}
style={{
display: 'flex',
alignItems: 'center',
gap: '10px',
padding: '9px 12px',
borderRadius: '8px',
textDecoration: 'none',
fontSize: '13.5px',
fontWeight: active ? 600 : 400,
color: active ? 'hsl(205,90%,60%)' : 'hsl(240 5% 60%)',
background: active ? 'hsl(205 90% 48% / 0.1)' : 'transparent',
transition: 'all 0.15s',
position: 'relative',
}}
>
{active && (
<span style={{
position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
width: '3px', height: '20px', background: 'hsl(205,90%,48%)', borderRadius: '0 3px 3px 0',
}} />
)}
<Icon size={16} />
{label}
{href === '/autopilot' && (
<span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'hsl(142, 70%, 55%)', marginLeft: 'auto', flexShrink: 0, animation: 'pulse 2s infinite' }} />
)}
</Link>
);
};

const SidebarInner = () => (
<>
<style>{`@keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.4 } }`}</style>
{/* Logo */}
<div style={{ padding: '16px', borderBottom: '1px solid hsl(240 6% 14%)', display: 'flex', alignItems: 'center', gap: '10px' }}>
<div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'hsl(205 90% 48% / 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
<Sparkles size={15} color="hsl(205,90%,48%)" />
</div>
<span style={{ fontWeight: 700, fontSize: '17px' }}>Omnia</span>
{/* Close button for mobile overlay */}
<button
onClick={() => setMenuOpen(false)}
style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 55%)', display: 'flex', padding: '4px' }}
>
<X size={18} />
</button>
</div>

  {/* Nav links */}
  <nav style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
    {NAV.map(item => <NavLink key={item.href} {...item} />)}

    {/* Coming Soon */}
    <div style={{ height: '1px', background: 'hsl(240 6% 14%)', margin: '8px 4px 6px' }} />
    <p style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(240 5% 38%)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 12px', margin: '0 0 4px' }}>Coming Soon</p>
    {COMING_SOON.map(({ label, icon: Icon }) => (
      <div
        key={label}
        style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '9px 12px', borderRadius: '8px',
          fontSize: '13.5px', color: 'hsl(240 5% 38%)',
          cursor: 'default', userSelect: 'none',
        }}
      >
        <Icon size={16} />
        {label}
        <span style={{
          marginLeft: 'auto', fontSize: '9px', fontWeight: 700,
          background: 'hsl(240 6% 14%)', color: 'hsl(240 5% 45%)',
          padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>Soon</span>
      </div>
    ))}

    {isOwner && (
      <>
        <div style={{ height: '1px', background: 'hsl(240 6% 14%)', margin: '6px 4px' }} />
        <NavLink href="/admin" label="Owner Dashboard" icon={ShieldCheck} />
      </>
    )}
  </nav>

  {/* User profile footer */}
  <div style={{ padding: '12px', borderTop: '1px solid hsl(240 6% 14%)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '10px', background: 'hsl(240 6% 9%)' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'hsl(205 90% 48% / 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: 'hsl(205,90%,60%)', flexShrink: 0 }}>
        {initial}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {profile?.display_name || profile?.full_name || 'User'}
        </p>
        <p style={{ fontSize: '11px', fontWeight: 600, color: planColor[profile?.plan_tier] || '#888', textTransform: 'capitalize' }}>
          {profile?.plan_tier || 'free'} Plan
        </p>
      </div>
      <button onClick={signOut} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 50%)', display: 'flex', padding: '4px', flexShrink: 0 }} title="Sign out">
        <LogOut size={15} />
      </button>
    </div>
  </div>
</>

);

return (
<>
{/* ── DESKTOP SIDEBAR ── */}
<aside className="sidebar">
<SidebarInner />
</aside>

  {/* ── MOBILE HEADER ── */}
  <header className="mobile-header">
    <button
      onClick={() => setMenuOpen(true)}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(0 0% 90%)', display: 'flex', padding: '6px' }}
    >
      <Menu size={22} />
    </button>

    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Sparkles size={16} color="hsl(205,90%,48%)" />
      <span style={{ fontWeight: 700, fontSize: '17px' }}>Omnia</span>
    </div>

    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'hsl(205 90% 48% / 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: 'hsl(205,90%,60%)' }}>
      {initial}
    </div>
  </header>

  {/* ── MOBILE SLIDE-OVER MENU ── */}
  {menuOpen && (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex' }}>
      {/* Backdrop */}
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)' }}
        onClick={() => setMenuOpen(false)}
      />
      {/* Drawer */}
      <aside style={{
        position: 'relative',
        width: '280px',
        maxWidth: '85vw',
        background: 'hsl(240 10% 5%)',
        borderRight: '1px solid hsl(240 6% 14%)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1,
        overflowY: 'auto',
      }}>
        <SidebarInner />
      </aside>
    </div>
  )}

  {/* ── MAIN CONTENT ── */}
  <main className="main-content">
    {children}
  </main>

  {/* ── PWA INSTALL BANNER ── */}
  <PWAInstallBanner />

  {/* ── PUSH NOTIFICATION PROMPT ── */}
  <NotificationPrompt />

  {/* ── MOBILE BOTTOM NAV ── */}
  <nav className="mobile-nav">
    {MOBILE_NAV.map(({ href, label, icon: Icon }) => {
      const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
      return (
        <Link
          key={href}
          href={href}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            padding: '6px 12px',
            textDecoration: 'none',
            color: active ? 'hsl(205,90%,60%)' : 'hsl(240 5% 55%)',
            transition: 'color 0.15s',
            flex: 1,
          }}
        >
          <Icon size={21} />
          <span style={{ fontSize: '10px', fontWeight: 500 }}>{label}</span>
        </Link>
      );
    })}
  </nav>
</>

);
}