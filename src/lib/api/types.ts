// Response and request shapes of the neurix-api Edge Function (see routes/*.ts in neurix__backend).

export interface Page<T> {
  items: T[];
  limit: number;
  offset: number;
}

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  date_of_birth: string | null;
  role: 'patient' | 'doctor' | 'admin' | string;
  created_at: string;
  updated_at: string;
  doctor: {
    verification_status: 'pending' | 'verified' | 'rejected' | 'suspended';
    doctor_code: string | null;
    specialty: string | null;
  } | null;
}

export const RECORD_TYPES = [
  'lab_result',
  'prescription',
  'imaging',
  'diagnosis',
  'vaccination',
  'clinical_note',
  'discharge_summary',
  'referral',
  'other',
] as const;
export type RecordType = (typeof RECORD_TYPES)[number];
export interface HealthRecord {
  id: string;
  record_type: RecordType;
  title: string;
  description: string | null;
  record_date: string | null;
  provider_name: string | null;
  has_document: boolean;
  mime_type: string | null;
  file_size_bytes: number | null;
  created_at: string;
  updated_at: string;
}

export const HISTORY_TYPES = [
  'condition',
  'allergy',
  'medication',
  'surgery',
  'procedure',
  'family_history',
  'immunization',
  'other',
] as const;
export type HistoryType = (typeof HISTORY_TYPES)[number];
export type HistoryStatus = 'active' | 'resolved' | 'inactive';
export type Severity = 'mild' | 'moderate' | 'severe';
export interface HistoryEntry {
  id: string;
  entry_type: HistoryType;
  name: string;
  status: HistoryStatus;
  severity: Severity | null;
  onset_date: string | null;
  resolved_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const MOOD_LABELS = ['great', 'good', 'okay', 'low', 'struggling'] as const;
export type MoodLabel = (typeof MOOD_LABELS)[number];
export interface MoodEntry {
  id: string;
  mood_label: MoodLabel | null;
  mood_score: number | null;
  energy_score: number | null;
  stress_score: number | null;
  anxiety_score: number | null;
  note: string | null;
  recorded_at: string;
  created_at: string;
}

export const HABIT_NAMES = [
  'sleep',
  'water',
  'exercise',
  'meditation',
  'reading',
  'screen_time',
  'outdoor',
  'caffeine',
] as const;
export type HabitName = (typeof HABIT_NAMES)[number];
export interface HabitEntry {
  id: string;
  habit_name: HabitName;
  value: string | number | null;
  unit: string | null;
  completed: boolean;
  note: string | null;
  logged_at: string;
}

export interface WellbeingLog {
  id: string;
  log_date: string;
  sleep_hours: string | number | null;
  sleep_quality_score: string | number | null;
  activity_minutes: number | null;
  screen_time_minutes: number | null;
  outdoor_minutes: number | null;
  water_intake_ml: number | null;
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: number;
  title: string | null;
  prompt: string | null;
  entry_text: string;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  title: string;
  reminder_type: string;
  scheduled_at: string | null;
  timezone: string;
  recurrence: 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly';
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Overview {
  period: { start: string; end_exclusive: string; days: number };
  active_days: number;
  mood: {
    entries: number;
    avg_mood_score: number | null;
    avg_energy_score: number | null;
    avg_stress_score: number | null;
    avg_anxiety_score: number | null;
    labels: Record<string, number>;
  };
  habits: {
    habit_name: string;
    entries: number;
    completed: number;
    completion_rate: number;
    total_value: number | null;
  }[];
  wellbeing: {
    days_logged: number;
    avg_sleep_hours: number | null;
    avg_sleep_quality: number | null;
    avg_activity_minutes: number | null;
    avg_screen_time_minutes: number | null;
    avg_outdoor_minutes: number | null;
    avg_water_intake_ml: number | null;
  };
  digital: {
    total_minutes: number;
    avg_minutes_per_day: number;
    by_type: { activity_type: string; minutes: number; days: number }[];
  };
  journal: { entries: number };
  latest_assessments: {
    instrument: string;
    total_score: number | null;
    severity: string | null;
    safety_flag: boolean;
    completed_at: string;
  }[];
}

export interface Instrument {
  code: 'phq9' | 'gad7' | 'who5';
  name: string;
  version: string;
  instructions: string;
  items: { id: string; text: string }[];
  options: { value: number; label: string }[];
}
export interface AssessmentResult {
  id: string;
  assessment_type: string;
  answers: Record<string, number>;
  category_scores: Record<string, unknown>;
  result: {
    instrument: string;
    instrument_version: string;
    total_score: number;
    max_score: number;
    severity: string;
    disclaimer: string;
    safety_flag: boolean;
    safety_message?: string;
    percentage_score?: number;
  };
  completed_at: string;
  created_at: string;
}

export interface AIMeta {
  source: 'gemini' | 'openai' | 'safety_rule' | 'provider_block' | string;
  ai_generated: boolean;
  model: string | null;
  generated_at: string;
  data_used: string[];
  scopes_used: string[];
  limitations: string[];
  safety_flag: boolean;
  safety_note: string | null;
  filtered: boolean;
}
export interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}
export interface Message {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  metadata: Partial<AIMeta> | null;
  created_at: string;
}
export interface ConsentStatus {
  scopes: Record<'general' | 'journal_entries' | 'medical', boolean>;
  texts: Record<string, string>;
  version: string;
  provider?: string;
}

export const SHARE_CATEGORIES = [
  'medical_records',
  'medical_history',
  'assessments',
  'mood_wellbeing',
  'sleep_habits',
  'lifestyle',
  'wellness_experiments',
  'ai_summaries',
  'digital_behaviour',
] as const;
export type ShareCategory = (typeof SHARE_CATEGORIES)[number];
export interface ActivePermission {
  category: ShareCategory;
  granted_at: string | null;
  expires_at: string | null;
}
export interface Connection {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'revoked';
  requested_at: string;
  responded_at: string | null;
  approved_at: string | null;
  revoked_at: string | null;
  my_role: 'patient' | 'doctor';
  other_party_id: string;
  other_party_name: string | null;
  doctor_specialty: string | null;
  active_permissions: ActivePermission[];
}
export interface Permission {
  category: ShareCategory;
  can_view: boolean;
  granted_at: string | null;
  revoked_at: string | null;
  expires_at: string | null;
  active: boolean;
}
export interface ConsentRecord {
  id: string;
  consent_type: string;
  consent_status: string;
  category: string | null;
  doctor_id: string | null;
  link_id: string | null;
  details: Record<string, unknown>;
  recorded_at: string;
}
export interface AuditEntry {
  id: number | string;
  created_at: string;
  actor_id: string | null;
  patient_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  details: Record<string, unknown>;
}
export interface DoctorProfile {
  id: string;
  doctor_code: string | null;
  specialty: string;
  registration_number: string;
  verification_status: string;
  verified_at: string | null;
  created_at: string;
}
export interface DoctorPatient {
  link_id: string;
  patient_id: string;
  patient_name: string | null;
  status: string;
  requested_at: string;
  approved_at: string | null;
  active_permissions: ActivePermission[];
}

export const DIGITAL_TYPES = [
  'social_media',
  'video_streaming',
  'gaming',
  'news',
  'messaging',
  'productivity',
  'education',
  'other',
] as const;
export type DigitalType = (typeof DIGITAL_TYPES)[number];
export interface DigitalActivity {
  id: string;
  activity_date: string;
  source: string;
  activity_type: DigitalType;
  app_name: string | null;
  minutes: number;
  pickups: number | null;
  notifications: number | null;
  time_of_day: 'morning' | 'afternoon' | 'evening' | 'night' | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}
export interface AIMemory {
  id: string;
  memory_type: string;
  memory_text: string;
  source_message_id: string | null;
  created_at: string;
  updated_at: string;
}
export interface AISummary {
  id: number | string;
  summary_type: string;
  period_start: string;
  period_end: string;
  summary_content: { text?: string; [k: string]: unknown };
  limitations: unknown;
  generated_at: string;
}
export interface MonthlyReview {
  month: string;
  summary: Overview;
  weekly_mood: { week_start: string; avg_mood_score: number | null; entries: number }[];
  change_from_previous_month: {
    active_days: number;
    avg_mood_score: number | null;
    avg_stress_score: number | null;
    avg_sleep_hours: number | null;
    avg_digital_minutes_per_day: number | null;
  };
  note: string;
}
