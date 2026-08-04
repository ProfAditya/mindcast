import { NextRequest, NextResponse } from 'next/server';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatRequestBody {
  message: string;
  assessmentData?: {
    overall_score?: number;
    stress_score?: number;
    sleep_score?: number;
    psychology_score?: number;
    lifestyle_score?: number;
  } | null;
  assessmentHistory?: Array<{
    overall_score?: number;
    stress_score?: number;
    sleep_score?: number;
    psychology_score?: number;
    lifestyle_score?: number;
    created_at?: string;
  }>;
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

// ─── Warm Fallback Responses ──────────────────────────────────────────────────

const WARM_FALLBACKS = [
  "I hear you, and I'm here for you. Let's focus on taking a slow, deep breath together — inhale for four counts, hold for four, exhale for four. You're not alone in this moment. 💙",
  "Thank you for reaching out. Whatever you're carrying right now, you don't have to carry it alone. I'm right here with you, and together we can take this one gentle step at a time. 🌿",
  "I'm so glad you're here. Let's pause for just a moment — place one hand on your heart, take a slow breath, and know that you are enough, exactly as you are right now. ✨",
  "Your feelings are completely valid, and I want you to know I'm fully present with you. Let's take this one breath at a time — you're doing better than you think. 💜",
];

function getWarmFallback(message: string): string {
  const idx = (message.length + message.charCodeAt(0)) % WARM_FALLBACKS.length;
  return WARM_FALLBACKS[idx];
}

// ─── System Prompt Builder ────────────────────────────────────────────────────

function buildSystemPrompt(body: ChatRequestBody): string {
  const { assessmentData, assessmentHistory, recentMoods, recentHabits } = body;
  let ctx = '';

  if (assessmentData?.overall_score != null) {
    ctx += `\n\nUser's Latest Wellness Assessment:
- Overall Wellness Score: ${assessmentData.overall_score}/100
- Stress Management: ${assessmentData.stress_score ?? 'N/A'}/100
- Sleep Quality: ${assessmentData.sleep_score ?? 'N/A'}/100
- Psychological Wellbeing: ${assessmentData.psychology_score ?? 'N/A'}/100
- Lifestyle Balance: ${assessmentData.lifestyle_score ?? 'N/A'}/100`;
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

  return `You are Mira, a warm, empathetic AI wellness companion for MindCast. Respond with genuine care, warmth, and practical guidance. Keep responses to 2–4 paragraphs. Be specific and personal, never clinical or cold. Reference the user's wellness data naturally when helpful.${ctx}`;
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
          max_tokens: 500,
          temperature: 0.8,
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
          generationConfig: { maxOutputTokens: 500, temperature: 0.8 },
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
          max_tokens: 500,
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
  // Outermost safety net — this must NEVER throw
  try {
    // Parse body safely
    let body: ChatRequestBody;
    try {
      body = (await req.json()) as ChatRequestBody;
    } catch {
      body = { message: '' };
    }

    const message = typeof body?.message === 'string' ? body.message.trim() : '';

    // Always produce a response — even for empty messages
    if (!message) {
      return NextResponse.json(
        { reply: "I'm here whenever you're ready to share. Take your time — there's no rush. 💙" },
        { status: 200 }
      );
    }

    const systemPrompt = buildSystemPrompt(body);

    // Try each LLM provider — all failures are silently caught
    let reply: string | null = null;

    reply = await tryOpenAI(systemPrompt, message);
    if (!reply) reply = await tryGemini(systemPrompt, message);
    if (!reply) reply = await tryAnthropic(systemPrompt, message);

    // Always fall back to a warm local response
    if (!reply || reply.trim().length === 0) {
      reply = getWarmFallback(message);
    }

    return NextResponse.json({ reply }, { status: 200 });
  } catch {
    // Absolute last resort — return warm fallback, never a 500
    return NextResponse.json(
      { reply: "I hear you, and I'm here for you. Let's focus on taking a slow, deep breath together — inhale for four counts, hold for four, exhale for four. You're not alone in this moment. 💙" },
      { status: 200 }
    );
  }
}
