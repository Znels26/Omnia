import { redirect } from 'next/navigation';
import { getUser, createAdminSupabaseClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/AppShell';
import { getAppData } from '@/lib/app-data';

export const metadata = { title: 'Admin — Omnia' };

export default async function AdminPage() {
  const user = await getUser();
  if (!user || user.email !== process.env.INTERNAL_ADMIN_EMAIL) redirect('/dashboard');
  const profile = await getAppData();
  if (!profile) redirect('/login');
  const admin = createAdminSupabaseClient();
  const { data: users } = await admin.from('profiles').select('*').order('created_at', { ascending: false }).limit(100);
  const { data: flags } = await admin.from('feature_flags').select('*').order('key');
  return (
    <AppShell profile={profile}>
      <div className="page">
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>Admin Panel</h1>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <p style={{ fontSize: '28px', fontWeight: 700 }}>{users?.length || 0}</p>
            <p style={{ color: 'hsl(240 5% 55%)', fontSize: '13px' }}>Total Users</p>
          </div>
          <div className="card" style={{ padding: '20px' }}>
            <p style={{ fontSize: '28px', fontWeight: 700 }}>{users?.filter(u => u.plan_tier !== 'free').length || 0}</p>
            <p style={{ color: 'hsl(240 5% 55%)', fontSize: '13px' }}>Paid Users</p>
          </div>
        </div>
        <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
          <h2 style={{ fontWeight: 600, marginBottom: '12px' }}>Recent Users</h2>
          {users?.slice(0, 20).map((u: any) => (
            <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid hsl(240 6% 11%)', fontSize: '13px' }}>
              <span>{u.email}</span>
              <span style={{ color: u.plan_tier === 'free' ? '#888' : u.plan_tier === 'plus' ? 'hsl(205,90%,60%)' : 'hsl(262,83%,75%)' }}>{u.plan_tier}</span>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
