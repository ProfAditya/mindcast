// Typed wrappers for every neurix-api endpoint the app uses. Presentation code never calls fetch directly.
import { api, qs } from './client';
import type * as T from './types';

type Q = Record<string, string | number | boolean | null | undefined>;

export const profileApi = {
  me: () => api<T.Profile>('/me'),
  update: (body: { full_name?: string | null; date_of_birth?: string | null }) =>
    api<T.Profile>('/me', { method: 'PATCH', body }),
};

export const recordsApi = {
  list: (q: { record_type?: T.RecordType; limit?: number } = {}) =>
    api<T.Page<T.HealthRecord>>(`/medical-records${qs({ limit: 200, ...q })}`),
  create: (body: Partial<T.HealthRecord>) =>
    api<T.HealthRecord>('/medical-records', { method: 'POST', body }),
  update: (id: string, body: Partial<T.HealthRecord>) =>
    api<T.HealthRecord>(`/medical-records/${id}`, { method: 'PATCH', body }),
  remove: (id: string) => api<void>(`/medical-records/${id}`, { method: 'DELETE' }),
  upload: (id: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api<{ record_id: string; mime_type: string; file_size_bytes: number }>(
      `/medical-records/${id}/document`,
      { method: 'POST', body: fd }
    );
  },
  documentUrl: (id: string) =>
    api<{ url: string; expires_in_seconds: number; mime_type: string }>(
      `/medical-records/${id}/document`
    ),
  removeDocument: (id: string) =>
    api<void>(`/medical-records/${id}/document`, { method: 'DELETE' }),
};

export const historyApi = {
  list: (q: { entry_type?: T.HistoryType; status?: T.HistoryStatus } = {}) =>
    api<T.Page<T.HistoryEntry>>(`/medical-history${qs({ limit: 200, ...q })}`),
  create: (body: Partial<T.HistoryEntry>) =>
    api<T.HistoryEntry>('/medical-history', { method: 'POST', body }),
  update: (id: string, body: Partial<T.HistoryEntry>) =>
    api<T.HistoryEntry>(`/medical-history/${id}`, { method: 'PATCH', body }),
  remove: (id: string) => api<void>(`/medical-history/${id}`, { method: 'DELETE' }),
};

function owned<Row>(path: string) {
  return {
    list: (q: Q = {}) => api<T.Page<Row>>(`${path}${qs({ limit: 200, ...q })}`),
    create: (body: Partial<Row>) => api<Row>(path, { method: 'POST', body }),
    update: (id: string | number, body: Partial<Row>) =>
      api<Row>(`${path}/${id}`, { method: 'PATCH', body }),
    remove: (id: string | number) => api<void>(`${path}/${id}`, { method: 'DELETE' }),
  };
}
export const moodApi = owned<T.MoodEntry>('/mood-entries');
export const habitApi = owned<T.HabitEntry>('/habit-entries');
export const journalApi = owned<T.JournalEntry>('/journal-entries');
export const reminderApi = owned<T.Reminder>('/reminders');
export const digitalApi = owned<T.DigitalActivity>('/digital-activity');

export const wellbeingApi = {
  list: (q: { since?: string; until?: string; limit?: number } = {}) =>
    api<T.Page<T.WellbeingLog>>(`/wellbeing-logs${qs({ limit: 200, ...q })}`),
  upsert: (date: string, body: Partial<T.WellbeingLog>) =>
    api<T.WellbeingLog>(`/wellbeing-logs/${date}`, { method: 'PUT', body }),
  remove: (date: string) => api<void>(`/wellbeing-logs/${date}`, { method: 'DELETE' }),
};

export const analyticsApi = {
  overview: (days = 30) => api<T.Overview>(`/analytics/overview${qs({ days })}`),
  monthly: (month?: string) => api<T.MonthlyReview>(`/analytics/monthly-review${qs({ month })}`),
};

export const assessmentApi = {
  instruments: () => api<T.Instrument[]>('/assessments/instruments'),
  instrument: (code: string) => api<T.Instrument>(`/assessments/instruments/${code}`),
  submit: (instrument: string, answers: Record<string, number>) =>
    api<T.AssessmentResult>('/assessments', { method: 'POST', body: { instrument, answers } }),
  list: (instrument?: string) =>
    api<T.Page<T.AssessmentResult>>(`/assessments${qs({ instrument, limit: 200 })}`),
  get: (id: string) => api<T.AssessmentResult>(`/assessments/${id}`),
  remove: (id: string) => api<void>(`/assessments/${id}`, { method: 'DELETE' }),
};

