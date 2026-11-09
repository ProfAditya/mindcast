/**
 * On-device storage for exploratory attempts and drafts of any assessment.
 * The neurix-api backend only accepts PHQ-9, GAD-7 and WHO-5, so exploratory results cannot be saved to the server yet
 * (see docs/frontend/assessments-backend-contract.md). Attempts are append-only: a submitted attempt is never changed.
 */
import type { Answers, ExploratoryResult, Length } from './engine';

export interface LocalAttempt {
  id: string;
  module: string;
  version: string;
  length: Length;
  answers: Answers;
  followUps: Record<string, string>;
  started_at: string;
  completed_at: string;
  result: ExploratoryResult;
  storage: 'device';
}
export interface Draft {
  module: string;
  version: string;
  length: Length;
  answers: Answers;
  followUps: Record<string, string>;
  index: number;
  started_at: string;
  saved_at: string;
}

const key = (uid: string, k: string) => `neurix:v1:${uid}:assess:${k}`;
function read<T>(k: string, fallback: T): T {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(k: string, v: unknown) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
    return true;
  } catch {
    return false;
  }
}

export const localAttempts = {
  list: (uid: string): LocalAttempt[] =>
    read<LocalAttempt[]>(key(uid, 'attempts'), []).sort((a, b) =>
      b.completed_at.localeCompare(a.completed_at)
    ),
  get: (uid: string, id: string) => localAttempts.list(uid).find((a) => a.id === id) ?? null,
  add: (uid: string, a: LocalAttempt) => {
    const all = read<LocalAttempt[]>(key(uid, 'attempts'), []);
    if (all.some((x) => x.id === a.id)) return false; // never overwrite
    return write(key(uid, 'attempts'), [...all, a]);
  },
};

export const drafts = {
  get: (uid: string, moduleId: string) => read<Draft | null>(key(uid, `draft:${moduleId}`), null),
  save: (uid: string, d: Draft) => write(key(uid, `draft:${d.module}`), d),
  clear: (uid: string, moduleId: string) => {
    try {
      localStorage.removeItem(key(uid, `draft:${moduleId}`));
    } catch {
      /* ignore */
    }
  },
};

export const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
