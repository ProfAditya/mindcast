'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, MessageCircle, TrendingUp, Zap, Target, Calendar, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import {
  mockDashboardStats,
  mockHabitsToday,
  mockMiraInsight,
  mockRecentJournal,
  mockMoodTrend,
} from '@/lib/mockData';
import {
  dashboardApi,
  moodApi,
  habitsApi,
  journalApi,
  DashboardStats,
  MoodEntry,
  Habit,
  HabitLog,
  JournalEntry,
} from '@/lib/api';
import WellnessScoreCard from './WellnessScoreCard';
import MoodTrendChart from './MoodTrendChart';
import HabitRingsCard from './HabitRingsCard';
import MiraInsightCard from './MiraInsightCard';
import RecentJournalCard from './RecentJournalCard';
import StatsStripCard from './StatsStripCard';

function useTimeOfDay() {
  const [timeData, setTimeData] = useState({ greeting: 'Hello', period: 'day' });
  useEffect(() => {
    const hour = new Date()?.getHours();
    if (hour >= 6 && hour < 12) setTimeData({ greeting: 'Good morning', period: 'morning' });
    else if (hour >= 12 && hour < 17) setTimeData({ greeting: 'Good afternoon', period: 'afternoon' });
    else if (hour >= 17 && hour < 21) setTimeData({ greeting: 'Good evening', period: 'evening' });
    else setTimeData({ greeting: 'Good night', period: 'night' });
  }, []);
  return timeData;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
};

// Map backend MoodEntry[] → chart-friendly format
function normalizeMoodTrend(entries: MoodEntry[]) {
  return entries.map((e) => {
    const d = new Date(e.created_at);
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return {
      date: label,
      energy: e.energy ?? 5,
      stress: e.stress ?? 5,
      mood: e.mood ?? 'okay',
    };
  });
}

// Map backend Habit[] + today's HabitLog[] → HabitRingsCard format
function normalizeHabits(habits: Habit[], logs: HabitLog[]) {
  const colors = ['sky', 'fuchsia', 'emerald', 'cyan', 'violet', 'rose'];
  return habits.slice(0, 4).map((h, i) => {
    const log = logs.find((l) => l.habit_id === h.id);
    const value = log?.value ?? 0;
    const completed = log?.completed ?? value >= h.target;
    return {
      id: h.id,
      type: h.type ?? h.name.toLowerCase(),
      label: h.name,
      value,
      unit: h.unit,
      target: h.target,
      completed,
      color: colors[i % colors.length],
    };
  });
}

// Map backend JournalEntry → RecentJournalCard format
function normalizeJournal(entry: JournalEntry) {
  return {
    id: entry.id,
    prompt: entry.prompt ?? "What's on your mind?",
    entry: entry.content,
    sentiment: entry.sentiment ?? 'neutral',
    created_at: entry.created_at,
  };
}

