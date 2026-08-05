import { NextRequest, NextResponse } from 'next/server';

// ─── Types ────────────────────────────────────────────────────────────────────

type Sector = 'stress' | 'sleep' | 'work_study' | 'emotional';

interface SectorData {
  score?: number;
  label: string;
}

interface AssessmentContext {
  overall_score?: number;
  stress_score?: number;
  sleep_score?: number;
  work_study_score?: number;
  emotional_score?: number;
  // Legacy field names for backward compat
  psychology_score?: number;
  lifestyle_score?: number;
  tier?: number;
  user_role?: 'student' | 'professional' | null;
  family_history_flag?: boolean;
  trauma_flag?: boolean;
}

interface ChatRequestBody {
  message: string;
  assessmentData?: AssessmentContext | null;
  assessmentHistory?: Array<AssessmentContext & { created_at?: string }>;
  recentMoods?: Array<{
    mood: string;
    energy_level?: number;
    stress_level?: number;
    created_at?: string;
  }>;
  recentHabits?: Array<{
    habit_type: string;
    value: number;
    unit?: string;
    completed?: boolean;
  }>;
}

// ─── Local Intelligence Engine ────────────────────────────────────────────────

function classifyScore(score: number | undefined): 'thriving' | 'balanced' | 'attention' | 'risk' | 'unknown' {
  if (score == null) return 'unknown';
  if (score >= 80) return 'thriving';
  if (score >= 60) return 'balanced';
  if (score >= 40) return 'attention';
  return 'risk';
}

function getLowestSector(data: AssessmentContext): { sector: Sector; score: number } | null {
  const sectors: Array<{ sector: Sector; score: number | undefined }> = [
    { sector: 'stress', score: data.stress_score },
    { sector: 'sleep', score: data.sleep_score },
    { sector: 'work_study', score: data.work_study_score ?? data.lifestyle_score },
    { sector: 'emotional', score: data.emotional_score ?? data.psychology_score },
  ];
  const valid = sectors.filter((s) => s.score != null) as Array<{ sector: Sector; score: number }>;
  if (valid.length === 0) return null;
  return valid.reduce((min, s) => (s.score < min.score ? s : min));
}

function getHighestSector(data: AssessmentContext): { sector: Sector; score: number } | null {
  const sectors: Array<{ sector: Sector; score: number | undefined }> = [
    { sector: 'stress', score: data.stress_score },
    { sector: 'sleep', score: data.sleep_score },
    { sector: 'work_study', score: data.work_study_score ?? data.lifestyle_score },
    { sector: 'emotional', score: data.emotional_score ?? data.psychology_score },
  ];
  const valid = sectors.filter((s) => s.score != null) as Array<{ sector: Sector; score: number }>;
  if (valid.length === 0) return null;
  return valid.reduce((max, s) => (s.score > max.score ? s : max));
}

const SECTOR_LABELS: Record<Sector, string> = {
  stress: 'Stress Management',
  sleep: 'Sleep Quality',
  work_study: 'Work & Study Load',
  emotional: 'Emotional Balance',
};

// ─── Contextual Response Pools ────────────────────────────────────────────────

