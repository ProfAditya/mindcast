-- NEURIX migration 1/7: normalize table names, column names, defaults and types.
-- Non-destructive: only RENAME and ALTER COLUMN. No table or column is dropped.
-- All 19 tables were verified empty immediately before this migration, so the
-- type changes below cannot lose data.

------------------------------------------------------------------------------
-- 1. Table renames (snake_case, plural, spelling fixed, "_duplicate" removed)
------------------------------------------------------------------------------
alter table public.profile                         rename to profiles;
alter table public."Doctor profile"                rename to doctor_profiles;
alter table public."Habit enteries"                rename to habit_entries;
alter table public.daily_wellbeing_log             rename to daily_wellbeing_logs;
alter table public.journal_enteries_duplicate      rename to journal_entries;
alter table public."mood enteries_duplicate"       rename to mood_entries;
alter table public.sharing_permissions_duplicate   rename to sharing_permissions;
alter table public.assesment_result_duplicate      rename to assessment_results;
alter table public.ai_conversation                 rename to ai_conversations;

alter table public.profiles             rename constraint profile_pkey                         to profiles_pkey;
alter table public.doctor_profiles      rename constraint "Doctor profile_pkey"                to doctor_profiles_pkey;
alter table public.habit_entries        rename constraint "Habit enteries_pkey"                to habit_entries_pkey;
alter table public.daily_wellbeing_logs rename constraint daily_wellbeing_log_pkey             to daily_wellbeing_logs_pkey;
alter table public.journal_entries      rename constraint journal_enteries_duplicate_pkey      to journal_entries_pkey;
alter table public.mood_entries         rename constraint "mood enteries_duplicate_pkey"       to mood_entries_pkey;
alter table public.sharing_permissions  rename constraint sharing_permissions_duplicate_pkey   to sharing_permissions_pkey;
alter table public.assessment_results   rename constraint assesment_result_duplicate_pkey      to assessment_results_pkey;
alter table public.ai_conversations     rename constraint ai_conversation_pkey                 to ai_conversations_pkey;

------------------------------------------------------------------------------
-- 2. profiles  (id will be bound to auth.users.id in migration 2)
------------------------------------------------------------------------------
alter table public.profiles rename column "Full Name"     to full_name;
alter table public.profiles rename column "Date of Birth" to date_of_birth;
alter table public.profiles rename column "Updated at"    to updated_at;
alter table public.profiles
  alter column id         drop default,
  alter column full_name  set default '',      -- was the literal two-apostrophe string
  alter column full_name  set not null,
  alter column role       set default 'patient', -- was the literal string 'patient' WITH quotes
  alter column role       set not null,
  alter column updated_at set not null;

