/**
 * MindCast API Client
 * Connects to FastAPI backend at https://mindcast-backend.onrender.com/api
 */

function resolveBaseUrl(): string {
  // In the browser, route all API calls through the Next.js proxy to avoid CORS.
  // The proxy at /api/proxy/* forwards requests server-side to the FastAPI backend.
  if (typeof window !== 'undefined') {
    return '/api/proxy';
  }

  // On the server (SSR / API routes), call the backend directly.
  const raw =
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_BACKEND_URL) || '';

  if (raw && raw.trim().length > 0) {
    const trimmed = raw.trim().replace(/\/+$/, '');
    if (trimmed.endsWith('/api')) return trimmed;
    return `${trimmed}/api`;
  }

  return 'https://mindcast-backend.onrender.com/api';
}

const BASE_URL = resolveBaseUrl();

// ─── Token Management ────────────────────────────────────────────────────────

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('mindcast_token');
}

function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('mindcast_token', token);
}

function clearToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('mindcast_token');
  localStorage.removeItem('mindcast_user');
}

function setUser(user: AuthUser): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('mindcast_user', JSON.stringify(user));
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('mindcast_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem('mindcast_token');
  return !!token && token.length > 0;
}

// ─── HTTP Helper ─────────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {},
  authenticated = true
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (authenticated) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (networkErr) {
    // TypeError: Failed to fetch — backend unreachable or CORS blocked
    const msg =
      networkErr instanceof TypeError
        ? `Cannot reach the MindCast server. Please check your internet connection or try again later. (${networkErr.message})`
        : `Network error: ${String(networkErr)}`;
    throw new Error(msg);
  }

  if (!res.ok) {
    let errorMsg = `API error ${res.status}`;
    try {
      const err = await res.json();
      errorMsg = err.detail || err.message || errorMsg;
    } catch {
      // ignore parse error
    }
    throw new Error(errorMsg);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json();
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  is_admin?: boolean;
  created_at?: string;
}

/** Backend returns { token, user } — NOT access_token */
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

// ─── Auth API ─────────────────────────────────────────────────────────────────

export const authApi = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const data = await request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, false);

    if (!data.token) {
      throw new Error('No token received from server.');
    }

    setToken(data.token);
    setUser(data.user);
    return data;
  },

  async signup(name: string, email: string, password: string): Promise<AuthResponse> {
    const data = await request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }, false);

    if (!data.token) {
      throw new Error('No token received from server.');
    }

    setToken(data.token);
    setUser(data.user);
    return data;
  },

  /** Logout is client-side only — no backend endpoint */
  logout(): void {
    clearToken();
  },

  async getMe(): Promise<AuthUser> {
    return request<AuthUser>('/auth/me');
  },
};

// ─── Dashboard API ────────────────────────────────────────────────────────────

export const dashboardApi = {
  async getStats(): Promise<DashboardStats> {
    return request<DashboardStats>('/dashboard/stats');
  },
};

// ─── Mood API ─────────────────────────────────────────────────────────────────

