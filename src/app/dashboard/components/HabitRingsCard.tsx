'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Habit {
  id: string;
  type: string;
  label: string;
  value: number;
  unit: string;
  target: number;
  completed: boolean;
  color: string;
}

interface HabitRingsCardProps {
  habits: Habit[];
}

const colorMap: Record<string, { ring: string; bg: string; text: string }> = {
  sky: { ring: 'stroke-sky-400', bg: 'bg-sky-100 dark:bg-sky-900/30', text: 'text-sky-700 dark:text-sky-300' },
  fuchsia: { ring: 'stroke-fuchsia-400', bg: 'bg-fuchsia-100 dark:bg-fuchsia-900/30', text: 'text-fuchsia-700 dark:text-fuchsia-300' },
  emerald: { ring: 'stroke-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' },
  cyan: { ring: 'stroke-cyan-400', bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-300' },
};

function HabitRing({ habit, onToggle }: { habit: Habit; onToggle: (id: string) => void }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(habit.value / habit.target, 1);
  const strokeDashoffset = circumference * (1 - progress);
  const colors = colorMap[habit.color] ?? colorMap.sky;

  return (
    <motion.button
      onClick={() => onToggle(habit.id)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-200 w-full',
        habit.completed ? colors.bg : 'bg-muted/50 hover:bg-muted'
      )}
      data-testid={`habit-ring-${habit.type}`}
    >
      {/* Ring SVG */}
      <div className="relative w-14 h-14">
        <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
          {/* Background ring */}
          <circle
            cx="28" cy="28" r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth="4"
          />
          {/* Progress ring */}
          <circle
            cx="28" cy="28" r={radius}
            fill="none"
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={cn('transition-all duration-500', colors.ring)}
          />
        </svg>
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          {habit.completed ? (
            <Check size={16} strokeWidth={2} className={colors.text} />
          ) : (
            <span className="text-xs font-semibold font-heading tabular-nums text-muted-foreground">
              {Math.round(progress * 100)}%
            </span>
          )}
        </div>
      </div>

      <div className="text-center">
        <p className="text-xs font-semibold font-heading text-foreground leading-tight">{habit.label}</p>
        <p className="text-[10px] text-muted-foreground tabular-nums">
          {habit.value}/{habit.target} {habit.unit}
        </p>
      </div>
    </motion.button>
  );
}

export default function HabitRingsCard({ habits }: HabitRingsCardProps) {
  const [localHabits, setLocalHabits] = useState(habits);
  const completedCount = localHabits.filter((h) => h.completed).length;

  const handleToggle = (id: string) => {
    // Backend: POST /api/habit-logs with updated completion status
    setLocalHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, completed: !h.completed } : h))
    );
  };

  const hasIncomplete = completedCount < localHabits.length;

  return (
    <div className={cn('wellness-card h-full', hasIncomplete && 'border-amber-200 dark:border-amber-900/40')} data-testid="habit-rings-card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground font-heading mb-1">
            Today&apos;s Habits
          </p>
          <p className="font-heading font-semibold text-base text-foreground">
            {completedCount}/{localHabits.length} done
          </p>
        </div>
        {hasIncomplete && (
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 font-heading">
            In progress
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {localHabits.map((habit) => (
          <HabitRing key={habit.id} habit={habit} onToggle={handleToggle} />
        ))}
      </div>

      <Link
        href="/habits"
        className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline font-heading"
        data-testid="view-habits-link"
      >
        View all habits <ArrowRight size={12} strokeWidth={1.5} />
      </Link>
    </div>
  );
}