import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { email } = await request.json()

  // Creamos un cliente de Supabase con rol de 'servicio' (administrador)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  if (!email) {
    return NextResponse.json({ error: 'Email es requerido' }, { status: 400 })
  }

  // Obtenemos la URL base de la aplicación desde las variables de entorno
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://medical-system-mvp.vercel.app';

  // Usamos la función de admin para invitar a un usuario por email.
  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: {
      role: 'asistente',
    },
    // NUEVO: Redirigir a la página específica para establecer la contraseña
    redirectTo: `${siteUrl}/set-password`,
  })

  if (error) {
    console.error('Error al invitar usuario:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Invitación enviada exitosamente', data })
}