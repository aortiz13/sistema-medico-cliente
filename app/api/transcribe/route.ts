import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

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
    const consultationType = formData.get('consultationType') as string;
    // CAMBIO: Se añade la recepción del patientId que faltaba
    const patientId = formData.get('patientId') as string;

    // CAMBIO: Se añade patientId a la validación
    if (!audioFile || !consultationType || !patientId) {
      return NextResponse.json({ error: 'Faltan datos requeridos (audio, tipo de consulta o ID de paciente).' }, { status: 400 })
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

    // Usamos el prompt correcto según el tipo de consulta
    const isNewPatient = consultationType === 'new_patient';
    const systemPrompt = isNewPatient ? JSON_EXTRACTION_PROMPT : CLINICAL_NOTE_PROMPT;
    const responseFormat = isNewPatient ? { type: "json_object" } : { type: "text" };

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo-1106',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Transcripción: "${transcriptText}"` }
      ],
      response_format: responseFormat,
      temperature: 0.2,
      max_tokens: 2000,
    })

    const aiResponseContent = completion.choices[0]?.message?.content;
    if (!aiResponseContent) {
      throw new Error("La IA no devolvió contenido.");
    }

    let structuredData = null;
    let clinicalNote = '';

    if (isNewPatient) {
      try {
        structuredData = JSON.parse(aiResponseContent);
        // La nota clínica se construirá en el frontend
        clinicalNote = "Historia Clínica generada a partir de datos estructurados."; 
      } catch (e) {
        console.error("Fallo al parsear JSON:", e);
        clinicalNote = "Error: La IA no devolvió un JSON válido. Contenido recibido:\n" + aiResponseContent;
      }
    } else {
      // Para notas de seguimiento, la respuesta es el texto directo
      clinicalNote = aiResponseContent;
    }

    return NextResponse.json({
      success: true,
      transcription: transcriptText,
      structuredData: structuredData,
      clinicalNote: clinicalNote,
    });

  } catch (error) {
    console.error('Error en el procesamiento de audio:', error)
    if (error instanceof Error) {
        return NextResponse.json({ success: false, error: `Error en el servidor: ${error.message}` })
    }
    return NextResponse.json({ success: false, error: 'Ocurrió un error desconocido.' })
  }
}