export const aiApi = {
  consent: () => api<T.ConsentStatus>('/ai/consent'),
  setConsent: (scope: 'general' | 'journal_entries' | 'medical', granted: boolean) =>
    api<T.ConsentStatus>(`/ai/consent/${scope}`, { method: 'PUT', body: { granted } }),
  conversations: () => api<T.Conversation[]>('/ai/conversations?limit=100'),
  createConversation: (title?: string) =>
    api<T.Conversation>('/ai/conversations', { method: 'POST', body: { title: title ?? null } }),
  conversation: (id: string) =>
    api<T.Conversation & { messages: T.Message[] }>(`/ai/conversations/${id}`),
  renameConversation: (id: string, title: string) =>
    api<T.Conversation>(`/ai/conversations/${id}`, { method: 'PATCH', body: { title } }),
  deleteConversation: (id: string) => api<void>(`/ai/conversations/${id}`, { method: 'DELETE' }),
  send: (
    id: string,
    content: string,
    opts: { include_journal?: boolean; include_medical?: boolean } = {}
  ) =>
    api<{ user_message: T.Message; assistant_message: T.Message; meta: T.AIMeta }>(
      `/ai/conversations/${id}/messages`,
      { method: 'POST', body: { content, ...opts } }
    ),
  ask: (question: string, days = 30) =>
    api<{ answer: string; meta: T.AIMeta }>('/ai/ask', {
      method: 'POST',
      body: { question, days },
    }),
  summaries: () => api<T.AISummary[]>('/ai/summaries'),
  createSummary: (days: number) =>
    api<T.AISummary>('/ai/summaries', { method: 'POST', body: { days } }),
  deleteSummary: (id: string | number) => api<void>(`/ai/summaries/${id}`, { method: 'DELETE' }),
  memories: () => api<T.AIMemory[]>('/ai/memories'),
  deleteMemory: (id: string) => api<void>(`/ai/memories/${id}`, { method: 'DELETE' }),
};

export const careApi = {
  lookup: (code: string) =>
    api<{ doctor_id: string; full_name: string | null; specialty: string | null }>(
      `/doctors/lookup${qs({ code })}`
    ),
  request: (doctor_code: string) =>
    api<T.Connection>('/connections', { method: 'POST', body: { doctor_code } }),
  connections: () => api<T.Connection[]>('/connections'),
  respond: (id: string, accept: boolean) =>
    api<T.Connection>(`/connections/${id}/respond`, { method: 'POST', body: { accept } }),
  revoke: (id: string) => api<void>(`/connections/${id}/revoke`, { method: 'POST' }),
  permissions: (id: string) => api<T.Permission[]>(`/connections/${id}/permissions`),
  grant: (id: string, category: T.ShareCategory, expires_at: string | null) =>
    api<void>(`/connections/${id}/permissions/${category}`, {
      method: 'PUT',
      body: { expires_at },
    }),
  revokeCategory: (id: string, category: T.ShareCategory) =>
    api<void>(`/connections/${id}/permissions/${category}`, { method: 'DELETE' }),
  consents: () => api<T.ConsentRecord[]>('/consents?limit=200'),
  auditTrail: () => api<T.AuditEntry[]>('/me/audit-trail?limit=200'),
};

export const doctorApi = {
  apply: (specialty: string, registration_number: string) =>
    api<T.DoctorProfile>('/doctor/application', {
      method: 'POST',
      body: { specialty, registration_number },
    }),
  profile: () => api<T.DoctorProfile>('/doctor/profile'),
  updateProfile: (specialty: string) =>
    api<T.DoctorProfile>('/doctor/profile', { method: 'PATCH', body: { specialty } }),
  patients: () => api<T.DoctorPatient[]>('/doctor/patients'),
  patientData: (pid: string, category: T.ShareCategory) =>
    api<Record<string, unknown>>(`/doctor/patients/${pid}/data/${category}`),
  documentUrl: (recordId: string) =>
    api<{ url: string; expires_in_seconds: number }>(`/doctor/documents/${recordId}`),
};
