'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Moon, Zap, CheckCircle2, ChevronRight, RotateCcw, TrendingUp, AlertCircle, Loader2, Sparkles, Users, BookOpen, Briefcase, Heart, Shield, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { assessmentsApi } from '@/lib/api';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  PolarRadiusAxis
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

type Sector = 'stress' | 'sleep' | 'work_study' | 'emotional';

interface Option {
  label: string;
  text: string;
  score: number;
}

interface Question {
  id: string;
  text: string;
  sector: Sector;
  options: Option[];
  forRole?: 'student' | 'professional'; // Tier 3 branching
}

interface SectorResult {
  key: Sector;
  label: string;
  score: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  advice: string[];
}

type TierKey = 1 | 2 | 3;
type UserRole = 'student' | 'professional' | null;

// ─── Tier 1: 10 Questions — Quick Baseline ────────────────────────────────────

const TIER1_QUESTIONS: Question[] = [
  {
    id: 't1_q1', sector: 'stress',
    text: 'How would you rate your overall stress level today?',
    options: [
      { label: 'A', text: 'Very calm and at ease', score: 4 },
      { label: 'B', text: 'Mild stress, manageable', score: 3 },
      { label: 'C', text: 'Noticeably stressed', score: 2 },
      { label: 'D', text: 'Overwhelmed or anxious', score: 1 },
    ],
  },
  {
    id: 't1_q2', sector: 'sleep',
    text: 'How many hours of sleep did you get last night?',
    options: [
      { label: 'A', text: '8+ hours — felt fully rested', score: 4 },
      { label: 'B', text: '6–8 hours — mostly rested', score: 3 },
      { label: 'C', text: '4–6 hours — somewhat tired', score: 2 },
      { label: 'D', text: 'Under 4 hours — exhausted', score: 1 },
    ],
  },
  {
    id: 't1_q3', sector: 'emotional',
    text: 'How is your mood right now, in this moment?',
    options: [
      { label: 'A', text: 'Positive and uplifted', score: 4 },
      { label: 'B', text: 'Neutral and steady', score: 3 },
      { label: 'C', text: 'A bit low or flat', score: 2 },
      { label: 'D', text: 'Sad, irritable, or anxious', score: 1 },
    ],
  },
  {
    id: 't1_q4', sector: 'stress',
    text: 'How often did you feel overwhelmed by tasks today?',
    options: [
      { label: 'A', text: 'Not at all', score: 4 },
      { label: 'B', text: 'Once or twice briefly', score: 3 },
      { label: 'C', text: 'Several times', score: 2 },
      { label: 'D', text: 'Almost constantly', score: 1 },
    ],
  },
  {
    id: 't1_q5', sector: 'sleep',
    text: 'How easily did you fall asleep last night?',
    options: [
      { label: 'A', text: 'Fell asleep quickly and easily', score: 4 },
      { label: 'B', text: 'Took a little time but fine', score: 3 },
      { label: 'C', text: 'Took a long time, restless', score: 2 },
      { label: 'D', text: 'Could barely sleep at all', score: 1 },
    ],
  },
  {
    id: 't1_q6', sector: 'emotional',
    text: 'How connected do you feel to the people around you today?',
    options: [
      { label: 'A', text: 'Very connected and supported', score: 4 },
      { label: 'B', text: 'Somewhat connected', score: 3 },
      { label: 'C', text: 'A bit isolated', score: 2 },
      { label: 'D', text: 'Completely alone or unsupported', score: 1 },
    ],
  },
  {
    id: 't1_q7', sector: 'work_study',
    text: 'How productive did you feel in your work or studies today?',
    options: [
      { label: 'A', text: 'Highly focused and productive', score: 4 },
      { label: 'B', text: 'Moderately productive', score: 3 },
      { label: 'C', text: 'Struggled to concentrate', score: 2 },
      { label: 'D', text: 'Could not focus at all', score: 1 },
    ],
  },
  {
    id: 't1_q8', sector: 'stress',
    text: 'How is your energy level right now?',
    options: [
      { label: 'A', text: 'High energy, feeling great', score: 4 },
      { label: 'B', text: 'Moderate energy', score: 3 },
      { label: 'C', text: 'Low energy, dragging', score: 2 },
      { label: 'D', text: 'Completely drained', score: 1 },
    ],
  },
  {
    id: 't1_q9', sector: 'emotional',
    text: 'How optimistic do you feel about the rest of your day?',
    options: [
      { label: 'A', text: 'Very optimistic', score: 4 },
      { label: 'B', text: 'Somewhat hopeful', score: 3 },
      { label: 'C', text: 'Uncertain or neutral', score: 2 },
      { label: 'D', text: 'Pessimistic or dreading it', score: 1 },
    ],
  },
  {
    id: 't1_q10', sector: 'work_study',
    text: 'How satisfied are you with your work-life balance today?',
    options: [
      { label: 'A', text: 'Very satisfied', score: 4 },
      { label: 'B', text: 'Mostly satisfied', score: 3 },
      { label: 'C', text: 'Somewhat dissatisfied', score: 2 },
      { label: 'D', text: 'Very dissatisfied or burned out', score: 1 },
    ],
  },
];

