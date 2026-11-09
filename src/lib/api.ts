/**
 * MindCast API client.
 *
 * Talks to the NEURIX backend (Supabase Edge Function `neurix-api`) and uses Supabase
 * Auth for sign-up / login. The exported functions and types keep the shapes the
 * pages already use; this file translates them to the NEURIX endpoints.
 *
 * Security notes:
 *  - Only the public Supabase URL and publishable (anon) key are used here. The
 *    service-role key and AI provider keys never reach the browser.
 *  - The user id is never sent by the client: the backend takes it from the verified
 *    Supabase access token.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const NEURIX_URL =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_BACKEND_URL) ||
  'https://hhdlsbbeabdbqrlqxtiu.supabase.co/functions/v1/neurix-api';
const BASE_URL = `${NEURIX_URL.replace(/\/+$/, '')}/api/v1`;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hhdlsbbeabdbqrlqxtiu.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const AUTH_STORAGE_KEY = 'mindcast-auth';
const USER_KEY = 'mindcast_user';
const CONVERSATION_KEY = 'mindcast_conversation';

// ─── Supabase client (browser only) ──────────────────────────────────────────

let client: SupabaseClient | null = null;

function supabase(): SupabaseClient {
  if (typeof window === 'undefined') throw new Error('Supabase is only available in the browser.');
  if (!SUPABASE_ANON_KEY) throw new Error('App is not configured: NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.');
  client ??= createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: AUTH_STORAGE_KEY },
  });
  return client;
}

/** Current access token (refreshed by supabase-js when needed). */
async function getAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const { data } = await supabase().auth.getSession();
  return data.session?.access_token ?? null;
}

// ─── Token / user storage ────────────────────────────────────────────────────

/** Kept for compatibility; returns the stored access token synchronously if present. */
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? (JSON.parse(raw).access_token ?? null) : null;
  } catch {
    return null;
  }
}

/** No-op: sessions are managed by Supabase Auth. */
function setToken(_token: string): void {}

function clearToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(CONVERSATION_KEY);
}

function setUser(user: AuthUser): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(AUTH_STORAGE_KEY) && !!localStorage.getItem(USER_KEY);
}

// ─── HTTP helper ─────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function errorText(body: unknown, status: number): string {
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const msgs = detail.map((d) => (d && typeof d === 'object' && 'msg' in d ? String((d as { msg: unknown }).msg) : '')).filter(Boolean);
    if (msgs.length) return msgs.join('; ');
  }
  if (status === 401) return 'Your session has expired. Please log in again.';
  return `API error ${status}`;
}

