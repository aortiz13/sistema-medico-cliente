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

    // CAMBIO: Se añade la opción de respuesta JSON para los modelos compatibles
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo-1106', // Este modelo es bueno para seguir instrucciones de formato JSON
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analiza la siguiente transcripción: "${transcription.text}"` }
      ],
      response_format: { type: "json_object" }, // Le pedimos a la IA que garantice una salida JSON
      temperature: 0.2,
      max_tokens: 2000,
    })

    const aiResponseContent = completion.choices[0]?.message?.content;
    if (!aiResponseContent) {
      throw new Error("La IA no devolvió contenido.");
    }

    // CAMBIO: Parseamos la respuesta JSON de la IA
    try {
      const aiJson = JSON.parse(aiResponseContent);
      
      // Devolvemos la estructura completa al frontend
      return NextResponse.json({
        success: true,
        transcription: transcription.text,
        clinicalNote: aiJson.clinicalNote,
        patientData: aiJson.patientData, // Los datos estructurados para el perfil
      });

    } catch (parseError) {
      console.error("Error al parsear JSON de la IA:", parseError);
      // Si la IA no devuelve un JSON válido, devolvemos el texto como nota clínica.
      return NextResponse.json({
        success: true,
        transcription: transcription.text,
        clinicalNote: aiResponseContent,
        patientData: null, // No hay datos de paciente si el JSON falla
      });
    }

  } catch (error) {
    console.error('Error en el procesamiento de audio:', error)
    if (error instanceof Error) {
        return NextResponse.json({ success: false, error: `Error en el servidor: ${error.message}` })
    }
    return NextResponse.json({ success: false, error: 'Ocurrió un error desconocido.' })
  }
}