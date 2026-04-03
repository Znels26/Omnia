import { NextResponse } from 'next/server';
import { getUser, createAdminSupabaseClient } from '@/lib/supabase/server';

const OWNER_EMAIL = 'zacharynelson96@gmail.com';
const PLUS_PRICE = 25;
const PRO_PRICE = 40;

function tzToRegion(tz: string): string {
  if (!tz) return 'Other';
  // Americas
  if (tz.startsWith('America/') || tz.startsWith('US/') || tz.startsWith('Canada/') ||
      tz.startsWith('Brazil/') || tz.startsWith('Chile/') || tz.startsWith('Mexico/') ||
      tz === 'EST' || tz === 'CST6CDT' || tz === 'EST5EDT' || tz === 'MST' || tz === 'MST7MDT' ||
      tz === 'PST8PDT' || tz === 'HST' || tz === 'Cuba' || tz === 'Jamaica' ||
      tz.startsWith('Atlantic/')) return 'Americas';
  // Europe
  if (tz.startsWith('Europe/') || tz.startsWith('GB') || tz === 'WET' || tz === 'CET' ||
      tz === 'MET' || tz === 'EET' || tz === 'Turkey' || tz === 'W-SU' || tz === 'Iceland' ||
      tz === 'Eire' || tz === 'Portugal') return 'Europe';
  // Asia
  if (tz.startsWith('Asia/') || tz.startsWith('Israel') || tz === 'Iran' ||
      tz === 'Japan' || tz === 'ROK' || tz === 'Hongkong' || tz === 'Singapore' ||
      tz === 'PRC' || tz === 'ROC' || tz.startsWith('Indian/')) return 'Asia';
  // Pacific / Oceania
  if (tz.startsWith('Australia/') || tz.startsWith('Pacific/') ||
      tz === 'NZ' || tz === 'NZ-CHAT') return 'Pacific';
  // Africa
  if (tz.startsWith('Africa/') || tz === 'Egypt' || tz === 'Libya') return 'Africa';
  // UTC / Etc — treat as their own bucket rather than polluting "Other"
  if (tz === 'UTC' || tz === 'GMT' || tz.startsWith('Etc/') ||
      tz === 'Universal' || tz === 'Zulu') return 'UTC';
  return 'Other';
}

