'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { TrendingUp, TrendingDown, BarChart3, Activity, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { moodApi, dashboardApi, type MoodEntry, type DashboardStats } from '@/lib/api';
import Icon from '@/components/ui/AppIcon';


const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
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

export default function AnalyticsContent() {
  const [moodData, setMoodData] = useState<Array<{ date: string; energy: number; stress: number; mood: string }>>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [moodResult, statsResult] = await Promise.allSettled([
          moodApi.list(30),
          dashboardApi.getStats(),
        ]);

        if (moodResult.status === 'fulfilled' && Array.isArray(moodResult.value)) {
          const sorted = [...moodResult.value].sort(
            (a: MoodEntry, b: MoodEntry) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          setMoodData(sorted.map((e: MoodEntry) => ({
            date: new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            energy: e.energy_level,
            stress: e.stress_level,
            mood: e.mood,
          })));
        }

        if (statsResult.status === 'fulfilled') {
          setStats(statsResult.value);
        }

        if (moodResult.status === 'rejected' && statsResult.status === 'rejected') {
          setError('Failed to load analytics data');
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="px-5 lg:px-8 xl:px-10 py-7 pb-24 lg:pb-8 max-w-screen-xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-7">
        <h1 className="font-heading font-700 text-2xl lg:text-3xl text-foreground tracking-tight">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Insights from your wellness data over the last 30 days</p>
      </motion.div>

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-5">
        {/* Stat Cards — from real dashboard stats */}
        {stats ? (
          <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Wellness Score', value: `${stats.wellness_score ?? '—'}`, icon: TrendingUp, color: 'violet' },
              { label: 'Mood Check-ins', value: `${stats.mood_check_ins_30d ?? '—'}`, icon: Activity, color: 'rose' },
              { label: 'Avg Energy', value: stats.avg_energy_30d != null ? `${stats.avg_energy_30d.toFixed(1)}/10` : '—', icon: BarChart3, color: 'sky' },
              { label: 'Journal Entries', value: `${stats.journal_entries_count ?? '—'}`, icon: Calendar, color: 'emerald' },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="rounded-2xl border border-border bg-card p-5 hover:border-primary/20 transition-colors">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-4', `bg-${card.color}-500/10`)}>
                    <Icon size={18} strokeWidth={1.5} className={`text-${card.color}-500`} />
                  </div>
                  <p className="text-2xl font-700 font-heading text-foreground tracking-tight">{card.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{card.label}</p>
                </div>
              );
            })}
          </motion.div>
        ) : !loading && (
          <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-border bg-card h-28 skeleton-shimmer" />
            ))}
          </motion.div>
        )}

        {/* Mood & Energy Chart */}
        <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-heading font-700 text-base text-foreground">Mood & Energy Trend</h3>
              <p className="text-xs text-muted-foreground mt-0.5">30-day overview</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-sky-400 inline-block" />Energy</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-rose-400 inline-block" />Stress</span>
            </div>
          </div>
          {loading ? (
            <div className="h-56 rounded-xl skeleton-shimmer" />
          ) : moodData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
              No mood data yet. Start logging your mood to see trends here.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={moodData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
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
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} interval={4} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} domain={[0, 10]} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="energy" stroke="#0EA5E9" strokeWidth={2} fill="url(#energyGrad)" dot={false} />
                <Area type="monotone" dataKey="stress" stroke="#FB7185" strokeWidth={2} fill="url(#stressGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Assessment Trend */}
        {stats?.assessment_trend && (
          <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-heading font-700 text-base text-foreground mb-2">Assessment Trend</h3>
            <div className="flex items-center gap-3">
              {stats.assessment_trend === 'improving' ? (
                <TrendingUp size={20} strokeWidth={1.5} className="text-emerald-500" />
              ) : (
                <TrendingDown size={20} strokeWidth={1.5} className="text-rose-500" />
              )}
              <span className="text-lg font-semibold font-heading text-foreground capitalize">{stats.assessment_trend}</span>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
