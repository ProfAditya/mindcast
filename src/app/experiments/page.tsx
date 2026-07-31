'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FlaskConical, TrendingUp, Clock, ChevronRight, Zap, Moon, Brain, Droplets, BookOpen, Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import AppLayout from '@/components/AppLayout';
import Icon from '@/components/ui/AppIcon';


const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

interface Experiment {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  status: 'available' | 'active' | 'completed';
  hypothesis: string;
  protocol: string[];
  expectedOutcome: string;
}

const EXPERIMENTS: Experiment[] = [
  {
    id: 'exp-sleep-consistency',
    title: 'Sleep Consistency Challenge',
    description: 'Go to bed and wake up at the same time every day for 14 days, including weekends.',
    duration: '14 days',
    category: 'Sleep',
    icon: Moon,
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-500/10',
    status: 'available',
    hypothesis: 'Consistent sleep timing will improve energy levels and mood within 2 weeks.',
    protocol: [
      'Choose a fixed bedtime (e.g., 10:30 PM)',
      'Set a fixed wake time (e.g., 6:30 AM)',
      'No screens 30 min before bed',
      'Log your energy each morning (1-10)',
      'Track for 14 consecutive days',
    ],
    expectedOutcome: '+15% energy score, improved mood consistency',
  },
  {
    id: 'exp-morning-meditation',
    title: '10-Minute Morning Meditation',
    description: 'Meditate for exactly 10 minutes every morning before checking your phone for 21 days.',
    duration: '21 days',
    category: 'Mindfulness',
    icon: Brain,
    color: 'text-fuchsia-600 dark:text-fuchsia-400',
    bg: 'bg-fuchsia-500/10',
    status: 'active',
    hypothesis: 'Morning meditation will reduce daily stress scores by at least 20%.',
    protocol: [
      'Set alarm 15 min earlier than usual',
      'Do NOT check phone before meditating',
      'Use box breathing or body scan',
      'Log stress level before and after',
      'Note any thoughts or insights',
    ],
    expectedOutcome: '-20% stress score, improved focus throughout day',
  },
  {
    id: 'exp-hydration',
    title: 'Optimal Hydration Protocol',
    description: 'Drink 8 glasses of water daily, starting with 2 glasses immediately upon waking.',
    duration: '10 days',
    category: 'Nutrition',
    icon: Droplets,
    color: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-500/10',
    status: 'completed',
    hypothesis: 'Optimal hydration will improve energy, focus, and mood within 10 days.',
    protocol: [
      'Drink 2 glasses of water upon waking',
      'Set hourly reminders to drink water',
      'Track intake in habit tracker',
      'Note energy and focus levels',
      'Compare to baseline week',
    ],
    expectedOutcome: '+10% energy, reduced afternoon fatigue',
  },
  {
    id: 'exp-no-phone-morning',
    title: 'Phone-Free Morning Hour',
    description: 'Avoid all screens for the first hour after waking for 7 days.',
    duration: '7 days',
    category: 'Digital Wellness',
    icon: Zap,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/10',
    status: 'available',
    hypothesis: 'Reducing morning screen time will lower anxiety and improve morning mood.',
    protocol: [
      'Put phone in another room overnight',
      'Do morning routine without screens',
      'Journal or meditate instead',
      'Rate morning anxiety (1-10)',
      'Note how the day unfolds differently',
    ],
    expectedOutcome: '-25% morning anxiety, improved focus',
  },
  {
    id: 'exp-gratitude-streak',
    title: 'Gratitude Journaling Streak',
    description: 'Write 3 specific things you\'re grateful for every night before bed for 30 days.',
    duration: '30 days',
    category: 'Journaling',
    icon: BookOpen,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10',
    status: 'available',
    hypothesis: 'Daily gratitude practice will measurably increase happiness and reduce negativity bias.',
    protocol: [
      'Write exactly 3 gratitude items nightly',
      'Be specific — not just "family" but why',
      'Include one small unexpected thing',
      'Rate happiness before and after (1-10)',
      'Review weekly for patterns',
    ],
    expectedOutcome: '+20% happiness score, reduced negative thought patterns',
  },
];

