'use client';

import React from 'react';
import { BookOpen, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { JournalEntry } from '@/lib/api';

interface RecentJournalCardProps {
  journal: JournalEntry | null;
}

export default function RecentJournalCard({ journal }: RecentJournalCardProps) {
  if (!journal) {
    return (
      <div className="wellness-card h-full" data-testid="recent-journal-card">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <BookOpen size={14} strokeWidth={1.5} className="text-orange-700 dark:text-orange-300" />
          </div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground font-heading">
            Recent Entry
          </p>
        </div>
        <p className="text-sm text-muted-foreground mb-4">No journal entries yet.</p>
        <Link
          href="/journal"
          className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline font-heading"
        >
          Write your first entry <ArrowRight size={12} strokeWidth={1.5} />
        </Link>
      </div>
    );
  }

  const text = journal.entry ?? '';
  const truncated = text.length > 120 ? text.slice(0, 120) + '...' : text;

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
      </div>

      {journal.prompt && (
        <p className="text-xs text-muted-foreground italic mb-2 font-serif">&ldquo;{journal.prompt}&rdquo;</p>
      )}
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