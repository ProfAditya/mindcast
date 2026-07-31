/**
 * MindCast API Client
 * Connects to FastAPI backend at https://mindcast-backend.onrender.com
 */

const BASE_URL = 'https://mindcast-backend.onrender.com';

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

  let res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

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
  full_name?: string;
  is_admin?: boolean;
  created_at?: string;
  avatar_url?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user?: AuthUser;
}

export interface MoodEntry {
  id: string;
  user_id: string;
  mood: string;
  energy: number;
  stress: number;
  notes?: string;
  tags?: string[];
  created_at: string;
}

export interface MoodEntryCreate {
  mood: string;
  energy: number;
  stress: number;
  notes?: string;
  tags?: string[];
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  type: string;
  target: number;
  unit: string;
  color?: string;
  is_active: boolean;
  created_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  value: number;
  date: string;
  completed: boolean;
  created_at: string;
}

export interface HabitCreate {
  name: string;
  type: string;
  target: number;
  unit: string;
  color?: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  title?: string;
  content: string;
  prompt?: string;
  sentiment?: string;
  mood_tag?: string;
  tags?: string[];
  created_at: string;
  updated_at?: string;
}

export interface JournalEntryCreate {
  title?: string;
  content: string;
  prompt?: string;
  mood_tag?: string;
  tags?: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface DashboardStats {
  wellness_score: number;
  habits_logged_today: number;
  journal_entries_count: number;
  mood_check_ins_30d: number;
  avg_energy_30d: number;
  avg_stress_30d: number;
  assessment_trend: string;
  streak_days: number;
}

export interface WellnessDNA {
  sleep_score: number;
  stress_score: number;
  energy_score: number;
  mindfulness_score: number;
  social_score: number;
  movement_score: number;
  nutrition_score: number;
  overall: number;
  strengths: string[];
  focus_areas: string[];
}

export interface AnalyticsData {
  mood_trend: Array<{ date: string; energy: number; stress: number; mood: string }>;
  habit_completion: Array<{ date: string; rate: number }>;
  journal_frequency: Array<{ week: string; count: number }>;
  wellness_over_time: Array<{ date: string; score: number }>;
}

// ─── OpenAPI Spec Discovery ───────────────────────────────────────────────────

interface DiscoveredEndpoints {
  loginPath: string | null;
  loginIsForm: boolean;
  registerPath: string | null;
  mePath: string | null;
}

let _discoveredEndpoints: DiscoveredEndpoints | null = null;

async function discoverEndpoints(): Promise<DiscoveredEndpoints> {
  if (_discoveredEndpoints) return _discoveredEndpoints;

  const defaults: DiscoveredEndpoints = {
    loginPath: null,
    loginIsForm: false,
    registerPath: null,
    mePath: null,
  };

  try {
    let res = await fetch(`${BASE_URL}/openapi.json`, { cache: 'no-store' });
    if (!res.ok) return defaults;
    const spec = await res.json();
    const paths: Record<string, Record<string, unknown>> = spec.paths || {};

    for (const [path, methods] of Object.entries(paths)) {
      const lp = path.toLowerCase();
      const methodKeys = Object.keys(methods as object).map((m) => m.toLowerCase());

      // Login endpoint detection
      if (
        defaults.loginPath === null &&
        methodKeys.includes('post') &&
        (lp.includes('token') || lp.includes('login') || lp.includes('signin'))
      ) {
        defaults.loginPath = path;
        // Check if it uses OAuth2 form (requestBody with form encoding)
        const postOp = (methods as Record<string, unknown>)['post'] as Record<string, unknown> | undefined;
        const requestBody = postOp?.requestBody as Record<string, unknown> | undefined;
        const content = requestBody?.content as Record<string, unknown> | undefined;
        defaults.loginIsForm = !!(
          content?.['application/x-www-form-urlencoded']
        );
      }

      // Register endpoint detection
      if (
        defaults.registerPath === null &&
        methodKeys.includes('post') &&
        (lp.includes('register') || lp.includes('signup') || lp.includes('sign-up'))
      ) {
        defaults.registerPath = path;
      }

      // /me endpoint detection
      if (
        defaults.mePath === null &&
        methodKeys.includes('get') &&
        (lp === '/me' || lp === '/users/me' || lp === '/auth/me' || lp === '/profile' || lp.endsWith('/me'))
      ) {
        defaults.mePath = path;
      }
    }
  } catch {
    // ignore — fall through to manual discovery
  }

  _discoveredEndpoints = defaults;
  return defaults;
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

/**
 * Normalize user object — backend may return name as full_name
 */
function normalizeUser(raw: Record<string, unknown>): AuthUser {
  return {
    id: String(raw.id ?? raw._id ?? ''),
    email: String(raw.email ?? ''),
    name: String(raw.name ?? raw.full_name ?? raw.username ?? raw.email ?? 'User'),
    full_name: raw.full_name ? String(raw.full_name) : undefined,
    is_admin: Boolean(raw.is_admin ?? raw.is_superuser ?? false),
    created_at: raw.created_at ? String(raw.created_at) : undefined,
    avatar_url: raw.avatar_url ? String(raw.avatar_url) : undefined,
  };
}

/**
 * Status codes that mean "wrong endpoint or format — try next".
 * 401/403 mean "wrong credentials"— stop and throw. * 422 means"validation error / wrong payload format"— try next. * 405 means"method not allowed"— try next. * 404 means"endpoint doesn't exist" — try next.
 */
function isSkippableStatus(status: number): boolean {
  return status === 404 || status === 405 || status === 422;
}

/**
 * Try a single login endpoint. Returns parsed response or null if skippable.
 * Throws on credential errors (401/403) or unexpected server errors (500+).
 */
async function attemptLogin(
  path: string,
  body: string,
  contentType: string
): Promise<LoginResponse | null> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': contentType },
      body,
    });
  } catch {
    return null; // network error — skip
  }

  if (isSkippableStatus(res.status)) return null;

  if (!res.ok) {
    // 401/403 = wrong credentials — extract message and throw
    let errorMsg = `Invalid credentials`;
    try {
      const err = await res.json();
      errorMsg = err.detail || err.message || errorMsg;
    } catch { /* ignore */ }
    throw new Error(errorMsg);
  }

  return res.json() as Promise<LoginResponse>;
}

