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
    <div className="flex min-h-screen">
      <Sidebar profile={userProfile} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