async function request<T>(path: string, options: RequestInit = {}, authenticated = true): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (authenticated) {
    const token = await getAccessToken();
    if (!token) throw new ApiError(401, 'Please log in to continue.');
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch { /* ignore */ }
    throw new ApiError(res.status, errorText(body, res.status));
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

const notAvailable = (feature: string) => new ApiError(501, `${feature} isn't available yet in this version of MindCast.`);

// ─── Types (unchanged public shapes) ─────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  is_admin?: boolean;
  created_at?: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface MoodEntry {
  id: string;
  user_id?: string;
  mood: string;
  energy_level: number;
  stress_level: number;
  notes?: string;
  created_at: string;
}

export interface MoodEntryCreate {
  mood: string;
  energy_level: number;
  stress_level: number;
  notes?: string;
}

/** The 8 fixed habit types — no user-created habits exist */
export type HabitType =
  | 'sleep' |'water' |'exercise' |'meditation' |'reading' |'screen_time' |'outdoor' |'caffeine';

export interface HabitLog {
  id?: string;
  habit_type: HabitType;
  value: number;
  unit: string;
  completed: boolean;
  created_at?: string;
}

export interface HabitLogCreate {
  habit_type: HabitType;
  value: number;
  unit: string;
  completed: boolean;
}

export interface JournalEntry {
  id: string;
  user_id?: string;
  prompt?: string;
  entry: string;
  created_at: string;
}

export interface JournalEntryCreate {
  prompt?: string;
  entry: string;
}

export interface DashboardStats {
  wellness_score: number;
  habits_logged_today: number;
  journal_entries_count: number;
  has_assessment: boolean;
  mood_check_ins_30d: number;
  avg_energy_30d: number;
  avg_stress_30d: number;
  assessment_trend: string;
}

export interface WellnessDNA {
  ready: boolean;
  dominant_mood?: string;
  happiest_time?: string;
  data_days?: number;
  top_habits?: string[];
  recommendations?: string[];
  message?: string;
  days_needed?: number;
}

export interface Conversation {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface UserContext {
  assessment_strengths?: string[];
  improvement_areas?: string[];
  mood_averages?: {
    avg_energy?: number;
    avg_stress?: number;
    dominant_mood?: string;
  };
}

export interface Experiment {
  id: string;
  title: string;
  description?: string;
  status?: string;
  started_at?: string;
  completed_at?: string;
}

export interface Reminder {
  id: string;
  title: string;
  time?: string;
  enabled?: boolean;
}

export interface ContentLog {
  id?: string;
  content_type: string;
  title: string;
  completed?: boolean;
  created_at?: string;
}

export interface WellnessToolkit {
  id: string;
  title: string;
  category: string;
  description?: string;
  duration?: string;
}

// ─── NEURIX shapes and mapping ───────────────────────────────────────────────

interface Page<T> { items: T[]; limit: number; offset: number }
interface NxMood {
  id: string; mood_label: string | null; mood_score: number | null; energy_score: number | null;
  stress_score: number | null; note: string | null; recorded_at: string;
}
interface NxHabit { id: string; habit_name: HabitType; value: string | number | null; unit: string | null; completed: boolean; logged_at: string }
interface NxJournal { id: number; title: string | null; prompt: string | null; entry_text: string; created_at: string }
interface NxMe { id: string; email: string | null; full_name: string | null; role: string; created_at: string }
interface NxOverview {
  period: { start: string; end_exclusive: string; days: number };
  active_days: number;
  mood: { entries: number; avg_mood_score: number | null; avg_energy_score: number | null; avg_stress_score: number | null; labels: Record<string, number> };
  habits: { habit_name: string; entries: number; completed: number; completion_rate: number }[];
  journal: { entries: number };
  latest_assessments: { instrument: string; severity: string | null }[];
}

// The UI calls the lowest mood "rough"; the backend calls it "struggling".
const toLabel = (m: string) => (m === 'rough' ? 'struggling' : m);
const fromLabel = (m: string | null) => (m === 'struggling' ? 'rough' : m ?? 'okay');
const LABEL_SCORE: Record<string, number> = { great: 9, good: 7, okay: 5, low: 3, struggling: 1 };

const mapMood = (m: NxMood): MoodEntry => ({
  id: m.id, mood: fromLabel(m.mood_label), energy_level: m.energy_score ?? 0, stress_level: m.stress_score ?? 0,
  notes: m.note ?? undefined, created_at: m.recorded_at,
});
const mapHabit = (h: NxHabit): HabitLog => ({
  id: h.id, habit_type: h.habit_name, value: Number(h.value ?? 0), unit: h.unit ?? '', completed: h.completed, created_at: h.logged_at,
});
const mapJournal = (j: NxJournal): JournalEntry => ({
  id: String(j.id), prompt: j.prompt ?? undefined, entry: j.entry_text, created_at: j.created_at,
});
const localDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const round1 = (x: number | null) => (x == null ? null : Math.round(x * 10) / 10);

async function recentMoods(limit = 200): Promise<MoodEntry[]> {
  const page = await request<Page<NxMood>>(`/mood-entries?limit=${Math.min(limit, 200)}`);
  return page.items.map(mapMood);
}
async function todaysHabits(): Promise<HabitLog[]> {
  // "Today" in the user's own time zone, sent as the UTC dates it spans.
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const since = start.toISOString().slice(0, 10);
  const page = await request<Page<NxHabit>>(`/habit-entries?since=${since}&limit=200`);
  return page.items.map(mapHabit).filter((h) => h.created_at && new Date(h.created_at) >= start);
}
const overview = (days = 30) => request<NxOverview>(`/analytics/overview?days=${days}`);

function dominantMood(moods: MoodEntry[]): string | undefined {
  const counts: Record<string, number> = {};
  for (const m of moods) counts[m.mood] = (counts[m.mood] ?? 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
}

function moodTrend(moods: MoodEntry[]): 'improving' | 'declining' | 'stable' {
  const score = (m: MoodEntry) => LABEL_SCORE[toLabel(m.mood)] ?? 5;
  const now = Date.now(), day = 86_400_000;
  const recent = moods.filter((m) => now - Date.parse(m.created_at) < 15 * day).map(score);
  const before = moods.filter((m) => { const a = now - Date.parse(m.created_at); return a >= 15 * day && a < 30 * day; }).map(score);
  const r = avg(recent), b = avg(before);
  if (r == null || b == null) return 'stable';
  return r - b > 0.5 ? 'improving' : b - r > 0.5 ? 'declining' : 'stable';
}

async function computeStats(): Promise<DashboardStats & { _moods: MoodEntry[]; _overview: NxOverview }> {
  const [ov, moods, habits] = await Promise.all([overview(30), recentMoods(), todaysHabits()]);
  const wellness = ov.mood.avg_mood_score;
  return {
    wellness_score: wellness == null ? (undefined as unknown as number) : Math.round(wellness * 10),
    habits_logged_today: habits.length,
    journal_entries_count: ov.journal.entries,
    has_assessment: ov.latest_assessments.length > 0,
    mood_check_ins_30d: ov.mood.entries,
    avg_energy_30d: (ov.mood.avg_energy_score ?? undefined) as number,
    avg_stress_30d: (ov.mood.avg_stress_score ?? undefined) as number,
    assessment_trend: moodTrend(moods),
    _moods: moods,
    _overview: ov,
  };
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

async function loadProfile(fallbackEmail: string): Promise<AuthUser> {
  const me = await request<NxMe>('/me');
  const user: AuthUser = {
    id: me.id, email: me.email ?? fallbackEmail, name: me.full_name || fallbackEmail.split('@')[0],
    is_admin: me.role === 'admin', created_at: me.created_at,
  };
  setUser(user);
  return user;
}

export const authApi = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const { data, error } = await supabase().auth.signInWithPassword({ email, password });
    if (error || !data.session) throw new Error(error?.message || 'Login failed.');
    const user = await loadProfile(email);
    return { token: data.session.access_token, user };
  },

  async signup(name: string, email: string, password: string): Promise<AuthResponse> {
    const { data, error } = await supabase().auth.signUp({
      email, password, options: { data: { full_name: name } },
    });
    if (error) throw new Error(error.message);
    if (!data.session) throw new Error('Account created. Please check your email to confirm it, then log in.');
    const user = await loadProfile(email);
    return { token: data.session.access_token, user };
  },

  logout(): void {
    if (typeof window !== 'undefined' && SUPABASE_ANON_KEY) {
      supabase().auth.signOut().catch(() => {});
    }
    clearToken();
  },

  async getMe(): Promise<AuthUser> {
    const stored = getStoredUser();
    return loadProfile(stored?.email ?? '');
  },
};

// ─── Dashboard API ────────────────────────────────────────────────────────────

export const dashboardApi = {
  async getStats(): Promise<DashboardStats> {
    const { _moods, _overview, ...stats } = await computeStats();
    return stats;
  },
};

// ─── Mood API ─────────────────────────────────────────────────────────────────

export const moodApi = {
  async list(limit = 30): Promise<MoodEntry[]> {
    return recentMoods(limit);
  },

  async create(entry: MoodEntryCreate): Promise<MoodEntry> {
    const label = toLabel(entry.mood);
    const row = await request<NxMood>('/mood-entries', {
      method: 'POST',
      body: JSON.stringify({
        mood_label: label,
        mood_score: LABEL_SCORE[label] ?? null,
        energy_score: Math.max(0, Math.min(10, Math.round(entry.energy_level))),
        stress_score: Math.max(0, Math.min(10, Math.round(entry.stress_level))),
        note: entry.notes?.trim() ? entry.notes.trim() : null,
      }),
    });
    return mapMood(row);
  },
};

// ─── Habit Logs API ───────────────────────────────────────────────────────────

export const habitLogsApi = {
  /** Today's habit logs, oldest first (the page keeps the latest per habit). */
  async list(): Promise<HabitLog[]> {
    return (await todaysHabits()).reverse();
  },

  async create(log: HabitLogCreate): Promise<HabitLog> {
    const row = await request<NxHabit>('/habit-entries', {
      method: 'POST',
      body: JSON.stringify({ habit_name: log.habit_type, value: log.value, unit: log.unit, completed: log.completed }),
    });
    return mapHabit(row);
  },
};

// ─── Journal API ──────────────────────────────────────────────────────────────

export const journalApi = {
  async list(limit = 20): Promise<JournalEntry[]> {
    const page = await request<Page<NxJournal>>(`/journal-entries?limit=${Math.min(limit, 200)}`);
    return page.items.map(mapJournal);
  },

  async create(entry: JournalEntryCreate): Promise<JournalEntry> {
    const row = await request<NxJournal>('/journal-entries', {
      method: 'POST',
      body: JSON.stringify({ prompt: entry.prompt?.trim() || null, entry_text: entry.entry }),
    });
    return mapJournal(row);
  },
};

// ─── Chat API ─────────────────────────────────────────────────────────────────

interface NxConversation { id: string; title: string | null; created_at: string }
interface NxMessage { id: string; sender: string; content: string; created_at: string }

async function currentConversationId(create: boolean): Promise<string | null> {
  const saved = typeof window !== 'undefined' ? localStorage.getItem(CONVERSATION_KEY) : null;
  if (saved) return saved;
  const list = await request<NxConversation[]>('/ai/conversations?limit=1');
  let id = list[0]?.id ?? null;
  if (!id && create) {
    id = (await request<NxConversation>('/ai/conversations', { method: 'POST', body: JSON.stringify({ title: 'Mira' }) })).id;
  }
  if (id && typeof window !== 'undefined') localStorage.setItem(CONVERSATION_KEY, id);
  return id;
}

/** Ask once for AI consent, using the exact text the backend records. */
async function askForAiConsent(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const status = await request<{ texts: Record<string, string>; scopes: Record<string, boolean> }>('/ai/consent');
  if (status.scopes.general) return true;
  if (!window.confirm(`${status.texts.general}\n\nDo you agree?`)) return false;
  await request('/ai/consent/general', { method: 'PUT', body: JSON.stringify({ granted: true }) });
  return true;
}

export const chatApi = {
  async getConversations(limit = 20): Promise<Conversation[]> {
    const id = await currentConversationId(false);
    if (!id) return [];
    try {
      const conv = await request<{ messages: NxMessage[] }>(`/ai/conversations/${id}`);
      return conv.messages.slice(-limit).map((m) => ({
        id: m.id, role: m.sender === 'user' ? 'user' : 'assistant', content: m.content, created_at: m.created_at,
      }));
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        localStorage.removeItem(CONVERSATION_KEY);
        return [];
      }
      throw e;
    }
  },

  /** Sends a message and delivers the whole reply as one chunk (the backend does not stream). */
  async streamMessage(message: string, onChunk: (text: string) => void, onDone: () => void): Promise<void> {
    const send = async () => {
      const id = await currentConversationId(true);
      return request<{ assistant_message: { content: string } }>(`/ai/conversations/${id}/messages`, {
        method: 'POST', body: JSON.stringify({ content: message }),
      });
    };
    let reply;
    try {
      reply = await send();
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        localStorage.removeItem(CONVERSATION_KEY);
        reply = await send();
      } else if (e instanceof ApiError && e.status === 403 && /consent/i.test(e.message)) {
        if (!(await askForAiConsent())) throw new Error('Mira needs your consent before your data can be used for AI replies.');
        reply = await send();
      } else {
        throw e;
      }
    }
    onChunk(reply.assistant_message.content);
    onDone();
  },
};

