'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Moon, Zap, Leaf, CheckCircle2, ChevronRight,
  RotateCcw, TrendingUp, AlertCircle, Loader2, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { assessmentsApi } from '@/lib/api';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  PolarRadiusAxis
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Option {
  label: string;
  text: string;
  score: number; // A=4, B=3, C=2, D=1
}

interface Question {
  id: string;
  text: string;
  sector: 'stress' | 'sleep' | 'psychology' | 'lifestyle';
  options: Option[];
}

interface SectorResult {
  key: 'stress' | 'sleep' | 'psychology' | 'lifestyle';
  label: string;
  score: number; // 0–100
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  advice: string[];
}

// ─── Questions Data ───────────────────────────────────────────────────────────

const QUESTIONS: Question[] = [
  {
    id: 'q1',
    sector: 'stress',
    text: 'How would you rate your overall stress level over the past week?',
    options: [
      { label: 'A', text: 'Very low (Peaceful and relaxed)', score: 4 },
      { label: 'B', text: 'Moderate (Manageable stress)', score: 3 },
      { label: 'C', text: 'High (Frequently overwhelmed)', score: 2 },
      { label: 'D', text: 'Extremely high (Constant burnout/panic)', score: 1 },
    ],
  },
  {
    id: 'q2',
    sector: 'sleep',
    text: 'On average, how many hours of quality sleep do you get per night?',
    options: [
      { label: 'A', text: '8+ hours (Rested and refreshed)', score: 4 },
      { label: 'B', text: '7 to 8 hours (Adequate rest)', score: 3 },
      { label: 'C', text: '5 to 6 hours (Often tired)', score: 2 },
      { label: 'D', text: 'Less than 5 hours (Chronic sleep deprivation)', score: 1 },
    ],
  },
  {
    id: 'q3',
    sector: 'stress',
    text: 'How often do you feel overwhelmed by your daily responsibilities?',
    options: [
      { label: 'A', text: 'Rarely or never', score: 4 },
      { label: 'B', text: 'Sometimes (during peak work/tasks)', score: 3 },
      { label: 'C', text: 'Often (most days of the week)', score: 2 },
      { label: 'D', text: 'Always (feeling unable to cope)', score: 1 },
    ],
  },
  {
    id: 'q4',
    sector: 'psychology',
    text: 'How would you describe your current mood stability over the last few weeks?',
    options: [
      { label: 'A', text: 'Very stable and balanced', score: 4 },
      { label: 'B', text: 'Mostly stable with minor fluctuations', score: 3 },
      { label: 'C', text: 'Fluctuating frequently (ups and downs)', score: 2 },
      { label: 'D', text: 'Constantly volatile or unpredictable', score: 1 },
    ],
  },
  {
    id: 'q5',
    sector: 'sleep',
    text: 'How easily are you able to unwind and relax before going to sleep?',
    options: [
      { label: 'A', text: 'Very easily (fall asleep without trouble)', score: 4 },
      { label: 'B', text: 'With some difficulty (takes a little time)', score: 3 },
      { label: 'C', text: 'Very difficultly (racing thoughts keep me awake)', score: 2 },
      { label: 'D', text: 'Almost impossible (severe insomnia or restlessness)', score: 1 },
    ],
  },
  {
    id: 'q6',
    sector: 'lifestyle',
    text: 'How frequently do you engage in mindfulness, meditation, journaling, or breathing exercises?',
    options: [
      { label: 'A', text: 'Daily', score: 4 },
      { label: 'B', text: 'A few times a week', score: 3 },
      { label: 'C', text: 'Rarely', score: 2 },
      { label: 'D', text: 'Never', score: 1 },
    ],
  },
  {
    id: 'q7',
    sector: 'lifestyle',
    text: 'How satisfied are you with your current work-life or study-life balance?',
    options: [
      { label: 'A', text: 'Highly satisfied', score: 4 },
      { label: 'B', text: 'Moderately satisfied', score: 3 },
      { label: 'C', text: 'Dissatisfied', score: 2 },
      { label: 'D', text: 'Extremely dissatisfied / Burned out', score: 1 },
    ],
  },
  {
    id: 'q8',
    sector: 'psychology',
    text: 'How often do racing thoughts or anxiety disrupt your focus or daily tasks?',
    options: [
      { label: 'A', text: 'Never', score: 4 },
      { label: 'B', text: 'Occasionally', score: 3 },
      { label: 'C', text: 'Frequently', score: 2 },
      { label: 'D', text: 'Constantly throughout the day', score: 1 },
    ],
  },
  {
    id: 'q9',
    sector: 'psychology',
    text: 'How connected do you feel to friends, family, or a supportive community?',
    options: [
      { label: 'A', text: 'Very connected and supported', score: 4 },
      { label: 'B', text: 'Somewhat connected', score: 3 },
      { label: 'C', text: 'Isolated or lonely', score: 2 },
      { label: 'D', text: 'Completely isolated with no support system', score: 1 },
    ],
  },
  {
    id: 'q10',
    sector: 'lifestyle',
    text: 'How optimistic do you feel about your personal growth and mental well-being right now?',
    options: [
      { label: 'A', text: 'Very optimistic and hopeful', score: 4 },
      { label: 'B', text: 'Somewhat optimistic', score: 3 },
      { label: 'C', text: 'Neutral / Unsure', score: 2 },
      { label: 'D', text: 'Pessimistic or hopeless', score: 1 },
    ],
  },
];

