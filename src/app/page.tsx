'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AssessmentAnswer {
  questionId: number;
  value: number;
}

interface MoodOption {
  label: string;
  emoji: string;
  color: string;
  bg: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const ASSESSMENT_QUESTIONS = [
  {
    id: 1,
    category: 'Stress',
    question: 'How would you rate your stress level over the past week?',
    low: 'Very Low',
    high: 'Very High',
  },
  {
    id: 2,
    category: 'Sleep',
    question: 'How satisfied are you with the quality of your sleep?',
    low: 'Very Poor',
    high: 'Excellent',
  },
  {
    id: 3,
    category: 'Emotional Load',
    question: 'How heavy does your emotional load feel right now?',
    low: 'Very Light',
    high: 'Overwhelming',
  },
  {
    id: 4,
    category: 'Energy',
    question: 'How would you describe your overall energy levels today?',
    low: 'Depleted',
    high: 'Vibrant',
  },
  {
    id: 5,
    category: 'Connection',
    question: 'How connected do you feel to the people around you?',
    low: 'Isolated',
    high: 'Deeply Connected',
  },
];

const MOOD_OPTIONS: MoodOption[] = [
  { label: 'Calm', emoji: '🌿', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  { label: 'Grateful', emoji: '✨', color: '#6ee7b7', bg: 'rgba(110,231,183,0.12)' },
  { label: 'Anxious', emoji: '🌀', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  { label: 'Overwhelmed', emoji: '🌊', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  { label: 'Exhausted', emoji: '🌙', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  { label: 'Hopeful', emoji: '🌅', color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  { label: 'Sad', emoji: '🌧️', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
  { label: 'Energised', emoji: '⚡', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
];

const AI_REFLECTIONS = [
  "Thank you for sharing that with me. What you're feeling is completely valid — the weight you're carrying deserves to be acknowledged, not rushed past. Take a slow breath. You don't have to solve everything today. One small, gentle step is enough.",
  "I hear you. The courage it takes to put these feelings into words is real and meaningful. You are not alone in this. Consider what your body needs right now — rest, water, a moment of stillness. You are doing better than you think.",
  "Your words carry so much honesty. That kind of self-awareness is a quiet strength. Whatever you're navigating, remember that difficult seasons pass. Be as kind to yourself today as you would be to someone you deeply love.",
  "What you've written reflects a mind that is working hard to process and understand. That's not weakness — it's wisdom in motion. Give yourself permission to feel without judgment. You are safe here.",
];

const BREATHING_PHASES = [
  { label: 'Inhale', duration: 4000, scale: 1.6 },
  { label: 'Hold', duration: 2000, scale: 1.6 },
  { label: 'Exhale', duration: 6000, scale: 1.0 },
  { label: 'Rest', duration: 2000, scale: 1.0 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function computeWellnessScore(answers: AssessmentAnswer[]): number {
  if (answers.length === 0) return 0;
  // Invert stress and emotional load (lower is better)
  const invertIds = new Set([1, 3]);
  const total = answers.reduce((sum, a) => {
    const val = invertIds.has(a.questionId) ? 11 - a.value : a.value;
    return sum + val;
  }, 0);
  return Math.round((total / (answers.length * 10)) * 100);
}

function scoreLabel(score: number): { label: string; color: string } {
  if (score >= 75) return { label: 'Thriving', color: '#10b981' };
  if (score >= 55) return { label: 'Balanced', color: '#6ee7b7' };
  if (score >= 35) return { label: 'Navigating', color: '#f59e0b' };
  return { label: 'Needs Care', color: '#f87171' };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// Wellness Assessment
function WellnessAssessment() {
  const [step, setStep] = useState(0); // 0 = intro, 1-5 = questions, 6 = result
  const [answers, setAnswers] = useState<AssessmentAnswer[]>([]);
  const [selected, setSelected] = useState<number | null>(null);

  const currentQ = ASSESSMENT_QUESTIONS[step - 1];
  const isIntro = step === 0;
  const isDone = step > ASSESSMENT_QUESTIONS.length;
  const score = computeWellnessScore(answers);
  const { label, color } = scoreLabel(score);

  const handleNext = () => {
    if (step > 0 && step <= ASSESSMENT_QUESTIONS.length && selected !== null) {
      setAnswers((prev) => [...prev, { questionId: currentQ.id, value: selected }]);
    }
    setSelected(null);
    setStep((s) => s + 1);
  };

  const handleReset = () => {
    setStep(0);
    setAnswers([]);
    setSelected(null);
  };

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {isIntro && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="text-center space-y-5 py-4"
          >
            <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-2xl"
              style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}>
              🧭
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Wellness Assessment</h3>
              <p className="text-sm text-neutral-400 leading-relaxed max-w-sm mx-auto">
                A gentle 5-question check-in to understand where you are right now. There are no right or wrong answers.
              </p>
            </div>
            <button
              onClick={handleNext}
              className="px-7 py-3 rounded-2xl text-sm font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #059669, #10b981)', boxShadow: '0 4px 20px rgba(16,185,129,0.3)' }}
            >
              Begin Check-In
            </button>
          </motion.div>
        )}

        {!isIntro && !isDone && currentQ && (
          <motion.div
            key={`q-${step}`}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6"
          >
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-neutral-500">
                <span className="font-mono">{currentQ.category}</span>
                <span>{step} / {ASSESSMENT_QUESTIONS.length}</span>
              </div>
              <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #059669, #10b981)' }}
                  initial={{ width: `${((step - 1) / ASSESSMENT_QUESTIONS.length) * 100}%` }}
                  animate={{ width: `${(step / ASSESSMENT_QUESTIONS.length) * 100}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>

            <p className="text-base font-medium text-white leading-relaxed">{currentQ.question}</p>

            {/* Rating Scale */}
            <div className="space-y-3">
              <div className="flex gap-2 justify-between">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
                  <button
                    key={val}
                    onClick={() => setSelected(val)}
                    className="flex-1 h-10 rounded-xl text-sm font-semibold transition-all duration-200"
                    style={{
                      background: selected === val ? 'linear-gradient(135deg, #059669, #10b981)' : 'rgba(255,255,255,0.04)',
                      border: selected === val ? '1px solid rgba(16,185,129,0.5)' : '1px solid rgba(255,255,255,0.08)',
                      color: selected === val ? '#fff' : '#6b7280',
                      transform: selected === val ? 'scale(1.08)' : 'scale(1)',
                      boxShadow: selected === val ? '0 4px 16px rgba(16,185,129,0.25)' : 'none',
                    }}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-neutral-500">
                <span>{currentQ.low}</span>
                <span>{currentQ.high}</span>
              </div>
            </div>

            <button
              onClick={handleNext}
              disabled={selected === null}
              className="w-full py-3 rounded-2xl text-sm font-semibold text-white transition-all"
              style={{
                background: selected !== null ? 'linear-gradient(135deg, #059669, #10b981)' : 'rgba(255,255,255,0.06)',
                color: selected !== null ? '#fff' : '#6b7280',
                cursor: selected !== null ? 'pointer' : 'not-allowed',
              }}
            >
              {step === ASSESSMENT_QUESTIONS.length ? 'See My Results' : 'Next Question →'}
            </button>
          </motion.div>
        )}

        {isDone && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6 text-center"
          >
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-widest font-mono text-neutral-500">Your Wellness Score</p>
              <div className="relative w-28 h-28 mx-auto">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                  <motion.circle
                    cx="50" cy="50" r="40" fill="none"
                    stroke={color} strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - score / 100) }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-white">{score}</span>
                  <span className="text-[10px] text-neutral-400 font-mono">/ 100</span>
                </div>
              </div>
              <div>
                <p className="text-xl font-bold" style={{ color }}>{label}</p>
                <p className="text-sm text-neutral-400 mt-1 max-w-xs mx-auto leading-relaxed">
                  {score >= 75
                    ? 'You\'re in a good place. Keep nurturing what\'s working.'
                    : score >= 55
                    ? 'You\'re finding your balance. Small consistent steps matter.'
                    : score >= 35
                    ? 'You\'re navigating something real. Be gentle with yourself.' :'Your wellbeing needs attention. You deserve care and rest.'}
                </p>
              </div>
            </div>

            {/* Per-category breakdown */}
            <div className="space-y-2 text-left">
              {answers.map((a, i) => {
                const q = ASSESSMENT_QUESTIONS[i];
                const invertIds = new Set([1, 3]);
                const normalized = invertIds.has(q.id) ? 11 - a.value : a.value;
                const pct = (normalized / 10) * 100;
                return (
                  <div key={q.id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-400">{q.category}</span>
                      <span className="text-neutral-500 font-mono">{normalized}/10</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleReset}
              className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors font-mono"
            >
              Retake Assessment
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Mood Check-In
function MoodCheckIn() {
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    if (selected) setConfirmed(true);
  };

  const handleReset = () => {
    setSelected(null);
    setConfirmed(false);
  };

  return (
    <div className="space-y-5">
      <AnimatePresence mode="wait">
        {!confirmed ? (
          <motion.div
            key="picker"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            <p className="text-sm text-neutral-400 leading-relaxed">
              How are you feeling right now? Choose what resonates most.
            </p>
            <div className="grid grid-cols-4 gap-2.5">
              {MOOD_OPTIONS.map((mood) => (
                <motion.button
                  key={mood.label}
                  onClick={() => setSelected(mood.label)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all duration-200"
                  style={{
                    background: selected === mood.label ? mood.bg : 'rgba(255,255,255,0.03)',
                    border: selected === mood.label
                      ? `1px solid ${mood.color}50`
                      : '1px solid rgba(255,255,255,0.07)',
                    boxShadow: selected === mood.label ? `0 4px 20px ${mood.color}25` : 'none',
                  }}
                >
                  <span className="text-xl">{mood.emoji}</span>
                  <span className="text-[11px] font-medium" style={{ color: selected === mood.label ? mood.color : '#9ca3af' }}>
                    {mood.label}
                  </span>
                </motion.button>
              ))}
            </div>
            <button
              onClick={handleConfirm}
              disabled={!selected}
              className="w-full py-3 rounded-2xl text-sm font-semibold transition-all"
              style={{
                background: selected ? 'linear-gradient(135deg, #059669, #10b981)' : 'rgba(255,255,255,0.05)',
                color: selected ? '#fff' : '#6b7280',
                cursor: selected ? 'pointer' : 'not-allowed',
              }}
            >
              Log This Feeling
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="confirmed"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="text-center space-y-4 py-4"
          >
            {(() => {
              const mood = MOOD_OPTIONS.find((m) => m.label === selected)!;
              return (
                <>
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-3xl"
                    style={{ background: mood.bg, border: `1px solid ${mood.color}40` }}
                  >
                    {mood.emoji}
                  </motion.div>
                  <div>
                    <p className="text-base font-semibold text-white">Feeling <span style={{ color: mood.color }}>{mood.label}</span></p>
                    <p className="text-sm text-neutral-400 mt-1">Your mood has been logged. Thank you for checking in.</p>
                  </div>
                  <div className="p-4 rounded-2xl text-sm text-neutral-300 leading-relaxed text-left"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    {mood.label === 'Calm' && 'This is a beautiful state to be in. Use this clarity to do something meaningful.'}
                    {mood.label === 'Grateful' && 'Gratitude is a powerful anchor. Let it guide your next few hours.'}
                    {mood.label === 'Anxious' && 'Anxiety is your nervous system asking for safety. Try a slow breath — in for 4, out for 6.'}
                    {mood.label === 'Overwhelmed' && 'When everything feels like too much, do one small thing. Just one.'}
                    {mood.label === 'Exhausted' && 'Rest is not laziness — it\'s recovery. Give yourself permission to slow down.'}
                    {mood.label === 'Hopeful' && 'Hope is a quiet strength. Nurture it with small, intentional actions today.'}
                    {mood.label === 'Sad' && 'Sadness deserves space, not suppression. Be gentle with yourself right now.'}
                    {mood.label === 'Energised' && 'Channel this energy into something that matters to you. You\'re in a great state.'}
                  </div>
                  <button onClick={handleReset} className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors font-mono">
                    Check in again
                  </button>
                </>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Journal + AI Reflection
function JournalReflection() {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [reflection, setReflection] = useState<string | null>(null);
  const [loadingDot, setLoadingDot] = useState(0);

  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => setLoadingDot((d) => (d + 1) % 3), 500);
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setIsLoading(true);
    setReflection(null);
    setTimeout(() => {
      const idx = Math.floor(Math.random() * AI_REFLECTIONS.length);
      setReflection(AI_REFLECTIONS[idx]);
      setIsLoading(false);
    }, 2800);
  };

  const handleReset = () => {
    setText('');
    setReflection(null);
    setIsLoading(false);
  };

  return (
    <div className="space-y-5">
      <AnimatePresence mode="wait">
        {!reflection && !isLoading && (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <p className="text-sm text-neutral-400 leading-relaxed">
              This is your private space. Write freely — no judgment, no audience.
            </p>
            <textarea
              rows={6}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What's on your mind today? How are you really feeling?..."
              className="w-full rounded-2xl p-4 text-sm text-white leading-relaxed resize-none focus:outline-none transition-all"
              style={{
                background: 'rgba(0,0,0,0.35)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#f5f5f5',
              }}
              onFocus={(e) => { e.target.style.borderColor = 'rgba(16,185,129,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.08)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
            />
            <button
              type="submit"
              disabled={!text.trim()}
              className="w-full py-3 rounded-2xl text-sm font-semibold transition-all"
              style={{
                background: text.trim() ? 'linear-gradient(135deg, #059669, #10b981)' : 'rgba(255,255,255,0.05)',
                color: text.trim() ? '#fff' : '#6b7280',
                cursor: text.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Receive Compassionate Reflection
            </button>
          </motion.form>
        )}

        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center justify-center py-12 space-y-5"
          >
            <div className="relative w-12 h-12">
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ border: '2px solid rgba(16,185,129,0.2)' }}
              />
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ border: '2px solid transparent', borderTopColor: '#10b981' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-white">
                Reading your words with care
                <span className="inline-flex gap-0.5 ml-1">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="w-1 h-1 rounded-full inline-block"
                      style={{ background: '#10b981' }}
                      animate={{ opacity: loadingDot === i ? 1 : 0.2 }}
                      transition={{ duration: 0.2 }}
                    />
                  ))}
                </span>
              </p>
              <p className="text-xs text-neutral-500 font-mono">Crafting a compassionate response</p>
            </div>
          </motion.div>
        )}

        {reflection && !isLoading && (
          <motion.div
            key="reflection"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-4"
          >
            <div className="p-5 rounded-2xl space-y-3"
              style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,78,59,0.06))', border: '1px solid rgba(16,185,129,0.2)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
                  style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
                  🌿
                </div>
                <div>
                  <p className="text-xs font-semibold text-emerald-400">Compassionate Reflection</p>
                  <p className="text-[11px] text-neutral-500 font-mono">AI-generated · for you</p>
                </div>
              </div>
              <p className="text-sm text-neutral-200 leading-relaxed">{reflection}</p>
            </div>

            <div className="p-4 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs text-neutral-500 leading-relaxed italic">
                "{text.length > 120 ? text.slice(0, 120) + '…' : text}"
              </p>
            </div>

            <button onClick={handleReset} className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors font-mono">
              Write another entry
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Breathing Exercise
function BreathingExercise() {
  const [isActive, setIsActive] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentPhase = BREATHING_PHASES[phaseIndex];

  useEffect(() => {
    if (!isActive) return;
    timerRef.current = setTimeout(() => {
      const next = (phaseIndex + 1) % BREATHING_PHASES.length;
      if (next === 0) setCycleCount((c) => c + 1);
      setPhaseIndex(next);
    }, currentPhase.duration);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isActive, phaseIndex, currentPhase.duration]);

  const handleToggle = () => {
    if (isActive) {
      setIsActive(false);
      setPhaseIndex(0);
    } else {
      setIsActive(true);
      setPhaseIndex(0);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-8 py-4">
      <div className="text-center space-y-1">
        <p className="text-sm text-neutral-400">
          {isActive ? 'Follow the circle. Let your breath guide you.' : 'A guided breathing exercise to calm your nervous system.'}
        </p>
        {cycleCount > 0 && (
          <p className="text-xs text-emerald-400 font-mono">{cycleCount} cycle{cycleCount !== 1 ? 's' : ''} completed</p>
        )}
      </div>

      {/* Visualizer */}
      <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
        {/* Outer glow rings */}
        {isActive && (
          <>
            <motion.div
              className="absolute rounded-full"
              style={{ background: 'rgba(16,185,129,0.04)', width: 200, height: 200 }}
              animate={{ scale: currentPhase.scale * 1.15, opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: currentPhase.duration / 1000, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute rounded-full"
              style={{ background: 'rgba(16,185,129,0.07)', width: 160, height: 160 }}
              animate={{ scale: currentPhase.scale * 1.05 }}
              transition={{ duration: currentPhase.duration / 1000, ease: 'easeInOut' }}
            />
          </>
        )}

        {/* Main circle */}
        <motion.div
          className="rounded-full flex items-center justify-center cursor-pointer select-none"
          style={{
            width: 120,
            height: 120,
            background: isActive
              ? 'radial-gradient(circle, rgba(16,185,129,0.35) 0%, rgba(5,150,105,0.2) 60%, transparent 100%)'
              : 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
            border: isActive ? '1.5px solid rgba(16,185,129,0.5)' : '1.5px solid rgba(255,255,255,0.1)',
            boxShadow: isActive ? '0 0 40px rgba(16,185,129,0.2)' : 'none',
          }}
          animate={isActive ? { scale: currentPhase.scale } : { scale: 1 }}
          transition={isActive ? { duration: currentPhase.duration / 1000, ease: 'easeInOut' } : { duration: 0.3 }}
          onClick={handleToggle}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isActive ? currentPhase.label : 'idle'}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.25 }}
              className="text-center"
            >
              {isActive ? (
                <>
                  <p className="text-sm font-semibold text-emerald-300">{currentPhase.label}</p>
                  <p className="text-xs text-emerald-400/60 font-mono">{currentPhase.duration / 1000}s</p>
                </>
              ) : (
                <p className="text-xs text-neutral-400">Tap to begin</p>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Phase indicators */}
      <div className="flex gap-3">
        {BREATHING_PHASES.map((phase, i) => (
          <div key={phase.label} className="flex flex-col items-center gap-1">
            <motion.div
              className="w-2 h-2 rounded-full"
              style={{ background: isActive && phaseIndex === i ? '#10b981' : 'rgba(255,255,255,0.12)' }}
              animate={isActive && phaseIndex === i ? { scale: [1, 1.4, 1] } : { scale: 1 }}
              transition={{ duration: 0.6, repeat: isActive && phaseIndex === i ? Infinity : 0 }}
            />
            <span className="text-[10px] font-mono" style={{ color: isActive && phaseIndex === i ? '#10b981' : '#6b7280' }}>
              {phase.label}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={handleToggle}
        className="px-7 py-2.5 rounded-2xl text-sm font-semibold transition-all"
        style={{
          background: isActive ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #059669, #10b981)',
          border: isActive ? '1px solid rgba(255,255,255,0.1)' : 'none',
          color: '#fff',
          boxShadow: isActive ? 'none' : '0 4px 20px rgba(16,185,129,0.3)',
        }}
      >
        {isActive ? 'Stop Exercise' : 'Start Breathing'}
      </button>
    </div>
  );
}

// ─── Dashboard Tab ─────────────────────────────────────────────────────────────
type DashTab = 'assessment' | 'mood' | 'journal' | 'breathing';

const DASH_TABS: { id: DashTab; label: string; emoji: string }[] = [
  { id: 'assessment', label: 'Wellness Check', emoji: '🧭' },
  { id: 'mood', label: 'Mood Check-In', emoji: '🌿' },
  { id: 'journal', label: 'Journal', emoji: '📖' },
  { id: 'breathing', label: 'Breathe', emoji: '🫁' },
];

function Dashboard() {
  const [activeTab, setActiveTab] = useState<DashTab>('assessment');

  return (
    <section id="sanctuary" className="px-6 lg:px-16 py-20 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono mb-5"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#6ee7b7' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Interactive Sanctuary
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">Your wellness workspace.</h2>
        <p className="text-neutral-400 text-sm max-w-md mx-auto leading-relaxed">
          Four tools, one calm space. Check in with yourself whenever you need to.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-3xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {/* Tab Bar */}
        <div className="flex border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {DASH_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-1.5 py-4 px-3 text-xs font-medium transition-all duration-200 relative"
              style={{ color: activeTab === tab.id ? '#10b981' : '#6b7280' }}
            >
              <span className="text-base sm:text-sm">{tab.emoji}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ background: 'linear-gradient(90deg, #059669, #10b981)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 sm:p-8 min-h-[420px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {activeTab === 'assessment' && <WellnessAssessment />}
              {activeTab === 'mood' && <MoodCheckIn />}
              {activeTab === 'journal' && <JournalReflection />}
              {activeTab === 'breathing' && <BreathingExercise />}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </section>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function MindCastLanding() {
  const [scrolled, setScrolled] = useState(false);
  const [showSanctuary, setShowSanctuary] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleOpenSanctuary = () => {
    setShowSanctuary(true);
    setTimeout(() => {
      document.getElementById('sanctuary')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#09090b',
        color: '#f5f5f5',
        fontFamily: "'Plus Jakarta Sans', 'DM Sans', sans-serif",
        overflowX: 'hidden',
      }}
    >
      {/* Google Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::selection { background: rgba(16,185,129,0.25); color: #d1fae5; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        textarea::placeholder { color: rgba(255,255,255,0.2) !important; }
      `}</style>

      {/* Ambient background orbs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-10rem', left: '-8rem',
          width: 700, height: 700, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 65%)',
          animation: 'orbFloat 22s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '-6rem', right: '-8rem',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(20,184,166,0.06) 0%, transparent 65%)',
          animation: 'orbFloat 28s ease-in-out infinite reverse',
        }} />
        <div style={{
          position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(52,211,153,0.04) 0%, transparent 70%)',
        }} />
      </div>
      <style>{`
        @keyframes orbFloat {
          0%, 100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(30px, 40px) scale(1.06); }
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav
        style={{
          position: 'sticky', top: 0, zIndex: 50,
          backdropFilter: scrolled ? 'blur(24px) saturate(180%)' : 'blur(12px)',
          WebkitBackdropFilter: scrolled ? 'blur(24px) saturate(180%)' : 'blur(12px)',
          background: scrolled ? 'rgba(9,9,11,0.88)' : 'rgba(9,9,11,0.6)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          transition: 'background 0.3s ease, backdrop-filter 0.3s ease',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 12,
              background: 'linear-gradient(135deg, #059669, #10b981, #34d399)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, color: '#fff', fontSize: 16,
              boxShadow: '0 4px 16px rgba(16,185,129,0.35)',
            }}>M</div>
            <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em', color: '#fff' }}>MindCast</span>
          </div>

          {/* Nav links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <a href="#features" style={{ fontSize: 13, color: '#9ca3af', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}>
              Features
            </a>
            <a href="#sanctuary" style={{ fontSize: 13, color: '#9ca3af', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}>
              Sanctuary
            </a>
            <Link href="/dashboard" style={{ fontSize: 13, color: '#9ca3af', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}>
              Dashboard
            </Link>
          </div>

          {/* CTA */}
          <button
            onClick={handleOpenSanctuary}
            style={{
              padding: '10px 22px', borderRadius: 999, fontSize: 13, fontWeight: 600,
              background: 'linear-gradient(135deg, #059669, #10b981)',
              color: '#fff', border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(16,185,129,0.35)',
              transition: 'opacity 0.2s, transform 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            Open Sanctuary
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '100px 24px 80px', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 999, marginBottom: 28,
            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
            fontSize: 12, color: '#6ee7b7', fontFamily: 'monospace',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulse 2s ease-in-out infinite' }} />
            Your mental health sanctuary
          </div>

          <h1 style={{
            fontSize: 'clamp(2.4rem, 6vw, 4.5rem)',
            fontWeight: 800, letterSpacing: '-0.03em',
            lineHeight: 1.08, color: '#fff', marginBottom: 24,
            maxWidth: 780, margin: '0 auto 24px',
          }}>
            Find stillness in the{' '}
            <span style={{
              background: 'linear-gradient(135deg, #10b981, #34d399, #6ee7b7)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              noise of everyday life.
            </span>
          </h1>

          <p style={{
            fontSize: 16, color: '#9ca3af', maxWidth: 520, margin: '0 auto 44px',
            lineHeight: 1.75, fontWeight: 400,
          }}>
            MindCast is a calm, private space for emotional check-ins, guided breathing, reflective journaling, and compassionate AI support — built for real humans navigating real life.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleOpenSanctuary}
              style={{
                padding: '14px 32px', borderRadius: 16, fontSize: 14, fontWeight: 600,
                background: 'linear-gradient(135deg, #059669, #10b981)',
                color: '#fff', border: 'none', cursor: 'pointer',
                boxShadow: '0 8px 32px rgba(16,185,129,0.35)',
              }}
            >
              Open Sanctuary
            </motion.button>
            <motion.a
              href="#features"
              whileHover={{ scale: 1.02 }}
              style={{
                padding: '14px 32px', borderRadius: 16, fontSize: 14, fontWeight: 500,
                background: 'rgba(255,255,255,0.04)', color: '#d1d5db',
                border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
                textDecoration: 'none', display: 'inline-block',
              }}
            >
              Explore Features
            </motion.a>
          </div>
        </motion.div>

        {/* Hero visual card */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          style={{ marginTop: 64, maxWidth: 680, margin: '64px auto 0' }}
        >
          <div style={{
            borderRadius: 24, padding: 28,
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f87171' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fbbf24' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#34d399' }} />
              <span style={{ marginLeft: 'auto', fontSize: 11, color: '#6b7280', fontFamily: 'monospace' }}>mindcast · sanctuary</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Wellness Score', value: '78', unit: '/ 100', color: '#10b981', emoji: '🧭' },
                { label: 'Current Mood', value: 'Calm', unit: '', color: '#34d399', emoji: '🌿' },
                { label: 'Journal Streak', value: '7', unit: 'days', color: '#6ee7b7', emoji: '📖' },
                { label: 'Breathing Sessions', value: '3', unit: 'today', color: '#a7f3d0', emoji: '🫁' },
              ].map((item) => (
                <div key={item.label} style={{
                  padding: '16px 18px', borderRadius: 16,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <span style={{ fontSize: 14 }}>{item.emoji}</span>
                    <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>{item.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 22, fontWeight: 700, color: item.color }}>{item.value}</span>
                    {item.unit && <span style={{ fontSize: 11, color: '#6b7280' }}>{item.unit}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 80 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{ textAlign: 'center', marginBottom: 56 }}
          >
            <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 700, color: '#fff', letterSpacing: '-0.025em', marginBottom: 12 }}>
              Designed for your inner world.
            </h2>
            <p style={{ fontSize: 14, color: '#6b7280', maxWidth: 400, margin: '0 auto' }}>
              Every tool built with care, privacy, and emotional intelligence at its core.
            </p>
          </motion.div>

          {/* Asymmetric bento grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16 }}>
            {/* Large card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.05 }}
              style={{ gridColumn: 'span 7', padding: '36px 32px', borderRadius: 24, position: 'relative', overflow: 'hidden', cursor: 'default' }}
              className="feature-card"
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(16,185,129,0.25)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}
              whileHover={{ y: -3 }}
            >
              <style>{`.feature-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07); transition: border-color 0.3s, box-shadow 0.3s; }`}</style>
              <div style={{ position: 'absolute', top: 0, right: 0, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 20 }}>🧭</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 10, letterSpacing: '-0.02em' }}>Multi-Step Wellness Assessment</h3>
              <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.7 }}>A thoughtful 5-question check-in across stress, sleep, emotional load, energy, and connection — generating a personalised wellness score with category breakdowns.</p>
            </motion.div>

            {/* Stat card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              style={{ gridColumn: 'span 5', padding: '36px 28px', borderRadius: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              whileHover={{ y: -3 }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 20 }}>🌿</div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 10, letterSpacing: '-0.02em' }}>Mood Check-In</h3>
                <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.7 }}>Select your emotional state from 8 nuanced options. Each selection returns a grounding micro-reflection tailored to that feeling.</p>
              </div>
            </motion.div>

            {/* Journal card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
              style={{ gridColumn: 'span 5', padding: '36px 28px', borderRadius: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
              whileHover={{ y: -3 }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(110,231,183,0.1)', border: '1px solid rgba(110,231,183,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 20 }}>📖</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 10, letterSpacing: '-0.02em' }}>Safe Journaling</h3>
              <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.7 }}>A distraction-free writing space. Submit your entry and receive a warm, AI-generated compassionate reflection — no data stored, no judgment.</p>
            </motion.div>

            {/* Breathing card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={{ gridColumn: 'span 7', padding: '36px 32px', borderRadius: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', position: 'relative', overflow: 'hidden' }}
              whileHover={{ y: -3 }}
            >
              <div style={{ position: 'absolute', bottom: -20, right: -20, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(167,243,208,0.1)', border: '1px solid rgba(167,243,208,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 20 }}>🫁</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 10, letterSpacing: '-0.02em' }}>Guided Breathing Visualizer</h3>
              <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.7 }}>An animated expanding/contracting circle guides you through a 4-2-6-2 breathing pattern — inhale, hold, exhale, rest — to calm your nervous system in minutes.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── DASHBOARD / SANCTUARY ── */}
      {showSanctuary && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          style={{ position: 'relative', zIndex: 1 }}
        >
          <Dashboard />
        </motion.div>
      )}

      {!showSanctuary && (
        <section style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px', textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{
              padding: '56px 32px', borderRadius: 28,
              background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(5,150,105,0.04))',
              border: '1px solid rgba(16,185,129,0.15)',
            }}
          >
            <p style={{ fontSize: 12, color: '#6ee7b7', fontFamily: 'monospace', marginBottom: 16, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Ready when you are</p>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 700, color: '#fff', letterSpacing: '-0.025em', marginBottom: 14 }}>
              Your sanctuary is one click away.
            </h2>
            <p style={{ fontSize: 14, color: '#6b7280', maxWidth: 380, margin: '0 auto 32px', lineHeight: 1.7 }}>
              No account needed. No data collected. Just you, your thoughts, and a calm space to breathe.
            </p>
            <motion.button
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleOpenSanctuary}
              style={{
                padding: '14px 36px', borderRadius: 16, fontSize: 14, fontWeight: 600,
                background: 'linear-gradient(135deg, #059669, #10b981)',
                color: '#fff', border: 'none', cursor: 'pointer',
                boxShadow: '0 8px 32px rgba(16,185,129,0.35)',
              }}
            >
              Open Sanctuary
            </motion.button>
          </motion.div>
        </section>
      )}

      {/* ── FOOTER ── */}
      <footer style={{
        position: 'relative', zIndex: 1,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '32px 24px',
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        maxWidth: 1200, margin: '0 auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 8,
            background: 'linear-gradient(135deg, #059669, #10b981)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, color: '#fff', fontSize: 12,
          }}>M</div>
          <span style={{ fontSize: 12, color: '#6b7280' }}>© {new Date().getFullYear()} MindCast. All rights reserved.</span>
        </div>
        <p className="text-xs text-neutral-500 font-mono tracking-wider">
          Made by Aditya Naik and Vihaan Vaghela
        </p>
      </footer>
    </div>
  );
}