export default function DashboardContent() {
  const { greeting } = useTimeOfDay();
  const [dateStr, setDateStr] = useState('');

  // Live data state — initialized with mock fallbacks
  const [stats, setStats] = useState<DashboardStats>(mockDashboardStats);
  const [moodTrend, setMoodTrend] = useState(mockMoodTrend);
  const [habits, setHabits] = useState(mockHabitsToday);
  const [recentJournal, setRecentJournal] = useState(mockRecentJournal);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const d = new Date();
    setDateStr(d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchDashboardData() {
      try {
        // Fetch all dashboard data in parallel
        const [statsData, moodData, habitsData, journalData] = await Promise.allSettled([
          dashboardApi.getStats(),
          moodApi.list(14),
          habitsApi.list(),
          journalApi.list(1),
        ]);

        if (cancelled) return;

        // Wellness score + stats
        if (statsData.status === 'fulfilled' && statsData.value) {
          setStats(statsData.value);
        }

        // Mood trend chart
        if (moodData.status === 'fulfilled' && Array.isArray(moodData.value) && moodData.value.length > 0) {
          const sorted = [...moodData.value].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          setMoodTrend(normalizeMoodTrend(sorted));
        }

        // Habit rings — fetch today's logs for each habit
        if (habitsData.status === 'fulfilled' && Array.isArray(habitsData.value) && habitsData.value.length > 0) {
          const activeHabits = habitsData.value.filter((h) => h.is_active).slice(0, 4);
          const today = new Date().toISOString().split('T')[0];

          // Fetch today's logs for each habit in parallel
          const logResults = await Promise.allSettled(
            activeHabits.map((h) => habitsApi.getLogs(h.id, 1))
          );

          const todayLogs: HabitLog[] = [];
          logResults.forEach((r) => {
            if (r.status === 'fulfilled' && Array.isArray(r.value)) {
              const todayLog = r.value.find((l) => l.date === today || l.date?.startsWith(today));
              if (todayLog) todayLogs.push(todayLog);
            }
          });

          if (!cancelled) {
            setHabits(normalizeHabits(activeHabits, todayLogs));
          }
        }

        // Recent journal entry
        if (journalData.status === 'fulfilled' && Array.isArray(journalData.value) && journalData.value.length > 0) {
          setRecentJournal(normalizeJournal(journalData.value[0]));
        }
      } catch {
        // Silently fall back to mock data — already set as initial state
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDashboardData();
    return () => { cancelled = true; };
  }, []);

  const miraInsight = mockMiraInsight;

  return (
    <div className="px-5 lg:px-8 xl:px-10 py-7 pb-24 lg:pb-8 max-w-screen-2xl mx-auto">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="mb-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            {dateStr && (
              <p className="text-xs text-muted-foreground font-semibold mb-1.5 uppercase tracking-widest font-heading">
                {dateStr}
              </p>
            )}
            <h1 className="font-heading font-700 text-2xl lg:text-3xl text-foreground tracking-tight">
              {greeting}, Aria
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              You&apos;re on a{' '}
              <span className="text-wellness-emerald font-semibold">{stats?.streak_days}-day streak</span>
              {' '}— keep the momentum going.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/mood" className="btn-ghost text-sm border border-border hidden sm:flex" data-testid="log-mood-btn">
              <Plus size={14} strokeWidth={2} />
              Log Mood
            </Link>
            <Link href="/ai-chat-with-mira" className="btn-primary text-sm" data-testid="chat-mira-btn">
              <MessageCircle size={14} strokeWidth={2} />
              <span className="hidden sm:inline">Chat with Mira</span>
              <span className="sm:hidden">Mira</span>
            </Link>
          </div>
        </div>

        {/* Quick stats bar */}
        <div className="mt-5 grid grid-cols-3 sm:grid-cols-4 gap-3">
          {[
            { label: 'Wellness Score', value: `${stats?.wellness_score}%`, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Habits Today', value: `${stats?.habits_logged_today}/${habits.length || 5}`, icon: Target, color: 'text-wellness-emerald', bg: 'bg-emerald-500/10' },
            { label: 'Avg Energy', value: `${stats?.avg_energy_30d}/10`, icon: Zap, color: 'text-wellness-amber', bg: 'bg-amber-500/10' },
            { label: 'Journal Entries', value: `${stats?.journal_entries_count}`, icon: Calendar, color: 'text-wellness-sky', bg: 'bg-sky-500/10' },
          ].map((stat) => {
            const StatIcon = stat.icon;
            return (
              <div key={stat.label} className="rounded-2xl border border-border bg-card p-3.5 flex items-center gap-3">
                <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', stat.bg)}>
                  <StatIcon size={15} strokeWidth={2} className={stat.color} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                  <p className="text-sm font-700 font-heading text-foreground">{stat.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Bento Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5"
      >
        {/* Wellness Score — Hero, spans 1 col but 2 rows */}
        <motion.div variants={itemVariants} className="xl:row-span-2">
          <WellnessScoreCard score={stats?.wellness_score} trend={stats?.assessment_trend} />
        </motion.div>

        {/* Mood Trend Chart — spans 2 cols */}
        <motion.div variants={itemVariants} className="md:col-span-1 xl:col-span-2">
          <MoodTrendChart data={moodTrend} loading={loading} />
        </motion.div>

        {/* Habit Rings */}
        <motion.div variants={itemVariants}>
          <HabitRingsCard habits={habits} />
        </motion.div>

        {/* Mira Insight — spans 2 cols */}
        <motion.div variants={itemVariants} className="md:col-span-1 xl:col-span-2">
          <MiraInsightCard insight={miraInsight} />
        </motion.div>

        {/* Recent Journal */}
        <motion.div variants={itemVariants}>
          <RecentJournalCard journal={recentJournal} />
        </motion.div>

        {/* Stats Strip — spans all 4 cols */}
        <motion.div variants={itemVariants} className="md:col-span-2 xl:col-span-4">
          <StatsStripCard stats={stats} />
        </motion.div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {[
          { label: 'View Analytics', href: '/analytics', color: 'from-violet-500/10 to-violet-500/5', border: 'border-violet-500/20', text: 'text-violet-600 dark:text-violet-400' },
          { label: 'Wellness DNA', href: '/wellness-dna', color: 'from-rose-500/10 to-rose-500/5', border: 'border-rose-500/20', text: 'text-rose-600 dark:text-rose-400' },
          { label: 'Monthly Review', href: '/monthly-review', color: 'from-sky-500/10 to-sky-500/5', border: 'border-sky-500/20', text: 'text-sky-600 dark:text-sky-400' },
          { label: 'Toolkit', href: '/toolkit', color: 'from-emerald-500/10 to-emerald-500/5', border: 'border-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400' },
        ].map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className={cn(
              'rounded-2xl border p-4 bg-gradient-to-br flex items-center justify-between group hover:scale-[1.02] transition-transform duration-200',
              action.color, action.border
            )}
          >
            <span className={cn('text-sm font-semibold font-heading', action.text)}>{action.label}</span>
            <ArrowUpRight size={14} strokeWidth={2} className={cn('opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all', action.text)} />
          </Link>
        ))}
      </motion.div>
    </div>
  );
}

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ');
}