// ─── Insights API ─────────────────────────────────────────────────────────────

export const insightsApi = {
  async getPatterns(): Promise<Record<string, unknown>> {
    return (await overview(30)) as unknown as Record<string, unknown>;
  },
};

// ─── Wellness DNA API (computed from the user's own logs) ─────────────────────

const DAYS_NEEDED = 7;
const HABIT_LABEL: Record<string, string> = {
  sleep: 'Sleep', water: 'Water', exercise: 'Exercise', meditation: 'Meditation', reading: 'Reading',
  screen_time: 'Screen time', outdoor: 'Time outdoors', caffeine: 'Caffeine',
};

export const wellnessDnaApi = {
  async get(): Promise<WellnessDNA> {
    const [moods, ov] = await Promise.all([recentMoods(), overview(30)]);
    const days = new Set(moods.map((m) => localDate(m.created_at))).size;
    if (days < DAYS_NEEDED) {
      return { ready: false, data_days: days, days_needed: DAYS_NEEDED - days };
    }
    const bucket = (iso: string) => {
      const h = new Date(iso).getHours();
      return h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'night';
    };
    const byTime: Record<string, number[]> = {};
    for (const m of moods) (byTime[bucket(m.created_at)] ??= []).push(LABEL_SCORE[toLabel(m.mood)] ?? 5);
    const happiest = Object.entries(byTime).sort((a, b) => (avg(b[1]) ?? 0) - (avg(a[1]) ?? 0))[0]?.[0];
    const topHabits = [...ov.habits].sort((a, b) => b.completed - a.completed).filter((h) => h.completed > 0)
      .slice(0, 3).map((h) => HABIT_LABEL[h.habit_name] ?? h.habit_name);
    const recs: string[] = [];
    if ((ov.mood.avg_stress_score ?? 0) >= 6) recs.push('Your stress has been on the high side. A short daily pause, like a walk or a few slow breaths, may help.');
    if ((ov.mood.avg_energy_score ?? 10) <= 4) recs.push('Your energy has been low. A regular sleep schedule and some daylight early in the day are worth trying.');
    if (!ov.habits.some((h) => h.habit_name === 'outdoor' && h.completed > 0)) recs.push('Try adding a little time outdoors to your week.');
    if (happiest) recs.push(`You tend to feel best in the ${happiest}. Consider planning things you enjoy for that time.`);
    return {
      ready: true, data_days: days, dominant_mood: dominantMood(moods), happiest_time: happiest, top_habits: topHabits,
      recommendations: recs.slice(0, 3),
      message: 'Based only on what you have logged in the last 30 days. General wellbeing ideas, not medical advice.',
    };
  },
};