// Each pool has 6+ varied responses to prevent repetition
const RESPONSE_POOLS = {
  // High overall wellness (score >= 75)
  thriving: [
    (ctx: string) => `${ctx}You're genuinely in a strong place right now — and that's worth acknowledging. Wellness isn't just the absence of struggle; it's the presence of real, practiced resilience. What you've built here matters.\n\nI'd love to help you deepen what's already working. Is there a specific area — maybe a relationship, a creative goal, or a new habit — where you'd like to channel this energy? Sometimes our best growth happens when we're already stable enough to take intentional risks.`,
    (ctx: string) => `${ctx}Your wellness profile is genuinely healthy right now. I want to reflect that back to you clearly, because it's easy to overlook how far you've come when you're in the middle of living it.\n\nOne thing I've noticed in people who sustain this kind of balance: they protect their recovery time as fiercely as their productive time. What does your recovery look like? And is there anything you want to explore or strengthen from this foundation?`,
    (ctx: string) => `${ctx}There's something quietly powerful about being in a balanced, thriving state — it means your daily habits and coping strategies are actually working. That's not luck; that's practice.\n\nI'm curious: what's one thing you're most proud of in how you've been taking care of yourself lately? And is there anything you've been wanting to try or explore that you haven't had the bandwidth for before?`,
  ],

  // Moderate wellness (score 50–74)
  balanced: [
    (ctx: string) => `${ctx}You're in a genuinely decent place — not perfect, but real and honest. That kind of self-awareness is actually a significant strength. Most people either overestimate or underestimate where they are; you seem to have a clear-eyed view.\n\nThe areas where you're doing well are worth protecting deliberately. And the areas that need attention don't require a complete overhaul — often one or two targeted changes make a disproportionate difference. What feels most pressing to you right now?`,
    (ctx: string) => `${ctx}Your results show a solid foundation with some genuine opportunities. I want to be honest with you: the gap between "okay" and "thriving" is usually smaller than it feels — it's often one or two keystone habits that shift everything.\n\nWhat's one thing that, if it were consistently better, would make the biggest difference to how you feel day-to-day? Let's start there.`,
    (ctx: string) => `${ctx}There's real strength in your profile, alongside some areas that are asking for a little more attention. I find that the most meaningful progress usually comes from working with what's already good rather than fixating on what's not.\n\nWhat's been feeling most draining lately? And what's been giving you energy? Understanding that contrast often reveals exactly where to focus.`,
  ],

  // Low wellness (score < 50)
  struggling: [
    (ctx: string) => `${ctx}I want you to know that I see what your results are showing, and I'm not going to minimize it. You're carrying a significant load right now — and the fact that you're here, checking in, taking this seriously, says something important about you.\n\nWe don't need to fix everything at once. In fact, trying to do that usually makes things worse. What's the one thing that feels most urgent or most exhausting right now? Let's start there, together.`,
    (ctx: string) => `${ctx}Your results are telling me something important, and I want to respond to that with honesty and care. You're in a challenging place right now — but challenging doesn't mean permanent, and it doesn't mean you're failing.\n\nSometimes the most powerful thing we can do is simply name what's hard. What's been the heaviest part of your days lately? I'm here to listen, and then we can think through what might help.`,
    (ctx: string) => `${ctx}I'm genuinely glad you took this assessment, because what it's showing me is that you need and deserve real support right now — not platitudes, but actual, practical help.\n\nI want to ask you something directly: is there one area of your life that, if it improved even slightly, would give you a little more breathing room? Sometimes the smallest relief creates enough space to start rebuilding. Tell me what's going on.`,
  ],

  // Sleep-specific low
  sleep_low: [
    (ctx: string) => `${ctx}Your sleep score is one of the areas that stands out most in your results, and I want to address it directly — because sleep isn't just rest, it's the foundation everything else is built on. When sleep suffers, stress amplifies, mood destabilizes, and focus fragments.\n\nHere's what I'd suggest starting with: pick one thing to change tonight. Not a whole routine — just one thing. Could be putting your phone in another room, keeping the room cooler, or setting a consistent wake time. Which of those feels most doable for you?`,
    (ctx: string) => `${ctx}Sleep is showing up as a significant area of concern in your profile. I know it can feel like a chicken-and-egg problem — you're stressed so you can't sleep, and you can't sleep so you're more stressed.\n\nThe most evidence-backed entry point is a consistent wake time, even on weekends. Your body's circadian rhythm responds to when you wake up more than when you go to sleep. Would you be willing to try setting one fixed wake time for the next 7 days and see what shifts?`,
  ],

  // Stress-specific low
  stress_low: [
    (ctx: string) => `${ctx}Your stress levels are elevated in a way that deserves real attention. Chronic stress isn't just uncomfortable — it has measurable effects on sleep, immune function, memory, and emotional regulation. Your body is telling you something.\n\nI want to offer you something concrete: the 4-7-8 breath. Inhale for 4 counts, hold for 7, exhale for 8. Do it three times right now if you can. It activates your parasympathetic nervous system within seconds. Then let's talk about what's driving the stress — because the breath is a tool, but the root cause needs addressing too.`,
    (ctx: string) => `${ctx}Your stress profile is significant, and I don't want to offer you a list of tips and call it support. Real stress relief requires understanding what's actually driving it.\n\nCan you tell me: is your stress coming more from external demands (workload, relationships, circumstances) or from internal patterns (perfectionism, rumination, catastrophizing)? The answer shapes everything about what will actually help.`,
  ],

  // Emotional balance low
  emotional_low: [
    (ctx: string) => `${ctx}Your emotional balance score is one of the areas I want to speak to directly. Emotional volatility, isolation, or persistent low mood aren't character flaws — they're signals that something in your life or your nervous system needs support.\n\nI want to ask you gently: how long have you been feeling this way? And do you have at least one person in your life you can be fully honest with? Connection is one of the most powerful regulators of emotional health — not because it fixes things, but because it reminds us we don't have to carry everything alone.`,
    (ctx: string) => `${ctx}What your emotional balance score is telling me is that you're working hard to hold things together, and it's taking a toll. That kind of sustained effort — keeping it together on the outside while struggling on the inside — is exhausting.\n\nI want to offer you one small practice that has real evidence behind it: at the end of today, write down three specific things that happened that you're grateful for. Not generic things — specific moments. It sounds simple, but it genuinely rewires how the brain processes the day over time. Would you be willing to try it tonight?`,
  ],

  // Work/Study load low
  work_low: [
    (ctx: string) => `${ctx}Your work and study load score is flagging something important: you may be in a pattern of unsustainable output. And the tricky thing about that pattern is that it often feels like dedication or discipline — until it doesn't.\n\nI want to ask you something: when did you last have a full day where you weren't thinking about work or study? Not a vacation necessarily — just a day where your mind was genuinely elsewhere? That answer often tells us a lot about where the boundary work needs to happen.`,
    (ctx: string) => `${ctx}Your workload balance is showing up as a real concern. I want to be direct: sustainable performance requires recovery. It's not a luxury — it's a biological necessity. The research on this is unambiguous.\n\nHere's a practical starting point: set one hard boundary this week. A specific time after which you will not check work messages or study. Even one hour of genuine off-time, protected consistently, begins to shift the nervous system's baseline. What time could that boundary be for you?`,
  ],

  // Student-specific
  student_context: [
    (ctx: string) => `${ctx}As a student, you're navigating a particularly complex kind of pressure — academic performance, social comparison, uncertainty about the future, and often limited control over your schedule. That combination is genuinely hard.\n\nOne thing that helps many students is separating "what I can control today" from "what I'm anxious about in the future." The future anxiety is real, but it can't be solved today — only today's actions can. What's one thing within your control today that would make tomorrow feel slightly more manageable?`,
  ],

  // Professional-specific
  professional_context: [
    (ctx: string) => `${ctx}As a working professional, you're likely navigating the particular challenge of having your identity and your wellbeing closely tied to your performance. When work is hard, everything feels hard. That's a vulnerable position to be in.\n\nOne of the most protective things professionals can do is develop a clear sense of identity outside of work — hobbies, relationships, or pursuits that have nothing to do with productivity. What's something you used to love doing that work has gradually crowded out?`,
  ],

  // Family history / trauma flags
  family_history: [
    (ctx: string) => `${ctx}Your assessment indicates some family background factors that I want to acknowledge with care. Family history of mental health challenges doesn't determine your path — but it does mean your nervous system may have learned certain patterns early that are worth understanding.\n\nThis is an area where professional support can be genuinely transformative, not because something is "wrong" with you, but because having a skilled guide to help you understand those early patterns can unlock a level of self-understanding that's hard to reach alone. Have you ever worked with a therapist or counselor?`,
  ],

  // Trend-based responses
  improving_trend: [
    (ctx: string) => `${ctx}Your assessment history shows a genuinely positive trend — your wellness scores have been moving in the right direction. I want to make sure you notice that, because progress can be invisible when you're in the middle of it.\n\nWhat do you think has been making the difference? Understanding what's working is just as important as identifying what isn't — it helps you do more of the right things intentionally.`,
  ],
  declining_trend: [
    (ctx: string) => `${ctx}Looking at your assessment history, I can see your scores have been declining over time. I want to name that directly, because sometimes we need someone to reflect back what we're living through.\n\nDeclines like this are usually signals, not failures. Something in your life has been demanding more than you've had to give. What's changed in the past few weeks or months? Understanding the trigger is the first step toward addressing it.`,
  ],

  // General empathetic fallbacks (varied, never repetitive)
  fallback: [
    "I hear you, and I'm fully present with you right now. Whatever you're carrying, you don't have to carry it alone. Let's take one slow breath together — in for four counts, hold for four, out for six. Then tell me what's on your mind. 💙",
    "Thank you for reaching out. There's something meaningful about the act of checking in with yourself — it takes courage, even when it doesn't feel like it. I'm here, and I'm listening. What's been weighing on you? 🌿",
    "I'm so glad you're here. Let's start simply: place one hand on your chest, feel your heartbeat, and take one full breath. You're here, you're present, and that matters. Now — what would you like to talk through? ✨",
    "Whatever brought you here today, I want you to know that reaching out is always the right move. I'm not going anywhere. Tell me what's been going on — I'm listening with my full attention. 💜",
    "You matter, and your wellbeing matters. I want to understand what you're experiencing right now — not to fix it immediately, but to truly hear it first. What's been the hardest part of your days lately? 🌸",
    "I'm here with you. Sometimes the most powerful thing we can do is simply pause and acknowledge what we're feeling, without judgment. What's present for you right now? I'm ready to listen. 💫",
  ],
};

