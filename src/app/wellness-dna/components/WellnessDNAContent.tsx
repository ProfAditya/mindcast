'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Dna, TrendingUp, TrendingDown, Star, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { wellnessApi } from '@/lib/api';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const DNA_DIMENSIONS = [
  { key: 'sleep_score', label: 'Sleep', color: '#0EA5E9', description: 'Quality and consistency of your sleep patterns' },
  { key: 'stress_score', label: 'Stress', color: '#FB7185', description: 'Stress management and resilience' },
  { key: 'energy_score', label: 'Energy', color: '#F59E0B', description: 'Daily energy levels and vitality' },
  { key: 'mindfulness_score', label: 'Mindfulness', color: '#7C3AED', description: 'Present-moment awareness and meditation' },
  { key: 'social_score', label: 'Social', color: '#10B981', description: 'Connection and relationship quality' },
  { key: 'movement_score', label: 'Movement', color: '#D946EF', description: 'Physical activity and exercise habits' },
  { key: 'nutrition_score', label: 'Nutrition', color: '#F97316', description: 'Dietary habits and nourishment' },
];

const mockDNA = {
  sleep_score: 72, stress_score: 58, energy_score: 81, mindfulness_score: 65,
  social_score: 74, movement_score: 55, nutrition_score: 68, overall: 73,
  strengths: ['Energy', 'Sleep', 'Social Connection'],
  focus_areas: ['Movement', 'Stress Management', 'Mindfulness'],
};

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="h-2 rounded-full bg-muted overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
        className="h-full rounded-full"
        style={{ background: color }}
      />
    </div>
  );
}

function getScoreLabel(score: number) {
  if (score >= 80) return { label: 'Excellent', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' };
  if (score >= 65) return { label: 'Good', color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-500/10' };
  if (score >= 50) return { label: 'Fair', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' };
  return { label: 'Needs Work', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10' };
}

export default function WellnessDNAContent() {
  const [dna, setDna] = useState(mockDNA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await wellnessApi.getDNA();
        setDna(data as typeof mockDNA);
      } catch {
        setDna(mockDNA);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const radarData = DNA_DIMENSIONS.map((d) => ({
    subject: d.label,
    value: dna[d.key as keyof typeof dna] as number,
  }));

  const overallLabel = getScoreLabel(dna.overall);

  return (
    <div className="px-5 lg:px-8 xl:px-10 py-7 pb-24 lg:pb-8 max-w-screen-xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-7">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Dna size={20} strokeWidth={1.5} className="text-primary" />
              <h1 className="font-heading font-700 text-2xl lg:text-3xl text-foreground tracking-tight">Wellness DNA</h1>
            </div>
            <p className="text-muted-foreground text-sm">Your unique wellness profile across 7 dimensions</p>
          </div>
          <button className="btn-ghost border border-border text-sm flex items-center gap-2">
            <RefreshCw size={14} strokeWidth={1.5} />
            Recalculate
          </button>
        </div>
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-5">
        {/* Overall Score + Radar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Overall Score Card */}
          <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-6 flex flex-col items-center justify-center text-center">
            <div className="relative w-36 h-36 mb-4">
              <svg viewBox="0 0 144 144" className="w-full h-full -rotate-90">
                <circle cx="72" cy="72" r="60" fill="none" stroke="var(--border)" strokeWidth="10" />
                <motion.circle
                  cx="72" cy="72" r="60" fill="none"
                  stroke="url(#dnaGrad)" strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(dna.overall / 100) * 2 * Math.PI * 60} ${2 * Math.PI * 60}`}
                  initial={{ strokeDasharray: `0 ${2 * Math.PI * 60}` }}
                  animate={{ strokeDasharray: `${(dna.overall / 100) * 2 * Math.PI * 60} ${2 * Math.PI * 60}` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                />
                <defs>
                  <linearGradient id="dnaGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#7C3AED" />
                    <stop offset="100%" stopColor="#FB7185" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
                <span className="text-3xl font-700 font-heading text-foreground">{dna.overall}</span>
                <span className="text-xs text-muted-foreground">/ 100</span>
              </div>
            </div>
            <h3 className="font-heading font-700 text-lg text-foreground">Overall Wellness</h3>
            <span className={cn('mt-2 text-xs font-semibold px-3 py-1 rounded-full', overallLabel.bg, overallLabel.color)}>
              {overallLabel.label}
            </span>
          </motion.div>

          {/* Radar Chart */}
          <motion.div variants={itemVariants} className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
            <h3 className="font-heading font-700 text-base text-foreground mb-4">Dimension Balance</h3>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--card)', border: '1px solid var(--border)',
                    borderRadius: '12px', fontSize: '12px', color: 'var(--foreground)',
                  }}
                />
                <Radar name="Wellness" dataKey="value" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Dimension Breakdown */}
        <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-heading font-700 text-base text-foreground mb-5">Dimension Breakdown</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {DNA_DIMENSIONS.map((dim) => {
              const score = dna[dim.key as keyof typeof dna] as number;
              const label = getScoreLabel(score);
              return (
                <div key={dim.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold font-heading text-foreground">{dim.label}</p>
                      <p className="text-xs text-muted-foreground">{dim.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-700 font-heading text-foreground">{score}</span>
                      <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', label.bg, label.color)}>
                        {label.label}
                      </span>
                    </div>
                  </div>
                  <ScoreBar score={score} color={dim.color} />
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Strengths & Focus Areas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <motion.div variants={itemVariants} className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Star size={16} strokeWidth={2} className="text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-heading font-700 text-base text-foreground">Your Strengths</h3>
            </div>
            <div className="space-y-2">
              {dna.strengths.map((s) => (
                <div key={s} className="flex items-center gap-2.5 rounded-xl bg-emerald-500/10 px-3 py-2.5">
                  <TrendingUp size={14} strokeWidth={2} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-sm font-medium text-foreground">{s}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle size={16} strokeWidth={2} className="text-amber-600 dark:text-amber-400" />
              <h3 className="font-heading font-700 text-base text-foreground">Focus Areas</h3>
            </div>
            <div className="space-y-2">
              {dna.focus_areas.map((f) => (
                <div key={f} className="flex items-center gap-2.5 rounded-xl bg-amber-500/10 px-3 py-2.5">
                  <TrendingDown size={14} strokeWidth={2} className="text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="text-sm font-medium text-foreground">{f}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
