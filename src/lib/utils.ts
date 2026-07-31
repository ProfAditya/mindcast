import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function getWellnessStage(score: number): {
  stage: string;
  color: string;
  label: string;
} {
  if (score >= 8.0) return { stage: 'Flourishing', color: 'emerald', label: 'flourishing' };
  if (score >= 6.5) return { stage: 'Growing', color: 'green', label: 'growing steadily' };
  if (score >= 5.0) return { stage: 'Stabilizing', color: 'amber', label: 'stabilizing' };
  if (score >= 3.5) return { stage: 'Recovering', color: 'sky', label: 'recovery phase' };
  return { stage: 'Challenging', color: 'slate', label: 'navigating a challenging time' };
}

export function getMoodEmoji(mood: string): string {
  const map: Record<string, string> = {
    great: '✦',
    good: '◆',
    okay: '●',
    low: '◇',
    struggling: '○',
  };
  return map[mood] ?? '●';
}

export function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export function getGreeting(name: string, timeOfDay: string): string {
  const greetings: Record<string, string> = {
    morning: `Good morning, ${name}`,
    afternoon: `Good afternoon, ${name}`,
    evening: `Good evening, ${name}`,
    night: `Good night, ${name}`,
  };
  return greetings[timeOfDay] ?? `Hello, ${name}`;
}