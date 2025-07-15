import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://deno.land/x/openai@v4.24.1/mod.ts';
// Se importa el archivo que acabas de crear
import { corsHeaders } from '../_shared/cors.ts'

console.log("Función 'process-consultation' inicializada.");

// --- ¡IMPORTANTE! DEFINE TUS PLANTILLAS AQUÍ ---
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


Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log("Nueva solicitud recibida.");
    
    // Se usa la SERVICE_ROLE_KEY para tener permisos de administrador
    const supabaseAdminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      // CORRECCIÓN: Usamos el nombre del secreto corregido
      Deno.env.get('SB_SERVICE_ROLE_KEY') ?? ''
    );

    const { record } = await req.json();
    const { consultation_id, audio_path, consultation_type } = record;
    console.log(`Procesando consulta ID: ${consultation_id}`);

    if (!consultation_id || !audio_path) {
        throw new Error("Faltan 'consultation_id' o 'audio_path' en el payload.");
    }

    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });

    // 1. Descargar el audio
    console.log(`Descargando audio desde: ${audio_path}`);
    const { data: audioBlob, error: downloadError } = await supabaseAdminClient.storage
      .from('consultation-audios')
      .download(audio_path);

    if (downloadError) throw downloadError;
    console.log("Audio descargado exitosamente.");

    // 2. Transcribir
    console.log("Enviando audio a OpenAI para transcripción...");
    const transcription = await openai.audio.transcriptions.create({
      file: new File([audioBlob], "audio.mp3"),
      model: 'whisper-1',
      language: 'es'
    });
    const transcriptText = transcription.text;
    if (!transcriptText) throw new Error("La transcripción de OpenAI resultó vacía.");
    console.log("Transcripción recibida:", transcriptText);

    // 3. Generar nota
    const systemPrompt = consultation_type === 'new_patient' ? NEW_PATIENT_PROMPT : FOLLOW_UP_PROMPT;
    console.log(`Generando nota con plantilla para: ${consultation_type || 'follow_up'}`);
    
    const noteCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Transcripción de la consulta: "${transcriptText}"` }
      ]
    });
    const clinicalNote = noteCompletion.choices[0].message.content || 'No se pudo generar la nota.';
    console.log("Nota clínica generada:", clinicalNote);

    const notesAsJson = {
      note_content: clinicalNote
    };

    // 4. Actualizar la consulta en la DB
    console.log(`Actualizando la fila ${consultation_id} en la base de datos...`);
    const { error: updateError } = await supabaseAdminClient
      .from('consultations')
      .update({
        transcription: transcriptText,
        formatted_notes: notesAsJson,
        status: 'completed'
      })
      .eq('id', consultation_id);

    if (updateError) throw updateError;
    console.log("¡Consulta actualizada exitosamente!");

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Error en el procesamiento de la consulta:", error);
    
    const { record } = await req.json().catch(() => ({ record: null }));
    if (record && record.consultation_id) {
        const supabaseAdminClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SB_SERVICE_ROLE_KEY') ?? ''
        );
        const errorAsJson = { error_message: error.message };
        await supabaseAdminClient
            .from('consultations')
            .update({ status: 'failed', formatted_notes: errorAsJson })
            .eq('id', record.consultation_id);
    }

    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