function selectFromPool<T>(pool: T[], seed: string): T {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  return pool[Math.abs(hash) % pool.length];
}

// ─── Local Response Generator ─────────────────────────────────────────────────

function generateLocalResponse(body: ChatRequestBody): string {
  const { message, assessmentData, assessmentHistory, recentMoods } = body;
  const seed = message + (assessmentData?.overall_score ?? '') + new Date().getMinutes();

  // Build context prefix
  let contextPrefix = '';

  if (assessmentData?.overall_score != null) {
    const overall = assessmentData.overall_score;
    const tier = assessmentData.tier;
    const role = assessmentData.user_role;

    // Trend analysis
    let trendNote = '';
    if (assessmentHistory && assessmentHistory.length >= 2) {
      const sorted = [...assessmentHistory].sort(
        (a, b) => new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime()
      );
      const scores = sorted.map((a) => a.overall_score).filter((s): s is number => s != null);
      if (scores.length >= 2) {
        const change = scores[scores.length - 1] - scores[0];
        if (change > 5) trendNote = 'improving';
        else if (change < -5) trendNote = 'declining';
      }
    }

    // Mood context
    let moodNote = '';
    if (recentMoods && recentMoods.length > 0) {
      const recent = recentMoods[0];
      if (recent.mood) moodNote = recent.mood;
    }

    // Build a rich context prefix
    const tierLabel = tier === 1 ? 'Quick Baseline' : tier === 2 ? 'Comprehensive Audit' : tier === 3 ? 'Deep Profile' : '';
    const roleLabel = role === 'student' ? ' (Student)' : role === 'professional' ? ' (Professional)' : '';

    contextPrefix = `*Based on your ${tierLabel ? `Tier ${tier} ${tierLabel}` : 'latest'}${roleLabel} assessment — Overall Wellness: **${overall}/100**`;

    const lowest = getLowestSector(assessmentData);
    const highest = getHighestSector(assessmentData);

    if (lowest) contextPrefix += ` | Needs attention: **${SECTOR_LABELS[lowest.sector]}** (${lowest.score}%)`;
    if (highest && highest.sector !== lowest?.sector) contextPrefix += ` | Strength: **${SECTOR_LABELS[highest.sector]}** (${highest.score}%)*\n\n`;
    else contextPrefix += `*\n\n`;

    // Select response based on data
    const overallClass = classifyScore(overall);

    // Check for specific flags first
    if (assessmentData.family_history_flag || assessmentData.trauma_flag) {
      return selectFromPool(RESPONSE_POOLS.family_history, seed)(contextPrefix);
    }

    // Trend-based
    if (trendNote === 'improving') {
      return selectFromPool(RESPONSE_POOLS.improving_trend, seed)(contextPrefix);
    }
    if (trendNote === 'declining') {
      return selectFromPool(RESPONSE_POOLS.declining_trend, seed)(contextPrefix);
    }

    // Role-specific context for tier 3
    if (tier === 3 && role === 'student' && overallClass !== 'thriving') {
      return selectFromPool(RESPONSE_POOLS.student_context, seed)(contextPrefix);
    }
    if (tier === 3 && role === 'professional' && overallClass !== 'thriving') {
      return selectFromPool(RESPONSE_POOLS.professional_context, seed)(contextPrefix);
    }

    // Sector-specific low scores
    const lowest2 = getLowestSector(assessmentData);
    if (lowest2 && lowest2.score < 45) {
      if (lowest2.sector === 'sleep') return selectFromPool(RESPONSE_POOLS.sleep_low, seed)(contextPrefix);
      if (lowest2.sector === 'stress') return selectFromPool(RESPONSE_POOLS.stress_low, seed)(contextPrefix);
      if (lowest2.sector === 'emotional') return selectFromPool(RESPONSE_POOLS.emotional_low, seed)(contextPrefix);
      if (lowest2.sector === 'work_study') return selectFromPool(RESPONSE_POOLS.work_low, seed)(contextPrefix);
    }

    // Overall wellness level
    if (overallClass === 'thriving') return selectFromPool(RESPONSE_POOLS.thriving, seed)(contextPrefix);
    if (overallClass === 'balanced') return selectFromPool(RESPONSE_POOLS.balanced, seed)(contextPrefix);
    return selectFromPool(RESPONSE_POOLS.struggling, seed)(contextPrefix);
  }

  // No assessment data — warm fallback
  return selectFromPool(RESPONSE_POOLS.fallback, seed);
}