const statusConfig = {
  available: { label: 'Available', color: 'text-muted-foreground', bg: 'bg-muted' },
  active: { label: 'In Progress', color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-500/10' },
  completed: { label: 'Completed', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
};

function ExperimentCard({ exp, onSelect }: { exp: Experiment; onSelect: (e: Experiment) => void }) {
  const Icon = exp.icon;
  const status = statusConfig[exp.status];
  return (
    <motion.div
      variants={itemVariants}
      className="rounded-2xl border border-border bg-card p-5 hover:border-primary/20 hover:shadow-card-sm transition-all duration-200 cursor-pointer group"
      onClick={() => onSelect(exp)}
    >
      <div className="flex items-start gap-4">
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', exp.bg)}>
          <Icon size={20} strokeWidth={1.5} className={exp.color} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-heading font-semibold text-sm text-foreground">{exp.title}</h3>
            <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full shrink-0', status.bg, status.color)}>
              {status.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-2.5">{exp.description}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Clock size={11} strokeWidth={1.5} />{exp.duration}</span>
              <span className="flex items-center gap-1"><TrendingUp size={11} strokeWidth={1.5} />{exp.category}</span>
            </div>
            <ChevronRight size={14} strokeWidth={1.5} className="text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ExperimentDetail({ exp, onClose, onStart }: { exp: Experiment; onClose: () => void; onStart: (id: string) => void }) {
  const Icon = exp.icon;
  const status = statusConfig[exp.status];
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg rounded-3xl bg-card border border-border p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', exp.bg)}>
              <Icon size={18} strokeWidth={1.5} className={exp.color} />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-base text-foreground">{exp.title}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', status.bg, status.color)}>{status.label}</span>
                <span className="text-xs text-muted-foreground">{exp.duration} · {exp.category}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-muted-foreground hover:bg-muted transition-colors">✕</button>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed mb-5">{exp.description}</p>

        <div className="rounded-2xl bg-primary/8 border border-primary/20 p-4 mb-5">
          <p className="text-xs font-semibold font-heading text-primary uppercase tracking-wider mb-1.5">Hypothesis</p>
          <p className="text-sm text-foreground">{exp.hypothesis}</p>
        </div>

        <div className="mb-5">
          <p className="text-xs font-semibold font-heading text-muted-foreground uppercase tracking-wider mb-3">Protocol</p>
          <div className="space-y-2">
            {exp.protocol.map((step, i) => (
              <div key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5">{i + 1}</span>
                {step}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 mb-5">
          <p className="text-xs font-semibold font-heading text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1.5">Expected Outcome</p>
          <p className="text-sm text-foreground">{exp.expectedOutcome}</p>
        </div>

        {exp.status === 'available' && (
          <button onClick={() => { onStart(exp.id); onClose(); }} className="btn-primary w-full justify-center">
            <Plus size={14} strokeWidth={2} />
            Start Experiment
          </button>
        )}
        {exp.status === 'active' && (
          <div className="flex gap-3">
            <button className="btn-ghost flex-1 justify-center border border-border text-sm">Log Progress</button>
            <button onClick={() => { onStart(exp.id); onClose(); }} className="btn-primary flex-1 justify-center text-sm">
              <Check size={14} strokeWidth={2} />
              Mark Complete
            </button>
          </div>
        )}
        {exp.status === 'completed' && (
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-center">
            <Check size={20} strokeWidth={2} className="text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">Experiment Completed!</p>
            <p className="text-xs text-muted-foreground mt-1">Check your Analytics to see the impact.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function ExperimentsPage() {
  const [selectedExp, setSelectedExp] = useState<Experiment | null>(null);
  const [experiments, setExperiments] = useState(EXPERIMENTS);

  const handleStart = (id: string) => {
    setExperiments((prev) => prev.map((e) =>
      e.id === id ? { ...e, status: e.status === 'active' ? 'completed' : 'active' } : e
    ));
  };

  const active = experiments.filter((e) => e.status === 'active');
  const available = experiments.filter((e) => e.status === 'available');
  const completed = experiments.filter((e) => e.status === 'completed');

  return (
    <AppLayout>
      <div className="px-5 lg:px-8 xl:px-10 py-7 pb-24 lg:pb-8 max-w-screen-xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-7">
          <div className="flex items-center gap-2 mb-1">
            <FlaskConical size={20} strokeWidth={1.5} className="text-primary" />
            <h1 className="font-heading font-700 text-2xl lg:text-3xl text-foreground tracking-tight">Experiments</h1>
          </div>
          <p className="text-muted-foreground text-sm">Science-backed wellness experiments to test and track</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-7">
          {[
            { label: 'Active', value: active.length, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-500/10' },
            { label: 'Available', value: available.length, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500/10' },
            { label: 'Completed', value: completed.length, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-4 text-center">
              <p className={cn('text-2xl font-700 font-heading', s.color)}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
          {active.length > 0 && (
            <div>
              <h2 className="font-heading font-700 text-sm text-muted-foreground uppercase tracking-wider mb-3">In Progress</h2>
              <div className="space-y-3">
                {active.map((exp) => <ExperimentCard key={exp.id} exp={exp} onSelect={setSelectedExp} />)}
              </div>
            </div>
          )}

          {available.length > 0 && (
            <div>
              <h2 className="font-heading font-700 text-sm text-muted-foreground uppercase tracking-wider mb-3">Available</h2>
              <div className="space-y-3">
                {available.map((exp) => <ExperimentCard key={exp.id} exp={exp} onSelect={setSelectedExp} />)}
              </div>
            </div>
          )}

          {completed.length > 0 && (
            <div>
              <h2 className="font-heading font-700 text-sm text-muted-foreground uppercase tracking-wider mb-3">Completed</h2>
              <div className="space-y-3">
                {completed.map((exp) => <ExperimentCard key={exp.id} exp={exp} onSelect={setSelectedExp} />)}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {selectedExp && (
        <ExperimentDetail
          exp={experiments.find((e) => e.id === selectedExp.id) ?? selectedExp}
          onClose={() => setSelectedExp(null)}
          onStart={handleStart}
        />
      )}
    </AppLayout>
  );
}
