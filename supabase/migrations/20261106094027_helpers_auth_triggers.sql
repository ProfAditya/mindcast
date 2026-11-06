-- NEURIX migration 4/7: helper functions, auth trigger, guards, updated_at triggers.
--
-- All helpers live in schema "private", which the Data API does not expose, so
-- they cannot be called as RPC endpoints. SECURITY DEFINER helpers run as the
-- table owner (postgres), so RLS policies that call them never recurse.
-- Every function pins search_path = '' and schema-qualifies every object.

------------------------------------------------------------------------------
-- updated_at maintenance
------------------------------------------------------------------------------
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'doctor_profiles', 'doctor_patient_links', 'sharing_permissions',
    'mood_entries', 'journal_entries', 'daily_wellbeing_logs', 'ai_conversations',
    'ai_memories', 'reminders', 'wellness_experiments', 'health_records', 'medical_history']
  loop
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function private.set_updated_at()', t);
  end loop;
end;
$$;

------------------------------------------------------------------------------
-- Authorization helpers (read-only, used by RLS policies)
------------------------------------------------------------------------------
-- Role comes from public.profiles.role, never from JWT user_metadata.
create or replace function private.current_app_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.role from public.profiles p where p.id = (select auth.uid());
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.role = 'admin' from public.profiles p where p.id = (select auth.uid())),
    false);
$$;

create or replace function private.is_verified_doctor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.doctor_profiles d
    where d.id = (select auth.uid()) and d.verification_status = 'verified');
$$;

-- The single gate for doctor access to patient data. All of these must hold:
-- verified doctor, approved connection, explicit grant for this category,
-- grant not revoked, grant not expired.
create or replace function private.doctor_can_view(p_patient uuid, p_category text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.doctor_patient_links l
    join public.doctor_profiles d     on d.id = l.doctor_id
    join public.sharing_permissions s on s.link_id = l.id
    where l.patient_id = p_patient
      and l.doctor_id = (select auth.uid())
      and l.status = 'approved'
      and d.verification_status = 'verified'
      and s.category = p_category
      and s.can_view
      and s.revoked_at is null
      and (s.expires_at is null or s.expires_at > now()));
$$;

-- True when the caller and p_other are the two parties of a pending or approved connection.
create or replace function private.is_care_party(p_other uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.doctor_patient_links l
    where l.status in ('pending', 'approved')
      and (   (l.patient_id = (select auth.uid()) and l.doctor_id  = p_other)
           or (l.doctor_id  = (select auth.uid()) and l.patient_id = p_other)));
$$;

create or replace function private.is_link_party(p_link uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.doctor_patient_links l
    where l.id = p_link
      and (l.patient_id = (select auth.uid()) or l.doctor_id = (select auth.uid())));
$$;

create or replace function private.try_uuid(p_text text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
begin
  return p_text::uuid;
exception when others then
  return null;
end;
$$;

------------------------------------------------------------------------------
-- Audit writer. Not granted to authenticated: clients cannot forge entries.
------------------------------------------------------------------------------
create or replace function private.write_audit(
  p_action        text,
  p_resource_type text,
  p_resource_id   text,
  p_patient_id    uuid,
  p_details       jsonb default '{}'::jsonb)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.audit_logs (actor_id, patient_id, action, resource_type, resource_id, details)
  values ((select auth.uid()), p_patient_id, p_action, p_resource_type, p_resource_id,
          coalesce(p_details, '{}'::jsonb));
$$;

------------------------------------------------------------------------------
-- Profile creation on sign-up. Role is ALWAYS 'patient'; metadata is used only
-- for the display name and never for authorization.
------------------------------------------------------------------------------
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 200))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

------------------------------------------------------------------------------
-- Privilege guards (defence in depth on top of column-level grants)
------------------------------------------------------------------------------
create or replace function private.guard_profile_privileges()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' and new.role <> 'patient' then
      raise exception 'role can only be assigned by an administrator' using errcode = '42501';
    end if;
    if tg_op = 'UPDATE' and (new.role is distinct from old.role or new.id is distinct from old.id) then
      raise exception 'role can only be changed by an administrator' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger guard_profile_privileges
  before insert or update on public.profiles
  for each row execute function private.guard_profile_privileges();

create or replace function private.guard_doctor_verification()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.verification_status := 'pending';
      new.verified_at         := null;
      new.verified_by         := null;
      new.verification_note   := null;
    elsif (new.id, new.doctor_code, new.registration_number, new.verification_status,
           new.verified_at, new.verified_by, new.verification_note)
          is distinct from
          (old.id, old.doctor_code, old.registration_number, old.verification_status,
           old.verified_at, old.verified_by, old.verification_note) then
      raise exception 'verification fields can only be changed by an administrator' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger guard_doctor_verification
  before insert or update on public.doctor_profiles
  for each row execute function private.guard_doctor_verification();

-- Audit rows are immutable. The only permitted update is the FK's
-- ON DELETE SET NULL of actor_id / patient_id when an account is deleted.
create or replace function private.guard_audit_log()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'audit log entries cannot be deleted' using errcode = '42501';
  end if;
  if  new.id = old.id
  and new.created_at = old.created_at
  and new.action = old.action
  and new.resource_type = old.resource_type
  and new.resource_id is not distinct from old.resource_id
  and new.details = old.details
  and (new.actor_id   is not distinct from old.actor_id   or new.actor_id   is null)
  and (new.patient_id is not distinct from old.patient_id or new.patient_id is null) then
    return new;
  end if;
  raise exception 'audit log entries are immutable' using errcode = '42501';
end;
$$;

create trigger guard_audit_log
  before update or delete on public.audit_logs
  for each row execute function private.guard_audit_log();

-- Keep a conversation's updated_at current when a message is added.
create or replace function private.touch_conversation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.ai_conversations
     set updated_at = now()
   where id = new.conversation_id and patient_id = new.patient_id;
  return new;
end;
$$;

create trigger touch_conversation
  after insert on public.ai_messages
  for each row execute function private.touch_conversation();

------------------------------------------------------------------------------
-- Function privileges
------------------------------------------------------------------------------
revoke all on all functions in schema private from public, anon, authenticated;

grant execute on function
  private.is_valid_timezone(text),
  private.current_app_role(),
  private.is_admin(),
  private.is_verified_doctor(),
  private.doctor_can_view(uuid, text),
  private.is_care_party(uuid),
  private.is_link_party(uuid),
  private.try_uuid(text)
to authenticated, service_role;

grant execute on function private.write_audit(text, text, text, uuid, jsonb) to service_role;

-- Supabase Auth inserts into auth.users as supabase_auth_admin.
grant usage on schema private to supabase_auth_admin;
grant execute on function private.handle_new_user() to supabase_auth_admin;
