import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Helper function for getting cookies to help with type inference
const getCookie = (name: string) => {
  const cookieStore = cookies()
  return cookieStore.get(name)?.value
}

// CAMBIO: Se renombraron los parámetros no usados con un guion bajo
const setCookie = (_name: string, _value: string, _options: CookieOptions) => {
  // En una API Route, no podemos modificar las cookies de la solicitud.
  // Dejamos este método vacío para operaciones de solo lectura.
}
const removeCookie = (_name: string, _options: CookieOptions) => {
  // Igual que 'set', lo dejamos vacío.
}

export async function POST(request: NextRequest) {
  const { assistantId } = await request.json()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: getCookie,
        set: setCookie,
        remove: removeCookie,
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

  // Creamos un cliente de Supabase con rol de administrador para operaciones seguras
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // 1. Reasignar los pacientes del asistente al administrador que realiza la acción
  const { error: updateError } = await supabaseAdmin
    .from('patients')
    .update({ user_id: user.id })
    .eq('user_id', assistantId)

  if (updateError) {
    console.error('Error al reasignar pacientes:', updateError)
    return NextResponse.json({ error: 'Error al reasignar los pacientes.' }, { status: 500 })
  }

  // 2. Eliminar la cuenta del asistente. Esto eliminará en cascada su perfil.
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(assistantId)

  if (deleteError) {
    console.error('Error al eliminar el usuario asistente:', deleteError)
    return NextResponse.json({ error: 'Error al eliminar la cuenta del asistente.' }, { status: 500 })
  }

  return NextResponse.json({ message: 'Asistente eliminado y pacientes reasignados exitosamente.' })
}