export const moodApi = {
  async list(limit = 30): Promise<MoodEntry[]> {
    return request<MoodEntry[]>(`/mood-logs?limit=${limit}`);
  },

  async create(entry: MoodEntryCreate): Promise<MoodEntry> {
    return request<MoodEntry>('/mood-logs', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  },
};

// ─── Habit Logs API ───────────────────────────────────────────────────────────

export const habitLogsApi = {
  async list(): Promise<HabitLog[]> {
    return request<HabitLog[]>('/habit-logs');
  },

  async create(log: HabitLogCreate): Promise<HabitLog> {
    return request<HabitLog>('/habit-logs', {
      method: 'POST',
      body: JSON.stringify(log),
    });
  },
};

// ─── Journal API ──────────────────────────────────────────────────────────────

export const journalApi = {
  async list(limit = 20): Promise<JournalEntry[]> {
    return request<JournalEntry[]>(`/journal-entries?limit=${limit}`);
  },

  async create(entry: JournalEntryCreate): Promise<JournalEntry> {
    return request<JournalEntry>('/journal-entries', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  },
};

// ─── Chat API ─────────────────────────────────────────────────────────────────

export const chatApi = {
  async getConversations(limit = 20): Promise<Conversation[]> {
    return request<Conversation[]>(`/conversations?limit=${limit}`);
  },

  /**
   * POST /chat — SSE stream.
   * Each chunk: "data: {text: '...'}"
   * End:        "data: {done: true}"
   */
  async streamMessage(
    message: string,
    onChunk: (text: string) => void,
    onDone: () => void
  ): Promise<void> {
    const token = getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let res = await fetch(`${BASE_URL}/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message }),
    });

    if (!res.ok || !res.body) {
      let errorMsg = `Chat error ${res.status}`;
      try {
        const err = await res.json();
        errorMsg = err.detail || err.message || errorMsg;
      } catch { /* ignore */ }
      throw new Error(errorMsg);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          try {
            const parsed = JSON.parse(data);
            if (parsed.done) {
              onDone();
              return;
            }
            if (parsed.text) onChunk(parsed.text);
          } catch {
            // non-JSON chunk — ignore
          }
        }
      }
    }

    onDone();
  },
};

// ─── Insights API ─────────────────────────────────────────────────────────────

export const insightsApi = {
  async getPatterns(): Promise<Record<string, unknown>> {
    return request<Record<string, unknown>>('/insights/patterns');
  },
};

// ─── Wellness DNA API ─────────────────────────────────────────────────────────

export const wellnessDnaApi = {
  async get(): Promise<WellnessDNA> {
    return request<WellnessDNA>('/wellness-dna');
  },
};

// ─── Ask My Data API ──────────────────────────────────────────────────────────

export const askMyDataApi = {
  async ask(question: string): Promise<{ answer: string }> {
    return request<{ answer: string }>('/ask-my-data', {
      method: 'POST',
      body: JSON.stringify({ question }),
    });
  },
};

// ─── Assessments API ──────────────────────────────────────────────────────────

export const assessmentsApi = {
  async getQuestions(): Promise<Array<{ id: string; question: string; type: string }>> {
    return request<Array<{ id: string; question: string; type: string }>>('/assessments/questions');
  },

  async submit(answers: Array<{ question_id: string; value: number }>): Promise<Record<string, unknown>> {
    return request<Record<string, unknown>>('/assessments', {
      method: 'POST',
      body: JSON.stringify(answers),
    });
  },
};

// ─── Wellness Toolkit API ─────────────────────────────────────────────────────

export const wellnessToolkitApi = {
  async list(): Promise<WellnessToolkit[]> {
    return request<WellnessToolkit[]>('/wellness-toolkit');
  },

  async log(item: { toolkit_id: string }): Promise<void> {
    return request<void>('/wellness-toolkit', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },
};

// ─── Reminders API ────────────────────────────────────────────────────────────

export const remindersApi = {
  async list(): Promise<Reminder[]> {
    return request<Reminder[]>('/reminders');
  },

  async create(reminder: Omit<Reminder, 'id'>): Promise<Reminder> {
    return request<Reminder>('/reminders', {
      method: 'POST',
      body: JSON.stringify(reminder),
    });
  },

  async delete(id: string): Promise<void> {
    return request<void>(`/reminders/${id}`, { method: 'DELETE' });
  },
};

// ─── Monthly Review API ───────────────────────────────────────────────────────

export const monthlyReviewApi = {
  /** Returns only the current 30-day snapshot — no historical data */
  async get(): Promise<Record<string, unknown>> {
    return request<Record<string, unknown>>('/monthly-review');
  },
};

// ─── Admin API ────────────────────────────────────────────────────────────────

export const adminApi = {
  async getStats(): Promise<Record<string, unknown>> {
    return request<Record<string, unknown>>('/admin/stats');
  },

  async export(format: 'csv' | 'json'): Promise<Blob> {
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    let res = await fetch(`${BASE_URL}/admin/export/${format}`, { headers });
    if (!res.ok) throw new Error(`Export failed: ${res.status}`);
    return res.blob();
  },
};

// ─── User Context API ─────────────────────────────────────────────────────────

export const userContextApi = {
  async get(): Promise<UserContext> {
    return request<UserContext>('/user/context');
  },
};

// ─── Experiments API ──────────────────────────────────────────────────────────

export const experimentsApi = {
  async list(): Promise<Experiment[]> {
    return request<Experiment[]>('/experiments');
  },

  async create(data: Omit<Experiment, 'id'>): Promise<Experiment> {
    return request<Experiment>('/experiments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async complete(id: string): Promise<Experiment> {
    return request<Experiment>(`/experiments/${id}/complete`, { method: 'POST' });
  },
};

export { getToken, setToken, clearToken };
