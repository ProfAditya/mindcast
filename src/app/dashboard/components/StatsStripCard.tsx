'use client';

import React from 'react';
import { Activity, Brain, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DashboardStats } from '@/lib/api';
import Icon from '@/components/ui/AppIcon';


interface StatsStripCardProps {
  stats: DashboardStats | null;
}

export default function StatsStripCard({ stats }: StatsStripCardProps) {
  if (!stats) {
    return (
      <div className="wellness-card" data-testid="stats-strip-card">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-xl skeleton-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  const items = [
    {
      id: 'stat-mood',
      label: 'Mood Check-ins',
      value: stats.mood_check_ins_30d?.toString() ?? '—',
      sub: 'last 30 days',
      icon: Brain,
      color: 'text-rose-500',
      bg: 'bg-rose-100 dark:bg-rose-900/30',
    },
    {
      id: 'stat-energy',
      label: 'Avg Energy',
      value: stats.avg_energy_30d != null ? stats.avg_energy_30d.toFixed(1) : '—',
      sub: 'out of 10',
      icon: Activity,
      color: 'text-violet-500',
      bg: 'bg-violet-100 dark:bg-violet-900/30',
    },
    {
      id: 'stat-stress',
      label: 'Avg Stress',
      value: stats.avg_stress_30d != null ? stats.avg_stress_30d.toFixed(1) : '—',
      sub: 'out of 10',
      icon: Activity,
      color: stats.avg_stress_30d != null && stats.avg_stress_30d > 6 ? 'text-rose-500' : 'text-emerald-500',
      bg: stats.avg_stress_30d != null && stats.avg_stress_30d > 6 ? 'bg-rose-100 dark:bg-rose-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30',
    },
    {
      id: 'stat-journal',
      label: 'Journal Entries',
      value: stats.journal_entries_count?.toString() ?? '—',
      sub: 'total',
      icon: BookOpen,
      color: 'text-orange-500',
      bg: 'bg-orange-100 dark:bg-orange-900/30',
    },
  ];

  return (
    <div className="wellness-card" data-testid="stats-strip-card">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground font-heading">
          30-Day Overview
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.id} className="flex items-center gap-3">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', item.bg)}>
                <Icon size={16} strokeWidth={1.5} className={item.color} />
              </div>
              <div>
                <span className="font-heading font-semibold text-lg text-foreground tabular-nums leading-tight">
                  {item.value}
                </span>
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