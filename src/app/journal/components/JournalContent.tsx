'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, BookOpen, Sparkles, Search, X, Check, Clock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { journalApi, type JournalEntry, type JournalEntryCreate } from '@/lib/api';

const MOOD_TAGS = [
  { value: 'grateful', emoji: '🙏', label: 'Grateful' },
  { value: 'anxious', emoji: '😰', label: 'Anxious' },
  { value: 'hopeful', emoji: '🌱', label: 'Hopeful' },
  { value: 'reflective', emoji: '🤔', label: 'Reflective' },
  { value: 'joyful', emoji: '😄', label: 'Joyful' },
  { value: 'tired', emoji: '😴', label: 'Tired' },
  { value: 'motivated', emoji: '🔥', label: 'Motivated' },
  { value: 'calm', emoji: '🌊', label: 'Calm' },
];

const PROMPTS = [
  "What brought you peace today?",
  "What are you grateful for right now?",
  "What\'s one thing you\'d like to let go of?",
  "Describe a moment that made you smile recently.",
  "What challenge are you currently navigating?",
  "What does your ideal tomorrow look like?",
  "What have you learned about yourself this week?",
  "What small win can you celebrate today?",
];

const DEFAULT_PROMPT = PROMPTS[0];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

type ViewMode = 'list' | 'write';

