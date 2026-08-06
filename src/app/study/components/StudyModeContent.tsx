'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Play, Pause, RotateCcw, Zap, Brain, Clock, Plus, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type TimerMode = 'focus' | 'short_break' | 'long_break';
type TimerState = 'idle' | 'running' | 'paused';

interface StudyTask {
  id: string;
  title: string;
  subject: string;
  done: boolean;
  pomodoros: number;
  completedPomodoros: number;
}

const TIMER_DURATIONS: Record<TimerMode, number> = {
  focus: 25 * 60,
  short_break: 5 * 60,
  long_break: 15 * 60,
};

const TIMER_LABELS: Record<TimerMode, string> = {
  focus: 'Focus Session',
  short_break: 'Short Break',
  long_break: 'Long Break',
};

const TIMER_COLORS: Record<TimerMode, string> = {
  focus: 'text-violet-500',
  short_break: 'text-emerald-500',
  long_break: 'text-sky-500',
};

const TIMER_BG: Record<TimerMode, string> = {
  focus: 'bg-violet-500/10 border-violet-500/20',
  short_break: 'bg-emerald-500/10 border-emerald-500/20',
  long_break: 'bg-sky-500/10 border-sky-500/20',
};

const INITIAL_TASKS: StudyTask[] = [
  { id: '1', title: 'Review Chapter 5 — Cognitive Psychology', subject: 'Psychology', done: false, pomodoros: 3, completedPomodoros: 1 },
  { id: '2', title: 'Complete practice problems set B', subject: 'Mathematics', done: false, pomodoros: 2, completedPomodoros: 0 },
  { id: '3', title: 'Write essay outline — Mental Health Awareness', subject: 'English', done: true, pomodoros: 2, completedPomodoros: 2 },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function StudyModeContent() {
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATIONS.focus);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [focusScore, setFocusScore] = useState(0);
  const [tasks, setTasks] = useState<StudyTask[]>(INITIAL_TASKS);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSubject, setNewTaskSubject] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (timerState === 'running') {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearTimer();
            setTimerState('idle');
            if (mode === 'focus') {
              setCompletedPomodoros((c) => c + 1);
              setFocusScore((s) => s + 10);
              toast.success('Focus session complete! 🎉 Take a break.');
            } else {
              toast.success('Break over! Ready to focus again?');
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [timerState, mode, clearTimer]);

  const handleModeChange = (newMode: TimerMode) => {
    clearTimer();
    setMode(newMode);
    setTimerState('idle');
    setTimeLeft(TIMER_DURATIONS[newMode]);
  };

  const handleStartPause = () => {
    if (timerState === 'idle' || timerState === 'paused') {
      setTimerState('running');
    } else {
      setTimerState('paused');
    }
  };

  const handleReset = () => {
    clearTimer();
    setTimerState('idle');
    setTimeLeft(TIMER_DURATIONS[mode]);
  };

  const toggleTask = (id: string) => {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, done: !t.done } : t));
  };

  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    const task: StudyTask = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      subject: newTaskSubject.trim() || 'General',
      done: false,
      pomodoros: 2,
      completedPomodoros: 0,
    };
    setTasks((prev) => [...prev, task]);
    setNewTaskTitle('');
    setNewTaskSubject('');
    setShowAddTask(false);
    toast.success('Task added!');
  };

  const progress = 1 - timeLeft / TIMER_DURATIONS[mode];
  const circumference = 2 * Math.PI * 54;
  const strokeDash = progress * circumference;
  const completedTasks = tasks.filter((t) => t.done).length;

  return (
    <div className="px-5 lg:px-8 xl:px-10 py-7 pb-24 lg:pb-8 max-w-screen-xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-7">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen size={20} strokeWidth={1.5} className="text-primary" />
          <h1 className="font-heading font-bold text-2xl lg:text-3xl text-foreground tracking-tight">Study Mode</h1>
        </div>
        <p className="text-muted-foreground text-sm">Pomodoro timer, task management, and focus tracking.</p>
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Timer Column */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4">
          {/* Mode Selector */}
          <div className="rounded-2xl border border-border bg-card p-1.5 flex gap-1">
            {(['focus', 'short_break', 'long_break'] as TimerMode[]).map((m) => (
              <button
                key={m}
                onClick={() => handleModeChange(m)}
                className={cn(
                  'flex-1 py-2 px-2 rounded-xl text-xs font-semibold font-heading transition-all',
                  mode === m ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {m === 'focus' ? 'Focus' : m === 'short_break' ? 'Short Break' : 'Long Break'}
              </button>
            ))}
          </div>

          {/* Timer Circle */}
          <div className={cn('rounded-3xl border p-8 flex flex-col items-center gap-5', TIMER_BG[mode])}>
            <p className="text-xs font-semibold font-heading text-muted-foreground uppercase tracking-widest">{TIMER_LABELS[mode]}</p>

            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="absolute inset-0 -rotate-90" width="144" height="144" viewBox="0 0 144 144">
                <circle cx="72" cy="72" r="54" fill="none" stroke="var(--border)" strokeWidth="8" />
                <circle
                  cx="72" cy="72" r="54" fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={`${strokeDash} ${circumference}`}
                  strokeLinecap="round"
                  className={TIMER_COLORS[mode]}
                  style={{ transition: 'stroke-dasharray 0.5s ease' }}
                />
              </svg>
              <div className="text-center">
                <p className="text-3xl font-bold font-heading text-foreground tabular-nums">{formatTime(timeLeft)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{timerState === 'running' ? 'Running' : timerState === 'paused' ? 'Paused' : 'Ready'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleReset}
                className="w-10 h-10 rounded-xl border border-border bg-card/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw size={16} strokeWidth={1.5} />
              </button>
              <button
                onClick={handleStartPause}
                className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
              >
                {timerState === 'running' ? <Pause size={22} strokeWidth={2} /> : <Play size={22} strokeWidth={2} />}
              </button>
              <div className="w-10 h-10" />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-border bg-card p-3.5 text-center">
              <p className="text-xl font-bold font-heading text-foreground">{completedPomodoros}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Pomodoros</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-3.5 text-center">
              <p className="text-xl font-bold font-heading text-foreground">{focusScore}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Focus Score</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-3.5 text-center">
              <p className="text-xl font-bold font-heading text-foreground">{completedTasks}/{tasks.length}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Tasks Done</p>
            </div>
          </div>

          {/* MIRA Burnout Detection */}
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain size={14} strokeWidth={1.5} className="text-amber-500" />
              <p className="text-xs font-semibold font-heading text-amber-600 dark:text-amber-400">MIRA Burnout Monitor</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {completedPomodoros >= 4
                ? 'You\'ve been studying hard! Take a longer break to prevent burnout.' :'Focus levels look healthy. Keep up the consistent sessions!'}
            </p>
          </div>
        </motion.div>

        {/* Tasks Column */}
        <motion.div variants={itemVariants} className="lg:col-span-3 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold text-base text-foreground">Study Tasks</h3>
              <button onClick={() => setShowAddTask(true)} className="btn-ghost border border-border text-xs">
                <Plus size={13} strokeWidth={1.5} />
                Add Task
              </button>
            </div>

            <AnimatePresence>
              {showAddTask && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3"
                >
                  <input
                    type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Task title..." className="input-field text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && addTask()}
                  />
                  <input
                    type="text" value={newTaskSubject} onChange={(e) => setNewTaskSubject(e.target.value)}
                    placeholder="Subject (optional)" className="input-field text-sm"
                  />
                  <div className="flex gap-2">
                    <button onClick={addTask} className="btn-primary text-xs flex-1 justify-center">
                      <Check size={13} strokeWidth={2} /> Add
                    </button>
                    <button onClick={() => setShowAddTask(false)} className="btn-ghost border border-border text-xs">
                      <X size={13} strokeWidth={1.5} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2.5">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={cn(
                    'flex items-center gap-3 p-4 rounded-xl border transition-all',
                    task.done ? 'border-border bg-muted/30 opacity-60' : 'border-border bg-card hover:border-primary/20'
                  )}
                >
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                      task.done ? 'border-emerald-500 bg-emerald-500' : 'border-muted-foreground/40 hover:border-primary'
                    )}
                  >
                    {task.done && <Check size={11} strokeWidth={3} className="text-white" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium font-heading text-foreground', task.done && 'line-through')}>{task.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{task.subject}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <Clock size={11} strokeWidth={1.5} />
                    <span>{task.completedPomodoros}/{task.pomodoros}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Study Planner */}
          <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={16} strokeWidth={1.5} className="text-violet-500" />
              <h3 className="font-heading font-semibold text-base text-foreground">AI Study Planner</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Based on your focus patterns and upcoming tasks, MIRA suggests:</p>
            <div className="space-y-2">
              {[
                { time: '09:00 – 10:30', task: 'Deep work: Psychology Chapter 5', type: 'focus' },
                { time: '10:30 – 10:45', task: 'Short break — stretch & hydrate', type: 'break' },
                { time: '10:45 – 12:00', task: 'Math practice problems', type: 'focus' },
                { time: '14:00 – 15:00', task: 'Essay outline & writing', type: 'focus' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="text-xs font-mono text-muted-foreground w-28 shrink-0">{item.time}</span>
                  <span className={cn(
                    'flex-1 text-foreground',
                    item.type === 'break' && 'text-emerald-600 dark:text-emerald-400'
                  )}>{item.task}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
