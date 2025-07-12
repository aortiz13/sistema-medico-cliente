import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const { assistantId } = await request.json()

  // CAMBIO: Se corrigió la inicialización del cliente de Supabase.
  // La función cookies() se llama ahora dentro de cada método (get, set, remove).
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookies().set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookies().set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
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