// ─── System Prompt Builder ────────────────────────────────────────────────────

function buildSystemPrompt(body: ChatRequestBody): string {
  const { assessmentData, assessmentHistory, recentMoods, recentHabits } = body;
  let ctx = '';

  if (assessmentData?.overall_score != null) {
    const tier = assessmentData.tier;
    const role = assessmentData.user_role;
    ctx += `\n\nUser's Latest Wellness Assessment (Tier ${tier ?? 'N/A'}${role ? ` — ${role}` : ''}):
- Overall Wellness Score: ${assessmentData.overall_score}/100
- Stress Management: ${assessmentData.stress_score ?? 'N/A'}/100
- Sleep Quality: ${assessmentData.sleep_score ?? 'N/A'}/100
- Work/Study Load: ${assessmentData.work_study_score ?? assessmentData.lifestyle_score ?? 'N/A'}/100
- Emotional Balance: ${assessmentData.emotional_score ?? assessmentData.psychology_score ?? 'N/A'}/100`;

    if (assessmentData.family_history_flag) ctx += '\n- Note: Family mental health history flagged';
    if (assessmentData.trauma_flag) ctx += '\n- Note: Recent significant trauma or loss flagged';
  }

  if (assessmentHistory && assessmentHistory.length >= 2) {
    const sorted = [...assessmentHistory].sort(
      (a, b) => new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime()
    );
    const scores = sorted.map((a) => a.overall_score).filter((s): s is number => s != null);
    if (scores.length >= 2) {
      const change = scores[scores.length - 1] - scores[0];
      const direction = change > 3 ? 'improving' : change < -3 ? 'declining' : 'stable';
      ctx += `\n\nAssessment History: ${scores.length} assessments, trend is ${direction} (${change >= 0 ? '+' : ''}${change.toFixed(0)} pts). Scores: ${scores.join(' → ')}`;
    }
  }

  if (recentMoods && recentMoods.length > 0) {
    const moodSummary = recentMoods
      .slice(0, 5)
      .map((m) => `${m.mood}${m.energy_level != null ? ` (energy: ${m.energy_level}/10)` : ''}`)
      .join(', ');
    ctx += `\n\nRecent Moods: ${moodSummary}`;
  }

  if (recentHabits && recentHabits.length > 0) {
    const completed = recentHabits.filter((h) => h.completed).map((h) => h.habit_type);
    if (completed.length > 0) ctx += `\n\nCompleted Habits: ${completed.join(', ')}`;
  }

  return `You are Mira, a warm, empathetic AI wellness companion for MindCast. Respond with genuine care, warmth, and practical guidance. Keep responses to 2–4 paragraphs. Be specific and personal, never clinical or cold. Reference the user's wellness data naturally when helpful. Vary your tone and approach — never give the same type of response twice. Be deeply contextual and actionable.${ctx}`;
}

