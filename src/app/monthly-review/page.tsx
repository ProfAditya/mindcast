'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp, TrendingDown, Star, Target, BookOpen, Activity, Award, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts';
import { cn } from '@/lib/utils';
import AppLayout from '@/components/AppLayout';
import { mockMoodTrend } from '@/lib/mockData';
import Icon from '@/components/ui/AppIcon';


const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface MonthlyData {
  month: string;
  year: number;
  wellnessScore: number;
  moodAvg: number;
  habitCompletion: number;
  journalEntries: number;
  streakDays: number;
  topMood: string;
  highlights: string[];
  challenges: string[];
  moodTrend: Array<{ date: string; energy: number; stress: number }>;
  wellnessDimensions: Array<{ subject: string; value: number }>;
}

function generateMonthData(month: number, year: number): MonthlyData {
  const seed = month + year * 12;
  const base = 60 + (seed % 25);
  return {
    month: MONTHS[month],
    year,
    wellnessScore: base + 5,
    moodAvg: 3.2 + (seed % 15) / 10,
    habitCompletion: 55 + (seed % 35),
    journalEntries: 8 + (seed % 12),
    streakDays: 5 + (seed % 20),
    topMood: ['good', 'great', 'okay', 'good'][seed % 4],
    highlights: [
      'Maintained consistent sleep schedule',
      'Completed 3 meditation sessions per week',
      'Journaled more than any previous month',
    ].slice(0, 2 + (seed % 2)),
    challenges: [
      'High stress mid-month',
      'Missed exercise goals',
    ].slice(0, 1 + (seed % 2)),
    moodTrend: mockMoodTrend.map((d, i) => ({
      date: `${i + 1}`,
      energy: d.energy,
      stress: d.stress,
    })),
    wellnessDimensions: [
      { subject: 'Sleep', value: 65 + (seed % 25) },
      { subject: 'Stress', value: 55 + (seed % 30) },
      { subject: 'Energy', value: 70 + (seed % 20) },
      { subject: 'Mindfulness', value: 60 + (seed % 25) },
      { subject: 'Movement', value: 50 + (seed % 35) },
      { subject: 'Nutrition', value: 65 + (seed % 20) },
    ],
  };
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card/95 backdrop-blur-sm px-3 py-2.5 shadow-card-md text-xs">
      <p className="font-semibold font-heading text-foreground mb-1.5">Day {label}</p>
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

export default function MonthlyReviewPage() {
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedYear, setSelectedYear] = useState(2024);
  const [currentMonth, setCurrentMonth] = useState(0);
  const [currentYear, setCurrentYear] = useState(2024);
  const [data, setData] = useState<MonthlyData | null>(null);

  // Initialise to today's date on client only — avoids SSR/client mismatch
  useEffect(() => {
    const now = new Date();
    const m = now.getMonth();
    const y = now.getFullYear();
    setCurrentMonth(m);
    setCurrentYear(y);
    setSelectedMonth(m);
    setSelectedYear(y);
  }, []);

  useEffect(() => {
    setData(generateMonthData(selectedMonth, selectedYear));
  }, [selectedMonth, selectedYear]);

  const prevMonth = () => {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear((y) => y - 1); }
    else setSelectedMonth((m) => m - 1);
  };
  const nextMonth = () => {
    const isCurrentMonth = selectedMonth === currentMonth && selectedYear === currentYear;
    if (isCurrentMonth) return;
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear((y) => y + 1); }
    else setSelectedMonth((m) => m + 1);
  };

  const isCurrentMonth = selectedMonth === currentMonth && selectedYear === currentYear;

  if (!data) return null;

  const scoreColor = data.wellnessScore >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
    data.wellnessScore >= 65 ? 'text-sky-600 dark:text-sky-400' : 'text-amber-600 dark:text-amber-400';

  return (
    <AppLayout>
      <div className="px-5 lg:px-8 xl:px-10 py-7 pb-24 lg:pb-8 max-w-screen-xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-7">
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={20} strokeWidth={1.5} className="text-primary" />
            <h1 className="font-heading font-700 text-2xl lg:text-3xl text-foreground tracking-tight">Monthly Review</h1>
          </div>
          <p className="text-muted-foreground text-sm">A comprehensive look at your wellness journey</p>
        </motion.div>

        {/* Month Selector */}
        <div className="flex items-center gap-4 mb-7">
          <button onClick={prevMonth} className="p-2 rounded-xl border border-border hover:bg-muted transition-colors">
            <ChevronLeft size={16} strokeWidth={1.5} />
          </button>
          <div className="text-center">
            <p className="font-heading font-700 text-lg text-foreground">{data.month} {data.year}</p>
            {isCurrentMonth && (
              <span className="text-xs text-primary font-semibold">Current Month</span>
            )}
          </div>
          <button
            onClick={nextMonth}
            disabled={isCurrentMonth}
            className={cn('p-2 rounded-xl border border-border transition-colors', isCurrentMonth ? 'opacity-30 cursor-not-allowed' : 'hover:bg-muted')}
          >
            <ChevronRight size={16} strokeWidth={1.5} />
          </button>
        </div>

        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-5">
          {/* Score Cards */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Wellness Score', value: `${data.wellnessScore}%`, icon: TrendingUp, color: 'violet', change: +8 },
              { label: 'Habit Completion', value: `${data.habitCompletion}%`, icon: Target, color: 'emerald', change: data.habitCompletion > 70 ? 5 : -3 },
              { label: 'Journal Entries', value: `${data.journalEntries}`, icon: BookOpen, color: 'sky', change: 22 },
              { label: 'Best Streak', value: `${data.streakDays} days`, icon: Award, color: 'amber', change: 0 },
            ].map((card) => {
              const Icon = card.icon;
              const isPos = card.change >= 0;
              return (
                <div key={card.label} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', `bg-${card.color}-500/10`)}>
                      <Icon size={16} strokeWidth={1.5} className={`text-${card.color}-500`} />
                    </div>
                    {card.change !== 0 && (
                      <span className={cn('flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full',
                        isPos ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      )}>
                        {isPos ? <TrendingUp size={10} strokeWidth={2} /> : <TrendingDown size={10} strokeWidth={2} />}
                        {Math.abs(card.change)}%
                      </span>
                    )}
                  </div>
                  <p className="text-xl font-700 font-heading text-foreground">{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
                </div>
              );
            })}
          </motion.div>

          {/* Mood Trend + Radar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-heading font-700 text-base text-foreground mb-1">Mood & Energy Trend</h3>
              <p className="text-xs text-muted-foreground mb-5">Daily energy and stress levels</p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data.moodTrend} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
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

            <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-heading font-700 text-base text-foreground mb-1">Wellness Balance</h3>
              <p className="text-xs text-muted-foreground mb-5">Across all dimensions</p>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={data.wellnessDimensions}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                  <Radar name="Wellness" dataKey="value" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Highlights & Challenges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <motion.div variants={itemVariants} className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Star size={16} strokeWidth={2} className="text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-heading font-700 text-base text-foreground">Monthly Highlights</h3>
              </div>
              <div className="space-y-2.5">
                {data.highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-2.5 rounded-xl bg-emerald-500/10 px-3 py-2.5">
                    <TrendingUp size={13} strokeWidth={2} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{h}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity size={16} strokeWidth={2} className="text-amber-600 dark:text-amber-400" />
                <h3 className="font-heading font-700 text-base text-foreground">Areas to Improve</h3>
              </div>
              <div className="space-y-2.5">
                {data.challenges.map((c, i) => (
                  <div key={i} className="flex items-start gap-2.5 rounded-xl bg-amber-500/10 px-3 py-2.5">
                    <TrendingDown size={13} strokeWidth={2} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{c}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Overall Score */}
          <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-6 flex items-center gap-6">
            <div className="relative w-24 h-24 shrink-0">
              <svg viewBox="0 0 96 96" className="w-full h-full -rotate-90">
                <circle cx="48" cy="48" r="40" fill="none" stroke="var(--border)" strokeWidth="8" />
                <motion.circle
                  cx="48" cy="48" r="40" fill="none"
                  stroke="url(#mrScoreGrad)" strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(data.wellnessScore / 100) * 2 * Math.PI * 40} ${2 * Math.PI * 40}`}
                  initial={{ strokeDasharray: `0 ${2 * Math.PI * 40}` }}
                  animate={{ strokeDasharray: `${(data.wellnessScore / 100) * 2 * Math.PI * 40} ${2 * Math.PI * 40}` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
                <defs>
                  <linearGradient id="mrScoreGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#7C3AED" />
                    <stop offset="100%" stopColor="#FB7185" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn('text-xl font-700 font-heading', scoreColor)}>{data.wellnessScore}</span>
                <span className="text-xs text-muted-foreground">/100</span>
              </div>
            </div>
            <div>
              <h3 className="font-heading font-700 text-lg text-foreground mb-1">
                {data.month} {data.year} — Overall Score
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                {data.wellnessScore >= 80 ? 'Excellent month! You were firing on all cylinders.' :
                  data.wellnessScore >= 65 ? 'Good progress. A few areas to focus on next month.': 'Room for growth. Small consistent steps make a big difference.'}
              </p>
              <div className="flex items-center gap-2">
                <BarChart3 size={14} strokeWidth={1.5} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Avg mood: <span className="font-semibold text-foreground capitalize">{data.topMood}</span>
                  {' · '}
                  Habit rate: <span className="font-semibold text-foreground">{data.habitCompletion}%</span>
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
