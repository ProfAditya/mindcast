'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Flame, Star, Zap, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Icon from '@/components/ui/AppIcon';


interface Challenge {
  id: string;
  title: string;
  description: string;
  duration: number;
  category: string;
  emoji: string;
  color: string;
  progress: number;
  enrolled: boolean;
  completed: boolean;
  reward: string;
}

const CHALLENGES: Challenge[] = [
  {
    id: '1', title: '30 Day Happiness', description: 'Log your mood daily and complete one gratitude journal entry every day for 30 days.',
    duration: 30, category: 'Mood', emoji: '😊', color: 'amber', progress: 12, enrolled: true, completed: false, reward: '300 XP + Happiness Badge',
  },
  {
    id: '2', title: '21 Day Meditation', description: 'Meditate for at least 10 minutes every day for 21 consecutive days.',
    duration: 21, category: 'Mindfulness', emoji: '🧘', color: 'violet', progress: 8, enrolled: true, completed: false, reward: '210 XP + Zen Master Badge',
  },
  {
    id: '3', title: '7 Day Focus Challenge', description: 'Complete at least 4 Pomodoro sessions daily for 7 days straight.',
    duration: 7, category: 'Productivity', emoji: '🎯', color: 'sky', progress: 0, enrolled: false, completed: false, reward: '70 XP + Focus Badge',
  },
  {
    id: '4', title: 'Gratitude Challenge', description: 'Write 3 things you\'re grateful for every morning for 14 days.',
    duration: 14, category: 'Journal', emoji: '🙏', color: 'emerald', progress: 14, enrolled: true, completed: true, reward: '140 XP + Gratitude Badge',
  },
  {
    id: '5', title: 'Digital Detox', description: 'Limit screen time to under 2 hours daily for 7 days.',
    duration: 7, category: 'Wellness', emoji: '📵', color: 'rose', progress: 0, enrolled: false, completed: false, reward: '70 XP + Detox Badge',
  },
  {
    id: '6', title: 'Sleep Consistency', description: 'Maintain a consistent sleep schedule (±30 min) for 14 days.',
    duration: 14, category: 'Sleep', emoji: '🌙', color: 'indigo', progress: 5, enrolled: true, completed: false, reward: '140 XP + Sleep Champion Badge',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

export default function ChallengesContent() {
  const [challenges, setChallenges] = useState<Challenge[]>(CHALLENGES);
  const [filter, setFilter] = useState<'all' | 'active' | 'available' | 'completed'>('all');

  const enroll = (id: string) => {
    setChallenges((prev) => prev.map((c) => c.id === id ? { ...c, enrolled: true } : c));
    toast.success('Challenge started! 🎯 You\'ve got this!');
  };

  const filtered = challenges.filter((c) => {
    if (filter === 'active') return c.enrolled && !c.completed;
    if (filter === 'available') return !c.enrolled && !c.completed;
    if (filter === 'completed') return c.completed;
    return true;
  });

  const activeChallenges = challenges.filter((c) => c.enrolled && !c.completed).length;
  const completedChallenges = challenges.filter((c) => c.completed).length;
  const totalXP = challenges.filter((c) => c.completed).reduce((s) => s + 100, 0);

  return (
    <div className="px-5 lg:px-8 xl:px-10 py-7 pb-24 lg:pb-8 max-w-screen-xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-7">
        <div className="flex items-center gap-2 mb-1">
          <Trophy size={20} strokeWidth={1.5} className="text-primary" />
          <h1 className="font-heading font-bold text-2xl lg:text-3xl text-foreground tracking-tight">Challenges</h1>
        </div>
        <p className="text-muted-foreground text-sm">Build lasting habits through structured challenges. Earn XP and badges.</p>
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-5">
        {/* Stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4">
          {[
            { label: 'Active', value: activeChallenges, icon: Flame, color: 'text-amber-500', bg: 'bg-amber-500/10' },
            { label: 'Completed', value: completedChallenges, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { label: 'Total XP', value: `${totalXP + 280}`, icon: Zap, color: 'text-violet-500', bg: 'bg-violet-500/10' },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', s.bg)}>
                  <Icon size={16} strokeWidth={1.5} className={s.color} />
                </div>
                <div>
                  <p className="text-xl font-bold font-heading text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Filter Tabs */}
        <motion.div variants={itemVariants} className="flex gap-1 p-1 rounded-xl border border-border bg-card w-fit">
          {(['all', 'active', 'available', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-4 py-1.5 rounded-lg text-xs font-semibold font-heading transition-all capitalize',
                filter === f ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {f}
            </button>
          ))}
        </motion.div>

        {/* Challenge Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((challenge) => {
            const pct = Math.round((challenge.progress / challenge.duration) * 100);
            return (
              <div
                key={challenge.id}
                className={cn(
                  'rounded-2xl border bg-card p-5 transition-all duration-200',
                  challenge.completed
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : challenge.enrolled
                    ? 'border-primary/20 hover:border-primary/40' :'border-border hover:border-muted-foreground/30'
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{challenge.emoji}</span>
                    <div>
                      <p className="text-sm font-semibold font-heading text-foreground">{challenge.title}</p>
                      <span className={`text-xs font-medium text-${challenge.color}-600 dark:text-${challenge.color}-400`}>{challenge.category}</span>
                    </div>
                  </div>
                  {challenge.completed && (
                    <CheckCircle2 size={18} strokeWidth={1.5} className="text-emerald-500 shrink-0" />
                  )}
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed mb-3">{challenge.description}</p>

                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <Clock size={11} strokeWidth={1.5} />
                  <span>{challenge.duration} days</span>
                  <span className="mx-1">·</span>
                  <Star size={11} strokeWidth={1.5} />
                  <span>{challenge.reward}</span>
                </div>

                {challenge.enrolled && !challenge.completed && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold font-heading text-foreground">{challenge.progress}/{challenge.duration} days</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-border">
                      <div
                        className={`h-full rounded-full bg-${challenge.color}-500 transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )}

                {!challenge.enrolled && !challenge.completed && (
                  <button
                    onClick={() => enroll(challenge.id)}
                    className="w-full py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold font-heading hover:bg-primary/20 transition-colors"
                  >
                    Start Challenge
                  </button>
                )}

                {challenge.completed && (
                  <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 size={13} strokeWidth={2} />
                    Completed!
                  </div>
                )}

                {challenge.enrolled && !challenge.completed && (
                  <div className="flex items-center gap-2 text-xs text-primary font-semibold">
                    <Flame size={13} strokeWidth={2} />
                    {challenge.progress} day streak
                  </div>
                )}
              </div>
            );
          })}
        </motion.div>
      </motion.div>
    </div>
  );
}
