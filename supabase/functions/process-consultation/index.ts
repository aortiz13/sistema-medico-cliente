import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://deno.land/x/openai@v4.24.1/mod.ts';

// Plantillas de IA (puedes copiarlas de tu implementación anterior)
const JSON_EXTRACTION_PROMPT = `...`; // Pega tu plantilla JSON aquí
const CLINICAL_NOTE_PROMPT = `...`; // Pega tu plantilla de nota clínica aquí

Deno.serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  );

  const { record } = await req.json();
  const { consultation_id, audio_path, consultation_type, doctor_id } = record;

  const openai = new OpenAI({
    apiKey: Deno.env.get('OPENAI_API_KEY'),
  });

  try {
    // 1. Descargar el audio desde Supabase Storage
    const { data: audioBlob, error: downloadError } = await supabaseClient.storage
      .from('consultation-audios')
      .download(audio_path);

    if (downloadError) throw downloadError;

    // 2. Transcribir el audio con Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: new File([audioBlob], "audio.mp3"), // Whisper es flexible con el nombre
      model: 'whisper-1',
    });
    const transcriptText = transcription.text;

    if (!transcriptText) throw new Error("La transcripción resultó vacía.");

    // 3. Obtener la plantilla correcta (asumiendo que la lógica sigue siendo necesaria)
    // Esta parte puede simplificarse si solo usas una plantilla para la extracción
    const { data: templateData } = await supabaseClient
      .from('ai_prompt_template')
      .select('prompt_text')
      .eq('template_type', consultation_type)
      .single();
    
    const systemPrompt = templateData?.prompt_text || JSON_EXTRACTION_PROMPT; // Usar una por defecto

    // 4. Extraer datos estructurados
    const jsonCompletion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-1106",
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: `Transcripción: "${transcriptText}"`}],
        response_format: { type: "json_object" },
    });
    const structuredData = JSON.parse(jsonCompletion.choices[0].message.content || '{}');

    // 5. Generar la nota clínica
    const noteCompletion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "system", content: CLINICAL_NOTE_PROMPT }, { role: "user", content: `Transcripción: "${transcriptText}"`}],
    });
    const clinicalNote = noteCompletion.choices[0].message.content || 'No se pudo generar la nota.';

    // 6. Actualizar la consulta en la base de datos
    const { error: updateError } = await supabaseClient
      .from('consultations')
      .update({
        transcription: transcriptText,
        formatted_notes: clinicalNote,
        status: 'completed',
      })
      .eq('id', consultation_id);

    if (updateError) throw updateError;
    
    // 7. Actualizar el perfil del paciente si es necesario
    if (consultation_type === 'new_patient' && structuredData) {
        // ... (lógica para actualizar el perfil del paciente con structuredData)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    // Si algo falla, actualizamos el estado a 'failed'
    await supabaseClient
      .from('consultations')
      .update({ status: 'failed', formatted_notes: error.message })
      .eq('id', consultation_id);

    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
