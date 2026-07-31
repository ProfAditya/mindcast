'use client';

import React from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';

interface WellnessRadialChartProps {
  score: number;
}

export default function WellnessRadialChart({ score }: WellnessRadialChartProps) {
  const percentage = (score / 9) * 100;

  const data = [
    { name: 'score', value: percentage, fill: 'var(--primary)' },
  ];

  return (
    <div className="relative w-40 h-40">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="65%"
          outerRadius="90%"
          startAngle={90}
          endAngle={-270}
          data={data}
          barSize={10}
        >
          <RadialBar
            background={{ fill: 'var(--muted)' }}
            dataKey="value"
            cornerRadius={10}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      {/* Center Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading font-semibold text-3xl text-foreground tabular-nums">
          {score.toFixed(1)}
        </span>
        <span className="text-xs text-muted-foreground font-medium">/9.0</span>
      </div>
    </div>
  );
}