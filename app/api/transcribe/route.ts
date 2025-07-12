import { NextRequest, NextResponse } from 'next/server'

import OpenAI from 'openai'



const openai = new OpenAI({

apiKey: process.env.OPENAI_API_KEY,

})



export async function POST(request: NextRequest) {

try {

const formData = await request.formData()

const audioFile = formData.get('audio') as File

const patientId = formData.get('patientId') as string


if (!audioFile || !patientId) {

return NextResponse.json({ error: 'Audio file and patient ID are required' }, { status: 400 })

}



// Transcribir audio con Whisper

const transcription = await openai.audio.transcriptions.create({

file: audioFile,

model: 'whisper-1',

language: 'es',

})



// Procesar transcripción con GPT

const completion = await openai.chat.completions.create({

model: 'gpt-4',

messages: [

{

role: 'system',

content: `Eres un asistente médico especializado en crear notas clínicas.


Analiza la siguiente transcripción médica y extrae:

1. Motivo de consulta

2. Historia clínica actual

3. Síntomas mencionados

4. Posible diagnóstico

5. Plan de tratamiento recomendado


Responde en formato de nota clínica profesional.`

},

{

role: 'user',

content: `Transcripción: ${transcription.text}`

}

],

temperature: 0.3,

max_tokens: 500,

})



const formattedNotes = completion.choices[0].message.content



return NextResponse.json({

transcription: transcription.text,

formattedNotes: formattedNotes,

success: true

})



} catch (error) {

console.error('Error processing audio:', error)

return NextResponse.json({ error: 'Error processing audio' }, { status: 500 })

}

}