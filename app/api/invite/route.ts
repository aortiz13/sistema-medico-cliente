// app/api/invite/route.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface InvitePayload {
  email: string;
  fullName: string;
  role?: 'asistente' | 'doctor';
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { email, fullName, role = 'asistente' } = await request.json() as InvitePayload;

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

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: { users }, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers();

  if (listUsersError) {
    console.error('Error al buscar usuarios:', listUsersError);
    return NextResponse.json({ error: 'Error al verificar el usuario.' }, { status: 500 });
  }

  const existingUser = users.find(u => u.email === email);

  if (existingUser) {
    if (existingUser.last_sign_in_at) {
      return NextResponse.json({ error: 'Este usuario ya es un miembro activo del equipo.' }, { status: 409 });
    } else {
      await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
    }
  }
  
  // Esta es la parte clave:
  const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/set-password`;
  
  const { data, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: {
      full_name: fullName,
      role,
    },
    redirectTo: redirectUrl, 
  });

  if (inviteError) {
    console.error('Error al invitar al usuario:', inviteError);
    return NextResponse.json({ error: inviteError.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Invitación enviada exitosamente', data });
}