// ─── Fetch with Timeout ───────────────────────────────────────────────────────

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

// ─── LLM Providers ───────────────────────────────────────────────────────────

async function tryOpenAI(systemPrompt: string, userMessage: string): Promise<string | null> {
  try {
    const apiKey = process.env.OPENAI_API_KEY ?? '';
    if (!apiKey || apiKey.length < 20 || apiKey.startsWith('your-')) return null;

    const res = await fetchWithTimeout(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          max_tokens: 600,
          temperature: 0.85,
        }),
      },
      12000
    );

    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    return typeof text === 'string' && text.trim().length > 0 ? text.trim() : null;
  } catch {
    return null;
  }
}

async function tryGemini(systemPrompt: string, userMessage: string): Promise<string | null> {
  try {
    const apiKey = process.env.GEMINI_API_KEY ?? '';
    if (!apiKey || apiKey.length < 20 || apiKey.startsWith('your-')) return null;

    const res = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userMessage }] }],
          generationConfig: { maxOutputTokens: 600, temperature: 0.85 },
        }),
      },
      12000
    );

    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return typeof text === 'string' && text.trim().length > 0 ? text.trim() : null;
  } catch {
    return null;
  }
}

async function tryAnthropic(systemPrompt: string, userMessage: string): Promise<string | null> {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY ?? '';
    if (!apiKey || apiKey.length < 20 || apiKey.startsWith('your-')) return null;

    const res = await fetchWithTimeout(
      'https://api.anthropic.com/v1/messages',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 600,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
        }),
      },
      12000
    );

    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.content?.[0]?.text;
    return typeof text === 'string' && text.trim().length > 0 ? text.trim() : null;
  } catch {
    return null;
  }
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    let body: ChatRequestBody;
    try {
      body = (await req.json()) as ChatRequestBody;
    } catch {
      body = { message: '' };
    }

    const message = typeof body?.message === 'string' ? body.message.trim() : '';

    if (!message) {
      return NextResponse.json(
        { reply: "I'm here whenever you're ready to share. Take your time — there's no rush. 💙" },
        { status: 200 }
      );
    }

    const systemPrompt = buildSystemPrompt(body);

    // Try LLM providers first
    let reply: string | null = null;
    reply = await tryOpenAI(systemPrompt, message);
    if (!reply) reply = await tryGemini(systemPrompt, message);
    if (!reply) reply = await tryAnthropic(systemPrompt, message);

    // Fall back to rich local intelligence engine
    if (!reply || reply.trim().length === 0) {
      reply = generateLocalResponse(body);
    }

    return NextResponse.json({ reply }, { status: 200 });
  } catch {
    return NextResponse.json(
      { reply: "I hear you, and I'm here for you. Let's focus on taking a slow, deep breath together — inhale for four counts, hold for four, exhale for four. You're not alone in this moment. 💙" },
      { status: 200 }
    );
  }
}
