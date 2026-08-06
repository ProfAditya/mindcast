'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, MessageCircle, TrendingUp, Zap, Target, Calendar, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import {
  dashboardApi,
  moodApi,
  journalApi,
  getStoredUser,
  assessmentsApi,
  type DashboardStats,
  type MoodEntry,
  type JournalEntry,
  type AssessmentResult,
} from '@/lib/api';
import WellnessScoreCard from './WellnessScoreCard';
import MoodTrendChart from './MoodTrendChart';
import HabitRingsCard from './HabitRingsCard';
import MiraInsightCard from './MiraInsightCard';
import RecentJournalCard from './RecentJournalCard';
import StatsStripCard from './StatsStripCard';
import AssessmentHistoryCard from './AssessmentHistoryCard';

function useTimeOfDay() {
  const [timeData, setTimeData] = useState({ greeting: 'Hello', period: 'day' });
  useEffect(() => {
    const hour = new Date().getHours();
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

function normalizeMoodTrend(entries: MoodEntry[]) {
  return entries.map((e) => {
    const d = new Date(e.created_at);
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return {
      date: label,
      energy: e.energy_level ?? 5,
      stress: e.stress_level ?? 5,
      mood: e.mood ?? 'okay',
    };
  });
}

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function DashboardContent() {
  const { greeting } = useTimeOfDay();
  const [dateStr, setDateStr] = useState('');
  const [userName, setUserName] = useState('');

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [moodTrend, setMoodTrend] = useState<Array<{ date: string; energy: number; stress: number; mood: string }>>([]);
  const [recentJournal, setRecentJournal] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [assessmentHistory, setAssessmentHistory] = useState<AssessmentResult[]>([]);
  const [assessmentLoading, setAssessmentLoading] = useState(true);

  useEffect(() => {
    const d = new Date();
    setDateStr(d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }));
    const stored = getStoredUser();
    if (stored) setUserName(stored.name || stored.email || '');
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchDashboardData() {
      try {
        const [statsResult, moodResult, journalResult] = await Promise.allSettled([
          dashboardApi.getStats(),
          moodApi.list(14),
          journalApi.list(1),
        ]);

        if (cancelled) return;

        if (statsResult.status === 'fulfilled') {
          setStats(statsResult.value);
        } else {
          setStatsError('Could not load stats');
        }

        if (moodResult.status === 'fulfilled' && Array.isArray(moodResult.value) && moodResult.value.length > 0) {
          const sorted = [...moodResult.value].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          setMoodTrend(normalizeMoodTrend(sorted));
        }

        if (journalResult.status === 'fulfilled' && Array.isArray(journalResult.value) && journalResult.value.length > 0) {
          setRecentJournal(journalResult.value[0]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    async function fetchAssessmentHistory() {
      try {
        const history = await assessmentsApi.list(10);
        if (!cancelled && Array.isArray(history)) {
          const sorted = [...history].sort(
            (a, b) => new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime()
          );
          setAssessmentHistory(sorted);
        }
      } catch {
        // silently fail — card shows empty state
      } finally {
        if (!cancelled) setAssessmentLoading(false);
      }
    }

    fetchDashboardData();
    fetchAssessmentHistory();
    return () => { cancelled = true; };
  }, []);

  const displayName = userName ? userName.split(' ')[0] : '';

  // Build sector scores from latest assessment for MiraInsightCard
  const latestAssessment = assessmentHistory.length > 0 ? assessmentHistory[assessmentHistory.length - 1] : null;

  const sectorScores = latestAssessment ? [
    { key: 'stress', label: 'Stress Management', score: latestAssessment.stress_score ?? 0 },
    { key: 'sleep', label: 'Sleep Quality', score: latestAssessment.sleep_score ?? 0 },
    { key: 'work_study', label: 'Work / Study Load', score: (latestAssessment as any).work_study_score ?? latestAssessment.lifestyle_score ?? 0 },
    { key: 'emotional', label: 'Emotional Balance', score: (latestAssessment as any).emotional_score ?? latestAssessment.psychology_score ?? 0 },
  ].filter(s => s.score > 0) : [];

  return (
    <div className="px-5 lg:px-8 xl:px-10 py-6 pb-24 lg:pb-8 max-w-screen-2xl mx-auto page-enter">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mb-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            {dateStr && (
              <p className="text-[11px] text-muted-foreground font-semibold mb-1.5 uppercase tracking-widest font-heading">
                {dateStr}
              </p>
            )}
            <h1 className="font-heading font-bold text-2xl lg:text-[28px] text-foreground tracking-tight leading-tight">
              {greeting}{displayName ? `, ${displayName}` : ''}
            </h1>
            {stats ? (
              <p className="text-muted-foreground mt-1 text-sm">
                {stats.assessment_trend === 'improving' ? (
                  <>Your wellness is <span className="text-wellness-emerald font-semibold">improving</span> — keep it up.</>
                ) : (
                  <>Here&apos;s your wellness snapshot for today.</>
                )}
              </p>
            ) : (
              <p className="text-muted-foreground mt-1 text-sm">Here&apos;s your wellness snapshot for today.</p>
            )}
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
        {stats ? (
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Wellness Score', value: `${stats.wellness_score ?? '—'}`, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
              { label: 'Habits Today', value: `${stats.habits_logged_today ?? 0}`, icon: Target, color: 'text-wellness-emerald', bg: 'bg-emerald-500/10' },
              { label: 'Avg Energy', value: stats.avg_energy_30d != null ? `${stats.avg_energy_30d.toFixed(1)}/10` : '—', icon: Zap, color: 'text-wellness-amber', bg: 'bg-amber-500/10' },
              { label: 'Journal Entries', value: `${stats.journal_entries_count ?? 0}`, icon: Calendar, color: 'text-wellness-sky', bg: 'bg-sky-500/10' },
            ].map((stat) => {
              const StatIcon = stat.icon;
              return (
                <div key={stat.label} className="rounded-2xl border border-border bg-card p-3.5 flex items-center gap-3 card-hover elevation-xs">
                  <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', stat.bg)}>
                    <StatIcon size={15} strokeWidth={2} className={stat.color} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground truncate">{stat.label}</p>
                    <p className="text-sm font-bold font-heading text-foreground">{stat.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : statsError ? (
          <div className="mt-5 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
            {statsError} — <button onClick={() => window.location.reload()} className="text-primary underline">retry</button>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-3.5 h-[68px] skeleton-shimmer" />
            ))}
          </div>
        )}
      </motion.div>

      {/* Bento Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"
      >
        {/* Wellness Score */}
        <motion.div variants={itemVariants} className="xl:row-span-2">
          <WellnessScoreCard score={stats?.wellness_score} trend={stats?.assessment_trend} />
        </motion.div>

        {/* Mood Trend Chart */}
        <motion.div variants={itemVariants} className="md:col-span-1 xl:col-span-2">
          <MoodTrendChart data={moodTrend} loading={loading} />
        </motion.div>

        {/* Habit Rings — pass empty array; component handles empty state */}
        <motion.div variants={itemVariants}>
          <HabitRingsCard habits={[]} />
        </motion.div>

        {/* Mira Insight */}
        <motion.div variants={itemVariants} className="md:col-span-1 xl:col-span-2">
          <MiraInsightCard
            insight={null}
            overallScore={latestAssessment?.overall_score}
            scoreTrend={stats?.assessment_trend as 'improving' | 'declining' | 'stable' | undefined}
            sectorScores={sectorScores}
          />
        </motion.div>

        {/* Recent Journal */}
        <motion.div variants={itemVariants}>
          <RecentJournalCard journal={recentJournal} />
        </motion.div>

        {/* Stats Strip */}
        <motion.div variants={itemVariants} className="md:col-span-2 xl:col-span-4">
          <StatsStripCard stats={stats} />
        </motion.div>

        {/* Assessment History */}
        <motion.div variants={itemVariants} className="md:col-span-2 xl:col-span-4">
          <AssessmentHistoryCard history={assessmentHistory} loading={assessmentLoading} />
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