'use client';

import { useState, useCallback } from 'react';
import { Zap, LayoutDashboard, CheckSquare, Sparkles, BookOpen, Settings, ChevronRight } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import ActionQueue from './ActionQueue';
import OpportunityQueue from './OpportunityQueue';
import AutopilotLog from './AutopilotLog';
import PermissionSettings from './PermissionSettings';
import OnboardingConversation from './OnboardingConversation';
import PersonaSelector from './PersonaSelector';

type Tab = 'dashboard' | 'actions' | 'opportunities' | 'log' | 'settings';

interface AutopilotViewProps {
  profile: any;
  autopilotProfile: any;
  actions: any[];
  opportunities: any[];
  log: any[];
}

export function AutopilotView({ profile, autopilotProfile, actions, opportunities, log }: AutopilotViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [localAutopilotProfile, setLocalAutopilotProfile] = useState<any>(autopilotProfile);
  const [toggling, setToggling] = useState(false);
  const [localActions, setLocalActions] = useState(actions);
  const [showOnboarding, setShowOnboarding] = useState(
    localAutopilotProfile?.autopilot_enabled === true &&
    localAutopilotProfile?.onboarding_complete === false
  );
  const [showPersonaSelector, setShowPersonaSelector] = useState(false);

  const isEnabled = localAutopilotProfile?.autopilot_enabled === true;
  const pendingCount = localActions.filter((a: any) => a.status === 'pending').length;

  async function handleToggle() {
    if (toggling) return;
    setToggling(true);
    try {
      const res = await fetch('/api/autopilot/toggle', { method: 'POST' });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const newEnabled = !isEnabled;
        setLocalAutopilotProfile((prev: any) => ({
          ...prev,
          autopilot_enabled: newEnabled,
          ...(data.autopilot_profile ?? {}),
        }));
        // If enabling and onboarding not complete, show onboarding
        if (newEnabled && localAutopilotProfile?.onboarding_complete === false) {
          setShowOnboarding(true);
        }
      }
    } catch {
      // ignore
    } finally {
      setToggling(false);
    }
  }

  function handleOnboardingComplete(persona: string) {
    setShowOnboarding(false);
    setLocalAutopilotProfile((prev: any) => ({
      ...prev,
      onboarding_complete: true,
      persona_type: persona,
    }));
    // Show persona selector if no persona set yet
    if (!localAutopilotProfile?.persona_type) {
      setShowPersonaSelector(true);
    }
  }

  function handlePersonaSelect(persona: string) {
    setShowPersonaSelector(false);
    setLocalAutopilotProfile((prev: any) => ({ ...prev, persona_type: persona }));
  }

  const handleRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  const todayActions = localActions.filter((a: any) => {
    const d = new Date(a.created_at);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return d >= startOfToday;
  });

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'actions', label: 'Actions', badge: pendingCount > 0 ? pendingCount : undefined },
    { id: 'opportunities', label: 'Opportunities', badge: opportunities.length > 0 ? opportunities.length : undefined },
    { id: 'log', label: 'Log' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <>
      {/* Onboarding overlay */}
      {showOnboarding && (
        <OnboardingConversation onComplete={handleOnboardingComplete} />
      )}

      {/* Persona selector overlay */}
      {showPersonaSelector && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 200,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          overflowY: 'auto',
          padding: '40px 16px',
        }}>
          <PersonaSelector
            onSelect={handlePersonaSelect}
            recommendedPersona={localAutopilotProfile?.recommended_persona}
          />
        </div>
      )}

      <div className="page" style={{ paddingBottom: '80px' }}>
        <style>{`
          .autopilot-tabs { display: flex; gap: 4px; overflow-x: auto; scrollbar-width: none; }
          .autopilot-tabs::-webkit-scrollbar { display: none; }
          .autopilot-tab {
            display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px;
            border-radius: 8px; border: 1px solid transparent; background: transparent;
            color: hsl(240 5% 55%); font-size: 13px; font-weight: 500; cursor: pointer;
            white-space: nowrap; transition: all 0.15s; font-family: inherit;
          }
          .autopilot-tab:hover { color: hsl(0 0% 90%); background: hsl(240 8% 10%); }
          .autopilot-tab.active {
            color: hsl(0 0% 90%); background: hsl(240 8% 12%);
            border-color: hsl(240 6% 20%);
          }
          @keyframes pulse-dot {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(1.3); }
          }
        `}</style>

        {/* Page header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Zap size={22} color="hsl(205,90%,60%)" strokeWidth={2} />
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Autopilot</h1>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: 'hsl(240 5% 50%)' }}>
            Your AI Chief of Staff — working while you sleep.
          </p>
        </div>

        {/* Hero status card — enabled */}
        {isEnabled && (
          <div style={{
            background: 'hsl(205 90% 48% / 0.08)',
            border: '1px solid hsl(205 90% 48% / 0.2)',
            borderRadius: 14,
            padding: '20px 22px',
            marginBottom: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              {/* Left */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Zap size={24} color="hsl(205,90%,60%)" strokeWidth={2} fill="hsl(205 90% 60% / 0.2)" />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: 'hsl(0 0% 90%)' }}>Autopilot Active</span>
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: 'hsl(142 70% 55%)',
                        display: 'inline-block',
                        animation: 'pulse-dot 2s ease-in-out infinite',
                      }} />
                    </div>
                    {localAutopilotProfile?.persona_type && (
                      <p style={{ margin: 0, fontSize: 12, color: 'hsl(205 90% 60%)', fontWeight: 500 }}>
                        Mode: {localAutopilotProfile.persona_type}
                      </p>
                    )}
                    {localAutopilotProfile?.last_run_at && (
                      <p style={{ margin: 0, fontSize: 12, color: 'hsl(240 5% 50%)' }}>
                        Last ran: {timeAgo(localAutopilotProfile.last_run_at)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right — toggle */}
              <button
                onClick={handleToggle}
                disabled={toggling}
                title={isEnabled ? 'Disable Autopilot' : 'Enable Autopilot'}
                style={{
                  position: 'relative',
                  width: 52,
                  height: 28,
                  borderRadius: 14,
                  background: 'hsl(142 70% 35%)',
                  border: '1px solid hsl(142 70% 45% / 0.4)',
                  cursor: toggling ? 'not-allowed' : 'pointer',
                  opacity: toggling ? 0.7 : 1,
                  padding: 0,
                  flexShrink: 0,
                  transition: 'background 0.2s, border-color 0.2s',
                }}
              >
                <span style={{
                  position: 'absolute',
                  top: 3,
                  left: 'calc(100% - 22px - 3px)',
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: 'white',
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                }} />
              </button>
            </div>

            {/* Bottom summary */}
            <p style={{ margin: 0, fontSize: 13, color: 'hsl(240 5% 65%)', borderTop: '1px solid hsl(205 90% 48% / 0.12)', paddingTop: 12 }}>
              Today Omnia{' '}
              {todayActions.length > 0
                ? `prepared ${todayActions.length} action${todayActions.length !== 1 ? 's' : ''}`
                : 'is preparing your actions'}
              {opportunities.length > 0
                ? ` and found ${opportunities.length} opportunit${opportunities.length !== 1 ? 'ies' : 'y'}`
                : ''}.
            </p>
          </div>
        )}

        {/* Activation card — disabled */}
        {!isEnabled && (
          <div style={{
            background: 'hsl(240 8% 7%)',
            border: '1px solid hsl(240 6% 14%)',
            borderRadius: 14,
            padding: '28px 24px',
            marginBottom: 24,
            textAlign: 'center',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'hsl(205 90% 48% / 0.12)',
              border: '1px solid hsl(205 90% 48% / 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <Zap size={26} color="hsl(205,90%,60%)" strokeWidth={2} />
            </div>
            <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700 }}>Your AI Chief of Staff</h2>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: 'hsl(240 5% 55%)', maxWidth: 420, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
              Autopilot works 24/7 in the background — analysing your data, queuing actions, and surfacing opportunities so you never miss a beat.
            </p>
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 10,
              maxWidth: 360, margin: '0 auto 24px', textAlign: 'left',
            }}>
              {[
                { icon: '⚡', text: 'Prepares daily action cards — approve with one tap' },
                { icon: '🎯', text: 'Spots opportunities before they pass you by' },
                { icon: '🤖', text: 'Learns your preferences and gets smarter over time' },
              ].map(({ icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{icon}</span>
                  <span style={{ fontSize: 13, color: 'hsl(240 5% 65%)', lineHeight: 1.55 }}>{text}</span>
                </div>
              ))}
            </div>
            <button
              onClick={handleToggle}
              disabled={toggling}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '11px 24px', borderRadius: 10,
                background: 'hsl(205 90% 48%)', color: '#fff',
                border: 'none', fontSize: 14, fontWeight: 600,
                cursor: toggling ? 'not-allowed' : 'pointer',
                opacity: toggling ? 0.7 : 1,
                transition: 'background 0.15s',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => { if (!toggling) (e.currentTarget as HTMLButtonElement).style.background = 'hsl(205 90% 42%)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'hsl(205 90% 48%)'; }}
            >
              <Zap size={15} />
              {toggling ? 'Enabling...' : 'Enable Autopilot'}
            </button>
          </div>
        )}

        {/* Tab navigation */}
        <div style={{ marginBottom: 20 }}>
          <div className="autopilot-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`autopilot-tab${activeTab === tab.id ? ' active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                {tab.badge !== undefined && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    minWidth: 18, height: 18, padding: '0 5px',
                    borderRadius: 9, background: 'hsl(205 90% 48%)',
                    color: '#fff', fontSize: 11, fontWeight: 700, lineHeight: 1,
                  }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div style={{ height: 1, background: 'hsl(240 6% 14%)', marginTop: 2 }} />
        </div>

        {/* Tab content */}
        {activeTab === 'dashboard' && (
          <DashboardTab
            autopilotProfile={localAutopilotProfile}
            actions={localActions}
            opportunities={opportunities}
            log={log}
            onTabChange={setActiveTab}
          />
        )}
        {activeTab === 'actions' && (
          <ActionQueue actions={localActions} onRefresh={handleRefresh} />
        )}
        {activeTab === 'opportunities' && (
          <OpportunityQueue opportunities={opportunities} onRefresh={handleRefresh} />
        )}
        {activeTab === 'log' && (
          <AutopilotLog log={log} />
        )}
        {activeTab === 'settings' && (
          <PermissionSettings autopilotProfile={localAutopilotProfile} />
        )}
      </div>
    </>
  );
}

