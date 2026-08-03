'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, TrendingUp, TrendingDown, Minus, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { AssessmentResult } from '@/lib/api';

interface AssessmentHistoryCardProps {
  history: AssessmentResult[];
  loading?: boolean;
}

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ');
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getTrendIcon(history: AssessmentResult[]) {
  if (history.length < 2) return null;
  const latest = history[history.length - 1]?.overall_score ?? 0;
  const prev = history[history.length - 2]?.overall_score ?? 0;
  const diff = latest - prev;
  if (diff > 3) return { icon: TrendingUp, color: 'text-wellness-emerald', label: `+${diff.toFixed(0)} pts` };
  if (diff < -3) return { icon: TrendingDown, color: 'text-rose-500', label: `${diff.toFixed(0)} pts` };
  return { icon: Minus, color: 'text-wellness-amber', label: 'Stable' };
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-lg text-xs">
        <p className="text-muted-foreground mb-0.5">{label}</p>
        <p className="font-700 font-heading text-primary">{payload[0].value}<span className="text-muted-foreground font-normal">/100</span></p>
      </div>
    );
  }
  return null;
};

export default function AssessmentHistoryCard({ history, loading }: AssessmentHistoryCardProps) {
  const chartData = history.map((a) => ({
    date: formatDate(a.created_at),
    score: a.overall_score ?? 0,
  }));

  const trend = getTrendIcon(history);
  const latestScore = history.length > 0 ? (history[history.length - 1]?.overall_score ?? null) : null;

  const sectorColors: Record<string, string> = {
    stress: 'bg-rose-500',
    sleep: 'bg-sky-500',
    psychology: 'bg-violet-500',
    lifestyle: 'bg-emerald-500',
  };

  const latestEntry = history.length > 0 ? history[history.length - 1] : null;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <ClipboardList size={15} strokeWidth={2} className="text-primary" />
          </div>
          <div>
            <h3 className="font-heading font-700 text-sm text-foreground">Assessment History</h3>
            <p className="text-xs text-muted-foreground">Wellness score over time</p>
          </div>
        </div>
        <Link
          href="/wellness-assessment"
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-semibold"
        >
          Take Assessment
          <ArrowUpRight size={12} strokeWidth={2} />
        </Link>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col gap-3">
          <div className="h-24 rounded-xl skeleton-shimmer" />
          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-10 rounded-lg skeleton-shimmer" />)}
          </div>
        </div>
      ) : history.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-4">
          <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center">
            <ClipboardList size={20} strokeWidth={1.5} className="text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">No assessments yet</p>
            <p className="text-xs text-muted-foreground mt-0.5">Take your first wellness assessment to track progress</p>
          </div>
          <Link href="/wellness-assessment" className="btn-primary text-xs py-2 px-4">
            Start Assessment
          </Link>
        </div>
      ) : (
        <>
          {/* Score + Trend */}
          <div className="flex items-center gap-4">
            <div>
              <p className="text-3xl font-heading font-700 text-foreground leading-none">
                {latestScore ?? '—'}
                <span className="text-base text-muted-foreground font-normal">/100</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Latest score</p>
            </div>
            {trend && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn('flex items-center gap-1 text-xs font-semibold', trend.color)}
              >
                <trend.icon size={14} strokeWidth={2} />
                {trend.label}
              </motion.div>
            )}
            <div className="ml-auto text-right">
              <p className="text-xs text-muted-foreground">{history.length} assessment{history.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* Line Chart */}
          {chartData.length >= 2 && (
            <div className="h-24 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: 'var(--primary)', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: 'var(--primary)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Sector Breakdown of Latest */}
          {latestEntry && (
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Stress', value: latestEntry.stress_score, key: 'stress' },
                { label: 'Sleep', value: latestEntry.sleep_score, key: 'sleep' },
                { label: 'Psych', value: latestEntry.psychology_score, key: 'psychology' },
                { label: 'Lifestyle', value: latestEntry.lifestyle_score, key: 'lifestyle' },
              ].map((sector) => (
                <div key={sector.key} className="rounded-xl bg-muted/40 p-2.5 text-center">
                  <div className={cn('w-1.5 h-1.5 rounded-full mx-auto mb-1.5', sectorColors[sector.key])} />
                  <p className="text-sm font-700 font-heading text-foreground leading-none">{sector.value ?? '—'}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{sector.label}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
