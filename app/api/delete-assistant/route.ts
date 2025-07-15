import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const { assistantId } = await request.json();
  
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
          // Dejar vacío, las cookies se manejan en la respuesta
        },
        remove(_name: string, _options: CookieOptions) {
          // Dejar vacío, las cookies se manejan en la respuesta
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No estás autenticado.' }, { status: 401 });
  }


  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminProfile?.role !== 'doctor') {
    return NextResponse.json({ error: 'No tienes permisos para realizar esta acción.' }, { status: 403 })
  }

  if (!assistantId) {
    return NextResponse.json({ error: 'Se requiere el ID del asistente.' }, { status: 400 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Paso 1: Reasignar los pacientes del asistente al administrador
  const { error: patientUpdateError } = await supabaseAdmin
    .from('patients')
    .update({ user_id: user.id })
    .eq('user_id', assistantId)

  if (patientUpdateError) {
    console.error('Error al reasignar pacientes:', patientUpdateError)
    return NextResponse.json({ error: 'Error al reasignar los pacientes.' }, { status: 500 })
  }

  // CAMBIO: Se añade el Paso 2 para reasignar las consultas
  // Paso 2: Reasignar las consultas del asistente al administrador
  const { error: consultationUpdateError } = await supabaseAdmin
    .from('consultations')
    .update({ doctor_id: user.id })
    .eq('doctor_id', assistantId)

  if (consultationUpdateError) {
    console.error('Error al reasignar consultas:', consultationUpdateError)
    return NextResponse.json({ error: 'Error al reasignar las consultas.' }, { status: 500 })
  }

  // Paso 3: Eliminar la cuenta del asistente
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(assistantId)

  if (deleteError) {
    console.error('Error al eliminar el usuario asistente:', deleteError)
    return NextResponse.json({ error: 'Error al eliminar la cuenta del asistente.' }, { status: 500 })
  }

  return NextResponse.json({ message: 'Asistente eliminado y todos sus datos han sido reasignados exitosamente.' })
}
