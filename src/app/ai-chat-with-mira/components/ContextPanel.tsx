'use client';

import React from 'react';
import { X, TrendingUp, Activity, Brain, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getWellnessStage } from '@/lib/utils';
import Icon from '@/components/ui/AppIcon';


interface WellnessContext {
  wellness_score: number;
  dominant_mood: string;
  avg_energy: number;
  avg_stress: number;
  streak_days: number;
  top_strength: string;
  focus_area: string;
}

interface ContextPanelProps {
  context: WellnessContext;
  onClose: () => void;
}

export default function ContextPanel({ context, onClose }: ContextPanelProps) {
  const stage = getWellnessStage(context.wellness_score);

  const stageColorMap: Record<string, { badge: string; bar: string }> = {
    emerald: { badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', bar: 'bg-emerald-400' },
    green: { badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', bar: 'bg-green-400' },
    amber: { badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', bar: 'bg-amber-400' },
    sky: { badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300', bar: 'bg-sky-400' },
    slate: { badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', bar: 'bg-slate-400' },
  };

  const colors = stageColorMap[stage.color] ?? stageColorMap.slate;

  const metrics = [
    {
      id: 'ctx-energy',
      label: 'Avg Energy',
      value: context.avg_energy.toFixed(1),
      unit: '/10',
      icon: Zap,
      color: 'text-violet-500',
      bg: 'bg-violet-100 dark:bg-violet-900/30',
      barWidth: (context.avg_energy / 10) * 100,
      barColor: 'bg-violet-400',
    },
    {
      id: 'ctx-stress',
      label: 'Avg Stress',
      value: context.avg_stress.toFixed(1),
      unit: '/10',
      icon: Activity,
      color: context.avg_stress > 6 ? 'text-rose-500' : 'text-emerald-500',
      bg: context.avg_stress > 6 ? 'bg-rose-100 dark:bg-rose-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30',
      barWidth: (context.avg_stress / 10) * 100,
      barColor: context.avg_stress > 6 ? 'bg-rose-400' : 'bg-emerald-400',
    },
    {
      id: 'ctx-mood',
      label: 'Dominant Mood',
      value: context.dominant_mood,
      unit: '',
      icon: Brain,
      color: 'text-rose-500',
      bg: 'bg-rose-100 dark:bg-rose-900/30',
      barWidth: 70,
      barColor: 'bg-rose-400',
    },
  ];

  return (
    <div className="w-80 h-full flex flex-col bg-card overflow-y-auto scrollbar-thin">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground font-heading">
            Wellness Context
          </p>
          <p className="text-sm font-semibold text-foreground font-heading mt-0.5">
            What Mira knows
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          data-testid="close-context-panel"
        >
          <X size={15} strokeWidth={1.5} />
        </button>
      </div>

      <div className="flex-1 px-5 py-5 space-y-5">
        {/* Wellness Score */}
        <div className="rounded-2xl bg-muted/50 border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground font-heading uppercase tracking-wider">
              Wellness Score
            </span>
            <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full font-heading', colors.badge)}>
              {stage.stage}
            </span>
          </div>
          <div className="flex items-end gap-2 mb-2">
            <span className="font-heading font-semibold text-3xl text-foreground tabular-nums">
              {context.wellness_score.toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground mb-1">/9.0</span>
          </div>
          <div className="h-1.5 rounded-full bg-border overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', colors.bar)}
              style={{ width: `${(context.wellness_score / 9) * 100}%` }}
            />
          </div>
        </div>

        {/* Metrics */}
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground font-heading">
            30-Day Averages
          </p>
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.id} className="flex items-center gap-3">
                <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', metric.bg)}>
                  <Icon size={14} strokeWidth={1.5} className={metric.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">{metric.label}</span>
                    <span className="text-xs font-semibold font-heading text-foreground tabular-nums capitalize">
                      {metric.value}{metric.unit}
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-border overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', metric.barColor)}
                      style={{ width: `${metric.barWidth}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Streak */}
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/10 p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} strokeWidth={1.5} className="text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-medium text-amber-700 dark:text-amber-300 font-heading">
              Active Streak
            </span>
          </div>
          <p className="font-heading font-semibold text-2xl text-amber-700 dark:text-amber-300 tabular-nums">
            {context.streak_days} days
          </p>
          <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-0.5">
            Keep showing up
          </p>
        </div>

        {/* Strengths & Focus */}
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground font-heading">
            Profile Summary
          </p>
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30 px-3 py-2.5">
            <p className="text-xs text-muted-foreground mb-0.5">Top Strength</p>
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 font-heading">
              {context.top_strength}
            </p>
          </div>
          <div className="rounded-xl bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/30 px-3 py-2.5">
            <p className="text-xs text-muted-foreground mb-0.5">Focus Area</p>
            <p className="text-sm font-semibold text-rose-700 dark:text-rose-300 font-heading">
              {context.focus_area}
            </p>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
          Mira reads this context before every response to give you personalized guidance.
        </p>
      </div>
    </div>
  );
}