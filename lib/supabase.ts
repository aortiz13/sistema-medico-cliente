import { createBrowserClient } from '@supabase/ssr'

// Se crea una única instancia del cliente de Supabase para el navegador.
// Esta es la forma moderna y recomendada para aplicaciones con Next.js App Router.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
