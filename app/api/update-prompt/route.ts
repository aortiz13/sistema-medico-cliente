import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // CAMBIO: Se recibe el tipo de plantilla y el nuevo texto
  const { templateType, newPrompt } = await request.json();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookies().get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {},
        remove(name: string, options: CookieOptions) {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No estás autenticado.' }, { status: 401 });

  const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (adminProfile?.role !== 'doctor') {
    return NextResponse.json({ error: 'No tienes permisos.' }, { status: 403 });
  }

  if (!newPrompt || !templateType) {
    return NextResponse.json({ error: 'Faltan datos requeridos.' }, { status: 400 });
  }

  // CAMBIO: Se actualiza la plantilla correcta usando el templateType
  const { error } = await supabase
    .from('ai_prompt_template')
    .update({ prompt_text: newPrompt, updated_at: new Date().toISOString() })
    .eq('template_type', templateType);

  if (error) {
    console.error('Error al actualizar la plantilla:', error);
    return NextResponse.json({ error: 'Error al guardar la plantilla.' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Plantilla actualizada exitosamente.' });
}