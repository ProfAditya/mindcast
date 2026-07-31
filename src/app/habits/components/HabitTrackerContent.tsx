'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Moon, Droplets, Dumbbell, Brain, BookOpen, Monitor, TreePine, Coffee, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { habitLogsApi, type HabitLog, type HabitLogCreate, type HabitType } from '@/lib/api';
import { toast } from 'sonner';
import Icon from '@/components/ui/AppIcon';


/** The 8 fixed habit types — no user-created habits exist on the backend */
const HABIT_DEFINITIONS: Array<{
  type: HabitType;
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  fill: string;
  unit: string;
  defaultTarget: number;
}> = [
  { type: 'sleep', label: 'Sleep', icon: Moon, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-100 dark:bg-sky-900/30', fill: '#0EA5E9', unit: 'hrs', defaultTarget: 8 },
  { type: 'water', label: 'Water', icon: Droplets, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-100 dark:bg-cyan-900/30', fill: '#06B6D4', unit: 'glasses', defaultTarget: 8 },
  { type: 'exercise', label: 'Exercise', icon: Dumbbell, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', fill: '#10B981', unit: 'min', defaultTarget: 30 },
  { type: 'meditation', label: 'Meditation', icon: Brain, color: 'text-fuchsia-600 dark:text-fuchsia-400', bg: 'bg-fuchsia-100 dark:bg-fuchsia-900/30', fill: '#D946EF', unit: 'min', defaultTarget: 20 },
  { type: 'reading', label: 'Reading', icon: BookOpen, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-900/30', fill: '#7C3AED', unit: 'min', defaultTarget: 30 },
  { type: 'screen_time', label: 'Screen Time', icon: Monitor, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30', fill: '#F59E0B', unit: 'hrs', defaultTarget: 2 },
  { type: 'outdoor', label: 'Outdoor', icon: TreePine, color: 'text-lime-600 dark:text-lime-400', bg: 'bg-lime-100 dark:bg-lime-900/30', fill: '#84CC16', unit: 'min', defaultTarget: 30 },
  { type: 'caffeine', label: 'Caffeine', icon: Coffee, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-900/30', fill: '#FB7185', unit: 'cups', defaultTarget: 2 },
];

function HabitRing({ value, target, fill, size = 56 }: { value: number; target: number; fill: string; size?: number }) {
  const pct = Math.min(value / Math.max(target, 1), 1);
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={6} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={fill} strokeWidth={6}
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

interface HabitState {
  type: HabitType;
  todayValue: number;
  completed: boolean;
  logId?: string;
}

export default function HabitTrackerContent() {
  const [habitStates, setHabitStates] = useState<Record<HabitType, HabitState>>(() => {
    const init: Partial<Record<HabitType, HabitState>> = {};
    HABIT_DEFINITIONS.forEach((h) => {
      init[h.type] = { type: h.type, todayValue: 0, completed: false };
    });
    return init as Record<HabitType, HabitState>;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loggingType, setLoggingType] = useState<HabitType | null>(null);
  const [logValue, setLogValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const logs = await habitLogsApi.list();
      // Build today's state from logs
      const today = new Date().toISOString().split('T')[0];
      const todayLogs = logs.filter((l) => l.created_at?.startsWith(today));

      setHabitStates((prev) => {
        const next = { ...prev };
        todayLogs.forEach((log) => {
          if (log.habit_type && next[log.habit_type]) {
            next[log.habit_type] = {
              type: log.habit_type,
              todayValue: log.value,
              completed: log.completed,
              logId: log.id,
            };
          }
        });
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load habit logs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const handleLog = async (habitType: HabitType) => {
    const val = Number(logValue);
    if (!val || val <= 0) return;
    const def = HABIT_DEFINITIONS.find((h) => h.type === habitType);
    if (!def) return;

    setSubmitting(true);
    const payload: HabitLogCreate = {
      habit_type: habitType,
      value: val,
      unit: def.unit,
      completed: val >= def.defaultTarget,
    };

    try {
      const created = await habitLogsApi.create(payload);
      setHabitStates((prev) => ({
        ...prev,
        [habitType]: {
          type: habitType,
          todayValue: val,
          completed: created.completed,
          logId: created.id,
        },
      }));
      toast.success(`${def.label} logged!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to log habit');
    } finally {
      setSubmitting(false);
      setLoggingType(null);
      setLogValue('');
    }
  };

  const completedCount = HABIT_DEFINITIONS.filter((h) => habitStates[h.type]?.completed).length;

  return (
    <div className="px-6 lg:px-8 xl:px-10 py-8 pb-24 lg:pb-8 max-w-screen-xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-heading font-semibold text-2xl text-foreground">Habit Tracker</h1>
          <p className="text-muted-foreground mt-1 text-sm">Small consistent actions build lasting change.</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2">
          <Activity size={15} strokeWidth={1.5} className="text-primary" />
          <span className="text-sm font-semibold font-heading text-foreground">{completedCount}/{HABIT_DEFINITIONS.length} today</span>
        </div>
      </motion.div>

      {/* Log Value Modal */}
      <AnimatePresence>
        {loggingType && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) { setLoggingType(null); setLogValue(''); } }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="w-full max-w-sm rounded-3xl bg-card border border-border p-6 shadow-2xl"
            >
              {(() => {
                const def = HABIT_DEFINITIONS.find((h) => h.type === loggingType);
                if (!def) return null;
                const Icon = def.icon;
                return (
                  <>
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', def.bg)}>
                          <Icon size={18} strokeWidth={1.5} className={def.color} />
                        </div>
                        <div>
                          <h2 className="font-heading font-semibold text-base text-foreground">Log {def.label}</h2>
                          <p className="text-xs text-muted-foreground">Target: {def.defaultTarget} {def.unit}</p>
                        </div>
                      </div>
                      <button onClick={() => { setLoggingType(null); setLogValue(''); }} className="p-2 rounded-xl text-muted-foreground hover:bg-muted transition-colors">
                        <X size={16} strokeWidth={1.5} />
                      </button>
                    </div>
                    <div className="mb-5">
                      <label className="text-sm font-medium font-heading text-foreground mb-1.5 block">
                        Value ({def.unit})
                      </label>
                      <input
                        type="number"
                        value={logValue}
                        onChange={(e) => setLogValue(e.target.value)}
                        placeholder={`e.g. ${def.defaultTarget}`}
                        min="0"
                        step="0.1"
                        className="input-field"
                        autoFocus
                      />
                    </div>
                    <button
                      onClick={() => handleLog(loggingType)}
                      disabled={!logValue || Number(logValue) <= 0 || submitting}
                      className="btn-primary w-full justify-center"
                    >
                      {submitting ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Saving...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Check size={15} strokeWidth={2} />
                          Log {def.label}
                        </span>
                      )}
                    </button>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-600 dark:text-rose-400">
          {error} —{' '}
          <button onClick={loadLogs} className="underline font-medium">retry</button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="rounded-2xl border border-border bg-card h-36 skeleton-shimmer" />
          ))}
        </div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {HABIT_DEFINITIONS.map((def) => {
            const state = habitStates[def.type];
            const Icon = def.icon;
            const pct = Math.min((state.todayValue / def.defaultTarget) * 100, 100);

            return (
              <motion.div
                key={def.type}
                variants={itemVariants}
                className={cn(
                  'rounded-2xl border bg-card p-5 transition-all duration-200',
                  state.completed ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border hover:border-primary/20'
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', def.bg)}>
                      <Icon size={18} strokeWidth={1.5} className={def.color} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold font-heading text-foreground">{def.label}</p>
                      <p className="text-xs text-muted-foreground">Target: {def.defaultTarget} {def.unit}</p>
                    </div>
                  </div>
                  {state.completed && (
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Check size={12} strokeWidth={2.5} className="text-white" />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <HabitRing value={state.todayValue} target={def.defaultTarget} fill={def.fill} size={48} />
                  <div>
                    <p className="text-lg font-700 font-heading text-foreground">
                      {state.todayValue > 0 ? `${state.todayValue}` : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">{def.unit} · {Math.round(pct)}%</p>
                  </div>
                </div>

                <button
                  onClick={() => { setLoggingType(def.type); setLogValue(''); }}
                  className={cn(
                    'w-full text-xs font-semibold font-heading py-2 rounded-xl transition-all duration-150',
                    state.completed
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20' :'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
                  )}
                >
                  {state.completed ? 'Update' : 'Log'}
                </button>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
