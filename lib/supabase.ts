// lib/supabase.ts
import { createBrowserClient } from '@supabase/ssr'

// --- AÑADE ESTAS LÍNEAS PARA DEPURAR ---
console.log("Supabase URL (desde el cliente):", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("Supabase Anon Key (desde el cliente):", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
// ------------------------------------

// Se crea una única instancia del cliente de Supabase para el navegador.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
