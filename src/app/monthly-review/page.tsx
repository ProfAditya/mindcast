'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Cell,
} from 'recharts';
import { Calendar, TrendingUp, TrendingDown, BookOpen, Activity, Heart, Brain, Zap, Target, Sparkles, ChevronUp, ChevronDown, Minus, Download, RefreshCw, CheckCircle2, AlertCircle, Star,  } from 'lucide-react';
import { cn } from '@/lib/utils';
import AppLayout from '@/components/AppLayout';
import { monthlyReviewApi, moodApi, dashboardApi, type DashboardStats, type MoodEntry } from '@/lib/api';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
};

// ─── Mock / Fallback Data ────────────────────────────────────────────────────

const MOCK_MOOD_TREND = [
  { date: 'Jul 8', energy: 6, stress: 5, mood: 'good' },
  { date: 'Jul 10', energy: 7, stress: 4, mood: 'great' },
  { date: 'Jul 12', energy: 5, stress: 6, mood: 'okay' },
  { date: 'Jul 14', energy: 8, stress: 3, mood: 'great' },
  { date: 'Jul 16', energy: 6, stress: 5, mood: 'good' },
  { date: 'Jul 18', energy: 4, stress: 7, mood: 'low' },
  { date: 'Jul 20', energy: 7, stress: 4, mood: 'good' },
  { date: 'Jul 22', energy: 8, stress: 3, mood: 'great' },
  { date: 'Jul 24', energy: 7, stress: 4, mood: 'good' },
  { date: 'Jul 26', energy: 6, stress: 5, mood: 'good' },
  { date: 'Jul 28', energy: 5, stress: 6, mood: 'okay' },
  { date: 'Jul 30', energy: 8, stress: 3, mood: 'great' },
  { date: 'Aug 1', energy: 7, stress: 4, mood: 'good' },
  { date: 'Aug 3', energy: 9, stress: 2, mood: 'great' },
  { date: 'Aug 5', energy: 8, stress: 3, mood: 'great' },
];

const MOCK_HABIT_STATS = [
  { name: 'Sleep', completed: 26, total: 31, color: '#38bdf8', icon: '🌙' },
  { name: 'Meditation', completed: 18, total: 31, color: '#a78bfa', icon: '🧘' },
  { name: 'Exercise', completed: 22, total: 31, color: '#34d399', icon: '💪' },
  { name: 'Hydration', completed: 29, total: 31, color: '#22d3ee', icon: '💧' },
  { name: 'Journaling', completed: 14, total: 31, color: '#fb923c', icon: '📓' },
  { name: 'Reading', completed: 20, total: 31, color: '#f472b6', icon: '📚' },
];

const MOCK_PRODUCTIVITY_TREND = [
  { week: 'Week 1', tasks: 12, goals: 3, focus: 68 },
  { week: 'Week 2', tasks: 18, goals: 4, focus: 74 },
  { week: 'Week 3', tasks: 15, goals: 3, focus: 71 },
  { week: 'Week 4', tasks: 22, goals: 5, focus: 82 },
];

const MOCK_WELLNESS_RADAR = [
  { subject: 'Sleep', value: 84, fullMark: 100 },
  { subject: 'Stress', value: 72, fullMark: 100 },
  { subject: 'Mood', value: 78, fullMark: 100 },
  { subject: 'Energy', value: 80, fullMark: 100 },
  { subject: 'Focus', value: 74, fullMark: 100 },
  { subject: 'Social', value: 65, fullMark: 100 },
];

const MOCK_SCORE_HISTORY = [
  { month: 'Mar', score: 62 },
  { month: 'Apr', score: 67 },
  { month: 'May', score: 71 },
  { month: 'Jun', score: 74 },
  { month: 'Jul', score: 79 },
  { month: 'Aug', score: 84 },
];

