'use client';

import React from 'react';
import { BookOpen, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface JournalEntry {
  id: string;
  prompt: string;
  entry: string;
  sentiment: string;
  created_at: string;
}

interface RecentJournalCardProps {
  journal: JournalEntry;
}

export default function RecentJournalCard({ journal }: RecentJournalCardProps) {
  const sentimentColorMap: Record<string, string> = {
    positive: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    negative: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
    mixed: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  };

  const truncated = journal.entry.length > 120
    ? journal.entry.slice(0, 120) + '...'
    : journal.entry;

  return (
    <div className="wellness-card h-full" data-testid="recent-journal-card">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <BookOpen size={14} strokeWidth={1.5} className="text-orange-700 dark:text-orange-300" />
          </div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground font-heading">
            Recent Entry
          </p>
        </div>
        <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full font-heading', sentimentColorMap[journal.sentiment])}>
          {journal.sentiment}
        </span>
      </div>

      <p className="text-xs text-muted-foreground italic mb-2 font-serif">&ldquo;{journal.prompt}&rdquo;</p>
      <p className="text-sm text-foreground leading-relaxed mb-4">{truncated}</p>

      <Link
        href="/journal"
        className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline font-heading"
        data-testid="view-journal-link"
      >
        Read full entry <ArrowRight size={12} strokeWidth={1.5} />
      </Link>
    </div>
  );
}