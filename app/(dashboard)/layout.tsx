// app/(dashboard)/layout.tsx
import { Sidebar } from '@/components/layout/Sidebar';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Header } from '@/components/layout/Header'; // Mantén esta importación
import { redirect } from 'next/navigation';


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/');
  }

  // Todavía necesitas obtener el perfil aquí para el Sidebar
  let userProfile = null;
  if (session.user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', session.user.id)
      .single();
    userProfile = profileData;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar profile={userProfile} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
         <Header /> {/* 👈 ¡SIMPLEMENTE LLAMA AL COMPONENTE SIN PROPS! */}
         <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
