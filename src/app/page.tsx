'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  sender: 'mira' | 'user';
  text: string;
  timestamp: Date;
}

interface MoodEntry {
  id: string;
  day: string;
  mood: string;
  emoji: string;
  time: string;
}

interface JournalEntry {
  id: string;
  date: string;
  snippet: string;
  tag: string;
  aiSummary?: string;
}

interface Habit {
  id: string;
  name: string;
  done: boolean;
  streak: number;
  icon: string;
}

interface User {
  email: string;
  name: string;
}

interface AssessmentQuestion {
  id: string;
  text: string;
  category: string;
  options: { label: string; text: string; score: number }[];
}

type View = 'landing' | 'login' | 'signup' | 'dashboard';
type Tab = 'mira' | 'assessments' | 'dna' | 'mood' | 'journal' | 'habits' | 'toolkit';
type AssessmentTier = 1 | 2 | 3;
type BreathPhase = 'inhale' | 'hold-in' | 'exhale' | 'hold-out' | 'idle';

// ─── Assessment Questions ─────────────────────────────────────────────────────

const ASSESSMENT_T1: AssessmentQuestion[] = [
  { id: 'q1', category: 'Stress', text: 'How would you rate your overall stress level today?', options: [{ label: 'A', text: 'Very calm and at ease', score: 4 }, { label: 'B', text: 'Mild stress, manageable', score: 3 }, { label: 'C', text: 'Noticeably stressed', score: 2 }, { label: 'D', text: 'Overwhelmed or anxious', score: 1 }] },
  { id: 'q2', category: 'Sleep', text: 'How many hours of sleep did you get last night?', options: [{ label: 'A', text: '8+ hours — felt fully rested', score: 4 }, { label: 'B', text: '6–8 hours — mostly rested', score: 3 }, { label: 'C', text: '4–6 hours — somewhat tired', score: 2 }, { label: 'D', text: 'Under 4 hours — exhausted', score: 1 }] },
  { id: 'q3', category: 'Mood', text: 'How is your mood right now, in this moment?', options: [{ label: 'A', text: 'Positive and uplifted', score: 4 }, { label: 'B', text: 'Neutral and steady', score: 3 }, { label: 'C', text: 'A bit low or flat', score: 2 }, { label: 'D', text: 'Sad, irritable, or anxious', score: 1 }] },
  { id: 'q4', category: 'Stress', text: 'How often did you feel overwhelmed by tasks today?', options: [{ label: 'A', text: 'Not at all', score: 4 }, { label: 'B', text: 'Once or twice briefly', score: 3 }, { label: 'C', text: 'Several times', score: 2 }, { label: 'D', text: 'Almost constantly', score: 1 }] },
  { id: 'q5', category: 'Sleep', text: 'How easily did you fall asleep last night?', options: [{ label: 'A', text: 'Fell asleep quickly and easily', score: 4 }, { label: 'B', text: 'Took a little time but fine', score: 3 }, { label: 'C', text: 'Took a long time, restless', score: 2 }, { label: 'D', text: 'Could barely sleep at all', score: 1 }] },
  { id: 'q6', category: 'Connection', text: 'How connected do you feel to the people around you today?', options: [{ label: 'A', text: 'Very connected and supported', score: 4 }, { label: 'B', text: 'Somewhat connected', score: 3 }, { label: 'C', text: 'A bit isolated', score: 2 }, { label: 'D', text: 'Completely alone or unsupported', score: 1 }] },
  { id: 'q7', category: 'Focus', text: 'How productive did you feel in your work or studies today?', options: [{ label: 'A', text: 'Highly focused and productive', score: 4 }, { label: 'B', text: 'Moderately productive', score: 3 }, { label: 'C', text: 'Struggled to concentrate', score: 2 }, { label: 'D', text: 'Could not focus at all', score: 1 }] },
  { id: 'q8', category: 'Energy', text: 'How is your energy level right now?', options: [{ label: 'A', text: 'High energy, feeling great', score: 4 }, { label: 'B', text: 'Moderate energy', score: 3 }, { label: 'C', text: 'Low energy, dragging', score: 2 }, { label: 'D', text: 'Completely drained', score: 1 }] },
  { id: 'q9', category: 'Outlook', text: 'How optimistic do you feel about the rest of your day?', options: [{ label: 'A', text: 'Very optimistic', score: 4 }, { label: 'B', text: 'Somewhat hopeful', score: 3 }, { label: 'C', text: 'Uncertain or neutral', score: 2 }, { label: 'D', text: 'Pessimistic or dreading it', score: 1 }] },
  { id: 'q10', category: 'Balance', text: 'How satisfied are you with your work-life balance today?', options: [{ label: 'A', text: 'Very satisfied', score: 4 }, { label: 'B', text: 'Mostly satisfied', score: 3 }, { label: 'C', text: 'Somewhat dissatisfied', score: 2 }, { label: 'D', text: 'Very dissatisfied or burned out', score: 1 }] },
];

const ASSESSMENT_T2_EXTRA: AssessmentQuestion[] = [
  { id: 'q11', category: 'Sleep', text: 'How consistent is your sleep schedule across the week?', options: [{ label: 'A', text: 'Very consistent — same time daily', score: 4 }, { label: 'B', text: 'Mostly consistent with minor variation', score: 3 }, { label: 'C', text: 'Irregular — varies significantly', score: 2 }, { label: 'D', text: 'No routine at all', score: 1 }] },
  { id: 'q12', category: 'Coping', text: 'How often do you use healthy coping strategies (exercise, journaling, breathing)?', options: [{ label: 'A', text: "Daily — it's a core habit", score: 4 }, { label: 'B', text: 'A few times a week', score: 3 }, { label: 'C', text: 'Occasionally when stressed', score: 2 }, { label: 'D', text: 'Rarely or never', score: 1 }] },
  { id: 'q13', category: 'Mood Stability', text: 'How stable has your mood been over the past two weeks?', options: [{ label: 'A', text: 'Very stable — consistent and balanced', score: 4 }, { label: 'B', text: 'Mostly stable with minor ups and downs', score: 3 }, { label: 'C', text: 'Noticeably fluctuating', score: 2 }, { label: 'D', text: 'Highly volatile or unpredictable', score: 1 }] },
  { id: 'q14', category: 'Recovery', text: 'How often do you take meaningful breaks during your work or study sessions?', options: [{ label: 'A', text: 'Regularly — every 60–90 minutes', score: 4 }, { label: 'B', text: 'Sometimes, when I remember', score: 3 }, { label: 'C', text: 'Rarely — I push through', score: 2 }, { label: 'D', text: 'Never — I work until I crash', score: 1 }] },
  { id: 'q15', category: 'Emotional Expression', text: 'How comfortable are you expressing your emotions to someone you trust?', options: [{ label: 'A', text: 'Very comfortable — I share openly', score: 4 }, { label: 'B', text: 'Somewhat comfortable', score: 3 }, { label: 'C', text: 'Uncomfortable — I tend to bottle things up', score: 2 }, { label: 'D', text: 'I have no one I trust to share with', score: 1 }] },
  { id: 'q16', category: 'Physical Stress', text: 'How often do physical symptoms (headaches, tension, stomach issues) appear when stressed?', options: [{ label: 'A', text: 'Rarely or never', score: 4 }, { label: 'B', text: 'Occasionally during peak stress', score: 3 }, { label: 'C', text: 'Frequently', score: 2 }, { label: 'D', text: 'Almost always when stressed', score: 1 }] },
  { id: 'q17', category: 'Sleep Quality', text: 'How refreshed do you typically feel upon waking?', options: [{ label: 'A', text: 'Fully refreshed and energized', score: 4 }, { label: 'B', text: 'Reasonably rested', score: 3 }, { label: 'C', text: 'Groggy and slow to start', score: 2 }, { label: 'D', text: 'Exhausted even after sleeping', score: 1 }] },
  { id: 'q18', category: 'Social Wellbeing', text: 'How satisfied are you with your social relationships and support network?', options: [{ label: 'A', text: 'Very satisfied — strong connections', score: 4 }, { label: 'B', text: 'Moderately satisfied', score: 3 }, { label: 'C', text: 'Somewhat dissatisfied', score: 2 }, { label: 'D', text: 'Very dissatisfied or isolated', score: 1 }] },
  { id: 'q19', category: 'Workload', text: 'How often do you feel your workload is fair and manageable?', options: [{ label: 'A', text: 'Almost always', score: 4 }, { label: 'B', text: 'Most of the time', score: 3 }, { label: 'C', text: 'Sometimes — often feels too heavy', score: 2 }, { label: 'D', text: "Rarely — I'm constantly overloaded", score: 1 }] },
  { id: 'q20', category: 'Priorities', text: 'How well do you manage competing priorities and deadlines?', options: [{ label: 'A', text: 'Very well — I stay organized and calm', score: 4 }, { label: 'B', text: 'Reasonably well with some stress', score: 3 }, { label: 'C', text: 'Struggle — often feel behind', score: 2 }, { label: 'D', text: 'Poorly — deadlines cause panic', score: 1 }] },
  { id: 'q21', category: 'Joy', text: 'How often do you engage in activities purely for joy or relaxation?', options: [{ label: 'A', text: 'Daily or near-daily', score: 4 }, { label: 'B', text: 'A few times a week', score: 3 }, { label: 'C', text: 'Rarely — no time or energy', score: 2 }, { label: 'D', text: "Never — I've lost interest in things I used to enjoy", score: 1 }] },
  { id: 'q22', category: 'Screen Habits', text: 'How often do you use screens (phone, laptop) in the hour before bed?', options: [{ label: 'A', text: 'Never — I have a screen-free wind-down', score: 4 }, { label: 'B', text: 'Occasionally', score: 3 }, { label: 'C', text: 'Most nights', score: 2 }, { label: 'D', text: 'Every night until I fall asleep', score: 1 }] },
  { id: 'q23', category: 'Boundaries', text: 'How often do work or study demands spill into your personal time?', options: [{ label: 'A', text: 'Rarely — I maintain clear boundaries', score: 4 }, { label: 'B', text: 'Sometimes during busy periods', score: 3 }, { label: 'C', text: 'Frequently', score: 2 }, { label: 'D', text: 'Almost always — no separation', score: 1 }] },
  { id: 'q24', category: 'Mindfulness', text: 'How often do you practice mindfulness, meditation, or intentional breathing?', options: [{ label: 'A', text: 'Daily', score: 4 }, { label: 'B', text: 'A few times a week', score: 3 }, { label: 'C', text: 'Rarely', score: 2 }, { label: 'D', text: 'Never', score: 1 }] },
  { id: 'q25', category: 'Hope', text: 'How hopeful do you feel about your mental health and personal growth over the next month?', options: [{ label: 'A', text: 'Very hopeful and motivated', score: 4 }, { label: 'B', text: 'Cautiously optimistic', score: 3 }, { label: 'C', text: 'Uncertain or neutral', score: 2 }, { label: 'D', text: 'Pessimistic or hopeless', score: 1 }] },
];

