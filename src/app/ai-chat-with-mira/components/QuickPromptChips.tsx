'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface QuickPrompt {
  id: string;
  text: string;
  category: string;
}

interface QuickPromptChipsProps {
  prompts: QuickPrompt[];
  onSelect: (text: string) => void;
}

const categoryColors: Record<string, string> = {
  mood: 'bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:hover:bg-rose-900/50 border-rose-200 dark:border-rose-800/40',
  sleep: 'bg-sky-100 text-sky-700 hover:bg-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:hover:bg-sky-900/50 border-sky-200 dark:border-sky-800/40',
  meditation: 'bg-fuchsia-100 text-fuchsia-700 hover:bg-fuchsia-200 dark:bg-fuchsia-900/30 dark:text-fuchsia-300 dark:hover:bg-fuchsia-900/50 border-fuchsia-200 dark:border-fuchsia-800/40',
  journal: 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:hover:bg-orange-900/50 border-orange-200 dark:border-orange-800/40',
  insights: 'bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:hover:bg-violet-900/50 border-violet-200 dark:border-violet-800/40',
};

export default function QuickPromptChips({ prompts, onSelect }: QuickPromptChipsProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground font-medium px-1 font-heading">
        Quick prompts
      </p>
      <div className="flex flex-wrap gap-2">
        {prompts.map((prompt) => (
          <motion.button
            key={prompt.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(prompt.text)}
            className={cn(
              'text-xs px-3 py-1.5 rounded-full border font-medium transition-all duration-150',
              categoryColors[prompt.category] ?? categoryColors.insights
            )}
            data-testid={`quick-prompt-${prompt.id}`}
          >
            {prompt.text}
          </motion.button>
        ))}
      </div>
    </div>
  );
}