import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

type AutopilotUser = {
  user_id: string;
  persona: string | null;
  industry: string | null;
  autopilot_enabled: boolean;
  profiles: {
    email: string | null;
    display_name: string | null;
    full_name: string | null;
  } | null;
};

type TavilyResult = {
  title: string;
  url: string;
  content: string;
};

async function searchTavily(query: string): Promise<TavilyResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    console.warn('[cron/opportunities] TAVILY_API_KEY not configured');
    return [];
  }

  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        max_results: 3,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[cron/opportunities] Tavily error ${res.status}:`, body);
      return [];
    }

    const data = await res.json();
    return (data.results ?? []).slice(0, 3).map((r: any) => ({
      title: String(r.title ?? '').slice(0, 300),
      url: String(r.url ?? ''),
      content: String(r.content ?? '').slice(0, 500),
    }));
  } catch (err) {
    console.error('[cron/opportunities] Tavily fetch error:', err);
    return [];
  }
}

function buildOpportunityQuery(persona: string, industry: string): string {
  const personaQueryMap: Record<string, string> = {
    hustler: `freelance gigs remote work opportunities ${industry}`,
    creator: `content creator monetisation opportunities ${industry}`,
    operator: `business growth opportunities ${industry} clients`,
    builder: `investment savings financial opportunities ${industry}`,
    optimiser: `productivity tools systems opportunities ${industry}`,
    starter: `beginner opportunities ${industry} getting started`,
  };

  return personaQueryMap[persona.toLowerCase()] ?? `opportunities for ${persona} in ${industry}`;
}

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();
  const now = new Date().toISOString();

  // Fetch autopilot-enabled users
  const { data: users, error: usersError } = await supabase
    .from('user_autopilot_profile')
    .select('user_id, persona, industry, autopilot_enabled, profiles(email, display_name, full_name)')
    .eq('autopilot_enabled', true)
    .limit(100);

  if (usersError) {
    console.error('[cron/opportunities] users fetch error:', usersError.message);
    await supabase.from('cron_logs').insert({
      job_name: 'opportunities',
      status: 'error',
      details: { error: usersError.message },
    });
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }

  if (!users?.length) {
    await supabase.from('cron_logs').insert({
      job_name: 'opportunities',
      status: 'success',
      details: { users_processed: 0, opportunities_found: 0 },
    });
    return NextResponse.json({ ok: true, opportunities_found: 0 });
  }

  let totalOpportunitiesFound = 0;

  for (const user of users as AutopilotUser[]) {
    try {
      const userId = user.user_id;
      const persona = user.persona ?? 'freelancer';
      const industry = user.industry ?? 'business';

      const query = buildOpportunityQuery(persona, industry);
      const results = await searchTavily(query);

      if (results.length === 0) continue;

      for (const result of results) {
        const { error: oppError } = await supabase.from('opportunity_queue').insert({
          user_id: userId,
          title: result.title,
          url: result.url,
          description: result.content,
          source: 'tavily_opportunities',
          status: 'new',
          metadata: {
            persona,
            industry,
            query,
            found_at: now,
          },
          created_at: now,
        });

        if (oppError) {
          console.error(`[cron/opportunities] opportunity_queue insert error for ${userId}:`, oppError.message);
        } else {
          totalOpportunitiesFound++;
        }
      }

      // Log to autopilot_log
      const { error: logError } = await supabase.from('autopilot_log').insert({
        user_id: userId,
        event_type: 'opportunities_found',
        findings: [
          `Found ${results.length} opportunities for ${persona} in ${industry}`,
          `Query: "${query}"`,
        ],
        created_at: now,
      });
      if (logError) {
        console.error(`[cron/opportunities] autopilot_log insert error for ${userId}:`, logError.message);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[cron/opportunities] error processing user ${user.user_id}:`, message);
    }
  }

  // Log to cron_logs
  await supabase.from('cron_logs').insert({
    job_name: 'opportunities',
    status: 'success',
    details: {
      users_processed: users.length,
      opportunities_found: totalOpportunitiesFound,
    },
  });

  return NextResponse.json({ ok: true, opportunities_found: totalOpportunitiesFound });
}
