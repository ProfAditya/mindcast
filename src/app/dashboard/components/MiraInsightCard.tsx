'use client';

import React from 'react';
import { Sparkles, ArrowRight, TrendingUp, TrendingDown, Minus, Brain, Moon, Zap, Heart, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface SectorScore {
  key: string;
  label: string;
  score: number;
}

interface MiraInsightCardProps {
  insight: string | null;
  overallScore?: number;
  scoreTrend?: 'improving' | 'declining' | 'stable' | string;
  sectorScores?: SectorScore[];
  latestAdvice?: string | null;
}

const SECTOR_ICONS: Record<string, React.ReactNode> = {
  stress: <Zap size={12} strokeWidth={1.5} />,
  sleep: <Moon size={12} strokeWidth={1.5} />,
  work_study: <Briefcase size={12} strokeWidth={1.5} />,
  emotional: <Heart size={12} strokeWidth={1.5} />,
  psychology: <Brain size={12} strokeWidth={1.5} />,
  lifestyle: <Sparkles size={12} strokeWidth={1.5} />,
};

const SECTOR_COLORS: Record<string, string> = {
  stress: 'text-rose-500 bg-rose-500/10',
  sleep: 'text-indigo-500 bg-indigo-500/10',
  work_study: 'text-amber-500 bg-amber-500/10',
  emotional: 'text-violet-500 bg-violet-500/10',
  psychology: 'text-violet-500 bg-violet-500/10',
  lifestyle: 'text-emerald-500 bg-emerald-500/10',
};

function getScoreColor(score: number): string {
  if (score >= 75) return 'text-emerald-500';
  if (score >= 55) return 'text-violet-500';
  if (score >= 35) return 'text-amber-500';
  return 'text-rose-500';
}

function getScoreBarColor(score: number): string {
  if (score >= 75) return '#10b981';
  if (score >= 55) return '#8b5cf6';
  if (score >= 35) return '#f59e0b';
  return '#ef4444';
}

// Generate a contextual Mira insight based on assessment data
function generateMiraInsight(
  overallScore: number,
  scoreTrend: string,
  sectorScores: SectorScore[]
): string {
  const lowest = sectorScores.length > 0
    ? sectorScores.reduce((min, s) => (s.score < min.score ? s : min))
    : null;
  const highest = sectorScores.length > 0
    ? sectorScores.reduce((max, s) => (s.score > max.score ? s : max))
    : null;

  if (scoreTrend === 'improving' && overallScore >= 65) {
    return `Your wellness is genuinely moving in the right direction — I can see it in your scores. ${highest ? `Your ${highest.label} is a real strength right now.` : ''} Keep protecting what's working.`;
  }
  if (scoreTrend === 'declining') {
    return `I've noticed your scores have been shifting lately. ${lowest ? `Your ${lowest.label} (${lowest.score}%) is asking for some attention.` : ''} Let's talk about what's been changing — I'm here.`;
  }
  if (lowest && lowest.score < 45) {
    return `Your ${lowest.label} score (${lowest.score}%) stands out as an area that needs care. ${highest ? `You're doing well in ${highest.label} — that's a foundation to build from.` : ''} Want to explore what might help?`;
  }
  if (overallScore >= 75) {
    return `You're in a genuinely strong place right now — ${overallScore}/100 is something to acknowledge. ${highest ? `Your ${highest.label} is thriving.` : ''} What would you like to deepen from here?`;
  }
  return `Your overall wellness is at ${overallScore}/100. ${lowest ? `Focusing on ${lowest.label} could make the biggest difference right now.` : ''} I'm here whenever you want to explore this together.`;
}

export default function MiraInsightCard({
  insight,
  overallScore,
  scoreTrend,
  sectorScores = [],
  latestAdvice,
}: MiraInsightCardProps) {
  const hasAssessmentData = overallScore != null && sectorScores.length > 0;
  const TrendIcon = scoreTrend === 'improving' ? TrendingUp : scoreTrend === 'declining' ? TrendingDown : Minus;
  const trendColor = scoreTrend === 'improving' ? 'text-emerald-500' : scoreTrend === 'declining' ? 'text-rose-500' : 'text-muted-foreground';
  const trendLabel = scoreTrend === 'improving' ? 'Improving' : scoreTrend === 'declining' ? 'Needs attention' : 'Stable';

  const displayInsight = insight
    || (hasAssessmentData ? generateMiraInsight(overallScore!, scoreTrend ?? 'stable', sectorScores) : null);

  return (
    <div className="wellness-card h-full relative overflow-hidden" data-testid="mira-insight-card">
      {/* Gradient accent */}
      <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-primary/5 -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full gradient-violet-rose flex items-center justify-center shrink-0">
              <Sparkles size={13} strokeWidth={1.5} className="text-white" />
            </div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground font-heading">
              Mira&apos;s Insight
            </p>
          </div>
          {overallScore != null && (
            <div className="flex items-center gap-1.5">
              <TrendIcon size={12} strokeWidth={1.5} className={trendColor} />
              <span className={cn('text-[10px] font-semibold font-heading', trendColor)}>{trendLabel}</span>
            </div>
          )}
        </div>

        {/* Overall Score Display */}
        {overallScore != null && (
          <div className="flex items-center gap-3 mb-3 p-3 rounded-xl bg-muted/50 border border-border/50">
            <div className="relative w-10 h-10 shrink-0">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted" />
                <circle
                  cx="20" cy="20" r="16"
                  fill="none"
                  stroke="url(#miniGrad)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${(overallScore / 100) * 100.5} 100.5`}
                />
                <defs>
                  <linearGradient id="miniGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={cn('text-[10px] font-bold font-heading', getScoreColor(overallScore))}>{overallScore}</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground font-heading uppercase tracking-wide">Wellness Score</p>
              <p className={cn('text-sm font-bold font-heading', getScoreColor(overallScore))}>
                {overallScore >= 75 ? 'Thriving' : overallScore >= 60 ? 'Balanced' : overallScore >= 40 ? 'Needs Attention' : 'At Risk'}
              </p>
            </div>
          </div>
        )}

        {/* Sector Scores */}
        {sectorScores.length > 0 && (
          <div className="space-y-1.5 mb-3">
            {sectorScores.slice(0, 4).map((sector) => (
              <div key={sector.key} className="flex items-center gap-2">
                <div className={cn('w-5 h-5 rounded-md flex items-center justify-center shrink-0', SECTOR_COLORS[sector.key] ?? 'text-muted-foreground bg-muted')}>
                  {SECTOR_ICONS[sector.key] ?? <Sparkles size={10} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] text-muted-foreground font-heading truncate">{sector.label}</span>
                    <span className={cn('text-[10px] font-bold font-heading shrink-0 ml-1', getScoreColor(sector.score))}>{sector.score}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${sector.score}%`, backgroundColor: getScoreBarColor(sector.score) }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mira's Insight Text */}
        {displayInsight ? (
          <blockquote className="font-serif text-sm leading-relaxed text-foreground italic mb-3 flex-1">
            &ldquo;{displayInsight}&rdquo;
          </blockquote>
        ) : (
          <p className="text-sm text-muted-foreground leading-relaxed mb-3 flex-1">
            Complete a wellness assessment to unlock Mira&apos;s personalised insights based on your data.
          </p>
        )}

        {/* Latest Advice Preview */}
        {latestAdvice && (
          <div className="mb-3 p-2.5 rounded-xl bg-primary/5 border border-primary/10">
            <p className="text-[10px] font-semibold font-heading text-primary uppercase tracking-wide mb-1">Latest Advice</p>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{latestAdvice}</p>
          </div>
        )}

        <div className="flex items-center gap-3 mt-auto">
          <Link
            href="/ai-chat-with-mira"
            className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline font-heading"
            data-testid="chat-mira-insight-link"
          >
            Chat with Mira <ArrowRight size={12} strokeWidth={1.5} />
          </Link>
          {!hasAssessmentData && (
            <Link
              href="/wellness-assessment"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-medium hover:text-foreground transition-colors font-heading"
            >
              Take Assessment <ArrowRight size={12} strokeWidth={1.5} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}