/**
 * Try a single register endpoint. Returns parsed response or null if skippable.
 * Throws on real errors (400 email exists, 500, etc.).
 */
async function attemptRegister(
  path: string,
  body: Record<string, unknown>
): Promise<Record<string, unknown> | null> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    return null; // network error — skip
  }

  if (isSkippableStatus(res.status)) return null;

  if (!res.ok) {
    let errorMsg = `Registration failed (${res.status})`;
    try {
      const err = await res.json();
      errorMsg = err.detail || err.message || errorMsg;
    } catch { /* ignore */ }
    throw new Error(errorMsg);
  }

  return res.json() as Promise<Record<string, unknown>>;
}

/**
 * Login using discovered endpoint first, then fall back to manual discovery.
 */
async function tryLogin(email: string, password: string): Promise<LoginResponse> {
  // Try to use the OpenAPI spec to find the correct endpoint
  const discovered = await discoverEndpoints();

  // Build attempt list — put discovered endpoint first if found
  const formBody = new URLSearchParams({ username: email, password }).toString();
  const jsonBody = JSON.stringify({ email, password });
  const jsonBodyUsername = JSON.stringify({ username: email, password });

  type Attempt = { path: string; body: string; contentType: string };
  const attempts: Attempt[] = [];

  if (discovered.loginPath) {
    if (discovered.loginIsForm) {
      attempts.push({ path: discovered.loginPath, body: formBody, contentType: 'application/x-www-form-urlencoded' });
    } else {
      attempts.push({ path: discovered.loginPath, body: jsonBody, contentType: 'application/json' });
      attempts.push({ path: discovered.loginPath, body: jsonBodyUsername, contentType: 'application/json' });
      attempts.push({ path: discovered.loginPath, body: formBody, contentType: 'application/x-www-form-urlencoded' });
    }
  }

  // Fallback attempts (deduplicated below)
  const fallbacks: Attempt[] = [
    { path: '/auth/token', body: formBody, contentType: 'application/x-www-form-urlencoded' },
    { path: '/auth/login', body: jsonBody, contentType: 'application/json' },
    { path: '/auth/login', body: jsonBodyUsername, contentType: 'application/json' },
    { path: '/auth/login', body: formBody, contentType: 'application/x-www-form-urlencoded' },
    { path: '/token', body: formBody, contentType: 'application/x-www-form-urlencoded' },
    { path: '/login', body: jsonBody, contentType: 'application/json' },
    { path: '/login', body: formBody, contentType: 'application/x-www-form-urlencoded' },
    { path: '/api/v1/auth/token', body: formBody, contentType: 'application/x-www-form-urlencoded' },
    { path: '/api/v1/auth/login', body: jsonBody, contentType: 'application/json' },
    { path: '/users/login', body: jsonBody, contentType: 'application/json' },
  ];

  // Add fallbacks that aren't already in attempts
  for (const fb of fallbacks) {
    const alreadyQueued = attempts.some((a) => a.path === fb.path && a.contentType === fb.contentType);
    if (!alreadyQueued) attempts.push(fb);
  }

  for (const attempt of attempts) {
    const result = await attemptLogin(attempt.path, attempt.body, attempt.contentType);
    if (result !== null) return result;
  }

  throw new Error('Login failed. Please check your credentials and try again.');
}

