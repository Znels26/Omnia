'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, RefreshCw, Clock, Inbox } from 'lucide-react';
import { timeAgo } from '@/lib/utils';

interface Action {
  id: string;
  action_type: string;
  title: string;
  description?: string;
  created_at: string;
  status: string;
  reject_reason?: string;
}

interface ActionQueueProps {
  actions: any[];
  onRefresh: () => void;
}

const ACTION_TYPE_META: Record<string, { label: string; bg: string; color: string }> = {
  content_idea:  { label: 'Content Idea',  bg: 'hsl(270 60% 20%)', color: 'hsl(270 80% 75%)' },
  follow_up:     { label: 'Follow Up',     bg: 'hsl(205 70% 18%)', color: 'hsl(205 80% 70%)' },
  invoice_chase: { label: 'Invoice Chase', bg: 'hsl(142 50% 14%)', color: 'hsl(142 70% 55%)' },
  opportunity:   { label: 'Opportunity',   bg: 'hsl(38 80% 16%)',  color: 'hsl(38 95% 60%)'  },
  briefing:      { label: 'Briefing',      bg: 'hsl(175 60% 14%)', color: 'hsl(175 70% 55%)' },
};

function getTypeMeta(type: string) {
  return ACTION_TYPE_META[type] ?? { label: type, bg: 'hsl(240 6% 14%)', color: 'hsl(0 0% 70%)' };
}

function groupByDate(actions: Action[]): { label: string; items: Action[] }[] {
  const today: Action[] = [];
  const yesterday: Action[] = [];
  const earlier: Action[] = [];

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 86_400_000);

  for (const a of actions) {
    const d = new Date(a.created_at);
    if (d >= startOfToday) today.push(a);
    else if (d >= startOfYesterday) yesterday.push(a);
    else earlier.push(a);
  }

  const groups: { label: string; items: Action[] }[] = [];
  if (today.length) groups.push({ label: 'Today', items: today });
  if (yesterday.length) groups.push({ label: 'Yesterday', items: yesterday });
  if (earlier.length) groups.push({ label: 'Earlier', items: earlier });
  return groups;
}

function formatCreatedTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60_000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return timeAgo(dateStr);
  } catch {
    return '';
  }
}