export default function JournalContent() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPrompt, setCurrentPrompt] = useState(DEFAULT_PROMPT);

  // Write form state
  const [content, setContent] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [selectedMoodTag, setSelectedMoodTag] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    const idx = Math.floor(Math.random() * PROMPTS.length);
    setCurrentPrompt(PROMPTS[idx]);
  }, []);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await journalApi.list(20);
      setEntries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load journal entries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setWordCount(e.target.value.trim().split(/\s+/).filter(Boolean).length);
  };

  const handleUsePrompt = (prompt: string) => {
    setSelectedPrompt(prompt);
    setContent('');
    setWordCount(0);
  };

  const handleSave = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    const payload: JournalEntryCreate = {
      prompt: selectedPrompt || undefined,
      entry: content.trim(),
    };
    try {
      const created = await journalApi.create(payload);
      setEntries((prev) => [created, ...prev]);
      setViewMode('list');
      setContent('');
      setSelectedPrompt('');
      setSelectedMoodTag('');
      setWordCount(0);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save entry');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEntries = entries.filter((e) =>
    !searchQuery ||
    e.entry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.prompt?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="px-6 lg:px-8 xl:px-10 py-8 pb-24 lg:pb-8 max-w-screen-xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-heading font-semibold text-2xl text-foreground">Journal</h1>
          <p className="text-muted-foreground mt-1 text-sm">Your private space to reflect, process, and grow.</p>
        </div>
        <button
          onClick={() => { setViewMode('write'); setSelectedEntry(null); }}
          className="btn-primary text-sm"
        >
          <Plus size={15} strokeWidth={1.5} />
          New Entry
        </button>
      </motion.div>

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-600 dark:text-rose-400">
          {error} —{' '}
          <button onClick={loadEntries} className="underline font-medium">retry</button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {viewMode === 'write' ? (
          <motion.div
            key="write"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
            className="max-w-2xl mx-auto"
          >
            <div className="rounded-3xl bg-card border border-border p-6 card-shadow">
              {/* Prompt Banner */}
              {selectedPrompt ? (
                <div className="mb-5 p-4 rounded-2xl bg-primary/8 border border-primary/20 flex items-start gap-3">
                  <Sparkles size={15} strokeWidth={1.5} className="text-primary shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium font-heading text-primary">{selectedPrompt}</p>
                  </div>
                  <button onClick={() => setSelectedPrompt('')} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X size={14} strokeWidth={1.5} />
                  </button>
                </div>
              ) : (
                <div className="mb-5 p-4 rounded-2xl bg-muted/50 border border-border flex items-start gap-3">
                  <Sparkles size={15} strokeWidth={1.5} className="text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium font-heading text-muted-foreground uppercase tracking-wider mb-1">Today&apos;s Prompt</p>
                    <p className="text-sm text-foreground">{currentPrompt}</p>
                  </div>
                  <button
                    onClick={() => handleUsePrompt(currentPrompt)}
                    className="text-xs text-primary font-medium hover:underline shrink-0"
                  >
                    Use
                  </button>
                </div>
              )}

              {/* Content */}
              <textarea
                value={content}
                onChange={handleContentChange}
                placeholder="Start writing... let your thoughts flow freely."
                rows={10}
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none leading-relaxed resize-none mb-4"
              />

              {/* Mood Tag */}
              <div className="mb-5">
                <p className="text-xs font-medium font-heading text-muted-foreground uppercase tracking-wider mb-2">Mood Tag (optional)</p>
                <div className="flex flex-wrap gap-2">
                  {MOOD_TAGS.map((tag) => (
                    <button
                      key={tag.value}
                      onClick={() => setSelectedMoodTag(selectedMoodTag === tag.value ? '' : tag.value)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150',
                        selectedMoodTag === tag.value
                          ? 'bg-primary/15 text-primary border border-primary/30' :'bg-muted text-muted-foreground border border-transparent hover:border-border'
                      )}
                    >
                      <span>{tag.emoji}</span>
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{wordCount} words</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setViewMode('list'); setContent(''); setSelectedPrompt(''); setSelectedMoodTag(''); setWordCount(0); }}
                    className="btn-ghost border border-border text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!content.trim() || submitting}
                    className="btn-primary text-sm"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Check size={14} strokeWidth={2} />
                        Save Entry
                      </span>
                    )}
                  </button>
                </div>
              </div>
              {submitError && <p className="text-xs text-rose-500 mt-3">{submitError}</p>}
            </div>
          </motion.div>
        ) : selectedEntry ? (
          <motion.div
            key="detail"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
            className="max-w-2xl mx-auto"
          >
            <div className="rounded-3xl bg-card border border-border p-6 card-shadow">
              <div className="flex items-center justify-between mb-5">
                <button onClick={() => setSelectedEntry(null)} className="btn-ghost border border-border text-sm">
                  ← Back
                </button>
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Clock size={12} strokeWidth={1.5} />
                  {new Date(selectedEntry.created_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              {selectedEntry.prompt && (
                <div className="mb-4 p-3 rounded-xl bg-primary/8 border border-primary/20">
                  <p className="text-xs font-medium text-primary">{selectedEntry.prompt}</p>
                </div>
              )}
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{selectedEntry.entry}</p>
            </div>
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Search */}
            <div className="relative mb-5 max-w-md">
              <Search size={15} strokeWidth={1.5} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search entries..."
                className="input-field pl-10"
              />
            </div>

            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="rounded-2xl border border-border bg-card h-28 skeleton-shimmer" />
                ))}
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen size={40} strokeWidth={1} className="text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">
                  {searchQuery ? 'No entries match your search.' : 'No journal entries yet.'}
                </p>
                {!searchQuery && (
                  <button onClick={() => setViewMode('write')} className="btn-primary text-sm mt-4">
                    <Plus size={14} strokeWidth={2} />
                    Write your first entry
                  </button>
                )}
              </div>
            ) : (
              <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-3">
                {filteredEntries.map((entry) => (
                  <motion.div
                    key={entry.id}
                    variants={itemVariants}
                    onClick={() => setSelectedEntry(entry)}
                    className="rounded-2xl border border-border bg-card p-5 cursor-pointer hover:border-primary/20 transition-all duration-200 group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {entry.prompt && (
                          <p className="text-xs font-medium text-primary mb-1.5 flex items-center gap-1.5">
                            <Sparkles size={11} strokeWidth={1.5} />
                            {entry.prompt}
                          </p>
                        )}
                        <p className="text-sm text-foreground leading-relaxed line-clamp-3">{entry.entry}</p>
                      </div>
                      <ChevronRight size={16} strokeWidth={1.5} className="text-muted-foreground/40 group-hover:text-primary shrink-0 mt-1 transition-colors" />
                    </div>
                    <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                      <Clock size={11} strokeWidth={1.5} />
                      {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