const ASSESSMENT_T3_EXTRA: AssessmentQuestion[] = [
  { id: 'q26', category: 'Background', text: 'How would you describe the emotional environment you grew up in?', options: [{ label: 'A', text: 'Warm, supportive, and stable', score: 4 }, { label: 'B', text: 'Mostly positive with some tension', score: 3 }, { label: 'C', text: 'Stressful or emotionally inconsistent', score: 2 }, { label: 'D', text: 'Difficult, traumatic, or neglectful', score: 1 }] },
  { id: 'q27', category: 'Patterns', text: 'How has your family background shaped your current stress responses?', options: [{ label: 'A', text: 'Positively — I learned healthy coping', score: 4 }, { label: 'B', text: 'Mixed — some helpful, some not', score: 3 }, { label: 'C', text: 'Negatively — I struggle with patterns from childhood', score: 2 }, { label: 'D', text: 'Significantly — past trauma still affects me daily', score: 1 }] },
  { id: 'q28', category: 'Family History', text: 'Is there a history of mental health challenges in your family?', options: [{ label: 'A', text: 'No known history', score: 4 }, { label: 'B', text: 'Possibly, but not discussed openly', score: 3 }, { label: 'C', text: 'Yes, in one or two family members', score: 2 }, { label: 'D', text: 'Yes, significant history across family', score: 1 }] },
  { id: 'q29', category: 'Family Relations', text: 'How would you describe your current relationship with your family?', options: [{ label: 'A', text: 'Close, supportive, and healthy', score: 4 }, { label: 'B', text: 'Decent with occasional friction', score: 3 }, { label: 'C', text: 'Strained or distant', score: 2 }, { label: 'D', text: 'Estranged or a source of significant stress', score: 1 }] },
  { id: 'q30', category: 'Trauma', text: 'Have you experienced a significant life trauma or loss in the past two years?', options: [{ label: 'A', text: 'No significant trauma or loss', score: 4 }, { label: 'B', text: "Minor setbacks I've largely processed", score: 3 }, { label: 'C', text: "A significant event I'm still processing", score: 2 }, { label: 'D', text: 'A major trauma that still deeply affects me', score: 1 }] },
  { id: 'q31', category: 'Duration', text: 'How long have you been experiencing your current mental wellness challenges?', options: [{ label: 'A', text: 'This is new — less than a month', score: 4 }, { label: 'B', text: '1–6 months', score: 3 }, { label: 'C', text: '6 months to 2 years', score: 2 }, { label: 'D', text: 'More than 2 years — it feels chronic', score: 1 }] },
  { id: 'q32', category: 'Support History', text: 'Have you previously sought professional mental health support (therapy, counseling)?', options: [{ label: 'A', text: 'Yes, and it was very helpful', score: 4 }, { label: 'B', text: 'Yes, with mixed results', score: 3 }, { label: 'C', text: "No, but I've considered it", score: 2 }, { label: 'D', text: "No, and I feel I can't access it", score: 1 }] },
  { id: 'q33', category: 'Resilience', text: 'How would you describe your overall resilience when facing setbacks?', options: [{ label: 'A', text: 'Very resilient — I bounce back quickly', score: 4 }, { label: 'B', text: 'Moderately resilient', score: 3 }, { label: 'C', text: 'I struggle but eventually recover', score: 2 }, { label: 'D', text: 'Setbacks knock me down for a long time', score: 1 }] },
  { id: 'q34', category: 'Crisis Response', text: 'When you face a major unexpected problem, your first instinct is to:', options: [{ label: 'A', text: 'Stay calm, assess, and take action', score: 4 }, { label: 'B', text: 'Feel stressed but work through it', score: 3 }, { label: 'C', text: 'Feel paralyzed or avoidant initially', score: 2 }, { label: 'D', text: 'Spiral into anxiety or shutdown', score: 1 }] },
  { id: 'q35', category: 'Conflict', text: 'In a conflict with someone important to you, you typically:', options: [{ label: 'A', text: 'Communicate openly and resolve it calmly', score: 4 }, { label: 'B', text: 'Try to resolve it but it takes time', score: 3 }, { label: 'C', text: 'Withdraw or avoid the conflict', score: 2 }, { label: 'D', text: 'React intensely or the conflict escalates', score: 1 }] },
  { id: 'q36', category: 'Pre-stress Sleep', text: 'When you have a high-pressure day ahead, your sleep the night before is typically:', options: [{ label: 'A', text: 'Normal — I sleep well regardless', score: 4 }, { label: 'B', text: 'Slightly disrupted but manageable', score: 3 }, { label: 'C', text: 'Significantly disrupted by anticipatory anxiety', score: 2 }, { label: 'D', text: 'Almost no sleep — I lie awake for hours', score: 1 }] },
  { id: 'q37', category: 'Purpose', text: 'How aligned do you feel with your life purpose and long-term goals?', options: [{ label: 'A', text: 'Very aligned — my path feels meaningful', score: 4 }, { label: 'B', text: 'Mostly aligned with some doubts', score: 3 }, { label: 'C', text: 'Misaligned — I feel stuck or unfulfilled', score: 2 }, { label: 'D', text: 'Completely disconnected — I dread my future', score: 1 }] },
  { id: 'q38', category: 'Self-Compassion', text: 'How kind are you to yourself when you make mistakes?', options: [{ label: 'A', text: 'Very kind — I practice self-compassion', score: 4 }, { label: 'B', text: 'Mostly kind with occasional self-criticism', score: 3 }, { label: 'C', text: 'Quite self-critical', score: 2 }, { label: 'D', text: 'Harshly self-critical — I struggle to forgive myself', score: 1 }] },
  { id: 'q39', category: 'Existential', text: 'How often do you feel a deep sense of meaning or purpose in your daily life?', options: [{ label: 'A', text: 'Frequently — my life feels purposeful', score: 4 }, { label: 'B', text: 'Sometimes — in certain areas', score: 3 }, { label: 'C', text: 'Rarely — I struggle to find meaning', score: 2 }, { label: 'D', text: 'Almost never — I feel existentially empty', score: 1 }] },
  { id: 'q40', category: 'Neurological Fatigue', text: 'How often do you experience mental fog, difficulty thinking clearly, or cognitive exhaustion?', options: [{ label: 'A', text: 'Rarely — my mind is usually clear', score: 4 }, { label: 'B', text: 'Occasionally during high-stress periods', score: 3 }, { label: 'C', text: 'Frequently — it affects my daily functioning', score: 2 }, { label: 'D', text: 'Almost constantly — I feel mentally depleted', score: 1 }] },
];