// ─── Advice Map ───────────────────────────────────────────────────────────────

function buildAdvice(
  sector: 'stress' | 'sleep' | 'psychology' | 'lifestyle',
  score: number,
  answers: Record<string, string>
): string[] {
  const level = score >= 75 ? 'high' : score >= 50 ? 'mid' : 'low';

  const adviceMap: Record<string, Record<string, string[]>> = {
    stress: {
      high: [
        'Your stress levels are well-managed — keep up your current coping strategies.',
        'Consider sharing your stress-management techniques with others who may benefit.',
        'Maintain your routine with regular breaks and mindful pauses throughout the day.',
      ],
      mid: [
        'Try the 4-7-8 breathing technique: inhale 4s, hold 7s, exhale 8s — repeat 3 times.',
        'Schedule "worry time" — a 15-minute daily window to process concerns, then let them go.',
        'Identify your top 3 stressors this week and write one small action step for each.',
      ],
      low: [
        'Prioritize a daily stress-release ritual: a 10-minute walk, stretching, or cold shower.',
        'Consider speaking with a therapist or counselor — burnout needs professional support.',
        'Break your day into 90-minute focus blocks with mandatory 15-minute recovery breaks.',
        'Practice progressive muscle relaxation before bed to release physical tension.',
      ],
    },
    sleep: {
      high: [
        'Excellent sleep hygiene! Protect your sleep schedule even on weekends.',
        'Consider tracking your sleep quality to identify what keeps it consistent.',
        'Your rested state supports better mood, focus, and immune function — keep it up.',
      ],
      mid: [
        'Create a 30-minute wind-down ritual: dim lights, no screens, light reading or stretching.',
        'Keep your bedroom cool (65–68°F / 18–20°C) and completely dark for deeper sleep.',
        'Avoid caffeine after 2 PM and heavy meals within 3 hours of bedtime.',
      ],
      low: [
        'Establish a fixed wake time — even on weekends — to reset your circadian rhythm.',
        'Try a body scan meditation or white noise to quiet a racing mind at bedtime.',
        'Limit screen exposure 1 hour before sleep; blue light suppresses melatonin production.',
        'If insomnia persists beyond 3 weeks, consult a sleep specialist or your GP.',
      ],
    },
    psychology: {
      high: [
        'Your emotional stability is a real strength — nurture it with regular self-reflection.',
        'Continue practices that support your mental clarity, like journaling or mindfulness.',
        'Your social connections are a protective factor for long-term mental health.',
      ],
      mid: [
        'Start a 5-minute daily gratitude journal — write 3 specific things you appreciated today.',
        'Practice "cognitive reframing": when a negative thought arises, ask "Is this 100% true?"',
        'Reach out to one person in your support network this week — connection reduces anxiety.',
      ],
      low: [
        'Mood volatility and isolation are serious signals — please consider professional support.',
        'Try the STOP technique: Stop, Take a breath, Observe your thoughts, Proceed mindfully.',
        'Limit social media to 30 minutes daily — comparison and doom-scrolling amplify low moods.',
        'Small acts of connection matter: a text, a walk with a friend, or a community group.',
      ],
    },
    lifestyle: {
      high: [
        'Your daily habits are strongly aligned with mental wellness — you\'re building real resilience.',
        'Consider mentoring others or sharing your wellness practices in a community setting.',
        'Keep experimenting with new mindfulness or movement practices to stay engaged.',
      ],
      mid: [
        'Add one 10-minute mindfulness or breathing session to your morning or evening routine.',
        'Review your work-life boundaries: set a hard "off" time for work notifications each day.',
        'Try habit stacking — attach a new wellness habit to something you already do daily.',
      ],
      low: [
        'Start with just 5 minutes of mindful breathing each morning — consistency beats intensity.',
        'Identify one area of your life consuming disproportionate energy and set a boundary.',
        'Explore free apps or YouTube channels for guided meditation to build a daily practice.',
        'Reconnect with one activity that brings you joy — even 20 minutes weekly makes a difference.',
      ],
    },
  };

  return adviceMap[sector][level];
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

function computeResults(answers: Record<string, string>): {
  overallScore: number;
  sectors: SectorResult[];
} {
  const sectorScores: Record<string, { total: number; count: number }> = {
    stress: { total: 0, count: 0 },
    sleep: { total: 0, count: 0 },
    psychology: { total: 0, count: 0 },
    lifestyle: { total: 0, count: 0 },
  };

  QUESTIONS.forEach((q) => {
    const selectedLabel = answers[q.id];
    if (!selectedLabel) return;
    const opt = q.options.find((o) => o.label === selectedLabel);
    if (!opt) return;
    sectorScores[q.sector].total += opt.score;
    sectorScores[q.sector].count += 1;
  });

  const sectorDefs = [
    {
      key: 'stress' as const,
      label: 'Stress Management',
      icon: <Zap size={18} strokeWidth={1.5} />,
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/10',
    },
    {
      key: 'sleep' as const,
      label: 'Sleep Quality',
      icon: <Moon size={18} strokeWidth={1.5} />,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
    },
    {
      key: 'psychology' as const,
      label: 'Psychology',
      icon: <Brain size={18} strokeWidth={1.5} />,
      color: 'text-violet-500',
      bgColor: 'bg-violet-500/10',
    },
    {
      key: 'lifestyle' as const,
      label: 'Lifestyle',
      icon: <Leaf size={18} strokeWidth={1.5} />,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
  ];

  const sectors: SectorResult[] = sectorDefs.map((def) => {
    const s = sectorScores[def.key];
    const maxPossible = s.count * 4;
    const score = maxPossible > 0 ? Math.round((s.total / maxPossible) * 100) : 0;
    return {
      ...def,
      score,
      advice: buildAdvice(def.key, score, answers),
    };
  });

  const totalScore = Math.round(
    sectors.reduce((acc, s) => acc + s.score, 0) / sectors.length
  );

  return { overallScore: totalScore, sectors };
}

function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Thriving', color: 'text-emerald-500' };
  if (score >= 60) return { label: 'Balanced', color: 'text-violet-500' };
  if (score >= 40) return { label: 'Needs Attention', color: 'text-amber-500' };
  return { label: 'At Risk', color: 'text-rose-500' };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function WellnessAssessmentContent() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [results, setResults] = useState<ReturnType<typeof computeResults> | null>(null);

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === QUESTIONS.length;
  const progress = (answeredCount / QUESTIONS.length) * 100;

  const handleSelect = (questionId: string, label: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: label }));
  };

  const handleSubmit = async () => {
    if (!allAnswered) return;
    setSaving(true);
    setSaveError(null);

    const computed = computeResults(answers);
    setResults(computed);
    setSubmitted(true);

    // Build payload for backend
    const payload = QUESTIONS.map((q) => {
      const selectedLabel = answers[q.id];
      const opt = q.options.find((o) => o.label === selectedLabel);
      return {
        question_id: q.id,
        value: opt?.score ?? 1,
      };
    });

    try {
      await assessmentsApi.submit(payload);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save assessment');
    } finally {
      setSaving(false);
    }
  };

  const handleRetake = () => {
    setAnswers({});
    setSubmitted(false);
    setResults(null);
    setSaveError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const radarData = results
    ? results.sectors.map((s) => ({ subject: s.label.split(' ')[0], score: s.score, fullMark: 100 }))
    : [];

  return (
    <div className="min-h-full px-4 py-8 md:px-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-xl gradient-violet-rose flex items-center justify-center">
            <Sparkles size={16} strokeWidth={1.5} className="text-white" />
          </div>
          <span className="text-xs font-semibold font-heading text-muted-foreground uppercase tracking-widest">
            Wellness Assessment
          </span>
        </div>
        <h1 className="font-heading font-bold text-2xl md:text-3xl text-foreground mb-1">
          Your Mental Wellness Check-In
        </h1>
        <p className="text-sm text-muted-foreground max-w-xl">
          10 questions across Stress, Sleep, Psychology &amp; Lifestyle. Takes about 3 minutes.
          Mira will use your results to personalise her support.
        </p>
      </div>

      {/* Progress Bar */}
      {!submitted && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-heading">
              {answeredCount} of {QUESTIONS.length} answered
            </span>
            <span className="text-xs font-semibold text-primary font-heading">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full gradient-violet-rose"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* Questions */}
      {!submitted && (
        <div className="space-y-6 mb-10">
          {QUESTIONS.map((q, idx) => {
            const sectorColors: Record<string, string> = {
              stress: 'text-rose-500',
              sleep: 'text-indigo-500',
              psychology: 'text-violet-500',
              lifestyle: 'text-emerald-500',
            };
            const sectorLabels: Record<string, string> = {
              stress: 'Stress',
              sleep: 'Sleep',
              psychology: 'Psychology',
              lifestyle: 'Lifestyle',
            };

            return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.3 }}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <div className="flex items-start gap-3 mb-4">
                  <span className="shrink-0 w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold font-heading flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <span className={cn('text-xs font-semibold font-heading uppercase tracking-wide mb-1 block', sectorColors[q.sector])}>
                      {sectorLabels[q.sector]}
                    </span>
                    <p className="text-sm font-medium text-foreground leading-snug">{q.text}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt) => {
                    const isSelected = answers[q.id] === opt.label;
                    return (
                      <button
                        key={opt.label}
                        onClick={() => handleSelect(q.id, opt.label)}
                        suppressHydrationWarning
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm transition-all duration-150',
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary font-medium' :'border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <span className={cn(
                          'shrink-0 w-6 h-6 rounded-lg text-xs font-bold font-heading flex items-center justify-center transition-colors',
                          isSelected ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                        )}>
                          {opt.label}
                        </span>
                        <span className="leading-snug">{opt.text}</span>
                        {isSelected && <CheckCircle2 size={14} strokeWidth={2} className="ml-auto shrink-0 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Submit Button */}
      {!submitted && (
        <div className="flex justify-center mb-16">
          <button
            onClick={handleSubmit}
            disabled={!allAnswered || saving}
            className={cn(
              'flex items-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-semibold font-heading transition-all duration-200',
              allAnswered && !saving
                ? 'gradient-violet-rose text-white hover:opacity-90 active:scale-95 shadow-lg shadow-primary/20'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
          >
            {saving ? (
              <><Loader2 size={16} strokeWidth={2} className="animate-spin" /> Saving results…</>
            ) : (
              <><ChevronRight size={16} strokeWidth={2} /> View My Results</>
            )}
          </button>
        </div>
      )}

      {/* Results Section */}
      <AnimatePresence>
        {submitted && results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            {/* Save Error */}
            {saveError && (
              <div className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-900/20 px-4 py-3">
                <AlertCircle size={16} strokeWidth={1.5} className="text-amber-600 dark:text-amber-400 shrink-0" />
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Results calculated locally. Could not save to server: {saveError}
                </p>
              </div>
            )}

            {/* Overall Score */}
            <div className="rounded-2xl border border-border bg-card p-6 mb-6 flex flex-col sm:flex-row items-center gap-6">
              <div className="relative flex items-center justify-center w-32 h-32 shrink-0">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="10" className="text-muted" />
                  <circle
                    cx="60" cy="60" r="50"
                    fill="none"
                    stroke="url(#scoreGrad)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${(results.overallScore / 100) * 314} 314`}
                  />
                  <defs>
                    <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-heading font-bold text-3xl text-foreground">{results.overallScore}</span>
                  <span className="text-xs text-muted-foreground font-heading">/100</span>
                </div>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <p className="text-xs font-semibold font-heading text-muted-foreground uppercase tracking-widest mb-1">Overall Wellness Score</p>
                <h2 className={cn('font-heading font-bold text-2xl mb-2', getScoreLabel(results.overallScore).color)}>
                  {getScoreLabel(results.overallScore).label}
                </h2>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {results.overallScore >= 75
                    ? 'You\'re in a strong place. Keep nurturing your habits and stay consistent.'
                    : results.overallScore >= 50
                    ? 'You have a solid foundation with some areas worth strengthening.' :'Your results suggest some areas need focused attention. Small steps matter.'}
                </p>
                <div className="flex items-center gap-2 mt-4 justify-center sm:justify-start">
                  <button
                    onClick={handleRetake}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-xs font-semibold font-heading text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150"
                  >
                    <RotateCcw size={13} strokeWidth={2} />
                    Retake Assessment
                  </button>
                </div>
              </div>
            </div>

            {/* Radar Chart + Sector Scores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Radar */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={16} strokeWidth={1.5} className="text-primary" />
                  <h3 className="font-heading font-semibold text-sm text-foreground">Sector Breakdown</h3>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontFamily: 'inherit' }}
                    />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.25}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Sector Score Cards */}
              <div className="space-y-3">
                {results.sectors.map((sector) => (
                  <div key={sector.key} className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
                    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', sector.bgColor, sector.color)}>
                      {sector.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold font-heading text-foreground">{sector.label}</span>
                        <span className={cn('text-xs font-bold font-heading', sector.color)}>{sector.score}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: sector.score >= 75 ? '#10b981' : sector.score >= 50 ? '#8b5cf6' : sector.score >= 25 ? '#f59e0b' : '#ef4444' }}
                          initial={{ width: 0 }}
                          animate={{ width: `${sector.score}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Advice Section */}
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={16} strokeWidth={1.5} className="text-primary" />
                <h3 className="font-heading font-semibold text-base text-foreground">Personalised Advice</h3>
                <span className="text-xs text-muted-foreground">— based on your answers</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.sectors.map((sector) => (
                  <motion.div
                    key={sector.key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="rounded-2xl border border-border bg-card p-5"
                  >
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', sector.bgColor, sector.color)}>
                        {sector.icon}
                      </div>
                      <div>
                        <h4 className="font-heading font-semibold text-sm text-foreground">{sector.label}</h4>
                        <span className={cn('text-xs font-semibold', sector.color)}>
                          {sector.score >= 75 ? 'Thriving' : sector.score >= 50 ? 'Good' : sector.score >= 25 ? 'Needs Work' : 'Critical'}
                        </span>
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {sector.advice.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                          <span className={cn('shrink-0 w-1.5 h-1.5 rounded-full mt-1.5', sector.color.replace('text-', 'bg-'))} />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
