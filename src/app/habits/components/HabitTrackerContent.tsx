'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, X, Flame, Droplets, Moon, Dumbbell, Brain, Leaf, Trash2, Target, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { habitsApi, type Habit, type HabitCreate } from '@/lib/api';
import { mockHabitsToday } from '@/lib/mockData';

const HABIT_TYPES = [
  { value: 'sleep', label: 'Sleep', icon: Moon, color: 'sky', unit: 'hrs' },
  { value: 'meditation', label: 'Meditation', icon: Brain, color: 'fuchsia', unit: 'min' },
  { value: 'exercise', label: 'Exercise', icon: Dumbbell, color: 'emerald', unit: 'min' },
  { value: 'water', label: 'Hydration', icon: Droplets, color: 'cyan', unit: 'glasses' },
  { value: 'nutrition', label: 'Nutrition', icon: Leaf, color: 'lime', unit: 'meals' },
  { value: 'custom', label: 'Custom', icon: Flame, color: 'amber', unit: 'times' },
];

const colorMap: Record<string, { ring: string; bg: string; text: string; fill: string }> = {
  sky: { ring: 'stroke-sky-400', bg: 'bg-sky-100 dark:bg-sky-900/30', text: 'text-sky-600 dark:text-sky-400', fill: '#0EA5E9' },
  fuchsia: { ring: 'stroke-fuchsia-400', bg: 'bg-fuchsia-100 dark:bg-fuchsia-900/30', text: 'text-fuchsia-600 dark:text-fuchsia-400', fill: '#D946EF' },
  emerald: { ring: 'stroke-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', fill: '#10B981' },
  cyan: { ring: 'stroke-cyan-400', bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-600 dark:text-cyan-400', fill: '#06B6D4' },
  lime: { ring: 'stroke-lime-400', bg: 'bg-lime-100 dark:bg-lime-900/30', text: 'text-lime-600 dark:text-lime-400', fill: '#84CC16' },
  amber: { ring: 'stroke-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', fill: '#F59E0B' },
  violet: { ring: 'stroke-violet-400', bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-600 dark:text-violet-400', fill: '#7C3AED' },
};

interface HabitWithProgress extends Habit {
  todayValue?: number;
  completed?: boolean;
}

function HabitRing({ value, target, color, size = 56 }: { value: number; target: number; color: string; size?: number }) {
  const pct = Math.min(value / target, 1);
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;
  const c = colorMap[color] ?? colorMap.sky;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={6} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={c.fill} strokeWidth={6}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.6s cubic-bezier(0.4,0,0.2,1)' }}
      />
    </svg>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

export default function HabitTrackerContent() {
  const [habits, setHabits] = useState<HabitWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loggingId, setLoggingId] = useState<string | null>(null);
  const [logValue, setLogValue] = useState('');

  // Add form state
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('sleep');
  const [newTarget, setNewTarget] = useState('8');
  const [newUnit, setNewUnit] = useState('hrs');
  const [submitting, setSubmitting] = useState(false);

  const loadHabits = useCallback(async () => {
    setLoading(true);
    try {
      const data = await habitsApi.list();
      setHabits(data.map((h) => ({ ...h, todayValue: 0, completed: false })));
    } catch {
      const mock: HabitWithProgress[] = mockHabitsToday.map((h) => ({
        id: h.id,
        user_id: 'user-001',
        name: h.label,
        type: h.type,
        target: h.target,
        unit: h.unit,
        color: h.color,
        is_active: true,
        created_at: new Date().toISOString(),
        todayValue: h.value,
        completed: h.completed,
      }));
      setHabits(mock);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadHabits(); }, [loadHabits]);

  const handleAddHabit = async () => {
    if (!newName.trim()) return;
    setSubmitting(true);
    const payload: HabitCreate = {
      name: newName.trim(),
      type: newType,
      target: Number(newTarget),
      unit: newUnit,
      color: HABIT_TYPES.find((t) => t.value === newType)?.color ?? 'violet',
    };
    try {
      const created = await habitsApi.create(payload);
      setHabits((prev) => [...prev, { ...created, todayValue: 0, completed: false }]);
    } catch {
      const optimistic: HabitWithProgress = {
        id: `local-${Date.now()}`,
        user_id: 'user-001',
        ...payload,
        is_active: true,
        created_at: new Date().toISOString(),
        todayValue: 0,
        completed: false,
      };
      setHabits((prev) => [...prev, optimistic]);
    } finally {
      setSubmitting(false);
      setShowAddForm(false);
      setNewName('');
      setNewType('sleep');
      setNewTarget('8');
      setNewUnit('hrs');
    }
  };

  const handleLogHabit = async (habitId: string) => {
    const val = Number(logValue);
    if (!val || val <= 0) return;
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    try {
      await habitsApi.logToday(habitId, val);
    } catch {
      // optimistic
    }
    setHabits((prev) =>
      prev.map((h) =>
        h.id === habitId
          ? { ...h, todayValue: val, completed: val >= h.target }
          : h
      )
    );
    setLoggingId(null);
    setLogValue('');
  };

  const handleDelete = async (habitId: string) => {
    try {
      await habitsApi.delete(habitId);
    } catch {
      // optimistic
    }
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
  };

  const completedCount = habits.filter((h) => h.completed).length;
  const completionRate = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;

  return (
    <div className="px-6 lg:px-8 xl:px-10 py-8 pb-24 lg:pb-8 max-w-screen-xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-heading font-semibold text-2xl text-foreground">Habit Tracker</h1>
          <p className="text-muted-foreground mt-1 text-sm">Small consistent actions build lasting change.</p>
        </div>
        <button onClick={() => setShowAddForm(true)} className="btn-primary text-sm">
          <Plus size={15} strokeWidth={1.5} />
          Add Habit
        </button>
      </motion.div>

      {/* Add Habit Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowAddForm(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="w-full max-w-md rounded-3xl bg-card border border-border p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-heading font-semibold text-lg text-foreground">New Habit</h2>
                <button onClick={() => setShowAddForm(false)} className="p-2 rounded-xl text-muted-foreground hover:bg-muted transition-colors">
                  <X size={16} strokeWidth={1.5} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium font-heading text-foreground mb-1.5 block">Habit Name</label>
                  <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Morning meditation" className="input-field" />
                </div>

                <div>
                  <label className="text-sm font-medium font-heading text-foreground mb-2 block">Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {HABIT_TYPES.map((t) => {
                      const c = colorMap[t.color] ?? colorMap.violet;
                      return (
                        <button
                          key={t.value}
                          onClick={() => { setNewType(t.value); setNewUnit(t.unit); }}
                          className={cn(
                            'flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all duration-150',
                            newType === t.value ? `${c.bg} border-current ${c.text}` : 'border-border hover:bg-muted'
                          )}
                        >
                          <t.icon size={18} strokeWidth={1.5} />
                          <span className="text-xs font-medium font-heading">{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium font-heading text-foreground mb-1.5 block">Daily Target</label>
                    <input type="number" value={newTarget} onChange={(e) => setNewTarget(e.target.value)} min="1" className="input-field" />
                  </div>
                  <div>
                    <label className="text-sm font-medium font-heading text-foreground mb-1.5 block">Unit</label>
                    <input value={newUnit} onChange={(e) => setNewUnit(e.target.value)} placeholder="hrs, min, times..." className="input-field" />
                  </div>
                </div>
              </div>

              <button onClick={handleAddHabit} disabled={!newName.trim() || submitting} className="btn-primary w-full justify-center mt-5">
                {submitting ? (
                  <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</span>
                ) : (
                  <span className="flex items-center gap-2"><Plus size={15} strokeWidth={1.5} />Create Habit</span>
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        {/* Today's Progress */}
        <motion.div variants={itemVariants} className="rounded-3xl bg-card border border-border p-6 card-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award size={16} strokeWidth={1.5} className="text-primary" />
              <h3 className="font-heading font-semibold text-sm text-foreground">Today&apos;s Progress</h3>
            </div>
            <span className="text-sm font-semibold font-heading text-primary">{completedCount}/{habits.length} done</span>
          </div>
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionRate}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full gradient-violet-rose"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">{completionRate}% complete</p>
        </motion.div>

        {/* Habits Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 skeleton-shimmer rounded-3xl" />)}
          </div>
        ) : habits.length === 0 ? (
          <motion.div variants={itemVariants} className="rounded-3xl bg-card border border-border p-12 text-center card-shadow">
            <Target size={40} strokeWidth={1} className="text-muted-foreground mx-auto mb-4" />
            <h3 className="font-heading font-semibold text-foreground mb-2">No habits yet</h3>
            <p className="text-sm text-muted-foreground mb-5">Add your first habit to start building your wellness routine.</p>
            <button onClick={() => setShowAddForm(true)} className="btn-primary mx-auto">
              <Plus size={15} strokeWidth={1.5} />Add First Habit
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {habits.map((habit) => {
              const typeInfo = HABIT_TYPES.find((t) => t.value === habit.type) ?? HABIT_TYPES[5];
              const c = colorMap[habit.color ?? typeInfo.color] ?? colorMap.violet;
              const todayVal = habit.todayValue ?? 0;
              const isLogging = loggingId === habit.id;

              return (
                <motion.div
                  key={habit.id}
                  variants={itemVariants}
                  className={cn(
                    'rounded-3xl bg-card border border-border p-5 card-shadow transition-all duration-200',
                    habit.completed && 'border-emerald-200 dark:border-emerald-800/40'
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="relative shrink-0">
                      <HabitRing value={todayVal} target={habit.target} color={habit.color ?? typeInfo.color} size={56} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        {habit.completed ? (
                          <Check size={16} strokeWidth={2} className="text-emerald-500" />
                        ) : (
                          <typeInfo.icon size={14} strokeWidth={1.5} className={c.text} />
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-heading font-semibold text-sm text-foreground">{habit.name}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {todayVal} / {habit.target} {habit.unit}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(habit.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                          >
                            <Trash2 size={13} strokeWidth={1.5} />
                          </button>
                        </div>
                      </div>

                      {isLogging ? (
                        <div className="flex items-center gap-2 mt-3">
                          <input
                            type="number"
                            value={logValue}
                            onChange={(e) => setLogValue(e.target.value)}
                            placeholder={`Enter ${habit.unit}`}
                            className="input-field py-1.5 text-xs flex-1"
                            autoFocus
                            onKeyDown={(e) => { if (e.key === 'Enter') handleLogHabit(habit.id); if (e.key === 'Escape') { setLoggingId(null); setLogValue(''); } }}
                          />
                          <button onClick={() => handleLogHabit(habit.id)} className="p-2 rounded-xl bg-primary text-white hover:opacity-90 transition-opacity">
                            <Check size={13} strokeWidth={2} />
                          </button>
                          <button onClick={() => { setLoggingId(null); setLogValue(''); }} className="p-2 rounded-xl bg-muted text-muted-foreground hover:bg-muted/80 transition-colors">
                            <X size={13} strokeWidth={1.5} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setLoggingId(habit.id); setLogValue(''); }}
                          className={cn(
                            'mt-3 text-xs font-medium font-heading px-3 py-1.5 rounded-xl transition-all duration-150',
                            habit.completed
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                              : `${c.bg} ${c.text} hover:opacity-80`
                          )}
                        >
                          {habit.completed ? '✓ Completed' : 'Log Progress'}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
