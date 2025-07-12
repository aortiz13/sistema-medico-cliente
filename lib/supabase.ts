// CAMBIO: Se utiliza createBrowserClient de @supabase/ssr para asegurar
// que la autenticación funcione correctamente entre el cliente y el servidor.
import { createBrowserClient } from '@supabase/ssr'

// No es necesario exportar una función, podemos exportar directamente el cliente
// ya que esta instancia es segura para usar en el navegador.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
