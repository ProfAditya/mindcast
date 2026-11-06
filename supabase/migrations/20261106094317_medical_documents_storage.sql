-- NEURIX migration 7/7: private storage bucket for medical documents.
--
-- Ownership model: object path = '<patient_id>/<file name>'. The first folder
-- segment must equal the uploader's auth uid. health_records.storage_path uses
-- the same convention (enforced by a CHECK in migration 3).
-- Doctors may read (never write) a patient's documents only when
-- private.doctor_can_view(patient, 'medical_records') is true.
-- The bucket is private: no public URLs; downloads need a signed URL or JWT.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'medical-documents',
  'medical-documents',
  false,
  20971520,  -- 20 MB
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'text/plain'])
on conflict (id) do nothing;

create policy "medical-documents: owner or consented doctor read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'medical-documents'
    and (
         (storage.foldername(name))[1] = (select auth.uid())::text
      or private.doctor_can_view(private.try_uuid((storage.foldername(name))[1]), 'medical_records')));

create policy "medical-documents: owner upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'medical-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "medical-documents: owner update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'medical-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (
    bucket_id = 'medical-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "medical-documents: owner delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'medical-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text);
