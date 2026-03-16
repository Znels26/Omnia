'use client';

import { useState } from ‘react’;
import Link from ‘next/link’;
import { usePathname, useRouter } from ‘next/navigation’;
import {
LayoutDashboard, MessageSquare, CalendarDays, FileText,
FolderOpen, Wand2, FileOutput, Receipt, Bell, Settings,
CreditCard, LogOut, Sparkles, Menu, X
} from ‘lucide-react’;
import { createClient } from ‘@/lib/supabase/client’;

const NAV = [
{ href: ‘/dashboard’, label: ‘Dashboard’, icon: LayoutDashboard },
{ href: ‘/assistant’, label: ‘AI Assistant’, icon: MessageSquare },
{ href: ‘/planner’, label: ‘Planner’, icon: CalendarDays },
{ href: ‘/notes’, label: ‘Notes’, icon: FileText },
{ href: ‘/files’, label: ‘Files’, icon: FolderOpen },
{ href: ‘/content-studio’, label: ‘Content Studio’, icon: Wand2 },
{ href: ‘/document-builder’, label: ‘Doc Builder’, icon: FileOutput },
{ href: ‘/invoices’, label: ‘Invoices’, icon: Receipt },
{ href: ‘/reminders’, label: ‘Reminders’, icon: Bell },
{ href: ‘/settings’, label: ‘Settings’, icon: Settings },
{ href: ‘/billing’, label: ‘Billing’, icon: CreditCard },
];

const MOBILE_NAV = [
{ href: ‘/dashboard’, label: ‘Home’, icon: LayoutDashboard },
{ href: ‘/assistant’, label: ‘AI’, icon: MessageSquare },
{ href: ‘/planner’, label: ‘Planner’, icon: CalendarDays },
{ href: ‘/notes’, label: ‘Notes’, icon: FileText },
{ href: ‘/content-studio’, label: ‘Create’, icon: Wand2 },
];

export function AppShell({ profile, children }: { profile: any; children: React.ReactNode }) {
const pathname = usePathname();
const router = useRouter();
const [menuOpen, setMenuOpen] = useState(false);

const signOut = async () => {
await createClient().auth.signOut();
router.push(’/login’);
};

const initial = (profile?.display_name || profile?.email || ‘U’)[0].toUpperCase();
const planColor: Record<string, string> = { free: ‘#888’, plus: ‘hsl(205,90%,60%)’, pro: ‘hsl(262,83%,75%)’ };

const NavLink = ({ href, label, icon: Icon }: any) => {
const active = pathname === href || (href !== ‘/dashboard’ && pathname.startsWith(href));
return (
<Link
href={href}
onClick={() => setMenuOpen(false)}
style={{
display: ‘flex’,
alignItems: ‘center’,
gap: ‘10px’,
padding: ‘9px 12px’,
borderRadius: ‘8px’,
textDecoration: ‘none’,
fontSize: ‘13.5px’,
fontWeight: active ? 600 : 400,
color: active ? ‘hsl(205,90%,60%)’ : ‘hsl(240 5% 60%)’,
background: active ? ‘hsl(205 90% 48% / 0.1)’ : ‘transparent’,
transition: ‘all 0.15s’,
position: ‘relative’,
}}
>
{active && (
<span style={{
position: ‘absolute’, left: 0, top: ‘50%’, transform: ‘translateY(-50%)’,
width: ‘3px’, height: ‘20px’, background: ‘hsl(205,90%,48%)’, borderRadius: ‘0 3px 3px 0’,
}} />
)}
<Icon size={16} />
{label}
</Link>
);
};

const SidebarInner = () => (
<>
{/* Logo */}
<div style={{ padding: ‘16px’, borderBottom: ‘1px solid hsl(240 6% 14%)’, display: ‘flex’, alignItems: ‘center’, gap: ‘10px’ }}>
<div style={{ width: ‘32px’, height: ‘32px’, borderRadius: ‘10px’, background: ‘hsl(205 90% 48% / 0.2)’, display: ‘flex’, alignItems: ‘center’, justifyContent: ‘center’, flexShrink: 0 }}>
<Sparkles size={15} color="hsl(205,90%,48%)" />
</div>
<span style={{ fontWeight: 700, fontSize: ‘17px’ }}>Omnia</span>
{/* Close button for mobile overlay */}
<button
onClick={() => setMenuOpen(false)}
style={{ marginLeft: ‘auto’, background: ‘none’, border: ‘none’, cursor: ‘pointer’, color: ‘hsl(240 5% 55%)’, display: ‘flex’, padding: ‘4px’ }}
>
<X size={18} />
</button>
</div>

```
  {/* Nav links */}
  <nav style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
    {NAV.map(item => <NavLink key={item.href} {...item} />)}
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
```

);

return (
<>
{/* ── DESKTOP SIDEBAR ── */}
<aside className="sidebar">
<SidebarInner />
</aside>

```
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
```

);
}