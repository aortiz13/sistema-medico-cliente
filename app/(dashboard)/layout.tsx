import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // IMPORTANTE: await aquí porque cookies() es asíncrona
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


  const { data: { user } } = await supabase.auth.getUser();

  let userProfile = null;
  if (user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', user.id)
      .single();
    userProfile = profileData;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar profile={userProfile} />
      
      {/* Contenedor para la cabecera y el contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header profile={null} onLogout={function (): void {
          throw new Error('Function not implemented.');
        } } /> {/* La cabecera va aquí, fuera del área de scroll */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

