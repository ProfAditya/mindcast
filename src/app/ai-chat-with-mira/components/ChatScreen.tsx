'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, AlertTriangle, X, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import ChatMessage from './ChatMessage';
import ContextPanel from './ContextPanel';
import QuickPromptChips from './QuickPromptChips';
import { chatApi, userContextApi, assessmentsApi, moodApi, habitLogsApi, type UserContext, type AssessmentResult, type MoodEntry, type HabitLog } from '@/lib/api';

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

// Typing indicator component
function TypingIndicator() {
  return (
    <div className="flex items-start gap-4 py-2 px-2 lg:px-8 xl:px-16 2xl:px-24">
      <div className="w-7 h-7 rounded-full gradient-violet-rose flex items-center justify-center shrink-0 mt-1 elevation-xs">
        <Sparkles size={12} strokeWidth={1.5} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium font-heading text-muted-foreground mb-2 uppercase tracking-wider">Mira</p>
        <div className="flex items-center gap-1.5 py-2">
          <span className="typing-dot w-2 h-2 rounded-full bg-primary/50" />
          <span className="typing-dot w-2 h-2 rounded-full bg-primary/50" />
          <span className="typing-dot w-2 h-2 rounded-full bg-primary/50" />
        </div>
      </div>
    </div>
  );
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [crisisDetected, setCrisisDetected] = useState(false);
  const [context, setContext] = useState<UserContext | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [assessmentData, setAssessmentData] = useState<AssessmentResult | null>(null);
  const [assessmentHistory, setAssessmentHistory] = useState<AssessmentResult[]>([]);
  const [recentMoods, setRecentMoods] = useState<MoodEntry[]>([]);
  const [recentHabits, setRecentHabits] = useState<HabitLog[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const streamingIdRef = useRef<string | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, showTypingIndicator, scrollToBottom]);

  // Load conversation history and user context on mount
  useEffect(() => {
    const init = async () => {
      setLoadingHistory(true);
      try {
        const [convResult, ctxResult, assessResult, moodResult, habitResult, historyResult] = await Promise.allSettled([
          chatApi.getConversations(20),
          userContextApi.get(),
          assessmentsApi.getLatest(),
          moodApi.list(7),
          habitLogsApi.list(),
          assessmentsApi.list(10),
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

        if (ctxResult.status === 'fulfilled') setContext(ctxResult.value);
        if (assessResult.status === 'fulfilled' && assessResult.value) setAssessmentData(assessResult.value);
        if (moodResult.status === 'fulfilled' && Array.isArray(moodResult.value)) setRecentMoods(moodResult.value.slice(0, 7));
        if (habitResult.status === 'fulfilled' && Array.isArray(habitResult.value)) setRecentHabits(habitResult.value);
        if (historyResult.status === 'fulfilled' && Array.isArray(historyResult.value)) {
          const sorted = [...historyResult.value].sort(
            (a, b) => new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime()
          );
          setAssessmentHistory(sorted);
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

    setMessages((prev) => [...prev, userMessage]);
    setIsStreaming(true);
    setShowTypingIndicator(true);

    const streamingId = `msg-mira-${Date.now()}`;
    streamingIdRef.current = streamingId;

    let streamingStarted = false;

    // Build enriched assessment data with tier/role fields
    const enrichedAssessmentData = assessmentData ? {
      ...assessmentData,
      tier: (assessmentData as any).tier ?? undefined,
      user_role: (assessmentData as any).user_role ?? undefined,
      work_study_score: (assessmentData as any).work_study_score ?? assessmentData.lifestyle_score,
      emotional_score: (assessmentData as any).emotional_score ?? assessmentData.psychology_score,
    } : null;

    try {
      await chatApi.streamMessage(
        messageText,
        (chunk) => {
          if (!streamingStarted) {
            streamingStarted = true;
            setShowTypingIndicator(false);
            setMessages((prev) => [
              ...prev,
              {
                id: streamingId,
                role: 'assistant',
                content: chunk,
                created_at: new Date().toISOString(),
                isStreaming: true,
              },
            ]);
          } else {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === streamingId ? { ...m, content: m.content + chunk } : m
              )
            );
          }
        },
        () => {
          setShowTypingIndicator(false);
          setMessages((prev) =>
            prev.map((m) => m.id === streamingId ? { ...m, isStreaming: false } : m)
          );
          setIsStreaming(false);
          streamingIdRef.current = null;
        },
        {
          assessmentData: enrichedAssessmentData,
          assessmentHistory,
          recentMoods,
          recentHabits,
          chatHistory: messages.filter((m) => !m.isStreaming).slice(-20),
        }
      );
    } catch {
      setShowTypingIndicator(false);
      const fallbackMessage: Message = {
        id: streamingId,
        role: 'assistant',
        content: "I hear you, and I'm here with you. Let's take a slow, deep breath together — in for 4 counts, hold for 4, out for 6. You're not alone in this. 💙",
        created_at: new Date().toISOString(),
        isStreaming: false,
      };
      setMessages((prev) => {
        const hasStreaming = prev.some((m) => m.id === streamingId);
        if (hasStreaming) {
          return prev.map((m) => m.id === streamingId ? fallbackMessage : m);
        }
        return [...prev, fallbackMessage];
      });
      setIsStreaming(false);
      streamingIdRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 128) + 'px';
  };

  return (
    <div className="flex h-[calc(100vh-60px)] overflow-hidden" data-testid="chat-screen">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Chat Header */}
        <div className="shrink-0 border-b border-border px-5 py-3.5 flex items-center justify-between glass-light dark:glass-dark">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-full gradient-violet-rose flex items-center justify-center elevation-sm">
                <Sparkles size={15} strokeWidth={1.5} className="text-white" />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-background" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-[14px] text-foreground">Mira</h2>
              <p className="text-[11px] text-muted-foreground">Your wellness companion · Always here</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Wellness Score Badge */}
            {assessmentData?.overall_score != null && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-primary/10 border border-primary/20">
                <span className="text-[10px] font-semibold font-heading text-muted-foreground uppercase tracking-wide">Score</span>
                <span className="text-xs font-bold font-heading text-primary">{assessmentData.overall_score}/100</span>
              </div>
            )}
            <button
              onClick={() => setShowContext(!showContext)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium font-heading transition-all duration-150',
                showContext
                  ? 'bg-primary/10 text-primary' :'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
              data-testid="toggle-context-panel"
            >
              <BarChart3 size={13} strokeWidth={1.5} />
              <span className="hidden sm:inline">Context</span>
            </button>
          </div>
        </div>

        {/* Crisis Banner */}
        <AnimatePresence>
          {crisisDetected && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden shrink-0"
              data-testid="crisis-banner"
            >
              <div className="mx-4 mt-3 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/40 p-4 flex items-start gap-3">
                <AlertTriangle size={15} strokeWidth={1.5} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
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
                  className="text-rose-400 hover:text-rose-600 transition-colors shrink-0"
                  data-testid="dismiss-crisis-banner"
                >
                  <X size={14} strokeWidth={1.5} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-2 py-5 space-y-1">
          {/* Loading skeleton */}
          {loadingHistory && (
            <div className="flex flex-col gap-4 px-4 py-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className={cn('flex gap-3', i % 2 === 0 && 'justify-end')}>
                  {i % 2 !== 0 && <div className="w-7 h-7 rounded-full skeleton-shimmer shrink-0" />}
                  <div className={cn('rounded-2xl skeleton-shimmer', i % 2 === 0 ? 'w-48 h-12' : 'w-64 h-16')} />
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loadingHistory && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-16 px-6">
              <div className="w-16 h-16 rounded-2xl gradient-violet-rose flex items-center justify-center mb-5 elevation-md">
                <Sparkles size={26} strokeWidth={1.5} className="text-white" />
              </div>
              <h3 className="font-heading font-semibold text-lg text-foreground mb-2">Hi, I&apos;m Mira</h3>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                Your personal wellness companion. Share what&apos;s on your mind — I&apos;m here to listen and support you.
              </p>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </AnimatePresence>

          {/* Typing indicator — shown before streaming starts */}
          <AnimatePresence>
            {showTypingIndicator && (
              <motion.div
                key="typing-indicator"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <TypingIndicator />
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} className="h-1" />
        </div>

        {/* Quick Prompts */}
        {!isStreaming && messages.length === 0 && !loadingHistory && (
          <div className="shrink-0 px-4 pb-2">
            <QuickPromptChips prompts={QUICK_PROMPTS} onSelect={handleSend} />
          </div>
        )}

        {/* Input Area */}
        <div className="shrink-0 border-t border-border p-4 glass-light dark:glass-dark">
          <div className="flex items-end gap-3 rounded-2xl border border-border bg-card/80 p-3 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition-all duration-200 elevation-xs">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Share what's on your mind…"
              rows={1}
              disabled={isStreaming}
              className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none leading-relaxed scrollbar-thin disabled:opacity-60"
              style={{ minHeight: '24px', maxHeight: '128px' }}
              data-testid="chat-input"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isStreaming}
              className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-150',
                input.trim() && !isStreaming
                  ? 'gradient-violet-rose text-white hover:opacity-90 active:scale-95 elevation-sm'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              )}
              data-testid="send-btn"
            >
              {isStreaming ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send size={14} strokeWidth={2} />
              )}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground/60 text-center mt-2">
            Mira is an AI wellness companion, not a licensed therapist.
          </p>
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