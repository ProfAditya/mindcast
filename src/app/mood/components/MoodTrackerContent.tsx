'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile, Zap, Wind, Plus, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { moodApi, type MoodEntry, type MoodEntryCreate } from '@/lib/api';
import { ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Area, AreaChart } from 'recharts';
import Icon from '@/components/ui/AppIcon';


const MOOD_OPTIONS = [
  { value: 'great', label: 'Great', emoji: '😄', color: 'emerald', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-700' },
  { value: 'good', label: 'Good', emoji: '🙂', color: 'sky', bg: 'bg-sky-100 dark:bg-sky-900/30', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-300 dark:border-sky-700' },
  { value: 'okay', label: 'Okay', emoji: '😐', color: 'amber', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-700' },
  { value: 'low', label: 'Low', emoji: '😔', color: 'rose', bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-300 dark:border-rose-700' },
  { value: 'rough', label: 'Rough', emoji: '😞', color: 'violet', bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-300 dark:border-violet-700' },
];

const moodToNum: Record<string, number> = { great: 5, good: 4, okay: 3, low: 2, rough: 1 };

function SliderInput({ label, icon: IconComp, value, onChange, min = 1, max = 10, color }: {
  label: string; icon: React.ElementType; value: number; onChange: (v: number) => void;
  min?: number; max?: number; color: string;
}) {
  const Icon = IconComp as React.ElementType;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={15} strokeWidth={1.5} className={`text-${color}-500`} />
          <span className="text-sm font-medium font-heading text-foreground">{label}</span>
        </div>
        <span className={`text-sm font-semibold font-heading text-${color}-600 dark:text-${color}-400`}>{value}/10</span>
      </div>
      <input
        type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
      />
    </div>
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

export default function MoodTrackerContent() {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLogForm, setShowLogForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form state
  const [selectedMood, setSelectedMood] = useState('');
  const [energy, setEnergy] = useState(5);
  const [stress, setStress] = useState(5);
  const [notes, setNotes] = useState('');

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await moodApi.list(30);
      setEntries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load mood entries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const handleSubmit = async () => {
    if (!selectedMood) return;
    setSubmitting(true);
    setSubmitError(null);
    const payload: MoodEntryCreate = {
      mood: selectedMood,
      energy_level: energy,
      stress_level: stress,
      notes: notes.trim() || undefined,
    };
    try {
      const newEntry = await moodApi.create(payload);
      setEntries((prev) => [newEntry, ...prev]);
      setShowLogForm(false);
      setSelectedMood('');
      setEnergy(5);
      setStress(5);
      setNotes('');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save mood entry');
    } finally {
      setSubmitting(false);
    }
  };

  const chartData = entries.slice(0, 14).reverse().map((e) => ({
    date: new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    energy: e.energy_level,
    stress: e.stress_level,
    mood: moodToNum[e.mood] ?? 3,
  }));

  const avgEnergy = entries.length > 0 ? (entries.reduce((s, e) => s + (e.energy_level ?? 0), 0) / entries.length).toFixed(1) : '—';
  const avgStress = entries.length > 0 ? (entries.reduce((s, e) => s + (e.stress_level ?? 0), 0) / entries.length).toFixed(1) : '—';
  const dominantMood = entries.length > 0
    ? Object.entries(entries.reduce((acc, e) => { acc[e.mood] = (acc[e.mood] || 0) + 1; return acc; }, {} as Record<string, number>))
        .sort((a, b) => b[1] - a[1])[0]?.[0]
    : null;

  const dominantMoodOption = MOOD_OPTIONS.find((m) => m.value === dominantMood) ?? null;

  return (
    <div className="px-6 lg:px-8 xl:px-10 py-8 pb-24 lg:pb-8 max-w-screen-xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-heading font-semibold text-2xl text-foreground">Mood Tracker</h1>
          <p className="text-muted-foreground mt-1 text-sm">Track how you feel — patterns reveal your path.</p>
        </div>
        <button
          onClick={() => setShowLogForm(true)}
          className="btn-primary text-sm"
          data-testid="log-mood-btn"
        >
          <Plus size={15} strokeWidth={1.5} />
          Log Mood
        </button>
      </motion.div>

      {/* Log Mood Modal */}
      <AnimatePresence>
        {showLogForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowLogForm(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full max-w-lg rounded-3xl bg-card border border-border p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading font-semibold text-lg text-foreground">How are you feeling?</h2>
                <button onClick={() => setShowLogForm(false)} className="p-2 rounded-xl text-muted-foreground hover:bg-muted transition-colors">
                  <X size={16} strokeWidth={1.5} />
                </button>
              </div>

              {/* Mood Selection */}
              <div className="grid grid-cols-5 gap-2 mb-6">
                {MOOD_OPTIONS.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setSelectedMood(m.value)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all duration-150',
                      selectedMood === m.value
                        ? `${m.bg} ${m.border} scale-105`
                        : 'border-border hover:border-muted-foreground/30 hover:bg-muted'
                    )}
                  >
                    <span className="text-2xl">{m.emoji}</span>
                    <span className={cn('text-xs font-medium font-heading', selectedMood === m.value ? m.text : 'text-muted-foreground')}>{m.label}</span>
                  </button>
                ))}
              </div>

              {/* Sliders */}
              <div className="space-y-4 mb-5">
                <SliderInput label="Energy" icon={Zap} value={energy} onChange={setEnergy} color="sky" />
                <SliderInput label="Stress" icon={Wind} value={stress} onChange={setStress} color="rose" />
              </div>

              {/* Notes */}
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any thoughts or context? (optional)"
                rows={2}
                className="input-field resize-none mb-5 text-sm"
              />

              {submitError && (
                <p className="text-xs text-rose-500 mb-3">{submitError}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={!selectedMood || submitting}
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
                    Save Entry
                  </span>
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      {error && (
        <div className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-600 dark:text-rose-400">
          {error} —{' '}
          <button onClick={loadEntries} className="underline font-medium">retry</button>
        </div>
      )}

      {/* Summary Cards */}
      {!loading && !error && (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-5">
          <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl border border-border bg-card p-4 text-center">
              <p className="text-2xl font-700 font-heading text-foreground">{entries.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Check-ins</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 text-center">
              <p className="text-2xl font-700 font-heading text-foreground">{avgEnergy}</p>
              <p className="text-xs text-muted-foreground mt-1">Avg Energy</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 text-center">
              {dominantMoodOption ? (
                <>
                  <p className="text-2xl">{dominantMoodOption.emoji}</p>
                  <p className="text-xs text-muted-foreground mt-1">Top Mood</p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-700 font-heading text-foreground">—</p>
                  <p className="text-xs text-muted-foreground mt-1">Top Mood</p>
                </>
              )}
            </div>
          </motion.div>

          {/* Chart */}
          {chartData.length > 0 && (
            <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-heading font-semibold text-base text-foreground mb-4">Energy & Stress Trend</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="stressGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FB7185" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#FB7185" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} interval={2} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} domain={[0, 10]} />
                  <Tooltip
                    contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="energy" stroke="#0EA5E9" strokeWidth={2} fill="url(#energyGrad)" dot={false} />
                  <Area type="monotone" dataKey="stress" stroke="#FB7185" strokeWidth={2} fill="url(#stressGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Entry List */}
          <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-heading font-semibold text-base text-foreground mb-4">Recent Entries</h3>
            {entries.length === 0 ? (
              <div className="text-center py-10">
                <Smile size={32} strokeWidth={1} className="text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No mood entries yet.</p>
                <p className="text-xs text-muted-foreground mt-1">Tap &quot;Log Mood&quot; to start tracking.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {entries.slice(0, 10).map((entry) => {
                  const moodOpt = MOOD_OPTIONS.find((m) => m.value === entry.mood);
                  return (
                    <div key={entry.id} className="flex items-center gap-4 py-3 border-b border-border last:border-0">
                      <span className="text-xl">{moodOpt?.emoji ?? '😐'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold font-heading text-foreground capitalize">{entry.mood}</span>
                          <span className="text-xs text-muted-foreground">· E: {entry.energy_level}/10 · S: {entry.stress_level}/10</span>
                        </div>
                        {entry.notes && <p className="text-xs text-muted-foreground truncate mt-0.5">{entry.notes}</p>}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}

      {loading && (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-border bg-card h-32 skeleton-shimmer" />
          ))}
        </div>
      )}
    </div>
  );
}
