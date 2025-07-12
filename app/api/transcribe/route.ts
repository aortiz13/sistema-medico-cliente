import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Plantilla específica para EXTRACCIÓN de datos en JSON
const JSON_EXTRACTION_PROMPT = `
Eres un asistente médico experto en análisis de datos. Tu única tarea es analizar la transcripción de una consulta y extraer información específica. Debes devolver la respuesta EXCLUSIVAMENTE en formato JSON.
La estructura del JSON debe ser:
{
  "padecimiento_actual": "string",
  "tratamiento_previo": "string",
  "exploracion_fisica": "string",
  "diagnostico": "string",
  "solicitud_laboratorio_gabinete": "string",
  "tratamiento": "string",
  "ficha_identificacion": { "nombre": "string", "edad": "string", "fecha_nacimiento": "YYYY-MM-DD o null", "fecha_consulta": "YYYY-MM-DD o null", "ocupacion": "string", "aseguradora": "string" },
  "antecedentes_heredo_familiares": { "madre": "string", "padre": "string", "hermanos": "string", "cancer": "string", "tuberculosis": "string", "diabetes": "string", "hipertension": "string", "tiroides": "string", "artritis": "string", "otros": "string" },
  "antecedentes_personales_no_patologicos": { "ejercicio": "string", "alergias": "string", "tabaquismo": "string", "alcoholismo": "string", "toxicomania": "string", "ginecologicos": "string", "homeopatia": "string", "naturista": "string", "otras": "string" },
  "antecedentes_personales_patologicos": { "diabetes": "string", "hipertension": "string", "cirugias": "string", "fracturas": "string", "internamiento": "string", "otras": "string", "medicamentos_o_tratamientos": "string" }
}
Si no encuentras información para un campo, usa un string vacío "" o null. Tu respuesta DEBE ser solo el JSON.
`;

// Plantilla específica para REDACCIÓN de la nota clínica
const CLINICAL_NOTE_PROMPT = `
Eres un asistente médico altamente calificado. Tu tarea es analizar la transcripción de una consulta médica y estructurarla en una nota clínica profesional en formato de texto plano. La nota debe ser clara, concisa y estar en español. Usa los siguientes títulos en negrita:
- Padecimiento actual
- Tratamiento previo
- Exploración física
- Diagnóstico
- Solicitud de laboratorio y gabinete
- Tratamiento
Si no hay información para un título, escribe "No se menciona".
`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File;
    // El tipo de consulta ya no es necesario para el prompt, pero lo mantenemos por si se usa en el futuro
    const consultationType = formData.get('consultationType') as string;

    if (!audioFile) {
      return NextResponse.json({ error: 'Falta el archivo de audio.' }, { status: 400 })
    }

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'es',
    });

    const transcriptText = transcription.text;
    if (!transcriptText || transcriptText.trim() === '') {
      return NextResponse.json({ success: false, error: 'El audio estaba vacío o era inaudible.' });
    }

    // --- PRIMERA LLAMADA A LA IA: Extracción de Datos JSON ---
    const jsonExtractionCompletion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo-1106',
      messages: [
        { role: 'system', content: JSON_EXTRACTION_PROMPT },
        { role: 'user', content: `Transcripción: "${transcriptText}"` }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const aiJsonContent = jsonExtractionCompletion.choices[0]?.message?.content;
    let structuredData = null;
    try {
      if(aiJsonContent) structuredData = JSON.parse(aiJsonContent);
    } catch (e) {
      console.error("Fallo al parsear el JSON de extracción:", e);
      // No detenemos el flujo, podemos continuar sin los datos estructurados.
    }

    // --- SEGUNDA LLAMADA A LA IA: Redacción de la Nota Clínica ---
    const noteRedactionCompletion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
            { role: 'system', content: CLINICAL_NOTE_PROMPT },
            { role: 'user', content: `Transcripción: "${transcriptText}"` }
        ],
        temperature: 0.5,
    });

    const clinicalNote = noteRedactionCompletion.choices[0]?.message?.content?.trim() || 'No se pudo generar la nota clínica.';

    // Devolvemos ambos resultados al frontend
    return NextResponse.json({
      success: true,
      transcription: transcriptText,
      structuredData: structuredData, // El JSON con los datos del perfil
      clinicalNote: clinicalNote,     // El texto de la nota clínica
    });

  } catch (error) {
    console.error('Error en el procesamiento de audio:', error)
    if (error instanceof Error) {
        return NextResponse.json({ success: false, error: `Error en el servidor: ${error.message}` })
    }
    return NextResponse.json({ success: false, error: 'Ocurrió un error desconocido.' })
  }
}

