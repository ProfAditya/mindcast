'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface MoodDataPoint {
  date: string;
  energy: number;
  stress: number;
  mood: string;
}

interface MoodTrendChartProps {
  data: MoodDataPoint[];
  loading?: boolean;
}

interface TooltipPayload {
  value: number;
  name: string;
  color: string;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-card-md text-xs space-y-1.5 min-w-[120px]">
      <p className="font-semibold text-foreground font-heading">{label}</p>
      {payload.map((entry) => (
        <div key={`tooltip-${entry.name}`} className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground capitalize">{entry.name}</span>
          <span className="font-semibold tabular-nums" style={{ color: entry.color }}>
            {entry.value}/10
          </span>
        </div>
      ))}
    </div>
  );
}

export default function MoodTrendChart({ data, loading = false }: MoodTrendChartProps) {
  return (
    <div className="wellness-card h-full" data-testid="mood-trend-chart">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground font-heading mb-1">
            Energy & Stress
          </p>
          <p className="font-heading font-semibold text-base text-foreground">14-Day Trend</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded-full bg-violet-500 inline-block" />
            Energy
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded-full bg-rose-400 inline-block" />
            Stress
          </span>
        </div>
      </div>
      <div className="h-48">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-full h-full bg-muted/30 rounded-xl animate-pulse" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--wellness-violet)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--wellness-violet)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="stressGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--wellness-rose)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--wellness-rose)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
                interval={2}
              />
              <YAxis
                domain={[0, 10]}
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
                tickCount={5}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="energy"
                stroke="var(--wellness-violet)"
                strokeWidth={2}
                fill="url(#energyGrad)"
                dot={false}
                activeDot={{ r: 4, fill: 'var(--wellness-violet)', strokeWidth: 0 }}
              />
              <Area
                type="monotone"
                dataKey="stress"
                stroke="var(--wellness-rose)"
                strokeWidth={2}
                fill="url(#stressGrad)"
                dot={false}
                activeDot={{ r: 4, fill: 'var(--wellness-rose)', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}