// ─── Tier 2: 25 Questions — Comprehensive Audit ───────────────────────────────

const TIER2_QUESTIONS: Question[] = [
  ...TIER1_QUESTIONS,
  {
    id: 't2_q11', sector: 'sleep',
    text: 'How consistent is your sleep schedule across the week?',
    options: [
      { label: 'A', text: 'Very consistent — same time daily', score: 4 },
      { label: 'B', text: 'Mostly consistent with minor variation', score: 3 },
      { label: 'C', text: 'Irregular — varies significantly', score: 2 },
      { label: 'D', text: 'No routine at all', score: 1 },
    ],
  },
  {
    id: 't2_q12', sector: 'stress',
    text: 'How often do you use healthy coping strategies (exercise, journaling, breathing)?',
    options: [
      { label: 'A', text: 'Daily — it\'s a core habit', score: 4 },
      { label: 'B', text: 'A few times a week', score: 3 },
      { label: 'C', text: 'Occasionally when stressed', score: 2 },
      { label: 'D', text: 'Rarely or never', score: 1 },
    ],
  },
  {
    id: 't2_q13', sector: 'emotional',
    text: 'How stable has your mood been over the past two weeks?',
    options: [
      { label: 'A', text: 'Very stable — consistent and balanced', score: 4 },
      { label: 'B', text: 'Mostly stable with minor ups and downs', score: 3 },
      { label: 'C', text: 'Noticeably fluctuating', score: 2 },
      { label: 'D', text: 'Highly volatile or unpredictable', score: 1 },
    ],
  },
  {
    id: 't2_q14', sector: 'work_study',
    text: 'How often do you take meaningful breaks during your work or study sessions?',
    options: [
      { label: 'A', text: 'Regularly — every 60–90 minutes', score: 4 },
      { label: 'B', text: 'Sometimes, when I remember', score: 3 },
      { label: 'C', text: 'Rarely — I push through', score: 2 },
      { label: 'D', text: 'Never — I work until I crash', score: 1 },
    ],
  },
  {
    id: 't2_q15', sector: 'emotional',
    text: 'How comfortable are you expressing your emotions to someone you trust?',
    options: [
      { label: 'A', text: 'Very comfortable — I share openly', score: 4 },
      { label: 'B', text: 'Somewhat comfortable', score: 3 },
      { label: 'C', text: 'Uncomfortable — I tend to bottle things up', score: 2 },
      { label: 'D', text: 'I have no one I trust to share with', score: 1 },
    ],
  },
  {
    id: 't2_q16', sector: 'stress',
    text: 'How often do physical symptoms (headaches, tension, stomach issues) appear when stressed?',
    options: [
      { label: 'A', text: 'Rarely or never', score: 4 },
      { label: 'B', text: 'Occasionally during peak stress', score: 3 },
      { label: 'C', text: 'Frequently', score: 2 },
      { label: 'D', text: 'Almost always when stressed', score: 1 },
    ],
  },
  {
    id: 't2_q17', sector: 'sleep',
    text: 'How refreshed do you typically feel upon waking?',
    options: [
      { label: 'A', text: 'Fully refreshed and energized', score: 4 },
      { label: 'B', text: 'Reasonably rested', score: 3 },
      { label: 'C', text: 'Groggy and slow to start', score: 2 },
      { label: 'D', text: 'Exhausted even after sleeping', score: 1 },
    ],
  },
  {
    id: 't2_q18', sector: 'emotional',
    text: 'How satisfied are you with your social relationships and support network?',
    options: [
      { label: 'A', text: 'Very satisfied — strong connections', score: 4 },
      { label: 'B', text: 'Moderately satisfied', score: 3 },
      { label: 'C', text: 'Somewhat dissatisfied', score: 2 },
      { label: 'D', text: 'Very dissatisfied or isolated', score: 1 },
    ],
  },
  {
    id: 't2_q19', sector: 'work_study',
    text: 'How often do you feel your workload is fair and manageable?',
    options: [
      { label: 'A', text: 'Almost always', score: 4 },
      { label: 'B', text: 'Most of the time', score: 3 },
      { label: 'C', text: 'Sometimes — often feels too heavy', score: 2 },
      { label: 'D', text: 'Rarely — I\'m constantly overloaded', score: 1 },
    ],
  },
  {
    id: 't2_q20', sector: 'stress',
    text: 'How well do you manage competing priorities and deadlines?',
    options: [
      { label: 'A', text: 'Very well — I stay organized and calm', score: 4 },
      { label: 'B', text: 'Reasonably well with some stress', score: 3 },
      { label: 'C', text: 'Struggle — often feel behind', score: 2 },
      { label: 'D', text: 'Poorly — deadlines cause panic', score: 1 },
    ],
  },
  {
    id: 't2_q21', sector: 'emotional',
    text: 'How often do you engage in activities purely for joy or relaxation?',
    options: [
      { label: 'A', text: 'Daily or near-daily', score: 4 },
      { label: 'B', text: 'A few times a week', score: 3 },
      { label: 'C', text: 'Rarely — no time or energy', score: 2 },
      { label: 'D', text: 'Never — I\'ve lost interest in things I used to enjoy', score: 1 },
    ],
  },
  {
    id: 't2_q22', sector: 'sleep',
    text: 'How often do you use screens (phone, laptop) in the hour before bed?',
    options: [
      { label: 'A', text: 'Never — I have a screen-free wind-down', score: 4 },
      { label: 'B', text: 'Occasionally', score: 3 },
      { label: 'C', text: 'Most nights', score: 2 },
      { label: 'D', text: 'Every night until I fall asleep', score: 1 },
    ],
  },
  {
    id: 't2_q23', sector: 'work_study',
    text: 'How often do work or study demands spill into your personal time?',
    options: [
      { label: 'A', text: 'Rarely — I maintain clear boundaries', score: 4 },
      { label: 'B', text: 'Sometimes during busy periods', score: 3 },
      { label: 'C', text: 'Frequently', score: 2 },
      { label: 'D', text: 'Almost always — no separation', score: 1 },
    ],
  },
  {
    id: 't2_q24', sector: 'stress',
    text: 'How often do you practice mindfulness, meditation, or intentional breathing?',
    options: [
      { label: 'A', text: 'Daily', score: 4 },
      { label: 'B', text: 'A few times a week', score: 3 },
      { label: 'C', text: 'Rarely', score: 2 },
      { label: 'D', text: 'Never', score: 1 },
    ],
  },
  {
    id: 't2_q25', sector: 'emotional',
    text: 'How hopeful do you feel about your mental health and personal growth over the next month?',
    options: [
      { label: 'A', text: 'Very hopeful and motivated', score: 4 },
      { label: 'B', text: 'Cautiously optimistic', score: 3 },
      { label: 'C', text: 'Uncertain or neutral', score: 2 },
      { label: 'D', text: 'Pessimistic or hopeless', score: 1 },
    ],
  },
];

