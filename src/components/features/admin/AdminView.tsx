'use client';
import { useState, useEffect, useCallback } from 'react';
import { Users, DollarSign, Zap, Globe, TrendingUp, RefreshCw, Crown, Activity, MessageSquare, FileText } from 'lucide-react';

function StatCard({ label, value, sub, icon: Icon, color }: any) {
  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
        <p style={{ fontSize: '12px', color: 'hsl(240 5% 50%)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
        <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={15} color={color} />
        </div>
      </div>
      <p style={{ fontSize: '28px', fontWeight: 800, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: '12px', color: 'hsl(240 5% 50%)', marginTop: '5px' }}>{sub}</p>}
    </div>
  );
}

function Bar({ label, count, max, color }: any) {
  const pct = max > 0 ? Math.max(4, Math.round((count / max) * 100)) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
      <span style={{ fontSize: '12px', color: 'hsl(240 5% 60%)', width: '72px', flexShrink: 0, textAlign: 'right' }}>{label}</span>
      <div style={{ flex: 1, height: '8px', background: 'hsl(240 6% 12%)', borderRadius: '999px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '999px', transition: 'width 0.5s ease' }} />
      </div>
      <span style={{ fontSize: '12px', color: 'hsl(240 5% 55%)', width: '40px', flexShrink: 0 }}>{count.toLocaleString()}</span>
    </div>
  );
}

function MiniBarChart({ data }: { data: { day: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '52px' }}>
      {data.map((d, i) => (
        <div key={i} title={`${d.day}: ${d.count}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
          <div style={{ width: '100%', background: d.count > 0 ? 'hsl(205, 90%, 48%)' : 'hsl(240 6% 12%)', borderRadius: '3px 3px 0 0', height: `${Math.max(3, (d.count / max) * 44)}px`, transition: 'height 0.4s ease' }} />
          {i % 4 === 0 && <span style={{ fontSize: '8px', color: 'hsl(240 5% 40%)', whiteSpace: 'nowrap' }}>{d.day}</span>}
        </div>
      ))}
    </div>
  );
}

const PLAN_COLORS: Record<string, string> = { free: '#888', plus: 'hsl(205,90%,60%)', pro: 'hsl(262,83%,75%)' };
const REGION_COLORS: Record<string, string> = { Americas: 'hsl(205,90%,60%)', Europe: 'hsl(262,83%,75%)', Asia: 'hsl(38,90%,65%)', Pacific: 'hsl(160,60%,55%)', Africa: 'hsl(0,72%,65%)', UTC: 'hsl(180,60%,55%)', Other: '#888' };

export function AdminView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/metrics');
      if (!res.ok) { setError('Failed to load metrics'); return; }
      setData(await res.json());
      setLastRefresh(new Date());
    } catch { setError('Connection error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading && !data) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="spinner" />
    </div>
  );

  if (error) return (
    <div className="page"><p style={{ color: 'hsl(0,72%,65%)' }}>{error}</p></div>
  );

  if (!data) return null;

  const { totals, revenue, featureUsage, regions, topTimezones, recentUsers, topUsers, growth } = data;
  const maxFeature = featureUsage[0]?.count || 1;
  const maxRegion = regions[0]?.count || 1;
  const conversionRate = totals.users > 0 ? (((totals.plus + totals.pro) / totals.users) * 100).toFixed(1) : '0';

  return (
    <div className="page" style={{ maxWidth: '1100px', paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Crown size={18} color="hsl(262,83%,75%)" />
            <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Owner Dashboard</h1>
          </div>
          <p style={{ fontSize: '13px', color: 'hsl(240 5% 45%)' }}>
            {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString()}` : 'Live metrics'}
          </p>
        </div>
        <button onClick={load} disabled={loading} className="btn btn-outline" style={{ gap: '7px', height: '38px', fontSize: '13px' }}>
          <RefreshCw size={13} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Top stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }} className="admin-4col">
        <StatCard label="Total Users" value={totals.users.toLocaleString()} sub={`+${totals.newThisWeek} this week`} icon={Users} color="hsl(205,90%,60%)" />
        <StatCard label="MRR" value={`$${revenue.mrr.toLocaleString()}`} sub={`ARR ~$${revenue.arr.toLocaleString()}`} icon={DollarSign} color="hsl(160,60%,55%)" />
        <StatCard label="Paid Users" value={totals.plus + totals.pro} sub={`${conversionRate}% conversion`} icon={Zap} color="hsl(38,90%,65%)" />
        <StatCard label="AI Messages" value={totals.chatMessages.toLocaleString()} sub={`~${totals.users > 0 ? Math.round(totals.chatMessages / totals.users) : 0} avg/user`} icon={MessageSquare} color="hsl(262,83%,75%)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }} className="admin-3col">
        <StatCard label="Free" value={totals.free.toLocaleString()} sub={`${totals.users > 0 ? ((totals.free/totals.users)*100).toFixed(0) : 0}% of users`} icon={Users} color="#888" />
        <StatCard label="Plus ($25/mo)" value={totals.plus.toLocaleString()} sub={`$${revenue.plusCount * 25}/mo`} icon={Zap} color="hsl(205,90%,60%)" />
        <StatCard label="Pro ($40/mo)" value={totals.pro.toLocaleString()} sub={`$${revenue.proCount * 40}/mo`} icon={Crown} color="hsl(262,83%,75%)" />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }} className="admin-3col">
        {/* Growth */}
        <div className="card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '14px' }}>
            <TrendingUp size={14} color="hsl(205,90%,60%)" />
            <span style={{ fontWeight: 600, fontSize: '14px' }}>Signups — Last 14 Days</span>
          </div>
          <MiniBarChart data={growth} />
          <p style={{ fontSize: '11px', color: 'hsl(240 5% 45%)', marginTop: '10px' }}>
            +{totals.newThisMonth} this month · +{totals.newThisWeek} this week
          </p>
        </div>

        {/* Feature usage */}
        <div className="card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '14px' }}>
            <Activity size={14} color="hsl(38,90%,65%)" />
            <span style={{ fontWeight: 600, fontSize: '14px' }}>Feature Usage</span>
          </div>
          {featureUsage.map((f: any) => (
            <Bar key={f.label} label={f.label} count={f.count} max={maxFeature} color={f.color} />
          ))}
        </div>

        {/* Geography */}
        <div className="card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '14px' }}>
            <Globe size={14} color="hsl(160,60%,55%)" />
            <span style={{ fontWeight: 600, fontSize: '14px' }}>Geography</span>
          </div>
          {regions.map((r: any) => (
            <Bar key={r.region} label={r.region} count={r.count} max={maxRegion} color={REGION_COLORS[r.region] || '#888'} />
          ))}
          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid hsl(240 6% 12%)' }}>
            <p style={{ fontSize: '11px', color: 'hsl(240 5% 45%)', marginBottom: '6px' }}>Top timezones</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {topTimezones.slice(0, 5).map((t: any) => (
                <span key={t.tz} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '999px', background: 'hsl(240 6% 11%)', border: '1px solid hsl(240 6% 16%)', color: 'hsl(240 5% 55%)' }}>
                  {t.tz.split('/').pop()?.replace('_', ' ')} ({t.count})
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tables row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="admin-2col">
        {/* Recent signups */}
        <div className="card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '14px' }}>
            <Users size={14} color="hsl(205,90%,60%)" />
            <span style={{ fontWeight: 600, fontSize: '14px' }}>Recent Signups</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {recentUsers.map((u: any) => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', background: 'hsl(240 6% 8%)' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'hsl(205 90% 48% / 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: 'hsl(205,90%,60%)', flexShrink: 0 }}>
                  {(u.display_name || u.email || 'U')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '12px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'hsl(0 0% 85%)' }}>{u.display_name || u.email?.split('@')[0]}</p>
                  <p style={{ fontSize: '10px', color: 'hsl(240 5% 45%)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>
                </div>
                <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '999px', background: `${PLAN_COLORS[u.plan_tier] || '#888'}18`, color: PLAN_COLORS[u.plan_tier] || '#888', flexShrink: 0, fontWeight: 600 }}>
                  {u.plan_tier || 'free'}
                </span>
                <span style={{ fontSize: '10px', color: 'hsl(240 5% 40%)', flexShrink: 0 }}>
                  {new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Most active users */}
        <div className="card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '14px' }}>
            <FileText size={14} color="hsl(262,83%,75%)" />
            <span style={{ fontWeight: 600, fontSize: '14px' }}>Most Active Users</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {topUsers.map((u: any, i: number) => (
              <div key={u.user_id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', background: 'hsl(240 6% 8%)' }}>
                <span style={{ fontSize: '11px', color: 'hsl(240 5% 40%)', width: '16px', flexShrink: 0, textAlign: 'right' }}>#{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '12px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'hsl(0 0% 85%)' }}>{u.display_name || u.email?.split('@')[0] || 'User'}</p>
                  <p style={{ fontSize: '10px', color: 'hsl(240 5% 45%)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <span style={{ fontSize: '10px', color: 'hsl(205,90%,60%)' }}>{(u.ai_requests_used || 0).toLocaleString()} AI</span>
                  <span style={{ fontSize: '10px', color: 'hsl(262,83%,75%)' }}>{(u.notes_count || 0)} notes</span>
                </div>
                <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '999px', background: `${PLAN_COLORS[u.plan_tier] || '#888'}18`, color: PLAN_COLORS[u.plan_tier] || '#888', flexShrink: 0, fontWeight: 600 }}>
                  {u.plan_tier || 'free'}
                </span>
              </div>
            ))}
            {topUsers.length === 0 && <p style={{ fontSize: '13px', color: 'hsl(240 5% 45%)', textAlign: 'center', padding: '12px 0' }}>No activity yet</p>}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .admin-4col { grid-template-columns: repeat(2, 1fr) !important; }
          .admin-3col { grid-template-columns: 1fr !important; }
          .admin-2col { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 540px) {
          .admin-4col { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}
