'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile, Zap, Wind, Plus, TrendingUp, Calendar, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { moodApi, type MoodEntry, type MoodEntryCreate } from '@/lib/api';
import { mockMoodTrend } from '@/lib/mockData';
import { ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Area, AreaChart } from 'recharts';
import Icon from '@/components/ui/AppIcon';


const MOOD_OPTIONS = [
  { value: 'great', label: 'Great', emoji: '😄', color: 'emerald', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-700' },
  { value: 'good', label: 'Good', emoji: '🙂', color: 'sky', bg: 'bg-sky-100 dark:bg-sky-900/30', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-300 dark:border-sky-700' },
  { value: 'okay', label: 'Okay', emoji: '😐', color: 'amber', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-700' },
  { value: 'low', label: 'Low', emoji: '😔', color: 'rose', bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-300 dark:border-rose-700' },
  { value: 'rough', label: 'Rough', emoji: '😞', color: 'violet', bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-300 dark:border-violet-700' },
];

const TAGS = ['anxious', 'calm', 'focused', 'tired', 'motivated', 'grateful', 'overwhelmed', 'hopeful', 'lonely', 'connected'];

const moodToNum: Record<string, number> = { great: 5, good: 4, okay: 3, low: 2, rough: 1 };

function SliderInput({ label, icon: Icon, value, onChange, min = 1, max = 10, color }: {
  label: string; icon: React.ElementType; value: number; onChange: (v: number) => void;
  min?: number; max?: number; color: string;
}) {
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
        className={cn('w-full h-2 rounded-full appearance-none cursor-pointer', `accent-${color}-500`)}
        style={{ background: `linear-gradient(to right, var(--wellness-${color === 'sky' ? 'sky' : color === 'rose' ? 'rose' : 'violet'}) ${(value - min) / (max - min) * 100}%, var(--muted) ${(value - min) / (max - min) * 100}%)` }}
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
  const [showLogForm, setShowLogForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedMood, setSelectedMood] = useState('');
  const [energy, setEnergy] = useState(5);
  const [stress, setStress] = useState(5);
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const data = await moodApi.list(30);
      setEntries(data);
    } catch {
      // fallback to mock data
      const mockEntries: MoodEntry[] = mockMoodTrend.map((d, i) => ({
        id: `mock-${i}`,
        user_id: 'user-001',
        mood: d.mood,
        energy: d.energy,
        stress: d.stress,
        created_at: new Date(Date.now() - (13 - i) * 86400000).toISOString(),
      }));
      setEntries(mockEntries);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const handleSubmit = async () => {
    if (!selectedMood) return;
    setSubmitting(true);
    const payload: MoodEntryCreate = {
      mood: selectedMood,
      energy,
      stress,
      notes: notes.trim() || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
    };
    try {
      const newEntry = await moodApi.create(payload);
      setEntries((prev) => [newEntry, ...prev]);
    } catch {
      // optimistic update
      const optimistic: MoodEntry = {
        id: `local-${Date.now()}`,
        user_id: 'user-001',
        ...payload,
        created_at: new Date().toISOString(),
      };
      setEntries((prev) => [optimistic, ...prev]);
    } finally {
      setSubmitting(false);
      setShowLogForm(false);
      setSelectedMood('');
      setEnergy(5);
      setStress(5);
      setNotes('');
      setSelectedTags([]);
    }
  };

  const chartData = entries.slice(0, 14).reverse().map((e) => ({
    date: new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    energy: e.energy,
    stress: e.stress,
    mood: moodToNum[e.mood] ?? 3,
  }));

  const avgEnergy = entries.length > 0 ? (entries.reduce((s, e) => s + e.energy, 0) / entries.length).toFixed(1) : '—';
  const avgStress = entries.length > 0 ? (entries.reduce((s, e) => s + e.stress, 0) / entries.length).toFixed(1) : '—';
  const dominantMood = entries.length > 0
    ? Object.entries(entries.reduce((acc, e) => { acc[e.mood] = (acc[e.mood] || 0) + 1; return acc; }, {} as Record<string, number>))
        .sort((a, b) => b[1] - a[1])[0]?.[0]
    : 'good';

  const dominantMoodOption = MOOD_OPTIONS.find((m) => m.value === dominantMood) ?? MOOD_OPTIONS[1];

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

              {/* Tags */}
              <div className="mb-5">
                <p className="text-xs font-medium font-heading text-muted-foreground uppercase tracking-wider mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])}
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-medium transition-all duration-150',
                        selectedTags.includes(tag)
                          ? 'bg-primary/15 text-primary border border-primary/30' :'bg-muted text-muted-foreground border border-transparent hover:border-border'
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any thoughts or context? (optional)"
                rows={2}
                className="input-field resize-none mb-5 text-sm"
              />

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
                    <Check size={15} strokeWidth={1.5} /> Save Check-in
                  </span>
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        {/* Stats Row */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Check-ins', value: entries.length, icon: Calendar, color: 'violet' },
            { label: 'Avg Energy', value: avgEnergy, icon: Zap, color: 'sky' },
            { label: 'Avg Stress', value: avgStress, icon: Wind, color: 'rose' },
            { label: 'Dominant Mood', value: dominantMoodOption.emoji + ' ' + dominantMoodOption.label, icon: Smile, color: 'emerald' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-card border border-border p-4 card-shadow">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon size={14} strokeWidth={1.5} className={`text-${stat.color}-500`} />
                <span className="text-xs font-medium font-heading text-muted-foreground uppercase tracking-wider">{stat.label}</span>
              </div>
              <p className="font-heading font-semibold text-xl text-foreground">{stat.value}</p>
            </div>
          ))}
        </motion.div>

        {/* Chart */}
        <motion.div variants={itemVariants} className="rounded-3xl bg-card border border-border p-6 card-shadow">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={16} strokeWidth={1.5} className="text-primary" />
            <h3 className="font-heading font-semibold text-sm text-foreground">14-Day Trend</h3>
          </div>
          {loading ? (
            <div className="h-48 skeleton-shimmer rounded-2xl" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
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
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '12px' }}
                  labelStyle={{ color: 'var(--foreground)', fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="energy" stroke="#0EA5E9" strokeWidth={2} fill="url(#energyGrad)" name="Energy" dot={false} />
                <Area type="monotone" dataKey="stress" stroke="#FB7185" strokeWidth={2} fill="url(#stressGrad)" name="Stress" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-sky-400 rounded-full" /><span className="text-xs text-muted-foreground">Energy</span></div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-rose-400 rounded-full" /><span className="text-xs text-muted-foreground">Stress</span></div>
          </div>
        </motion.div>

        {/* Recent Entries */}
        <motion.div variants={itemVariants} className="rounded-3xl bg-card border border-border p-6 card-shadow">
          <div className="flex items-center gap-2 mb-5">
            <Calendar size={16} strokeWidth={1.5} className="text-primary" />
            <h3 className="font-heading font-semibold text-sm text-foreground">Recent Check-ins</h3>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-14 skeleton-shimmer rounded-xl" />)}
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-10">
              <Smile size={32} strokeWidth={1} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No check-ins yet. Log your first mood above.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.slice(0, 10).map((entry) => {
                const moodOpt = MOOD_OPTIONS.find((m) => m.value === entry.mood) ?? MOOD_OPTIONS[1];
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-4 p-3 rounded-2xl hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-2xl">{moodOpt.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn('text-sm font-semibold font-heading', moodOpt.text)}>{moodOpt.label}</span>
                        {entry.tags?.map((tag) => (
                          <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{tag}</span>
                        ))}
                      </div>
                      {entry.notes && <p className="text-xs text-muted-foreground truncate mt-0.5">{entry.notes}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Zap size={10} />{entry.energy}</span>
                        <span className="flex items-center gap-1"><Wind size={10} />{entry.stress}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
