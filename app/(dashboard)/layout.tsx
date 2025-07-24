import { Sidebar } from '@/components/layout/Sidebar';
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Header } from '@/components/layout/Header';
import { redirect } from 'next/navigation';


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // --- Tu lógica de cookies y Supabase (sin cambios) ---
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // Verificamos la sesión en lugar de solo el usuario para más robustez
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/');
  }

  let userProfile = null;
  if (session.user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', session.user.id)
      .single();
    userProfile = profileData;
  }
  // --- Fin de tu lógica ---


  // --- Estructura JSX corregida ---
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar profile={userProfile} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
         <Header profile={userProfile} /> {/* CORREGIDO: Se pasa el prop 'profile' */}
         <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
