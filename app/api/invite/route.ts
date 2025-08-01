import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { email, fullName, role = 'asistente' } = await request.json();

  // Paso 1: Resolver la Promise de las cookies PRIMERO
  const cookieStore = await cookies();

  // Paso 2: Usar el valor resuelto para configurar Supabase
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(_name: string, _value: string, _options: CookieOptions) {
          // Dejar vacío
        },
        remove(_name: string, _options: CookieOptions) {
          // Dejar vacío
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No estás autenticado.' }, { status: 401 });
  }


  if (!email || !fullName) {
    return NextResponse.json({ error: 'El nombre y el email son requeridos.' }, { status: 400 });
  }
  
  // Se crea un cliente con rol de administrador para la invitación
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const redirectUrl = `${request.nextUrl.origin}/set-password`

  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo: redirectUrl,
    data: {
      full_name: fullName,
      role,
    },
  })

  if (error) {
    console.error('Error al invitar usuario:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Invitación enviada exitosamente', data })
}
