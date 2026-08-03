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

// ─── Wellness Fallback Engine ─────────────────────────────────────────────────

function buildSystemPrompt(body: ChatRequestBody): string {
  const { assessmentData, recentMoods, recentHabits } = body;

  let contextBlock = '';

  if (assessmentData?.overall_score != null) {
    const score = assessmentData.overall_score;
    const stressScore = assessmentData.stress_score ?? 'N/A';
    const sleepScore = assessmentData.sleep_score ?? 'N/A';
    const psychScore = assessmentData.psychology_score ?? 'N/A';
    const lifeScore = assessmentData.lifestyle_score ?? 'N/A';

    contextBlock += `\n\nUser's Latest Wellness Assessment:
- Overall Wellness Score: ${score}/100
- Stress Management: ${stressScore}/100
- Sleep Quality: ${sleepScore}/100
- Psychological Wellbeing: ${psychScore}/100
- Lifestyle Balance: ${lifeScore}/100`;
  }

  if (recentMoods && recentMoods.length > 0) {
    const moodSummary = recentMoods
      .slice(0, 5)
      .map((m) => `${m.mood}${m.energy_level != null ? ` (energy: ${m.energy_level}/10)` : ''}`)
      .join(', ');
    contextBlock += `\n\nRecent Mood Logs (last ${Math.min(recentMoods.length, 5)} entries): ${moodSummary}`;
  }

  if (recentHabits && recentHabits.length > 0) {
    const completedHabits = recentHabits.filter((h) => h.completed).map((h) => h.habit_type);
    if (completedHabits.length > 0) {
      contextBlock += `\n\nRecently Completed Habits: ${completedHabits.join(', ')}`;
    }
  }

  return `You are Mira, a warm, empathetic, and insightful AI wellness companion for the MindCast app. Your role is to support the user's mental and emotional wellbeing with compassion, evidence-based guidance, and genuine care.

Guidelines:
- Always respond with warmth, empathy, and encouragement
- Keep responses concise (2–4 paragraphs) and conversational
- Offer practical, actionable wellness tips when relevant
- Reference the user's wellness data naturally when it adds value
- Never be clinical or cold — be like a caring, knowledgeable friend
- If the user seems distressed, prioritize emotional validation before advice
- Avoid generic platitudes; be specific and personal${contextBlock}`;
}

