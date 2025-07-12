import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { newPrompt } = await request.json();
  
  // CAMBIO: Se ajusta la inicialización del cliente de Supabase para corregir el error de tipos.
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
          // Dejamos este método vacío para operaciones de solo lectura.
        },
        remove(name: string, options: CookieOptions) {
          // Igual que 'set', lo dejamos vacío.
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No estás autenticado.' }, { status: 401 });

  const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (adminProfile?.role !== 'doctor') {
    return NextResponse.json({ error: 'No tienes permisos.' }, { status: 403 });
  }

  if (!newPrompt) {
    return NextResponse.json({ error: 'La plantilla no puede estar vacía.' }, { status: 400 });
  }

  // Usamos 'update' para actualizar la única fila que existe en la tabla
  const { error } = await supabase
    .from('ai_prompt_template')
    .update({ prompt_text: newPrompt, updated_at: new Date().toISOString() })
    .eq('id', 1);

  if (error) {
    console.error('Error al actualizar la plantilla:', error);
    return NextResponse.json({ error: 'Error al guardar la plantilla.' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Plantilla actualizada exitosamente.' });
}