const TIER_CONFIG = {
  1: { questions: ASSESSMENT_T1, label: 'Quick Mental Health & Stress Check', desc: '10-question rapid psychological screening focused on daily tension, sleep quality, and immediate emotional load.', time: '3–5 min', color: 'emerald' },
  2: { questions: [...ASSESSMENT_T1, ...ASSESSMENT_T2_EXTRA], label: 'Comprehensive Emotional & Behavioral Audit', desc: '25-question intermediate evaluation analyzing cognitive patterns, interpersonal boundaries, anxiety triggers, and resilience markers.', time: '8–12 min', color: 'teal' },
  3: { questions: [...ASSESSMENT_T1, ...ASSESSMENT_T2_EXTRA, ...ASSESSMENT_T3_EXTRA], label: 'Deep-Reasoning Psychoanalytical & Cognitive Profile', desc: '40-question exhaustive multi-dimensional assessment evaluating subconscious stress loops, existential alignment, deep neurological fatigue, core behavioral drivers, and long-term psychological resilience.', time: '15–20 min', color: 'sky' },
};

// ─── MIRA Context-Aware Responses ────────────────────────────────────────────

const MIRA_RESPONSES: Record<string, string[]> = {
  stress: [
    "I can sense the weight you're carrying. Let's try a quick grounding technique — name 5 things you can see right now. This anchors your nervous system to the present moment.",
    "Stress often signals that something important to you is at stake. What's the core concern underneath this feeling? Let's work through it together.",
    "Your body is responding to perceived threat. Try box breathing: inhale 4 counts, hold 4, exhale 4, hold 4. Repeat 3 times. I'll be here when you're ready.",
  ],
  anxiety: [
    "Anxiety is your mind trying to protect you — but sometimes it overcorrects. Let's separate what's real from what's imagined. What specifically feels most threatening right now?",
    "When anxiety spikes, your prefrontal cortex goes offline. Physical movement — even a 2-minute walk — can reset your nervous system. Would you like a guided breathing exercise?",
    "You're not your anxiety. It's a wave, and waves pass. Let's ride this one together. What's one small thing you can control right now?",
  ],
  sad: [
    "I hear you. Sadness is a valid, important emotion — it means you care deeply. You don't have to rush through this. What's weighing on your heart today?",
    "Sometimes the most healing thing is simply being witnessed. I'm here, fully present with you. Tell me more about what you're feeling.",
    "Low moods often carry messages. What do you think your sadness is trying to tell you? There's wisdom in it, even when it's painful.",
  ],
  sleep: [
    "Sleep is the foundation of mental health — everything else builds on it. Let's look at your sleep environment. Is your room cool, dark, and screen-free before bed?",
    "Racing thoughts at bedtime are incredibly common. Try the 4-7-8 technique: inhale 4s, hold 7s, exhale 8s. It activates your parasympathetic nervous system.",
    "Your sleep struggles are real and valid. A consistent wake time — even on weekends — is the single most powerful sleep intervention. Would you like a personalized wind-down ritual?",
  ],
  happy: [
    "I love hearing this! Positive emotions are worth savoring — they build psychological resilience. What's contributing to this feeling? Let's anchor it.",
    "This is wonderful. Happiness isn't just a feeling — it's a signal that your needs are being met. What's working well for you right now?",
    "Your positive energy is real and meaningful. Let's use this moment to reflect: what habits or choices led you here? They're worth repeating.",
  ],
  default: [
    "I hear you, and I'm fully present with you. Based on what you've shared, let's take a slow breath together — in for 4 counts, hold for 4, out for 6. You're not alone in this.",
    "Thank you for sharing that with me. Your feelings are valid and important. What would feel most supportive right now — talking through it, a breathing exercise, or just being heard?",
    "I'm here with you. Every feeling you experience is data about your inner world. Let's explore this together with curiosity rather than judgment. What feels most pressing?",
    "Your awareness of your own emotional state is a genuine strength. Many people never pause to check in with themselves. What would you like to focus on today?",
  ],
};

function getMiraResponse(userText: string): string {
  const lower = userText.toLowerCase();
  if (lower.includes('stress') || lower.includes('overwhelm') || lower.includes('pressure')) {
    return MIRA_RESPONSES.stress[Math.floor(Math.random() * MIRA_RESPONSES.stress.length)];
  }
  if (lower.includes('anxi') || lower.includes('worry') || lower.includes('panic') || lower.includes('fear')) {
    return MIRA_RESPONSES.anxiety[Math.floor(Math.random() * MIRA_RESPONSES.anxiety.length)];
  }
  if (lower.includes('sad') || lower.includes('depress') || lower.includes('low') || lower.includes('down') || lower.includes('cry')) {
    return MIRA_RESPONSES.sad[Math.floor(Math.random() * MIRA_RESPONSES.sad.length)];
  }
  if (lower.includes('sleep') || lower.includes('tired') || lower.includes('exhaust') || lower.includes('insomnia')) {
    return MIRA_RESPONSES.sleep[Math.floor(Math.random() * MIRA_RESPONSES.sleep.length)];
  }
  if (lower.includes('happy') || lower.includes('great') || lower.includes('good') || lower.includes('amazing') || lower.includes('wonderful')) {
    return MIRA_RESPONSES.happy[Math.floor(Math.random() * MIRA_RESPONSES.happy.length)];
  }
  return MIRA_RESPONSES.default[Math.floor(Math.random() * MIRA_RESPONSES.default.length)];
}

// ─── Animation Variants ───────────────────────────────────────────────────────

const fadeVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};
const transition = { duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] };

// ─── Box Breathing Component ──────────────────────────────────────────────────

