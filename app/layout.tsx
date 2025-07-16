// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar'; // Importa tu componente Sidebar

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sistema Médico MVP',
  description: 'Sistema de gestión médica',
};

export default async function RootLayout({ // Hacemos el layout asíncrono para poder obtener datos
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Configura el cliente de Supabase para Server Components
  // MODIFICACIÓN: Pasamos una función que devuelve la instancia de cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: () => cookies(), // Esta es la forma más directa y recomendada
    }
  );

  // Obtener la sesión del usuario
  const { data: { user } } = await supabase.auth.getUser();

  let userProfile = null;
  if (user) {
    // Si hay un usuario, obtener su perfil
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, role') // Selecciona los campos que necesitas para el perfil
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
    } else {
      userProfile = profileData;
    }
  }

  return (
    <html lang="es">
      <body className={inter.className}>
        <div className="flex min-h-screen"> {/* Contenedor flex para el sidebar y el contenido */}
          {/* Pasa el perfil del usuario al Sidebar */}
          <Sidebar profile={userProfile} />
          <main className="flex-1 p-8 overflow-auto"> {/* Contenido principal de la página */}
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
