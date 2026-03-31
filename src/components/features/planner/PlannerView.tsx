'use client';
import { useState } from 'react';
import { Plus, CheckCircle2, Circle, Trash2, Target, Zap, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const PRIORITY_COLORS: any = { low: '#6b7280', medium: '#fbbf24', high: '#fb923c', urgent: '#ef4444' };
const GOAL_COLORS = ['hsl(205,90%,60%)', 'hsl(142,70%,55%)', 'hsl(262,83%,75%)', 'hsl(38,90%,65%)', '#f472b6'];
const FREQ_OPTIONS = ['daily', 'weekly', 'weekdays', '3x/week'];

export function PlannerView({ profile, initialTasks, initialGoals, initialHabits }: any) {
  const [tasks, setTasks] = useState(initialTasks);
  const [goals, setGoals] = useState(initialGoals);
  const [habits, setHabits] = useState(initialHabits);
  const [tab, setTab] = useState<'tasks'|'goals'|'habits'>('tasks');

  // Task form
  const [newTask, setNewTask] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Goal form
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDate, setNewGoalDate] = useState('');
  const [newGoalIcon, setNewGoalIcon] = useState('🎯');
  const [newGoalColor, setNewGoalColor] = useState(GOAL_COLORS[0]);
  const [addingGoal, setAddingGoal] = useState(false);

  // Habit form
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitFreq, setNewHabitFreq] = useState('daily');
  const [newHabitIcon, setNewHabitIcon] = useState('⚡');
  const [addingHabit, setAddingHabit] = useState(false);

  // ── Tasks ──
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

  // ── Goals ──
  const addGoal = async () => {
    if (!newGoalTitle.trim()) return;
    setAddingGoal(true);
    try {
      const res = await fetch('/api/goals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: newGoalTitle.trim(), icon: newGoalIcon, color: newGoalColor, target_date: newGoalDate || null }) });
      if (!res.ok) { const d = await res.json(); toast.error(d.error || 'Failed'); return; }
      const { goal } = await res.json();
      setGoals((p: any[]) => [...p, goal]);
      setNewGoalTitle(''); setNewGoalDate(''); setShowGoalForm(false);
      toast.success('Goal added!');
    } finally { setAddingGoal(false); }
  };

  const deleteGoal = async (id: string) => {
    await fetch(`/api/goals/${id}`, { method: 'DELETE' });
    setGoals((p: any[]) => p.filter((g: any) => g.id !== id));
    toast.success('Goal removed');
  };

  // ── Habits ──
  const addHabit = async () => {
    if (!newHabitTitle.trim()) return;
    setAddingHabit(true);
    try {
      const res = await fetch('/api/habits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: newHabitTitle.trim(), icon: newHabitIcon, frequency: newHabitFreq }) });
      if (!res.ok) { const d = await res.json(); toast.error(d.error || 'Failed'); return; }
      const { habit } = await res.json();
      setHabits((p: any[]) => [...p, habit]);
      setNewHabitTitle(''); setShowHabitForm(false);
      toast.success('Habit added!');
    } finally { setAddingHabit(false); }
  };

  const deleteHabit = async (id: string) => {
    await fetch(`/api/habits/${id}`, { method: 'DELETE' });
    setHabits((p: any[]) => p.filter((h: any) => h.id !== id));
    toast.success('Habit removed');
  };

  const pending = tasks.filter((t: any) => t.status !== 'completed');
  const completed = tasks.filter((t: any) => t.status === 'completed');
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="page" style={{ paddingBottom: '80px', maxWidth: '800px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div><h1 style={{ fontSize: '24px', fontWeight: 700 }}>Planner</h1><p style={{ color: 'hsl(240 5% 55%)', fontSize: '14px', marginTop: '2px' }}>{formatDate(new Date(), 'EEEE, MMMM d')}</p></div>
        {tab === 'tasks' && <button onClick={() => setShowForm(!showForm)} className="btn btn-primary"><Plus size={15} /> Add Task</button>}
        {tab === 'goals' && <button onClick={() => setShowGoalForm(!showGoalForm)} className="btn btn-primary"><Plus size={15} /> Add Goal</button>}
        {tab === 'habits' && <button onClick={() => setShowHabitForm(!showHabitForm)} className="btn btn-primary"><Plus size={15} /> Add Habit</button>}
      </div>

      {/* Task form */}
      {tab === 'tasks' && showForm && (
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

      {/* Goal form */}
      {tab === 'goals' && showGoalForm && (
        <div className="card" style={{ padding: '16px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input value={newGoalIcon} onChange={e => setNewGoalIcon(e.target.value)} style={{ width: '52px', textAlign: 'center', fontSize: '20px' }} placeholder="🎯" />
            <input value={newGoalTitle} onChange={e => setNewGoalTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && addGoal()} placeholder="What's your goal?" autoFocus style={{ flex: 1, fontSize: '15px' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '12px', color: 'hsl(240 5% 55%)' }}>Target date:</label>
            <input type="date" value={newGoalDate} onChange={e => setNewGoalDate(e.target.value)} style={{ width: 'auto', padding: '5px 10px', fontSize: '12px' }} />
            <div style={{ display: 'flex', gap: '6px', marginLeft: '4px' }}>
              {GOAL_COLORS.map(c => (
                <button key={c} onClick={() => setNewGoalColor(c)} style={{ width: '18px', height: '18px', borderRadius: '50%', background: c, border: newGoalColor === c ? '2px solid white' : '2px solid transparent', cursor: 'pointer', padding: 0 }} />
              ))}
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowGoalForm(false)} className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '13px' }}>Cancel</button>
              <button onClick={addGoal} disabled={addingGoal || !newGoalTitle.trim()} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '13px' }}>{addingGoal ? 'Adding…' : 'Add Goal'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Habit form */}
      {tab === 'habits' && showHabitForm && (
        <div className="card" style={{ padding: '16px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input value={newHabitIcon} onChange={e => setNewHabitIcon(e.target.value)} style={{ width: '52px', textAlign: 'center', fontSize: '20px' }} placeholder="⚡" />
            <input value={newHabitTitle} onChange={e => setNewHabitTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && addHabit()} placeholder="Habit name (e.g. Morning run)" autoFocus style={{ flex: 1, fontSize: '15px' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {FREQ_OPTIONS.map(f => (
              <button key={f} onClick={() => setNewHabitFreq(f)} style={{ padding: '5px 12px', borderRadius: '8px', border: `1px solid ${newHabitFreq === f ? 'hsl(205,90%,48%)' : 'hsl(240 6% 20%)'}`, background: newHabitFreq === f ? 'hsl(205 90% 48% / 0.12)' : 'transparent', color: newHabitFreq === f ? 'hsl(205,90%,60%)' : 'hsl(240 5% 55%)', fontSize: '12px', cursor: 'pointer' }}>{f}</button>
            ))}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowHabitForm(false)} className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '13px' }}>Cancel</button>
              <button onClick={addHabit} disabled={addingHabit || !newHabitTitle.trim()} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '13px' }}>{addingHabit ? 'Adding…' : 'Add Habit'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'hsl(240 6% 9%)', padding: '4px', borderRadius: '10px' }}>
        {[{ v: 'tasks', l: `Tasks (${pending.length})` }, { v: 'goals', l: `Goals (${goals.length})` }, { v: 'habits', l: `Habits (${habits.length})` }].map(({ v, l }) => (
          <button key={v} onClick={() => setTab(v as any)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, background: tab === v ? 'hsl(240 8% 7%)' : 'transparent', color: tab === v ? 'hsl(0 0% 88%)' : 'hsl(240 5% 55%)', transition: 'all 0.15s' }}>{l}</button>
        ))}
      </div>

      {/* Tasks tab */}
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

      {/* Goals tab */}
      {tab === 'goals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {goals.length === 0 ? (
            <div className="empty">
              <Target size={32} color="hsl(240 5% 35%)" />
              <p style={{ fontSize: '14px', color: 'hsl(240 5% 50%)' }}>No goals set yet</p>
              <button onClick={() => setShowGoalForm(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(205, 90%, 60%)', fontSize: '13px' }}>Add your first goal</button>
            </div>
          ) : (
            goals.map((g: any) => (
              <div key={g.id} className="card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '22px' }}>{g.icon || '🎯'}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: '14px' }}>{g.title}</p>
                    {g.target_date && <p style={{ fontSize: '12px', color: 'hsl(240 5% 50%)' }}>Target: {formatDate(g.target_date)}</p>}
                  </div>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: g.color || 'hsl(205, 90%, 60%)' }}>{g.progress || 0}%</span>
                  <button onClick={() => deleteGoal(g.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 45%)', padding: '4px', display: 'flex' }}><Trash2 size={14} /></button>
                </div>
                <div className="usage-bar"><div className="usage-fill" style={{ width: `${g.progress || 0}%`, background: g.color || 'hsl(205, 90%, 48%)' }} /></div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Habits tab */}
      {tab === 'habits' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
          {habits.length === 0 ? (
            <div className="empty" style={{ gridColumn: '1/-1' }}>
              <Zap size={32} color="hsl(240 5% 35%)" />
              <p style={{ fontSize: '14px', color: 'hsl(240 5% 50%)' }}>No habits tracked yet</p>
              <button onClick={() => setShowHabitForm(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(205, 90%, 60%)', fontSize: '13px' }}>Add your first habit</button>
            </div>
          ) : (
            habits.map((h: any) => (
              <div key={h.id} className="card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '22px' }}>{h.icon || '⚡'}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: '14px' }}>{h.title}</p>
                    <p style={{ fontSize: '12px', color: 'hsl(240 5% 50%)', textTransform: 'capitalize' }}>{h.frequency}</p>
                  </div>
                  <button onClick={() => deleteHabit(h.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 45%)', padding: '4px', display: 'flex' }}><Trash2 size={14} /></button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: h.color || '#10b981', fontWeight: 600 }}>🔥 {h.streak_current || 0} day streak</span>
                  <span style={{ color: 'hsl(240 5% 50%)' }}>Best: {h.streak_best || 0}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
