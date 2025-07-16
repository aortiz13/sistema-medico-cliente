import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types'; // Importa la interfaz Profile

interface UseAuthReturn {
  user: SupabaseUser | null;
  profile: Profile | null;
  loading: boolean;
  handleLogout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUserAndProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
      } else {
        setUser(user);
        const { data: userProfile, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (error) {
          console.error("Error fetching profile:", error);
          // Opcional: Manejar el error de perfil, por ejemplo, redireccionar o mostrar un mensaje.
        } else {
          setProfile(userProfile);
        }
      }
      setLoading(false);
    };

    checkUserAndProfile();

    // Suscribirse a cambios de autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setProfile(null);
        router.push('/');
      } else if (event === 'SIGNED_IN' && session.user) {
        setUser(session.user);
        // Recargar perfil si el usuario se autentica
        supabase.from('profiles').select('*').eq('id', session.user.id).single()
          .then(({ data: userProfile, error }) => {
            if (error) console.error("Error reloading profile:", error);
            else setProfile(userProfile);
          });
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  const handleLogout = async () => {
    setLoading(true); // Opcional: mostrar un estado de carga mientras se cierra sesión
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error al cerrar sesión:", error.message);
      // Opcional: mostrar un mensaje de error al usuario
    }
    // El listener onAuthStateChange se encargará de la redirección
  };

  return { user, profile, loading, handleLogout };
}