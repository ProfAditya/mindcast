'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, LineChart, Line
} from 'recharts';
import { TrendingUp, TrendingDown, BarChart3, Activity, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { analyticsApi } from '@/lib/api';
import { mockMoodTrend } from '@/lib/mockData';
import Icon from '@/components/ui/AppIcon';


const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const TABS = ['Overview', 'Mood', 'Habits', 'Wellness'] as const;
type Tab = typeof TABS[number];

// Deterministic wellness-over-time data (no Math.random — avoids hydration mismatch)
const WELLNESS_OVER_TIME = Array.from({ length: 30 }, (_, i) => ({
  date: '',
  score: Math.round(60 + ((i * 7 + 3) % 15) + i * 0.5),
}));

function StatCard({ label, value, change, icon: Icon, color }: {
  label: string; value: string; change?: number; icon: React.ElementType; color: string;
}) {
  const isPositive = (change ?? 0) >= 0;
  return (
    <div className="rounded-2xl border border-border bg-card p-5 hover:border-primary/20 transition-colors group">
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', `bg-${color}-500/10`)}>
          <Icon size={18} strokeWidth={1.5} className={`text-${color}-500`} />
        </div>
        {change !== undefined && (
          <span className={cn('flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full',
            isPositive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
          )}>
            {isPositive ? <TrendingUp size={11} strokeWidth={2} /> : <TrendingDown size={11} strokeWidth={2} />}
            {Math.abs(change)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-700 font-heading text-foreground tracking-tight">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

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
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [moodData, setMoodData] = useState<Array<{ date: string; energy: number; stress: number; mood: string }>>([]);
  const [wellnessOverTime, setWellnessOverTime] = useState<Array<{ date: string; score: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Build wellness-over-time with real dates on client only
    const wot = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: Math.round(60 + ((i * 7 + 3) % 15) + i * 0.5),
    }));
    setWellnessOverTime(wot);

    const load = async () => {
      setLoading(true);
      try {
        const data = await analyticsApi.getMoodTrend(30);
        setMoodData(data);
      } catch {
        setMoodData(mockMoodTrend.map((d, i) => ({
          date: new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          energy: d.energy,
          stress: d.stress,
          mood: d.mood,
        })));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const habitData = [
    { day: 'Mon', completion: 80 }, { day: 'Tue', completion: 60 }, { day: 'Wed', completion: 100 },
    { day: 'Thu', completion: 75 }, { day: 'Fri', completion: 90 }, { day: 'Sat', completion: 50 }, { day: 'Sun', completion: 70 },
  ];

  const wellnessData = [
    { subject: 'Sleep', value: 78 }, { subject: 'Stress', value: 62 }, { subject: 'Energy', value: 85 },
    { subject: 'Mindfulness', value: 70 }, { subject: 'Movement', value: 55 }, { subject: 'Nutrition', value: 72 },
  ];

  return (
    <div className="px-5 lg:px-8 xl:px-10 py-7 pb-24 lg:pb-8 max-w-screen-xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-7">
        <h1 className="font-heading font-700 text-2xl lg:text-3xl text-foreground tracking-tight">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Insights from your wellness data over the last 30 days</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted w-fit mb-7">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-semibold font-heading transition-all duration-200',
              activeTab === tab ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-5">
        {/* Stat Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Avg Wellness Score" value="76%" change={8} icon={TrendingUp} color="violet" />
          <StatCard label="Mood Check-ins" value="24" change={12} icon={Activity} color="rose" />
          <StatCard label="Habit Completion" value="73%" change={-3} icon={BarChart3} color="sky" />
          <StatCard label="Journal Entries" value="11" change={22} icon={Calendar} color="emerald" />
        </motion.div>

        {/* Mood & Energy Chart */}
        {(activeTab === 'Overview' || activeTab === 'Mood') && (
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
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Habit Completion */}
          {(activeTab === 'Overview' || activeTab === 'Habits') && (
            <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-5">
                <h3 className="font-heading font-700 text-base text-foreground">Weekly Habit Completion</h3>
                <p className="text-xs text-muted-foreground mt-0.5">This week&apos;s performance</p>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={habitData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="completion" fill="#7C3AED" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Wellness Radar */}
          {(activeTab === 'Overview' || activeTab === 'Wellness') && (
            <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-5">
                <h3 className="font-heading font-700 text-base text-foreground">Wellness Dimensions</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Current balance across areas</p>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={wellnessData}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                  <Radar name="Wellness" dataKey="value" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </div>

        {/* Wellness Score Over Time */}
        {(activeTab === 'Overview' || activeTab === 'Wellness') && wellnessOverTime.length > 0 && (
          <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-heading font-700 text-base text-foreground">Wellness Score Over Time</h3>
                <p className="text-xs text-muted-foreground mt-0.5">30-day trajectory</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                <TrendingUp size={12} strokeWidth={2} />
                +8% this month
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={wellnessOverTime} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="wellnessLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#7C3AED" />
                    <stop offset="100%" stopColor="#FB7185" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} interval={6} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} domain={[50, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="score" stroke="url(#wellnessLine)" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
