'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlaskConical, Clock, ChevronRight, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import AppLayout from '@/components/AppLayout';
import { experimentsApi, type Experiment } from '@/lib/api';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  available: { label: 'Available', color: 'text-muted-foreground', bg: 'bg-muted' },
  active: { label: 'In Progress', color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-500/10' },
  completed: { label: 'Completed', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
};

function ExperimentCard({ exp, onSelect }: { exp: Experiment; onSelect: (e: Experiment) => void }) {
  const status = statusConfig[exp.status ?? 'available'] ?? statusConfig.available;
  return (
    <motion.div
      variants={itemVariants}
      className="rounded-2xl border border-border bg-card p-5 hover:border-primary/20 hover:shadow-card-sm transition-all duration-200 cursor-pointer group"
      onClick={() => onSelect(exp)}
    >
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-primary/10">
          <FlaskConical size={20} strokeWidth={1.5} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-heading font-semibold text-sm text-foreground">{exp.title}</h3>
            <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full shrink-0', status.bg, status.color)}>
              {status.label}
            </span>
          </div>
          {exp.description && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-2.5">{exp.description}</p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {exp.started_at && (
                <span className="flex items-center gap-1">
                  <Clock size={11} strokeWidth={1.5} />
                  Started {new Date(exp.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
            <ChevronRight size={14} strokeWidth={1.5} className="text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExp, setSelectedExp] = useState<Experiment | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await experimentsApi.list();
      setExperiments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load experiments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleComplete = async (id: string) => {
    setCompleting(id);
    try {
      const updated = await experimentsApi.complete(id);
      setExperiments((prev) => prev.map((e) => e.id === id ? updated : e));
      setSelectedExp(null);
    } catch (err) {
      // show error inline
    } finally {
      setCompleting(null);
    }
  };

  return (
    <AppLayout>
      <div className="px-5 lg:px-8 xl:px-10 py-7 pb-24 lg:pb-8 max-w-screen-xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-7">
          <div className="flex items-center gap-2 mb-1">
            <FlaskConical size={20} strokeWidth={1.5} className="text-primary" />
            <h1 className="font-heading font-700 text-2xl lg:text-3xl text-foreground tracking-tight">Experiments</h1>
          </div>
          <p className="text-muted-foreground text-sm">Science-backed wellness experiments to try</p>
        </motion.div>

        {/* Experiment Detail Modal */}
        <AnimatePresence>
          {selectedExp && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
              onClick={(e) => { if (e.target === e.currentTarget) setSelectedExp(null); }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                className="w-full max-w-lg rounded-3xl bg-card border border-border p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10">
                      <FlaskConical size={18} strokeWidth={1.5} className="text-primary" />
                    </div>
                    <div>
                      <h2 className="font-heading font-semibold text-base text-foreground">{selectedExp.title}</h2>
                      {selectedExp.status && (
                        <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', statusConfig[selectedExp.status]?.bg, statusConfig[selectedExp.status]?.color)}>
                          {statusConfig[selectedExp.status]?.label}
                        </span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setSelectedExp(null)} className="p-2 rounded-xl text-muted-foreground hover:bg-muted transition-colors">
                    <X size={16} strokeWidth={1.5} />
                  </button>
                </div>

                {selectedExp.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5">{selectedExp.description}</p>
                )}

                {selectedExp.started_at && (
                  <div className="rounded-2xl bg-muted/50 border border-border p-4 mb-5">
                    <p className="text-xs font-semibold font-heading text-muted-foreground uppercase tracking-wider mb-1">Started</p>
                    <p className="text-sm text-foreground">{new Date(selectedExp.started_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                )}

                {selectedExp.completed_at && (
                  <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 mb-5 text-center">
                    <Check size={20} strokeWidth={2} className="text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-foreground">Completed!</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(selectedExp.completed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                )}

                {selectedExp.status === 'active' && !selectedExp.completed_at && (
                  <button
                    onClick={() => handleComplete(selectedExp.id)}
                    disabled={completing === selectedExp.id}
                    className="btn-primary w-full justify-center"
                  >
                    {completing === selectedExp.id ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Completing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Check size={14} strokeWidth={2} />
                        Mark Complete
                      </span>
                    )}
                  </button>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading && (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-2xl border border-border bg-card h-28 skeleton-shimmer" />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 text-center">
            <p className="text-sm text-rose-600 dark:text-rose-400 mb-3">{error}</p>
            <button onClick={load} className="btn-primary text-sm">Retry</button>
          </div>
        )}

        {!loading && !error && experiments.length === 0 && (
          <div className="text-center py-16">
            <FlaskConical size={40} strokeWidth={1} className="text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">No experiments yet.</p>
            <p className="text-sm text-muted-foreground mt-1">Check back soon for wellness experiments to try.</p>
          </div>
        )}

        {!loading && !error && experiments.length > 0 && (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
            {experiments.map((exp) => (
              <ExperimentCard key={exp.id} exp={exp} onSelect={setSelectedExp} />
            ))}
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
