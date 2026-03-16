'use client';
import { useState } from 'react';
import { Plus, CheckCircle2, Circle, Trash2, Target, Zap, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const PRIORITY_COLORS: any = { low: '#6b7280', medium: '#fbbf24', high: '#fb923c', urgent: '#ef4444' };

export function PlannerView({ profile, initialTasks, initialGoals, initialHabits }: any) {
  const [tasks, setTasks] = useState(initialTasks);
  const [goals] = useState(initialGoals);
  const [habits] = useState(initialHabits);
  const [tab, setTab] = useState<'tasks'|'goals'|'habits'>('tasks');
  const [newTask, setNewTask] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const addTask = async () => {
    if (!newTask.trim()) return;
    setAdding(true);
    try {
      const res = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: newTask.trim(), priority, due_date: dueDate || null }) });
      if (!res.ok) { const d = await res.json(); toast.error(d.error || 'Failed'); return; }
      const { task } = await res.json();
      setTasks((p: any[]) => [task, ...p]);
      setNewTask(''); setDueDate(''); setShowForm(false);
      toast.success('Task added!');
    } finally { setAdding(false); }
  };

  const toggleTask = async (task: any) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    await fetch(`/api/tasks/${task.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus, completed_at: newStatus === 'completed' ? new Date().toISOString() : null }) });
    setTasks((p: any[]) => p.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
  };

  const deleteTask = async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    setTasks((p: any[]) => p.filter(t => t.id !== id));
  };

  const pending = tasks.filter((t: any) => t.status !== 'completed');
  const completed = tasks.filter((t: any) => t.status === 'completed');
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="page" style={{ paddingBottom: '80px', maxWidth: '800px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div><h1 style={{ fontSize: '24px', fontWeight: 700 }}>Planner</h1><p style={{ color: 'hsl(240 5% 55%)', fontSize: '14px', marginTop: '2px' }}>{formatDate(new Date(), 'EEEE, MMMM d')}</p></div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary"><Plus size={15} /> Add Task</button>
      </div>

      {showForm && (
        <div className="card" style={{ padding: '16px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask()} placeholder="What needs to be done?" autoFocus style={{ fontSize: '15px' }} />
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {(['low','medium','high','urgent'] as const).map(p => (
              <button key={p} onClick={() => setPriority(p)} style={{ padding: '5px 12px', borderRadius: '8px', border: `1px solid ${priority === p ? PRIORITY_COLORS[p] : 'hsl(240 6% 20%)'}`, background: priority === p ? PRIORITY_COLORS[p] + '20' : 'transparent', color: priority === p ? PRIORITY_COLORS[p] : 'hsl(240 5% 55%)', fontSize: '12px', cursor: 'pointer', fontWeight: 500, textTransform: 'capitalize' }}>{p}</button>
            ))}
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ width: 'auto', padding: '5px 10px', fontSize: '12px' }} />
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowForm(false)} className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '13px' }}>Cancel</button>
              <button onClick={addTask} disabled={adding || !newTask.trim()} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '13px' }}>{adding ? 'Adding…' : 'Add'}</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'hsl(240 6% 9%)', padding: '4px', borderRadius: '10px' }}>
        {[{ v: 'tasks', l: `Tasks (${pending.length})` }, { v: 'goals', l: `Goals (${goals.length})` }, { v: 'habits', l: `Habits (${habits.length})` }].map(({ v, l }) => (
          <button key={v} onClick={() => setTab(v as any)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, background: tab === v ? 'hsl(240 8% 7%)' : 'transparent', color: tab === v ? 'hsl(0 0% 88%)' : 'hsl(240 5% 55%)', transition: 'all 0.15s' }}>{l}</button>
        ))}
      </div>

      {tab === 'tasks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {pending.length === 0 ? <div className="empty"><CheckCircle2 size={32} color="hsl(240 5% 35%)" /><p style={{ fontSize: '14px', color: 'hsl(240 5% 50%)' }}>No pending tasks</p><button onClick={() => setShowForm(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(205, 90%, 60%)', fontSize: '13px' }}>Add a task</button></div> :
            pending.map((t: any) => (
              <div key={t.id} className="card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button onClick={() => toggleTask(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexShrink: 0, color: 'hsl(240 5% 55%)', padding: 0 }}><Circle size={18} /></button>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: PRIORITY_COLORS[t.priority] || '#888', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '14px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</p>
                  {t.description && <p style={{ fontSize: '12px', color: 'hsl(240 5% 55%)', marginTop: '2px' }}>{t.description}</p>}
                </div>
                {t.due_date && <span style={{ fontSize: '12px', color: t.due_date < today ? '#ef4444' : 'hsl(240 5% 50%)', display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}><Clock size={12} />{formatDate(t.due_date, 'MMM d')}</span>}
                <button onClick={() => deleteTask(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 45%)', padding: '4px', display: 'flex', flexShrink: 0 }}><Trash2 size={14} /></button>
              </div>
            ))
          }
          {completed.length > 0 && (
            <details style={{ marginTop: '12px' }}>
              <summary style={{ fontSize: '13px', color: 'hsl(240 5% 50%)', cursor: 'pointer', padding: '6px 0' }}>{completed.length} completed</summary>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px', opacity: 0.6 }}>
                {completed.map((t: any) => (
                  <div key={t.id} className="card" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button onClick={() => toggleTask(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: '#34d399', padding: 0 }}><CheckCircle2 size={18} /></button>
                    <p style={{ fontSize: '13px', textDecoration: 'line-through', color: 'hsl(240 5% 50%)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</p>
                    <button onClick={() => deleteTask(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 45%)', padding: '2px', display: 'flex' }}><Trash2 size={13} /></button>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {tab === 'goals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {goals.length === 0 ? <div className="empty"><Target size={32} color="hsl(240 5% 35%)" /><p style={{ fontSize: '14px', color: 'hsl(240 5% 50%)' }}>No goals set</p></div> :
            goals.map((g: any) => (
              <div key={g.id} className="card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '22px' }}>{g.icon || '🎯'}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: '14px' }}>{g.title}</p>
                    {g.target_date && <p style={{ fontSize: '12px', color: 'hsl(240 5% 50%)' }}>Target: {formatDate(g.target_date)}</p>}
                  </div>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: g.color || 'hsl(205, 90%, 60%)' }}>{g.progress}%</span>
                </div>
                <div className="usage-bar"><div className="usage-fill" style={{ width: `${g.progress}%`, background: g.color || 'hsl(205, 90%, 48%)' }} /></div>
              </div>
            ))
          }
        </div>
      )}

      {tab === 'habits' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {habits.length === 0 ? <div className="empty" style={{ gridColumn: '1/-1' }}><Zap size={32} color="hsl(240 5% 35%)" /><p style={{ fontSize: '14px', color: 'hsl(240 5% 50%)' }}>No habits tracked</p></div> :
            habits.map((h: any) => (
              <div key={h.id} className="card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '22px' }}>{h.icon || '⚡'}</span>
                  <div><p style={{ fontWeight: 600, fontSize: '14px' }}>{h.title}</p><p style={{ fontSize: '12px', color: 'hsl(240 5% 50%)', textTransform: 'capitalize' }}>{h.frequency}</p></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: h.color || '#10b981', fontWeight: 600 }}>🔥 {h.streak_current} day streak</span>
                  <span style={{ color: 'hsl(240 5% 50%)' }}>Best: {h.streak_best}</span>
                </div>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}
