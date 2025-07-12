import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const { assistantId } = await request.json()
  
  // CAMBIO ESTRUCTURAL: Se inicializa el cliente de Supabase DENTRO del manejador de la ruta.
  // Esto asegura que la función `cookies()` se llame en el contexto correcto.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value
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

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No estás autenticado.' }, { status: 401 })
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

  // Se crea un cliente con rol de administrador para operaciones seguras
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // 1. Reasignar pacientes
  const { error: updateError } = await supabaseAdmin
    .from('patients')
    .update({ user_id: user.id })
    .eq('user_id', assistantId)

  if (updateError) {
    console.error('Error al reasignar pacientes:', updateError)
    return NextResponse.json({ error: 'Error al reasignar los pacientes.' }, { status: 500 })
  }

  // 2. Eliminar usuario asistente
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(assistantId)

  if (deleteError) {
    console.error('Error al eliminar el usuario asistente:', deleteError)
    return NextResponse.json({ error: 'Error al eliminar la cuenta del asistente.' }, { status: 500 })
  }

  return NextResponse.json({ message: 'Asistente eliminado y pacientes reasignados exitosamente.' })
}