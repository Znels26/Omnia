'use client';

import { useState } from 'react';
import { Zap, CheckCircle } from 'lucide-react';

interface PersonaSelectorProps {
  onSelect: (persona: string) => void;
  recommendedPersona?: string;
}

interface Persona {
  id: string;
  name: string;
  emoji: string;
  subtitle: string;
  color: string;
  bgColor: string;
  borderColor: string;
  bullets: string[];
}

const PERSONAS: Persona[] = [
  {
    id: 'The Hustler',
    name: 'The Hustler',
    emoji: '⚡',
    subtitle: 'Side income & freelancing',
    color: 'hsl(38,95%,60%)',
    bgColor: 'hsl(38 95% 60% / 0.1)',
    borderColor: 'hsl(38 95% 60% / 0.25)',
    bullets: [
      'Finds 3 ways to make money this week',
      'Writes pitches and proposals for you',
      'Tracks every dollar in and out',
      'Spots freelance gigs before they close',
    ],
  },
  {
    id: 'The Optimiser',
    name: 'The Optimiser',
    emoji: '💪',
    subtitle: 'Self-improvement & peak performance',
    color: 'hsl(142,70%,55%)',
    bgColor: 'hsl(142 70% 55% / 0.1)',
    borderColor: 'hsl(142 70% 55% / 0.25)',
    bullets: [
      'Tracks habits and mood daily',
      'Creates re-entry plans when you slip',
      'Spots spending creep before it hurts',
      'Remembers every goal you set',
    ],
  },
  {
    id: 'The Builder',
    name: 'The Builder',
    emoji: '🏗️',
    subtitle: 'Financial goals & wealth',
    color: 'hsl(205,90%,60%)',
    bgColor: 'hsl(205 90% 60% / 0.1)',
    borderColor: 'hsl(205 90% 60% / 0.25)',
    bullets: [
      'Weekly income and expense analysis',
      'Tracks savings goals in real time',
      'Predicts your month-end cash position',
      'Celebrates every financial milestone',
    ],
  },
  {
    id: 'The Creator',
    name: 'The Creator',
    emoji: '🎨',
    subtitle: 'Content & audience growth',
    color: 'hsl(262,83%,75%)',
    bgColor: 'hsl(262 83% 75% / 0.1)',
    borderColor: 'hsl(262 83% 75% / 0.25)',
    bullets: [
      '5 content ideas every morning',
      'Repurposes your best content automatically',
      'Tracks what performs across platforms',
      'Suggests the perfect content mix',
    ],
  },
  {
    id: 'The Learner',
    name: 'The Learner',
    emoji: '📚',
    subtitle: 'Knowledge & skill building',
    color: 'hsl(45,95%,60%)',
    bgColor: 'hsl(45 95% 60% / 0.1)',
    borderColor: 'hsl(45 95% 60% / 0.25)',
    bullets: [
      'Personalised daily study plans',
      'Daily micro-lessons in your chosen topic',
      'Creates flashcards from your notes',
      'Tracks your learning progress over time',
    ],
  },
  {
    id: 'The Operator',
    name: 'The Operator',
    emoji: '💼',
    subtitle: 'Business & clients',
    color: 'hsl(160,60%,55%)',
    bgColor: 'hsl(160 60% 55% / 0.1)',
    borderColor: 'hsl(160 60% 55% / 0.25)',
    bullets: [
      'Chases invoices so you never have to',
      'Drafts proposals and follow-ups',
      'Monitors client health scores',
      'Forecasts revenue for the next 90 days',
    ],
  },
  {
    id: 'The Starter',
    name: 'The Starter',
    emoji: '🌱',
    subtitle: "Let Omnia figure it out",
    color: 'hsl(240 5% 55%)',
    bgColor: 'hsl(240 5% 55% / 0.1)',
    borderColor: 'hsl(240 5% 55% / 0.2)',
    bullets: [
      'Omnia watches your patterns for 7 days',
      'Learns what matters most to you',
      'Builds a personalised profile quietly',
      'Gives you a tailored recommendation',
    ],
  },
];

