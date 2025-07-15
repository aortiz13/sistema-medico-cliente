import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// PLANTILLA 1: Para Pacientes Nuevos (Historia Clínica en Texto)
const NEW_PATIENT_PROMPT = `
Eres un asistente médico experto. Tu tarea es analizar la transcripción de una consulta y estructurarla en una nota clínica profesional en formato de texto plano. La nota debe ser clara, concisa y estar en español.
Usa los siguientes títulos en negrita, seguidos de dos puntos:
**Padecimiento actual:**
**Tratamiento previo:**
**Exploración física:**
**Diagnóstico:**
**Solicitud de laboratorio y gabinete:**
**Tratamiento:**
Si no encuentras información para un campo, escribe "No se menciona".
`;

// PLANTILLA 2: Para Consultas de Seguimiento (Nota SOAP en Texto)
const FOLLOW_UP_PROMPT = `
Eres un asistente médico experto en notas de seguimiento. Analiza la transcripción de una consulta y estructura la información estrictamente en el formato SOAP.
Usa los siguientes títulos en negrita, seguidos de dos puntos:
**S. Subjetiva (sintomatología):**
**O. Objetiva (signos y laboratorio):**
**A. Análisis:**
**P. Plan:**
**Diagnóstico:**
**Tratamiento:**
Si no encuentras información para un campo, escribe "No se menciona".
`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File;
    const consultationType = formData.get('consultationType') as string;
    const patientId = formData.get('patientId') as string;

    if (!audioFile || !consultationType || !patientId) {
      return NextResponse.json({ success: false, error: 'Faltan datos requeridos.' }, { status: 400 })
    }

    // 1. Transcribir el audio
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'es',
    });

    const transcriptText = transcription.text;
    if (!transcriptText || transcriptText.trim().length < 5) { // Ignorar transcripciones muy cortas
      return NextResponse.json({ success: false, error: 'El audio estaba vacío o era inaudible.' });
    }

    // 2. Seleccionar el prompt correcto y generar la nota
    const systemPrompt = consultationType === 'new_patient' ? NEW_PATIENT_PROMPT : FOLLOW_UP_PROMPT;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Transcripción de la consulta: "${transcriptText}"` }
      ],
      temperature: 0.5,
      max_tokens: 1500,
    });

    const clinicalNote = completion.choices[0]?.message?.content;
    if (!clinicalNote) {
      throw new Error("La IA no devolvió una nota clínica.");
    }

    // 3. Devolver la respuesta simple al frontend
    return NextResponse.json({
      success: true,
      transcription: transcriptText,
      clinicalNote: clinicalNote.trim(),
    });

  } catch (error) {
    console.error('Error en el procesamiento de audio:', error)
    if (error instanceof Error) {
        return NextResponse.json({ success: false, error: `Error en el servidor: ${error.message}` })
    }
    return NextResponse.json({ success: false, error: 'Ocurrió un error desconocido.' })
  }
}