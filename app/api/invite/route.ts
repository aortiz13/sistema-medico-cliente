import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { email } = await request.json()

  // Solo para esta ruta, creamos un cliente de Supabase con rol de 'servicio' (administrador)
  // Esto nos permite usar funciones de admin, como invitar usuarios.
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  if (!email) {
    return NextResponse.json({ error: 'Email es requerido' }, { status: 400 })
  }

  // Usamos la función de admin para invitar a un usuario por email.
  // Le pasamos el rol 'asistente' en los metadatos.
  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: {
      role: 'asistente',
    },
  })

  if (error) {
    console.error('Error al invitar usuario:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Invitación enviada exitosamente', data })
}