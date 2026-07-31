'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, AlertTriangle, X, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import ChatMessage from './ChatMessage';
import ContextPanel from './ContextPanel';
import QuickPromptChips from './QuickPromptChips';
import { chatApi, userContextApi, type UserContext } from '@/lib/api';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  isStreaming?: boolean;
}

const CRISIS_KEYWORDS = [
  'suicide', 'kill myself', 'end my life', 'want to die',
  'self-harm', 'hurt myself', 'cutting',
];

function detectCrisis(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some((kw) => lower.includes(kw));
}

const QUICK_PROMPTS = [
  { id: 'qp-01', text: "I\'m feeling anxious today", category: 'mood' },
  { id: 'qp-02', text: "Help me wind down for sleep", category: 'sleep' },
  { id: 'qp-03', text: "I need a moment of calm", category: 'meditation' },
  { id: 'qp-04', text: "Reflect on my week with me", category: 'journal' },
  { id: 'qp-05', text: "What patterns do you see in my data?", category: 'insights' },
];

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [crisisDetected, setCrisisDetected] = useState(false);
  const [context, setContext] = useState<UserContext | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversation history and user context on mount
  useEffect(() => {
    const init = async () => {
      setLoadingHistory(true);
      try {
        const [convResult, ctxResult] = await Promise.allSettled([
          chatApi.getConversations(20),
          userContextApi.get(),
        ]);

        if (convResult.status === 'fulfilled' && Array.isArray(convResult.value)) {
          setMessages(
            convResult.value.map((c) => ({
              id: c.id,
              role: c.role,
              content: c.content,
              created_at: c.created_at,
              isStreaming: false,
            }))
          );
        }

        if (ctxResult.status === 'fulfilled') {
          setContext(ctxResult.value);
        }
      } finally {
        setLoadingHistory(false);
      }
    };
    init();
  }, []);

  const handleSend = async (text?: string) => {
    const messageText = text ?? input.trim();
    if (!messageText || isStreaming) return;

    setInput('');
    setCrisisDetected(false);

    const isCrisis = detectCrisis(messageText);
    if (isCrisis) setCrisisDetected(true);

    const userMessage: Message = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: messageText,
      created_at: new Date().toISOString(),
    };

    const streamingId = `msg-mira-${Date.now()}`;
    const streamingMessage: Message = {
      id: streamingId,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, streamingMessage]);
    setIsStreaming(true);

    try {
      await chatApi.streamMessage(
        messageText,
        (chunk) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === streamingId ? { ...m, content: m.content + chunk } : m
            )
          );
        },
        () => {
          setMessages((prev) =>
            prev.map((m) => m.id === streamingId ? { ...m, isStreaming: false } : m)
          );
          setIsStreaming(false);
        }
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get a response';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamingId
            ? { ...m, content: `Sorry, I couldn't respond right now. (${errorMsg})`, isStreaming: false }
            : m
        )
      );
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden" data-testid="chat-screen">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="shrink-0 border-b border-border px-6 py-4 flex items-center justify-between bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-full gradient-violet-rose flex items-center justify-center">
                <Sparkles size={16} strokeWidth={1.5} className="text-white" />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-background" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-sm text-foreground">Mira</h2>
              <p className="text-xs text-muted-foreground">Your wellness companion</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowContext(!showContext)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium font-heading transition-all duration-150',
                showContext
                  ? 'bg-primary/10 text-primary' :'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
              data-testid="toggle-context-panel"
            >
              <BarChart3 size={14} strokeWidth={1.5} />
              <span className="hidden sm:inline">Context</span>
            </button>
          </div>
        </div>

        {/* Crisis Banner */}
        <AnimatePresence>
          {crisisDetected && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mx-4 mt-3 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/40 p-4 flex items-start gap-3"
              data-testid="crisis-banner"
            >
              <AlertTriangle size={16} strokeWidth={1.5} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-rose-700 dark:text-rose-300 font-heading mb-1">
                  If you&apos;re in crisis, please reach out
                </p>
                <p className="text-xs text-rose-600/80 dark:text-rose-400/80">
                  988 Suicide & Crisis Lifeline — call or text <strong>988</strong>. Crisis Text Line — text HOME to <strong>741741</strong>.
                </p>
              </div>
              <button
                onClick={() => setCrisisDetected(false)}
                className="text-rose-400 hover:text-rose-600 transition-colors"
                data-testid="dismiss-crisis-banner"
              >
                <X size={14} strokeWidth={1.5} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-6 space-y-2">
          {loadingHistory && (
            <div className="flex justify-center py-8">
              <span className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}
          {!loadingHistory && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="w-16 h-16 rounded-full gradient-violet-rose flex items-center justify-center mb-4">
                <Sparkles size={28} strokeWidth={1.5} className="text-white" />
              </div>
              <h3 className="font-heading font-semibold text-lg text-foreground mb-2">Hi, I&apos;m Mira</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Your personal wellness companion. Share what&apos;s on your mind and I&apos;ll listen.
              </p>
            </div>
          )}
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts — only show when no messages and not streaming */}
        {!isStreaming && messages.length === 0 && !loadingHistory && (
          <div className="px-4 pb-2">
            <QuickPromptChips prompts={QUICK_PROMPTS} onSelect={handleSend} />
          </div>
        )}

        {/* Input Area */}
        <div className="shrink-0 border-t border-border p-4">
          <div className="flex items-end gap-3 rounded-2xl border border-border bg-card p-3 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all duration-200">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Share what's on your mind..."
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none leading-relaxed max-h-32 scrollbar-thin"
              style={{ minHeight: '24px' }}
              data-testid="chat-input"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isStreaming}
              className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-150',
                input.trim() && !isStreaming
                  ? 'gradient-violet-rose text-white hover:opacity-90 active:scale-95'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              )}
              data-testid="send-btn"
            >
              {isStreaming ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send size={15} strokeWidth={2} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Context Panel */}
      <AnimatePresence>
        {showContext && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="shrink-0 border-l border-border overflow-hidden"
          >
            <ContextPanel context={context} onClose={() => setShowContext(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}