const MOCK_MOOD_DISTRIBUTION = [
  { mood: 'Great', count: 9, color: '#34d399' },
  { mood: 'Good', count: 12, color: '#38bdf8' },
  { mood: 'Okay', count: 6, color: '#fbbf24' },
  { mood: 'Low', count: 3, color: '#fb923c' },
  { mood: 'Stressed', count: 1, color: '#f87171' },
];

const MOCK_MIRA_RECOMMENDATIONS = [
  {
    id: 1,
    category: 'Sleep',
    priority: 'high',
    icon: '🌙',
    title: 'Strengthen your sleep anchor',
    insight: 'Your sleep consistency improved 18% this month — your best streak was 9 consecutive nights of 7+ hours. Keep your bedtime within a 30-minute window to lock in this gain.',
    action: 'Set a consistent wind-down alarm at 10:00 PM for the next 2 weeks.',
  },
  {
    id: 2,
    category: 'Stress',
    priority: 'medium',
    icon: '🧘',
    title: 'Meditation gap on high-stress days',
    insight: 'On the 3 days your stress score exceeded 7, you skipped meditation. That correlation is clear. A 5-minute session on difficult mornings could act as a circuit breaker.',
    action: 'Add a "stress day" micro-meditation (5 min) to your morning routine.',
  },
  {
    id: 3,
    category: 'Energy',
    priority: 'medium',
    icon: '⚡',
    title: 'Exercise is your energy multiplier',
    insight: 'Days with exercise logged showed an average energy score of 7.8 vs 5.4 on rest days — a 44% lift. You exercised 22 out of 31 days, which is excellent.',
    action: 'Aim for 25 exercise days next month to push your average energy above 7.5.',
  },
  {
    id: 4,
    category: 'Journaling',
    priority: 'low',
    icon: '📓',
    title: 'Journal frequency dipped mid-month',
    insight: 'You journaled 14 days this month — strong in weeks 1 and 4, but only 2 entries in week 3. Journaling correlates with your highest mood scores (+0.8 avg).',
    action: 'Try a 3-sentence minimum entry on busy days to maintain the habit.',
  },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card/95 backdrop-blur-sm px-3 py-2.5 shadow-card-md text-xs">
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

function TrendBadge({ value, suffix = '' }: { value: number; suffix?: string }) {
  if (value > 0)
    return (
      <span className="inline-flex items-center gap-0.5 text-emerald-500 text-xs font-semibold">
        <ChevronUp size={13} strokeWidth={2.5} />
        {value}
        {suffix}
      </span>
    );
  if (value < 0)
    return (
      <span className="inline-flex items-center gap-0.5 text-rose-500 text-xs font-semibold">
        <ChevronDown size={13} strokeWidth={2.5} />
        {Math.abs(value)}
        {suffix}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-0.5 text-muted-foreground text-xs font-semibold">
      <Minus size={13} strokeWidth={2.5} />
      No change
    </span>
  );
}

function PriorityDot({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    high: 'bg-rose-500',
    medium: 'bg-amber-500',
    low: 'bg-emerald-500',
  };
  return <span className={cn('w-2 h-2 rounded-full shrink-0 mt-1', map[priority] ?? 'bg-muted')} />;
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function MonthlyReviewPage() {
  const [monthLabel, setMonthLabel] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data state — backend-first, fallback to mock
  const [moodTrend, setMoodTrend] = useState(MOCK_MOOD_TREND);
  const [wellnessScore, setWellnessScore] = useState(84);
  const [prevScore, setPrevScore] = useState(79);
  const [avgEnergy, setAvgEnergy] = useState(6.8);
  const [avgStress, setAvgStress] = useState(4.2);
  const [journalCount, setJournalCount] = useState(14);
  const [moodCheckIns, setMoodCheckIns] = useState(31);
  const [habitsLogged, setHabitsLogged] = useState(109);
  const [activeTab, setActiveTab] = useState<'overview' | 'mood' | 'habits' | 'productivity' | 'mira'>('overview');

  useEffect(() => {
    const now = new Date();
    setMonthLabel(now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [reviewResult, moodResult, statsResult] = await Promise.allSettled([
          monthlyReviewApi.get(),
          moodApi.list(31),
          dashboardApi.getStats(),
        ]);

        if (reviewResult.status === 'fulfilled' && reviewResult.value) {
          const d = reviewResult.value as Record<string, unknown>;
          if (typeof d.wellness_score === 'number') setWellnessScore(d.wellness_score);
          if (typeof d.avg_energy_30d === 'number') setAvgEnergy(d.avg_energy_30d);
          if (typeof d.avg_stress_30d === 'number') setAvgStress(d.avg_stress_30d);
          if (typeof d.journal_entries_count === 'number') setJournalCount(d.journal_entries_count);
          if (typeof d.mood_check_ins_30d === 'number') setMoodCheckIns(d.mood_check_ins_30d);
          if (typeof d.habits_logged_today === 'number') setHabitsLogged(d.habits_logged_today);
        }

        if (moodResult.status === 'fulfilled' && Array.isArray(moodResult.value) && moodResult.value.length > 0) {
          const sorted = [...moodResult.value].sort(
            (a: MoodEntry, b: MoodEntry) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          setMoodTrend(
            sorted.map((e: MoodEntry) => ({
              date: new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              energy: e.energy_level ?? 5,
              stress: e.stress_level ?? 5,
              mood: e.mood ?? 'okay',
            }))
          );
        }

        if (statsResult.status === 'fulfilled' && statsResult.value) {
          const s = statsResult.value as DashboardStats;
          if (s.wellness_score) setWellnessScore(s.wellness_score);
          if (s.avg_energy_30d) setAvgEnergy(s.avg_energy_30d);
          if (s.avg_stress_30d) setAvgStress(s.avg_stress_30d);
        }
      } catch {
        // silently fall back to mock data
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const scoreDelta = wellnessScore - prevScore;
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'mood', label: 'Mood' },
    { id: 'habits', label: 'Habits' },
    { id: 'productivity', label: 'Productivity' },
    { id: 'mira', label: 'MIRA Insights' },
  ] as const;

  return (
    <AppLayout>
      <div className="px-5 lg:px-8 xl:px-10 py-7 pb-24 lg:pb-10 max-w-screen-xl mx-auto">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={20} strokeWidth={1.5} className="text-primary" />
              <h1 className="font-heading font-700 text-2xl lg:text-3xl text-foreground tracking-tight">
                Monthly Review
              </h1>
            </div>
            <p className="text-muted-foreground text-sm">
              {monthLabel ? `Your 30-day wellness snapshot — ${monthLabel}` : 'Your 30-day wellness snapshot'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted/70 hover:text-foreground border border-border transition-all"
            >
              <RefreshCw size={13} strokeWidth={1.8} />
              Refresh
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-all">
              <Download size={13} strokeWidth={1.8} />
              Export PDF
            </button>
          </div>
        </motion.div>

        {/* ── Tabs ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-1.5 overflow-x-auto pb-1 mb-6 scrollbar-none"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150',
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground border border-border'
              )}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        {loading && (
          <div className="space-y-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-2xl border border-border bg-card h-40 animate-pulse opacity-50" />
            ))}
          </div>
        )}

        {!loading && (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-5">

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* OVERVIEW TAB                                                   */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {activeTab === 'overview' && (
              <>
                {/* KPI Strip */}
                <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      label: 'Wellness Score',
                      value: wellnessScore,
                      suffix: '/100',
                      delta: scoreDelta,
                      icon: Brain,
                      color: 'violet',
                      bg: 'bg-violet-500/10',
                      text: 'text-violet-500',
                    },
                    {
                      label: 'Avg Energy',
                      value: avgEnergy.toFixed(1),
                      suffix: '/10',
                      delta: 0.4,
                      icon: Zap,
                      color: 'amber',
                      bg: 'bg-amber-500/10',
                      text: 'text-amber-500',
                    },
                    {
                      label: 'Avg Stress',
                      value: avgStress.toFixed(1),
                      suffix: '/10',
                      delta: -0.6,
                      icon: Activity,
                      color: 'rose',
                      bg: 'bg-rose-500/10',
                      text: 'text-rose-500',
                    },
                    {
                      label: 'Mood Check-ins',
                      value: moodCheckIns,
                      suffix: ' days',
                      delta: 4,
                      icon: Heart,
                      color: 'pink',
                      bg: 'bg-pink-500/10',
                      text: 'text-pink-500',
                    },
                  ].map((card) => {
                    const CardIcon = card.icon;
                    return (
                      <div key={card.label} className="rounded-2xl border border-border bg-card p-5 space-y-3">
                        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', card.bg)}>
                          <CardIcon size={16} strokeWidth={1.5} className={card.text} />
                        </div>
                        <div>
                          <p className="text-2xl font-700 font-heading text-foreground leading-none">
                            {card.value}
                            <span className="text-sm text-muted-foreground font-normal">{card.suffix}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
                        </div>
                        <TrendBadge value={card.delta} />
                      </div>
                    );
                  })}
                </motion.div>

                {/* Secondary Stats */}
                <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { label: 'Journal Entries', value: journalCount, icon: BookOpen, sub: 'This month', color: 'text-sky-500', bg: 'bg-sky-500/10' },
                    { label: 'Habits Completed', value: habitsLogged, icon: CheckCircle2, sub: 'Total completions', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'Streak Days', value: 12, icon: Star, sub: 'Current streak', color: 'text-orange-500', bg: 'bg-orange-500/10' },
                  ].map((s) => {
                    const SIcon = s.icon;
                    return (
                      <div key={s.label} className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4">
                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', s.bg)}>
                          <SIcon size={18} strokeWidth={1.5} className={s.color} />
                        </div>
                        <div>
                          <p className="text-xl font-700 font-heading text-foreground">{s.value}</p>
                          <p className="text-xs text-muted-foreground">{s.label}</p>
                          <p className="text-[11px] text-muted-foreground/60">{s.sub}</p>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>

                {/* Wellness Score History */}
                <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-heading font-700 text-base text-foreground">Wellness Score Trend</h3>
                    <span className="text-xs text-muted-foreground">6-month view</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-5">Your composite wellness score over the past 6 months</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={MOCK_SCORE_HISTORY} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                      <defs>
                        <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} domain={[50, 100]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#scoreGrad)" dot={{ fill: '#8b5cf6', r: 4, strokeWidth: 0 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </motion.div>

                {/* Wellness Radar */}
                <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="rounded-2xl border border-border bg-card p-6">
                    <h3 className="font-heading font-700 text-base text-foreground mb-1">Wellness Dimensions</h3>
                    <p className="text-xs text-muted-foreground mb-4">Balanced view across 6 key wellness areas</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <RadarChart data={MOCK_WELLNESS_RADAR}>
                        <PolarGrid stroke="var(--border)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                        <Radar name="Score" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between">
                    <div>
                      <h3 className="font-heading font-700 text-base text-foreground mb-1">Month Highlights</h3>
                      <p className="text-xs text-muted-foreground mb-4">Key wins and areas to watch</p>
                    </div>
                    <div className="space-y-3">
                      {[
                        { type: 'win', text: 'Wellness score up +5 pts from last month' },
                        { type: 'win', text: 'Hydration habit completed 29/31 days' },
                        { type: 'win', text: 'Lowest average stress score in 3 months' },
                        { type: 'watch', text: 'Journaling frequency dropped in week 3' },
                        { type: 'watch', text: 'Social wellness dimension below 70' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          {item.type === 'win' ? (
                            <CheckCircle2 size={14} strokeWidth={2} className="text-emerald-500 shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle size={14} strokeWidth={2} className="text-amber-500 shrink-0 mt-0.5" />
                          )}
                          <p className="text-xs text-foreground/80">{item.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </>
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* MOOD TAB                                                       */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {activeTab === 'mood' && (
              <>
                {/* Mood KPIs */}
                <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Dominant Mood', value: 'Good', icon: '😊', sub: '12 of 31 days' },
                    { label: 'Avg Energy', value: `${avgEnergy.toFixed(1)}/10`, icon: '⚡', sub: '+0.4 vs last month' },
                    { label: 'Avg Stress', value: `${avgStress.toFixed(1)}/10`, icon: '🌊', sub: '−0.6 vs last month' },
                    { label: 'Best Day', value: 'Aug 3', icon: '🌟', sub: 'Energy 9, Stress 2' },
                  ].map((card) => (
                    <div key={card.label} className="rounded-2xl border border-border bg-card p-5 space-y-2">
                      <span className="text-2xl">{card.icon}</span>
                      <p className="text-xl font-700 font-heading text-foreground">{card.value}</p>
                      <p className="text-xs text-muted-foreground">{card.label}</p>
                      <p className="text-[11px] text-muted-foreground/60">{card.sub}</p>
                    </div>
                  ))}
                </motion.div>

                {/* Energy & Stress Trend */}
                <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="font-heading font-700 text-base text-foreground mb-1">Energy & Stress Over Time</h3>
                  <p className="text-xs text-muted-foreground mb-5">Daily readings across the month</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={moodTrend} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                      <defs>
                        <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="stressGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#fb7185" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#fb7185" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} interval={2} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} domain={[0, 10]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="energy" stroke="#38bdf8" strokeWidth={2} fill="url(#energyGrad)" dot={false} />
                      <Area type="monotone" dataKey="stress" stroke="#fb7185" strokeWidth={2} fill="url(#stressGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                  <div className="flex items-center gap-5 mt-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="w-3 h-0.5 rounded bg-sky-400 inline-block" /> Energy
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="w-3 h-0.5 rounded bg-rose-400 inline-block" /> Stress
                    </div>
                  </div>
                </motion.div>

                {/* Mood Distribution */}
                <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="font-heading font-700 text-base text-foreground mb-1">Mood Distribution</h3>
                  <p className="text-xs text-muted-foreground mb-5">How often each mood state occurred this month</p>
                  <div className="space-y-3">
                    {MOCK_MOOD_DISTRIBUTION.map((m) => (
                      <div key={m.mood} className="flex items-center gap-3">
                        <span className="text-xs font-medium text-foreground w-14 shrink-0">{m.mood}</span>
                        <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(m.count / 31) * 100}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                            className="h-full rounded-full"
                            style={{ background: m.color }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-12 text-right shrink-0">
                          {m.count} days
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </>
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* HABITS TAB                                                     */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {activeTab === 'habits' && (
              <>
                <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {MOCK_HABIT_STATS.map((habit) => {
                    const pct = Math.round((habit.completed / habit.total) * 100);
                    return (
                      <div key={habit.name} className="rounded-2xl border border-border bg-card p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{habit.icon}</span>
                            <span className="text-sm font-semibold font-heading text-foreground">{habit.name}</span>
                          </div>
                          <span className="text-xs font-700 font-heading" style={{ color: habit.color }}>
                            {pct}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.15 }}
                            className="h-full rounded-full"
                            style={{ background: habit.color }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {habit.completed} / {habit.total} days completed
                        </p>
                      </div>
                    );
                  })}
                </motion.div>

                {/* Habit Completion Bar Chart */}
                <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="font-heading font-700 text-base text-foreground mb-1">Habit Completion Overview</h3>
                  <p className="text-xs text-muted-foreground mb-5">Days completed per habit this month</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={MOCK_HABIT_STATS} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} domain={[0, 31]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="completed" radius={[6, 6, 0, 0]}>
                        {MOCK_HABIT_STATS.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>

                {/* Top & Bottom Habits */}
                <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="rounded-2xl border border-border bg-card p-6">
                    <h3 className="font-heading font-700 text-sm text-foreground mb-3 flex items-center gap-2">
                      <TrendingUp size={14} strokeWidth={2} className="text-emerald-500" /> Top Habits
                    </h3>
                    <div className="space-y-2.5">
                      {[...MOCK_HABIT_STATS]
                        .sort((a, b) => b.completed - a.completed)
                        .slice(0, 3)
                        .map((h) => (
                          <div key={h.name} className="flex items-center justify-between text-xs">
                            <span className="text-foreground/80 flex items-center gap-1.5">
                              {h.icon} {h.name}
                            </span>
                            <span className="font-semibold text-emerald-500">
                              {Math.round((h.completed / h.total) * 100)}%
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-6">
                    <h3 className="font-heading font-700 text-sm text-foreground mb-3 flex items-center gap-2">
                      <TrendingDown size={14} strokeWidth={2} className="text-amber-500" /> Needs Attention
                    </h3>
                    <div className="space-y-2.5">
                      {[...MOCK_HABIT_STATS]
                        .sort((a, b) => a.completed - b.completed)
                        .slice(0, 3)
                        .map((h) => (
                          <div key={h.name} className="flex items-center justify-between text-xs">
                            <span className="text-foreground/80 flex items-center gap-1.5">
                              {h.icon} {h.name}
                            </span>
                            <span className="font-semibold text-amber-500">
                              {Math.round((h.completed / h.total) * 100)}%
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </motion.div>
              </>
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* PRODUCTIVITY TAB                                               */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {activeTab === 'productivity' && (
              <>
                <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Tasks Completed', value: '67', icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-500/10', delta: 8 },
                    { label: 'Goals Achieved', value: '15', icon: Star, color: 'text-amber-500', bg: 'bg-amber-500/10', delta: 3 },
                    { label: 'Avg Focus Score', value: '74%', icon: Brain, color: 'text-violet-500', bg: 'bg-violet-500/10', delta: 6 },
                    { label: 'Peak Week', value: 'Week 4', icon: TrendingUp, color: 'text-sky-500', bg: 'bg-sky-500/10', delta: 0 },
                  ].map((card) => {
                    const CardIcon = card.icon;
                    return (
                      <div key={card.label} className="rounded-2xl border border-border bg-card p-5 space-y-3">
                        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', card.bg)}>
                          <CardIcon size={16} strokeWidth={1.5} className={card.color} />
                        </div>
                        <p className="text-2xl font-700 font-heading text-foreground">{card.value}</p>
                        <p className="text-xs text-muted-foreground">{card.label}</p>
                        {card.delta !== 0 && <TrendBadge value={card.delta} />}
                      </div>
                    );
                  })}
                </motion.div>

                {/* Weekly Productivity Chart */}
                <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="font-heading font-700 text-base text-foreground mb-1">Weekly Productivity Breakdown</h3>
                  <p className="text-xs text-muted-foreground mb-5">Tasks completed and goals achieved per week</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={MOCK_PRODUCTIVITY_TREND} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="tasks" fill="#34d399" radius={[5, 5, 0, 0]} name="tasks" />
                      <Bar dataKey="goals" fill="#8b5cf6" radius={[5, 5, 0, 0]} name="goals" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex items-center gap-5 mt-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="w-3 h-2.5 rounded-sm bg-emerald-400 inline-block" /> Tasks
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="w-3 h-2.5 rounded-sm bg-violet-500 inline-block" /> Goals
                    </div>
                  </div>
                </motion.div>

                {/* Focus Score Trend */}
                <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="font-heading font-700 text-base text-foreground mb-1">Focus Score by Week</h3>
                  <p className="text-xs text-muted-foreground mb-5">Composite focus score (0–100) per week</p>
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={MOCK_PRODUCTIVITY_TREND} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                      <defs>
                        <linearGradient id="focusGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} domain={[60, 90]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="focus" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#focusGrad)" dot={{ fill: '#8b5cf6', r: 4, strokeWidth: 0 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </motion.div>
              </>
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* MIRA INSIGHTS TAB                                              */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {activeTab === 'mira' && (
              <>
                {/* MIRA Header Card */}
                <motion.div
                  variants={itemVariants}
                  className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card p-6 flex items-start gap-4"
                >
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Sparkles size={20} strokeWidth={1.5} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading font-700 text-base text-foreground mb-1">MIRA's Monthly Analysis</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Based on your 31 days of data — mood check-ins, habit completions, journal entries, and wellness scores — here's what I've observed and what I recommend for next month.
                    </p>
                  </div>
                </motion.div>

                {/* Summary Paragraph */}
                <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="font-heading font-700 text-sm text-foreground mb-3">Overall Assessment</h3>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    This has been your strongest month in the past 6 months. Your wellness score reached <strong className="text-foreground">84/100</strong>, up from 79 last month — a meaningful 6.3% improvement. Your energy levels trended upward through the month, peaking in the final week, while your stress remained well-managed at an average of {avgStress.toFixed(1)}/10.
                  </p>
                  <p className="text-sm text-foreground/80 leading-relaxed mt-3">
                    The correlation between your exercise habit and energy scores is particularly strong this month. On exercise days, your average energy was <strong className="text-foreground">7.8</strong> compared to <strong className="text-foreground">5.4</strong> on rest days. This is a pattern worth protecting.
                  </p>
                </motion.div>

                {/* Recommendations */}
                <motion.div variants={itemVariants} className="space-y-4">
                  <h3 className="font-heading font-700 text-base text-foreground">Personalized Recommendations</h3>
                  {MOCK_MIRA_RECOMMENDATIONS.map((rec, i) => (
                    <motion.div
                      key={rec.id}
                      variants={itemVariants}
                      className="rounded-2xl border border-border bg-card p-5 space-y-3"
                    >
                      <div className="flex items-start gap-3">
                        <PriorityDot priority={rec.priority} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{rec.icon}</span>
                            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{rec.category}</span>
                            <span
                              className={cn(
                                'ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full',
                                rec.priority === 'high' ?'bg-rose-500/10 text-rose-500'
                                  : rec.priority === 'medium' ?'bg-amber-500/10 text-amber-500' :'bg-emerald-500/10 text-emerald-500'
                              )}
                            >
                              {rec.priority} priority
                            </span>
                          </div>
                          <h4 className="font-heading font-700 text-sm text-foreground mb-2">{rec.title}</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">{rec.insight}</p>
                        </div>
                      </div>
                      <div className="ml-5 pl-3 border-l-2 border-primary/30">
                        <p className="text-xs text-foreground/70">
                          <span className="font-semibold text-primary">Action: </span>
                          {rec.action}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Next Month Goals */}
                <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="font-heading font-700 text-base text-foreground mb-4 flex items-center gap-2">
                    <Target size={16} strokeWidth={1.8} className="text-primary" />
                    Suggested Goals for Next Month
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { goal: 'Reach wellness score of 88+', category: 'Wellness', icon: '🎯' },
                      { goal: 'Journal at least 20 days', category: 'Journal', icon: '📓' },
                      { goal: 'Exercise 25+ days', category: 'Habits', icon: '💪' },
                      { goal: 'Keep avg stress below 4.0', category: 'Stress', icon: '🧘' },
                    ].map((g) => (
                      <div key={g.goal} className="flex items-start gap-3 p-3.5 rounded-xl bg-muted/40 border border-border">
                        <span className="text-lg shrink-0">{g.icon}</span>
                        <div>
                          <p className="text-xs font-semibold text-foreground">{g.goal}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{g.category}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
