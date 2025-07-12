'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
// CAMBIO: Se eliminó 'User' porque no se usaba
import { Mic, Square, FileText, LogOut } from 'lucide-react'
import { User as SupabaseUser } from '@supabase/supabase-js'

// CAMBIO: Se agregaron tipos más específicos para evitar 'any'
interface Patient {
  id: string;
  full_name: string;
  phone?: string;
  created_at: string;
}

interface Consultation {
  id: string;
  created_at: string;
  status: string;
  formatted_notes: string;
  patients: {
    full_name: string;
  } | null;
}


export default function Dashboard() {
  // CAMBIO: Se usó el tipo SupabaseUser en lugar de 'any'
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
      } else {
        setUser(user)
        loadPatients()
        loadConsultations()
      }
    }
    checkUser()
  }, [router])

  const loadPatients = async () => {
    const { data } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false })
    setPatients(data || [])
  }

  const loadConsultations = async () => {
    const { data } = await supabase
      .from('consultations')
      .select(`
        *,
        patients (full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(5)
    setConsultations(data || [])
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      const audioChunks: Blob[] = []
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data)
      }
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
        setAudioBlob(audioBlob)
      }
      
      mediaRecorder.start()
      setIsRecording(true)
      
      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
            mediaRecorder.stop()
            stream.getTracks().forEach(track => track.stop())
        }
        setIsRecording(false)
      }, 30000)
      
    } catch (_error) { // CAMBIO: 'error' se renombró a '_error'
      alert('Error al acceder al micrófono')
    }
  }

  const stopRecording = () => {
    setIsRecording(false)
  }

  const processAudio = async () => {
    if (!audioBlob || !selectedPatient || !user) {
      alert('Selecciona un paciente y graba audio')
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'audio.wav')
      formData.append('patientId', selectedPatient)

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        // CAMBIO: Se eliminó 'data' porque no se usaba.
        const { error } = await supabase
          .from('consultations')
          .insert([
            {
              patient_id: selectedPatient,
              doctor_id: user.id,
              transcription: result.transcription,
              formatted_notes: result.formattedNotes,
              status: 'completed'
            }
          ])
          .select()

        if (error) {
          alert('Error al guardar: ' + error.message)
        } else {
          alert('¡Consulta procesada exitosamente!')
          
          if (process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL) {
            fetch(process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                patientName: patients.find(p => p.id === selectedPatient)?.full_name || 'Desconocido',
                notes: result.formattedNotes.substring(0, 200) + '...'
              })
            }).catch(_err => {
              console.error("Error al notificar a n8n:", _err);
            });
          }

          setAudioBlob(null)
          setSelectedPatient('')
          loadConsultations()
        }
      } else {
        alert('Error al procesar audio: ' + result.error)
      }
    } catch (_error) { // CAMBIO: 'error' se renombró a '_error'
      alert('Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">Cargando...</div>
    </div>
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">Sistema Médico</h1>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Mic className="w-5 h-5 mr-2 text-blue-600" />
              Nueva Consulta
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Paciente
                </label>
                <select
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar...</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-3">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    disabled={!selectedPatient}
                    className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 disabled:bg-gray-400"
                  >
                    <Mic className="w-4 h-4" />
                    <span>Grabar</span>
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                  >
                    <Square className="w-4 h-4" />
                    <span>Parar</span>
                  </button>
                )}
                {audioBlob && (
                  <button
                    onClick={processAudio}
                    disabled={loading}
                    className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
                  >
                    <FileText className="w-4 h-4" />
                    <span>{loading ? 'Procesando...' : 'Procesar'}</span>
                  </button>
                )}
              </div>
              {isRecording && (
                <div className="text-center text-red-500 font-medium">
                  🔴 Grabando... (máximo 30 segundos)
                </div>
              )}
              {audioBlob && (
                <div className="text-center text-green-500 font-medium">
                  ✅ Audio listo para procesar
                </div>
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              Consultas Recientes Prueba
            </h2>
            <div className="space-y-3">
              {consultations.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No hay consultas aún
                </p>
              ) : (
                consultations.map((consultation) => (
                  <div key={consultation.id} className="border border-gray-200 rounded-md p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-800">
                          {consultation.patients?.full_name || 'Paciente desconocido'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {new Date(consultation.created_at).toLocaleDateString('es-AR')}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        consultation.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {consultation.status === 'completed' ? 'Completada' : 'Procesando'}
                      </span>
                    </div>
                    {consultation.formatted_notes && (
                      <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                        {consultation.formatted_notes.substring(0, 100)}...
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}