export const mockUser = {
  id: 'user-001',
  name: 'Aria Chen',
  email: 'aria@mindcast.app',
  is_admin: false,
  created_at: '2026-06-01T00:00:00Z',
};

export const mockWellnessScore = 7.2;

export const mockMoodTrend = [
  { date: 'Jul 17', energy: 6, stress: 5, mood: 'good' },
  { date: 'Jul 18', energy: 5, stress: 6, mood: 'okay' },
  { date: 'Jul 19', energy: 7, stress: 4, mood: 'good' },
  { date: 'Jul 20', energy: 8, stress: 3, mood: 'great' },
  { date: 'Jul 21', energy: 6, stress: 5, mood: 'good' },
  { date: 'Jul 22', energy: 4, stress: 7, mood: 'low' },
  { date: 'Jul 23', energy: 5, stress: 6, mood: 'okay' },
  { date: 'Jul 24', energy: 7, stress: 4, mood: 'good' },
  { date: 'Jul 25', energy: 8, stress: 3, mood: 'great' },
  { date: 'Jul 26', energy: 7, stress: 4, mood: 'good' },
  { date: 'Jul 27', energy: 6, stress: 5, mood: 'good' },
  { date: 'Jul 28', energy: 5, stress: 6, mood: 'okay' },
  { date: 'Jul 29', energy: 8, stress: 3, mood: 'great' },
  { date: 'Jul 30', energy: 7, stress: 4, mood: 'good' },
];

export const mockHabitsToday = [
  { id: 'habit-001', type: 'sleep', label: 'Sleep', value: 7.5, unit: 'hrs', target: 8, completed: true, color: 'sky' },
  { id: 'habit-002', type: 'meditation', label: 'Meditation', value: 15, unit: 'min', target: 20, completed: false, color: 'fuchsia' },
  { id: 'habit-003', type: 'exercise', label: 'Exercise', value: 30, unit: 'min', target: 30, completed: true, color: 'emerald' },
  { id: 'habit-004', type: 'water', label: 'Hydration', value: 5, unit: 'glasses', target: 8, completed: false, color: 'cyan' },
];

export const mockRecentJournal = {
  id: 'journal-001',
  prompt: 'What brought you peace today?',
  entry: 'I had a quiet morning walk before the meetings started. The light was soft and I noticed how the trees have started to change. It reminded me that transitions can be beautiful...',
  sentiment: 'positive',
  created_at: '2026-07-30T08:15:00Z',
};

export const mockMiraInsight = "I've noticed your energy has been climbing steadily over the past week — especially on days you exercise. That pattern is worth nurturing. What feels different on those mornings?";

export const mockDashboardStats = {
  wellness_score: 7.2,
  habits_logged_today: 2,
  journal_entries_count: 14,
  mood_check_ins_30d: 22,
  avg_energy_30d: 6.4,
  avg_stress_30d: 4.8,
  assessment_trend: 'improving',
  streak_days: 12,
};

export const mockConversations = [
  {
    id: 'conv-001',
    role: 'assistant' as const,
    content: "Hello, Aria. I'm glad you're here today. I've been thinking about what you shared last time — about the pressure at work and the sleep disruption that followed. How are you feeling as you start this week?",
    created_at: '2026-07-29T09:00:00Z',
  },
  {
    id: 'conv-002',
    role: 'user' as const,
    content: "Honestly, a bit better. I slept well last night for the first time in a while. Still anxious about the presentation but less so.",
    created_at: '2026-07-29T09:01:00Z',
  },
  {
    id: 'conv-003',
    role: 'assistant' as const,
    content: "That sleep feels significant — your body was telling you something, and it sounds like it got what it needed. Anxiety before a presentation is your mind's way of caring about the outcome, which says a lot about your investment in your work.\n\nWhat would help you feel most prepared without tipping into overwhelm? Sometimes the difference between productive readiness and spiraling is just one small anchor.",
    created_at: '2026-07-29T09:02:00Z',
  },
  {
    id: 'conv-004',
    role: 'user' as const,
    content: "I think I just need to talk through it. Maybe a short rehearsal and then stop. I tend to over-prepare and then exhaust myself.",
    created_at: '2026-07-29T09:03:00Z',
  },
  {
    id: 'conv-005',
    role: 'assistant' as const,
    content: "That self-awareness is genuinely powerful. Over-preparation often masquerades as diligence, but you've identified exactly where your energy leaks. One focused rehearsal, then rest — that's a strategy your nervous system will thank you for.\n\n**A few things that might help:**\n- Set a timer for your rehearsal. When it ends, you're done.\n- Write down the three core points you want to land. That's your anchor.\n- The night before, do something completely unrelated — a walk, a film, music.\n\nYou already know what you need. I'm just reflecting it back.",
    created_at: '2026-07-29T09:04:00Z',
  },
];

export const mockWellnessContext = {
  wellness_score: 7.2,
  dominant_mood: 'good',
  avg_energy: 6.4,
  avg_stress: 4.8,
  streak_days: 12,
  top_strength: 'Sleep & Recovery',
  focus_area: 'Stress Management',
};

export const mockQuickPrompts = [
  { id: 'qp-01', text: "I\'m feeling anxious today", category: 'mood' },
  { id: 'qp-02', text: "Help me wind down for sleep", category: 'sleep' },
  { id: 'qp-03', text: "I need a moment of calm", category: 'meditation' },
  { id: 'qp-04', text: "Reflect on my week with me", category: 'journal' },
  { id: 'qp-05', text: "What patterns do you see in my data?", category: 'insights' },
];