// ─── Tier 3: 40 Questions — Deep Clinical Profile ─────────────────────────────

const TIER3_QUESTIONS_BASE: Question[] = [
  ...TIER2_QUESTIONS,
  // Family & Background (Q26–30)
  {
    id: 't3_q26', sector: 'emotional',
    text: 'How would you describe the emotional environment you grew up in?',
    options: [
      { label: 'A', text: 'Warm, supportive, and stable', score: 4 },
      { label: 'B', text: 'Mostly positive with some tension', score: 3 },
      { label: 'C', text: 'Stressful or emotionally inconsistent', score: 2 },
      { label: 'D', text: 'Difficult, traumatic, or neglectful', score: 1 },
    ],
  },
  {
    id: 't3_q27', sector: 'emotional',
    text: 'How has your family background shaped your current stress responses?',
    options: [
      { label: 'A', text: 'Positively — I learned healthy coping', score: 4 },
      { label: 'B', text: 'Mixed — some helpful, some not', score: 3 },
      { label: 'C', text: 'Negatively — I struggle with patterns from childhood', score: 2 },
      { label: 'D', text: 'Significantly — past trauma still affects me daily', score: 1 },
    ],
  },
  {
    id: 't3_q28', sector: 'stress',
    text: 'Is there a history of mental health challenges in your family?',
    options: [
      { label: 'A', text: 'No known history', score: 4 },
      { label: 'B', text: 'Possibly, but not discussed openly', score: 3 },
      { label: 'C', text: 'Yes, in one or two family members', score: 2 },
      { label: 'D', text: 'Yes, significant history across family', score: 1 },
    ],
  },
  {
    id: 't3_q29', sector: 'emotional',
    text: 'How would you describe your current relationship with your family?',
    options: [
      { label: 'A', text: 'Close, supportive, and healthy', score: 4 },
      { label: 'B', text: 'Decent with occasional friction', score: 3 },
      { label: 'C', text: 'Strained or distant', score: 2 },
      { label: 'D', text: 'Estranged or a source of significant stress', score: 1 },
    ],
  },
  {
    id: 't3_q30', sector: 'stress',
    text: 'Have you experienced a significant life trauma or loss in the past two years?',
    options: [
      { label: 'A', text: 'No significant trauma or loss', score: 4 },
      { label: 'B', text: 'Minor setbacks I\'ve largely processed', score: 3 },
      { label: 'C', text: 'A significant event I\'m still processing', score: 2 },
      { label: 'D', text: 'A major trauma that still deeply affects me', score: 1 },
    ],
  },
  // Historical Factors (Q31–33)
  {
    id: 't3_q31', sector: 'emotional',
    text: 'How long have you been experiencing your current mental wellness challenges?',
    options: [
      { label: 'A', text: 'This is new — less than a month', score: 4 },
      { label: 'B', text: '1–6 months', score: 3 },
      { label: 'C', text: '6 months to 2 years', score: 2 },
      { label: 'D', text: 'More than 2 years — it feels chronic', score: 1 },
    ],
  },
  {
    id: 't3_q32', sector: 'stress',
    text: 'Have you previously sought professional mental health support (therapy, counseling)?',
    options: [
      { label: 'A', text: 'Yes, and it was very helpful', score: 4 },
      { label: 'B', text: 'Yes, with mixed results', score: 3 },
      { label: 'C', text: 'No, but I\'ve considered it', score: 2 },
      { label: 'D', text: 'No, and I feel I can\'t access it', score: 1 },
    ],
  },
  {
    id: 't3_q33', sector: 'emotional',
    text: 'How would you describe your overall resilience when facing setbacks?',
    options: [
      { label: 'A', text: 'Very resilient — I bounce back quickly', score: 4 },
      { label: 'B', text: 'Moderately resilient', score: 3 },
      { label: 'C', text: 'I struggle but eventually recover', score: 2 },
      { label: 'D', text: 'Setbacks knock me down for a long time', score: 1 },
    ],
  },
  // Complex Situational Scenarios (Q34–36)
  {
    id: 't3_q34', sector: 'stress',
    text: 'When you face a major unexpected problem, your first instinct is to:',
    options: [
      { label: 'A', text: 'Stay calm, assess, and take action', score: 4 },
      { label: 'B', text: 'Feel stressed but work through it', score: 3 },
      { label: 'C', text: 'Feel paralyzed or avoidant initially', score: 2 },
      { label: 'D', text: 'Spiral into anxiety or shutdown', score: 1 },
    ],
  },
  {
    id: 't3_q35', sector: 'emotional',
    text: 'In a conflict with someone important to you, you typically:',
    options: [
      { label: 'A', text: 'Communicate openly and resolve it calmly', score: 4 },
      { label: 'B', text: 'Try to resolve it but it takes time', score: 3 },
      { label: 'C', text: 'Withdraw or avoid the conflict', score: 2 },
      { label: 'D', text: 'React intensely or the conflict escalates', score: 1 },
    ],
  },
  {
    id: 't3_q36', sector: 'sleep',
    text: 'When you have a high-pressure day ahead, your sleep the night before is typically:',
    options: [
      { label: 'A', text: 'Normal — I sleep well regardless', score: 4 },
      { label: 'B', text: 'Slightly disrupted but manageable', score: 3 },
      { label: 'C', text: 'Significantly disrupted by anticipatory anxiety', score: 2 },
      { label: 'D', text: 'Almost no sleep — I lie awake for hours', score: 1 },
    ],
  },
];

