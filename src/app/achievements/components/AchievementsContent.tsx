'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Zap, Shield, Flame, Heart, Brain, Moon, BookOpen, Target, Lock, CheckCircle2, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import Icon from '@/components/ui/AppIcon';


interface Badge {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  earned: boolean;
  earnedDate?: string;
  xp: number;
  category: string;
}

interface Level {
  level: number;
  title: string;
  minXP: number;
  maxXP: number;
  color: string;
}

const LEVELS: Level[] = [
  { level: 1, title: 'Seeker', minXP: 0, maxXP: 100, color: 'emerald' },
  { level: 2, title: 'Explorer', minXP: 100, maxXP: 300, color: 'sky' },
  { level: 3, title: 'Grower', minXP: 300, maxXP: 600, color: 'violet' },
  { level: 4, title: 'Achiever', minXP: 600, maxXP: 1000, color: 'amber' },
  { level: 5, title: 'Master', minXP: 1000, maxXP: 2000, color: 'rose' },
];

const BADGES: Badge[] = [
  { id: '1', title: 'First Step', description: 'Complete your first mood check-in', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-500/10', earned: true, earnedDate: 'Jul 15', xp: 10, category: 'Mood' },
  { id: '2', title: 'Journaler', description: 'Write 7 journal entries', icon: BookOpen, color: 'text-sky-500', bg: 'bg-sky-500/10', earned: true, earnedDate: 'Jul 22', xp: 50, category: 'Journal' },
  { id: '3', title: 'Habit Starter', description: 'Log habits for 3 consecutive days', icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-500/10', earned: true, earnedDate: 'Jul 20', xp: 30, category: 'Habits' },
  { id: '4', title: 'Gratitude Master', description: 'Complete the 14-day gratitude challenge', icon: Star, color: 'text-amber-500', bg: 'bg-amber-500/10', earned: true, earnedDate: 'Aug 1', xp: 140, category: 'Challenges' },
  { id: '5', title: 'Zen Mind', description: 'Meditate for 10 consecutive days', icon: Brain, color: 'text-violet-500', bg: 'bg-violet-500/10', earned: false, xp: 100, category: 'Mindfulness' },
  { id: '6', title: 'Sleep Champion', description: 'Maintain consistent sleep for 14 days', icon: Moon, color: 'text-indigo-500', bg: 'bg-indigo-500/10', earned: false, xp: 140, category: 'Sleep' },
  { id: '7', title: 'Streak Legend', description: 'Maintain a 30-day streak', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10', earned: false, xp: 300, category: 'Streaks' },
  { id: '8', title: 'Wellness Warrior', description: 'Achieve a wellness score of 90+', icon: Shield, color: 'text-teal-500', bg: 'bg-teal-500/10', earned: false, xp: 200, category: 'Wellness' },
  { id: '9', title: 'MIRA Companion', description: 'Have 50 conversations with MIRA', icon: Zap, color: 'text-fuchsia-500', bg: 'bg-fuchsia-500/10', earned: false, xp: 50, category: 'MIRA' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

const CURRENT_XP = 280;

function getCurrentLevel(xp: number): Level {
  return LEVELS.slice().reverse().find((l) => xp >= l.minXP) ?? LEVELS[0];
}

export default function AchievementsContent() {
  const [filter, setFilter] = useState<'all' | 'earned' | 'locked'>('all');

  const currentLevel = getCurrentLevel(CURRENT_XP);
  const nextLevel = LEVELS.find((l) => l.level === currentLevel.level + 1);
  const progressToNext = nextLevel
    ? Math.round(((CURRENT_XP - currentLevel.minXP) / (nextLevel.minXP - currentLevel.minXP)) * 100)
    : 100;

  const earnedBadges = BADGES.filter((b) => b.earned).length;
  const totalBadges = BADGES.length;

  const filtered = BADGES.filter((b) => {
    if (filter === 'earned') return b.earned;
    if (filter === 'locked') return !b.earned;
    return true;
  });

  return (
    <div className="px-5 lg:px-8 xl:px-10 py-7 pb-24 lg:pb-8 max-w-screen-xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-7">
        <div className="flex items-center gap-2 mb-1">
          <Trophy size={20} strokeWidth={1.5} className="text-primary" />
          <h1 className="font-heading font-bold text-2xl lg:text-3xl text-foreground tracking-tight">Achievements</h1>
        </div>
        <p className="text-muted-foreground text-sm">Earn badges, gain XP, and level up your wellness journey.</p>
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-5">
        {/* Level Card */}
        <motion.div variants={itemVariants} className={`rounded-2xl border border-${currentLevel.color}-500/30 bg-${currentLevel.color}-500/5 p-6`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-semibold font-heading text-muted-foreground uppercase tracking-widest mb-1">Current Level</p>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl bg-${currentLevel.color}-500/15 border border-${currentLevel.color}-500/30 flex items-center justify-center`}>
                  <span className="text-xl font-bold font-heading text-foreground">{currentLevel.level}</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold font-heading text-foreground">{currentLevel.title}</h2>
                  <p className="text-sm text-muted-foreground">{CURRENT_XP} XP total</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-1">Badges Earned</p>
              <p className="text-2xl font-bold font-heading text-foreground">{earnedBadges}<span className="text-sm text-muted-foreground">/{totalBadges}</span></p>
            </div>
          </div>

          {nextLevel && (
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Progress to {nextLevel.title}</span>
                <span className="font-semibold font-heading text-foreground">{CURRENT_XP} / {nextLevel.minXP} XP</span>
              </div>
              <div className="w-full h-2 rounded-full bg-border">
                <div
                  className={`h-full rounded-full bg-${currentLevel.color}-500 transition-all duration-700`}
                  style={{ width: `${progressToNext}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">{nextLevel.minXP - CURRENT_XP} XP until Level {nextLevel.level}</p>
            </div>
          )}
        </motion.div>

        {/* XP Milestones */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total XP', value: CURRENT_XP, icon: Zap, color: 'violet' },
            { label: 'Badges', value: `${earnedBadges}/${totalBadges}`, icon: Star, color: 'amber' },
            { label: 'Streak', value: '12 days', icon: Flame, color: 'orange' },
            { label: 'Rank', value: '#142', icon: TrendingUp, color: 'sky' },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-2xl border border-border bg-card p-4 text-center">
                <div className={`w-9 h-9 rounded-xl bg-${s.color}-500/10 flex items-center justify-center mx-auto mb-2`}>
                  <Icon size={16} strokeWidth={1.5} className={`text-${s.color}-500`} />
                </div>
                <p className="text-lg font-bold font-heading text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            );
          })}
        </motion.div>

        {/* Badges */}
        <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-base text-foreground">Badges</h3>
            <div className="flex gap-1">
              {(['all', 'earned', 'locked'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold font-heading transition-all capitalize',
                    filter === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filtered.map((badge) => {
              const Icon = badge.icon;
              return (
                <div
                  key={badge.id}
                  className={cn(
                    'relative p-4 rounded-2xl border text-center transition-all',
                    badge.earned
                      ? 'border-border bg-card hover:border-primary/20' :'border-border bg-muted/20 opacity-50'
                  )}
                >
                  {badge.earned && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 size={12} strokeWidth={2} className="text-emerald-500" />
                    </div>
                  )}
                  {!badge.earned && (
                    <div className="absolute top-2 right-2">
                      <Lock size={11} strokeWidth={1.5} className="text-muted-foreground" />
                    </div>
                  )}
                  <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-2.5', badge.bg)}>
                    <Icon size={22} strokeWidth={1.5} className={badge.color} />
                  </div>
                  <p className="text-xs font-semibold font-heading text-foreground mb-0.5">{badge.title}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight mb-1.5">{badge.description}</p>
                  <span className="text-[10px] font-bold font-heading text-primary">+{badge.xp} XP</span>
                  {badge.earned && badge.earnedDate && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">{badge.earnedDate}</p>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
