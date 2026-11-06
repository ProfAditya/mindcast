-- NEURIX security and integrity test suite.
--
-- Runs entirely inside ONE transaction and always ends by raising an exception
-- that carries the report, so every fixture (fictional users, rows, files, the
-- temporary harness schema) is rolled back. Nothing persists.
-- Identities are fictional (@example.test). No real patient data is read.
--
-- Run with: execute_sql (Supabase MCP) or psql as the postgres role.

do $test$
declare
  p1 uuid := '00000000-0000-4000-8000-0000000000a1';  -- patient 1
  p2 uuid := '00000000-0000-4000-8000-0000000000a2';  -- patient 2
  d1 uuid := '00000000-0000-4000-8000-0000000000d1';  -- doctor (will be verified)
  d2 uuid := '00000000-0000-4000-8000-0000000000d2';  -- doctor (stays pending)
  a1 uuid := '00000000-0000-4000-8000-0000000000ad';  -- admin
  res    text[] := '{}';
  n      bigint;
  link   uuid;
  conv   uuid;
  d1code text;
  d2code text;
  v      text;
  fails  int;
begin
  ----------------------------------------------------------------------------
  -- Harness (created inside the transaction, rolled back with it)
  ----------------------------------------------------------------------------
  create schema t_harness;
  create function t_harness.chk(label text, ok boolean, detail text default '')
    returns text language sql as
    $f$ select case when coalesce(ok, false) then 'PASS ' || label
                    else 'FAIL ' || label || ' [' || coalesce(detail, 'null') || ']' end $f$;
  create function t_harness.expect_error(label text, stmt text)
    returns text language plpgsql as
    $f$ begin
          execute stmt;
          return 'FAIL ' || label || ' [statement succeeded]';
        exception when others then
          return 'PASS ' || label || ' [' || sqlstate || ': ' || left(sqlerrm, 80) || ']';
        end $f$;
  create function t_harness.cnt(stmt text)
    returns bigint language plpgsql as
    $f$ declare r bigint; begin execute stmt into r; return r; end $f$;
  create function t_harness.affected(stmt text)
    returns bigint language plpgsql as
    $f$ declare r bigint; begin execute stmt; get diagnostics r = row_count; return r; end $f$;
  create function t_harness.act(uid uuid)
    returns void language plpgsql as
    $f$ begin
          execute 'reset role';
          perform set_config('request.jwt.claims',
                             json_build_object('sub', uid, 'role', 'authenticated')::text, true);
          perform set_config('request.jwt.claim.sub', uid::text, true);
          execute 'set local role authenticated';
        end $f$;
  create function t_harness.act_anon()
    returns void language plpgsql as
    $f$ begin
          execute 'reset role';
          perform set_config('request.jwt.claims', '{"role":"anon"}', true);
          perform set_config('request.jwt.claim.sub', '', true);
          execute 'set local role anon';
        end $f$;
  create function t_harness.act_postgres()
    returns void language plpgsql as
    $f$ begin
          execute 'reset role';
          perform set_config('request.jwt.claims', '', true);
          perform set_config('request.jwt.claim.sub', '', true);
        end $f$;
  grant usage on schema t_harness to authenticated, anon;
  grant execute on all functions in schema t_harness to authenticated, anon;

  ----------------------------------------------------------------------------
  -- 1. Profile creation via the auth.users trigger
  ----------------------------------------------------------------------------
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values
    ('00000000-0000-0000-0000-000000000000', p1, 'authenticated', 'authenticated', 'test.patient1@example.test', '', now(),
     '{}', '{"full_name":"Test Patient One","role":"admin"}', now(), now()),
    ('00000000-0000-0000-0000-000000000000', p2, 'authenticated', 'authenticated', 'test.patient2@example.test', '', now(),
     '{}', '{"full_name":"Test Patient Two"}', now(), now()),
    ('00000000-0000-0000-0000-000000000000', d1, 'authenticated', 'authenticated', 'test.doctor1@example.test', '', now(),
     '{}', '{"full_name":"Dr Test One"}', now(), now()),
    ('00000000-0000-0000-0000-000000000000', d2, 'authenticated', 'authenticated', 'test.doctor2@example.test', '', now(),
     '{}', '{"full_name":"Dr Test Two"}', now(), now()),
    ('00000000-0000-0000-0000-000000000000', a1, 'authenticated', 'authenticated', 'test.admin@example.test', '', now(),
     '{}', '{"full_name":"Test Admin"}', now(), now());

  select count(*) into n from public.profiles where id in (p1, p2, d1, d2, a1) and role = 'patient';
  res := res || t_harness.chk('profile: trigger created 5 profiles, all role=patient', n = 5, n::text);
  select full_name into v from public.profiles where id = p1;
  res := res || t_harness.chk('profile: display name copied from sign-up metadata', v = 'Test Patient One', v);
  select role into v from public.profiles where id = p1;
  res := res || t_harness.chk('profile: role "admin" in user metadata is ignored', v = 'patient', v);

  -- Admin bootstrap (only possible as postgres/service role, never from the app)
  update public.profiles set role = 'admin' where id = a1;

  ----------------------------------------------------------------------------
  -- 2. Role security
  ----------------------------------------------------------------------------
  perform t_harness.act(p1);
  res := res || t_harness.expect_error('role: patient cannot make self admin',
    format('update public.profiles set role = %L where id = %L', 'admin', p1));
  res := res || t_harness.expect_error('role: patient cannot insert a profile row',
    format('insert into public.profiles (id) values (%L)', gen_random_uuid()));
  n := t_harness.affected(format('update public.profiles set full_name = %L where id = %L', 'Patient One Renamed', p1));
  res := res || t_harness.chk('role: patient can edit own display name', n = 1, n::text);
  n := t_harness.affected(format('update public.profiles set full_name = %L where id = %L', 'hijack', p2));
  res := res || t_harness.chk('role: patient cannot edit another profile', n = 0, n::text);
  res := res || t_harness.expect_error('role: patient cannot call admin_verify_doctor',
    format('select public.admin_verify_doctor(%L, %L)', d1, 'verified'));
  res := res || t_harness.expect_error('role: patient cannot call admin_set_user_role',
    format('select public.admin_set_user_role(%L, %L)', p1, 'admin'));

  ----------------------------------------------------------------------------
  -- 3. Doctor application and verification
  ----------------------------------------------------------------------------
  perform t_harness.act(d2);
  res := res || t_harness.expect_error('doctor: applicant cannot insert verification_status=verified',
    $$insert into public.doctor_profiles (specialty, registration_number, verification_status)
      values ('General Practice', 'TEST-REG-0002', 'verified')$$);
  insert into public.doctor_profiles (specialty, registration_number) values ('General Practice', 'TEST-REG-0002');

  perform t_harness.act(d1);
  insert into public.doctor_profiles (specialty, registration_number) values ('Psychiatry', 'TEST-REG-0001');
  n := t_harness.cnt($$select count(*) from public.doctor_profiles where id = auth.uid() and verification_status = 'pending'$$);
  res := res || t_harness.chk('doctor: new application is pending', n = 1, n::text);
  res := res || t_harness.expect_error('doctor: applicant cannot self-verify via update',
    $$update public.doctor_profiles set verification_status = 'verified', verified_at = now() where id = auth.uid()$$);
  n := t_harness.affected($$update public.doctor_profiles set specialty = 'Clinical Psychiatry' where id = auth.uid()$$);
  res := res || t_harness.chk('doctor: applicant can edit own specialty', n = 1, n::text);

  perform t_harness.act(a1);
  perform public.admin_verify_doctor(d1, 'verified', 'fictional test verification');
  select role into v from public.profiles where id = d1;
  res := res || t_harness.chk('doctor: admin verification sets role=doctor', v = 'doctor', v);
  res := res || t_harness.expect_error('role: admin cannot hand out doctor role directly',
    format('select public.admin_set_user_role(%L, %L)', p2, 'doctor'));
  res := res || t_harness.expect_error('role: last admin cannot be removed',
    format('select public.admin_set_user_role(%L, %L)', a1, 'patient'));

  perform t_harness.act_postgres();
  select doctor_code into d1code from public.doctor_profiles where id = d1;
  select doctor_code into d2code from public.doctor_profiles where id = d2;

  ----------------------------------------------------------------------------
  -- 4. Patient ownership, constraints, storage upload
  ----------------------------------------------------------------------------
  perform t_harness.act(p1);
  insert into public.mood_entries (mood_score, energy_score, note) values (7, 6, 'fictional test mood');
  insert into public.journal_entries (title, entry_text) values ('t', 'fictional private journal');
  insert into public.habit_entries (habit_name, value, completed) values ('sleep_8h', 8, true);
  insert into public.daily_wellbeing_logs (log_date, sleep_hours) values (current_date, 7.5);
  insert into public.assessment_results (assessment_type, answers) values ('PHQ-9 (test)', '{}');
  insert into public.medical_history (entry_type, name) values ('allergy', 'Fictional pollen allergy');
  insert into public.health_records (record_type, title, storage_path)
    values ('lab_result', 'Fictional lab report', p1::text || '/report.pdf');
  insert into public.reminders (title, timezone) values ('Evening check-in', 'Asia/Kolkata');
  insert into public.ai_conversations (title) values ('test chat') returning id into conv;
  insert into public.ai_messages (conversation_id, sender, content) values (conv, 'user', 'hello');
  insert into storage.objects (bucket_id, name) values ('medical-documents', p1::text || '/report.pdf');
  res := res || 'PASS ownership: patient created own rows in 10 tables + uploaded own document';

  res := res || t_harness.expect_error('ownership: patient cannot create rows for another patient',
    format('insert into public.mood_entries (patient_id, mood_score) values (%L, 5)', p2));
  res := res || t_harness.expect_error('constraint: mood_score > 10 rejected (CHECK)',
    'insert into public.mood_entries (mood_score) values (11)');
  res := res || t_harness.expect_error('constraint: 2nd wellbeing log same day rejected (UNIQUE)',
    'insert into public.daily_wellbeing_logs (log_date) values (current_date)');
  res := res || t_harness.expect_error('constraint: invalid reminder timezone rejected',
    $$insert into public.reminders (title, timezone) values ('t', 'Mars/Olympus_Mons')$$);
  res := res || t_harness.expect_error('constraint: health record path outside own folder rejected',
    format('insert into public.health_records (record_type, title, storage_path) values (%L, %L, %L)',
           'other', 'x', p2::text || '/x.pdf'));
  res := res || t_harness.expect_error('storage: patient cannot upload into another patient folder',
    format('insert into storage.objects (bucket_id, name) values (%L, %L)', 'medical-documents', p2::text || '/x.pdf'));
  res := res || t_harness.expect_error('connection: cannot request an unverified doctor',
    format('select public.request_doctor_connection(%L)', d2code));
  link := public.request_doctor_connection(d1code);
  res := res || t_harness.expect_error('sharing: cannot share on a pending connection',
    format('select public.grant_data_access(%L, %L)', link, 'mood_wellbeing'));

  ----------------------------------------------------------------------------
  -- 5. Patient isolation
  ----------------------------------------------------------------------------
  perform t_harness.act(p2);
  n := t_harness.cnt('select count(*) from public.mood_entries')
     + t_harness.cnt('select count(*) from public.journal_entries')
     + t_harness.cnt('select count(*) from public.health_records')
     + t_harness.cnt('select count(*) from public.medical_history')
     + t_harness.cnt('select count(*) from public.ai_messages')
     + t_harness.cnt('select count(*) from public.reminders');
  res := res || t_harness.chk('isolation: patient 2 sees none of patient 1 rows (6 tables)', n = 0, n::text);
  n := t_harness.affected('update public.mood_entries set mood_score = 1')
     + t_harness.affected('delete from public.journal_entries');
  res := res || t_harness.chk('isolation: patient 2 cannot update/delete patient 1 rows', n = 0, n::text);
  n := t_harness.cnt($$select count(*) from storage.objects where bucket_id = 'medical-documents'$$);
  res := res || t_harness.chk('isolation: patient 2 cannot see patient 1 documents', n = 0, n::text);
  n := t_harness.cnt('select count(*) from public.doctor_patient_links')
     + t_harness.cnt('select count(*) from public.doctor_profiles');
  res := res || t_harness.chk('isolation: patient 2 cannot see others'' connections or doctor profiles', n = 0, n::text);
  res := res || t_harness.expect_error('connection: non-party cannot approve a request',
    format('select public.respond_to_connection_request(%L, true)', link));

  ----------------------------------------------------------------------------
  -- 6. Foreign keys and unique constraints (as postgres, bypassing RLS)
  ----------------------------------------------------------------------------
  perform t_harness.act_postgres();
  res := res || t_harness.expect_error('FK: mood entry for non-existent patient rejected',
    format('insert into public.mood_entries (patient_id, mood_score) values (%L, 5)', gen_random_uuid()));
  res := res || t_harness.expect_error('FK: message cannot attach to another patient''s conversation',
    format($$insert into public.ai_messages (conversation_id, patient_id, sender, content) values (%L, %L, 'user', 'x')$$, conv, p2));
  res := res || t_harness.expect_error('FK: summary source requires an existing summary',
    format($$insert into public.ai_summary_sources (summary_id, patient_id, source_table, source_record_id) values (999999, %L, 'mood_entries', 'x')$$, p1));
  res := res || t_harness.expect_error('FK: profile requires an auth user',
    format('insert into public.profiles (id) values (%L)', gen_random_uuid()));
  res := res || t_harness.expect_error('UNIQUE: doctor registration_number',
    format('update public.doctor_profiles set registration_number = %L where id = %L', 'TEST-REG-0001', d2));
  res := res || t_harness.expect_error('UNIQUE: one link per patient/doctor pair',
    format($$insert into public.doctor_patient_links (patient_id, doctor_id) values (%L, %L)$$, p1, d1));
  insert into public.ai_summaries (patient_id, summary_type) values (p1, 'weekly (test)');

  ----------------------------------------------------------------------------
  -- 7. Doctor access: no connection / no consent / consent / private data
  ----------------------------------------------------------------------------
  perform t_harness.act(d1);
  n := t_harness.cnt('select count(*) from public.mood_entries');
  res := res || t_harness.chk('doctor: verified doctor with only a PENDING connection sees nothing', n = 0, n::text);
  perform public.respond_to_connection_request(link, true);
  n := t_harness.cnt('select count(*) from public.mood_entries')
     + t_harness.cnt('select count(*) from public.health_records');
  res := res || t_harness.chk('doctor: approved connection WITHOUT consent sees nothing', n = 0, n::text);

  perform t_harness.act(p1);
  res := res || t_harness.expect_error('sharing: journal is not a shareable category',
    format('select public.grant_data_access(%L, %L)', link, 'journal'));
  res := res || t_harness.expect_error('sharing: expiry in the past rejected',
    format('select public.grant_data_access(%L, %L, now() - interval ''1 day'')', link, 'lifestyle'));
  perform public.grant_data_access(link, 'mood_wellbeing');
  perform public.grant_data_access(link, 'medical_records');
  perform public.grant_data_access(link, 'assessments', now() + interval '30 days');

  perform t_harness.act(d1);
  n := t_harness.cnt('select count(*) from public.mood_entries');
  res := res || t_harness.chk('doctor: consented category mood_wellbeing readable', n = 1, n::text);
  n := t_harness.cnt('select count(*) from public.health_records');
  res := res || t_harness.chk('doctor: consented category medical_records readable', n = 1, n::text);
  n := t_harness.cnt('select count(*) from public.assessment_results');
  res := res || t_harness.chk('doctor: consented category assessments readable (unexpired)', n = 1, n::text);
  n := t_harness.cnt(format('select count(*) from storage.objects where bucket_id = %L and name like %L',
                            'medical-documents', p1::text || '/%'));
  res := res || t_harness.chk('storage: doctor reads document with medical_records consent', n = 1, n::text);
  n := t_harness.cnt('select count(*) from public.journal_entries')
     + t_harness.cnt('select count(*) from public.ai_conversations')
     + t_harness.cnt('select count(*) from public.ai_messages')
     + t_harness.cnt('select count(*) from public.reminders');
  res := res || t_harness.chk('doctor: journal, AI chats, reminders stay private', n = 0, n::text);
  n := t_harness.cnt('select count(*) from public.medical_history')
     + t_harness.cnt('select count(*) from public.habit_entries')
     + t_harness.cnt('select count(*) from public.daily_wellbeing_logs')
     + t_harness.cnt('select count(*) from public.ai_summaries');
  res := res || t_harness.chk('doctor: non-consented categories invisible', n = 0, n::text);
  n := t_harness.affected('update public.mood_entries set mood_score = 1')
     + t_harness.affected('delete from public.health_records');
  res := res || t_harness.chk('doctor: read-only (update/delete affect 0 rows)', n = 0, n::text);
  res := res || t_harness.expect_error('doctor: cannot insert into a patient record',
    format('insert into public.mood_entries (patient_id, mood_score) values (%L, 3)', p1));
  res := res || t_harness.expect_error('storage: doctor cannot upload into patient folder',
    format('insert into storage.objects (bucket_id, name) values (%L, %L)', 'medical-documents', p1::text || '/forged.pdf'));
  res := res || t_harness.expect_error('sharing: doctor cannot grant themselves a category',
    format('select public.grant_data_access(%L, %L)', link, 'medical_history'));
  res := res || t_harness.expect_error('sharing: doctor cannot write sharing_permissions directly',
    format($$insert into public.sharing_permissions (link_id, category, can_view, granted_at) values (%L, 'medical_history', true, now())$$, link));
  n := t_harness.cnt(format('select count(*) from public.profiles where id = %L', p1));
  res := res || t_harness.chk('doctor: sees connected patient profile', n = 1, n::text);
  n := t_harness.cnt(format('select count(*) from public.profiles where id = %L', p2));
  res := res || t_harness.chk('doctor: cannot see unconnected patient profile', n = 0, n::text);

  ----------------------------------------------------------------------------
  -- 8. Expiry, suspension, category revocation, connection revocation
  ----------------------------------------------------------------------------
  perform t_harness.act_postgres();
  update public.sharing_permissions
     set granted_at = now() - interval '2 days', expires_at = now() - interval '1 day'
   where link_id = link and category = 'assessments';
  perform t_harness.act(d1);
  n := t_harness.cnt('select count(*) from public.assessment_results');
  res := res || t_harness.chk('expiry: expired grant blocks access', n = 0, n::text);

  perform t_harness.act(a1);
  perform public.admin_verify_doctor(d1, 'suspended', 'fictional suspension');
  n := t_harness.cnt('select count(*) from public.mood_entries')
     + t_harness.cnt('select count(*) from public.health_records');
  res := res || t_harness.chk('admin: no blanket access to clinical data', n = 0, n::text);
  perform t_harness.act(d1);
  n := t_harness.cnt('select count(*) from public.mood_entries');
  res := res || t_harness.chk('verification: suspended doctor loses access immediately', n = 0, n::text);
  res := res || t_harness.expect_error('verification: suspended doctor cannot accept requests',
    format('select public.respond_to_connection_request(%L, true)', link));
  perform t_harness.act(a1);
  perform public.admin_verify_doctor(d1, 'verified', 'fictional reinstatement');
  perform t_harness.act(d1);
  n := t_harness.cnt('select count(*) from public.mood_entries');
  res := res || t_harness.chk('verification: reinstated doctor regains consented access', n = 1, n::text);

  perform t_harness.act(p1);
  perform public.revoke_data_access(link, 'mood_wellbeing');
  perform t_harness.act(d1);
  n := t_harness.cnt('select count(*) from public.mood_entries');
  res := res || t_harness.chk('revocation: revoked category blocks access', n = 0, n::text);
  n := t_harness.cnt('select count(*) from public.health_records');
  res := res || t_harness.chk('revocation: other categories unaffected', n = 1, n::text);

  perform t_harness.act(p1);
  perform public.revoke_doctor_connection(link);
  perform t_harness.act(d1);
  n := t_harness.cnt('select count(*) from public.health_records')
     + t_harness.cnt(format('select count(*) from storage.objects where bucket_id = %L', 'medical-documents'))
     + t_harness.cnt(format('select count(*) from public.profiles where id = %L', p1));
  res := res || t_harness.chk('revocation: revoked connection blocks records, documents, profile', n = 0, n::text);
  n := t_harness.cnt(format('select count(*) from public.sharing_permissions where link_id = %L and can_view', link));
  res := res || t_harness.chk('revocation: connection revoke cascades to every grant', n = 0, n::text);

  ----------------------------------------------------------------------------
  -- 9. Consent history and audit log
  ----------------------------------------------------------------------------
  perform t_harness.act(p1);
  n := t_harness.cnt('select count(*) from public.consent_records');
  res := res || t_harness.chk('consent: full history recorded (request, approve, 3 grants, 1 revoke, disconnect)', n = 7, n::text);
  res := res || t_harness.expect_error('consent: patient cannot forge a data-sharing consent',
    $$insert into public.consent_records (consent_type, consent_status, category) values ('data_sharing', 'granted', 'mood_wellbeing')$$);
  n := t_harness.affected($$insert into public.consent_records (consent_type, consent_status) values ('terms_of_service', 'granted')$$);
  res := res || t_harness.chk('consent: patient can record app consent (terms of service)', n = 1, n::text);
  res := res || t_harness.expect_error('consent: history cannot be edited by the patient',
    $$update public.consent_records set consent_status = 'granted'$$);
  res := res || t_harness.expect_error('audit: patient cannot write audit rows',
    $$insert into public.audit_logs (action, resource_type) values ('forged', 'x')$$);
  n := t_harness.cnt('select count(*) from public.audit_logs');
  res := res || t_harness.chk('audit: patient sees audit trail about their own data', n > 0, n::text);
  n := t_harness.cnt('select count(*) from public.audit_logs where patient_id is distinct from auth.uid()');
  res := res || t_harness.chk('audit: patient sees no other audit rows', n = 0, n::text);
  n := t_harness.affected('delete from public.habit_entries');
  res := res || t_harness.chk('ownership: patient can delete own data', n = 1, n::text);

  perform t_harness.act(p2);
  n := t_harness.cnt('select count(*) from public.audit_logs');
  res := res || t_harness.chk('audit: unrelated patient sees no audit rows', n = 0, n::text);

  perform t_harness.act(a1);
  n := t_harness.cnt($$select count(*) from public.audit_logs where action = 'admin.doctor_verification'$$);
  res := res || t_harness.chk('audit: every admin verification action audited (3)', n = 3, n::text);

  perform t_harness.act_postgres();
  select count(distinct action) into n from public.audit_logs
   where action in ('connection.requested', 'connection.approved', 'sharing.granted',
                    'sharing.revoked', 'connection.revoked', 'admin.doctor_verification');
  res := res || t_harness.chk('audit: all 6 workflow action types logged', n = 6, n::text);
  res := res || t_harness.expect_error('audit: rows cannot be deleted (even by postgres)', 'delete from public.audit_logs');
  res := res || t_harness.expect_error('audit: rows cannot be altered', $$update public.audit_logs set action = 'tampered'$$);

  ----------------------------------------------------------------------------
  -- 10. Unauthenticated (anon) access
  ----------------------------------------------------------------------------
  perform t_harness.act_anon();
  res := res || t_harness.expect_error('anon: cannot read patient tables', 'select count(*) from public.mood_entries');
  res := res || t_harness.expect_error('anon: cannot read profiles', 'select count(*) from public.profiles');
  res := res || t_harness.expect_error('anon: cannot call RPC functions',
    format('select public.request_doctor_connection(%L)', d1code));
  begin
    n := t_harness.cnt($$select count(*) from storage.objects where bucket_id = 'medical-documents'$$);
    res := res || t_harness.chk('anon: cannot see medical documents', n = 0, n::text);
  exception when insufficient_privilege then
    res := res || 'PASS anon: cannot see medical documents [permission denied]'::text;
  end;

  ----------------------------------------------------------------------------
  -- 11. Account deletion cascades; audit trail survives with actor nulled
  ----------------------------------------------------------------------------
  perform t_harness.act_postgres();
  delete from auth.users where id = p1;
  select count(*) into n from public.mood_entries where patient_id = p1;
  res := res || t_harness.chk('cascade: deleting the auth user removes their data', n = 0, n::text);
  select count(*) into n from public.audit_logs where resource_type = 'doctor_patient_links' and patient_id is null;
  res := res || t_harness.chk('cascade: audit rows retained with patient_id set null', n > 0, n::text);

  ----------------------------------------------------------------------------
  -- Report and roll back everything
  ----------------------------------------------------------------------------
  select count(*) into fails from unnest(res) r where r like 'FAIL%';
  raise exception using
    errcode = 'P0001',
    message = format(E'NEURIX TEST REPORT (all fixtures rolled back): %s passed, %s failed\n%s',
                     cardinality(res) - fails, fails, array_to_string(res, E'\n'));
end;
$test$;
