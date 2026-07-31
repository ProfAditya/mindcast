'use client';

import React from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message } from './ChatScreen';

interface ChatMessageProps {
  message: Message;
}

function StreamingCursor() {
  return (
    <motion.span
      animate={{ opacity: [1, 0, 1] }}
      transition={{ duration: 0.8, repeat: Infinity }}
      className="inline-block w-0.5 h-4 bg-primary ml-0.5 align-middle"
    />
  );
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === 'assistant';

  if (isAssistant) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-start gap-4 py-2 px-2 lg:px-8 xl:px-16 2xl:px-24"
        data-testid="mira-message"
      >
        {/* Mira Avatar */}
        <div className="w-7 h-7 rounded-full gradient-violet-rose flex items-center justify-center shrink-0 mt-1">
          <Sparkles size={12} strokeWidth={1.5} className="text-white" />
        </div>

        {/* Message Block — Editorial Style */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium font-heading text-muted-foreground mb-2 uppercase tracking-wider">
            Mira
          </p>
          <div
            className={cn(
              'mira-prose text-foreground',
              message.isStreaming && 'after:content-[""]'
            )}
          >
            {message.content ? (
              <>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => (
                      <p className="mb-3 leading-relaxed text-[0.9375rem]">{children}</p>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-foreground">{children}</strong>
                    ),
                    ul: ({ children }) => (
                      <ul className="pl-4 mb-3 space-y-1.5 list-disc">{children}</ul>
                    ),
                    li: ({ children }) => (
                      <li className="text-[0.9375rem] leading-relaxed">{children}</li>
                    ),
                    h3: ({ children }) => (
                      <h3 className="font-heading font-semibold text-base text-foreground mb-2 mt-3">{children}</h3>
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
                {message.isStreaming && <StreamingCursor />}
              </>
            ) : (
              <div className="flex items-center gap-2 py-1">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                  className="w-1.5 h-1.5 rounded-full bg-primary/60"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                  className="w-1.5 h-1.5 rounded-full bg-primary/60"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                  className="w-1.5 h-1.5 rounded-full bg-primary/60"
                />
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
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex justify-end py-2 px-2 lg:px-8 xl:px-16 2xl:px-24"
      data-testid="user-message"
    >
      <div className="max-w-[70%]">
        <div className="rounded-2xl rounded-tr-sm bg-primary/10 border border-primary/20 px-4 py-3">
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
      </div>
    </motion.div>
  );
}