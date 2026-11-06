-- NEURIX migration 6/7: least-privilege grants and RLS policies.
--
-- Access model
--   patient : full CRUD on their own rows (patient_id = auth.uid()).
--   doctor  : read-only, and only through private.doctor_can_view(), which requires
--             verified doctor + approved connection + unrevoked, unexpired grant
--             for that table's data category.
--   admin   : manages roles, doctor verification and the audit log. Admins get NO
--             blanket access to patient clinical data.
--   anon    : no access to any table.
-- RLS stays enabled on every table (never disabled).

------------------------------------------------------------------------------
-- 1. Remove broad grants
------------------------------------------------------------------------------
revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;
revoke truncate, trigger, references on all tables in schema public from service_role;
revoke all on all sequences in schema public from anon;

-- Future tables/functions created by postgres in public get the same treatment.
alter default privileges for role postgres in schema public revoke all on tables from anon;
alter default privileges for role postgres in schema public revoke truncate, trigger, references on tables from authenticated, service_role;
alter default privileges for role postgres in schema public revoke all on sequences from anon;
alter default privileges for role postgres in schema public revoke execute on functions from public, anon;

------------------------------------------------------------------------------
-- 2. Grants to authenticated (RLS then narrows rows)
------------------------------------------------------------------------------
grant select, insert, update, delete on
  public.mood_entries, public.journal_entries, public.habit_entries,
  public.daily_wellbeing_logs, public.assessment_results, public.reminders,
  public.wellness_experiments, public.experiment_checkins,
  public.ai_conversations, public.ai_messages, public.ai_memories,
  public.health_records, public.medical_history
to authenticated;

-- AI summaries are produced server-side (service_role); patients can read and delete them.
grant select, delete on public.ai_summaries, public.ai_summary_sources to authenticated;

-- Profiles: rows are created by the auth trigger; only display fields are editable.
grant select on public.profiles to authenticated;
grant update (full_name, date_of_birth) on public.profiles to authenticated;

-- Doctor application: a user may create their own pending profile and edit specialty.
grant select on public.doctor_profiles to authenticated;
grant insert (id, specialty, registration_number) on public.doctor_profiles to authenticated;
grant update (specialty) on public.doctor_profiles to authenticated;

-- Connections, sharing grants and audit rows are written only via RPC functions.
grant select on public.doctor_patient_links, public.sharing_permissions, public.audit_logs to authenticated;
grant select, insert on public.consent_records to authenticated;

------------------------------------------------------------------------------
-- 3. Patient-owned tables: owner CRUD + consent-gated doctor read
------------------------------------------------------------------------------
do $$
declare
  r record;
begin
  for r in
    select * from (values
      ('mood_entries',          'mood_wellbeing'),
      ('assessment_results',    'assessments'),
      ('habit_entries',         'sleep_habits'),
      ('daily_wellbeing_logs',  'lifestyle'),
      ('health_records',        'medical_records'),
      ('medical_history',       'medical_history'),
      ('wellness_experiments',  'wellness_experiments'),
      ('experiment_checkins',   'wellness_experiments'),
      ('ai_summaries',          'ai_summaries'),
      ('ai_summary_sources',    'ai_summaries'),
      -- private by design: never visible to doctors
      ('journal_entries',       null),
      ('ai_conversations',      null),
      ('ai_messages',           null),
      ('ai_memories',           null),
      ('reminders',             null)
    ) as t(tbl, category)
  loop
    if r.category is null then
      execute format(
        'create policy %I on public.%I for select to authenticated
           using (patient_id = (select auth.uid()))',
        r.tbl || ': owner read', r.tbl);
    else
      execute format(
        'create policy %I on public.%I for select to authenticated
           using (patient_id = (select auth.uid())
                  or private.doctor_can_view(patient_id, %L))',
        r.tbl || ': owner or consented doctor read', r.tbl, r.category);
    end if;

    execute format(
      'create policy %I on public.%I for delete to authenticated
         using (patient_id = (select auth.uid()))',
      r.tbl || ': owner delete', r.tbl);

    if r.tbl not in ('ai_summaries', 'ai_summary_sources') then
      execute format(
        'create policy %I on public.%I for insert to authenticated
           with check (patient_id = (select auth.uid()))',
        r.tbl || ': owner insert', r.tbl);
      execute format(
        'create policy %I on public.%I for update to authenticated
           using (patient_id = (select auth.uid()))
           with check (patient_id = (select auth.uid()))',
        r.tbl || ': owner update', r.tbl);
    end if;
  end loop;
end;
$$;

------------------------------------------------------------------------------
-- 4. Identity tables
------------------------------------------------------------------------------
create policy "profiles: self, connected party or admin read" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or private.is_care_party(id) or private.is_admin());

create policy "profiles: self update" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "doctor_profiles: self, connected party or admin read" on public.doctor_profiles
  for select to authenticated
  using (id = (select auth.uid()) or private.is_care_party(id) or private.is_admin());

create policy "doctor_profiles: self apply" on public.doctor_profiles
  for insert to authenticated
  with check (id = (select auth.uid()));

create policy "doctor_profiles: self update" on public.doctor_profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

------------------------------------------------------------------------------
-- 5. Connections, sharing, consent, audit
------------------------------------------------------------------------------
create policy "doctor_patient_links: party or admin read" on public.doctor_patient_links
  for select to authenticated
  using (patient_id = (select auth.uid()) or doctor_id = (select auth.uid()) or private.is_admin());

create policy "sharing_permissions: party or admin read" on public.sharing_permissions
  for select to authenticated
  using (private.is_link_party(link_id) or private.is_admin());

create policy "consent_records: patient, doctor or admin read" on public.consent_records
  for select to authenticated
  using (patient_id = (select auth.uid()) or doctor_id = (select auth.uid()) or private.is_admin());

-- Patients may record app-level consents themselves. Connection and data-sharing
-- consents are written only by the RPC functions.
create policy "consent_records: patient records app consent" on public.consent_records
  for insert to authenticated
  with check (
        patient_id = (select auth.uid())
    and doctor_id is null
    and link_id is null
    and category is null
    and consent_type in ('terms_of_service', 'privacy_policy', 'ai_processing', 'research'));

create policy "audit_logs: admin or subject patient read" on public.audit_logs
  for select to authenticated
  using (private.is_admin() or patient_id = (select auth.uid()));