export default function ActionQueue({ actions: propActions, onRefresh }: ActionQueueProps) {
  const [actions, setActions] = useState<Action[]>(propActions as Action[]);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectText, setRejectText] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  async function handleApprove(id: string) {
    setProcessing(id);
    try {
      const res = await fetch('/api/autopilot/actions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'approved' }),
      });
      if (!res.ok) throw new Error('Failed to approve');
      setActions(prev => prev.map(a => (a.id === id ? { ...a, status: 'approved' } : a)));
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(null);
    }
  }

  function startReject(id: string) {
    setRejecting(id);
    setRejectText('');
  }

  function cancelReject() {
    setRejecting(null);
    setRejectText('');
  }

  async function handleReject(id: string) {
    setProcessing(id);
    try {
      const res = await fetch('/api/autopilot/actions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'rejected', reject_reason: rejectText }),
      });
      if (!res.ok) throw new Error('Failed to reject');
      setActions(prev =>
        prev.map(a => (a.id === id ? { ...a, status: 'rejected', reject_reason: rejectText } : a))
      );
      setRejecting(null);
      setRejectText('');
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(null);
    }
  }

  const pendingCount = actions.filter(a => a.status === 'pending' || !a.status).length;
  const groups = groupByDate(actions);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'hsl(0 0% 90%)' }}>
            Today's Actions
          </h2>
          {pendingCount > 0 && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 22,
              height: 22,
              padding: '0 7px',
              borderRadius: 11,
              background: 'hsl(205 90% 48%)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              lineHeight: 1,
            }}>
              {pendingCount}
            </span>
          )}
        </div>
        <button
          onClick={onRefresh}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            borderRadius: 8,
            border: '1px solid hsl(240 6% 14%)',
            background: 'transparent',
            color: 'hsl(240 5% 55%)',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'color 0.15s, border-color 0.15s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.color = 'hsl(0 0% 90%)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'hsl(240 6% 25%)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.color = 'hsl(240 5% 55%)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'hsl(240 6% 14%)';
          }}
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Empty state */}
      {actions.length === 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          padding: '48px 24px',
          borderRadius: 12,
          border: '1px solid hsl(240 6% 14%)',
          background: 'hsl(240 8% 7%)',
          textAlign: 'center',
        }}>
          <Inbox size={36} color="hsl(240 5% 35%)" strokeWidth={1.5} />
          <p style={{ margin: 0, color: 'hsl(240 5% 55%)', fontSize: 14, maxWidth: 340, lineHeight: 1.6 }}>
            Autopilot is preparing your actions. Check back soon — Omnia works overnight.
          </p>
        </div>
      )}

      {/* Groups */}
      {groups.map(group => (
        <div key={group.label} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Date divider */}
          <div style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'hsl(240 5% 55%)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            paddingBottom: 4,
            borderBottom: '1px solid hsl(240 6% 14%)',
          }}>
            {group.label}
          </div>

          {group.items.map(action => {
            const meta = getTypeMeta(action.action_type);
            const isApproved = action.status === 'approved';
            const isRejected = action.status === 'rejected';
            const isPending = !isApproved && !isRejected;
            const isProcessing = processing === action.id;
            const isRejectingThis = rejecting === action.id;

            return (
              <div
                key={action.id}
                style={{
                  borderRadius: 12,
                  border: '1px solid hsl(240 6% 14%)',
                  background: 'hsl(240 8% 7%)',
                  padding: '16px 18px',
                  opacity: isRejected ? 0.7 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                {/* Top row: badges + time */}
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '3px 10px',
                      borderRadius: 20,
                      background: meta.bg,
                      color: meta.color,
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.03em',
                      whiteSpace: 'nowrap',
                    }}>
                      {meta.label}
                    </span>
                    {isRejected && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '3px 10px',
                        borderRadius: 20,
                        background: 'hsl(0 40% 15%)',
                        color: 'hsl(0 72% 51%)',
                        fontSize: 11,
                        fontWeight: 600,
                      }}>
                        Rejected
                      </span>
                    )}
                    {isApproved && (
                      <CheckCircle size={16} color="hsl(142 70% 55%)" />
                    )}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    color: 'hsl(240 5% 55%)',
                    fontSize: 12,
                    flexShrink: 0,
                  }}>
                    <Clock size={12} />
                    {formatCreatedTime(action.created_at)}
                  </div>
                </div>

                {/* Title */}
                <p style={{
                  margin: '10px 0 4px',
                  fontSize: 15,
                  fontWeight: 600,
                  color: 'hsl(0 0% 90%)',
                  textDecoration: isRejected ? 'line-through' : 'none',
                  textDecorationColor: 'hsl(0 72% 51%)',
                }}>
                  {action.title}
                </p>

                {/* Description */}
                {action.description && (
                  <p style={{
                    margin: '0 0 12px',
                    fontSize: 13,
                    color: 'hsl(240 5% 55%)',
                    lineHeight: 1.55,
                    textDecoration: isRejected ? 'line-through' : 'none',
                    textDecorationColor: 'hsl(240 5% 35%)',
                  }}>
                    {action.description}
                  </p>
                )}

                {/* Post-rejection note */}
                {isRejected && (
                  <p style={{
                    margin: '4px 0 12px',
                    fontSize: 12,
                    color: 'hsl(240 5% 45%)',
                    fontStyle: 'italic',
                  }}>
                    Omnia will try something different next time.
                  </p>
                )}

                {/* Action buttons — only for pending */}
                {isPending && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                    {!isRejectingThis ? (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {/* Approve */}
                        <button
                          onClick={() => handleApprove(action.id)}
                          disabled={isProcessing}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '7px 14px',
                            borderRadius: 8,
                            border: '1px solid hsl(142 70% 35%)',
                            background: 'transparent',
                            color: 'hsl(142 70% 55%)',
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: isProcessing ? 'not-allowed' : 'pointer',
                            opacity: isProcessing ? 0.5 : 1,
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => {
                            if (!isProcessing)
                              (e.currentTarget as HTMLButtonElement).style.background = 'hsl(142 50% 12%)';
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                          }}
                        >
                          <CheckCircle size={14} />
                          ✓ Approve
                        </button>
                        {/* Reject */}
                        <button
                          onClick={() => startReject(action.id)}
                          disabled={isProcessing}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '7px 14px',
                            borderRadius: 8,
                            border: '1px solid hsl(0 50% 35%)',
                            background: 'transparent',
                            color: 'hsl(0 72% 51%)',
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: isProcessing ? 'not-allowed' : 'pointer',
                            opacity: isProcessing ? 0.5 : 1,
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => {
                            if (!isProcessing)
                              (e.currentTarget as HTMLButtonElement).style.background = 'hsl(0 40% 12%)';
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                          }}
                        >
                          <XCircle size={14} />
                          ✗ Reject
                        </button>
                      </div>
                    ) : (
                      /* Inline reject form */
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <input
                          autoFocus
                          type="text"
                          placeholder="Why reject? (optional)"
                          value={rejectText}
                          onChange={e => setRejectText(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleReject(action.id);
                            if (e.key === 'Escape') cancelReject();
                          }}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: '1px solid hsl(240 6% 22%)',
                            background: 'hsl(240 10% 4%)',
                            color: 'hsl(0 0% 90%)',
                            fontSize: 13,
                            outline: 'none',
                          }}
                        />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => handleReject(action.id)}
                            disabled={isProcessing}
                            style={{
                              padding: '7px 14px',
                              borderRadius: 8,
                              border: 'none',
                              background: 'hsl(0 72% 51%)',
                              color: '#fff',
                              fontSize: 13,
                              fontWeight: 500,
                              cursor: isProcessing ? 'not-allowed' : 'pointer',
                              opacity: isProcessing ? 0.5 : 1,
                            }}
                          >
                            {isProcessing ? 'Confirming…' : 'Confirm Reject'}
                          </button>
                          <button
                            onClick={cancelReject}
                            style={{
                              padding: '7px 14px',
                              borderRadius: 8,
                              border: '1px solid hsl(240 6% 14%)',
                              background: 'transparent',
                              color: 'hsl(240 5% 55%)',
                              fontSize: 13,
                              cursor: 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
