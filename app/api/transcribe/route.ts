import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File;
    const consultationType = formData.get('consultationType') as string;

    if (!audioFile || !consultationType) {
      return NextResponse.json({ error: 'Faltan datos requeridos.' }, { status: 400 })
    }

    const { data: templateData, error: templateError } = await supabase
      .from('ai_prompt_template')
      .select('prompt_text')
      .eq('template_type', consultationType)
      .single();

    if (templateError) throw new Error(`No se pudo cargar la plantilla para: ${consultationType}`);
    const systemPrompt = templateData.prompt_text;

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'es',
    });

    if (!transcription.text || transcription.text.trim() === '') {
      return NextResponse.json({ success: false, error: 'El audio estaba vacío o era inaudible.' });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo-1106',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Transcripción: "${transcription.text}"` }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 2000,
    })

    const aiResponseContent = completion.choices[0]?.message?.content;
    if (!aiResponseContent) {
      throw new Error("La IA no devolvió contenido.");
    }

    try {
      const aiJson = JSON.parse(aiResponseContent);
      
      // CAMBIO: Se devuelve el JSON completo y la transcripción original
      return NextResponse.json({
        success: true,
        transcription: transcription.text,
        structuredData: aiJson, // El JSON completo
      });

    } catch (parseError) {
      console.error("Error al parsear JSON de la IA:", parseError);
      throw new Error("La IA devolvió un formato de JSON no válido.");
    }

  } catch (error) {
    console.error('Error en el procesamiento de audio:', error)
    if (error instanceof Error) {
        return NextResponse.json({ success: false, error: `Error en el servidor: ${error.message}` })
    }
    return NextResponse.json({ success: false, error: 'Ocurrió un error desconocido.' })
  }
}
