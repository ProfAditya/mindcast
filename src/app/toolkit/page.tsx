'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Wind, Brain, Moon, Music, BookOpen, Heart, Zap, ChevronRight, Play, Check, Star, Clock } from 'lucide-react';
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

const CATEGORIES = ['All', 'Breathing', 'Meditation', 'Sleep', 'Movement', 'Journaling'] as const;
type Category = typeof CATEGORIES[number];

interface Tool {
  id: string;
  title: string;
  description: string;
  category: Exclude<Category, 'All'>;
  duration: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  steps?: string[];
  benefit: string;
}

const TOOLS: Tool[] = [
  {
    id: 'box-breathing',
    title: 'Box Breathing',
    description: 'A powerful technique used by Navy SEALs to calm the nervous system and reduce stress instantly.',
    category: 'Breathing',
    duration: '4 min',
    icon: Wind,
    color: 'text-sky-600 dark:text-sky-400',
    bg: 'bg-sky-500/10',
    benefit: 'Reduces anxiety & improves focus',
    steps: ['Inhale for 4 counts', 'Hold for 4 counts', 'Exhale for 4 counts', 'Hold for 4 counts', 'Repeat 4 times'],
  },
  {
    id: '4-7-8-breathing',
    title: '4-7-8 Breathing',
    description: 'Dr. Andrew Weil\'s relaxation technique that acts as a natural tranquilizer for the nervous system.',
    category: 'Breathing',
    duration: '3 min',
    icon: Wind,
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-500/10',
    benefit: 'Promotes sleep & reduces anxiety',
    steps: ['Exhale completely', 'Inhale for 4 counts', 'Hold for 7 counts', 'Exhale for 8 counts', 'Repeat 4 cycles'],
  },
  {
    id: 'body-scan',
    title: 'Body Scan Meditation',
    description: 'A mindfulness practice that brings awareness to each part of your body, releasing tension and promoting relaxation.',
    category: 'Meditation',
    duration: '10 min',
    icon: Brain,
    color: 'text-fuchsia-600 dark:text-fuchsia-400',
    bg: 'bg-fuchsia-500/10',
    benefit: 'Reduces physical tension & stress',
    steps: ['Find a comfortable position', 'Close your eyes and breathe deeply', 'Start at your feet, notice sensations', 'Slowly move attention upward', 'Release tension as you go'],
  },
  {
    id: 'loving-kindness',
    title: 'Loving-Kindness Meditation',
    description: 'Cultivate compassion for yourself and others through this ancient Buddhist practice.',
    category: 'Meditation',
    duration: '8 min',
    icon: Heart,
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-500/10',
    benefit: 'Increases empathy & positive emotions',
    steps: ['Sit comfortably and close eyes', 'Visualize yourself with warmth', 'Repeat: "May I be happy, healthy, safe"', 'Extend to loved ones', 'Extend to all beings'],
  },
  {
    id: 'sleep-ritual',
    title: 'Sleep Wind-Down Ritual',
    description: 'A structured 20-minute routine to signal your brain it\'s time to sleep and improve sleep quality.',
    category: 'Sleep',
    duration: '20 min',
    icon: Moon,
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-500/10',
    benefit: 'Improves sleep onset & quality',
    steps: ['Dim lights 30 min before bed', 'Put away all screens', 'Do 5 min of gentle stretching', 'Write 3 things you\'re grateful for', 'Practice 4-7-8 breathing'],
  },
  {
    id: 'progressive-relaxation',
    title: 'Progressive Muscle Relaxation',
    description: 'Systematically tense and release muscle groups to achieve deep physical and mental relaxation.',
    category: 'Sleep',
    duration: '15 min',
    icon: Moon,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-500/10',
    benefit: 'Relieves physical tension & insomnia',
    steps: ['Lie down comfortably', 'Start with feet — tense for 5 sec', 'Release and notice the relaxation', 'Move up through each muscle group', 'End with a full body release'],
  },
  {
    id: 'morning-movement',
    title: '5-Minute Morning Movement',
    description: 'A gentle wake-up sequence to energize your body and set a positive tone for the day.',
    category: 'Movement',
    duration: '5 min',
    icon: Zap,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/10',
    benefit: 'Boosts energy & mood',
    steps: ['10 neck rolls each direction', '10 shoulder circles', '10 hip circles', '10 gentle squats', '30 sec jumping jacks'],
  },
  {
    id: 'gratitude-journal',
    title: 'Gratitude Journaling',
    description: 'Research-backed practice of writing 3 specific things you\'re grateful for to rewire your brain toward positivity.',
    category: 'Journaling',
    duration: '5 min',
    icon: BookOpen,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10',
    benefit: 'Increases happiness & resilience',
    steps: ['Open your journal', 'Write 3 specific things you\'re grateful for', 'For each, write WHY you\'re grateful', 'Note one person to appreciate today', 'End with one positive intention'],
  },
  {
    id: 'sound-bath',
    title: 'Sound Bath Focus',
    description: 'Use binaural beats and ambient sound to enter a deep focus or relaxation state.',
    category: 'Meditation',
    duration: '20 min',
    icon: Music,
    color: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-500/10',
    benefit: 'Enhances focus & reduces stress',
    steps: ['Put on headphones', 'Choose: focus (40Hz) or relax (10Hz)', 'Find a quiet space', 'Close eyes and breathe naturally', 'Let the sound guide your mind'],
  },
];