/* ─── Dashboard tab ─────────────────────────────────────────────── */

function DashboardTab({
  autopilotProfile,
  actions,
  opportunities,
  log,
  onTabChange,
}: {
  autopilotProfile: any;
  actions: any[];
  opportunities: any[];
  log: any[];
  onTabChange: (tab: Tab) => void;
}) {
  const pendingActions = actions.filter((a: any) => a.status === 'pending');
  const recentLog = log.slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Stats row */}
      <div className="grid-3" style={{ gap: 12 }}>
        {[
          { label: 'Pending Actions', value: pendingActions.length, color: 'hsl(205 90% 60%)', tab: 'actions' as Tab },
          { label: 'Opportunities', value: opportunities.length, color: 'hsl(262 83% 75%)', tab: 'opportunities' as Tab },
          { label: 'Log Entries', value: log.length, color: 'hsl(142 70% 55%)', tab: 'log' as Tab },
        ].map(stat => (
          <button
            key={stat.label}
            onClick={() => onTabChange(stat.tab)}
            style={{
              background: 'hsl(240 8% 7%)',
              border: '1px solid hsl(240 6% 14%)',
              borderRadius: 12,
              padding: '16px 18px',
              textAlign: 'left',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'hsl(240 6% 22%)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'hsl(240 6% 14%)'; }}
          >
            <p style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.value}</p>
            <p style={{ margin: 0, fontSize: 12, color: 'hsl(240 5% 55%)', fontWeight: 500 }}>{stat.label}</p>
          </button>
        ))}
      </div>

      {/* Pending actions preview */}
      {pendingActions.length > 0 && (
        <div style={{ background: 'hsl(240 8% 7%)', border: '1px solid hsl(240 6% 14%)', borderRadius: 12 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 18px', borderBottom: '1px solid hsl(240 6% 14%)',
          }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'hsl(0 0% 90%)' }}>Pending Actions</h3>
            <button
              onClick={() => onTabChange('actions')}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'transparent', border: 'none', color: 'hsl(205 90% 60%)',
                fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              View all <ChevronRight size={13} />
            </button>
          </div>
          <div style={{ padding: '8px 0' }}>
            {pendingActions.slice(0, 3).map((action: any) => (
              <div
                key={action.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 18px',
                }}
              >
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: 'hsl(205 90% 48%)', flexShrink: 0,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'hsl(0 0% 90%)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {action.title}
                  </p>
                </div>
                <span style={{ fontSize: 11, color: 'hsl(240 5% 45%)', flexShrink: 0 }}>
                  {timeAgo(action.created_at)}
                </span>
              </div>
            ))}
            {pendingActions.length > 3 && (
              <p style={{ margin: 0, padding: '6px 18px 10px', fontSize: 12, color: 'hsl(240 5% 45%)' }}>
                + {pendingActions.length - 3} more
              </p>
            )}
          </div>
        </div>
      )}

      {/* Recent log preview */}
      {recentLog.length > 0 && (
        <div style={{ background: 'hsl(240 8% 7%)', border: '1px solid hsl(240 6% 14%)', borderRadius: 12 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 18px', borderBottom: '1px solid hsl(240 6% 14%)',
          }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'hsl(0 0% 90%)' }}>Recent Activity</h3>
            <button
              onClick={() => onTabChange('log')}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'transparent', border: 'none', color: 'hsl(205 90% 60%)',
                fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              View all <ChevronRight size={13} />
            </button>
          </div>
          <div style={{ padding: '8px 0' }}>
            {recentLog.map((entry: any) => (
              <div
                key={entry.id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '10px 18px',
                }}
              >
                <div style={{
                  width: 6, height: 6, borderRadius: '50%', marginTop: 5,
                  background: 'hsl(142 70% 45%)', flexShrink: 0,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 2px', fontSize: 13, color: 'hsl(0 0% 85%)', lineHeight: 1.4 }}>
                    {entry.message ?? entry.action ?? entry.event ?? 'Autopilot ran'}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: 'hsl(240 5% 45%)' }}>
                    {timeAgo(entry.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state when no activity */}
      {pendingActions.length === 0 && recentLog.length === 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 12, padding: '48px 24px',
          borderRadius: 12, border: '1px solid hsl(240 6% 14%)',
          background: 'hsl(240 8% 7%)', textAlign: 'center',
        }}>
          <Sparkles size={32} color="hsl(240 5% 35%)" strokeWidth={1.5} />
          <p style={{ margin: 0, color: 'hsl(240 5% 55%)', fontSize: 14, maxWidth: 340, lineHeight: 1.6 }}>
            Autopilot is learning your patterns. Check back soon — Omnia works overnight.
          </p>
        </div>
      )}
    </div>
  );
}
