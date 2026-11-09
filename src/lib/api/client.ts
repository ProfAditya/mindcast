/**
 * NEURIX HTTP client: Supabase Auth session + typed calls to the `neurix-api` Edge Function.
 * Only public values are used in the browser (Supabase URL, publishable key, function URL).
 * The user id is never sent: the backend takes it from the verified access token.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hhdlsbbeabdbqrlqxtiu.supabase.co';
// Publishable (public) key — safe in the browser by design; access is enforced by RLS and the API.
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_1q9-CJyF3H9NNTebkLmP9Q_Nz_BSspG';
const FUNCTION_URL = (
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'https://hhdlsbbeabdbqrlqxtiu.supabase.co/functions/v1/neurix-api'
).replace(/\/+$/, '');
export const API_BASE = `${FUNCTION_URL}/api/v1`;

let client: SupabaseClient | null = null;
export function supabase(): SupabaseClient {
  if (!SUPABASE_KEY)
    throw new ApiError(0, 'NEURIX is not configured: the Supabase publishable key is missing.');
  client ??= createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: 'neurix-auth' },
  });
  return client;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public detail?: unknown
  ) {
    super(message);
  }
}

const FRIENDLY: Record<number, string> = {
  401: 'Your session has ended. Please sign in again.',
  403: 'You do not have permission to do that.',
  404: 'That item could not be found.',
  413: 'The file is too large.',
  415: 'That file type is not supported.',
  429: 'Too many requests. Please wait a minute and try again.',
  500: 'Something went wrong on our side. Please try again.',
  502: 'A connected service is unavailable. Please try again shortly.',
  503: 'This service is temporarily unavailable.',
};

function messageFrom(status: number, body: unknown): string {
  const d = (body as { detail?: unknown } | null)?.detail;
  if (typeof d === 'string' && d) return d.charAt(0).toUpperCase() + d.slice(1);
  if (Array.isArray(d)) {
    const msgs = d
      .map((x) => {
        const loc = Array.isArray(x?.loc)
          ? x.loc.filter((p: unknown) => p !== 'body').join('.')
          : '';
        return x?.msg ? (loc ? `${loc}: ${x.msg}` : x.msg) : '';
      })
      .filter(Boolean);
    if (msgs.length) return msgs.join('; ');
  }
  return FRIENDLY[status] ?? `Request failed (${status}).`;
}

export async function accessToken(): Promise<string | null> {
  const { data } = await supabase().auth.getSession();
  return data.session?.access_token ?? null;
}

type Init = Omit<RequestInit, 'body'> & { body?: unknown; raw?: boolean };

export async function api<T>(path: string, init: Init = {}): Promise<T> {
  const token = await accessToken();
  if (!token) throw new ApiError(401, FRIENDLY[401]);
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...(init.headers as Record<string, string>),
  };
  let body: BodyInit | undefined;
  if (init.body instanceof FormData) body = init.body;
  else if (init.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(init.body);
  }
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...init, headers, body });
  } catch {
    throw new ApiError(0, 'Cannot reach NEURIX. Check your internet connection and try again.');
  }
  if (!res.ok) {
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      /* not JSON */
    }
    if (res.status === 401) {
      // Token rejected: drop the local session so the app returns to sign-in.
      await supabase()
        .auth.signOut({ scope: 'local' })
        .catch(() => {});
    }
    throw new ApiError(
      res.status,
      messageFrom(res.status, data),
      (data as { detail?: unknown })?.detail
    );
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const qs = (o: Record<string, string | number | boolean | null | undefined>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(o))
    if (v !== undefined && v !== null && v !== '') p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : '';
};

export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return 'Something went wrong.';
}
