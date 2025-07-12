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
    // CAMBIO: Se recibe el tipo de consulta desde el frontend
    const consultationType = formData.get('consultationType') as string;

    if (!audioFile || !consultationType) {
      return NextResponse.json({ error: 'Faltan datos requeridos (audio, tipo de consulta).' }, { status: 400 })
    }

    // 1. Obtener la plantilla correcta desde la base de datos
    const { data: templateData, error: templateError } = await supabase
      .from('ai_prompt_template')
      .select('prompt_text')
      .eq('template_type', consultationType) // Se busca por 'new_patient' o 'follow_up'
      .single();

    if (templateError) {
      console.error("Error al cargar plantilla de IA:", templateError);
      throw new Error(`No se pudo cargar la plantilla para el tipo: ${consultationType}`);
    }

    const systemPrompt = templateData.prompt_text;

    // 2. Transcribir el audio
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'es',
    });

    if (!transcription.text || transcription.text.trim() === '') {
        return NextResponse.json({
            transcription: '(Audio vacío o inaudible)',
            formattedNotes: 'No se pudo generar una nota clínica porque el audio estaba vacío.',
            success: true
        })
    }

    // 3. Llamar a la IA con el prompt dinámico
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analiza la siguiente transcripción: "${transcription.text}"` }
      ],
      temperature: 0.5,
      max_tokens: 1000, // Aumentamos por si la historia clínica es larga
    })

    const notes = completion.choices[0]?.message?.content?.trim() || 'La IA no pudo generar un resumen.';

    return NextResponse.json({
      transcription: transcription.text,
      formattedNotes: notes,
      success: true
    })

  } catch (error) {
    console.error('Error en el procesamiento de audio:', error)
    if (error instanceof Error) {
        return NextResponse.json({ error: `Error en el servidor: ${error.message}` }, { status: 500 })
    }
    return NextResponse.json({ error: 'Ocurrió un error desconocido.' }, { status: 500 })
  }
}
