'use client';

import React from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sparkles } from 'lucide-react';

import type { Message } from './ChatScreen';

interface ChatMessageProps {
  message: Message;
}

function StreamingCursor() {
  return (
    <motion.span
      animate={{ opacity: [1, 0, 1] }}
      transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut' }}
      className="inline-block w-0.5 h-[1em] bg-primary/70 ml-0.5 align-middle rounded-full"
    />
  );
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === 'assistant';

  if (isAssistant) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-start gap-3.5 py-2 px-3 lg:px-8 xl:px-14 2xl:px-20"
        data-testid="mira-message"
      >
        {/* Mira Avatar */}
        <div className="w-7 h-7 rounded-full gradient-violet-rose flex items-center justify-center shrink-0 mt-1 elevation-xs">
          <Sparkles size={11} strokeWidth={1.5} className="text-white" />
        </div>

        {/* Message Block */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold font-heading text-muted-foreground mb-1.5 uppercase tracking-widest">
            Mira
          </p>
          <div className="mira-prose text-foreground">
            {message.content ? (
              <>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => (
                      <p className="mb-2.5 leading-[1.8] text-[0.9375rem] text-foreground/90">{children}</p>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-foreground">{children}</strong>
                    ),
                    ul: ({ children }) => (
                      <ul className="pl-4 mb-2.5 space-y-1.5 list-disc marker:text-primary/50">{children}</ul>
                    ),
                    li: ({ children }) => (
                      <li className="text-[0.9375rem] leading-relaxed text-foreground/90">{children}</li>
                    ),
                    h3: ({ children }) => (
                      <h3 className="font-heading font-semibold text-[15px] text-foreground mb-2 mt-3">{children}</h3>
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
                {message.isStreaming && <StreamingCursor />}
              </>
            ) : (
              // Fallback for empty streaming state — should rarely show now
              <div className="flex items-center gap-1.5 py-1">
                <span className="typing-dot w-1.5 h-1.5 rounded-full bg-primary/50" />
                <span className="typing-dot w-1.5 h-1.5 rounded-full bg-primary/50" />
                <span className="typing-dot w-1.5 h-1.5 rounded-full bg-primary/50" />
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // User message
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="flex justify-end py-2 px-3 lg:px-8 xl:px-14 2xl:px-20"
      data-testid="user-message"
    >
      <div className="max-w-[72%]">
        <div className="rounded-2xl rounded-tr-sm bg-primary/10 border border-primary/15 px-4 py-3 elevation-xs">
          <p className="text-[14px] text-foreground leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
      </div>
    </motion.div>
  );
}