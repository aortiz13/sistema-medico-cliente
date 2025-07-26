BEGIN;
SELECT CASE WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'avatars')
  THEN NULL
  ELSE storage.create_bucket('avatars', true)
END;
COMMIT;