// ─── Ask My Data API ──────────────────────────────────────────────────────────

export const askMyDataApi = {
  async ask(question: string): Promise<{ answer: string }> {
    const ask = () => request<{ answer: string }>('/ai/ask', { method: 'POST', body: JSON.stringify({ question }) });
    try {
      return await ask();
    } catch (e) {
      if (e instanceof ApiError && e.status === 403 && /consent/i.test(e.message) && (await askForAiConsent())) return ask();
      throw e;
    }
  },
};

// ─── Assessments API ──────────────────────────────────────────────────────────
// The backend scores the PHQ-9, GAD-7 and WHO-5 questionnaires. Question ids are
// "<instrument>_<n>" (e.g. "phq9_1"); answers are submitted per instrument.

export const assessmentsApi = {
  async getQuestions(): Promise<Array<{ id: string; question: string; type: string }>> {
    const list = await request<Array<{ code: string; items: { id: string; text: string }[] }>>('/assessments/instruments');
    return list.flatMap((i) => i.items.map((q) => ({ id: q.id, question: q.text, type: i.code })));
  },

  async submit(answers: Array<{ question_id: string; value: number }>): Promise<Record<string, unknown>> {
    const byInstrument: Record<string, Record<string, number>> = {};
    for (const a of answers) {
      const code = a.question_id.split('_')[0];
      (byInstrument[code] ??= {})[a.question_id] = a.value;
    }
    const results: Record<string, unknown> = {};
    for (const [instrument, ans] of Object.entries(byInstrument)) {
      results[instrument] = await request('/assessments', { method: 'POST', body: JSON.stringify({ instrument, answers: ans }) });
    }
    return results;
  },
};

