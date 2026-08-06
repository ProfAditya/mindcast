'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, X, Check, Zap, Calendar, Circle, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Icon from '@/components/ui/AppIcon';


type Priority = 'high' | 'medium' | 'low';
type Status = 'todo' | 'in_progress' | 'done';

interface Task {
  id: string;
  title: string;
  project: string;
  priority: Priority;
  status: Status;
  deadline?: string;
}

interface Goal {
  id: string;
  title: string;
  progress: number;
  target: number;
  unit: string;
  color: string;
}

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string }> = {
  high: { label: 'High', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10' },
  medium: { label: 'Medium', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
  low: { label: 'Low', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
};

const STATUS_CONFIG: Record<Status, { label: string; icon: React.ElementType; color: string }> = {
  todo: { label: 'To Do', icon: Circle, color: 'text-muted-foreground' },
  in_progress: { label: 'In Progress', icon: Clock, color: 'text-sky-500' },
  done: { label: 'Done', icon: CheckCircle2, color: 'text-emerald-500' },
};

const INITIAL_TASKS: Task[] = [
  { id: '1', title: 'Complete MindCast feature spec', project: 'MindCast', priority: 'high', status: 'done', deadline: '2026-08-05' },
  { id: '2', title: 'Review analytics dashboard design', project: 'MindCast', priority: 'high', status: 'in_progress', deadline: '2026-08-07' },
  { id: '3', title: 'Write weekly reflection', project: 'Personal', priority: 'medium', status: 'todo' },
  { id: '4', title: 'Plan next month goals', project: 'Personal', priority: 'medium', status: 'todo', deadline: '2026-08-10' },
  { id: '5', title: 'Read 30 pages of current book', project: 'Learning', priority: 'low', status: 'in_progress' },
];

const INITIAL_GOALS: Goal[] = [
  { id: '1', title: 'Complete 20 study sessions', progress: 12, target: 20, unit: 'sessions', color: 'violet' },
  { id: '2', title: 'Meditate 30 days straight', progress: 18, target: 30, unit: 'days', color: 'emerald' },
  { id: '3', title: 'Read 5 books this month', progress: 2, target: 5, unit: 'books', color: 'sky' },
  { id: '4', title: 'Exercise 4x per week', progress: 3, target: 4, unit: 'sessions', color: 'amber' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

export default function ProductivityContent() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [goals] = useState<Goal[]>(INITIAL_GOALS);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newProject, setNewProject] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [filter, setFilter] = useState<Status | 'all'>('all');

  const addTask = () => {
    if (!newTitle.trim()) return;
    const task: Task = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      project: newProject.trim() || 'Personal',
      priority: newPriority,
      status: 'todo',
    };
    setTasks((prev) => [task, ...prev]);
    setNewTitle('');
    setNewProject('');
    setNewPriority('medium');
    setShowAddTask(false);
    toast.success('Task added!');
  };

  const cycleStatus = (id: string) => {
    setTasks((prev) => prev.map((t) => {
      if (t.id !== id) return t;
      const next: Status = t.status === 'todo' ? 'in_progress' : t.status === 'in_progress' ? 'done' : 'todo';
      return { ...t, status: next };
    }));
  };

  const filteredTasks = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter);
  const doneTasks = tasks.filter((t) => t.status === 'done').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const todoTasks = tasks.filter((t) => t.status === 'todo').length;

  return (
    <div className="px-5 lg:px-8 xl:px-10 py-7 pb-24 lg:pb-8 max-w-screen-xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-7 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target size={20} strokeWidth={1.5} className="text-primary" />
            <h1 className="font-heading font-bold text-2xl lg:text-3xl text-foreground tracking-tight">Productivity Hub</h1>
          </div>
          <p className="text-muted-foreground text-sm">Goals, tasks, and projects — AI-prioritized for your best day.</p>
        </div>
        <button onClick={() => setShowAddTask(true)} className="btn-primary text-sm">
          <Plus size={15} strokeWidth={1.5} />
          Add Task
        </button>
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-5">
        {/* Stats Strip */}
        <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4">
          {[
            { label: 'To Do', value: todoTasks, icon: Circle, color: 'text-muted-foreground', bg: 'bg-muted/50' },
            { label: 'In Progress', value: inProgressTasks, icon: Clock, color: 'text-sky-500', bg: 'bg-sky-500/10' },
            { label: 'Completed', value: doneTasks, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
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

        {/* Goals */}
        <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} strokeWidth={1.5} className="text-primary" />
            <h3 className="font-heading font-semibold text-base text-foreground">Active Goals</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {goals.map((goal) => {
              const pct = Math.round((goal.progress / goal.target) * 100);
              return (
                <div key={goal.id} className="p-4 rounded-xl border border-border bg-muted/30">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-semibold font-heading text-foreground leading-tight">{goal.title}</p>
                    <span className={`text-xs font-bold font-heading text-${goal.color}-600 dark:text-${goal.color}-400 shrink-0 ml-2`}>{pct}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-border mb-1.5">
                    <div
                      className={`h-full rounded-full bg-${goal.color}-500 transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{goal.progress} / {goal.target} {goal.unit}</p>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Tasks */}
        <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-base text-foreground">Tasks</h3>
            <div className="flex gap-1">
              {(['all', 'todo', 'in_progress', 'done'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold font-heading transition-all',
                    filter === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  {f === 'all' ? 'All' : f === 'in_progress' ? 'Active' : f === 'todo' ? 'Todo' : 'Done'}
                </button>
              ))}
            </div>
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
                  type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Task title..." className="input-field text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && addTask()}
                />
                <div className="flex gap-2">
                  <input
                    type="text" value={newProject} onChange={(e) => setNewProject(e.target.value)}
                    placeholder="Project" className="input-field text-sm flex-1"
                  />
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as Priority)}
                    className="input-field text-sm w-32"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={addTask} className="btn-primary text-xs flex-1 justify-center">
                    <Check size={13} strokeWidth={2} /> Add Task
                  </button>
                  <button onClick={() => setShowAddTask(false)} className="btn-ghost border border-border text-xs">
                    <X size={13} strokeWidth={1.5} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            {filteredTasks.map((task) => {
              const StatusIcon = STATUS_CONFIG[task.status].icon;
              const priorityCfg = PRIORITY_CONFIG[task.priority];
              return (
                <div
                  key={task.id}
                  className={cn(
                    'flex items-center gap-3 p-3.5 rounded-xl border transition-all',
                    task.status === 'done' ? 'border-border bg-muted/20 opacity-60' : 'border-border bg-card hover:border-primary/20'
                  )}
                >
                  <button
                    onClick={() => cycleStatus(task.id)}
                    className={cn('shrink-0 transition-colors', STATUS_CONFIG[task.status].color)}
                  >
                    <StatusIcon size={18} strokeWidth={1.5} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium font-heading text-foreground', task.status === 'done' && 'line-through')}>{task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.project}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {task.deadline && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar size={10} strokeWidth={1.5} />
                        {new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                    <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', priorityCfg.bg, priorityCfg.color)}>
                      {priorityCfg.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* AI Priority Suggestion */}
        <motion.div variants={itemVariants} className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={15} strokeWidth={1.5} className="text-violet-500" />
            <p className="text-sm font-semibold font-heading text-foreground">MIRA Priority Insight</p>
          </div>
          <p className="text-sm text-muted-foreground">
            You have {inProgressTasks} tasks in progress. Focus on completing one before starting new ones — context switching reduces productivity by up to 40%.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
