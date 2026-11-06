-- NEURIX migration 3/7: new tables for health records and medical history.

create table public.health_records (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  record_type     text not null,
  title           text not null,
  description     text,
  record_date     date,
  provider_name   text,
  -- Optional attached document in the private "medical-documents" bucket.
  -- Path convention: <patient_id>/<file name>. Enforced below and by storage policies.
  storage_path    text unique,
  mime_type       text,
  file_size_bytes bigint,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint health_records_type_check check (record_type in (
    'lab_result', 'prescription', 'imaging', 'diagnosis', 'vaccination',
    'clinical_note', 'discharge_summary', 'referral', 'other')),
  constraint health_records_title_length check (char_length(title) between 1 and 200),
  constraint health_records_description_length check (description is null or char_length(description) <= 10000),
  constraint health_records_storage_path_owner check (
    storage_path is null or split_part(storage_path, '/', 1) = patient_id::text),
  constraint health_records_file_size_check check (file_size_bytes is null or file_size_bytes > 0)
);
comment on table public.health_records is 'Patient medical records, optionally with a document in storage. Shareable under category medical_records.';
create index health_records_patient_date_idx on public.health_records (patient_id, record_date desc);
alter table public.health_records enable row level security;

create table public.medical_history (
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  entry_type    text not null,
  name          text not null,
  status        text not null default 'active',
  severity      text,
  onset_date    date,
  resolved_date date,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint medical_history_type_check check (entry_type in (
    'condition', 'allergy', 'medication', 'surgery', 'procedure',
    'family_history', 'immunization', 'other')),
  constraint medical_history_status_check check (status in ('active', 'resolved', 'inactive')),
  constraint medical_history_severity_check check (severity is null or severity in ('mild', 'moderate', 'severe')),
  constraint medical_history_dates_check check (resolved_date is null or onset_date is null or resolved_date >= onset_date),
  constraint medical_history_name_length check (char_length(name) between 1 and 200),
  constraint medical_history_notes_length check (notes is null or char_length(notes) <= 10000)
);
comment on table public.medical_history is 'Conditions, allergies, medications, surgeries. Shareable under category medical_history.';
create index medical_history_patient_idx on public.medical_history (patient_id, entry_type);
alter table public.medical_history enable row level security;
