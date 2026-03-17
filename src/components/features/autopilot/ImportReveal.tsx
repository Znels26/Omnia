'use client';

import {
  CheckCircle,
  Dumbbell,
  DollarSign,
  CheckSquare,
  Target,
  Brain,
  Bot,
  ArrowRight,
  LayoutDashboard,
} from 'lucide-react';

interface ImportStats {
  conversations: number;
  tasksCreated: number;
  goalsCreated: number;
  memoriesAdded: number;
  categories: {
    fitness: string[];
    finance: string[];
    tasks: string[];
    goals: string[];
    content: string[];
    learning: string[];
    personal: string[];
  };
  summary: string;
  recommendedPersona: string;
}

interface ImportRevealProps {
  stats: ImportStats;
  platform: string;
  onDismiss: () => void;
}

interface StatCard {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  label: string;
  count: string | number;
  detail: string;
}

function buildCards(stats: ImportStats): StatCard[] {
  const fitnessCount = stats.categories?.fitness?.length ?? 0;
  const financeCount = stats.categories?.finance?.length ?? 0;

  return [
    {
      icon: Dumbbell,
      iconColor: 'hsl(142 70% 55%)',
      iconBg: 'hsl(142 70% 55% / 0.12)',
      label: 'Fitness & Health',
      count: fitnessCount > 0 ? `${fitnessCount} fitness conversations` : 'Fitness topics found',
      detail: 'Habits detected, goals created',
    },
    {
      icon: DollarSign,
      iconColor: 'hsl(38 95% 60%)',
      iconBg: 'hsl(38 95% 60% / 0.12)',
      label: 'Finance',
      count: financeCount > 0 ? `${financeCount} finance conversations` : 'Finance topics found',
      detail: 'Savings goals created',
    },
    {
      icon: CheckSquare,
      iconColor: 'hsl(205 90% 60%)',
      iconBg: 'hsl(205 90% 60% / 0.12)',
      label: 'Tasks',
      count: `${stats.tasksCreated ?? 0} tasks extracted`,
      detail: 'Added to your Planner',
    },
    {
      icon: Target,
      iconColor: 'hsl(262 83% 75%)',
      iconBg: 'hsl(262 83% 75% / 0.12)',
      label: 'Goals',
      count: `${stats.goalsCreated ?? 0} goals identified`,
      detail: 'Created in Planner',
    },
    {
      icon: Brain,
      iconColor: 'hsl(205 90% 48%)',
      iconBg: 'hsl(205 90% 48% / 0.12)',
      label: 'AI Memory',
      count: `${stats.memoriesAdded ?? 0} personal facts`,
      detail: 'Omnia now knows you',
    },
    {
      icon: Bot,
      iconColor: 'hsl(262 83% 75%)',
      iconBg: 'hsl(262 83% 75% / 0.12)',
      label: 'Autopilot',
      count: `Recommended: The ${stats.recommendedPersona ?? 'Default'}`,
      detail: 'Based on your patterns',
    },
  ];
}