function getWellnessFallbackResponse(message: string, body: ChatRequestBody): string {
  const { assessmentData, recentMoods } = body;
  const lowerMsg = message.toLowerCase();

  // Determine overall wellness context
  const score = assessmentData?.overall_score;
  const latestMood = recentMoods?.[0]?.mood?.toLowerCase() ?? '';

  // Detect topic from user message
  const isSleep = /sleep|tired|insomnia|rest|exhausted|fatigue/.test(lowerMsg);
  const isStress = /stress|overwhelm|anxious|anxiety|panic|burnout|pressure/.test(lowerMsg);
  const isMood = /mood|sad|happy|depress|emotion|feeling|feel/.test(lowerMsg);
  const isHabit = /habit|routine|exercise|meditat|journal|water|caffeine/.test(lowerMsg);
  const isMotivation = /motivat|goal|progress|improve|better|growth/.test(lowerMsg);
  const isRelationship = /lonely|isolated|friend|family|connect|support/.test(lowerMsg);

  // Score-based greeting context
  let scoreContext = '';
  if (score != null) {
    if (score >= 75) {
      scoreContext = `Your wellness score of ${score} shows you're doing really well overall — that's something to be genuinely proud of. `;
    } else if (score >= 50) {
      scoreContext = `Your wellness score of ${score} tells me you're making meaningful progress, even if some days feel harder than others. `;
    } else if (score != null) {
      scoreContext = `I can see from your wellness score of ${score} that you've been going through a challenging time, and I want you to know that's completely okay. `;
    }
  }

  // Mood context
  let moodContext = '';
  if (latestMood) {
    const positiveMoods = ['happy', 'great', 'good', 'calm', 'energized', 'excited', 'content'];
    const negativeMoods = ['sad', 'anxious', 'stressed', 'tired', 'overwhelmed', 'depressed', 'angry'];
    if (negativeMoods.some((m) => latestMood.includes(m))) {
      moodContext = `I noticed your recent mood logs reflect some difficult feelings — I'm here with you. `;
    } else if (positiveMoods.some((m) => latestMood.includes(m))) {
      moodContext = `Your recent mood logs show some positive energy, which is wonderful to see. `;
    }
  }

  // Topic-specific responses
  if (isSleep) {
    const sleepScore = assessmentData?.sleep_score;
    const sleepNote = sleepScore != null && sleepScore < 50
      ? `Your sleep score of ${sleepScore} suggests this has been an ongoing challenge for you. `
      : '';
    return `${scoreContext}${moodContext}${sleepNote}Sleep is truly the foundation of everything — your mood, focus, stress resilience, and even how you process emotions all depend on it deeply.

Here are a few gentle things that can make a real difference: try to keep a consistent sleep and wake time (even on weekends), create a wind-down ritual 30–45 minutes before bed — dim the lights, put your phone away, and do something calming like light stretching or reading. Avoid screens and caffeine after 7 PM if you can.

If racing thoughts are keeping you awake, try the 4-7-8 breathing technique: inhale for 4 counts, hold for 7, exhale slowly for 8. It activates your parasympathetic nervous system and signals to your body that it's safe to rest. You deserve deep, restorative sleep — let's work toward that together. 💙`;
  }

  if (isStress) {
    const stressScore = assessmentData?.stress_score;
    const stressNote = stressScore != null && stressScore < 50
      ? `Your stress management score of ${stressScore} tells me you've been carrying a heavy load lately. ` :'';
    return `${scoreContext}${moodContext}${stressNote}First, I want you to take a breath — you're doing better than you think, even when it doesn't feel that way. Stress is your body's signal that something needs attention, and the fact that you're here, reaching out, is already a powerful step.

When stress feels overwhelming, try grounding yourself with the 5-4-3-2-1 technique: name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste. It pulls your nervous system back into the present moment.

Beyond that, even 10 minutes of movement, a short walk outside, or 5 minutes of box breathing can meaningfully lower cortisol levels. And remember — you don't have to solve everything today. What's one small thing you can let go of right now? 🌿`;
  }

  if (isMood) {
    return `${scoreContext}${moodContext}Your feelings are completely valid, whatever they are. Emotions aren't problems to fix — they're information, and honoring them is an act of self-compassion.

If you're feeling low, know that moods are temporary states, not permanent truths about you or your life. Sometimes the most powerful thing you can do is simply acknowledge: "I'm feeling this way right now, and that's okay."

Journaling for even 5 minutes can help you process what's underneath the surface. Try writing without judgment — just let the words flow. And if you want to talk through what you're experiencing, I'm right here. What's been weighing on you most today? 💜`;
  }

  if (isHabit) {
    const lifeScore = assessmentData?.lifestyle_score;
    const habitNote = lifeScore != null
      ? `Your lifestyle score of ${lifeScore} gives us a good starting point. `
      : '';
    return `${scoreContext}${habitNote}Building sustainable habits is one of the most loving things you can do for yourself — and the key word is *sustainable*. Small, consistent actions compound into profound change over time.

Rather than overhauling everything at once, try habit stacking: attach a new habit to something you already do. For example, meditate for 2 minutes right after your morning coffee, or do 5 deep breaths before you open your phone each morning.

Tracking your habits here in MindCast helps you see your progress visually, which is incredibly motivating. What's one habit you'd most like to strengthen this week? I'd love to help you build a simple plan around it. ✨`;
  }

  if (isMotivation) {
    return `${scoreContext}${moodContext}Growth isn't always linear — and that's not a flaw, that's just how it works. Every step forward, no matter how small, is real progress worth celebrating.

Looking at your wellness data, I can see patterns that show genuine effort and care for yourself. That matters enormously. On the days when motivation feels low, remember: you don't need to feel motivated to take action. Action itself creates momentum.

Try breaking your goals into the smallest possible next step. Not "exercise more" — but "put on my shoes and walk to the end of the street." What's one tiny win you could celebrate today? 🌟`;
  }

  if (isRelationship) {
    const psychScore = assessmentData?.psychology_score;
    const psychNote = psychScore != null && psychScore < 50
      ? `Your psychological wellbeing score suggests connection has been a challenge lately. `
      : '';
    return `${scoreContext}${psychNote}Feeling disconnected is one of the most quietly painful experiences — and one of the most common. You're not alone in feeling alone, even if that sounds paradoxical.

Human connection is a fundamental need, not a luxury. Even small moments of genuine connection — a text to someone you care about, a kind word to a stranger, or sharing something real in a conversation — can meaningfully shift how you feel.

Is there one person in your life you've been meaning to reach out to? Sometimes the first message is the hardest part, and everything flows from there. I'm also here whenever you need to feel heard. 💛`;
  }

  // Default warm, context-aware response
  const defaultResponses = [
    `${scoreContext}${moodContext}I'm really glad you reached out. Whatever you're navigating right now, you don't have to face it alone — that's exactly what I'm here for.

Your wellness journey is deeply personal, and every day you show up for yourself matters. Whether it's a small habit, a moment of reflection, or simply checking in like this, it all adds up to something meaningful.

What's on your mind today? I'm here to listen, reflect, and support you in whatever way feels most helpful. 💙`,

    `${scoreContext}${moodContext}Thank you for sharing that with me. I want you to know that I'm fully present with you in this moment.

Taking care of your mental and emotional wellbeing is one of the most important things you can do — not just for yourself, but for everyone around you. You deserve that care and attention.

Tell me more about what you're experiencing, and let's explore it together. There's no judgment here, only support. 🌿`,

    `${scoreContext}${moodContext}I hear you, and I'm here. Sometimes just putting words to what we're feeling is the first step toward feeling better. Your wellbeing matters deeply, and the fact that you're engaging with your mental health — tracking moods, building habits, reflecting — shows real self-awareness and courage.What would feel most supportive right now? We could explore a breathing exercise, talk through what's on your mind, or I can share some insights from your recent wellness patterns. I'm here for whatever you need. ✨`,
  ];

  // Pick a response based on message hash for variety
  const idx = message.length % defaultResponses.length;
  return defaultResponses[idx];
}

