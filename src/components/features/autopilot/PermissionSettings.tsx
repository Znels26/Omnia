'use client';

import { useState } from 'react';
import { Eye, Zap, Bot, Check, X, Loader2 } from 'lucide-react';

interface PermissionSettingsProps {
  autopilotProfile: any;
  onUpdate: (level: number) => void;
}

interface LevelConfig {
  level: number;
  name: string;
  description: string;
  bestFor: string;
  willDo: string[];
  wontDo: string[];
  icon: React.ReactNode;
  iconColor: string;
  recommended?: boolean;
}

const LEVELS: LevelConfig[] = [
  {
    level: 1,
    name: 'Draft Only',
    description:
      'Omnia prepares everything but sends nothing. You review and approve every single action before anything happens.',
    bestFor: 'Users who want full control',
    willDo: [
      'Prepare content drafts',
      'Find opportunities',
      'Draft emails',
      'Generate ideas',
    ],
    wontDo: [
      'Send anything',
      'Make changes',
      'Contact anyone',
    ],
    icon: <Eye size={22} />,
    iconColor: 'hsl(205 90% 60%)',
    recommended: true,
  },
  {
    level: 2,
    name: 'Semi Auto',
    description:
      'Omnia handles routine tasks automatically. Invoice reminders, scheduled content, standard follow-ups go out automatically.',
    bestFor: 'Users who want to save time on repetitive tasks',
    willDo: [
      'Everything in Draft Only',
      'Send invoice reminders',
      'Post scheduled content',
      'Send follow-up sequences',
    ],
    wontDo: [
      'Send new client outreach',
      'Make financial decisions',
      'Anything sensitive',
    ],
    icon: <Zap size={22} />,
    iconColor: 'hsl(38 95% 60%)',
  },
  {
    level: 3,
    name: 'Full Auto',
    description:
      'Omnia acts completely independently within your rules. You receive a daily log of everything done.',
    bestFor: 'Users who want a true AI chief of staff',
    willDo: [
      'Everything in Semi Auto',
      'Proactive outreach',
      'Full autonomous operation',
    ],
    wontDo: [
      "Anything you said 'never do' during onboarding",
    ],
    icon: <Bot size={22} />,
    iconColor: 'hsl(270 80% 70%)',
  },
];

const LEVEL_BORDER: Record<number, string> = {
  1: 'hsl(205 90% 48%)',
  2: 'hsl(38 95% 60%)',
  3: 'hsl(270 80% 60%)',
};

const LEVEL_GLOW: Record<number, string> = {
  1: '0 0 0 3px hsl(205 90% 48% / 0.18)',
  2: '0 0 0 3px hsl(38 95% 60% / 0.18)',
  3: '0 0 0 3px hsl(270 80% 60% / 0.18)',
};

