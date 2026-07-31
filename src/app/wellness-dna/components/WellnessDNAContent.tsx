'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dna, TrendingUp, Star, AlertCircle, RefreshCw, Clock } from 'lucide-react';

import { wellnessDnaApi, type WellnessDNA } from '@/lib/api';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export default function WellnessDNAContent() {
  const [dna, setDna] = useState<WellnessDNA | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await wellnessDnaApi.get();
      setDna(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Wellness DNA');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

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
            <p className="text-muted-foreground text-sm">Your unique wellness profile based on your data</p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="btn-ghost border border-border text-sm flex items-center gap-2"
          >
            <RefreshCw size={14} strokeWidth={1.5} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </motion.div>

      {loading && (
        <div className="space-y-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-border bg-card h-40 skeleton-shimmer" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 text-center">
          <p className="text-sm text-rose-600 dark:text-rose-400 mb-3">{error}</p>
          <button onClick={load} className="btn-primary text-sm">Retry</button>
        </div>
      )}

      {!loading && !error && dna && (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-5">
          {/* Not Ready State */}
          {!dna.ready && (
            <motion.div variants={itemVariants} className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8 text-center">
              <Clock size={40} strokeWidth={1} className="text-amber-500 mx-auto mb-4" />
              <h3 className="font-heading font-700 text-lg text-foreground mb-2">Building Your Profile</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {dna.message || `Keep logging your mood, habits, and journal entries. Your Wellness DNA will be ready after ${dna.days_needed ?? 7} more days of data.`}
              </p>
              {dna.data_days != null && (
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm font-semibold">
                  {dna.data_days} / {(dna.data_days ?? 0) + (dna.days_needed ?? 7)} days logged
                </div>
              )}
            </motion.div>
          )}

          {/* Ready State */}
          {dna.ready && (
            <>
              {/* Overview Card */}
              <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {dna.dominant_mood && (
                    <div className="text-center">
                      <p className="text-xs font-medium font-heading text-muted-foreground uppercase tracking-wider mb-2">Dominant Mood</p>
                      <p className="text-2xl font-700 font-heading text-foreground capitalize">{dna.dominant_mood}</p>
                    </div>
                  )}
                  {dna.happiest_time && (
                    <div className="text-center">
                      <p className="text-xs font-medium font-heading text-muted-foreground uppercase tracking-wider mb-2">Happiest Time</p>
                      <p className="text-2xl font-700 font-heading text-foreground capitalize">{dna.happiest_time}</p>
                    </div>
                  )}
                  {dna.data_days != null && (
                    <div className="text-center">
                      <p className="text-xs font-medium font-heading text-muted-foreground uppercase tracking-wider mb-2">Days Tracked</p>
                      <p className="text-2xl font-700 font-heading text-foreground">{dna.data_days}</p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Top Habits */}
              {dna.top_habits && dna.top_habits.length > 0 && (
                <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="font-heading font-700 text-base text-foreground mb-4">Top Habits</h3>
                  <div className="flex flex-wrap gap-2">
                    {dna.top_habits.map((habit) => (
                      <span
                        key={habit}
                        className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium font-heading capitalize"
                      >
                        {habit}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Strengths & Recommendations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Recommendations */}
                {dna.recommendations && dna.recommendations.length > 0 && (
                  <motion.div variants={itemVariants} className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Star size={16} strokeWidth={2} className="text-emerald-600 dark:text-emerald-400" />
                      <h3 className="font-heading font-700 text-base text-foreground">Recommendations</h3>
                    </div>
                    <div className="space-y-2">
                      {dna.recommendations.map((rec, i) => (
                        <div key={i} className="flex items-start gap-2.5 rounded-xl bg-emerald-500/10 px-3 py-2.5">
                          <TrendingUp size={14} strokeWidth={2} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <span className="text-sm text-foreground">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Message */}
                {dna.message && (
                  <motion.div variants={itemVariants} className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertCircle size={16} strokeWidth={2} className="text-primary" />
                      <h3 className="font-heading font-700 text-base text-foreground">Insight</h3>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{dna.message}</p>
                  </motion.div>
                )}
              </div>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
