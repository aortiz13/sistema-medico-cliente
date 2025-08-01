-- 1. Asegurarse de que RLS esté habilitado en la tabla de perfiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar cualquier política de lectura antigua que pueda existir
DROP POLICY IF EXISTS "Los usuarios pueden ver todos los perfiles." ON public.profiles;

-- 3. Crear la nueva política que permite a los usuarios autenticados leer todos los perfiles
CREATE POLICY "Los usuarios pueden ver todos los perfiles."
ON public.profiles FOR SELECT
TO authenticated
USING (true);