// Student-specific questions (Q37–40 for students)
const TIER3_STUDENT_QUESTIONS: Question[] = [
  {
    id: 't3_q37_s', sector: 'work_study', forRole: 'student',
    text: 'How often do academic deadlines or exams cause you significant anxiety?',
    options: [
      { label: 'A', text: 'Rarely — I manage academic pressure well', score: 4 },
      { label: 'B', text: 'Sometimes during peak periods', score: 3 },
      { label: 'C', text: 'Frequently — most assessments feel overwhelming', score: 2 },
      { label: 'D', text: 'Almost always — academic stress is constant', score: 1 },
    ],
  },
  {
    id: 't3_q38_s', sector: 'work_study', forRole: 'student',
    text: 'How well do you balance your academic workload with personal wellbeing?',
    options: [
      { label: 'A', text: 'Very well — I protect my personal time', score: 4 },
      { label: 'B', text: 'Reasonably well most of the time', score: 3 },
      { label: 'C', text: 'Poorly — studies dominate everything', score: 2 },
      { label: 'D', text: 'I sacrifice sleep and health for grades', score: 1 },
    ],
  },
  {
    id: 't3_q39_s', sector: 'emotional', forRole: 'student',
    text: 'How much does social comparison with peers affect your self-worth?',
    options: [
      { label: 'A', text: 'Very little — I focus on my own path', score: 4 },
      { label: 'B', text: 'Occasionally, but I manage it', score: 3 },
      { label: 'C', text: 'Frequently — I often feel behind others', score: 2 },
      { label: 'D', text: 'Constantly — it significantly impacts my confidence', score: 1 },
    ],
  },
  {
    id: 't3_q40_s', sector: 'stress', forRole: 'student',
    text: 'How clear are you about your academic or career direction?',
    options: [
      { label: 'A', text: 'Very clear — I have a defined path', score: 4 },
      { label: 'B', text: 'Mostly clear with some uncertainty', score: 3 },
      { label: 'C', text: 'Quite uncertain and anxious about the future', score: 2 },
      { label: 'D', text: 'Completely lost — it causes significant distress', score: 1 },
    ],
  },
];