export async function GET() {
  const user = await getUser();
  if (!user || user.email?.toLowerCase() !== OWNER_EMAIL.toLowerCase()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const s = createAdminSupabaseClient();

  const [
    profilesRes,
    usageRes,
    subsRes,
    recentUsersRes,
    topUsersRes,
    tzRes,
    chatCountRes,
    weeklySignupsRes,
    monthlySignupsRes,
    growthRes,
    viewsTodayRes,
    viewsWeekRes,
    viewsRawRes,
    sessionsRawRes,
    reportsRes,
  ] = await Promise.all([
    // All profiles with plan tier
    s.from('profiles').select('id, email, display_name, plan_tier, created_at, timezone'),
    // Aggregate usage
    s.from('usage_counters').select('user_id, ai_requests_used, notes_count, files_count, content_count, exports_count, invoices_count'),
    // Active subscriptions
    s.from('subscriptions').select('plan_tier, status, stripe_subscription_id').eq('status', 'active'),
    // 10 most recent signups
    s.from('profiles').select('id, email, display_name, plan_tier, created_at').order('created_at', { ascending: false }).limit(10),
    // Top 10 users by AI usage
    s.from('usage_counters').select('user_id, ai_requests_used, notes_count, files_count').order('ai_requests_used', { ascending: false }).limit(10),
    // Timezone distribution
    s.from('profiles').select('timezone'),
    // Total chat messages
    s.from('chat_messages').select('id', { count: 'exact', head: true }),
    // New users this week
    s.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
    // New users this month
    s.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
    // Last 30 days signups by day
    s.from('profiles').select('created_at').gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()).order('created_at'),
    // Page views — today
    s.from('page_views').select('*', { count: 'exact', head: true }).gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    // Page views — this week
    s.from('page_views').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
    // Page views — last 30 days rows for chart + top pages
    s.from('page_views').select('page, created_at').gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()).order('created_at'),
    // Unique sessions today
    s.from('page_views').select('session_id').gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    // Problem reports — most recent 50
    s.from('problem_reports').select('id, user_id, email, display_name, category, title, description, status, created_at').order('created_at', { ascending: false }).limit(50),
  ]);

  // Collect any query errors so the client can show what's broken
  const queryErrors: Record<string, string> = {};
  if (profilesRes.error)    queryErrors.profiles    = profilesRes.error.message;
  if (usageRes.error)       queryErrors.usage       = usageRes.error.message;
  if (subsRes.error)        queryErrors.subs        = subsRes.error.message;
  if (recentUsersRes.error) queryErrors.recentUsers = recentUsersRes.error.message;
  if (viewsTodayRes.error)  queryErrors.viewsToday  = viewsTodayRes.error.message;
  if (viewsRawRes.error)    queryErrors.viewsRaw    = viewsRawRes.error.message;

  const profiles = profilesRes.data || [];
  const usage = usageRes.data || [];
  const subs = subsRes.data || [];
  const recentUsers = recentUsersRes.data || [];
  const topUsersRaw = topUsersRes.data || [];

  // User counts by plan
  const planCounts = profiles.reduce((acc: any, p: any) => {
    acc[p.plan_tier || 'free'] = (acc[p.plan_tier || 'free'] || 0) + 1;
    return acc;
  }, {});

  // MRR calculation from active paid subs
  const paidSubs = subs.filter((s: any) => s.stripe_subscription_id);
  const plusCount = paidSubs.filter((s: any) => s.plan_tier === 'plus').length;
  const proCount = paidSubs.filter((s: any) => s.plan_tier === 'pro').length;
  const mrr = plusCount * PLUS_PRICE + proCount * PRO_PRICE;
  const arr = mrr * 12;

  // Aggregate usage totals
  const totalAI = usage.reduce((s: number, u: any) => s + (u.ai_requests_used || 0), 0);
  const totalNotes = usage.reduce((s: number, u: any) => s + (u.notes_count || 0), 0);
  const totalFiles = usage.reduce((s: number, u: any) => s + (u.files_count || 0), 0);
  const totalContent = usage.reduce((s: number, u: any) => s + (u.content_count || 0), 0);
  const totalExports = usage.reduce((s: number, u: any) => s + (u.exports_count || 0), 0);
  const totalInvoices = usage.reduce((s: number, u: any) => s + (u.invoices_count || 0), 0);

  // Feature popularity (sorted)
  const featureUsage = [
    { label: 'AI Chats', count: totalAI, color: 'hsl(205, 90%, 60%)' },
    { label: 'Notes', count: totalNotes, color: 'hsl(262, 83%, 75%)' },
    { label: 'Files', count: totalFiles, color: 'hsl(38, 90%, 65%)' },
    { label: 'Content', count: totalContent, color: 'hsl(160, 60%, 55%)' },
    { label: 'Exports', count: totalExports, color: 'hsl(0, 72%, 65%)' },
    { label: 'Invoices', count: totalInvoices, color: 'hsl(340, 75%, 65%)' },
  ].sort((a, b) => b.count - a.count);

  // Geography — region breakdown
  const tzData = tzRes.data || [];
  const regionCounts = tzData.reduce((acc: any, { timezone }: any) => {
    const region = tzToRegion(timezone || '');
    acc[region] = (acc[region] || 0) + 1;
    return acc;
  }, {});
  const regions = Object.entries(regionCounts)
    .map(([region, count]) => ({ region, count: count as number }))
    .sort((a, b) => b.count - a.count);

  // Top timezones
  const tzCounts = tzData.reduce((acc: any, { timezone }: any) => {
    if (timezone) acc[timezone] = (acc[timezone] || 0) + 1;
    return acc;
  }, {});
  const topTimezones = Object.entries(tzCounts)
    .map(([tz, count]) => ({ tz, count: count as number }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Enrich top users with email/name
  const usageMap = usage.reduce((acc: any, u: any) => { acc[u.user_id] = u; return acc; }, {});
  const profileMap = profiles.reduce((acc: any, p: any) => { acc[p.id] = p; return acc; }, {});
  const topUsers = topUsersRaw.map((u: any) => ({
    ...u,
    email: profileMap[u.user_id]?.email,
    display_name: profileMap[u.user_id]?.display_name,
    plan_tier: profileMap[u.user_id]?.plan_tier,
  }));

  // Page view analytics
  const viewsRaw = viewsRawRes.data || [];
  const viewGrowthData = viewsRaw.reduce((acc: any, { created_at }: any) => {
    const day = created_at.slice(0, 10);
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});
  const viewGrowth = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 86400000);
    const key = d.toISOString().slice(0, 10);
    return { day: key.slice(5), count: viewGrowthData[key] || 0 };
  });

  const topPages = Object.entries(
    viewsRaw.reduce((acc: any, { page }: any) => {
      acc[page] = (acc[page] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([page, count]) => ({ page, count: count as number }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const uniqueSessionsToday = new Set((sessionsRawRes.data || []).map((r: any) => r.session_id)).size;

  // Growth data — signups per day last 30 days
  const growthData = (growthRes.data || []).reduce((acc: any, { created_at }: any) => {
    const day = created_at.slice(0, 10);
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});
  // Fill in last 14 days
  const growth = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 86400000);
    const key = d.toISOString().slice(0, 10);
    return { day: key.slice(5), count: growthData[key] || 0 };
  });

  return NextResponse.json({
    totals: {
      users: profiles.length,
      free: planCounts.free || 0,
      plus: planCounts.plus || 0,
      pro: planCounts.pro || 0,
      newThisWeek: weeklySignupsRes.count || 0,
      newThisMonth: monthlySignupsRes.count || 0,
      chatMessages: chatCountRes.count || 0,
    },
    revenue: { mrr, arr, plusCount, proCount },
    featureUsage,
    regions,
    topTimezones,
    recentUsers,
    topUsers,
    growth,
    views: {
      today:              viewsTodayRes.count ?? 0,
      thisWeek:           viewsWeekRes.count  ?? 0,
      uniqueSessionsToday,
      growth:             viewGrowth,
      topPages,
    },
    reports: reportsRes.data || [],
    generatedAt: new Date().toISOString(),
    queryErrors: Object.keys(queryErrors).length ? queryErrors : undefined,
  });
}
