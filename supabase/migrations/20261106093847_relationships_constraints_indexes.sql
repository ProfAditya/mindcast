-- NEURIX migration 2/7: foreign keys, unique/check constraints and indexes.

------------------------------------------------------------------------------
-- Private schema for helpers. It is NOT exposed through the Data API.
------------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

create or replace function private.is_valid_timezone(tz text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (select 1 from pg_catalog.pg_timezone_names where name = tz);
$$;
revoke all on function private.is_valid_timezone(text) from public;
grant execute on function private.is_valid_timezone(text) to authenticated, service_role;

------------------------------------------------------------------------------
-- Identity: profiles <-> auth.users, doctor_profiles <-> profiles
------------------------------------------------------------------------------
alter table public.profiles
  add constraint profiles_id_fkey foreign key (id) references auth.users (id) on delete cascade,
  add constraint profiles_role_check check (role in ('patient', 'doctor', 'admin')),
  add constraint profiles_full_name_length check (char_length(full_name) <= 200),
  add constraint profiles_date_of_birth_range check (date_of_birth is null or date_of_birth between date '1900-01-01' and current_date);

alter table public.doctor_profiles
  add constraint doctor_profiles_id_fkey foreign key (id) references public.profiles (id) on delete cascade,
  add constraint doctor_profiles_verified_by_fkey foreign key (verified_by) references public.profiles (id) on delete set null,
  add constraint doctor_profiles_doctor_code_key unique (doctor_code),
  add constraint doctor_profiles_registration_number_key unique (registration_number),
  add constraint doctor_profiles_doctor_code_format check (doctor_code ~ '^[A-Z0-9]{6,16}$'),
  add constraint doctor_profiles_status_check check (verification_status in ('pending', 'verified', 'rejected', 'suspended')),
  add constraint doctor_profiles_verified_at_check check (verification_status <> 'verified' or verified_at is not null);
create index doctor_profiles_verified_by_idx on public.doctor_profiles (verified_by);

------------------------------------------------------------------------------
-- Doctor-patient connections and sharing permissions
------------------------------------------------------------------------------
alter table public.doctor_patient_links
  add constraint doctor_patient_links_patient_id_fkey foreign key (patient_id) references public.profiles (id) on delete cascade,
  add constraint doctor_patient_links_doctor_id_fkey  foreign key (doctor_id)  references public.doctor_profiles (id) on delete cascade,
  add constraint doctor_patient_links_revoked_by_fkey foreign key (revoked_by) references public.profiles (id) on delete set null,
  add constraint doctor_patient_links_patient_doctor_key unique (patient_id, doctor_id),
  add constraint doctor_patient_links_not_self check (patient_id <> doctor_id),
  add constraint doctor_patient_links_status_check check (status in ('pending', 'approved', 'rejected', 'revoked')),
  add constraint doctor_patient_links_approved_at_check check (status <> 'approved' or approved_at is not null),
  add constraint doctor_patient_links_revoked_at_check check (status <> 'revoked' or revoked_at is not null);
create index doctor_patient_links_doctor_id_idx  on public.doctor_patient_links (doctor_id);
create index doctor_patient_links_revoked_by_idx on public.doctor_patient_links (revoked_by);

alter table public.sharing_permissions
  add constraint sharing_permissions_link_id_fkey foreign key (link_id) references public.doctor_patient_links (id) on delete cascade,
  add constraint sharing_permissions_link_category_key unique (link_id, category),
  add constraint sharing_permissions_category_check check (category in (
    'medical_records', 'medical_history', 'assessments', 'mood_wellbeing',
    'sleep_habits', 'lifestyle', 'wellness_experiments', 'ai_summaries')),
  add constraint sharing_permissions_granted_check check (not can_view or granted_at is not null),
  add constraint sharing_permissions_expiry_check check (expires_at is null or granted_at is null or expires_at > granted_at);

------------------------------------------------------------------------------
-- Patient-owned tracking data
------------------------------------------------------------------------------
alter table public.mood_entries
  add constraint mood_entries_patient_id_fkey foreign key (patient_id) references public.profiles (id) on delete cascade,
  add constraint mood_entries_scores_range check (
        (mood_score    is null or mood_score    between 0 and 10)
    and (energy_score  is null or energy_score  between 0 and 10)
    and (stress_score  is null or stress_score  between 0 and 10)
    and (anxiety_score is null or anxiety_score between 0 and 10)),
  add constraint mood_entries_note_length check (note is null or char_length(note) <= 5000);
create index mood_entries_patient_recorded_idx on public.mood_entries (patient_id, recorded_at desc);

alter table public.journal_entries
  add constraint journal_entries_patient_id_fkey foreign key (patient_id) references public.profiles (id) on delete cascade,
  add constraint journal_entries_title_length check (title is null or char_length(title) <= 200),
  add constraint journal_entries_text_length check (entry_text is null or char_length(entry_text) <= 100000);
create index journal_entries_patient_created_idx on public.journal_entries (patient_id, created_at desc);

alter table public.habit_entries
  add constraint habit_entries_patient_id_fkey foreign key (patient_id) references public.profiles (id) on delete cascade,
  add constraint habit_entries_name_length check (char_length(habit_name) between 1 and 100),
  add constraint habit_entries_value_check check (value is null or value >= 0),
  add constraint habit_entries_note_length check (note is null or char_length(note) <= 2000);
create index habit_entries_patient_logged_idx on public.habit_entries (patient_id, logged_at desc);

alter table public.daily_wellbeing_logs
  add constraint daily_wellbeing_logs_patient_id_fkey foreign key (patient_id) references public.profiles (id) on delete cascade,
  add constraint daily_wellbeing_logs_patient_date_key unique (patient_id, log_date),
  add constraint daily_wellbeing_logs_ranges check (
        (sleep_hours         is null or sleep_hours         between 0 and 24)
    and (sleep_quality_score is null or sleep_quality_score between 0 and 10)
    and (activity_minutes    is null or activity_minutes    between 0 and 1440)
    and (screen_time_minutes is null or screen_time_minutes between 0 and 1440)
    and (outdoor_minutes     is null or outdoor_minutes     between 0 and 1440)
    and (water_intake_ml     is null or water_intake_ml     between 0 and 20000));

alter table public.assessment_results
  add constraint assessment_results_patient_id_fkey foreign key (patient_id) references public.profiles (id) on delete cascade,
  add constraint assessment_results_type_length check (char_length(assessment_type) between 1 and 100);
create index assessment_results_patient_completed_idx on public.assessment_results (patient_id, completed_at desc);

alter table public.reminders
  add constraint reminders_patient_id_fkey foreign key (patient_id) references public.profiles (id) on delete cascade,
  add constraint reminders_title_length check (char_length(title) between 1 and 200),
  add constraint reminders_recurrence_check check (recurrence in ('none', 'daily', 'weekdays', 'weekly', 'monthly')),
  add constraint reminders_timezone_valid check (private.is_valid_timezone(timezone));
create index reminders_patient_idx on public.reminders (patient_id);

alter table public.wellness_experiments
  add constraint wellness_experiments_patient_id_fkey foreign key (patient_id) references public.profiles (id) on delete cascade,
  add constraint wellness_experiments_id_patient_key unique (id, patient_id),
  add constraint wellness_experiments_status_check check (status in ('planned', 'active', 'completed', 'abandoned')),
  add constraint wellness_experiments_dates_check check (end_date is null or start_date is null or end_date >= start_date),
  add constraint wellness_experiments_title_length check (char_length(title) between 1 and 200);
create index wellness_experiments_patient_idx on public.wellness_experiments (patient_id);

-- Composite FK: a check-in must belong to the same patient as its experiment.
alter table public.experiment_checkins
  add constraint experiment_checkins_patient_id_fkey foreign key (patient_id) references public.profiles (id) on delete cascade,
  add constraint experiment_checkins_experiment_fkey foreign key (experiment_id, patient_id)
    references public.wellness_experiments (id, patient_id) on delete cascade,
  add constraint experiment_checkins_experiment_date_key unique (experiment_id, checkin_date);
create index experiment_checkins_experiment_patient_idx on public.experiment_checkins (experiment_id, patient_id);
create index experiment_checkins_patient_idx on public.experiment_checkins (patient_id);

------------------------------------------------------------------------------
-- AI tables
------------------------------------------------------------------------------
alter table public.ai_conversations
  add constraint ai_conversations_patient_id_fkey foreign key (patient_id) references public.profiles (id) on delete cascade,
  add constraint ai_conversations_id_patient_key unique (id, patient_id),
  add constraint ai_conversations_title_length check (title is null or char_length(title) <= 200);
create index ai_conversations_patient_updated_idx on public.ai_conversations (patient_id, updated_at desc);

-- Composite FK: a message must belong to the same patient as its conversation.
alter table public.ai_messages
  add constraint ai_messages_patient_id_fkey foreign key (patient_id) references public.profiles (id) on delete cascade,
  add constraint ai_messages_conversation_fkey foreign key (conversation_id, patient_id)
    references public.ai_conversations (id, patient_id) on delete cascade,
  add constraint ai_messages_id_patient_key unique (id, patient_id),
  add constraint ai_messages_sender_check check (sender in ('user', 'assistant', 'system'));
create index ai_messages_conversation_patient_idx on public.ai_messages (conversation_id, patient_id);
create index ai_messages_conversation_created_idx on public.ai_messages (conversation_id, created_at);
create index ai_messages_patient_idx on public.ai_messages (patient_id);

-- Composite FK; deleting the source message only clears source_message_id.
alter table public.ai_memories
  add constraint ai_memories_patient_id_fkey foreign key (patient_id) references public.profiles (id) on delete cascade,
  add constraint ai_memories_source_message_fkey foreign key (source_message_id, patient_id)
    references public.ai_messages (id, patient_id) on delete set null (source_message_id),
  add constraint ai_memories_text_length check (char_length(memory_text) between 1 and 10000);
create index ai_memories_patient_idx on public.ai_memories (patient_id);
create index ai_memories_source_message_patient_idx on public.ai_memories (source_message_id, patient_id);

alter table public.ai_summaries
  add constraint ai_summaries_patient_id_fkey foreign key (patient_id) references public.profiles (id) on delete cascade,
  add constraint ai_summaries_id_patient_key unique (id, patient_id),
  add constraint ai_summaries_period_check check (period_end is null or period_start is null or period_end >= period_start);
create index ai_summaries_patient_generated_idx on public.ai_summaries (patient_id, generated_at desc);

-- summary_id now has a real FK. (source_table, source_record_id) is polymorphic:
-- source_table is restricted to known tables, but no FK is invented for it.
alter table public.ai_summary_sources
  add constraint ai_summary_sources_patient_id_fkey foreign key (patient_id) references public.profiles (id) on delete cascade,
  add constraint ai_summary_sources_summary_fkey foreign key (summary_id, patient_id)
    references public.ai_summaries (id, patient_id) on delete cascade,
  add constraint ai_summary_sources_unique_source unique (summary_id, source_table, source_record_id),
  add constraint ai_summary_sources_table_check check (source_table in (
    'mood_entries', 'journal_entries', 'habit_entries', 'daily_wellbeing_logs',
    'assessment_results', 'health_records', 'medical_history', 'ai_conversations',
    'ai_messages', 'wellness_experiments', 'experiment_checkins', 'reminders')),
  add constraint ai_summary_sources_record_id_length check (char_length(source_record_id) between 1 and 64);
create index ai_summary_sources_summary_patient_idx on public.ai_summary_sources (summary_id, patient_id);
create index ai_summary_sources_patient_idx on public.ai_summary_sources (patient_id);

------------------------------------------------------------------------------
-- Consent history and audit log
------------------------------------------------------------------------------
alter table public.consent_records
  add constraint consent_records_patient_id_fkey foreign key (patient_id) references public.profiles (id) on delete cascade,
  add constraint consent_records_doctor_id_fkey  foreign key (doctor_id)  references public.doctor_profiles (id) on delete set null,
  add constraint consent_records_link_id_fkey    foreign key (link_id)    references public.doctor_patient_links (id) on delete set null,
  add constraint consent_records_type_check check (consent_type in (
    'data_sharing', 'doctor_connection', 'terms_of_service', 'privacy_policy', 'ai_processing', 'research')),
  add constraint consent_records_status_check check (consent_status in ('requested', 'granted', 'denied', 'revoked')),
  add constraint consent_records_category_check check (category is null or category in (
    'medical_records', 'medical_history', 'assessments', 'mood_wellbeing',
    'sleep_habits', 'lifestyle', 'wellness_experiments', 'ai_summaries'));
create index consent_records_patient_recorded_idx on public.consent_records (patient_id, recorded_at desc);
create index consent_records_doctor_idx on public.consent_records (doctor_id);
create index consent_records_link_idx on public.consent_records (link_id);

-- actor/patient use SET NULL so audit rows survive account deletion.
-- resource_id is polymorphic (text) and intentionally has no FK.
alter table public.audit_logs
  add constraint audit_logs_actor_id_fkey   foreign key (actor_id)   references public.profiles (id) on delete set null,
  add constraint audit_logs_patient_id_fkey foreign key (patient_id) references public.profiles (id) on delete set null;
create index audit_logs_actor_idx on public.audit_logs (actor_id);
create index audit_logs_patient_created_idx on public.audit_logs (patient_id, created_at desc);
create index audit_logs_created_idx on public.audit_logs (created_at desc);
