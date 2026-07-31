'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, BookOpen, Sparkles, Search, X, Check, Clock, ChevronRight, Smile, Frown, Meh, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { journalApi, type JournalEntry, type JournalEntryCreate } from '@/lib/api';
import { mockRecentJournal } from '@/lib/mockData';

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

// Use a fixed index instead of Math.random() to avoid hydration mismatch
const DEFAULT_PROMPT = PROMPTS[0];

const sentimentColors: Record<string, string> = {
  positive: 'text-emerald-600 dark:text-emerald-400',
  negative: 'text-rose-600 dark:text-rose-400',
  neutral: 'text-amber-600 dark:text-amber-400',
};

const sentimentIcons: Record<string, React.ElementType> = {
  positive: Smile,
  negative: Frown,
  neutral: Meh,
};

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
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPrompt, setCurrentPrompt] = useState(DEFAULT_PROMPT);

  // Write form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [selectedMoodTag, setSelectedMoodTag] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  // Randomize prompt on client only to avoid hydration mismatch
  useEffect(() => {
    const idx = Math.floor(Math.random() * PROMPTS.length);
    setCurrentPrompt(PROMPTS[idx]);
  }, []);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const data = await journalApi.list(20);
      setEntries(data);
    } catch {
      const mock: JournalEntry[] = [
        {
          id: mockRecentJournal.id,
          user_id: 'user-001',
          title: 'Morning Reflection',
          content: mockRecentJournal.entry,
          prompt: mockRecentJournal.prompt,
          sentiment: mockRecentJournal.sentiment,
          mood_tag: 'calm',
          created_at: mockRecentJournal.created_at,
        },
        {
          id: 'journal-002',
          user_id: 'user-001',
          title: 'End of Week',
          content: "This week felt like a turning point. I managed to stick to my morning routine for 5 days straight, which hasn't happened in months. The anxiety around the project deadline is still there, but it feels more manageable now that I've broken it into smaller pieces.",
          sentiment: 'positive',
          mood_tag: 'motivated',
          created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
        },
        {
          id: 'journal-003',
          user_id: 'user-001',
          title: 'Processing a hard day',
          content: "Today was difficult. I felt disconnected from everything — work, people, myself. I know these days pass, but in the middle of them it's hard to remember that. I went for a walk in the evening and that helped a little.",
          sentiment: 'negative',
          mood_tag: 'tired',
          created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
        },
      ];
      setEntries(mock);
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
    const payload: JournalEntryCreate = {
      title: title.trim() || undefined,
      content: content.trim(),
      prompt: selectedPrompt || undefined,
      mood_tag: selectedMoodTag || undefined,
    };
    try {
      const created = await journalApi.create(payload);
      setEntries((prev) => [created, ...prev]);
    } catch {
      const optimistic: JournalEntry = {
        id: `local-${Date.now()}`,
        user_id: 'user-001',
        ...payload,
        created_at: new Date().toISOString(),
      };
      setEntries((prev) => [optimistic, ...prev]);
    } finally {
      setSubmitting(false);
      setViewMode('list');
      setTitle('');
      setContent('');
      setSelectedPrompt('');
      setSelectedMoodTag('');
      setWordCount(0);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await journalApi.delete(id);
    } catch {
      // optimistic
    }
    setEntries((prev) => prev.filter((e) => e.id !== id));
    if (selectedEntry?.id === id) setSelectedEntry(null);
  };

  const filteredEntries = entries.filter((e) =>
    !searchQuery ||
    e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.content.toLowerCase().includes(searchQuery.toLowerCase())
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

      <AnimatePresence mode="wait">
        {viewMode === 'write' ? (
          /* ── Write Mode ── */
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

              {/* Title */}
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Entry title (optional)"
                className="w-full bg-transparent text-lg font-heading font-semibold text-foreground placeholder:text-muted-foreground/50 outline-none mb-4 border-b border-border pb-3"
              />

              {/* Content */}
              <textarea
                value={content}
                onChange={handleContentChange}
                placeholder="Start writing... let your thoughts flow freely."
                rows={10}
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none resize-none leading-relaxed font-serif mb-4"
                style={{ fontFamily: 'var(--font-playfair), serif' }}
              />

              {/* Mood Tags */}
              <div className="mb-5">
                <p className="text-xs font-medium font-heading text-muted-foreground uppercase tracking-wider mb-2">How are you feeling?</p>
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

              {/* Word count + Actions */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{wordCount} words</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setViewMode('list'); setTitle(''); setContent(''); setSelectedPrompt(''); setSelectedMoodTag(''); setWordCount(0); }}
                    className="btn-ghost text-sm border border-border"
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
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
            </div>

            {/* Prompt Suggestions */}
            <div className="mt-5 rounded-2xl border border-border bg-card p-5">
              <p className="text-xs font-semibold font-heading text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Sparkles size={11} strokeWidth={2} />
                Writing Prompts
              </p>
              <div className="space-y-2">
                {PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleUsePrompt(prompt)}
                    className="w-full text-left text-sm text-muted-foreground hover:text-foreground px-3 py-2 rounded-xl hover:bg-muted transition-colors flex items-center gap-2 group"
                  >
                    <ChevronRight size={13} strokeWidth={1.5} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : selectedEntry ? (
          /* ── Entry Detail ── */
          <motion.div
            key="detail"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
            className="max-w-2xl mx-auto"
          >
            <div className="rounded-3xl bg-card border border-border p-6 card-shadow">
              <div className="flex items-start justify-between mb-5">
                <div>
                  {selectedEntry.title && (
                    <h2 className="font-heading font-semibold text-xl text-foreground mb-1">{selectedEntry.title}</h2>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock size={12} strokeWidth={1.5} />
                    {new Date(selectedEntry.created_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    {selectedEntry.mood_tag && (
                      <>
                        <span>·</span>
                        <span className="capitalize">{selectedEntry.mood_tag}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedEntry.sentiment && (() => {
                    const SIcon = sentimentIcons[selectedEntry.sentiment ?? 'neutral'] ?? Meh;
                    return <SIcon size={16} strokeWidth={1.5} className={sentimentColors[selectedEntry.sentiment ?? 'neutral']} />;
                  })()}
                  <button
                    onClick={() => handleDelete(selectedEntry.id)}
                    className="p-2 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 size={15} strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={() => setSelectedEntry(null)}
                    className="p-2 rounded-xl text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <X size={15} strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              {selectedEntry.prompt && (
                <div className="mb-4 p-3 rounded-xl bg-primary/8 border border-primary/20">
                  <p className="text-xs font-medium text-primary">{selectedEntry.prompt}</p>
                </div>
              )}

              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                {selectedEntry.content}
              </p>
            </div>
          </motion.div>
        ) : (
          /* ── List Mode ── */
          <motion.div
            key="list"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
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
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 rounded-2xl skeleton-shimmer" />
                ))}
              </div>
            ) : filteredEntries.length === 0 ? (
              <motion.div variants={itemVariants} className="text-center py-16">
                <BookOpen size={40} strokeWidth={1} className="text-muted-foreground/40 mx-auto mb-4" />
                <p className="font-heading font-semibold text-foreground mb-1">No entries yet</p>
                <p className="text-sm text-muted-foreground mb-5">Start your wellness journey with your first journal entry.</p>
                <button onClick={() => setViewMode('write')} className="btn-primary text-sm">
                  <Plus size={14} strokeWidth={2} />
                  Write First Entry
                </button>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {filteredEntries.map((entry) => {
                  const SIcon = sentimentIcons[entry.sentiment ?? 'neutral'] ?? Meh;
                  return (
                    <motion.div
                      key={entry.id}
                      variants={itemVariants}
                      onClick={() => setSelectedEntry(entry)}
                      className="rounded-2xl border border-border bg-card p-5 cursor-pointer hover:border-primary/20 hover:shadow-card-sm transition-all duration-200 group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {entry.title && (
                            <h3 className="font-heading font-semibold text-sm text-foreground mb-1 truncate">{entry.title}</h3>
                          )}
                          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{entry.content}</p>
                          <div className="flex items-center gap-2 mt-2.5 text-xs text-muted-foreground">
                            <Clock size={11} strokeWidth={1.5} />
                            {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            {entry.mood_tag && (
                              <>
                                <span>·</span>
                                <span className="capitalize bg-muted px-2 py-0.5 rounded-full">{entry.mood_tag}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {entry.sentiment && (
                            <SIcon size={15} strokeWidth={1.5} className={sentimentColors[entry.sentiment ?? 'neutral']} />
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={13} strokeWidth={1.5} />
                          </button>
                          <ChevronRight size={15} strokeWidth={1.5} className="text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
