-- 1. Asegurarse de que el bucket "avatars" sea público para LECTURA
CREATE POLICY "Avatar images are publicly accessible."
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- 2. Permitir que los usuarios autenticados SUBAN sus propios avatares
CREATE POLICY "Authenticated users can upload their own avatars."
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'avatars' AND owner = auth.uid() );

-- 3. Permitir que los usuarios autenticados ACTUALICEN sus propios avatares
CREATE POLICY "Authenticated users can update their own avatars."
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'avatars' AND owner = auth.uid() );

-- 4. Permitir que los usuarios autenticados ELIMINEN sus propios avatares
CREATE POLICY "Authenticated users can delete their own avatars."
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'avatars' AND owner = auth.uid() );