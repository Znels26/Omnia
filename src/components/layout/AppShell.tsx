'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, MessageSquare, CalendarDays, FileText, FolderOpen, Wand2, FileOutput, Receipt, Bell, Settings, CreditCard, LogOut, Sparkles, Menu, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/assistant', label: 'AI Assistant', icon: MessageSquare },
  { href: '/planner', label: 'Planner', icon: CalendarDays },
  { href: '/notes', label: 'Notes', icon: FileText },
  { href: '/files', label: 'Files', icon: FolderOpen },
  { href: '/content-studio', label: 'Content Studio', icon: Wand2 },
  { href: '/document-builder', label: 'Doc Builder', icon: FileOutput },
  { href: '/invoices', label: 'Invoices', icon: Receipt },
  { href: '/reminders', label: 'Reminders', icon: Bell },
];

const BOTTOM_NAV = [
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/billing', label: 'Billing', icon: CreditCard },
];

const MOBILE_NAV = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/assistant', label: 'AI', icon: MessageSquare },
  { href: '/planner', label: 'Planner', icon: CalendarDays },
  { href: '/notes', label: 'Notes', icon: FileText },
  { href: '/content-studio', label: 'Create', icon: Wand2 },
];

const PLAN_COLORS: Record<string, string> = { free: '#888', plus: 'hsl(205, 90%, 60%)', pro: 'hsl(262, 83%, 75%)' };

export function AppShell({ profile, children }: { profile: any; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const signOut = async () => {
    await createClient().auth.signOut();
    router.push('/login');
  };

  const NavItem = ({ href, label, icon: Icon }: { href: string; label: string; icon: any }) => {
    const active = pathname === href || pathname.startsWith(href + '/');
    return (
      <Link href={href} onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '8px', textDecoration: 'none', fontSize: '13.5px', fontWeight: active ? 600 : 400, color: active ? 'hsl(205, 90%, 60%)' : 'hsl(240 5% 60%)', background: active ? 'hsl(205 90% 48% / 0.1)' : 'transparent', transition: 'all 0.15s', position: 'relative' }}>
        <Icon size={16} />
        {label}
        {active && <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: '3px', height: '20px', background: 'hsl(205, 90%, 48%)', borderRadius: '0 3px 3px 0' }} />}
      </Link>
    );
  };

  const SidebarContent = () => (
    <>
      <div style={{ padding: '16px', borderBottom: '1px solid hsl(240 6% 14%)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'hsl(205 90% 48% / 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Sparkles size={15} color="hsl(205, 90%, 48%)" />
        </div>
        <span style={{ fontWeight: 700, fontSize: '17px' }}>Omnia</span>
        <button onClick={() => setMobileOpen(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 55%)', display: 'flex', padding: '4px' }} className="md-hide">
          <X size={18} />
        </button>
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {NAV.map(item => <NavItem key={item.href} {...item} />)}
        <div style={{ height: '1px', background: 'hsl(240 6% 14%)', margin: '8px 4px' }} />
        {BOTTOM_NAV.map(item => <NavItem key={item.href} {...item} />)}
      </nav>

      <div style={{ padding: '12px', borderTop: '1px solid hsl(240 6% 14%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '10px', background: 'hsl(240 6% 9%)' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'hsl(205 90% 48% / 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: 'hsl(205, 90%, 60%)', flexShrink: 0 }}>
            {(profile.display_name || profile.email)?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.display_name || profile.full_name || 'User'}</p>
            <p style={{ fontSize: '11px', fontWeight: 600, color: PLAN_COLORS[profile.plan_tier] || '#888', textTransform: 'capitalize' }}>{profile.plan_tier} Plan</p>
          </div>
          <button onClick={signOut} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 50%)', display: 'flex', padding: '4px', flexShrink: 0 }} title="Sign out">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div>
      {/* Desktop sidebar */}
      <aside className="sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)' }} onClick={() => setMobileOpen(false)} />
          <aside style={{ position: 'relative', width: '260px', background: 'hsl(240 10% 5%)', borderRight: '1px solid hsl(240 6% 14%)', display: 'flex', flexDirection: 'column', zIndex: 1 }}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Mobile header */}
      <header style={{ display: 'none', position: 'sticky', top: 0, zIndex: 30, background: 'hsl(240 10% 4% / 0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid hsl(240 6% 14%)', padding: '0 16px', height: '56px', alignItems: 'center', justifyContent: 'space-between' }} className="mobile-header">
        <button onClick={() => setMobileOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(0 0% 90%)', display: 'flex', padding: '4px' }}>
          <Menu size={20} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} color="hsl(205, 90%, 48%)" />
          <span style={{ fontWeight: 700, fontSize: '16px' }}>Omnia</span>
        </div>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'hsl(205 90% 48% / 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: 'hsl(205, 90%, 60%)' }}>
          {(profile.display_name || profile.email)?.[0]?.toUpperCase() || 'U'}
        </div>
      </header>

      {/* Main */}
      <main className="main-content" style={{ paddingBottom: '0' }}>
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav">
        {MOBILE_NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link key={href} href={href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', padding: '6px 12px', textDecoration: 'none', color: active ? 'hsl(205, 90%, 60%)' : 'hsl(240 5% 55%)', transition: 'color 0.15s' }}>
              <Icon size={20} />
              <span style={{ fontSize: '10px', fontWeight: 500 }}>{label}</span>
            </Link>
          );
        })}
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .mobile-header { display: flex !important; }
        }
        @media (min-width: 769px) {
          .md-hide { display: none !important; }
        }
      `}</style>
    </div>
  );
}
