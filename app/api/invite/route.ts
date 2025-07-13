import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const { email, fullName } = await request.json()
  const cookieStore = cookies()

  // CAMBIO: Se corrige la inicialización del cliente de Supabase para resolver el error de tipo.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          return (await cookieStore).get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // En una API Route, no podemos modificar las cookies de la solicitud.
        },
        remove(name: string, options: CookieOptions) {
          // Igual que 'set', lo dejamos vacío.
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No estás autenticado.' }, { status: 401 });

  const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (adminProfile?.role !== 'doctor') {
    return NextResponse.json({ error: 'No tienes permisos.' }, { status: 403 });
  }

  if (!email || !fullName) {
    return NextResponse.json({ error: 'El nombre y el email son requeridos.' }, { status: 400 });
  }
  
  // Se crea un cliente con rol de administrador para la invitación
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: {
      full_name: fullName,
      role: 'asistente',
    },
  })

  if (error) {
    console.error('Error al invitar usuario:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Invitación enviada exitosamente', data })
}
