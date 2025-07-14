import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// PLANTILLA 1: Para Pacientes Nuevos (Historia Clínica)
const NEW_PATIENT_PROMPT = `
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

// PLANTILLA 2: Para Consultas de Seguimiento (Nota SOAP)
const FOLLOW_UP_PROMPT = `
Eres un asistente médico experto en notas de seguimiento. Analiza la transcripción de una consulta y estructura la información estrictamente en el formato SOAP. Debes rellenar TODOS los siguientes campos. Si no encuentras información para un campo, escribe "No se menciona".

**NOTA DE EVOLUCIÓN (SOAP)**

**S. Subjetiva (sintomatología):** (Describe los síntomas que el paciente relata)

**O. Objetiva (signos y laboratorio):** (Describe los hallazgos de la exploración física, signos vitales y resultados de laboratorio relevantes)

**A. Análisis:** (Tu análisis de la situación actual del paciente basado en lo subjetivo y objetivo)

**P. Plan:** (Describe los pasos a seguir: cambios en el tratamiento, nuevos estudios, próxima cita, etc.)

**Diagnóstico:** (Lista de diagnósticos activos o actualizados)
**Tratamiento:** (Lista de medicamentos y/o tratamientos actuales)
`;

function formatClinicalNoteFromJSON(data: any): string {
    if (!data) return "No se pudo generar la nota clínica.";
    let note = `**Padecimiento actual:**\n${data.padecimiento_actual || 'No se menciona'}\n\n`;
    note += `**Tratamiento previo:**\n${data.tratamiento_previo || 'No se menciona'}\n\n`;
    note += `**Exploración física:**\n${data.exploracion_fisica || 'No se menciona'}\n\n`;
    note += `**Diagnóstico:**\n${data.diagnostico || 'No se menciona'}\n\n`;
    note += `**Solicitud de laboratorio y gabinete:**\n${data.solicitud_laboratorio_gabinete || 'No se menciona'}\n\n`;
    note += `**Tratamiento:**\n${data.tratamiento || 'No se menciona'}`;
    return note;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File;
    const consultationType = formData.get('consultationType') as string;
    const patientId = formData.get('patientId') as string;

    if (!audioFile || !consultationType || !patientId) {
      return NextResponse.json({ success: false, error: 'Faltan datos requeridos (audio, tipo de consulta o ID de paciente).' }, { status: 400 })
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

    const isNewPatient = consultationType === 'new_patient';
    const systemPrompt = isNewPatient ? NEW_PATIENT_PROMPT : FOLLOW_UP_PROMPT;
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
    });

    const aiResponseContent = completion.choices[0]?.message?.content;
    if (!aiResponseContent) {
      throw new Error("La IA no devolvió contenido.");
    }

    let structuredData = null;
    let clinicalNote = '';

    if (isNewPatient) {
      try {
        structuredData = JSON.parse(aiResponseContent);
        clinicalNote = formatClinicalNoteFromJSON(structuredData); 
      } catch (e) {
        console.error("Fallo al parsear JSON:", e);
        clinicalNote = "Error: La IA no devolvió un JSON válido. Contenido recibido:\n" + aiResponseContent;
      }
    } else {
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