// Professional-specific questions (Q37–40 for professionals)
const TIER3_PROFESSIONAL_QUESTIONS: Question[] = [
  {
    id: 't3_q37_p', sector: 'work_study', forRole: 'professional',
    text: 'How often does your job demand more than you can sustainably give?',
    options: [
      { label: 'A', text: 'Rarely — my workload is manageable', score: 4 },
      { label: 'B', text: 'Sometimes during busy periods', score: 3 },
      { label: 'C', text: 'Frequently — I\'m often stretched thin', score: 2 },
      { label: 'D', text: 'Almost always — I\'m in chronic burnout', score: 1 },
    ],
  },
  {
    id: 't3_q38_p', sector: 'stress', forRole: 'professional',
    text: 'How well do you disconnect from work during evenings and weekends?',
    options: [
      { label: 'A', text: 'Very well — I have clear off-time boundaries', score: 4 },
      { label: 'B', text: 'Mostly, with occasional check-ins', score: 3 },
      { label: 'C', text: 'Poorly — work follows me everywhere', score: 2 },
      { label: 'D', text: 'I never fully disconnect', score: 1 },
    ],
  },
  {
    id: 't3_q39_p', sector: 'emotional', forRole: 'professional',
    text: 'How much does workplace culture or management affect your mental health?',
    options: [
      { label: 'A', text: 'Positively — my workplace is supportive', score: 4 },
      { label: 'B', text: 'Neutral — it doesn\'t significantly impact me', score: 3 },
      { label: 'C', text: 'Negatively — there\'s tension or poor leadership', score: 2 },
      { label: 'D', text: 'Severely — it\'s a major source of distress', score: 1 },
    ],
  },
  {
    id: 't3_q40_p', sector: 'work_study', forRole: 'professional',
    text: 'How aligned do you feel with your career purpose and long-term goals?',
    options: [
      { label: 'A', text: 'Very aligned — my work feels meaningful', score: 4 },
      { label: 'B', text: 'Mostly aligned with some doubts', score: 3 },
      { label: 'C', text: 'Misaligned — I feel stuck or unfulfilled', score: 2 },
      { label: 'D', text: 'Completely disconnected — I dread my work', score: 1 },
    ],
  },
];

// ─── Advice Engine ────────────────────────────────────────────────────────────