// ─── LLM Attempt (OpenAI) ─────────────────────────────────────────────────────

async function tryOpenAI(systemPrompt: string, userMessage: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.includes('your-') || apiKey.includes('placeholder') || apiKey.length < 20) {
    return null;
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 500,
        temperature: 0.8,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

// ─── LLM Attempt (Gemini) ─────────────────────────────────────────────────────

async function tryGemini(systemPrompt: string, userMessage: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('your-') || apiKey.includes('placeholder') || apiKey.length < 20) {
    return null;
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userMessage }] }],
          generationConfig: { maxOutputTokens: 500, temperature: 0.8 },
        }),
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  } catch {
    return null;
  }
}

// ─── LLM Attempt (Anthropic) ─────────────────────────────────────────────────

async function tryAnthropic(systemPrompt: string, userMessage: string): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.includes('your-') || apiKey.includes('placeholder') || apiKey.length < 20) {
    return null;
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
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
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data?.content?.[0]?.text ?? null;
  } catch {
    return null;
  }
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    let body: ChatRequestBody;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { message } = body;
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const systemPrompt = buildSystemPrompt(body);
    const userMessage = message.trim();

    // Try LLM providers in order — fall back gracefully
    let responseText: string | null = null;

    try {
      responseText = await tryOpenAI(systemPrompt, userMessage);
    } catch { /* continue */ }

    if (!responseText) {
      try {
        responseText = await tryGemini(systemPrompt, userMessage);
      } catch { /* continue */ }
    }

    if (!responseText) {
      try {
        responseText = await tryAnthropic(systemPrompt, userMessage);
      } catch { /* continue */ }
    }

    // Always fall back to wellness-aware local response
    if (!responseText) {
      responseText = getWellnessFallbackResponse(userMessage, body);
    }

    // Return as SSE stream to match the existing streamMessage client
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        try {
          // Stream the response in chunks for a natural feel
          const words = responseText!.split(' ');
          const chunkSize = 4;

          for (let i = 0; i < words.length; i += chunkSize) {
            const chunk = words.slice(i, i + chunkSize).join(' ') + (i + chunkSize < words.length ? ' ' : '');
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
        } catch {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch {
    // Absolute last-resort — never crash
    const encoder = new TextEncoder();
    const fallback = "I'm here with you. It seems like something went wrong on my end, but I don't want to leave you without support. Take a gentle breath — you're doing okay. Please try sending your message again, and I'll be right here. 💙";
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: fallback })}\n\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  }
}
