import type { ShareCategory } from '@/lib/api/types';
export const CATEGORY_INFO: Record<ShareCategory, { label: string; about: string }> = {
  medical_records: {
    label: 'Medical records & documents',
    about: 'Records you’ve added and any attached files (opened via short-lived links).',
  },
  medical_history: {
    label: 'Health history',
    about: 'Conditions, medications, allergies, surgeries and other history.',
  },
  assessments: {
    label: 'Assessment results',
    about: 'PHQ-9, GAD-7 and WHO-5 results stored on the server.',
  },
  mood_wellbeing: {
    label: 'Mood check-ins',
    about: 'Mood, energy, stress and anxiety scores and notes.',
  },
  sleep_habits: { label: 'Sleep & habits', about: 'Sleep logs and habit entries.' },
  lifestyle: {
    label: 'Daily wellbeing logs',
    about: 'Activity, outdoor time, water and screen-time totals.',
  },
  wellness_experiments: {
    label: 'Wellness experiments',
    about: 'Any wellness experiments recorded in your account.',
  },
  ai_summaries: {
    label: 'AI summaries',
    about: 'Summaries SOUL generated for you (not your conversations).',
  },
  digital_behaviour: {
    label: 'Screen-time details',
    about: 'Manually entered screen time by category and app.',
  },
};
export const NEVER_SHARED = ['Journal entries', 'SOUL conversations', 'Reminders and goals'];