------------------------------------------------------------------------------
-- 3. doctor_profiles  (id = the doctor's profiles.id / auth uid)
------------------------------------------------------------------------------
alter table public.doctor_profiles
  alter column id                  set default auth.uid(),
  alter column doctor_code         set default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  alter column doctor_code         set not null,
  alter column verification_status set default 'pending',
  alter column verification_status set not null,
  add column verified_by       uuid,
  add column verification_note text,
  add column updated_at        timestamptz not null default now();

------------------------------------------------------------------------------
-- 4. doctor_patient_links
------------------------------------------------------------------------------
alter table public.doctor_patient_links rename column "paitent id"   to patient_id;
alter table public.doctor_patient_links rename column "Doctors id"   to doctor_id;
alter table public.doctor_patient_links rename column "approved at"  to approved_at;
alter table public.doctor_patient_links rename column "revoked at"   to revoked_at;
alter table public.doctor_patient_links rename column "requested at" to requested_at;
alter table public.doctor_patient_links
  alter column patient_id   drop default,   -- was gen_random_uuid()
  alter column patient_id   set not null,
  alter column doctor_id    drop default,   -- was gen_random_uuid()
  alter column doctor_id    set not null,
  alter column status       set default 'pending',
  alter column status       set not null,
  alter column requested_at set default now(),
  alter column requested_at set not null,
  add column responded_at timestamptz,
  add column revoked_by   uuid,
  add column updated_at   timestamptz not null default now();

------------------------------------------------------------------------------
-- 5. sharing_permissions
------------------------------------------------------------------------------
alter table public.sharing_permissions rename column "Data category" to category;
alter table public.sharing_permissions rename column "linked id"     to link_id;
alter table public.sharing_permissions rename column "can view"      to can_view;
alter table public.sharing_permissions rename column "granted at"    to granted_at;
alter table public.sharing_permissions rename column "revoked at"    to revoked_at;
alter table public.sharing_permissions
  alter column link_id  drop default,       -- was gen_random_uuid()
  alter column link_id  set not null,
  alter column can_view set not null,
  add column expires_at timestamptz,
  add column created_at timestamptz not null default now(),
  add column updated_at timestamptz not null default now();

------------------------------------------------------------------------------
-- 6. Patient-owned data tables
------------------------------------------------------------------------------
-- habit_entries
alter table public.habit_entries rename column paitent_id   to patient_id;
alter table public.habit_entries rename column "Habit_name" to habit_name;
alter table public.habit_entries
  alter column patient_id set default auth.uid(),  -- was gen_random_uuid()
  alter column patient_id set not null,
  alter column habit_name set not null,
  alter column completed  set default false,
  alter column completed  set not null;

-- daily_wellbeing_logs
alter table public.daily_wellbeing_logs rename column paitent_id            to patient_id;
alter table public.daily_wellbeing_logs rename column "sleep quality score" to sleep_quality_score;
alter table public.daily_wellbeing_logs rename column "Activity_min"        to activity_minutes;
alter table public.daily_wellbeing_logs rename column screentime_min        to screen_time_minutes;
alter table public.daily_wellbeing_logs
  alter column patient_id set default auth.uid(),  -- was gen_random_uuid()
  alter column patient_id set not null,
  alter column log_date   set default current_date,
  alter column log_date   set not null,
  add column updated_at timestamptz not null default now();

-- journal_entries (bigint identity PK kept as-is)
alter table public.journal_entries rename column paitent_id to patient_id;
alter table public.journal_entries
  alter column created_at set not null,
  alter column updated_at drop default,
  alter column updated_at type timestamptz using coalesce(created_at, now()),  -- was time-of-day only
  alter column updated_at set default now(),
  alter column updated_at set not null,
  add column title text;

-- mood_entries
alter table public.mood_entries rename column "mood score"    to mood_score;
alter table public.mood_entries rename column "energy score"  to energy_score;
alter table public.mood_entries rename column "stress score"  to stress_score;
alter table public.mood_entries rename column "anxiety score" to anxiety_score;
alter table public.mood_entries rename column "recorded at"   to recorded_at;
alter table public.mood_entries rename column "Paitent id"    to patient_id;
alter table public.mood_entries
  alter column patient_id  set not null,
  alter column recorded_at set not null,
  add column updated_at timestamptz not null default now();

-- assessment_results
alter table public.assessment_results rename column paitent_id     to patient_id;
alter table public.assessment_results rename column assesment_type to assessment_type;
alter table public.assessment_results rename column category_score to category_scores;
alter table public.assessment_results
  alter column assessment_type set not null,
  alter column completed_at    set default now(),
  alter column completed_at    set not null,
  add column created_at timestamptz not null default now();

-- reminders
alter table public.reminders rename column paitent_id      to patient_id;
alter table public.reminders rename column "schedule time" to scheduled_at;
alter table public.reminders
  alter column patient_id    set not null,
  alter column reminder_type set default 'custom',
  alter column reminder_type set not null,
  alter column title         set not null,
  alter column timezone      type text using null,  -- was timestamptz; now an IANA zone name
  alter column timezone      set default 'UTC',
  alter column timezone      set not null,
  alter column is_enabled    set not null,
  add column recurrence text not null default 'none',
  add column updated_at timestamptz not null default now();

-- wellness_experiments / experiment_checkins
alter table public.wellness_experiments rename column paitent_id to patient_id;
alter table public.wellness_experiments
  alter column title  set not null,
  alter column status set default 'planned',
  alter column status set not null,
  add column created_at timestamptz not null default now(),
  add column updated_at timestamptz not null default now();

alter table public.experiment_checkins rename column paitent_id to patient_id;
alter table public.experiment_checkins
  alter column patient_id   set not null,
  alter column checkin_date set default current_date,
  alter column checkin_date set not null,
  alter column created_at   set default now(),
  alter column created_at   set not null;

------------------------------------------------------------------------------
-- 7. AI tables
------------------------------------------------------------------------------
alter table public.ai_conversations rename column paitent_id to patient_id;
alter table public.ai_conversations
  alter column patient_id set not null,
  alter column updated_at set not null;

alter table public.ai_messages rename column paitent_id to patient_id;
alter table public.ai_messages
  alter column conversation_id set not null,
  alter column patient_id      set default auth.uid(),
  alter column patient_id      set not null,
  alter column sender          set not null,
  alter column content         set not null;

alter table public.ai_memories rename column paitent_id        to patient_id;
alter table public.ai_memories rename column soucre_message_id to source_message_id;
alter table public.ai_memories
  alter column patient_id  set not null,
  alter column memory_type set default 'general',
  alter column memory_type set not null,
  alter column memory_text set not null,
  alter column updated_at  set default now(),
  alter column updated_at  set not null;

alter table public.ai_summaries rename column paitent_id to patient_id;
alter table public.ai_summaries rename column limitation to limitations;
alter table public.ai_summaries
  alter column patient_id      set not null,
  alter column summary_type    set not null,
  alter column summary_content set default '{}'::jsonb,
  alter column summary_content set not null,
  alter column limitations     set default '[]'::jsonb;

-- Fix the type mismatch WITHOUT changing ai_summaries' bigint PK:
-- summary_id becomes bigint to match ai_summaries.id.
-- source_record_id becomes text because it is polymorphic (uuid- and bigint-keyed sources).
alter table public.ai_summary_sources
  alter column summary_id       drop default,                -- was gen_random_uuid()
  alter column summary_id       type bigint using null,
  alter column summary_id       set not null,
  alter column source_record_id drop default,                -- was gen_random_uuid()
  alter column source_record_id type text using source_record_id::text,
  alter column source_table     set not null,
  add column patient_id uuid not null default auth.uid(),
  add column created_at timestamptz not null default now();

------------------------------------------------------------------------------
-- 8. Consent and audit
------------------------------------------------------------------------------
alter table public.consent_records rename column paitent_id to patient_id;
alter table public.consent_records
  alter column patient_id     set not null,
  alter column consent_type   set not null,
  alter column consent_status set not null,
  alter column details        set default '{}'::jsonb,
  alter column details        set not null,
  add column link_id  uuid,
  add column category text;

alter table public.audit_logs rename column paitent_id to patient_id;
alter table public.audit_logs
  alter column action        set not null,
  alter column resource_type set not null,
  alter column resource_id   type text using resource_id::text,  -- polymorphic (uuid or bigint ids)
  add column details jsonb not null default '{}'::jsonb;

------------------------------------------------------------------------------
-- 9. Table comments
------------------------------------------------------------------------------
comment on table public.profiles             is 'One row per auth user. id = auth.users.id. role is admin-controlled.';
comment on table public.doctor_profiles      is 'Doctor application/verification record. id = the doctor''s profiles.id.';
comment on table public.doctor_patient_links is 'Doctor-patient connection. Written only through RPC functions.';
comment on table public.sharing_permissions  is 'Per-connection, per-category read grants controlled by the patient.';
comment on table public.journal_entries      is 'Private journal. Never shared with doctors.';
comment on table public.mood_entries         is 'Mood check-ins. Shareable under category mood_wellbeing.';
comment on table public.assessment_results   is 'Questionnaire results. Shareable under category assessments.';
comment on table public.habit_entries        is 'Habit and sleep-habit logs. Shareable under category sleep_habits.';
comment on table public.daily_wellbeing_logs is 'One lifestyle log per patient per day. Shareable under category lifestyle.';
comment on table public.ai_conversations     is 'Private AI conversations. Never shared with doctors.';
comment on table public.ai_summary_sources   is 'Polymorphic pointer (source_table, source_record_id) to the records a summary used. No FK by design.';
comment on table public.audit_logs           is 'Append-only audit trail. Written only by SECURITY DEFINER functions.';