/**
 * Register using discovered endpoint first, then fall back to manual discovery.
 */
async function tryRegister(
  name: string,
  email: string,
  password: string
): Promise<{ user: AuthUser; token?: string }> {
  const discovered = await discoverEndpoints();

  const body = { name, full_name: name, email, password };

  const paths: string[] = [];
  if (discovered.registerPath) paths.push(discovered.registerPath);

  const fallbackPaths = [
    '/auth/register',
    '/auth/signup',
    '/register',
    '/signup',
    '/users',
    '/users/register',
    '/api/v1/auth/register',
    '/api/v1/users',
    '/api/v1/users/register',
  ];

  for (const p of fallbackPaths) {
    if (!paths.includes(p)) paths.push(p);
  }

  for (const path of paths) {
    const data = await attemptRegister(path, body);
    if (data === null) continue;

    // Response may be: { user, access_token } or just the user object
    if (data.access_token) {
      let user = data.user
        ? normalizeUser(data.user as Record<string, unknown>)
        : normalizeUser(data);
      return { user, token: String(data.access_token) };
    }
    return { user: normalizeUser(data) };
  }

  throw new Error('Unable to reach registration endpoint. Please try again later.');
}

export const authApi = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const data = await tryLogin(email, password);

    if (!data.access_token) {
      throw new Error('No access token received from server.');
    }

    setToken(data.access_token);

    // Fetch user profile if not included in login response
    let user: AuthUser;
    if (data.user) {
      user = normalizeUser(data.user as unknown as Record<string, unknown>);
    } else {
      // Try /me endpoints using the discovered path first
      const discovered = await discoverEndpoints();
      const meEndpoints = [
        ...(discovered.mePath ? [discovered.mePath] : []),
        '/users/me',
        '/auth/me',
        '/me',
        '/profile',
      ];
      // Deduplicate
      const uniqueMe = [...new Set(meEndpoints)];
      let fetched = false;
      for (const ep of uniqueMe) {
        try {
          const me = await request<Record<string, unknown>>(ep, {}, true);
          user = normalizeUser(me);
          fetched = true;
          break;
        } catch { /* try next */ }
      }
      if (!fetched) {
        user = { id: 'user-local', email, name: email.split('@')[0] };
      }
    }

    setUser(user!);
    return { ...data, user: user! };
  },

  async register(name: string, email: string, password: string): Promise<LoginResponse> {
    const { user, token } = await tryRegister(name, email, password);

    if (token) {
      setToken(token);
      setUser(user);
      return { access_token: token, token_type: 'bearer', user };
    }

    // No token from register — auto-login
    try {
      return await authApi.login(email, password);
    } catch {
      // If auto-login fails, store user without token and return partial response
      setUser(user);
      return { access_token: '', token_type: 'bearer', user };
    }
  },

  async logout(): Promise<void> {
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch {
      // ignore — logout is best-effort
    } finally {
      clearToken();
    }
  },

  async getMe(): Promise<AuthUser> {
    const discovered = await discoverEndpoints();
    const meEndpoints = [
      ...(discovered.mePath ? [discovered.mePath] : []),
      '/users/me',
      '/auth/me',
      '/me',
      '/profile',
    ];
    const uniqueMe = [...new Set(meEndpoints)];
    for (const ep of uniqueMe) {
      try {
        const data = await request<Record<string, unknown>>(ep);
        return normalizeUser(data);
      } catch { /* try next */ }
    }
    throw new Error('Could not fetch user profile.');
  },

  async refresh(): Promise<{ access_token: string }> {
    return request<{ access_token: string }>('/auth/refresh', { method: 'POST' });
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
    return request<MoodEntry[]>(`/mood?limit=${limit}`);
  },

  async create(entry: MoodEntryCreate): Promise<MoodEntry> {
    return request<MoodEntry>('/mood', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  },

  async delete(id: string): Promise<void> {
    return request<void>(`/mood/${id}`, { method: 'DELETE' });
  },
};

