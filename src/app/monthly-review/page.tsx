'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp, TrendingDown, BookOpen, Activity } from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { cn } from '@/lib/utils';
import AppLayout from '@/components/AppLayout';
import { monthlyReviewApi, type DashboardStats } from '@/lib/api';
import Icon from '@/components/ui/AppIcon';


const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
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

interface ReviewData {
  wellness_score?: number;
  habits_logged_today?: number;
  journal_entries_count?: number;
  mood_check_ins_30d?: number;
  avg_energy_30d?: number;
  avg_stress_30d?: number;
  assessment_trend?: string;
  mood_trend?: Array<{ date: string; energy: number; stress: number }>;
  [key: string]: unknown;
}

export default function MonthlyReviewPage() {
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthLabel, setMonthLabel] = useState('');

  useEffect(() => {
    const now = new Date();
    setMonthLabel(now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await monthlyReviewApi.get();
        setData(result as ReviewData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load monthly review');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <AppLayout>
      <div className="px-5 lg:px-8 xl:px-10 py-7 pb-24 lg:pb-8 max-w-screen-xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-7">
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={20} strokeWidth={1.5} className="text-primary" />
            <h1 className="font-heading font-700 text-2xl lg:text-3xl text-foreground tracking-tight">Monthly Review</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            {monthLabel ? `Your 30-day wellness snapshot — ${monthLabel}` : 'Your 30-day wellness snapshot'}
          </p>
        </motion.div>

        {loading && (
          <div className="space-y-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-2xl border border-border bg-card h-40 skeleton-shimmer" />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 text-center">
            <p className="text-sm text-rose-600 dark:text-rose-400 mb-3">{error}</p>
            <button onClick={() => window.location.reload()} className="btn-primary text-sm">Retry</button>
          </div>
        )}

        {!loading && !error && data && (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-5">
            {/* Score Cards */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Wellness Score', value: data.wellness_score != null ? `${data.wellness_score}` : '—', icon: TrendingUp, color: 'violet' },
                { label: 'Habits Logged', value: data.habits_logged_today != null ? `${data.habits_logged_today}` : '—', icon: Activity, color: 'emerald' },
                { label: 'Journal Entries', value: data.journal_entries_count != null ? `${data.journal_entries_count}` : '—', icon: BookOpen, color: 'sky' },
                { label: 'Mood Check-ins', value: data.mood_check_ins_30d != null ? `${data.mood_check_ins_30d}` : '—', icon: TrendingDown, color: 'amber' },
              ].map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.label} className="rounded-2xl border border-border bg-card p-5">
                    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3', `bg-${card.color}-500/10`)}>
                      <Icon size={16} strokeWidth={1.5} className={`text-${card.color}-500`} />
                    </div>
                    <p className="text-xl font-700 font-heading text-foreground">{card.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
                  </div>
                );
              })}
            </motion.div>

            {/* Averages */}
            {(data.avg_energy_30d != null || data.avg_stress_30d != null) && (
              <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-6">
                <h3 className="font-heading font-700 text-base text-foreground mb-4">30-Day Averages</h3>
                <div className="grid grid-cols-2 gap-4">
                  {data.avg_energy_30d != null && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Avg Energy</p>
                      <p className="text-2xl font-700 font-heading text-foreground">{data.avg_energy_30d.toFixed(1)}<span className="text-sm text-muted-foreground">/10</span></p>
                    </div>
                  )}
                  {data.avg_stress_30d != null && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Avg Stress</p>
                      <p className="text-2xl font-700 font-heading text-foreground">{data.avg_stress_30d.toFixed(1)}<span className="text-sm text-muted-foreground">/10</span></p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Mood Trend Chart — if backend provides it */}
            {Array.isArray(data.mood_trend) && data.mood_trend.length > 0 && (
              <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-6">
                <h3 className="font-heading font-700 text-base text-foreground mb-1">Mood & Energy Trend</h3>
                <p className="text-xs text-muted-foreground mb-5">Daily energy and stress levels</p>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={data.mood_trend} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="mrEnergyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="mrStressGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FB7185" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#FB7185" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} interval={3} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} domain={[0, 10]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="energy" stroke="#0EA5E9" strokeWidth={2} fill="url(#mrEnergyGrad)" dot={false} />
                    <Area type="monotone" dataKey="stress" stroke="#FB7185" strokeWidth={2} fill="url(#mrStressGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {/* Assessment Trend */}
            {data.assessment_trend && (
              <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-6">
                <h3 className="font-heading font-700 text-base text-foreground mb-2">Assessment Trend</h3>
                <div className="flex items-center gap-3">
                  {data.assessment_trend === 'improving' ? (
                    <TrendingUp size={20} strokeWidth={1.5} className="text-emerald-500" />
                  ) : (
                    <TrendingDown size={20} strokeWidth={1.5} className="text-rose-500" />
                  )}
                  <span className="text-lg font-semibold font-heading text-foreground capitalize">{data.assessment_trend}</span>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
