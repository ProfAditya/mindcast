'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Plus, X, Check, TrendingUp, Clock, Star, Zap, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';

interface SleepEntry {
  id: string;
  date: string;
  duration: number;
  quality: number;
  bedtime: string;
  wakeTime: string;
  notes?: string;
}

const QUALITY_OPTIONS = [
  { value: 1, label: 'Poor', emoji: '😴', color: 'rose' },
  { value: 2, label: 'Fair', emoji: '😐', color: 'amber' },
  { value: 3, label: 'Good', emoji: '🙂', color: 'sky' },
  { value: 4, label: 'Great', emoji: '😊', color: 'emerald' },
  { value: 5, label: 'Excellent', emoji: '🌟', color: 'violet' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card/95 backdrop-blur-sm px-3 py-2.5 shadow-lg text-xs">
      <p className="font-semibold font-heading text-foreground mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground capitalize">{p.name}:</span>
          <span className="font-semibold text-foreground">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const MOCK_SLEEP_DATA: SleepEntry[] = [
  { id: '1', date: 'Aug 1', duration: 7.5, quality: 4, bedtime: '23:00', wakeTime: '06:30' },
  { id: '2', date: 'Aug 2', duration: 6.0, quality: 2, bedtime: '00:30', wakeTime: '06:30' },
  { id: '3', date: 'Aug 3', duration: 8.0, quality: 5, bedtime: '22:30', wakeTime: '06:30' },
  { id: '4', date: 'Aug 4', duration: 7.0, quality: 3, bedtime: '23:30', wakeTime: '06:30' },
  { id: '5', date: 'Aug 5', duration: 8.5, quality: 5, bedtime: '22:00', wakeTime: '06:30' },
  { id: '6', date: 'Aug 6', duration: 6.5, quality: 3, bedtime: '00:00', wakeTime: '06:30' },
];

function getSleepScore(entries: SleepEntry[]): number {
  if (!entries.length) return 0;
  const avgDuration = entries.reduce((s, e) => s + e.duration, 0) / entries.length;
  const avgQuality = entries.reduce((s, e) => s + e.quality, 0) / entries.length;
  const durationScore = Math.min((avgDuration / 8) * 50, 50);
  const qualityScore = (avgQuality / 5) * 50;
  return Math.round(durationScore + qualityScore);
}

export default function SleepTrackerContent() {
  const [entries, setEntries] = useState<SleepEntry[]>(MOCK_SLEEP_DATA);
  const [showForm, setShowForm] = useState(false);
  const [duration, setDuration] = useState('7.5');
  const [quality, setQuality] = useState(3);
  const [bedtime, setBedtime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('06:30');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const sleepScore = getSleepScore(entries);
  const avgDuration = entries.length ? (entries.reduce((s, e) => s + e.duration, 0) / entries.length).toFixed(1) : '—';
  const avgQuality = entries.length ? (entries.reduce((s, e) => s + e.quality, 0) / entries.length).toFixed(1) : '—';
  const consistency = entries.length >= 3 ? 'Good' : 'Building';

  const chartData = entries.map((e) => ({
    date: e.date,
    duration: e.duration,
    quality: e.quality,
  }));

  const handleSubmit = () => {
    const dur = parseFloat(duration);
    if (!dur || dur <= 0 || dur > 24) {
      toast.error('Please enter a valid sleep duration');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      const now = new Date();
      const newEntry: SleepEntry = {
        id: Date.now().toString(),
        date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        duration: dur,
        quality,
        bedtime,
        wakeTime,
        notes: notes.trim() || undefined,
      };
      setEntries((prev) => [newEntry, ...prev]);
      setShowForm(false);
      setDuration('7.5');
      setQuality(3);
      setBedtime('23:00');
      setWakeTime('06:30');
      setNotes('');
      setSubmitting(false);
      toast.success('Sleep logged successfully!');
    }, 600);
  };

  const scoreColor = sleepScore >= 80 ? 'text-emerald-500' : sleepScore >= 60 ? 'text-amber-500' : 'text-rose-500';
  const scoreLabel = sleepScore >= 80 ? 'Excellent' : sleepScore >= 60 ? 'Good' : 'Needs Work';

  return (
    <div className="px-5 lg:px-8 xl:px-10 py-7 pb-24 lg:pb-8 max-w-screen-xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-7 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Moon size={20} strokeWidth={1.5} className="text-primary" />
            <h1 className="font-heading font-bold text-2xl lg:text-3xl text-foreground tracking-tight">Sleep Tracker</h1>
          </div>
          <p className="text-muted-foreground text-sm">Track your sleep quality and build consistent rest habits.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
          <Plus size={15} strokeWidth={1.5} />
          Log Sleep
        </button>
      </motion.div>

      {/* Log Sleep Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="w-full max-w-md rounded-3xl bg-card border border-border p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                    <Moon size={18} strokeWidth={1.5} className="text-indigo-500" />
                  </div>
                  <h2 className="font-heading font-semibold text-base text-foreground">Log Last Night's Sleep</h2>
                </div>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl text-muted-foreground hover:bg-muted transition-colors">
                  <X size={16} strokeWidth={1.5} />
                </button>
              </div>

              <div className="space-y-4 mb-5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold font-heading text-muted-foreground uppercase tracking-wider mb-1.5 block">Bedtime</label>
                    <input type="time" value={bedtime} onChange={(e) => setBedtime(e.target.value)} className="input-field text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold font-heading text-muted-foreground uppercase tracking-wider mb-1.5 block">Wake Time</label>
                    <input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} className="input-field text-sm" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold font-heading text-muted-foreground uppercase tracking-wider mb-1.5 block">Duration (hours)</label>
                  <input
                    type="number" value={duration} onChange={(e) => setDuration(e.target.value)}
                    min="0" max="24" step="0.5" placeholder="e.g. 7.5"
                    className="input-field text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold font-heading text-muted-foreground uppercase tracking-wider mb-2 block">Sleep Quality</label>
                  <div className="grid grid-cols-5 gap-2">
                    {QUALITY_OPTIONS.map((q) => (
                      <button
                        key={q.value}
                        onClick={() => setQuality(q.value)}
                        className={cn(
                          'flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all',
                          quality === q.value
                            ? `border-${q.color}-400 bg-${q.color}-500/10`
                            : 'border-border hover:border-muted-foreground/30'
                        )}
                      >
                        <span className="text-lg">{q.emoji}</span>
                        <span className="text-[10px] font-medium text-muted-foreground">{q.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold font-heading text-muted-foreground uppercase tracking-wider mb-1.5 block">Notes (optional)</label>
                  <textarea
                    value={notes} onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any dreams, disturbances, or notes..."
                    rows={2} className="input-field resize-none text-sm"
                  />
                </div>
              </div>

              <button onClick={handleSubmit} disabled={submitting} className="btn-primary w-full justify-center">
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Check size={15} strokeWidth={2} />
                    Log Sleep
                  </span>
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-5">
        {/* Score Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-3">
              <Star size={18} strokeWidth={1.5} className="text-indigo-500" />
            </div>
            <p className={cn('text-2xl font-bold font-heading', scoreColor)}>{sleepScore}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Sleep Score · {scoreLabel}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center mb-3">
              <Clock size={18} strokeWidth={1.5} className="text-sky-500" />
            </div>
            <p className="text-2xl font-bold font-heading text-foreground">{avgDuration}h</p>
            <p className="text-xs text-muted-foreground mt-0.5">Avg Duration</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center mb-3">
              <Zap size={18} strokeWidth={1.5} className="text-violet-500" />
            </div>
            <p className="text-2xl font-bold font-heading text-foreground">{avgQuality}/5</p>
            <p className="text-xs text-muted-foreground mt-0.5">Avg Quality</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3">
              <TrendingUp size={18} strokeWidth={1.5} className="text-emerald-500" />
            </div>
            <p className="text-2xl font-bold font-heading text-foreground">{consistency}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Consistency</p>
          </div>
        </motion.div>

        {/* Sleep Trend Chart */}
        <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-heading font-semibold text-base text-foreground">Sleep Trend</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Duration and quality over time</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-indigo-400 inline-block" />Duration (hrs)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-violet-400 inline-block" />Quality</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="durationGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818CF8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#818CF8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="qualityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#A78BFA" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="duration" stroke="#818CF8" strokeWidth={2} fill="url(#durationGrad)" dot={false} />
              <Area type="monotone" dataKey="quality" stroke="#A78BFA" strokeWidth={2} fill="url(#qualityGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* AI Recommendations */}
        <motion.div variants={itemVariants} className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 flex items-center justify-center">
              <Moon size={15} strokeWidth={1.5} className="text-indigo-500" />
            </div>
            <h3 className="font-heading font-semibold text-base text-foreground">MIRA Sleep Insights</h3>
          </div>
          <div className="space-y-2.5">
            {[
              'Your best sleep nights correlate with consistent bedtimes before 23:00.',
              'Try avoiding screens 30 minutes before bed to improve sleep quality.',
              'A 7-day streak of 7.5+ hours would significantly boost your wellness score.',
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                <ChevronRight size={14} strokeWidth={2} className="text-indigo-400 shrink-0 mt-0.5" />
                {tip}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Entries */}
        <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-heading font-semibold text-base text-foreground mb-4">Recent Sleep Log</h3>
          <div className="space-y-3">
            {entries.slice(0, 7).map((entry) => {
              const q = QUALITY_OPTIONS.find((o) => o.value === entry.quality);
              return (
                <div key={entry.id} className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border border-border">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{q?.emoji ?? '😴'}</span>
                    <div>
                      <p className="text-sm font-semibold font-heading text-foreground">{entry.date}</p>
                      <p className="text-xs text-muted-foreground">{entry.bedtime} → {entry.wakeTime}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold font-heading text-foreground">{entry.duration}h</p>
                    <p className="text-xs text-muted-foreground">{q?.label ?? 'Unknown'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
