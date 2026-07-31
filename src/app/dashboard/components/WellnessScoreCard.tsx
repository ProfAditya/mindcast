'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getWellnessStage } from '@/lib/utils';

const WellnessRadialChart = dynamic(() => import('./WellnessRadialChart'), { ssr: false });

interface WellnessScoreCardProps {
  score: number;
  trend: string;
}

export default function WellnessScoreCard({ score, trend }: WellnessScoreCardProps) {
  const stage = getWellnessStage(score);

  const stageColorMap: Record<string, string> = {
    emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30',
    green: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
    amber: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30',
    sky: 'text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/30',
    slate: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800',
  };

  const TrendIcon = trend === 'improving' ? TrendingUp : trend === 'declining' ? TrendingDown : Minus;
  const trendColor = trend === 'improving' ? 'text-emerald-500' : trend === 'declining' ? 'text-rose-500' : 'text-muted-foreground';

  return (
    <div className="wellness-card h-full flex flex-col min-h-[280px]" data-testid="wellness-score-card">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground font-heading">
            Wellness Score
          </p>
        </div>
        <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full font-heading', stageColorMap[stage.color])}>
          {stage.stage}
        </span>
      </div>

      {/* Radial Chart */}
      <div className="flex-1 flex items-center justify-center py-2">
        <WellnessRadialChart score={score} />
      </div>

      {/* Score Info */}
      <div className="mt-auto space-y-3">
        <div className="flex items-center gap-2">
          <TrendIcon size={14} strokeWidth={1.5} className={trendColor} />
          <span className="text-xs text-muted-foreground capitalize">
            {trend === 'improving' ? 'Improving this month' : trend === 'declining' ? 'Needs attention' : 'Stable'}
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          You&apos;re <span className="text-foreground font-medium">{stage.label}</span> — your sleep and exercise patterns are your biggest strengths right now.
        </p>
        <button className="text-xs text-primary font-medium hover:underline flex items-center gap-1 font-heading">
          View full assessment
        </button>
      </div>
    </div>
  );
}