import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const NEW_PATIENT_PROMPT = `
Eres un asistente médico experto. Tu tarea es analizar la transcripción de una consulta y estructurarla en una nota clínica profesional en formato de texto plano. La nota debe ser clara, concisa y estar en español.

Usa los siguientes títulos en negrita, seguidos de dos puntos:

**Ficha de Identificación:**
* **Nombre:**
* **Edad:**
* **Fecha de Nacimiento:**
* **Fecha de consulta:**
* **Ocupación:**
* **Aseguradora:**

**Antecedentes Heredo Familiares:**
* **Madre:**
* **Padre:**
* **Hermanos:**
* **Cáncer:**
* **Tuberculosis:**
* **Diabetes:**
* **Hipertensión:**
* **Tiroides:**
* **Artritis:**
* **Otros:**

**Antecedentes personales no patológicos:**
* **Ejercicio:**
* **Alergias:**
* **Tabaquismo:**
* **Alcoholismo:**
* **Toxicomanía:**
* **Ginecológicos:**
* **Homeopatía:**
* **Naturista:**
* **Otras:**

**Antecedentes personales patológicos:**
* **Diabetes:**
* **Hipertensión:**
* **Cirugías:**
* **Fracturas:**
* **Internamiento:**
* **Otras:**
* **Medicamentos o tratamientos:**

**Padecimiento actual:**

**Tratamiento previo:**

**Exploración física:**

**Diagnóstico:**

**Solicitud de laboratorio y gabinete:**

**Tratamiento:**

Si no encuentras información para un campo, escribe "No se menciona".
`;

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
  console.log("API /api/transcribe: Solicitud recibida.");
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const consultationType = formData.get('consultationType') as string;
    
    console.log(`API /api/transcribe: Tipo de consulta: ${consultationType}`);

    if (!audioFile) {
      console.error("API /api/transcribe: No se encontró el archivo de audio.");
      return NextResponse.json({ success: false, error: 'Falta el archivo de audio.' }, { status: 400 });
    }

    // 1. Transcribir el audio
    console.log("API /api/transcribe: Iniciando transcripción con Whisper...");
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'es',
    });
    const transcriptText = transcription.text;
    console.log("API /api/transcribe: Texto transcrito:", transcriptText);

    if (!transcriptText || transcriptText.trim().length < 5) {
      console.error("API /api/transcribe: La transcripción está vacía o es muy corta.");
      return NextResponse.json({ success: false, error: 'El audio estaba vacío o era inaudible.' });
    }

    // 2. Generar la nota clínica
    const systemPrompt = consultationType === 'new_patient' ? NEW_PATIENT_PROMPT : FOLLOW_UP_PROMPT;
    console.log("API /api/transcribe: Usando prompt para generar nota clínica.");
    
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
    console.log("API /api/transcribe: Nota clínica generada por IA:", clinicalNote);

    if (!clinicalNote) {
      throw new Error("La IA no devolvió una nota clínica.");
    }

    // 3. Devolver la respuesta al frontend
    const responsePayload = {
      success: true,
      transcription: transcriptText,
      clinicalNote: clinicalNote.trim(),
    };
    console.log("API /api/transcribe: Enviando respuesta exitosa al frontend:", responsePayload);
    
    return NextResponse.json(responsePayload);

  } catch (error) {
    console.error('API /api/transcribe: Error en el bloque catch:', error);
    if (error instanceof Error) {
        return NextResponse.json({ success: false, error: `Error en el servidor: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ success: false, error: 'Ocurrió un error desconocido en el servidor.' }, { status: 500 });
  }
}