function BoxBreathingVisualizer() {
  const [phase, setPhase] = useState<BreathPhase>('idle');
  const [count, setCount] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef<BreathPhase>('idle');
  const countRef = useRef(0);

  const PHASES: { phase: BreathPhase; duration: number; label: string; instruction: string }[] = [
    { phase: 'inhale', duration: 4, label: 'Inhale', instruction: 'Breathe in slowly through your nose' },
    { phase: 'hold-in', duration: 4, label: 'Hold', instruction: 'Hold your breath gently' },
    { phase: 'exhale', duration: 4, label: 'Exhale', instruction: 'Breathe out slowly through your mouth' },
    { phase: 'hold-out', duration: 4, label: 'Hold', instruction: 'Rest before the next breath' },
  ];

  const currentPhaseData = PHASES.find(p => p.phase === phase) ?? PHASES[0];

  const startBreathing = useCallback(() => {
    setIsActive(true);
    setPhase('inhale');
    phaseRef.current = 'inhale';
    setCount(4);
    countRef.current = 4;
    setCycle(0);

    let phaseIdx = 0;
    let currentCount = 4;

    intervalRef.current = setInterval(() => {
      currentCount--;
      if (currentCount <= 0) {
        phaseIdx = (phaseIdx + 1) % 4;
        if (phaseIdx === 0) setCycle(c => c + 1);
        const nextPhase = PHASES[phaseIdx];
        phaseRef.current = nextPhase.phase;
        setPhase(nextPhase.phase);
        currentCount = nextPhase.duration;
      }
      countRef.current = currentCount;
      setCount(currentCount);
    }, 1000);
  }, []);

  const stopBreathing = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsActive(false);
    setPhase('idle');
    setCount(0);
  }, []);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const circleScale = phase === 'inhale' ? 1.4 : phase === 'hold-in' ? 1.4 : phase === 'exhale' ? 0.7 : 0.7;
  const phaseColor = phase === 'inhale' ? '#10b981' : phase === 'hold-in' ? '#0ea5e9' : phase === 'exhale' ? '#8b5cf6' : '#f59e0b';

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-6">
        {/* Animated Circle */}
        <div className="relative flex items-center justify-center w-48 h-48">
          {/* Outer glow ring */}
          <motion.div
            animate={{ scale: isActive ? circleScale * 1.15 : 1, opacity: isActive ? 0.3 : 0.1 }}
            transition={{ duration: isActive ? (phase === 'inhale' || phase === 'exhale' ? 4 : 0.3) : 0.3, ease: 'easeInOut' }}
            className="absolute w-40 h-40 rounded-full"
            style={{ background: `radial-gradient(circle, ${phaseColor}40, transparent)` }}
          />
          {/* Main breathing circle */}
          <motion.div
            animate={{ scale: isActive ? circleScale : 1 }}
            transition={{ duration: isActive ? (phase === 'inhale' || phase === 'exhale' ? 4 : 0.3) : 0.3, ease: 'easeInOut' }}
            className="w-32 h-32 rounded-full flex flex-col items-center justify-center relative"
            style={{
              background: `radial-gradient(circle at 40% 40%, ${phaseColor}30, ${phaseColor}10)`,
              border: `2px solid ${phaseColor}50`,
              boxShadow: isActive ? `0 0 40px ${phaseColor}30` : 'none',
            }}
          >
            {isActive ? (
              <>
                <span className="text-3xl font-bold text-white">{count}</span>
                <span className="text-xs font-semibold mt-1" style={{ color: phaseColor }}>
                  {currentPhaseData.label}
                </span>
              </>
            ) : (
              <span className="text-xs text-neutral-400 text-center px-2">Press Start</span>
            )}
          </motion.div>
        </div>

        {/* Phase instruction */}
        {isActive && (
          <motion.p
            key={phase}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-neutral-300 text-center"
          >
            {currentPhaseData.instruction}
          </motion.p>
        )}

        {/* Cycle counter */}
        {isActive && (
          <div className="flex items-center gap-2">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={`w-2 h-2 rounded-full transition-all ${i < cycle ? 'bg-emerald-400' : 'bg-white/20'}`} />
            ))}
            <span className="text-xs text-neutral-400 ml-1">Cycle {cycle + 1} of 4</span>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-3">
          {!isActive ? (
            <button
              onClick={startBreathing}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-emerald-500/20"
            >
              Start Box Breathing
            </button>
          ) : (
            <button
              onClick={stopBreathing}
              className="px-8 py-3 rounded-2xl bg-white/[0.06] border border-white/10 text-neutral-300 font-semibold text-sm hover:bg-white/[0.1] transition-all"
            >
              Stop
            </button>
          )}
        </div>
      </div>

      {/* Phase indicators */}
      <div className="grid grid-cols-4 gap-2">
        {PHASES.map((p) => (
          <div
            key={p.phase}
            className={`p-3 rounded-xl text-center transition-all ${phase === p.phase && isActive ? 'bg-white/10 border border-white/20' : 'bg-white/[0.02] border border-white/5'}`}
          >
            <div className="text-lg font-bold text-white">4</div>
            <div className="text-xs text-neutral-400 mt-0.5">{p.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Emergency Grounding Component ───────────────────────────────────────────

function EmergencyGrounding() {
  const [isActive, setIsActive] = useState(false);
  const [step, setStep] = useState(0);
  const [responses, setResponses] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState('');

  const GROUNDING_STEPS = [
    { num: 5, sense: 'SEE', prompt: 'Name 5 things you can see right now', emoji: '👁️', color: '#10b981' },
    { num: 4, sense: 'TOUCH', prompt: 'Name 4 things you can physically feel or touch', emoji: '🤲', color: '#0ea5e9' },
    { num: 3, sense: 'HEAR', prompt: 'Name 3 things you can hear right now', emoji: '👂', color: '#8b5cf6' },
    { num: 2, sense: 'SMELL', prompt: 'Name 2 things you can smell (or like to smell)', emoji: '👃', color: '#f59e0b' },
    { num: 1, sense: 'TASTE', prompt: 'Name 1 thing you can taste right now', emoji: '👅', color: '#ec4899' },
  ];

  const currentStepData = GROUNDING_STEPS[step];
  const isComplete = step >= GROUNDING_STEPS.length;

  const handleNext = () => {
    if (currentInput.trim()) {
      setResponses(prev => [...prev, currentInput.trim()]);
      setCurrentInput('');
      setStep(s => s + 1);
    }
  };

  const handleReset = () => {
    setIsActive(false);
    setStep(0);
    setResponses([]);
    setCurrentInput('');
  };

  if (!isActive) {
    return (
      <div className="space-y-4">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-rose-500/10 to-orange-500/5 border border-rose-500/20 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🆘</span>
            <div>
              <h4 className="font-bold text-white text-sm">5-4-3-2-1 Grounding Technique</h4>
              <p className="text-xs text-neutral-400">Clinically proven to interrupt anxiety spirals and panic attacks</p>
            </div>
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed">
            This technique anchors you to the present moment by engaging all five senses, interrupting the anxiety feedback loop in your nervous system.
          </p>
        </div>
        <button
          onClick={() => setIsActive(true)}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-orange-600 text-white font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-rose-500/20"
        >
          🆘 Activate Emergency Grounding
        </button>
      </div>
    );
  }

  if (isComplete) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
        <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3">
          <div className="text-4xl">✨</div>
          <h4 className="font-bold text-white">Grounding Complete</h4>
          <p className="text-sm text-neutral-300 leading-relaxed">
            You've successfully anchored yourself to the present moment. Your nervous system is resetting. Take a slow, deep breath and notice how you feel now.
          </p>
        </div>
        <div className="space-y-2">
          {GROUNDING_STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="text-lg">{s.emoji}</span>
              <div>
                <span className="text-xs font-semibold text-neutral-400">{s.sense}: </span>
                <span className="text-xs text-neutral-200">{responses[i]}</span>
              </div>
            </div>
          ))}
        </div>
        <button onClick={handleReset} className="w-full py-3 rounded-xl bg-white/[0.04] border border-white/10 text-neutral-300 text-sm font-semibold hover:bg-white/[0.08] transition-all">
          Close
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
      {/* Progress */}
      <div className="flex items-center gap-2">
        {GROUNDING_STEPS.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < step ? 'bg-emerald-400' : i === step ? 'bg-white/40' : 'bg-white/10'}`} />
        ))}
      </div>

      {/* Current step */}
      <div className="p-6 rounded-2xl text-center space-y-3" style={{ background: `${currentStepData.color}10`, border: `1px solid ${currentStepData.color}30` }}>
        <div className="text-4xl">{currentStepData.emoji}</div>
        <div className="text-xs font-mono font-bold tracking-widest" style={{ color: currentStepData.color }}>
          {currentStepData.num} — {currentStepData.sense}
        </div>
        <p className="text-sm text-white font-medium">{currentStepData.prompt}</p>
      </div>

      <textarea
        value={currentInput}
        onChange={e => setCurrentInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleNext(); } }}
        placeholder="Type your response here..."
        rows={2}
        className="w-full bg-black/50 border border-white/10 rounded-xl p-3.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors resize-none"
      />

      <button
        onClick={handleNext}
        disabled={!currentInput.trim()}
        className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-semibold text-sm transition-all"
      >
        Next →
      </button>
    </motion.div>
  );
}

// ─── Assessment Result Component ─────────────────────────────────────────────

function AssessmentResult({ answers, tier, onRetake }: { answers: Record<string, number>; tier: AssessmentTier; onRetake: () => void }) {
  const questions = TIER_CONFIG[tier].questions;
  const totalScore = Object.values(answers).reduce((a, b) => a + b, 0);
  const maxScore = questions.length * 4;
  const percentage = Math.round((totalScore / maxScore) * 100);

  const categories = questions.reduce((acc, q) => {
    if (!acc[q.category]) acc[q.category] = { total: 0, max: 0 };
    acc[q.category].total += answers[q.id] ?? 0;
    acc[q.category].max += 4;
    return acc;
  }, {} as Record<string, { total: number; max: number }>);

  const getLevel = (pct: number) => pct >= 75 ? { label: 'Strong', color: 'text-emerald-400', bg: 'bg-emerald-500/20' } : pct >= 50 ? { label: 'Moderate', color: 'text-amber-400', bg: 'bg-amber-500/20' } : { label: 'Needs Attention', color: 'text-rose-400', bg: 'bg-rose-500/20' };

  const overall = getLevel(percentage);

  const aiSummary = percentage >= 75
    ? `Your psychological profile indicates strong mental resilience and effective coping mechanisms. Your stress management, emotional regulation, and recovery patterns are well-calibrated. Continue your current wellness practices and consider deepening your mindfulness routine to maintain this trajectory.`
    : percentage >= 50
    ? `Your assessment reveals a mixed psychological landscape with notable strengths alongside areas requiring attention. You demonstrate resilience in some domains while experiencing moderate challenges in others. Prioritize consistent sleep hygiene, daily stress-release practices, and strengthening your social support network.`
    : `Your results indicate significant psychological load across multiple dimensions. This is important data — not a judgment. Your nervous system is signaling that it needs support. Please consider speaking with a mental health professional. In the meantime, focus on foundational recovery: sleep, gentle movement, and one small act of self-compassion daily.`;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Overall Score */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 text-center space-y-3">
        <span className="text-xs font-mono tracking-widest text-emerald-400 uppercase">Assessment Complete — Tier {tier}</span>
        <div className="text-6xl font-extrabold text-white">{percentage}<span className="text-2xl text-neutral-400">/100</span></div>
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold ${overall.bg} ${overall.color}`}>
          {overall.label} Psychological State
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider">Category Breakdown</h3>
        {Object.entries(categories).slice(0, 8).map(([cat, data]) => {
          const pct = Math.round((data.total / data.max) * 100);
          const level = getLevel(pct);
          return (
            <div key={cat} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-300 font-medium">{cat}</span>
                <span className={level.color}>{pct}% — {level.label}</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                  className={`h-full rounded-full ${pct >= 75 ? 'bg-emerald-400' : pct >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Diagnostic Summary */}
      <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-xs">🤖</div>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">MIRA AI Diagnostic Summary</span>
        </div>
        <p className="text-sm text-neutral-200 leading-relaxed">{aiSummary}</p>
      </div>

      <button onClick={onRetake} className="w-full py-3 rounded-xl bg-white/[0.04] border border-white/10 text-neutral-300 text-sm font-semibold hover:bg-white/[0.08] transition-all">
        Retake Assessment
      </button>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MindCastPlatform() {
  const [currentView, setCurrentView] = useState<View>('landing');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('mira');

  // MIRA Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '0', sender: 'mira', text: "Hello! I'm MIRA, your Mind Intelligence & Reflective Assistant. I'm here to support your mental wellness journey with empathy and insight. How are you feeling right now?", timestamp: new Date() }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isMiraTyping, setIsMiraTyping] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Assessment
  const [selectedTier, setSelectedTier] = useState<AssessmentTier | null>(null);
  const [assessmentStep, setAssessmentStep] = useState(0);
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<string, number>>({});
  const [assessmentComplete, setAssessmentComplete] = useState(false);

  // Mood
  const [selectedMood, setSelectedMood] = useState('');
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([
    { id: '1', day: 'Monday', mood: 'Happy', emoji: '😊', time: '9:00 AM' },
    { id: '2', day: 'Tuesday', mood: 'Calm', emoji: '🌿', time: '8:30 AM' },
    { id: '3', day: 'Wednesday', mood: 'Stressed', emoji: '🌊', time: '10:15 AM' },
    { id: '4', day: 'Thursday', mood: 'Excited', emoji: '✨', time: '9:45 AM' },
    { id: '5', day: 'Friday', mood: 'Calm', emoji: '🌿', time: '8:00 AM' },
  ]);

  // Journal
  const [journalText, setJournalText] = useState('');
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([
    { id: '1', date: 'Aug 4, 2026', snippet: 'Felt grounded today after finishing the core UI specs. The clarity that comes from focused work is something I want to cultivate more.', tag: 'Productive', aiSummary: 'Your entry reflects a strong sense of accomplishment and a desire for intentional focus. This is a healthy growth mindset pattern.' }
  ]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Habits
  const [habits, setHabits] = useState<Habit[]>([
    { id: '1', name: 'Water Intake (2L)', done: true, streak: 5, icon: '💧' },
    { id: '2', name: '10 Min Meditation', done: false, streak: 3, icon: '🧘' },
    { id: '3', name: 'Sleep 8 Hours', done: true, streak: 7, icon: '🌙' },
    { id: '4', name: 'Daily Journaling', done: false, streak: 2, icon: '📓' },
    { id: '5', name: '30 Min Exercise', done: true, streak: 4, icon: '🏃' },
    { id: '6', name: 'No Screens 1hr Before Bed', done: false, streak: 1, icon: '📵' },
  ]);

  // Toolkit
  const [activeToolkit, setActiveToolkit] = useState<'breathing' | 'grounding'>('breathing');

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isMiraTyping]);

  const handleAuthSubmit = (e: React.FormEvent, _type: string) => {
    e.preventDefault();
    if (!authEmail) return;
    setCurrentUser({ email: authEmail, name: authEmail.split('@')[0] });
    setCurrentView('dashboard');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    const msgId = `msg-${Date.now()}`;
    const newMsg: ChatMessage = { id: msgId, sender: 'user', text: userInput, timestamp: new Date() };
    setChatMessages(prev => [...prev, newMsg]);
    const inputCopy = userInput;
    setUserInput('');
    setIsMiraTyping(true);
    setTimeout(() => {
      setIsMiraTyping(false);
      setChatMessages(prev => [...prev, {
        id: `mira-${Date.now()}`,
        sender: 'mira',
        text: getMiraResponse(inputCopy),
        timestamp: new Date(),
      }]);
    }, 1200 + Math.random() * 800);
  };

  const toggleHabit = (id: string) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, done: !h.done, streak: !h.done ? h.streak + 1 : Math.max(0, h.streak - 1) } : h));
  };

  const handleMoodSelect = (mood: string, emoji: string) => {
    setSelectedMood(mood);
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const newEntry: MoodEntry = {
      id: `mood-${Date.now()}`,
      day: days[now.getDay()],
      mood,
      emoji,
      time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
    setMoodHistory(prev => [newEntry, ...prev.slice(0, 6)]);
  };

  const handleJournalSave = () => {
    if (!journalText.trim()) return;
    setIsAnalyzing(true);
    const text = journalText;
    setJournalText('');
    setTimeout(() => {
      setIsAnalyzing(false);
      const aiSummaries = [
        'Your reflection shows deep self-awareness and emotional intelligence. The themes of growth and challenge you describe are signs of an active, engaged mind navigating life with intention.',
        'This entry reveals a thoughtful inner life. Your ability to articulate your experience is a powerful tool for processing emotions and building resilience.',
        'I notice themes of perseverance and self-reflection in your writing. These are core psychological strengths. Your willingness to examine your inner world is the foundation of lasting change.',
      ];
      setJournalEntries(prev => [{
        id: `j-${Date.now()}`,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        snippet: text,
        tag: 'Reflective',
        aiSummary: aiSummaries[Math.floor(Math.random() * aiSummaries.length)],
      }, ...prev]);
    }, 2000);
  };

  const handleAssessmentAnswer = (questionId: string, score: number) => {
    const newAnswers = { ...assessmentAnswers, [questionId]: score };
    setAssessmentAnswers(newAnswers);
    const questions = TIER_CONFIG[selectedTier!].questions;
    if (assessmentStep < questions.length - 1) {
      setTimeout(() => setAssessmentStep(s => s + 1), 300);
    } else {
      setTimeout(() => setAssessmentComplete(true), 300);
    }
  };

  const resetAssessment = () => {
    setSelectedTier(null);
    setAssessmentStep(0);
    setAssessmentAnswers({});
    setAssessmentComplete(false);
  };

  const completedHabits = habits.filter(h => h.done).length;

  return (
    <div className="min-h-screen bg-[#09090b] text-neutral-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-200 antialiased overflow-x-hidden">

      {/* ── NAVIGATION BAR ─────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 backdrop-blur-2xl bg-[#09090b]/85 border-b border-white/[0.06] px-6 lg:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setCurrentView(currentUser ? 'dashboard' : 'landing')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-400 flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            M
          </div>
          <div>
            <span className="font-bold tracking-tight text-base text-white">MindCast</span>
            <span className="block text-[10px] text-emerald-400 font-mono tracking-widest uppercase">AI Wellness OS</span>
          </div>
        </div>

        {currentView === 'landing' && (
          <div className="hidden md:flex items-center gap-8 text-sm text-neutral-400 font-medium">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#assessments" className="hover:text-white transition-colors">Assessments</a>
            <a href="#mira" className="hover:text-white transition-colors">MIRA AI</a>
          </div>
        )}

        <div className="flex items-center gap-3">
          {(currentView === 'landing' || currentView === 'login' || currentView === 'signup') && !currentUser && (
            <>
              <button onClick={() => setCurrentView('login')} className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white transition-all">Log In</button>
              <button onClick={() => setCurrentView('signup')} className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500 text-black hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20">Get Started</button>
            </>
          )}
          {currentView === 'dashboard' && currentUser && (
            <div className="flex items-center gap-4">
              <span className="text-xs text-neutral-400 font-mono hidden sm:inline">
                <strong className="text-emerald-300">{currentUser.name}</strong>
              </span>
              <button onClick={() => { setCurrentUser(null); setCurrentView('landing'); }} className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 border border-white/10 transition-all">
                Sign Out
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* ── VIEW ROUTER ────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">

        {/* LANDING */}
        {currentView === 'landing' && (
          <motion.div key="landing" variants={fadeVariants} initial="initial" animate="animate" exit="exit" transition={transition}>
            {/* Hero */}
            <section className="relative px-6 lg:px-12 pt-32 pb-24 max-w-5xl mx-auto text-center flex flex-col items-center">
              <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none">
                <div className="w-[700px] h-[700px] bg-emerald-600/8 rounded-full blur-[160px]" />
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-xs text-emerald-300 mb-8 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Meet MIRA • Your Personal AI Mental Wellness OS
              </div>
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl text-white leading-[1.08] mb-6">
                Master your mind with{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-white">intelligent balance</span>.
              </h1>
              <p className="text-neutral-400 text-base sm:text-lg max-w-2xl mb-12 font-normal leading-relaxed">
                MindCast combines conversational AI, clinical psychological assessments, emotional analytics, habit tracking, and wellness DNA profiling into one unified operating system.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
                <button onClick={() => setCurrentView('signup')} className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium hover:opacity-95 transition-all shadow-xl shadow-emerald-600/25 border border-emerald-400/20 text-sm">
                  Start Your Journey Free
                </button>
                <button onClick={() => setCurrentView('login')} className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] text-neutral-300 border border-white/10 font-medium transition-all text-sm">
                  Log Into Account
                </button>
              </div>
            </section>

            {/* Features */}
            <section id="features" className="px-6 lg:px-12 py-24 max-w-5xl mx-auto border-t border-white/[0.04]">
              <div className="text-center mb-16">
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3">Everything your mind needs.</h2>
                <p className="text-neutral-400 text-sm">A complete wellness operating system built for modern mental health.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { num: '01', title: 'MIRA AI Companion', desc: 'Context-aware conversational AI with emotional intelligence, typing indicators, and personalized guidance.' },
                  { num: '02', title: '3 Clinical Assessments', desc: '10, 25, and 40-question deep-reasoning psychological evaluations with AI diagnostic summaries.' },
                  { num: '03', title: 'Wellness DNA Profile', desc: 'Clinical wellness scores, stress indices, anxiety levels, happiness metrics, and burnout risk analytics.' },
                  { num: '04', title: 'Mood Timeline', desc: 'Interactive mood selectors that update a live emotional history timeline with pattern recognition.' },
                  { num: '05', title: 'Smart Journal', desc: 'Distraction-free journaling with AI-generated compassionate reflection summaries.' },
                  { num: '06', title: 'Mental Health Toolkit', desc: 'Interactive box-breathing visualizer and emergency 5-4-3-2-1 grounding technique.' },
                ].map((f) => (
                  <div key={f.num} className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 font-semibold text-sm">{f.num}</div>
                    <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                    <p className="text-sm text-neutral-400 leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Assessments Preview */}
            <section id="assessments" className="px-6 lg:px-12 py-24 max-w-5xl mx-auto border-t border-white/[0.04]">
              <div className="text-center mb-12">
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3">3 Comprehensive Clinical Assessments</h2>
                <p className="text-neutral-400 text-sm">Deep-reasoning psychological evaluations designed by clinical frameworks.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {([1, 2, 3] as AssessmentTier[]).map((tier) => {
                  const config = TIER_CONFIG[tier];
                  return (
                    <div key={tier} className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.06] space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">Assessment {tier}</span>
                        <span className="text-xs text-neutral-500 font-mono">{config.time}</span>
                      </div>
                      <div className="text-3xl font-extrabold text-white">{config.questions.length}<span className="text-sm text-neutral-400 font-normal ml-1">questions</span></div>
                      <h3 className="text-sm font-semibold text-white">{config.label}</h3>
                      <p className="text-xs text-neutral-400 leading-relaxed">{config.desc}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          </motion.div>
        )}

        {/* LOGIN */}
        {currentView === 'login' && (
          <motion.div key="login" variants={fadeVariants} initial="initial" animate="animate" exit="exit" transition={transition} className="max-w-md mx-auto px-6 py-20">
            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-2xl shadow-2xl space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-white tracking-tight">Welcome Back</h2>
                <p className="text-xs text-neutral-400">Log in securely to access your wellness workspace.</p>
              </div>
              <form onSubmit={(e) => handleAuthSubmit(e, 'login')} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-2">Email Address</label>
                  <input type="email" required value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="name@example.com" className="w-full bg-black/50 border border-white/10 rounded-xl p-3.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-2">Password</label>
                  <input type="password" required value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder="••••••••" className="w-full bg-black/50 border border-white/10 rounded-xl p-3.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors" />
                </div>
                <button type="submit" className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20">
                  Sign In to MindCast
                </button>
              </form>
              <div className="text-center pt-2">
                <button onClick={() => setCurrentView('signup')} className="text-xs text-neutral-400 hover:text-white transition-colors">
                  Don&apos;t have an account? <span className="text-emerald-400 underline">Sign up</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* SIGNUP */}
        {currentView === 'signup' && (
          <motion.div key="signup" variants={fadeVariants} initial="initial" animate="animate" exit="exit" transition={transition} className="max-w-md mx-auto px-6 py-20">
            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-2xl shadow-2xl space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-white tracking-tight">Create Your Account</h2>
                <p className="text-xs text-neutral-400">Join MindCast and activate your AI companion MIRA.</p>
              </div>
              <form onSubmit={(e) => handleAuthSubmit(e, 'signup')} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-2">Email Address</label>
                  <input type="email" required value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="name@example.com" className="w-full bg-black/50 border border-white/10 rounded-xl p-3.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-2">Create Password</label>
                  <input type="password" required value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder="••••••••" className="w-full bg-black/50 border border-white/10 rounded-xl p-3.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors" />
                </div>
                <button type="submit" className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-600/25">
                  Create Account &amp; Launch MIRA
                </button>
              </form>
              <div className="text-center pt-2">
                <button onClick={() => setCurrentView('login')} className="text-xs text-neutral-400 hover:text-white transition-colors">
                  Already have an account? <span className="text-emerald-400 underline">Log in</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* DASHBOARD */}
        {currentView === 'dashboard' && (
          <motion.div key="dashboard" variants={fadeVariants} initial="initial" animate="animate" exit="exit" transition={transition} className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 border-b border-white/[0.06] scrollbar-none">
              {([
                { id: 'mira', label: '🤖 MIRA AI' },
                { id: 'assessments', label: '🧠 Assessments' },
                { id: 'dna', label: '🧬 Wellness DNA' },
                { id: 'mood', label: '😊 Mood Tracker' },
                { id: 'journal', label: '📓 Journal' },
                { id: 'habits', label: '🎯 Habits' },
                { id: 'toolkit', label: '❤️ Toolkit' },
              ] as { id: Tab; label: string }[]).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === tab.id ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'bg-white/[0.03] text-neutral-400 hover:text-white border border-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">

              {/* ── MIRA AI CHAT ─────────────────────────────────────────── */}
              {activeTab === 'mira' && (
                <motion.div key="mira" variants={fadeVariants} initial="initial" animate="animate" exit="exit" transition={transition} className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <div className="lg:col-span-1 p-6 rounded-3xl bg-white/[0.02] border border-white/[0.08] space-y-4 h-fit">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xl">🤖</div>
                    <div>
                      <h3 className="font-bold text-white text-sm">MIRA Assistant</h3>
                      <p className="text-xs text-neutral-400 mt-1">Mind Intelligence &amp; Reflective Assistant — context-aware emotional guidance with conversation memory.</p>
                    </div>
                    <div className="pt-2 border-t border-white/10 space-y-2 text-xs text-neutral-400">
                      <p>🟢 Active Context Engine</p>
                      <p>🔒 End-to-End Encrypted</p>
                      <p>🧠 Emotional Pattern Recognition</p>
                    </div>
                    <div className="pt-2 border-t border-white/10">
                      <p className="text-xs text-neutral-500 mb-2 font-semibold uppercase tracking-wider">Quick Prompts</p>
                      {["I'm feeling anxious", "Help me sleep better", "I need to vent", "I'm feeling great today"].map(prompt => (
                        <button
                          key={prompt}
                          onClick={() => { setUserInput(prompt); }}
                          className="w-full text-left text-xs text-neutral-400 hover:text-white py-1.5 px-2 rounded-lg hover:bg-white/[0.05] transition-all"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-3 flex flex-col h-[650px] rounded-3xl bg-white/[0.02] border border-white/[0.08] overflow-hidden backdrop-blur-xl">
                    <div className="flex-1 overflow-y-auto p-6 space-y-5">
                      {chatMessages.map((msg) => (
                        <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {msg.sender === 'mira' && (
                            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs font-bold flex-shrink-0 mt-1">M</div>
                          )}
                          <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${msg.sender === 'user' ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-white/[0.05] border border-white/10 text-neutral-200 rounded-bl-none'}`}>
                            {msg.text}
                          </div>
                        </motion.div>
                      ))}
                      {isMiraTyping && (
                        <div className="flex gap-3 items-center">
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs font-bold">M</div>
                          <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/10 text-neutral-400 text-xs flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                            <span className="ml-1">MIRA is reflecting...</span>
                          </div>
                        </div>
                      )}
                      <div ref={chatBottomRef} />
                    </div>
                    <div className="p-4 border-t border-white/[0.06] bg-black/40">
                      <form onSubmit={handleSendMessage} className="flex gap-3">
                        <input
                          type="text"
                          value={userInput}
                          onChange={(e) => setUserInput(e.target.value)}
                          placeholder="Ask MIRA anything or share how you feel..."
                          className="flex-1 bg-black/60 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                        <button type="submit" className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-all shadow-lg shadow-emerald-500/20 flex-shrink-0">
                          Send
                        </button>
                      </form>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── ASSESSMENTS ──────────────────────────────────────────── */}
              {activeTab === 'assessments' && (
                <motion.div key="assessments" variants={fadeVariants} initial="initial" animate="animate" exit="exit" transition={transition} className="space-y-6">
                  {!selectedTier ? (
                    <>
                      <div className="p-8 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20">
                        <span className="text-xs font-mono tracking-widest text-emerald-400 uppercase">🧠 Clinical Assessments</span>
                        <h2 className="text-2xl font-bold text-white mt-2">Choose Your Assessment</h2>
                        <p className="text-sm text-neutral-300 mt-1">Three levels of deep-reasoning psychological evaluation. Each builds on the previous.</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {([1, 2, 3] as AssessmentTier[]).map((tier) => {
                          const config = TIER_CONFIG[tier];
                          const colors = { 1: 'emerald', 2: 'teal', 3: 'sky' };
                          const c = colors[tier];
                          return (
                            <div key={tier} className={`p-6 rounded-3xl bg-white/[0.02] border border-white/[0.08] hover:border-${c}-500/30 transition-all space-y-4 cursor-pointer group`} onClick={() => setSelectedTier(tier)}>
                              <div className="flex items-center justify-between">
                                <span className={`text-xs font-mono text-${c}-400 uppercase tracking-wider`}>Assessment {tier}</span>
                                <span className="text-xs text-neutral-500 font-mono">{config.time}</span>
                              </div>
                              <div className={`text-4xl font-extrabold text-${c}-400`}>{config.questions.length}<span className="text-sm text-neutral-400 font-normal ml-1">Qs</span></div>
                              <h3 className="text-sm font-semibold text-white leading-snug">{config.label}</h3>
                              <p className="text-xs text-neutral-400 leading-relaxed">{config.desc}</p>
                              <button className={`w-full py-2.5 rounded-xl bg-${c}-500/10 border border-${c}-500/20 text-${c}-300 text-xs font-semibold hover:bg-${c}-500/20 transition-all`}>
                                Begin Assessment →
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : assessmentComplete ? (
                    <AssessmentResult answers={assessmentAnswers} tier={selectedTier} onRetake={resetAssessment} />
                  ) : (
                    <div className="max-w-2xl mx-auto space-y-6">
                      {/* Progress */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-neutral-400">
                          <span>{TIER_CONFIG[selectedTier].label}</span>
                          <span>{assessmentStep + 1} / {TIER_CONFIG[selectedTier].questions.length}</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            animate={{ width: `${((assessmentStep + 1) / TIER_CONFIG[selectedTier].questions.length) * 100}%` }}
                            transition={{ duration: 0.4 }}
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                          />
                        </div>
                      </div>

                      {/* Question */}
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={assessmentStep}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.25 }}
                          className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] space-y-6"
                        >
                          <div>
                            <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">{TIER_CONFIG[selectedTier].questions[assessmentStep].category}</span>
                            <h3 className="text-lg font-semibold text-white mt-2 leading-snug">
                              {TIER_CONFIG[selectedTier].questions[assessmentStep].text}
                            </h3>
                          </div>
                          <div className="space-y-3">
                            {TIER_CONFIG[selectedTier].questions[assessmentStep].options.map((opt) => (
                              <button
                                key={opt.label}
                                onClick={() => handleAssessmentAnswer(TIER_CONFIG[selectedTier].questions[assessmentStep].id, opt.score)}
                                className="w-full p-4 rounded-2xl bg-black/30 border border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-left transition-all group"
                              >
                                <div className="flex items-start gap-3">
                                  <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-neutral-400 group-hover:bg-emerald-500/20 group-hover:text-emerald-300 transition-all flex-shrink-0">
                                    {opt.label}
                                  </span>
                                  <span className="text-sm text-neutral-200 leading-relaxed">{opt.text}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      </AnimatePresence>

                      <button onClick={resetAssessment} className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
                        ← Back to Assessment Selection
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── WELLNESS DNA ─────────────────────────────────────────── */}
              {activeTab === 'dna' && (
                <motion.div key="dna" variants={fadeVariants} initial="initial" animate="animate" exit="exit" transition={transition} className="space-y-6">
                  <div className="p-8 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20">
                    <span className="text-xs font-mono tracking-widest text-emerald-400 uppercase">🧬 Clinical Profile</span>
                    <h2 className="text-2xl font-bold text-white mt-2">Your Wellness DNA Profile</h2>
                    <p className="text-sm text-neutral-300 mt-1">Deep clinical analysis derived from your assessments, daily check-ins, and behavioral patterns.</p>
                  </div>

                  {/* Primary Score */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 p-8 rounded-3xl bg-gradient-to-br from-emerald-500/15 to-teal-500/5 border border-emerald-500/30 flex flex-col items-center justify-center text-center space-y-3">
                      <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">Overall Wellness Score</span>
                      <div className="text-7xl font-extrabold text-emerald-400">84</div>
                      <div className="text-sm text-neutral-400">/ 100</div>
                      <div className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold">↑ 4% from last week</div>
                    </div>
                    <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                      {[
                        { label: 'Stress Index', value: 'Low-Moderate', sub: 'Well managed through habits', color: 'emerald' },
                        { label: 'Anxiety Level', value: 'Managed', sub: 'Stable with mindful practices', color: 'teal' },
                        { label: 'Happiness Index', value: 'High', sub: 'Positive trend over 7 days', color: 'sky' },
                        { label: 'Motivation', value: 'Strong', sub: 'Driven by consistent habits', color: 'violet' },
                        { label: 'Burnout Risk', value: 'Minimal', sub: 'Optimal recovery balance', color: 'emerald' },
                        { label: 'Resilience Score', value: '78/100', sub: 'Above average psychological resilience', color: 'amber' },
                      ].map((metric) => (
                        <div key={metric.label} className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-1.5">
                          <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">{metric.label}</span>
                          <div className={`text-xl font-bold text-${metric.color}-400`}>{metric.value}</div>
                          <p className="text-xs text-neutral-500">{metric.sub}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Clinical Indicators */}
                  <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.08] space-y-4">
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Clinical Wellness Indicators</h3>
                    <div className="space-y-4">
                      {[
                        { label: 'Emotional Regulation', score: 82, color: '#10b981' },
                        { label: 'Cognitive Load Management', score: 68, color: '#0ea5e9' },
                        { label: 'Sleep Quality Index', score: 75, color: '#8b5cf6' },
                        { label: 'Social Connectedness', score: 71, color: '#f59e0b' },
                        { label: 'Stress Resilience', score: 79, color: '#ec4899' },
                        { label: 'Burnout Prevention', score: 88, color: '#10b981' },
                      ].map((indicator) => (
                        <div key={indicator.label} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-neutral-300">{indicator.label}</span>
                            <span className="font-semibold text-white">{indicator.score}/100</span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${indicator.score}%` }}
                              transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }}
                              className="h-full rounded-full"
                              style={{ background: indicator.color }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* MIRA Insight */}
                  <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-xs">🤖</div>
                      <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">MIRA Wellness Insight</span>
                    </div>
                    <p className="text-sm text-neutral-200 leading-relaxed">
                      Your Wellness DNA profile indicates a strong psychological foundation with well-managed stress responses. Your sleep quality and emotional regulation scores are above average. The primary area for growth is cognitive load management — consider implementing structured work breaks and mindfulness practices to optimize your mental performance.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ── MOOD TRACKER ─────────────────────────────────────────── */}
              {activeTab === 'mood' && (
                <motion.div key="mood" variants={fadeVariants} initial="initial" animate="animate" exit="exit" transition={transition} className="space-y-6">
                  <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-white">How are you feeling right now?</h2>
                      <p className="text-xs text-neutral-400 mt-1">Select your current emotional state to update your live timeline.</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      {[
                        { label: 'Happy', emoji: '😊' },
                        { label: 'Calm', emoji: '🌿' },
                        { label: 'Stressed', emoji: '🌊' },
                        { label: 'Excited', emoji: '✨' },
                        { label: 'Tired', emoji: '🌙' },
                        { label: 'Anxious', emoji: '☁️' },
                      ].map((m) => (
                        <button
                          key={m.label}
                          onClick={() => handleMoodSelect(m.label, m.emoji)}
                          className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${selectedMood === m.label ? 'border-emerald-500 bg-emerald-500/15 scale-105' : 'border-white/10 bg-black/30 hover:border-white/20'}`}
                        >
                          <span className="text-2xl">{m.emoji}</span>
                          <span className="text-xs font-semibold text-white">{m.label}</span>
                        </button>
                      ))}
                    </div>
                    {selectedMood && (
                      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-sm text-emerald-300">✓ Mood logged: <strong>{selectedMood}</strong> — Your timeline has been updated.</p>
                      </motion.div>
                    )}
                  </div>

                  <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] space-y-4">
                    <h3 className="text-lg font-bold text-white">Live Emotional Timeline</h3>
                    <div className="space-y-2">
                      {moodHistory.map((item, idx) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-center justify-between p-4 rounded-2xl bg-black/30 border border-white/5"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{item.emoji}</span>
                            <div>
                              <span className="text-sm font-medium text-white">{item.mood}</span>
                              <p className="text-xs text-neutral-500">{item.day}</p>
                            </div>
                          </div>
                          <span className="text-xs font-mono text-neutral-500">{item.time}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── SMART JOURNAL ────────────────────────────────────────── */}
              {activeTab === 'journal' && (
                <motion.div key="journal" variants={fadeVariants} initial="initial" animate="animate" exit="exit" transition={transition} className="space-y-6">
                  <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] space-y-4">
                    <div>
                      <h2 className="text-xl font-bold text-white">Daily AI Journal</h2>
                      <p className="text-xs text-neutral-400 mt-1">Write freely. Each entry receives an AI compassionate reflection summary from MIRA.</p>
                    </div>
                    <textarea
                      rows={6}
                      value={journalText}
                      onChange={(e) => setJournalText(e.target.value)}
                      placeholder="What went well today? What challenges did you face? What are you grateful for?"
                      className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors resize-none leading-relaxed"
                    />
                    <button
                      onClick={handleJournalSave}
                      disabled={!journalText.trim() || isAnalyzing}
                      className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                    >
                      {isAnalyzing ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                          MIRA is analyzing...
                        </>
                      ) : (
                        'Save & Analyze with MIRA'
                      )}
                    </button>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white">Past Entries</h3>
                    {journalEntries.map((entry, idx) => (
                      <motion.div key={entry.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.08] space-y-3">
                        <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
                          <span>{entry.date}</span>
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">{entry.tag}</span>
                        </div>
                        <p className="text-sm text-neutral-200 leading-relaxed">{entry.snippet.length > 120 ? entry.snippet.slice(0, 120) + '...' : entry.snippet}</p>
                        {entry.aiSummary && (
                          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                            <span className="text-xs font-semibold text-emerald-400">🤖 MIRA Reflection</span>
                            <p className="text-xs text-neutral-300 leading-relaxed">{entry.aiSummary}</p>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── HABIT TRACKER ────────────────────────────────────────── */}
              {activeTab === 'habits' && (
                <motion.div key="habits" variants={fadeVariants} initial="initial" animate="animate" exit="exit" transition={transition} className="space-y-6">
                  <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-white">Daily Wellness Habits</h2>
                        <p className="text-xs text-neutral-400 mt-1">Small consistent actions build lasting psychological resilience.</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-extrabold text-emerald-400">{completedHabits}/{habits.length}</div>
                        <div className="text-xs text-neutral-400">completed today</div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        animate={{ width: `${(completedHabits / habits.length) * 100}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                      />
                    </div>

                    <div className="space-y-3">
                      {habits.map((habit) => (
                        <motion.div
                          key={habit.id}
                          layout
                          className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${habit.done ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-black/30 border-white/5'}`}
                        >
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleHabit(habit.id)}
                              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${habit.done ? 'bg-emerald-500 border-emerald-500' : 'border-white/20 hover:border-emerald-500/50'}`}
                            >
                              {habit.done && <span className="text-black text-xs font-bold">✓</span>}
                            </button>
                            <span className="text-lg">{habit.icon}</span>
                            <span className={`text-sm font-medium ${habit.done ? 'line-through text-neutral-500' : 'text-white'}`}>{habit.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                              🔥 {habit.streak} day streak
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── TOOLKIT ──────────────────────────────────────────────── */}
              {activeTab === 'toolkit' && (
                <motion.div key="toolkit" variants={fadeVariants} initial="initial" animate="animate" exit="exit" transition={transition} className="space-y-6">
                  {/* Tool Selector */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setActiveToolkit('breathing')}
                      className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeToolkit === 'breathing' ? 'bg-emerald-500 text-black' : 'bg-white/[0.03] text-neutral-400 border border-white/10 hover:text-white'}`}
                    >
                      🌬️ Box Breathing
                    </button>
                    <button
                      onClick={() => setActiveToolkit('grounding')}
                      className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeToolkit === 'grounding' ? 'bg-rose-500 text-white' : 'bg-white/[0.03] text-neutral-400 border border-white/10 hover:text-white'}`}
                    >
                      🆘 Emergency Grounding
                    </button>
                  </div>

                  <AnimatePresence mode="wait">
                    {activeToolkit === 'breathing' && (
                      <motion.div key="breathing" variants={fadeVariants} initial="initial" animate="animate" exit="exit" transition={transition} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] space-y-6">
                          <div>
                            <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">Breathing Exercise</span>
                            <h3 className="text-xl font-bold text-white mt-1">Box Breathing (4-4-4-4)</h3>
                            <p className="text-sm text-neutral-400 mt-2">Used by Navy SEALs and clinical therapists to instantly regulate the nervous system and reduce acute stress.</p>
                          </div>
                          <BoxBreathingVisualizer />
                        </div>
                        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] space-y-4">
                          <h3 className="text-lg font-bold text-white">How Box Breathing Works</h3>
                          <div className="space-y-3">
                            {[
                              { step: '1', title: 'Activates Parasympathetic System', desc: 'Controlled breathing signals safety to your nervous system, reducing cortisol and adrenaline.' },
                              { step: '2', title: 'Regulates Heart Rate Variability', desc: 'The 4-count rhythm synchronizes your heart rate with your breath, creating physiological calm.' },
                              { step: '3', title: 'Quiets the Amygdala', desc: 'Focused breathing reduces activity in the brain\'s fear center, interrupting anxiety loops.' },
                              { step: '4', title: 'Restores Prefrontal Function', desc: 'As stress decreases, your rational thinking brain comes back online for clearer decision-making.' },
                            ].map((item) => (
                              <div key={item.step} className="flex gap-3 p-3 rounded-xl bg-black/30 border border-white/5">
                                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400 flex-shrink-0">{item.step}</div>
                                <div>
                                  <p className="text-xs font-semibold text-white">{item.title}</p>
                                  <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">{item.desc}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeToolkit === 'grounding' && (
                      <motion.div key="grounding" variants={fadeVariants} initial="initial" animate="animate" exit="exit" transition={transition} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] space-y-6">
                          <div>
                            <span className="text-xs font-mono text-rose-400 uppercase tracking-wider">Emergency Calming</span>
                            <h3 className="text-xl font-bold text-white mt-1">Grounding Sanctuary</h3>
                            <p className="text-sm text-neutral-400 mt-2">The 5-4-3-2-1 technique is a clinically validated intervention for panic attacks, acute anxiety, and dissociation.</p>
                          </div>
                          <EmergencyGrounding />
                        </div>
                        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] space-y-4">
                          <h3 className="text-lg font-bold text-white">The Science of Grounding</h3>
                          <div className="space-y-3">
                            {[
                              { title: 'Interrupts Anxiety Loops', desc: 'Engaging your senses forces your brain to process present-moment information, breaking the rumination cycle.' },
                              { title: 'Activates Sensory Cortex', desc: 'Multi-sensory engagement shifts neural activity away from the limbic system (fear) to the sensory cortex (present reality).' },
                              { title: 'Reduces Dissociation', desc: 'Physical sensory anchoring is the primary clinical intervention for dissociative episodes and trauma responses.' },
                              { title: 'Builds Interoceptive Awareness', desc: 'Regular practice strengthens your ability to notice and regulate your own physiological state.' },
                            ].map((item, i) => (
                              <div key={i} className="flex gap-3 p-3 rounded-xl bg-black/30 border border-white/5">
                                <div className="w-6 h-6 rounded-lg bg-rose-500/20 flex items-center justify-center text-xs font-bold text-rose-400 flex-shrink-0">{i + 1}</div>
                                <div>
                                  <p className="text-xs font-semibold text-white">{item.title}</p>
                                  <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">{item.desc}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20">
                            <p className="text-xs text-rose-300 leading-relaxed">
                              <strong>Important:</strong> If you are experiencing a mental health crisis, please contact a professional. In the US: SAMHSA Helpline 1-800-662-4357 | Crisis Text Line: Text HOME to 741741
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

            </AnimatePresence>
          </motion.div>
        )}

      </AnimatePresence>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] py-8 px-6 lg:px-12 mt-24 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="text-xs text-neutral-500">
          © 2026 MindCast. AI Mental Wellness Operating System.
        </div>
        <div className="text-xs text-neutral-500 font-mono tracking-wider">
          Made by Aditya Naik and Vihaan Vaghela
        </div>
      </footer>
    </div>
  );
}
