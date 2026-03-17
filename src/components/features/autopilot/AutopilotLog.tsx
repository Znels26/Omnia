'use client';

import { useState } from 'react';
import { ClipboardList } from 'lucide-react';

interface LogEntry {
  id: string;
  action_type: string;
  description: string;
  outcome?: string;
  reasoning?: string;
  persona?: string;
  created_at: string;
}

interface AutopilotLogProps {
  log: any[];
}

type FilterType = 'all' | 'content_idea' | 'opportunity' | 'briefing' | 'invoice_chase' | 'follow_up';

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'all',           label: 'All' },
  { value: 'content_idea',  label: 'Content Idea' },
  { value: 'opportunity',   label: 'Opportunity' },
  { value: 'briefing',      label: 'Briefing' },
  { value: 'invoice_chase', label: 'Invoice Chase' },
  { value: 'follow_up',     label: 'Follow Up' },
];

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

function formatLogTimestamp(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const day = d.getDate();
    const hours = d.getHours();
    const mins = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    const hour12 = hours % 12 || 12;
    return `${dayName} ${month} ${day}, ${hour12}:${mins}${ampm}`;
  } catch {
    return '';
  }
}

function getDateGroupLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 86_400_000);

    if (d >= startOfToday) return 'Today';
    if (d >= startOfYesterday) return 'Yesterday';

    const month = d.toLocaleDateString('en-US', { month: 'long' });
    const day = d.getDate();
    const year = d.getFullYear();
    const thisYear = now.getFullYear();
    return year !== thisYear ? `${month} ${day}, ${year}` : `${month} ${day}`;
  } catch {
    return 'Earlier';
  }
}

function groupByDate(entries: LogEntry[]): { label: string; items: LogEntry[] }[] {
  const map = new Map<string, LogEntry[]>();
  const order: string[] = [];

  for (const entry of entries) {
    const label = getDateGroupLabel(entry.created_at);
    if (!map.has(label)) {
      map.set(label, []);
      order.push(label);
    }
    map.get(label)!.push(entry);
  }

  return order.map(label => ({ label, items: map.get(label)! }));
}

function LogEntryCard({ entry }: { entry: LogEntry }) {
  const [showReasoning, setShowReasoning] = useState(false);
  const meta = getTypeMeta(entry.action_type);

  return (
    <div style={{
      borderRadius: 12,
      border: '1px solid hsl(240 6% 14%)',
      background: 'hsl(240 8% 7%)',
      padding: '14px 16px',
    }}>
      {/* Top row: timestamp + type badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        flexWrap: 'wrap',
        marginBottom: 8,
      }}>
        <span style={{ fontSize: 12, color: 'hsl(240 5% 50%)', fontVariantNumeric: 'tabular-nums' }}>
          {formatLogTimestamp(entry.created_at)}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {entry.persona && (
            <span style={{
              fontSize: 11,
              color: 'hsl(240 5% 50%)',
              background: 'hsl(240 6% 12%)',
              padding: '2px 8px',
              borderRadius: 20,
              fontWeight: 500,
            }}>
              {entry.persona}
            </span>
          )}
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
        </div>
      </div>

      {/* Description */}
      <p style={{
        margin: '0 0 6px',
        fontSize: 14,
        color: 'hsl(0 0% 85%)',
        lineHeight: 1.5,
        fontWeight: 500,
      }}>
        {entry.description}
      </p>

      {/* Outcome */}
      {entry.outcome && (
        <p style={{
          margin: '0 0 6px',
          fontSize: 12,
          color: 'hsl(240 5% 55%)',
          lineHeight: 1.5,
        }}>
          {entry.outcome}
        </p>
      )}

      {/* Reasoning toggle */}
      {entry.reasoning && (
        <div>
          <button
            onClick={() => setShowReasoning(v => !v)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              fontSize: 12,
              color: 'hsl(205 80% 60%)',
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              marginTop: 2,
            }}
          >
            {showReasoning ? 'Hide reasoning ↑' : 'See why →'}
          </button>
          {showReasoning && (
            <p style={{
              margin: '6px 0 0',
              fontSize: 12,
              color: 'hsl(240 5% 50%)',
              fontStyle: 'italic',
              lineHeight: 1.6,
              paddingLeft: 10,
              borderLeft: '2px solid hsl(240 6% 18%)',
            }}>
              {entry.reasoning}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function AutopilotLog({ log }: AutopilotLogProps) {
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = (log as LogEntry[]).filter(
    entry => filter === 'all' || entry.action_type === filter
  );

  const groups = groupByDate(filtered);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 600, color: 'hsl(0 0% 90%)' }}>
          Activity Log
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: 'hsl(240 5% 55%)' }}>
          Full history of everything Autopilot has done.
        </p>
      </div>

      {/* Filter pills */}
      <div style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        paddingBottom: 4,
        scrollbarWidth: 'none',
      }}>
        {FILTER_OPTIONS.map(opt => {
          const isActive = filter === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              style={{
                flexShrink: 0,
                padding: '6px 14px',
                borderRadius: 20,
                border: `1px solid ${isActive ? 'hsl(205 90% 48%)' : 'hsl(240 6% 14%)'}`,
                background: isActive ? 'hsl(205 70% 18%)' : 'transparent',
                color: isActive ? 'hsl(205 80% 70%)' : 'hsl(240 5% 55%)',
                fontSize: 12,
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
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
          <ClipboardList size={36} color="hsl(240 5% 35%)" strokeWidth={1.5} />
          <p style={{ margin: 0, color: 'hsl(240 5% 55%)', fontSize: 14, maxWidth: 360, lineHeight: 1.6 }}>
            No activity yet. Enable Autopilot and come back tomorrow to see what Omnia did overnight.
          </p>
        </div>
      )}

      {/* Groups with sticky date headers */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {groups.map(group => (
          <div key={group.label}>
            {/* Sticky date header */}
            <div style={{
              position: 'sticky',
              top: 0,
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '6px 0',
              marginBottom: 12,
              background: 'hsl(240 10% 4%)',
            }}>
              <span style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'hsl(240 5% 55%)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                whiteSpace: 'nowrap',
              }}>
                {group.label}
              </span>
              <div style={{
                flex: 1,
                height: 1,
                background: 'hsl(240 6% 14%)',
              }} />
              <span style={{
                fontSize: 11,
                color: 'hsl(240 5% 40%)',
                whiteSpace: 'nowrap',
              }}>
                {group.items.length} {group.items.length === 1 ? 'action' : 'actions'}
              </span>
            </div>

            {/* Entries */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {group.items.map(entry => (
                <LogEntryCard key={entry.id} entry={entry} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