// ─── Wellness Toolkit API ─────────────────────────────────────────────────────

export const wellnessToolkitApi = {
  async list(): Promise<WellnessToolkit[]> {
    throw notAvailable('The wellness toolkit');
  },

  async log(_item: { toolkit_id: string }): Promise<void> {
    throw notAvailable('The wellness toolkit');
  },
};

// ─── Reminders API ────────────────────────────────────────────────────────────

interface NxReminder { id: string; title: string; scheduled_at: string | null; is_enabled: boolean }

export const remindersApi = {
  async list(): Promise<Reminder[]> {
    const page = await request<Page<NxReminder>>('/reminders?limit=200');
    return page.items.map((r) => ({ id: r.id, title: r.title, time: r.scheduled_at ?? undefined, enabled: r.is_enabled }));
  },

  async create(reminder: Omit<Reminder, 'id'>): Promise<Reminder> {
    const r = await request<NxReminder>('/reminders', {
      method: 'POST',
      body: JSON.stringify({
        title: reminder.title,
        scheduled_at: reminder.time ?? null,
        is_enabled: reminder.enabled ?? true,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    });
    return { id: r.id, title: r.title, time: r.scheduled_at ?? undefined, enabled: r.is_enabled };
  },

  async delete(id: string): Promise<void> {
    return request<void>(`/reminders/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
};

// ─── Monthly Review API ───────────────────────────────────────────────────────

export const monthlyReviewApi = {
  /** Last-30-days snapshot plus a daily energy/stress trend. */
  async get(): Promise<Record<string, unknown>> {
    const { _moods, _overview, ...stats } = await computeStats();
    const byDay: Record<string, { energy: number[]; stress: number[] }> = {};
    const cutoff = Date.now() - 30 * 86_400_000;
    for (const m of _moods) {
      if (Date.parse(m.created_at) < cutoff) continue;
      const d = (byDay[localDate(m.created_at)] ??= { energy: [], stress: [] });
      d.energy.push(m.energy_level);
      d.stress.push(m.stress_level);
    }
    const mood_trend = Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({
      date, energy: round1(avg(v.energy)) ?? 0, stress: round1(avg(v.stress)) ?? 0,
    }));
    return { ...stats, mood_trend, active_days: _overview.active_days };
  },
};

// ─── Admin API ────────────────────────────────────────────────────────────────

export const adminApi = {
  async getStats(): Promise<Record<string, unknown>> {
    throw notAvailable('Admin statistics');
  },

  async export(_format: 'csv' | 'json'): Promise<Blob> {
    throw notAvailable('Data export');
  },
};

// ─── User Context API ─────────────────────────────────────────────────────────

export const userContextApi = {
  async get(): Promise<UserContext> {
    const [ov, moods] = await Promise.all([overview(30), recentMoods()]);
    return {
      mood_averages: {
        avg_energy: ov.mood.avg_energy_score ?? undefined,
        avg_stress: ov.mood.avg_stress_score ?? undefined,
        dominant_mood: dominantMood(moods),
      },
      assessment_strengths: [],
      improvement_areas: [],
    };
  },
};

// ─── Experiments API ──────────────────────────────────────────────────────────

export const experimentsApi = {
  async list(): Promise<Experiment[]> {
    throw notAvailable('Wellness experiments');
  },

  async create(_data: Omit<Experiment, 'id'>): Promise<Experiment> {
    throw notAvailable('Wellness experiments');
  },

  async complete(_id: string): Promise<Experiment> {
    throw notAvailable('Wellness experiments');
  },
};

export { getToken, setToken, clearToken };
