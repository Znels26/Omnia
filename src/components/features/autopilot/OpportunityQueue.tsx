'use client';

import { useState } from 'react';
import { ExternalLink, RefreshCw, Sparkles, ArrowRight } from 'lucide-react';

interface Opportunity {
  id: string;
  title: string;
  description?: string;
  source_url?: string;
  relevance_score: number;
  status: string;
}

interface OpportunityQueueProps {
  opportunities: any[];
  onRefresh: () => void;
}

function getRelevanceMeta(score: number): { color: string; bg: string } {
  if (score >= 8) return { color: 'hsl(142 70% 55%)', bg: 'hsl(142 50% 14%)' };
  if (score >= 5) return { color: 'hsl(38 95% 60%)',  bg: 'hsl(38 80% 16%)'  };
  return             { color: 'hsl(240 5% 55%)',       bg: 'hsl(240 6% 14%)'  };
}

function getStatusMeta(status: string): { label: string; color: string; dotColor: string } {
  switch (status) {
    case 'viewed':
      return { label: 'Viewed',  color: 'hsl(240 5% 55%)', dotColor: 'hsl(240 5% 55%)' };
    case 'acted':
      return { label: 'Acted',   color: 'hsl(142 70% 55%)', dotColor: 'hsl(142 70% 55%)' };
    default:
      return { label: 'New',     color: 'hsl(205 80% 70%)', dotColor: 'hsl(205 90% 60%)' };
  }
}

export default function OpportunityQueue({ opportunities: propOpportunities, onRefresh }: OpportunityQueueProps) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(
    [...(propOpportunities as Opportunity[])].sort((a, b) => b.relevance_score - a.relevance_score)
  );
  const [processing, setProcessing] = useState<string | null>(null);

  async function handleAct(opp: Opportunity) {
    setProcessing(opp.id);
    try {
      const res = await fetch('/api/autopilot/opportunities', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: opp.id, status: 'acted' }),
      });
      if (!res.ok) throw new Error('Failed to update opportunity');
      setOpportunities(prev =>
        prev.map(o => (o.id === opp.id ? { ...o, status: 'acted' } : o))
      );
      if (opp.source_url) {
        window.open(opp.source_url, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(null);
    }
  }

  async function handleDismiss(id: string) {
    setProcessing(id);
    try {
      const res = await fetch('/api/autopilot/opportunities', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'dismissed' }),
      });
      if (!res.ok) throw new Error('Failed to dismiss opportunity');
      setOpportunities(prev => prev.filter(o => o.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(null);
    }
  }

  const visible = opportunities.filter(o => o.status !== 'dismissed');

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
            Opportunities
          </h2>
          {visible.length > 0 && (
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
              {visible.length}
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
      {visible.length === 0 && (
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
          <Sparkles size={36} color="hsl(240 5% 35%)" strokeWidth={1.5} />
          <p style={{ margin: 0, color: 'hsl(240 5% 55%)', fontSize: 14, maxWidth: 360, lineHeight: 1.6 }}>
            Omnia is scanning for opportunities matching your profile. New ones appear every morning.
          </p>
        </div>
      )}

      {/* Opportunity cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {visible.map(opp => {
          const relevanceMeta = getRelevanceMeta(opp.relevance_score);
          const statusMeta = getStatusMeta(opp.status);
          const isProcessing = processing === opp.id;

          return (
            <div
              key={opp.id}
              style={{
                borderRadius: 12,
                border: '1px solid hsl(240 6% 14%)',
                background: 'hsl(240 8% 7%)',
                padding: '16px 18px',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'hsl(240 6% 20%)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'hsl(240 6% 14%)';
              }}
            >
              {/* Top row: relevance + status */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                marginBottom: 10,
                flexWrap: 'wrap',
              }}>
                {/* Relevance badge */}
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '3px 10px',
                  borderRadius: 20,
                  background: relevanceMeta.bg,
                  color: relevanceMeta.color,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.03em',
                  whiteSpace: 'nowrap',
                }}>
                  Relevance: {opp.relevance_score}/10
                </span>

                {/* Status badge */}
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 11,
                  fontWeight: 600,
                  color: statusMeta.color,
                }}>
                  <span style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: statusMeta.dotColor,
                    display: 'inline-block',
                  }} />
                  {statusMeta.label}
                </span>
              </div>

              {/* Title */}
              <p style={{
                margin: '0 0 6px',
                fontSize: 15,
                fontWeight: 600,
                color: 'hsl(0 0% 90%)',
                lineHeight: 1.4,
              }}>
                {opp.title}
              </p>

              {/* Description — 2 lines max */}
              {opp.description && (
                <p style={{
                  margin: '0 0 10px',
                  fontSize: 13,
                  color: 'hsl(240 5% 55%)',
                  lineHeight: 1.55,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {opp.description}
                </p>
              )}

              {/* Source URL */}
              {opp.source_url && (
                <a
                  href={opp.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    marginBottom: 14,
                    fontSize: 11,
                    color: 'hsl(205 80% 60%)',
                    textDecoration: 'none',
                    wordBreak: 'break-all',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none';
                  }}
                >
                  <ExternalLink size={11} />
                  {opp.source_url.replace(/^https?:\/\//, '').slice(0, 60)}
                  {opp.source_url.replace(/^https?:\/\//, '').length > 60 ? '…' : ''}
                </a>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                {/* Act on this */}
                <button
                  onClick={() => handleAct(opp)}
                  disabled={isProcessing}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 14px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'hsl(205 90% 48%)',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    opacity: isProcessing ? 0.6 : 1,
                    transition: 'background 0.15s, opacity 0.15s',
                  }}
                  onMouseEnter={e => {
                    if (!isProcessing)
                      (e.currentTarget as HTMLButtonElement).style.background = 'hsl(205 90% 42%)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'hsl(205 90% 48%)';
                  }}
                >
                  Act on this
                  <ArrowRight size={13} />
                </button>

                {/* Dismiss */}
                <button
                  onClick={() => handleDismiss(opp.id)}
                  disabled={isProcessing}
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
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    opacity: isProcessing ? 0.6 : 1,
                    transition: 'color 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={e => {
                    if (!isProcessing) {
                      (e.currentTarget as HTMLButtonElement).style.color = 'hsl(0 0% 75%)';
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'hsl(240 6% 25%)';
                    }
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.color = 'hsl(240 5% 55%)';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'hsl(240 6% 14%)';
                  }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