export function ImportReveal({ stats, platform, onDismiss }: ImportRevealProps) {
  const cards = buildCards(stats);

  return (
    <div
      style={{
        maxWidth: '680px',
        margin: '0 auto',
        padding: '32px 16px 48px',
      }}
    >
      <style>{`
        @keyframes ir-slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ir-pop {
          0%   { transform: scale(0.6); opacity: 0; }
          70%  { transform: scale(1.12); opacity: 1; }
          100% { transform: scale(1); }
        }
        @keyframes ir-glow-ring {
          0%, 100% { box-shadow: 0 0 0 0 hsl(142 70% 55% / 0), 0 0 16px hsl(142 70% 55% / 0.3); }
          50%       { box-shadow: 0 0 0 8px hsl(142 70% 55% / 0.1), 0 0 28px hsl(142 70% 55% / 0.5); }
        }
        .ir-root {
          animation: ir-slide-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .ir-checkmark {
          animation: ir-pop 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both,
                     ir-glow-ring 2.8s ease-in-out 0.6s infinite;
        }
        .ir-card {
          background: hsl(240 8% 7%);
          border: 1px solid hsl(240 6% 14%);
          border-radius: 12px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          animation: ir-slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .ir-btn-primary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 28px;
          border-radius: 10px;
          background: hsl(205 90% 48%);
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: background 0.18s, transform 0.12s;
          letter-spacing: 0.01em;
        }
        .ir-btn-primary:hover {
          background: hsl(205 90% 42%);
          transform: translateY(-1px);
        }
        .ir-btn-ghost {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 28px;
          border-radius: 10px;
          background: transparent;
          color: hsl(240 5% 65%);
          font-size: 15px;
          font-weight: 500;
          border: 1.5px solid hsl(240 6% 18%);
          cursor: pointer;
          transition: border-color 0.18s, color 0.18s, background 0.18s;
        }
        .ir-btn-ghost:hover {
          border-color: hsl(240 6% 28%);
          color: hsl(240 5% 85%);
          background: hsl(240 8% 9%);
        }
        @media (min-width: 560px) {
          .ir-cards-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .ir-actions {
            flex-direction: row !important;
          }
        }
      `}</style>

      <div className="ir-root">
        {/* ── Header ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            marginBottom: '36px',
          }}
        >
          <div
            className="ir-checkmark"
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              background: 'hsl(142 70% 55% / 0.13)',
              border: '2px solid hsl(142 70% 55% / 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
            }}
          >
            <CheckCircle size={34} color="hsl(142 70% 55%)" strokeWidth={2} />
          </div>

          <h1
            style={{
              fontSize: '26px',
              fontWeight: 700,
              color: 'hsl(240 5% 96%)',
              margin: '0 0 8px',
              lineHeight: 1.2,
            }}
          >
            Your history is imported!
          </h1>
          <p
            style={{
              fontSize: '14px',
              color: 'hsl(240 5% 52%)',
              margin: 0,
            }}
          >
            {stats.conversations ?? 0} {platform} conversations analysed
          </p>
        </div>

        {/* ── Summary cards grid ── */}
        <div
          className="ir-cards-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '12px',
            marginBottom: '24px',
          }}
        >
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="ir-card"
                style={{ animationDelay: `${0.1 + i * 0.06}s` }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: card.iconBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={18} color={card.iconColor} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: 'hsl(240 5% 42%)',
                        margin: '0 0 2px',
                      }}
                    >
                      {card.label}
                    </p>
                    <p
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'hsl(240 5% 88%)',
                        margin: '0 0 2px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {card.count}
                    </p>
                    <p
                      style={{
                        fontSize: '12px',
                        color: 'hsl(240 5% 48%)',
                        margin: 0,
                      }}
                    >
                      {card.detail}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Persona recommendation ── */}
        <div
          style={{
            background: 'hsl(205 90% 48% / 0.07)',
            border: '1.5px solid hsl(205 90% 48% / 0.22)',
            borderRadius: '14px',
            padding: '22px 20px',
            marginBottom: '20px',
            animation: 'ir-slide-up 0.4s cubic-bezier(0.16,1,0.3,1) 0.46s both',
          }}
        >
          <p
            style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              color: 'hsl(205 90% 55%)',
              margin: '0 0 8px',
            }}
          >
            Based on your history, Omnia recommends…
          </p>
          <p
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: 'hsl(240 5% 95%)',
              margin: '0 0 6px',
            }}
          >
            The{' '}
            <span style={{ color: 'hsl(205 90% 60%)' }}>
              {stats.recommendedPersona ?? 'Default'} Persona
            </span>
          </p>
          <p
            style={{
              fontSize: '13px',
              color: 'hsl(240 5% 55%)',
              margin: 0,
              lineHeight: 1.55,
            }}
          >
            This Autopilot configuration is optimised for your goals, habits, and patterns detected
            from your conversation history.
          </p>
        </div>

        {/* ── Summary blockquote ── */}
        {stats.summary && (
          <blockquote
            style={{
              margin: '0 0 24px',
              padding: '16px 18px',
              background: 'hsl(240 8% 7%)',
              borderLeft: '3px solid hsl(262 83% 75% / 0.6)',
              borderRadius: '0 10px 10px 0',
              animation: 'ir-slide-up 0.4s cubic-bezier(0.16,1,0.3,1) 0.52s both',
            }}
          >
            <p
              style={{
                fontSize: '13px',
                color: 'hsl(240 5% 62%)',
                margin: 0,
                lineHeight: 1.65,
                fontStyle: 'italic',
              }}
            >
              {stats.summary}
            </p>
          </blockquote>
        )}

        {/* ── Actions ── */}
        <div
          className="ir-actions"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            animation: 'ir-slide-up 0.4s cubic-bezier(0.16,1,0.3,1) 0.58s both',
          }}
        >
          <button
            className="ir-btn-primary"
            onClick={onDismiss}
            style={{ flex: 1 }}
          >
            Set Up Autopilot
            <ArrowRight size={16} />
          </button>
          <button
            className="ir-btn-ghost"
            onClick={onDismiss}
            style={{ flex: 1 }}
          >
            <LayoutDashboard size={15} />
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
