BEGIN;
SELECT CASE WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'consultation-images')
  THEN NULL
  ELSE storage.create_bucket('consultation-images', true)
END;
COMMIT;

ALTER TABLE consultations ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}'::text[];

CREATE POLICY "Consultation images are publicly accessible." ON storage.objects
FOR SELECT
USING ( bucket_id = 'consultation-images' );

CREATE POLICY "Authenticated users can upload consultation images." ON storage.objects
FOR INSERT TO authenticated
WITH CHECK ( bucket_id = 'consultation-images' AND owner = auth.uid() );

CREATE POLICY "Authenticated users can update their consultation images." ON storage.objects
FOR UPDATE TO authenticated
USING ( bucket_id = 'consultation-images' AND owner = auth.uid() );

CREATE POLICY "Authenticated users can delete their consultation images." ON storage.objects
FOR DELETE TO authenticated
USING ( bucket_id = 'consultation-images' AND owner = auth.uid() );