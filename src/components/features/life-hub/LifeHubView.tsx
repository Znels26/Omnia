'use client';
import { useState, useRef } from 'react';
import { ArrowLeft, Copy, CheckCheck } from 'lucide-react';

type Category = 'finance' | 'fitness';

interface Tool {
  id: string;
  label: string;
  emoji: string;
  desc: string;
  category: Category;
  fields: { key: string; label: string; placeholder: string; required?: boolean }[];
}

const TOOLS: Tool[] = [
  // ── Finance ──────────────────────────────────────
  {
    id: 'budget-planner', label: 'Budget Planner', emoji: '📊', category: 'finance',
    desc: 'Set monthly budgets by category and get a personalised spending plan',
    fields: [
      { key: 'income', label: 'Monthly income (after tax)', placeholder: 'e.g. £3,200', required: true },
      { key: 'fixedExpenses', label: 'Fixed expenses', placeholder: 'e.g. rent £900, phone £40' },
      { key: 'goal', label: 'Main financial goal', placeholder: 'e.g. save £500/month, build emergency fund' },
      { key: 'lifestyle', label: 'Lifestyle notes', placeholder: 'e.g. eat out often, gym membership, car' },
    ],
  },
  {
    id: 'income-tracker', label: 'Income Tracker', emoji: '💵', category: 'finance',
    desc: 'Log all income sources and get a tracking framework',
    fields: [
      { key: 'sources', label: 'Income sources', placeholder: 'e.g. freelance design, salary, side hustle', required: true },
      { key: 'employmentType', label: 'Employment type', placeholder: 'e.g. freelancer, PAYE, both' },
      { key: 'target', label: 'Monthly income target', placeholder: 'e.g. £4,000' },
    ],
  },
  {
    id: 'expense-tracker', label: 'Expense Tracker', emoji: '🧾', category: 'finance',
    desc: 'AI-powered expense categorisation and reduction strategy',
    fields: [
      { key: 'spendingAreas', label: 'Main spending areas', placeholder: 'e.g. food, subscriptions, eating out', required: true },
      { key: 'painPoints', label: 'Pain points', placeholder: 'e.g. overspending on food, surprise costs' },
      { key: 'budget', label: 'Monthly budget', placeholder: 'e.g. £1,500 disposable' },
    ],
  },
  {
    id: 'savings-goals', label: 'Savings Goals', emoji: '🏦', category: 'finance',
    desc: 'Set savings targets and get a step-by-step roadmap to hit them',
    fields: [
      { key: 'goal', label: 'Savings goal', placeholder: 'e.g. house deposit, holiday, emergency fund', required: true },
      { key: 'targetAmount', label: 'Target amount', placeholder: 'e.g. £10,000', required: true },
      { key: 'currentSavings', label: 'Current savings', placeholder: 'e.g. £1,200' },
      { key: 'monthlySavings', label: 'Can save per month', placeholder: 'e.g. £400' },
    ],
  },
  {
    id: 'investment-ideas', label: 'Investment Ideas', emoji: '📈', category: 'finance',
    desc: 'AI suggests investment strategies matched to your risk profile',
    fields: [
      { key: 'amount', label: 'Amount to invest', placeholder: 'e.g. £5,000 lump sum or £200/month', required: true },
      { key: 'riskTolerance', label: 'Risk tolerance', placeholder: 'e.g. low, moderate, high' },
      { key: 'horizon', label: 'Investment timeline', placeholder: 'e.g. 5 years, long-term retirement' },
      { key: 'experience', label: 'Investment experience', placeholder: 'e.g. complete beginner, some ISA experience' },
    ],
  },
  {
    id: 'debt-payoff', label: 'Debt Payoff Planner', emoji: '🔓', category: 'finance',
    desc: 'Enter your debts and AI creates an optimised payoff strategy',
    fields: [
      { key: 'debts', label: 'Your debts', placeholder: 'e.g. credit card £2k @ 24%, student loan £8k @ 4%', required: true },
      { key: 'monthlyPayment', label: 'Monthly payment available', placeholder: 'e.g. £300' },
      { key: 'priority', label: 'Priority', placeholder: 'e.g. pay off ASAP, reduce interest first' },
    ],
  },
  {
    id: 'tax-estimator', label: 'Tax Estimator', emoji: '🧮', category: 'finance',
    desc: 'Estimate your tax bill and find legal ways to reduce it',
    fields: [
      { key: 'grossIncome', label: 'Gross income', placeholder: 'e.g. £45,000 / year', required: true },
      { key: 'region', label: 'Country/Region', placeholder: 'e.g. UK, US (state)' },
      { key: 'expenses', label: 'Business/allowable expenses', placeholder: 'e.g. home office £50/month, equipment £400' },
      { key: 'otherIncome', label: 'Other income', placeholder: 'e.g. rental income £500/month' },
    ],
  },
  {
    id: 'financial-health', label: 'Financial Health Score', emoji: '❤️‍🔥', category: 'finance',
    desc: 'Get a score out of 100 and a 30-day plan to improve it',
    fields: [
      { key: 'income', label: 'Monthly income', placeholder: 'e.g. £3,500', required: true },
      { key: 'expenses', label: 'Monthly expenses', placeholder: 'e.g. £2,800' },
      { key: 'savingsRate', label: 'Savings rate', placeholder: 'e.g. 10%, £300/month, or none' },
      { key: 'debt', label: 'Total debt', placeholder: 'e.g. £4,000 credit card, £12,000 car loan' },
      { key: 'emergencyFund', label: 'Emergency fund', placeholder: 'e.g. 1 month expenses, none' },
    ],
  },
  {
    id: 'net-worth', label: 'Net Worth Tracker', emoji: '💎', category: 'finance',
    desc: 'Track assets vs liabilities and build a plan to grow your net worth',
    fields: [
      { key: 'assets', label: 'Assets', placeholder: 'e.g. savings £5k, car £8k, investments £2k', required: true },
      { key: 'liabilities', label: 'Liabilities', placeholder: 'e.g. student loan £12k, credit card £1k' },
      { key: 'goal', label: 'Net worth goal', placeholder: 'e.g. reach £100k by 35' },
    ],
  },
  {
    id: 'passive-income-roadmap', label: 'Passive Income Roadmap', emoji: '🛤️', category: 'finance',
    desc: 'AI creates a personalised passive income plan based on your skills',
    fields: [
      { key: 'skills', label: 'Your skills', placeholder: 'e.g. design, writing, coding, marketing', required: true },
      { key: 'capital', label: 'Starting capital', placeholder: 'e.g. £500, £2,000, or none' },
      { key: 'timePerWeek', label: 'Hours per week', placeholder: 'e.g. 5-10 hours' },
      { key: 'incomeGoal', label: 'Monthly passive income goal', placeholder: 'e.g. £500/month within 6 months' },
    ],
  },
  {
    id: 'invoice-revenue', label: 'Invoice to Revenue', emoji: '📋', category: 'finance',
    desc: 'Connect invoices to revenue tracking and improve cash flow',
    fields: [
      { key: 'businessType', label: 'Business type', placeholder: 'e.g. freelance designer, agency, consultant', required: true },
      { key: 'avgInvoice', label: 'Average invoice value', placeholder: 'e.g. £1,200' },
      { key: 'paymentTerms', label: 'Payment terms', placeholder: 'e.g. net 30, due on receipt' },
      { key: 'latePayments', label: 'Late payment issues', placeholder: 'e.g. 30% of clients pay late' },
    ],
  },
  {
    id: 'bill-reminders', label: 'Bill Reminders', emoji: '🗓️', category: 'finance',
    desc: 'Never miss a bill — get an organised bill calendar and automation plan',
    fields: [
      { key: 'bills', label: 'Your regular bills', placeholder: 'e.g. rent, electricity, broadband, Netflix, gym', required: true },
      { key: 'payDate', label: 'When you get paid', placeholder: 'e.g. 25th of each month' },
      { key: 'history', label: 'Missed payment history', placeholder: 'e.g. missed broadband twice this year' },
    ],
  },

  // ── Fitness ───────────────────────────────────────
  {
    id: 'workout-planner', label: 'Workout Planner', emoji: '🏋️', category: 'fitness',
    desc: 'AI creates a personalised workout programme for your goals',
    fields: [
      { key: 'goal', label: 'Fitness goal', placeholder: 'e.g. build muscle, lose fat, improve endurance', required: true },
      { key: 'level', label: 'Fitness level', placeholder: 'e.g. beginner, intermediate, advanced' },
      { key: 'daysPerWeek', label: 'Days per week', placeholder: 'e.g. 3-4 days' },
      { key: 'equipment', label: 'Equipment access', placeholder: 'e.g. full gym, home weights, bodyweight only' },
      { key: 'limitations', label: 'Injuries/limitations', placeholder: 'e.g. bad knee, shoulder pain, none' },
    ],
  },
  {
    id: 'meal-planner', label: 'Meal Planner', emoji: '🥗', category: 'fitness',
    desc: 'AI generates a weekly meal plan with shopping list',
    fields: [
      { key: 'goal', label: 'Nutrition goal', placeholder: 'e.g. fat loss, muscle gain, clean eating', required: true },
      { key: 'restrictions', label: 'Dietary restrictions', placeholder: 'e.g. vegetarian, dairy-free, no nuts' },
      { key: 'calories', label: 'Calorie target', placeholder: 'e.g. 1,800 calories or "calculate for me"' },
      { key: 'cookingSkill', label: 'Cooking skill', placeholder: 'e.g. beginner, can follow recipes, confident' },
      { key: 'budget', label: 'Weekly food budget', placeholder: 'e.g. £50, £80' },
    ],
  },
  {
    id: 'calorie-tracker', label: 'Calorie & Macro Tracker', emoji: '🔢', category: 'fitness',
    desc: 'Get your exact calorie and macro targets based on your stats',
    fields: [
      { key: 'weight', label: 'Current weight', placeholder: 'e.g. 80kg', required: true },
      { key: 'height', label: 'Height', placeholder: 'e.g. 5\'10" or 178cm' },
      { key: 'age', label: 'Age', placeholder: 'e.g. 28' },
      { key: 'goal', label: 'Goal', placeholder: 'e.g. lose 1kg/week, maintain, bulk' },
      { key: 'activity', label: 'Activity level', placeholder: 'e.g. desk job + 3x gym, very active' },
    ],
  },
  {
    id: 'progress-tracker', label: 'Progress Tracker', emoji: '📉', category: 'fitness',
    desc: 'Design a tracking system and interpret your fitness data',
    fields: [
      { key: 'goal', label: 'Goal', placeholder: 'e.g. lose 10kg, run 5k, visible abs', required: true },
      { key: 'currentStats', label: 'Current stats', placeholder: 'e.g. 85kg, 28% body fat, can bench 60kg' },
      { key: 'timeline', label: 'Timeline', placeholder: 'e.g. 12 weeks, 6 months' },
      { key: 'metrics', label: 'Metrics you want to track', placeholder: 'e.g. weight, photos, strength, energy' },
    ],
  },
  {
    id: 'ai-trainer', label: 'AI Personal Trainer', emoji: '🎯', category: 'fitness',
    desc: 'Chat with an AI trainer that knows your history and goals',
    fields: [
      { key: 'level', label: 'Fitness level', placeholder: 'e.g. intermediate, 2 years training', required: true },
      { key: 'focus', label: "Today's focus", placeholder: "e.g. chest and triceps, leg day, full body" },
      { key: 'time', label: 'Time available', placeholder: 'e.g. 45 minutes' },
      { key: 'equipment', label: 'Equipment', placeholder: 'e.g. commercial gym, home dumbbells' },
      { key: 'recentPerformance', label: 'Recent performance', placeholder: 'e.g. feeling strong, legs are sore from Monday' },
    ],
  },
  {
    id: 'recovery-planner', label: 'Recovery Planner', emoji: '💤', category: 'fitness',
    desc: 'AI plans your rest days, recovery routines and sleep protocol',
    fields: [
      { key: 'trainingFrequency', label: 'Training frequency', placeholder: 'e.g. 5 days/week, twice a day', required: true },
      { key: 'issues', label: 'Current recovery issues', placeholder: 'e.g. constant DOMS, always tired, poor sleep' },
      { key: 'sleep', label: 'Sleep quality/hours', placeholder: 'e.g. 6 hours, often wake up, restless' },
      { key: 'stress', label: 'Stress level', placeholder: 'e.g. high work stress, moderate, relaxed' },
    ],
  },
  {
    id: 'supplement-guide', label: 'Supplement Guide', emoji: '💊', category: 'fitness',
    desc: 'Evidence-based supplement recommendations for your goal',
    fields: [
      { key: 'goal', label: 'Goal', placeholder: 'e.g. build muscle, lose fat, improve endurance', required: true },
      { key: 'current', label: 'Current supplements', placeholder: 'e.g. whey protein, creatine, or none' },
      { key: 'budget', label: 'Monthly budget', placeholder: 'e.g. £30, £60' },
      { key: 'diet', label: 'Diet type', placeholder: 'e.g. omnivore, vegetarian, vegan' },
    ],
  },
  {
    id: 'challenge-creator', label: 'Challenge Creator', emoji: '🏆', category: 'fitness',
    desc: '30-day personalised fitness challenges to break plateaus',
    fields: [
      { key: 'level', label: 'Fitness level', placeholder: 'e.g. beginner, intermediate', required: true },
      { key: 'focus', label: 'Challenge focus', placeholder: 'e.g. weight loss, build core strength, run 5k' },
      { key: 'equipment', label: 'Equipment', placeholder: 'e.g. none/bodyweight, gym, home weights' },
      { key: 'dailyTime', label: 'Daily time available', placeholder: 'e.g. 20 minutes' },
    ],
  },
  {
    id: 'habit-streaks', label: 'Habit Streaks', emoji: '🔥', category: 'fitness',
    desc: 'Build unbreakable fitness habits with a smart streak system',
    fields: [
      { key: 'habits', label: 'Habits you want to build', placeholder: 'e.g. daily walk, 8 glasses water, 10pm sleep', required: true },
      { key: 'struggles', label: 'Main struggle', placeholder: 'e.g. staying consistent, motivation dips on weekends' },
      { key: 'schedule', label: 'Morning or evening person?', placeholder: 'e.g. morning, night owl, flexible' },
      { key: 'pastFailures', label: 'Why past habits failed', placeholder: 'e.g. too ambitious, life got busy' },
    ],
  },
  {
    id: 'body-metrics', label: 'Body Metrics', emoji: '📏', category: 'fitness',
    desc: 'Track BMI, body fat % and get a personalised improvement plan',
    fields: [
      { key: 'metrics', label: 'Current metrics', placeholder: 'e.g. 82kg, 5\'11", 26% body fat', required: true },
      { key: 'goalMetrics', label: 'Goal metrics', placeholder: 'e.g. 75kg, 18% body fat' },
      { key: 'timeline', label: 'Timeline', placeholder: 'e.g. 16 weeks' },
      { key: 'experience', label: 'Training experience', placeholder: 'e.g. 1 year, mainly cardio' },
    ],
  },
];

