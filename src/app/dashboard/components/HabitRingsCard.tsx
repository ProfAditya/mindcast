'use client';

import React from 'react';
import { ArrowRight, Activity } from 'lucide-react';
import Link from 'next/link';

interface HabitRingsCardProps {
  habits: unknown[];
}

export default function HabitRingsCard({ habits }: HabitRingsCardProps) {
  return (
    <div className="wellness-card h-full" data-testid="habit-rings-card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground font-heading mb-1">
            Today&apos;s Habits
          </p>
          <p className="font-heading font-semibold text-base text-foreground">
            Track your habits
          </p>
        </div>
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
          <Activity size={15} strokeWidth={1.5} className="text-primary" />
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Log your daily habits to see your progress here.
      </p>

      <Link
        href="/habits"
        className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline font-heading"
        data-testid="view-habits-link"
      >
        Go to Habit Tracker <ArrowRight size={12} strokeWidth={1.5} />
      </Link>
    </div>
  );
}