// supabase/functions/_shared/cors.ts

// Estas son las cabeceras estándar para permitir que tu aplicación web
// (desde cualquier origen) pueda llamar a esta Edge Function.
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}