export default function PersonaSelector({ onSelect, recommendedPersona }: PersonaSelectorProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSelect(personaId: string) {
    if (saving) return;
    setSelected(personaId);
    setSaving(true);
    try {
      await fetch('/api/autopilot/persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona: personaId }),
      });
    } catch {
      // ignore — still proceed
    } finally {
      setSaving(false);
      onSelect(personaId);
    }
  }

  return (
    <div style={{
      width: '100%',
      maxWidth: 760,
    }}>
      <style>{`
        @keyframes persona-fade-in {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .persona-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        @media (max-width: 540px) {
          .persona-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: 28,
        animation: 'persona-fade-in 0.35s ease forwards',
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: 'hsl(205 90% 48% / 0.12)',
          border: '1px solid hsl(205 90% 48% / 0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 14px',
        }}>
          <Zap size={24} color="hsl(205,90%,60%)" strokeWidth={2} />
        </div>
        <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700, color: 'hsl(0 0% 90%)', letterSpacing: '-0.02em' }}>
          Choose your Autopilot mode
        </h2>
        <p style={{ margin: 0, fontSize: 14, color: 'hsl(240 5% 55%)', lineHeight: 1.6, maxWidth: 460, marginLeft: 'auto', marginRight: 'auto' }}>
          Pick the mode that best matches your goals. You can switch at any time from Settings.
        </p>
      </div>

      {/* Grid */}
      <div className="persona-grid">
        {PERSONAS.map((persona, i) => {
          const isRecommended = recommendedPersona === persona.id;
          const isSelected = selected === persona.id;

          return (
            <button
              key={persona.id}
              onClick={() => handleSelect(persona.id)}
              disabled={saving && selected !== persona.id}
              style={{
                background: isSelected ? persona.bgColor : 'hsl(240 8% 7%)',
                border: `1px solid ${isSelected ? persona.borderColor : 'hsl(240 6% 14%)'}`,
                borderRadius: 12,
                padding: '16px',
                textAlign: 'left',
                cursor: saving ? (selected === persona.id ? 'not-allowed' : 'not-allowed') : 'pointer',
                opacity: saving && selected !== persona.id ? 0.6 : 1,
                transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
                fontFamily: 'inherit',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                animation: `persona-fade-in 0.3s ease ${i * 0.04}s both`,
                boxShadow: isSelected ? `0 0 0 1px ${persona.borderColor}, 0 4px 20px ${persona.bgColor}` : 'none',
              }}
              onMouseEnter={e => {
                if (!isSelected && !saving) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = persona.borderColor;
                  (e.currentTarget as HTMLButtonElement).style.background = persona.bgColor;
                }
              }}
              onMouseLeave={e => {
                if (!isSelected) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'hsl(240 6% 14%)';
                  (e.currentTarget as HTMLButtonElement).style.background = 'hsl(240 8% 7%)';
                }
              }}
            >
              {/* Top row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: persona.bgColor,
                    border: `1px solid ${persona.borderColor}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18,
                  }}>
                    {persona.emoji}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'hsl(0 0% 90%)', lineHeight: 1.2 }}>
                      {persona.name}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: persona.color, fontWeight: 500 }}>
                      {persona.subtitle}
                    </p>
                  </div>
                </div>
                {isSelected && (
                  <CheckCircle size={18} color={persona.color} style={{ flexShrink: 0, marginTop: 2 }} />
                )}
              </div>

              {/* Recommended badge */}
              {isRecommended && (
                <div style={{ display: 'flex' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '3px 8px', borderRadius: 999,
                    background: 'hsl(205 90% 48% / 0.15)',
                    border: '1px solid hsl(205 90% 48% / 0.3)',
                    color: 'hsl(205 90% 65%)',
                    fontSize: 10, fontWeight: 600, letterSpacing: '0.03em',
                  }}>
                    ✦ Recommended for you
                  </span>
                </div>
              )}

              {/* Bullets */}
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
                {persona.bullets.map(bullet => (
                  <li key={bullet} style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                    <span style={{
                      width: 4, height: 4, borderRadius: '50%', marginTop: 6, flexShrink: 0,
                      background: persona.color,
                    }} />
                    <span style={{ fontSize: 12, color: 'hsl(240 5% 60%)', lineHeight: 1.45 }}>
                      {bullet}
                    </span>
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {/* Footer note */}
      <p style={{
        textAlign: 'center',
        margin: '20px 0 0',
        fontSize: 12,
        color: 'hsl(240 5% 40%)',
      }}>
        You can change your mode at any time in Autopilot Settings.
      </p>
    </div>
  );
}
