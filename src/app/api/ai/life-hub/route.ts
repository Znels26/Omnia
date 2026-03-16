import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 90;

const TOOL_PROMPTS: Record<string, (f: Record<string, string>) => string> = {
  // ── FINANCE ──────────────────────────────────────────────
  'budget-planner': (f) => `Create a detailed monthly budget plan.
Monthly income: ${f.income || 'not specified'}
Fixed expenses: ${f.fixedExpenses || 'not specified'}
Financial goal: ${f.goal || 'save money and reduce waste'}
Lifestyle: ${f.lifestyle || 'not specified'}

Produce:
1. A complete monthly budget breakdown with specific amounts per category (housing, food, transport, entertainment, savings, etc.)
2. Percentage allocation for each category
3. Practical tips to stay within each category
4. A 3-month savings projection based on this budget
5. Top 3 areas where they're likely overspending`,

  'income-tracker': (f) => `Help create an income tracking system.
Income sources: ${f.sources || 'not specified'}
Employment type: ${f.employmentType || 'freelancer/self-employed'}
Monthly target: ${f.target || 'not specified'}

Produce:
1. A structured income log template for all their sources
2. How to categorise and track irregular income
3. Monthly income analysis framework
4. Tax-relevant categorisation tips
5. Tools and methods to automate income tracking`,

  'expense-tracker': (f) => `Build an expense tracking strategy.
Main spending areas: ${f.spendingAreas || 'not specified'}
Current pain points: ${f.painPoints || 'overspending, no visibility'}
Monthly budget: ${f.budget || 'not specified'}

Produce:
1. A daily expense log framework
2. Categories tailored to their lifestyle
3. Weekly review checklist
4. Red flag spending patterns to watch for
5. Quick wins to reduce expenses this week`,

  'savings-goals': (f) => `Create a personalised savings goal plan.
Goal: ${f.goal || 'build an emergency fund'}
Target amount: ${f.targetAmount || 'not specified'}
Current savings: ${f.currentSavings || '£0'}
Monthly available to save: ${f.monthlySavings || 'not specified'}

Produce:
1. A step-by-step savings roadmap with milestones
2. Exact timeline to reach the goal
3. Recommended savings account types
4. Automation strategies to make saving effortless
5. What to do if they fall behind`,

  'investment-ideas': (f) => `Generate personalised investment ideas.
Risk tolerance: ${f.riskTolerance || 'moderate'}
Available to invest: ${f.amount || 'not specified'}
Investment horizon: ${f.horizon || '5+ years'}
Current knowledge: ${f.experience || 'beginner'}

Produce:
1. 5 investment options suited to their profile with pros/cons
2. Suggested portfolio allocation
3. How to get started with each option (minimum steps)
4. Key risks to understand
5. Realistic return expectations`,

  'debt-payoff': (f) => `Create a debt payoff plan.
Debts: ${f.debts || 'not specified'}
Monthly payment capacity: ${f.monthlyPayment || 'not specified'}
Priority: ${f.priority || 'pay off fastest, save most interest'}

Produce:
1. Debt avalanche AND snowball comparison for their situation
2. Recommended strategy with reasoning
3. Month-by-month payoff schedule
4. Total interest saved with the recommended approach
5. Negotiation tips for reducing interest rates`,

  'tax-estimator': (f) => `Estimate tax liability for a freelancer/self-employed person.
Country/Region: ${f.region || 'UK'}
Gross income: ${f.grossIncome || 'not specified'}
Business expenses: ${f.expenses || 'not specified'}
Other income: ${f.otherIncome || 'none'}

Produce:
1. Estimated tax breakdown (income tax, NI/self-employment tax, etc.)
2. Allowable deductions they may be missing
3. How much to set aside each month for tax
4. Key tax deadlines to know
5. Top 5 legal ways to reduce their tax bill`,

  'financial-health': (f) => `Assess and score financial health.
Monthly income: ${f.income || 'not specified'}
Monthly expenses: ${f.expenses || 'not specified'}
Savings rate: ${f.savingsRate || 'not specified'}
Debt: ${f.debt || 'not specified'}
Emergency fund: ${f.emergencyFund || 'none'}

Produce:
1. Overall financial health score out of 100 with breakdown
2. Scoring in 5 categories: savings, debt, spending, emergency fund, income stability
3. Top 3 areas needing immediate attention
4. 30-day action plan to improve the score
5. Benchmarks to compare against`,

  'net-worth': (f) => `Calculate and analyse net worth.
Assets: ${f.assets || 'not specified (cash, property, investments, etc.)'}
Liabilities: ${f.liabilities || 'not specified (mortgage, loans, credit cards)'}
Goal: ${f.goal || 'grow net worth'}

Produce:
1. Net worth calculation and breakdown
2. Assets-to-liabilities ratio analysis
3. Comparison to age-based benchmarks
4. Top 3 strategies to grow net worth in the next 12 months
5. What to prioritise first: paying down debt or building assets`,

  'passive-income-roadmap': (f) => `Create a personalised passive income roadmap.
Skills: ${f.skills || 'not specified'}
Capital available: ${f.capital || 'minimal'}
Time per week: ${f.timePerWeek || '5-10 hours'}
Income goal: ${f.incomeGoal || '£1,000/month passive'}

Produce:
1. Top 3 passive income streams matched to their skills and capital
2. Step-by-step launch plan for the best option
3. Realistic timeline and income milestones
4. Upfront effort vs ongoing effort breakdown
5. Common pitfalls to avoid`,

  'invoice-revenue': (f) => `Analyse invoice and revenue patterns.
Business type: ${f.businessType || 'freelance/service'}
Average invoice value: ${f.avgInvoice || 'not specified'}
Payment terms: ${f.paymentTerms || 'net 30'}
Late payment issues: ${f.latePayments || 'occasional'}

Produce:
1. Revenue tracking framework for the month/quarter/year
2. Cash flow projection template
3. How to handle late payments professionally (templates included)
4. Strategies to increase average invoice value
5. When and how to raise prices`,

  'bill-reminders': (f) => `Create a bill management system.
Regular bills: ${f.bills || 'not specified'}
Missed payment history: ${f.history || 'occasional'}
Monthly income date: ${f.payDate || 'not specified'}

Produce:
1. Complete bill calendar with suggested payment dates
2. Priority order for paying bills
3. Which bills to automate vs manually pay
4. Buffer strategy to never miss a payment
5. How to negotiate better rates on recurring bills`,

  // ── FITNESS ──────────────────────────────────────────────
  'workout-planner': (f) => `Create a personalised workout plan.
Fitness goal: ${f.goal || 'general fitness'}
Current fitness level: ${f.level || 'beginner'}
Days per week available: ${f.daysPerWeek || '3-4'}
Equipment access: ${f.equipment || 'gym'}
Injuries/limitations: ${f.limitations || 'none'}

Produce:
1. A complete weekly workout schedule with specific exercises
2. Sets, reps, and rest periods for each exercise
3. Warm-up and cool-down routines
4. How to progress over 4 weeks
5. How to track progress`,

  'meal-planner': (f) => `Generate a personalised weekly meal plan.
Goal: ${f.goal || 'eat healthier'}
Dietary restrictions: ${f.restrictions || 'none'}
Calories target: ${f.calories || 'not specified'}
Cooking skill: ${f.cookingSkill || 'intermediate'}
Budget per week: ${f.budget || 'moderate'}

Produce:
1. 7-day meal plan (breakfast, lunch, dinner, snacks)
2. Full shopping list organised by category
3. Meal prep guide (what to prepare in advance)
4. Approximate calorie and macro breakdown
5. 3 quick swap alternatives for busy days`,

  'calorie-tracker': (f) => `Create a calorie and macro tracking system.
Weight: ${f.weight || 'not specified'}
Height: ${f.height || 'not specified'}
Age: ${f.age || 'not specified'}
Goal: ${f.goal || 'maintain weight'}
Activity level: ${f.activity || 'moderately active'}

Produce:
1. Daily calorie target (TDEE calculation shown)
2. Macro breakdown (protein, carbs, fat in grams)
3. Simple food tracking method
4. High-protein meal examples hitting their targets
5. How to adjust macros as they progress`,

  'progress-tracker': (f) => `Design a fitness progress tracking system.
Current stats: ${f.currentStats || 'not specified'}
Goal: ${f.goal || 'lose weight and build muscle'}
Timeline: ${f.timeline || '3 months'}
Metrics to track: ${f.metrics || 'weight, measurements, strength'}

Produce:
1. Weekly progress check-in template
2. Which metrics to track and how often
3. How to take progress photos correctly
4. How to interpret the data and adjust training
5. Motivational milestones with rewards`,

  'ai-trainer': (f) => `Act as a personal AI trainer and provide a comprehensive training session.
Fitness level: ${f.level || 'intermediate'}
Today's focus: ${f.focus || 'full body workout'}
Available time: ${f.time || '45-60 minutes'}
Equipment: ${f.equipment || 'gym'}
Recent performance: ${f.recentPerformance || 'not specified'}

Produce:
1. Today's complete workout with coaching cues for each exercise
2. Mind-muscle connection tips for key exercises
3. How to know if intensity is right
4. Modifications if something feels too hard or too easy
5. Post-workout nutrition advice`,

  'recovery-planner': (f) => `Design a recovery and rest plan.
Training frequency: ${f.trainingFrequency || '4-5 days per week'}
Current recovery issues: ${f.issues || 'muscle soreness, fatigue'}
Sleep quality: ${f.sleep || 'average'}
Stress level: ${f.stress || 'moderate'}

Produce:
1. Optimal rest day schedule for their training frequency
2. Active recovery activities (what and how long)
3. Sleep optimisation protocol for muscle recovery
4. Mobility and stretching routine for rest days
5. Signs of overtraining and how to address it`,

  'supplement-guide': (f) => `Provide evidence-based supplement recommendations.
Goal: ${f.goal || 'build muscle and improve performance'}
Current supplements: ${f.current || 'none'}
Budget per month: ${f.budget || 'moderate'}
Diet type: ${f.diet || 'omnivore'}

Produce:
1. Tier 1 essentials (most evidence-backed for their goal)
2. Tier 2 worth considering
3. Supplements to avoid (overhyped or unnecessary)
4. Optimal timing and dosing for each recommendation
5. Estimated monthly cost and priority order`,

  'challenge-creator': (f) => `Create a 30-day fitness challenge.
Fitness level: ${f.level || 'intermediate'}
Focus area: ${f.focus || 'full body transformation'}
Equipment: ${f.equipment || 'minimal/bodyweight'}
Daily time available: ${f.dailyTime || '20-30 minutes'}

Produce:
1. Complete 30-day challenge calendar (week by week breakdown)
2. Daily exercise prescriptions with progression
3. Challenge rules and guidelines
4. Weekly milestone rewards/check-ins
5. What to expect at each week and how to stay motivated`,

  'habit-streaks': (f) => `Design a fitness habit system with streaks.
Goal habits: ${f.habits || 'daily exercise, better sleep, hydration'}
Current struggles: ${f.struggles || 'consistency'}
Morning/evening person: ${f.schedule || 'not specified'}
Past habit failures: ${f.pastFailures || 'not specified'}

Produce:
1. A curated list of 5 high-impact fitness habits for their goals
2. Habit stacking strategy (linking habits together)
3. Minimum viable versions of each habit for bad days
4. Tracking system that makes streaks motivating
5. How to recover after breaking a streak`,

  'body-metrics': (f) => `Analyse body metrics and create an improvement plan.
Current metrics: ${f.metrics || 'not specified (weight, height, body fat %)'}
Goal metrics: ${f.goalMetrics || 'not specified'}
Timeline: ${f.timeline || '3-6 months'}
Training experience: ${f.experience || 'intermediate'}

Produce:
1. Analysis of current metrics vs healthy ranges
2. Realistic timeline to reach goal metrics
3. The most impactful changes to make first (nutrition vs training)
4. How to accurately measure body fat at home
5. Non-scale victories to track alongside metrics`,
};

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'AI not configured' }, { status: 503 });

  const body = await req.json();
  const { toolId, ...fields } = body;

  if (!toolId) return NextResponse.json({ error: 'toolId required' }, { status: 400 });

  const promptFn = TOOL_PROMPTS[toolId];
  if (!promptFn) return NextResponse.json({ error: 'Unknown tool' }, { status: 400 });

  const prompt = promptFn(fields);

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 3500,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      system: 'You are a world-class financial advisor and personal trainer combined. Provide specific, actionable, personalised advice — never generic. Use clear headings, bullet points, and concrete numbers where possible.',
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    return NextResponse.json({ error: err.error?.message || 'AI error' }, { status: 502 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const reader = res.body!.getReader();
        const dec = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const line of dec.decode(value).split('\n')) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]' || !data) continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: parsed.delta.text })}\n\n`));
              }
              if (parsed.type === 'message_stop') {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              }
            } catch {}
          }
        }
      } catch (err: any) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
  });
}
