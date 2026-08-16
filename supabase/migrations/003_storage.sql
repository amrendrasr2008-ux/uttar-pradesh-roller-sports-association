-- UPRSA Supabase Storage Buckets & Storage RLS Migration
-- File: supabase/migrations/003_storage.sql

-- 1. Create Buckets if they don't already exist in storage.buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('skater-photos', 'skater-photos', true, 15360, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('private-documents', 'private-documents', false, 15360, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('certificates', 'certificates', false, 15360, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('website-media', 'website-media', true, 15360, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('gallery', 'gallery', true, 15360, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = 15360,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Ensure Storage RLS is Enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Storage RLS Policies
-- A. Private Documents (PRIVATE - ID/Age proof)
DROP POLICY IF EXISTS "Private Documents Owner/Admin Read" ON storage.objects;
CREATE POLICY "Private Documents Owner/Admin Read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'private-documents' AND (
      auth.uid() IS NOT NULL AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR (storage.foldername(name))[1] = public.get_user_skater_id()::text
        OR public.is_admin()
        OR (public.is_district_user() AND EXISTS (
          SELECT 1 FROM public.skaters s 
          WHERE s.id::text = (storage.foldername(name))[1] 
            AND s.district_id = public.get_user_district_id()
        ))
      )
    )
  );

DROP POLICY IF EXISTS "Private Documents Authenticated Insert" ON storage.objects;
CREATE POLICY "Private Documents Authenticated Insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'private-documents' AND (
      auth.uid() IS NOT NULL
      OR public.is_admin()
    )
  );

DROP POLICY IF EXISTS "Private Documents Admin/Owner Update" ON storage.objects;
CREATE POLICY "Private Documents Admin/Owner Update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'private-documents' AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR (storage.foldername(name))[1] = public.get_user_skater_id()::text
      OR public.is_admin()
    )
  );

DROP POLICY IF EXISTS "Private Documents Admin Delete" ON storage.objects;
CREATE POLICY "Private Documents Admin Delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'private-documents' AND public.is_admin()
  );

-- B. Certificates (CONTROLLED)
DROP POLICY IF EXISTS "Certificates Read Access" ON storage.objects;
CREATE POLICY "Certificates Read Access" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'certificates' AND (
      (storage.foldername(name))[1] = public.get_user_skater_id()::text
      OR public.is_operator()
      OR public.is_admin()
    )
  );

DROP POLICY IF EXISTS "Certificates Write Access" ON storage.objects;
CREATE POLICY "Certificates Write Access" ON storage.objects
  FOR ALL USING (
    bucket_id = 'certificates' AND (public.is_operator() OR public.is_admin())
  );

-- C. Public Buckets (skater-photos, website-media, gallery)
DROP POLICY IF EXISTS "Public Storage Read Access" ON storage.objects;
CREATE POLICY "Public Storage Read Access" ON storage.objects
  FOR SELECT USING (
    bucket_id IN ('skater-photos', 'website-media', 'gallery')
  );

DROP POLICY IF EXISTS "Public Storage Authenticated Write Access" ON storage.objects;
CREATE POLICY "Public Storage Authenticated Write Access" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id IN ('skater-photos', 'website-media', 'gallery') AND auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "Public Storage Admin Manage" ON storage.objects;
CREATE POLICY "Public Storage Admin Manage" ON storage.objects
  FOR ALL USING (
    bucket_id IN ('skater-photos', 'website-media', 'gallery') AND public.is_admin()
  );

-- 4. Database Column Extensions for Storage Paths
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='skaters' AND column_name='photo_storage_path') THEN
    ALTER TABLE public.skaters ADD COLUMN photo_storage_path TEXT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='skaters' AND column_name='id_proof_storage_path') THEN
    ALTER TABLE public.skaters ADD COLUMN id_proof_storage_path TEXT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='skaters' AND column_name='age_proof_storage_path') THEN
    ALTER TABLE public.skaters ADD COLUMN age_proof_storage_path TEXT NULL;
  END IF;
END $$;
