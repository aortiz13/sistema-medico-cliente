import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Se inicializa el cliente de OpenAI con la llave de entorno
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const patientId = formData.get('patientId') as string
    
    if (!audioFile || !patientId) {
      return NextResponse.json({ error: 'Faltan el archivo de audio y el ID del paciente' }, { status: 400 })
    }

    // 1. Transcribir el audio usando el modelo Whisper de OpenAI
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'es',
    })

    // Verificación para asegurar que la transcripción no esté vacía
    if (!transcription.text || transcription.text.trim() === '') {
        return NextResponse.json({
            transcription: '(Audio vacío o inaudible)',
            formattedNotes: 'No se pudo generar una nota clínica porque el audio estaba vacío o no contenía diálogo claro.',
            success: true
        })
    }


    // 2. Procesar la transcripción con el modelo de chat para generar las notas
    // CAMBIO: Se usa 'gpt-3.5-turbo' por ser más accesible y eficiente
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Eres un asistente médico altamente calificado. Tu tarea es analizar la transcripción de una consulta médica y estructurarla en una nota clínica profesional en formato de texto plano. La nota debe ser clara, concisa y estar en español. Extrae y formatea la siguiente información:
          1.  **MOTIVO DE CONSULTA:**
          2.  **HISTORIA CLÍNICA ACTUAL:** (Resumen de lo que cuenta el paciente)
          3.  **SÍNTOMAS PRINCIPALES:** (Listado de síntomas)
          4.  **POSIBLE DIAGNÓSTICO:** (Basado en la información, sugiere uno o más diagnósticos)
          5.  **PLAN DE TRATAMIENTO RECOMENDADO:** (Medicamentos, dosis, estudios, etc.)
          
          Si la transcripción no contiene suficiente información para un campo, escribe "No se menciona".`
        },
        {
          role: 'user',
          content: `Por favor, analiza la siguiente transcripción: "${transcription.text}"`
        }
      ],
      temperature: 0.5, // Un poco más de creatividad para mejores resúmenes
      max_tokens: 600,
    })

    // CAMBIO: Verificación robusta de la respuesta de la IA
    const formattedNotes = completion.choices[0]?.message?.content?.trim() || 'La IA no pudo generar un resumen para esta transcripción.';

    // 3. Devolver tanto la transcripción como las notas formateadas
    return NextResponse.json({
      transcription: transcription.text,
      formattedNotes: formattedNotes,
      success: true
    })

  } catch (error) {
    console.error('Error en el procesamiento de audio con OpenAI:', error)
    // Devuelve un error claro al frontend
    if (error instanceof Error) {
        return NextResponse.json({ error: `Error en el servidor: ${error.message}` }, { status: 500 })
    }
    return NextResponse.json({ error: 'Ocurrió un error desconocido en el servidor.' }, { status: 500 })
  }
}