// ─── Habits API ───────────────────────────────────────────────────────────────

export const habitsApi = {
  async list(): Promise<Habit[]> {
    return request<Habit[]>('/habits');
  },

  async create(habit: HabitCreate): Promise<Habit> {
    return request<Habit>('/habits', {
      method: 'POST',
      body: JSON.stringify(habit),
    });
  },

  async update(id: string, data: Partial<HabitCreate>): Promise<Habit> {
    return request<Habit>(`/habits/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<void> {
    return request<void>(`/habits/${id}`, { method: 'DELETE' });
  },

  async logToday(habitId: string, value: number): Promise<HabitLog> {
    return request<HabitLog>(`/habits/${habitId}/log`, {
      method: 'POST',
      body: JSON.stringify({ value, date: new Date().toISOString().split('T')[0] }),
    });
  },

  async getLogs(habitId: string, days = 30): Promise<HabitLog[]> {
    return request<HabitLog[]>(`/habits/${habitId}/logs?days=${days}`);
  },
};

// ─── Journal API ──────────────────────────────────────────────────────────────

export const journalApi = {
  async list(limit = 20): Promise<JournalEntry[]> {
    return request<JournalEntry[]>(`/journal?limit=${limit}`);
  },

  async get(id: string): Promise<JournalEntry> {
    return request<JournalEntry>(`/journal/${id}`);
  },

  async create(entry: JournalEntryCreate): Promise<JournalEntry> {
    return request<JournalEntry>('/journal', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  },

  async update(id: string, data: Partial<JournalEntryCreate>): Promise<JournalEntry> {
    return request<JournalEntry>(`/journal/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<void> {
    return request<void>(`/journal/${id}`, { method: 'DELETE' });
  },

  async getPrompt(): Promise<{ prompt: string }> {
    return request<{ prompt: string }>('/journal/prompt');
  },
};

// ─── Chat API ─────────────────────────────────────────────────────────────────

export const chatApi = {
  async getHistory(limit = 20): Promise<ChatMessage[]> {
    return request<ChatMessage[]>(`/chat/history?limit=${limit}`);
  },

  async sendMessage(message: string): Promise<ChatMessage> {
    return request<ChatMessage>('/chat/message', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

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

    let res = await fetch(`${BASE_URL}/chat/stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message }),
    });

    if (!res.ok || !res.body) {
      throw new Error('Stream failed');
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
          if (data === '[DONE]') {
            onDone();
            return;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) onChunk(parsed.text);
            if (parsed.done) { onDone(); return; }
          } catch {
            if (data) onChunk(data);
          }
        }
      }
    }

    onDone();
  },
};

// ─── Analytics API ────────────────────────────────────────────────────────────

export const analyticsApi = {
  async getData(days = 30): Promise<AnalyticsData> {
    return request<AnalyticsData>(`/analytics?days=${days}`);
  },

  async getWellnessDNA(): Promise<WellnessDNA> {
    return request<WellnessDNA>('/analytics/wellness-dna');
  },

  async getMoodTrend(days = 30): Promise<Array<{ date: string; energy: number; stress: number; mood: string }>> {
    const data = await request<AnalyticsData>(`/analytics?days=${days}`);
    return data.mood_trend;
  },
};

// ─── Wellness API ─────────────────────────────────────────────────────────────

export const wellnessApi = {
  async getDNA(): Promise<WellnessDNA> {
    return request<WellnessDNA>('/analytics/wellness-dna');
  },

  async getScore(): Promise<{ score: number; trend: string }> {
    return request<{ score: number; trend: string }>('/wellness/score');
  },
};

// ─── Profile API ──────────────────────────────────────────────────────────────

export const profileApi = {
  async get(): Promise<AuthUser> {
    return request<AuthUser>('/profile');
  },

  async update(data: Partial<AuthUser>): Promise<AuthUser> {
    return request<AuthUser>('/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

export { getToken, setToken, clearToken };
