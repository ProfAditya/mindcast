'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, AlertTriangle, X, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockConversations, mockQuickPrompts, mockWellnessContext } from '@/lib/mockData';
import ChatMessage from './ChatMessage';
import ContextPanel from './ContextPanel';
import QuickPromptChips from './QuickPromptChips';
import { chatApi } from '@/lib/api';

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

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>(
    mockConversations.map((c) => ({ ...c, isStreaming: false }))
  );
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [crisisDetected, setCrisisDetected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      // Try SSE streaming first
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
    } catch {
      // Fallback: try non-streaming endpoint
      try {
        const response = await chatApi.sendMessage(messageText);
        const responseText = response.content;
        const words = responseText.split(' ');
        let accumulated = '';
        for (let i = 0; i < words.length; i++) {
          accumulated += (i > 0 ? ' ' : '') + words[i];
          const current = accumulated;
          setMessages((prev) =>
            prev.map((m) => m.id === streamingId ? { ...m, content: current } : m)
          );
          await new Promise((r) => setTimeout(r, 22));
        }
        setMessages((prev) =>
          prev.map((m) => m.id === streamingId ? { ...m, isStreaming: false } : m)
        );
        setIsStreaming(false);
      } catch {
        // Final fallback: simulated response
        const simulatedResponse = isCrisis
          ? "I hear something heavy in what you've shared, and I want you to know I'm here with you right now.\n\nYour safety matters more than anything. Please reach out to the **988 Suicide & Crisis Lifeline** (call or text 988 in the US) or your local emergency services. You don't have to carry this alone.\n\nIf you feel safe enough to keep talking with me, I'm listening. What's been happening for you?"
          : "That's something I've been thinking about too, based on what you've been sharing with me lately.\n\nYour energy levels have been genuinely improving — especially over the past week. The days when you exercise in the morning consistently show higher energy readings in the afternoon, which is a real pattern worth paying attention to.\n\n**What I'd suggest:**\n- Protect those morning movement windows, even if it's just 15 minutes\n- Notice how you feel on days you skip — not to judge, but to understand your own rhythm\n- Consider journaling after a good energy day to capture what contributed\n\nWhat feels most sustainable for you right now?";

        const words = simulatedResponse.split(' ');
        let accumulated = '';
        for (let i = 0; i < words.length; i++) {
          accumulated += (i > 0 ? ' ' : '') + words[i];
          const current = accumulated;
          setMessages((prev) =>
            prev.map((m) => m.id === streamingId ? { ...m, content: current } : m)
          );
          await new Promise((r) => setTimeout(r, 28));
        }
        setMessages((prev) =>
          prev.map((m) => m.id === streamingId ? { ...m, isStreaming: false } : m)
        );
        setIsStreaming(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickPrompt = (text: string) => {
    handleSend(text);
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
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts — only show when no streaming */}
        {!isStreaming && messages.length <= 5 && (
          <div className="px-4 pb-2">
            <QuickPromptChips prompts={mockQuickPrompts} onSelect={handleQuickPrompt} />
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
              data-testid="send-message-btn"
            >
              {isStreaming ? (
                <span className="w-3 h-3 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
              ) : (
                <Send size={15} strokeWidth={1.5} />
              )}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            Mira is an AI companion. For emergencies, contact local services.
          </p>
        </div>
      </div>

      {/* Context Panel */}
      <AnimatePresence>
        {showContext && (
          <motion.div
            initial={{ opacity: 0, x: 20, width: 0 }}
            animate={{ opacity: 1, x: 0, width: 320 }}
            exit={{ opacity: 0, x: 20, width: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="shrink-0 border-l border-border overflow-hidden"
            data-testid="context-panel"
          >
            <ContextPanel context={mockWellnessContext} onClose={() => setShowContext(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}