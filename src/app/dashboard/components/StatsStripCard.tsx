'use client';

import React from 'react';
import { TrendingUp, Activity, Brain, BookOpen, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import Icon from '@/components/ui/AppIcon';


interface Stats {
  wellness_score: number;
  habits_logged_today: number;
  journal_entries_count: number;
  mood_check_ins_30d: number;
  avg_energy_30d: number;
  avg_stress_30d: number;
  assessment_trend: string;
  streak_days: number;
}

interface StatsStripCardProps {
  stats: Stats;
}

const statItems = (stats: Stats) => [
  {
    id: 'stat-mood',
    label: 'Mood Check-ins',
    value: stats.mood_check_ins_30d.toString(),
    sub: 'last 30 days',
    icon: Brain,
    color: 'text-rose-500',
    bg: 'bg-rose-100 dark:bg-rose-900/30',
  },
  {
    id: 'stat-energy',
    label: 'Avg Energy',
    value: stats.avg_energy_30d.toFixed(1),
    sub: 'out of 10',
    icon: Activity,
    color: 'text-violet-500',
    bg: 'bg-violet-100 dark:bg-violet-900/30',
    isGood: stats.avg_energy_30d >= 6,
  },
  {
    id: 'stat-stress',
    label: 'Avg Stress',
    value: stats.avg_stress_30d.toFixed(1),
    sub: 'out of 10',
    icon: Activity,
    color: stats.avg_stress_30d > 6 ? 'text-rose-500' : 'text-emerald-500',
    bg: stats.avg_stress_30d > 6 ? 'bg-rose-100 dark:bg-rose-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30',
    isWarning: stats.avg_stress_30d > 6,
  },
  {
    id: 'stat-journal',
    label: 'Journal Entries',
    value: stats.journal_entries_count.toString(),
    sub: 'total',
    icon: BookOpen,
    color: 'text-orange-500',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
  },
  {
    id: 'stat-streak',
    label: 'Day Streak',
    value: stats.streak_days.toString(),
    sub: 'consecutive',
    icon: Calendar,
    color: 'text-amber-500',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
  },
];

export default function StatsStripCard({ stats }: StatsStripCardProps) {
  const items = statItems(stats);

  return (
    <div className="wellness-card" data-testid="stats-strip-card">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground font-heading">
          30-Day Overview
        </p>
        <span className="text-xs text-muted-foreground">Last updated just now</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.id} className="flex items-center gap-3">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', item.bg)}>
                <Icon size={16} strokeWidth={1.5} className={item.color} />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-heading font-semibold text-lg text-foreground tabular-nums leading-tight">
                    {item.value}
                  </span>
                  {item.isWarning && (
                    <TrendingUp size={12} className="text-rose-500" />
                  )}
                  {item.isGood && (
                    <TrendingUp size={12} className="text-emerald-500" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-tight">{item.label}</p>
                <p className="text-[10px] text-muted-foreground/70">{item.sub}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}