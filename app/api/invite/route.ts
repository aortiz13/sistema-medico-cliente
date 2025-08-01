import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { type PageParams } from '@supabase/auth-js'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { email, fullName, role = 'asistente' } = await request.json();

  // --- Validación inicial y autenticación del administrador ---
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set(_name: string, _value: string, _options: CookieOptions) {},
        remove(_name:string, _options: CookieOptions) {},
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

  // --- Lógica Mejorada para Reenviar Invitaciones ---
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Buscar si ya existe un usuario con ese email
  type ListUsersParams = PageParams & { email?: string }
  const listParams: ListUsersParams = { email }
  const { data: existingUserData, error: existingUserError } =
    await supabaseAdmin.auth.admin.listUsers(listParams)

  if (existingUserError) {
    console.error('Error al buscar usuarios:', existingUserError);
    return NextResponse.json({ error: 'Error al verificar el usuario.' }, { status: 500 });
  }

  const existingUser = existingUserData.users.find(u => u.email === email);

  if (existingUser) {
    // 2. Si el usuario existe, verificar si ya ha confirmado su cuenta
    // Un usuario invitado que no ha aceptado no tendrá 'email_confirmed_at'
    if (existingUser.email_confirmed_at) {
      // El usuario ya es un miembro activo, no se puede volver a invitar.
      return NextResponse.json({ error: 'Este usuario ya es un miembro activo del equipo.' }, { status: 409 }); // 409 Conflict
    } else {
      // El usuario existe pero solo como invitado. Lo eliminamos para crear una nueva invitación.
      console.log(`Eliminando invitación pendiente para: ${email}`);
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
      if (deleteError) {
        console.error('Error al eliminar invitación pendiente:', deleteError);
        return NextResponse.json({ error: 'No se pudo reenviar la invitación.' }, { status: 500 });
      }
    }
  }
  
  // 3. (Re)enviar la invitación
  console.log(`Enviando nueva invitación a: ${email}`);
  const { data, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: {
      full_name: fullName,
      role,
    },
  });

  if (inviteError) {
    console.error('Error al invitar al usuario:', inviteError);
    return NextResponse.json({ error: inviteError.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Invitación enviada exitosamente', data });
}