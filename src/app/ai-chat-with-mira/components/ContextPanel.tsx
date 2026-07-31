'use client';

import React from 'react';
import { X, TrendingUp, Activity, Brain, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserContext } from '@/lib/api';

interface ContextPanelProps {
  context: UserContext | null;
  onClose: () => void;
}

export default function ContextPanel({ context, onClose }: ContextPanelProps) {
  const moodAvg = context?.mood_averages;

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
        {!context ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No context available yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Complete an assessment to unlock personalized context.</p>
          </div>
        ) : (
          <>
            {/* Mood Averages */}
            {moodAvg && (
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground font-heading">
                  30-Day Averages
                </p>
                {moodAvg.avg_energy != null && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-violet-100 dark:bg-violet-900/30 shrink-0">
                      <Zap size={14} strokeWidth={1.5} className="text-violet-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Avg Energy</span>
                        <span className="text-xs font-semibold font-heading text-foreground tabular-nums">
                          {moodAvg.avg_energy.toFixed(1)}/10
                        </span>
                      </div>
                      <div className="h-1 rounded-full bg-border overflow-hidden">
                        <div className="h-full rounded-full bg-violet-400" style={{ width: `${(moodAvg.avg_energy / 10) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                )}
                {moodAvg.avg_stress != null && (
                  <div className="flex items-center gap-3">
                    <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', moodAvg.avg_stress > 6 ? 'bg-rose-100 dark:bg-rose-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30')}>
                      <Activity size={14} strokeWidth={1.5} className={moodAvg.avg_stress > 6 ? 'text-rose-500' : 'text-emerald-500'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Avg Stress</span>
                        <span className="text-xs font-semibold font-heading text-foreground tabular-nums">
                          {moodAvg.avg_stress.toFixed(1)}/10
                        </span>
                      </div>
                      <div className="h-1 rounded-full bg-border overflow-hidden">
                        <div className={cn('h-full rounded-full', moodAvg.avg_stress > 6 ? 'bg-rose-400' : 'bg-emerald-400')} style={{ width: `${(moodAvg.avg_stress / 10) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                )}
                {moodAvg.dominant_mood && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-rose-100 dark:bg-rose-900/30 shrink-0">
                      <Brain size={14} strokeWidth={1.5} className="text-rose-500" />
                    </div>
                    <div className="flex-1">
                      <span className="text-xs text-muted-foreground">Dominant Mood</span>
                      <p className="text-sm font-semibold font-heading text-foreground capitalize">{moodAvg.dominant_mood}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Strengths */}
            {context.assessment_strengths && context.assessment_strengths.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground font-heading">Strengths</p>
                {context.assessment_strengths.map((s) => (
                  <div key={s} className="rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={12} strokeWidth={1.5} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 font-heading">{s}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Improvement Areas */}
            {context.improvement_areas && context.improvement_areas.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground font-heading">Focus Areas</p>
                {context.improvement_areas.map((area) => (
                  <div key={area} className="rounded-xl bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/30 px-3 py-2.5">
                    <p className="text-sm font-semibold text-rose-700 dark:text-rose-300 font-heading">{area}</p>
                  </div>
                ))}
              </div>
            )}

            <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
              Mira reads this context before every response to give you personalized guidance.
            </p>
          </>
        )}
      </div>
    </div>
  );
}