function ToolCard({ tool, onOpen }: { tool: Tool; onOpen: (tool: Tool) => void }) {
  const Icon = tool.icon;
  return (
    <motion.div
      variants={itemVariants}
      className="rounded-2xl border border-border bg-card p-5 hover:border-primary/20 hover:shadow-card-sm transition-all duration-200 cursor-pointer group"
      onClick={() => onOpen(tool)}
    >
      <div className="flex items-start gap-4">
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', tool.bg)}>
          <Icon size={20} strokeWidth={1.5} className={tool.color} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-heading font-semibold text-sm text-foreground">{tool.title}</h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
              <Clock size={11} strokeWidth={1.5} />
              {tool.duration}
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-2.5">{tool.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Star size={10} strokeWidth={2} />
              {tool.benefit}
            </span>
            <ChevronRight size={14} strokeWidth={1.5} className="text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ToolModal({ tool, onClose }: { tool: Tool; onClose: () => void }) {
  const [started, setStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const Icon = tool.icon;

  const handleNext = () => {
    if (!tool.steps) return;
    if (currentStep < tool.steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      setCompleted(true);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="w-full max-w-md rounded-3xl bg-card border border-border p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', tool.bg)}>
              <Icon size={18} strokeWidth={1.5} className={tool.color} />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-base text-foreground">{tool.title}</h2>
              <p className="text-xs text-muted-foreground">{tool.duration} · {tool.category}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-muted-foreground hover:bg-muted transition-colors">
            ✕
          </button>
        </div>

        {!started ? (
          <>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">{tool.description}</p>
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 mb-5">
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mb-1">
                <Star size={11} strokeWidth={2} />
                Benefit
              </p>
              <p className="text-sm text-foreground">{tool.benefit}</p>
            </div>
            {tool.steps && (
              <div className="mb-5">
                <p className="text-xs font-semibold font-heading text-muted-foreground uppercase tracking-wider mb-3">Steps</p>
                <div className="space-y-2">
                  {tool.steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-semibold shrink-0">{i + 1}</span>
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button onClick={() => setStarted(true)} className="btn-primary w-full justify-center">
              <Play size={14} strokeWidth={2} />
              Start Practice
            </button>
          </>
        ) : completed ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <Check size={28} strokeWidth={2} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="font-heading font-semibold text-lg text-foreground mb-2">Practice Complete!</h3>
            <p className="text-sm text-muted-foreground mb-6">Great work. You just invested in your wellbeing.</p>
            <button onClick={onClose} className="btn-primary w-full justify-center">Done</button>
          </div>
        ) : tool.steps ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold font-heading text-muted-foreground uppercase tracking-wider">Step {currentStep + 1} of {tool.steps.length}</p>
              <div className="flex gap-1">
                {tool.steps.map((_, i) => (
                  <div key={i} className={cn('h-1.5 rounded-full transition-all', i <= currentStep ? 'bg-primary w-5' : 'bg-muted w-3')} />
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-primary/8 border border-primary/20 p-6 mb-6 text-center">
              <p className="text-lg font-heading font-semibold text-foreground">{tool.steps[currentStep]}</p>
            </div>
            <button onClick={handleNext} className="btn-primary w-full justify-center">
              {currentStep < tool.steps.length - 1 ? 'Next Step' : 'Complete'}
              <ChevronRight size={14} strokeWidth={2} />
            </button>
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}

export default function ToolkitPage() {
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

  const filtered = activeCategory === 'All' ? TOOLS : TOOLS.filter((t) => t.category === activeCategory);

  return (
    <AppLayout>
      <div className="px-5 lg:px-8 xl:px-10 py-7 pb-24 lg:pb-8 max-w-screen-xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-7">
          <div className="flex items-center gap-2 mb-1">
            <Lightbulb size={20} strokeWidth={1.5} className="text-primary" />
            <h1 className="font-heading font-700 text-2xl lg:text-3xl text-foreground tracking-tight">Wellness Toolkit</h1>
          </div>
          <p className="text-muted-foreground text-sm">Evidence-based practices for your mind and body</p>
        </motion.div>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap mb-7">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-semibold font-heading transition-all duration-200',
                activeCategory === cat ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Tools Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {filtered.map((tool) => (
            <ToolCard key={tool.id} tool={tool} onOpen={setSelectedTool} />
          ))}
        </motion.div>
      </div>

      {/* Tool Modal */}
      {selectedTool && (
        <ToolModal tool={selectedTool} onClose={() => setSelectedTool(null)} />
      )}
    </AppLayout>
  );
}