export default function PermissionSettings({ autopilotProfile, onUpdate }: PermissionSettingsProps) {
  const [selected, setSelected] = useState<number>(autopilotProfile?.permission_level ?? 1);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/autopilot/toggle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permission_level: selected }),
      });
      if (!res.ok) throw new Error('Failed to save permission level');
      onUpdate(selected);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  const hasChanged = selected !== (autopilotProfile?.permission_level ?? 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 600, color: 'hsl(0 0% 90%)' }}>
          Autopilot Permission Level
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: 'hsl(240 5% 55%)', lineHeight: 1.5 }}>
          Choose how much autonomy Omnia has. You can change this at any time.
        </p>
      </div>

      {/* Level cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {LEVELS.map(cfg => {
          const isSelected = selected === cfg.level;
          return (
            <button
              key={cfg.level}
              onClick={() => setSelected(cfg.level)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '18px 20px',
                borderRadius: 12,
                border: `1px solid ${isSelected ? LEVEL_BORDER[cfg.level] : 'hsl(240 6% 14%)'}`,
                background: isSelected ? 'hsl(240 8% 9%)' : 'hsl(240 8% 7%)',
                boxShadow: isSelected ? LEVEL_GLOW[cfg.level] : 'none',
                cursor: 'pointer',
                transition: 'border-color 0.18s, box-shadow 0.18s, background 0.18s',
              }}
            >
              {/* Card header row */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 12,
                marginBottom: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* Radio dot */}
                  <div style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    border: `2px solid ${isSelected ? LEVEL_BORDER[cfg.level] : 'hsl(240 6% 30%)'}`,
                    background: isSelected ? LEVEL_BORDER[cfg.level] : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'border-color 0.15s, background 0.15s',
                  }}>
                    {isSelected && (
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
                    )}
                  </div>
                  {/* Icon */}
                  <span style={{ color: cfg.iconColor, display: 'flex', alignItems: 'center' }}>
                    {cfg.icon}
                  </span>
                  {/* Level badge + name + recommended */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '2px 8px',
                      borderRadius: 20,
                      background: 'hsl(240 6% 14%)',
                      color: 'hsl(240 5% 65%)',
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.03em',
                    }}>
                      Level {cfg.level}
                    </span>
                    <span style={{ fontSize: 15, fontWeight: 600, color: 'hsl(0 0% 90%)' }}>
                      {cfg.name}
                    </span>
                    {cfg.recommended && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '2px 8px',
                        borderRadius: 20,
                        background: 'hsl(205 70% 18%)',
                        color: 'hsl(205 80% 70%)',
                        fontSize: 11,
                        fontWeight: 600,
                      }}>
                        Recommended
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <p style={{
                margin: '0 0 4px 0',
                fontSize: 13,
                color: 'hsl(0 0% 80%)',
                lineHeight: 1.6,
                paddingLeft: 28,
              }}>
                {cfg.description}
              </p>

              {/* Best for */}
              <p style={{
                margin: '0 0 12px 0',
                fontSize: 12,
                color: 'hsl(240 5% 55%)',
                paddingLeft: 28,
              }}>
                Best for: <span style={{ color: 'hsl(240 5% 70%)' }}>{cfg.bestFor}</span>
              </p>

              {/* Will / Won't lists */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0 20px',
                paddingLeft: 28,
              }}>
                <div>
                  <p style={{
                    margin: '0 0 6px',
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'hsl(142 70% 55%)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    What Omnia WILL do
                  </p>
                  <ul style={{
                    margin: 0,
                    padding: 0,
                    listStyle: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}>
                    {cfg.willDo.map((item, i) => (
                      <li key={i} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 6,
                        fontSize: 12,
                        color: 'hsl(0 0% 75%)',
                      }}>
                        <Check size={12} color="hsl(142 70% 55%)" style={{ flexShrink: 0, marginTop: 1 }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p style={{
                    margin: '0 0 6px',
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'hsl(0 72% 51%)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    What Omnia WON'T do
                  </p>
                  <ul style={{
                    margin: 0,
                    padding: 0,
                    listStyle: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}>
                    {cfg.wontDo.map((item, i) => (
                      <li key={i} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 6,
                        fontSize: 12,
                        color: 'hsl(0 0% 75%)',
                      }}>
                        <X size={12} color="hsl(0 72% 51%)" style={{ flexShrink: 0, marginTop: 1 }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Save button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={handleSave}
          disabled={saving || !hasChanged}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 22px',
            borderRadius: 10,
            border: 'none',
            background: hasChanged && !saving ? 'hsl(205 90% 48%)' : 'hsl(240 6% 20%)',
            color: hasChanged && !saving ? '#fff' : 'hsl(240 5% 45%)',
            fontSize: 14,
            fontWeight: 600,
            cursor: saving || !hasChanged ? 'not-allowed' : 'pointer',
            transition: 'background 0.18s, color 0.18s',
          }}
        >
          {saving ? (
            <>
              <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
              Saving…
            </>
          ) : saved ? (
            <>
              <Check size={15} />
              Saved
            </>
          ) : (
            'Save Permission Level'
          )}
        </button>
        {saved && (
          <span style={{ fontSize: 13, color: 'hsl(142 70% 55%)' }}>
            Permission level updated.
          </span>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
