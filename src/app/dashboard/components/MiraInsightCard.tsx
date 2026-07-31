'use client';

import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface MiraInsightCardProps {
  insight: string | null;
}

export default function MiraInsightCard({ insight }: MiraInsightCardProps) {
  return (
    <div className="wellness-card h-full relative overflow-hidden" data-testid="mira-insight-card">
      {/* Subtle gradient accent */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/5 -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-full gradient-violet-rose flex items-center justify-center shrink-0">
            <Sparkles size={13} strokeWidth={1.5} className="text-white" />
          </div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground font-heading">
            Mira
          </p>
        </div>

        {insight ? (
          <blockquote className="font-serif text-sm leading-relaxed text-foreground italic mb-4">
            &ldquo;{insight}&rdquo;
          </blockquote>
        ) : (
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Chat with Mira to get personalized insights based on your wellness data.
          </p>
        )}

        <Link
          href="/ai-chat-with-mira"
          className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline font-heading"
          data-testid="chat-mira-insight-link"
        >
          Chat with Mira <ArrowRight size={12} strokeWidth={1.5} />
        </Link>
      </div>
    </div>
  );
}