function buildAdvice(sector: Sector, score: number, tier: TierKey, role: UserRole): string[] {
  const level = score >= 75 ? 'high' : score >= 50 ? 'mid' : 'low';

  const base: Record<Sector, Record<string, string[]>> = {
    stress: {
      high: [
        'Your stress resilience is strong — protect it by maintaining your current coping rituals.',
        'Consider journaling your stress-management wins to reinforce what works for you.',
        'Share your strategies with someone who might benefit — teaching deepens your own practice.',
      ],
      mid: [
        'Try the 4-7-8 breathing technique: inhale 4s, hold 7s, exhale 8s — repeat 3 times daily.',
        'Schedule a 15-minute "worry window" each day to process concerns, then consciously let them go.',
        'Identify your top 3 stressors this week and write one small, actionable step for each.',
      ],
      low: [
        'Your stress levels are significantly elevated — prioritize a daily 10-minute decompression ritual.',
        'Consider speaking with a therapist or counselor; chronic stress needs professional support.',
        'Break your day into 90-minute focus blocks with mandatory 15-minute recovery breaks.',
        'Progressive muscle relaxation before bed can release the physical tension stress creates.',
      ],
    },
    sleep: {
      high: [
        'Excellent sleep hygiene — protect your schedule even on weekends to maintain your rhythm.',
        'Track your sleep quality to identify what consistently keeps it strong.',
        'Your rested state is a foundation for better mood, focus, and immune function.',
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
    work_study: {
      high: [
        'Your work-life balance is a genuine strength — model it for others around you.',
        'Continue protecting your recovery time; sustainable performance requires it.',
        'Explore stretch goals that excite you without compromising your current equilibrium.',
      ],
      mid: [
        'Set a hard "off" time for work or study notifications each evening and honor it.',
        'Use the Pomodoro technique: 25 minutes focused, 5 minutes rest — it prevents burnout.',
        'Identify one recurring task that drains you disproportionately and find a way to reduce it.',
      ],
      low: [
        'Your current load appears unsustainable — have an honest conversation about workload with a supervisor or advisor.',
        'Start with just one firm boundary: no work after a specific hour, and protect it.',
        'Burnout recovery requires rest, not just efficiency hacks — schedule genuine downtime.',
        'Consider whether your current path aligns with your values and long-term wellbeing.',
      ],
    },
    emotional: {
      high: [
        'Your emotional balance is a real asset — nurture it with regular self-reflection.',
        'Continue practices that support your mental clarity, like journaling or mindfulness.',
        'Your social connections are a protective factor for long-term mental health.',
      ],
      mid: [
        'Start a 5-minute daily gratitude journal — write 3 specific things you appreciated today.',
        'Practice cognitive reframing: when a negative thought arises, ask "Is this 100% true?"',
        'Reach out to one person in your support network this week — connection reduces anxiety.',
      ],
      low: [
        'Mood volatility and isolation are serious signals — please consider professional support.',
        'Try the STOP technique: Stop, Take a breath, Observe your thoughts, Proceed mindfully.',
        'Limit social media to 30 minutes daily — comparison and doom-scrolling amplify low moods.',
        'Small acts of connection matter: a text, a walk with a friend, or a community group.',
      ],
    },
  };

  const advice = [...base[sector][level]];

  // Tier 3 adds role-specific advice
  if (tier === 3 && role === 'student' && level === 'low') {
    if (sector === 'work_study') advice.push('Talk to your academic advisor about workload adjustments — most institutions have support systems for this.');
    if (sector === 'emotional') advice.push('University counseling services are often free and confidential — reaching out is a sign of strength.');
  }
  if (tier === 3 && role === 'professional' && level === 'low') {
    if (sector === 'work_study') advice.push('Document your workload and present it to your manager — data-driven conversations are more effective.');
    if (sector === 'emotional') advice.push('Employee Assistance Programs (EAPs) often provide free confidential counseling — check if your employer offers one.');
  }

  return advice;
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

function computeResults(
  answers: Record<string, string>,
  questions: Question[],
  tier: TierKey,
  role: UserRole
): { overallScore: number; sectors: SectorResult[] } {
  const sectorScores: Record<string, { total: number; count: number }> = {
    stress: { total: 0, count: 0 },
    sleep: { total: 0, count: 0 },
    work_study: { total: 0, count: 0 },
    emotional: { total: 0, count: 0 },
  };

  questions.forEach((q) => {
    const selectedLabel = answers[q.id];
    if (!selectedLabel) return;
    const opt = q.options.find((o) => o.label === selectedLabel);
    if (!opt) return;
    sectorScores[q.sector].total += opt.score;
    sectorScores[q.sector].count += 1;
  });

  const sectorDefs = [
    { key: 'stress' as Sector, label: 'Stress Management', icon: <Zap size={18} strokeWidth={1.5} />, color: 'text-rose-500', bgColor: 'bg-rose-500/10' },
    { key: 'sleep' as Sector, label: 'Sleep Quality', icon: <Moon size={18} strokeWidth={1.5} />, color: 'text-indigo-500', bgColor: 'bg-indigo-500/10' },
    { key: 'work_study' as Sector, label: 'Work / Study Load', icon: <Briefcase size={18} strokeWidth={1.5} />, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
    { key: 'emotional' as Sector, label: 'Emotional Balance', icon: <Heart size={18} strokeWidth={1.5} />, color: 'text-violet-500', bgColor: 'bg-violet-500/10' },
  ];

  const sectors: SectorResult[] = sectorDefs.map((def) => {
    const s = sectorScores[def.key];
    const maxPossible = s.count * 4;
    const score = maxPossible > 0 ? Math.round((s.total / maxPossible) * 100) : 0;
    return { ...def, score, advice: buildAdvice(def.key, score, tier, role) };
  });

  const overallScore = Math.round(sectors.reduce((acc, s) => acc + s.score, 0) / sectors.length);
  return { overallScore, sectors };
}

function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Thriving', color: 'text-emerald-500' };
  if (score >= 60) return { label: 'Balanced', color: 'text-violet-500' };
  if (score >= 40) return { label: 'Needs Attention', color: 'text-amber-500' };
  return { label: 'At Risk', color: 'text-rose-500' };
}

// ─── Tier Config ──────────────────────────────────────────────────────────────

const TIER_CONFIG = {
  1: {
    label: 'Quick Baseline',
    description: '10 questions · ~3 minutes',
    detail: 'Rapid evaluation of your immediate daily stress, sleep quality, energy, and short-term mood.',
    icon: <Zap size={20} strokeWidth={1.5} />,
    color: 'from-sky-500/20 to-sky-500/5',
    border: 'border-sky-500/30',
    badge: 'text-sky-600 dark:text-sky-400 bg-sky-500/10',
    questions: TIER1_QUESTIONS,
  },
  2: {
    label: 'Comprehensive Audit',
    description: '25 questions · ~8 minutes',
    detail: 'Medium-depth assessment covering lifestyle balance, social support, relationship dynamics, and situational coping.',
    icon: <Shield size={20} strokeWidth={1.5} />,
    color: 'from-violet-500/20 to-violet-500/5',
    border: 'border-violet-500/30',
    badge: 'text-violet-600 dark:text-violet-400 bg-violet-500/10',
    questions: TIER2_QUESTIONS,
  },
  3: {
    label: 'Deep Profile',
    description: '40 questions · ~15 minutes',
    detail: 'Clinical-grade assessment with family background, historical factors, and dynamic branching for students vs. professionals.',
    icon: <Brain size={20} strokeWidth={1.5} />,
    color: 'from-rose-500/20 to-rose-500/5',
    border: 'border-rose-500/30',
    badge: 'text-rose-600 dark:text-rose-400 bg-rose-500/10',
    questions: TIER3_QUESTIONS_BASE,
  },
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function WellnessAssessmentContent() {
  const [selectedTier, setSelectedTier] = useState<TierKey | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [showRoleSelect, setShowRoleSelect] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [results, setResults] = useState<ReturnType<typeof computeResults> | null>(null);

  // Build the active question list
  const activeQuestions: Question[] = React.useMemo(() => {
    if (!selectedTier) return [];
    if (selectedTier === 3) {
      const roleQs = userRole === 'student' ? TIER3_STUDENT_QUESTIONS : TIER3_PROFESSIONAL_QUESTIONS;
      return [...TIER3_QUESTIONS_BASE, ...roleQs];
    }
    return TIER_CONFIG[selectedTier].questions;
  }, [selectedTier, userRole]);

  const answeredCount = Object.keys(answers).length;
  const allAnswered = activeQuestions.length > 0 && answeredCount === activeQuestions.length;
  const progress = activeQuestions.length > 0 ? (answeredCount / activeQuestions.length) * 100 : 0;

  const handleTierSelect = (tier: TierKey) => {
    setSelectedTier(tier);
    setAnswers({});
    setSubmitted(false);
    setResults(null);
    setSaveError(null);
    if (tier === 3) {
      setShowRoleSelect(true);
    } else {
      setUserRole(null);
      setShowRoleSelect(false);
    }
  };

  const handleRoleSelect = (role: UserRole) => {
    setUserRole(role);
    setShowRoleSelect(false);
  };

  const handleSelect = (questionId: string, label: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: label }));
  };

  const handleSubmit = async () => {
    if (!allAnswered || !selectedTier) return;
    setSaving(true);
    setSaveError(null);

    const computed = computeResults(answers, activeQuestions, selectedTier, userRole);
    setResults(computed);
    setSubmitted(true);

    const payload = activeQuestions.map((q) => {
      const selectedLabel = answers[q.id];
      const opt = q.options.find((o) => o.label === selectedLabel);
      return { question_id: q.id, value: opt?.score ?? 1 };
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
    setSelectedTier(null);
    setUserRole(null);
    setShowRoleSelect(false);
    setAnswers({});
    setSubmitted(false);
    setResults(null);
    setSaveError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const radarData = results
    ? results.sectors.map((s) => ({ subject: s.label.split(' ')[0], score: s.score, fullMark: 100 }))
    : [];

  const sectorColors: Record<string, string> = {
    stress: 'text-rose-500',
    sleep: 'text-indigo-500',
    work_study: 'text-amber-500',
    emotional: 'text-violet-500',
  };
  const sectorLabels: Record<string, string> = {
    stress: 'Stress',
    sleep: 'Sleep',
    work_study: 'Work / Study',
    emotional: 'Emotional',
  };

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
          Choose your assessment depth. Mira will use your results to personalise her support and advice.
        </p>
      </div>

      {/* Tier Selection */}
      {!selectedTier && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-4 mb-10"
        >
          <p className="text-xs font-semibold font-heading text-muted-foreground uppercase tracking-widest mb-4">
            Select Assessment Depth
          </p>
          {([1, 2, 3] as TierKey[]).map((tier) => {
            const cfg = TIER_CONFIG[tier];
            return (
              <button
                key={tier}
                onClick={() => handleTierSelect(tier)}
                className={cn(
                  'w-full rounded-2xl border bg-gradient-to-br p-5 text-left transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] group',
                  cfg.color, cfg.border
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', cfg.badge)}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-heading font-bold text-sm text-foreground">Tier {tier} — {cfg.label}</span>
                      <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full font-heading', cfg.badge)}>
                        {cfg.description}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{cfg.detail}</p>
                  </div>
                  <ChevronRight size={16} strokeWidth={2} className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0 mt-1" />
                </div>
              </button>
            );
          })}
        </motion.div>
      )}

      {/* Role Selection for Tier 3 */}
      <AnimatePresence>
        {showRoleSelect && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="mb-8"
          >
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-2">
                <Users size={16} strokeWidth={1.5} className="text-primary" />
                <h3 className="font-heading font-semibold text-sm text-foreground">One quick question before we begin</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-5">
                Your Tier 3 assessment includes questions tailored to your daily context. Which best describes you?
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => handleRoleSelect('student')}
                  className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all duration-150 text-left group"
                >
                  <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
                    <BookOpen size={16} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="font-heading font-semibold text-sm text-foreground">Student</p>
                    <p className="text-xs text-muted-foreground">Academic environment, exams, campus life</p>
                  </div>
                </button>
                <button
                  onClick={() => handleRoleSelect('professional')}
                  className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all duration-150 text-left group"
                >
                  <div className="w-9 h-9 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0">
                    <Briefcase size={16} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="font-heading font-semibold text-sm text-foreground">Working Professional</p>
                    <p className="text-xs text-muted-foreground">Career, workplace, professional demands</p>
                  </div>
                </button>
              </div>
              <button
                onClick={() => { setSelectedTier(null); setShowRoleSelect(false); }}
                className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to tier selection
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Assessment */}
      {selectedTier && !showRoleSelect && !submitted && (
        <>
          {/* Tier Badge + Back */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full font-heading', TIER_CONFIG[selectedTier].badge)}>
                Tier {selectedTier} — {TIER_CONFIG[selectedTier].label}
              </span>
              {selectedTier === 3 && userRole && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full font-heading bg-muted text-muted-foreground capitalize">
                  {userRole}
                </span>
              )}
            </div>
            <button
              onClick={handleRetake}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <RotateCcw size={11} strokeWidth={2} /> Change tier
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-heading">
                {answeredCount} of {activeQuestions.length} answered
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

          {/* Questions */}
          <div className="space-y-6 mb-10">
            {activeQuestions.map((q, idx) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.02, 0.4), duration: 0.3 }}
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
            ))}
          </div>

          {/* Submit */}
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
                <><Star size={16} strokeWidth={2} /> View My Results</>
              )}
            </button>
          </div>
        </>
      )}

      {/* Results */}
      <AnimatePresence>
        {submitted && results && selectedTier && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            {saveError && (
              <div className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-900/20 px-4 py-3">
                <AlertCircle size={16} strokeWidth={1.5} className="text-amber-600 dark:text-amber-400 shrink-0" />
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Results calculated locally. Could not save to server: {saveError}
                </p>
              </div>
            )}

            {/* Tier + Role Badge */}
            <div className="flex items-center gap-2 mb-5">
              <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full font-heading', TIER_CONFIG[selectedTier].badge)}>
                Tier {selectedTier} — {TIER_CONFIG[selectedTier].label}
              </span>
              {selectedTier === 3 && userRole && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full font-heading bg-muted text-muted-foreground capitalize">
                  {userRole}
                </span>
              )}
            </div>

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
                    ? "You're in a strong place. Keep nurturing your habits and stay consistent."
                    : results.overallScore >= 50
                    ? 'You have a solid foundation with some areas worth strengthening.' :'Your results suggest some areas need focused attention. Small steps matter.'}
                </p>
                <div className="flex items-center gap-2 mt-4 justify-center sm:justify-start">
                  <button
                    onClick={handleRetake}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-xs font-semibold font-heading text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150"
                  >
                    <RotateCcw size={13} strokeWidth={2} />
                    Take Another Assessment
                  </button>
                </div>
              </div>
            </div>

            {/* Radar + Sector Scores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                    <Radar name="Score" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

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

            {/* Personalised Advice */}
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