const FINANCE_TOOLS = TOOLS.filter(t => t.category === 'finance');
const FITNESS_TOOLS = TOOLS.filter(t => t.category === 'fitness');

export function LifeHubView({ profile }: { profile: any }) {
  const [category, setCategory] = useState<Category>('finance');
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  const selectTool = (tool: Tool) => {
    setActiveTool(tool);
    setFields({});
    setOutput('');
    setError('');
  };

  const back = () => {
    setActiveTool(null);
    setOutput('');
    setError('');
  };

  const handleGenerate = async () => {
    if (!activeTool) return;
    setOutput('');
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/life-hub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId: activeTool.id, ...fields }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Something went wrong');
        return;
      }

      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of dec.decode(value).split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]' || !data) continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.token) {
              accumulated += parsed.token;
              setOutput(accumulated);
              outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight, behavior: 'smooth' });
            }
          } catch {}
        }
      }
    } catch (e: any) {
      setError(e.message || 'Failed to generate');
    } finally {
      setLoading(false);
    }
  };

  const copyOutput = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayTools = category === 'finance' ? FINANCE_TOOLS : FITNESS_TOOLS;

  return (
    <>
      <style>{`
        .lh-tool-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .lh-layout { display: grid; grid-template-columns: 320px 1fr; gap: 20px; align-items: start; }
        @media (max-width: 900px) { .lh-tool-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) {
          .lh-tool-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
          .lh-layout { grid-template-columns: 1fr; }
        }
      `}</style>
      <div className="page" style={{ paddingBottom: '80px' }}>
        {/* Header */}
        {!activeTool ? (
          <>
            <div style={{ marginBottom: '20px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 4px' }}>Life Hub</h1>
              <p style={{ fontSize: '13px', color: 'hsl(240 5% 50%)', margin: 0 }}>
                Your all-in-one AI tool for financial health and physical health — 22 tools in one place.
              </p>
            </div>

            {/* Category tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              {(['finance', 'fitness'] as Category[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  style={{
                    padding: '10px 24px', borderRadius: '10px', border: '1px solid',
                    borderColor: category === cat
                      ? cat === 'finance' ? 'hsl(142,70%,40%)' : 'hsl(205,90%,48%)'
                      : 'hsl(240 6% 14%)',
                    background: category === cat
                      ? cat === 'finance' ? 'hsl(142 70% 40% / 0.12)' : 'hsl(205 90% 48% / 0.12)'
                      : 'hsl(240 6% 9%)',
                    color: category === cat
                      ? cat === 'finance' ? 'hsl(142,70%,60%)' : 'hsl(205,90%,60%)'
                      : 'hsl(240 5% 55%)',
                    fontSize: '14px', fontWeight: category === cat ? 700 : 500, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px',
                  }}
                >
                  {cat === 'finance' ? '💰' : '💪'} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  <span style={{ fontSize: '11px', opacity: 0.7 }}>({cat === 'finance' ? 12 : 10})</span>
                </button>
              ))}
            </div>

            {/* Tool grid */}
            <div className="lh-tool-grid">
              {displayTools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => selectTool(tool)}
                  style={{
                    textAlign: 'left', padding: '16px', borderRadius: '12px',
                    border: '1px solid hsl(240 6% 14%)', background: 'hsl(240 6% 9%)',
                    cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = category === 'finance' ? 'hsl(142 70% 40% / 0.4)' : 'hsl(205 90% 48% / 0.4)'; (e.currentTarget as HTMLElement).style.background = 'hsl(240 6% 11%)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'hsl(240 6% 14%)'; (e.currentTarget as HTMLElement).style.background = 'hsl(240 6% 9%)'; }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '8px', lineHeight: 1 }}>{tool.emoji}</div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'hsl(0 0% 90%)', margin: '0 0 4px' }}>{tool.label}</p>
                  <p style={{ fontSize: '11px', color: 'hsl(240 5% 50%)', margin: 0, lineHeight: 1.4 }}>{tool.desc}</p>
                </button>
              ))}
            </div>
          </>
        ) : (
          /* Tool form view */
          <>
            <button
              onClick={back}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 55%)', fontSize: '13px', padding: 0, marginBottom: '16px' }}
            >
              <ArrowLeft size={14} /> Back to {activeTool.category === 'finance' ? 'Finance' : 'Fitness'} tools
            </button>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '26px' }}>{activeTool.emoji}</span>
                <div>
                  <h1 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 3px' }}>{activeTool.label}</h1>
                  <p style={{ fontSize: '13px', color: 'hsl(240 5% 50%)', margin: 0 }}>{activeTool.desc}</p>
                </div>
              </div>
            </div>

            <div className="lh-layout">
              {/* Form */}
              <div style={{ background: 'hsl(240 6% 9%)', border: '1px solid hsl(240 6% 14%)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {activeTool.fields.map((f) => (
                    <div key={f.key}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'hsl(240 5% 65%)', marginBottom: '6px' }}>
                        {f.label}{f.required && <span style={{ color: activeTool.category === 'finance' ? 'hsl(142,70%,60%)' : 'hsl(205,90%,60%)' }}> *</span>}
                      </label>
                      <input
                        value={fields[f.key] || ''}
                        onChange={(e) => setFields(prev => ({ ...prev, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        style={{
                          width: '100%', background: 'hsl(240 10% 5%)', border: '1px solid hsl(240 6% 18%)',
                          borderRadius: '8px', padding: '9px 12px', color: '#e2e8f0', fontSize: '13px',
                          outline: 'none', boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  style={{
                    marginTop: '18px', width: '100%', padding: '12px',
                    background: loading ? 'hsl(240 6% 14%)' : activeTool.category === 'finance' ? 'hsl(142,60%,35%)' : 'hsl(205,90%,48%)',
                    color: loading ? 'hsl(240 5% 50%)' : '#fff',
                    border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'Generating...' : `Generate ${activeTool.emoji}`}
                </button>
              </div>

              {/* Output */}
              <div style={{ background: 'hsl(240 6% 9%)', border: '1px solid hsl(240 6% 14%)', borderRadius: '12px', minHeight: '480px', display: 'flex', flexDirection: 'column' }}>
                {error && (
                  <div style={{ padding: '16px 20px', color: '#f87171', fontSize: '13px', borderBottom: '1px solid hsl(240 6% 14%)' }}>{error}</div>
                )}
                {!output && !loading && !error && (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'hsl(240 5% 38%)', padding: '40px', textAlign: 'center' }}>
                    <span style={{ fontSize: '36px' }}>{activeTool.emoji}</span>
                    <p style={{ fontSize: '14px', margin: 0 }}>Fill in the form and hit Generate</p>
                    <p style={{ fontSize: '12px', margin: 0, color: 'hsl(240 5% 30%)' }}>Personalised output appears here</p>
                  </div>
                )}
                {(output || loading) && (
                  <>
                    <div style={{ padding: '10px 16px', borderBottom: '1px solid hsl(240 6% 14%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', color: 'hsl(240 5% 45%)', fontWeight: 600 }}>
                        {loading ? 'Generating...' : 'Your personalised output'}
                      </span>
                      {output && (
                        <button
                          onClick={copyOutput}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 12px', background: 'hsl(240 6% 14%)', border: '1px solid hsl(240 6% 20%)', borderRadius: '6px', color: 'hsl(240 5% 70%)', fontSize: '12px', cursor: 'pointer' }}
                        >
                          {copied ? <><CheckCheck size={12} color="#34d399" /> Copied</> : <><Copy size={12} /> Copy</>}
                        </button>
                      )}
                    </div>
                    <div
                      ref={outputRef}
                      style={{ flex: 1, overflowY: 'auto', padding: '20px', fontSize: '13.5px', lineHeight: '1.8', color: '#e2e8f0', whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}
                    >
                      {output}
                      {loading && <span style={{ color: 'hsl(205,90%,60%)' }}>▋</span>}
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
