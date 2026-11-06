-- NEURIX migration 5/7: workflow functions exposed as RPC endpoints.
--
-- Connections, data-sharing grants and admin actions are written ONLY through
-- these functions (clients get no INSERT/UPDATE grant on those tables). Each
-- function checks the caller itself, pins search_path, and writes an audit row.
-- EXECUTE is granted to authenticated only (never anon).

------------------------------------------------------------------------------
-- Doctor lookup by code (returns only non-sensitive fields of verified doctors)
------------------------------------------------------------------------------
create or replace function public.find_doctor_by_code(p_doctor_code text)
returns table (doctor_id uuid, full_name text, specialty text)
language sql
stable
security definer
set search_path = ''
as $$
  select d.id, p.full_name, d.specialty
  from public.doctor_profiles d
  join public.profiles p on p.id = d.id
  where (select auth.uid()) is not null
    and d.doctor_code = upper(btrim(p_doctor_code))
    and d.verification_status = 'verified';
$$;

------------------------------------------------------------------------------
-- Patient: request a connection with a verified doctor
------------------------------------------------------------------------------
create or replace function public.request_doctor_connection(p_doctor_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := auth.uid();
  v_doctor uuid;
  v_link   uuid;
  v_status text;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select d.id into v_doctor
  from public.doctor_profiles d
  where d.doctor_code = upper(btrim(p_doctor_code)) and d.verification_status = 'verified';
  if v_doctor is null then
    raise exception 'no verified doctor found for that code' using errcode = 'P0002';
  end if;
  if v_doctor = v_uid then
    raise exception 'you cannot connect to yourself' using errcode = '22023';
  end if;

  select l.id, l.status into v_link, v_status
  from public.doctor_patient_links l
  where l.patient_id = v_uid and l.doctor_id = v_doctor
  for update;

  if v_link is null then
    insert into public.doctor_patient_links (patient_id, doctor_id, status, requested_at)
    values (v_uid, v_doctor, 'pending', now())
    returning id into v_link;
  elsif v_status in ('rejected', 'revoked') then
    update public.doctor_patient_links
       set status = 'pending', requested_at = now(), responded_at = null,
           approved_at = null, revoked_at = null, revoked_by = null
     where id = v_link;
  else
    return v_link;  -- already pending or approved: idempotent
  end if;

  insert into public.consent_records (patient_id, doctor_id, link_id, consent_type, consent_status)
  values (v_uid, v_doctor, v_link, 'doctor_connection', 'requested');
  perform private.write_audit('connection.requested', 'doctor_patient_links', v_link::text, v_uid,
                              jsonb_build_object('doctor_id', v_doctor));
  return v_link;
end;
$$;

------------------------------------------------------------------------------
-- Doctor: accept or decline a pending request
------------------------------------------------------------------------------
create or replace function public.respond_to_connection_request(p_link_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid  uuid := auth.uid();
  v_link public.doctor_patient_links%rowtype;
begin
  select * into v_link from public.doctor_patient_links where id = p_link_id for update;
  if not found or v_link.doctor_id is distinct from v_uid then
    raise exception 'connection request not found' using errcode = 'P0002';
  end if;
  if not private.is_verified_doctor() then
    raise exception 'only verified doctors can respond to connection requests' using errcode = '42501';
  end if;
  if v_link.status <> 'pending' then
    raise exception 'connection is not pending' using errcode = '22023';
  end if;

  update public.doctor_patient_links
     set status       = case when p_accept then 'approved' else 'rejected' end,
         responded_at = now(),
         approved_at  = case when p_accept then now() end
   where id = p_link_id;

  insert into public.consent_records (patient_id, doctor_id, link_id, consent_type, consent_status, details)
  values (v_link.patient_id, v_uid, p_link_id, 'doctor_connection',
          case when p_accept then 'granted' else 'denied' end,
          jsonb_build_object('responded_by', 'doctor'));
  perform private.write_audit(
    case when p_accept then 'connection.approved' else 'connection.rejected' end,
    'doctor_patient_links', p_link_id::text, v_link.patient_id, '{}'::jsonb);
end;
$$;

------------------------------------------------------------------------------
-- Patient or doctor: end a connection. Revokes every sharing grant on it.
------------------------------------------------------------------------------
create or replace function public.revoke_doctor_connection(p_link_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid  uuid := auth.uid();
  v_link public.doctor_patient_links%rowtype;
begin
  select * into v_link from public.doctor_patient_links where id = p_link_id for update;
  if not found or v_uid is null or v_uid not in (v_link.patient_id, v_link.doctor_id) then
    raise exception 'connection not found' using errcode = 'P0002';
  end if;
  if v_link.status not in ('pending', 'approved') then
    return;  -- already ended: idempotent
  end if;

  update public.doctor_patient_links
     set status = 'revoked', revoked_at = now(), revoked_by = v_uid
   where id = p_link_id;

  update public.sharing_permissions
     set can_view = false, revoked_at = now()
   where link_id = p_link_id and revoked_at is null;

  insert into public.consent_records (patient_id, doctor_id, link_id, consent_type, consent_status, details)
  values (v_link.patient_id, v_link.doctor_id, p_link_id, 'doctor_connection', 'revoked',
          jsonb_build_object('revoked_by', case when v_uid = v_link.patient_id then 'patient' else 'doctor' end));
  perform private.write_audit('connection.revoked', 'doctor_patient_links', p_link_id::text,
                              v_link.patient_id, '{}'::jsonb);
end;
$$;

------------------------------------------------------------------------------
-- Patient: grant / revoke read access to one data category for one connection
------------------------------------------------------------------------------
create or replace function public.grant_data_access(
  p_link_id    uuid,
  p_category   text,
  p_expires_at timestamptz default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid  uuid := auth.uid();
  v_link public.doctor_patient_links%rowtype;
  v_perm uuid;
begin
  select * into v_link from public.doctor_patient_links where id = p_link_id for update;
  if not found or v_link.patient_id is distinct from v_uid then
    raise exception 'connection not found' using errcode = 'P0002';
  end if;
  if v_link.status <> 'approved' then
    raise exception 'data can only be shared on an approved connection' using errcode = '22023';
  end if;
  if p_category not in ('medical_records', 'medical_history', 'assessments', 'mood_wellbeing',
                        'sleep_habits', 'lifestyle', 'wellness_experiments', 'ai_summaries') then
    raise exception 'unknown or non-shareable data category: %', p_category using errcode = '22023';
  end if;
  if p_expires_at is not null and p_expires_at <= now() then
    raise exception 'expiry must be in the future' using errcode = '22023';
  end if;

  insert into public.sharing_permissions (link_id, category, can_view, granted_at, revoked_at, expires_at)
  values (p_link_id, p_category, true, now(), null, p_expires_at)
  on conflict (link_id, category) do update
     set can_view = true, granted_at = now(), revoked_at = null, expires_at = excluded.expires_at
  returning id into v_perm;

  insert into public.consent_records (patient_id, doctor_id, link_id, consent_type, consent_status, category, details)
  values (v_uid, v_link.doctor_id, p_link_id, 'data_sharing', 'granted', p_category,
          jsonb_build_object('expires_at', p_expires_at));
  perform private.write_audit('sharing.granted', 'sharing_permissions', v_perm::text, v_uid,
                              jsonb_build_object('category', p_category, 'doctor_id', v_link.doctor_id,
                                                 'expires_at', p_expires_at));
  return v_perm;
end;
$$;

create or replace function public.revoke_data_access(p_link_id uuid, p_category text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid  uuid := auth.uid();
  v_link public.doctor_patient_links%rowtype;
  v_perm uuid;
begin
  select * into v_link from public.doctor_patient_links where id = p_link_id;
  if not found or v_link.patient_id is distinct from v_uid then
    raise exception 'connection not found' using errcode = 'P0002';
  end if;

  update public.sharing_permissions
     set can_view = false, revoked_at = now()
   where link_id = p_link_id and category = p_category and revoked_at is null
  returning id into v_perm;

  if v_perm is null then
    return;  -- nothing active to revoke: idempotent
  end if;

  insert into public.consent_records (patient_id, doctor_id, link_id, consent_type, consent_status, category)
  values (v_uid, v_link.doctor_id, p_link_id, 'data_sharing', 'revoked', p_category);
  perform private.write_audit('sharing.revoked', 'sharing_permissions', v_perm::text, v_uid,
                              jsonb_build_object('category', p_category, 'doctor_id', v_link.doctor_id));
end;
$$;

------------------------------------------------------------------------------
-- Admin: doctor verification. The ONLY way a user obtains the doctor role.
------------------------------------------------------------------------------
create or replace function public.admin_verify_doctor(
  p_doctor_id uuid,
  p_status    text,
  p_note      text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_old text;
begin
  if not private.is_admin() then
    raise exception 'administrator privileges required' using errcode = '42501';
  end if;
  if p_status not in ('pending', 'verified', 'rejected', 'suspended') then
    raise exception 'invalid verification status: %', p_status using errcode = '22023';
  end if;
  if p_doctor_id = v_uid then
    raise exception 'administrators cannot verify themselves' using errcode = '42501';
  end if;

  select verification_status into v_old from public.doctor_profiles where id = p_doctor_id for update;
  if not found then
    raise exception 'doctor profile not found' using errcode = 'P0002';
  end if;

  update public.doctor_profiles
     set verification_status = p_status,
         verified_at         = case when p_status = 'verified' then now() else verified_at end,
         verified_by         = v_uid,
         verification_note   = p_note
   where id = p_doctor_id;

  if p_status = 'verified' then
    update public.profiles set role = 'doctor' where id = p_doctor_id and role = 'patient';
  else
    update public.profiles set role = 'patient' where id = p_doctor_id and role = 'doctor';
  end if;

  perform private.write_audit('admin.doctor_verification', 'doctor_profiles', p_doctor_id::text, null,
                              jsonb_build_object('old_status', v_old, 'new_status', p_status, 'note', p_note));
end;
$$;

------------------------------------------------------------------------------
-- Admin: grant or remove the admin role.
------------------------------------------------------------------------------
create or replace function public.admin_set_user_role(p_user_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old text;
begin
  if not private.is_admin() then
    raise exception 'administrator privileges required' using errcode = '42501';
  end if;
  if p_role not in ('patient', 'admin') then
    raise exception 'the doctor role is granted only through admin_verify_doctor' using errcode = '22023';
  end if;

  select role into v_old from public.profiles where id = p_user_id for update;
  if not found then
    raise exception 'user not found' using errcode = 'P0002';
  end if;
  if v_old = 'doctor' then
    raise exception 'suspend the doctor with admin_verify_doctor before changing their role' using errcode = '22023';
  end if;
  if v_old = 'admin' and p_role <> 'admin'
     and (select count(*) from public.profiles where role = 'admin') <= 1 then
    raise exception 'cannot remove the last administrator' using errcode = '22023';
  end if;
  if v_old = p_role then
    return;
  end if;

  update public.profiles set role = p_role where id = p_user_id;

  perform private.write_audit('admin.role_change', 'profiles', p_user_id::text, null,
                              jsonb_build_object('old_role', v_old, 'new_role', p_role));
end;
$$;

------------------------------------------------------------------------------
-- RPC privileges: authenticated only
------------------------------------------------------------------------------
revoke all on function
  public.find_doctor_by_code(text),
  public.request_doctor_connection(text),
  public.respond_to_connection_request(uuid, boolean),
  public.revoke_doctor_connection(uuid),
  public.grant_data_access(uuid, text, timestamptz),
  public.revoke_data_access(uuid, text),
  public.admin_verify_doctor(uuid, text, text),
  public.admin_set_user_role(uuid, text)
from public, anon;

grant execute on function
  public.find_doctor_by_code(text),
  public.request_doctor_connection(text),
  public.respond_to_connection_request(uuid, boolean),
  public.revoke_doctor_connection(uuid),
  public.grant_data_access(uuid, text, timestamptz),
  public.revoke_data_access(uuid, text),
  public.admin_verify_doctor(uuid, text, text),
  public.admin_set_user_role(uuid, text)
to authenticated, service_role;
