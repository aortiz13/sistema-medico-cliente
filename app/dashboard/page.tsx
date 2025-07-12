'use client'

import { useEffect, useState, useRef, FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
// NUEVO: Se importa el ícono para el nuevo botón
import { Mic, Square, FileText, LogOut, UserPlus, X } from 'lucide-react'
import { User as SupabaseUser } from '@supabase/supabase-js'

// Interfaces (sin cambios)
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
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  // NUEVO: Estados para manejar el modal de creación de pacientes
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [isSavingPatient, setIsSavingPatient] = useState(false);


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
      .select(`*, patients (full_name)`)
      .order('created_at', { ascending: false })
      .limit(5)
    setConsultations(data || [])
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  // NUEVO: Función para crear un nuevo paciente
  const handleCreatePatient = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPatientName || !user) {
      alert('El nombre del paciente es obligatorio.');
      return;
    }

    setIsSavingPatient(true);
    
    const { error } = await supabase
      .from('patients')
      .insert([
        { 
          full_name: newPatientName, 
          phone: newPatientPhone,
          user_id: user.id // Asigna el paciente al usuario actual
        }
      ]);

    setIsSavingPatient(false);

    if (error) {
      alert("Error al crear el paciente: " + error.message);
    } else {
      alert("¡Paciente creado exitosamente!");
      // Limpiar y cerrar el modal
      setNewPatientName('');
      setNewPatientPhone('');
      setIsModalOpen(false);
      // Recargar la lista de pacientes para que aparezca el nuevo
      loadPatients();
    }
  };


  // --- Lógica de grabación (sin cambios) ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioStreamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder;
      const audioChunks: Blob[] = []
      mediaRecorder.ondataavailable = (event) => audioChunks.push(event.data)
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
        setAudioBlob(audioBlob)
        audioStreamRef.current?.getTracks().forEach(track => track.stop());
      }
      mediaRecorder.start()
      setIsRecording(true)
      setAudioBlob(null);
    } catch { alert('Error al acceder al micrófono') }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
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
      const response = await fetch('/api/transcribe', { method: 'POST', body: formData })
      const result = await response.json()
      if (result.success) {
        const { error } = await supabase
          .from('consultations')
          .insert([{
              patient_id: selectedPatient,
              doctor_id: user.id,
              transcription: result.transcription,
              formatted_notes: result.formattedNotes,
              status: 'completed'
          }])
        if (error) { alert('Error al guardar: ' + error.message) } 
        else {
          alert('¡Consulta procesada exitosamente!')
          if (process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL) {
            fetch(process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                patientName: patients.find(p => p.id === selectedPatient)?.full_name || 'Desconocido',
                notes: result.formattedNotes.substring(0, 200) + '...'
              })
            }).catch(err => console.error("Error al notificar a n8n:", err));
          }
          setAudioBlob(null)
          setSelectedPatient('')
          loadConsultations()
        }
      } else { alert('Error al procesar audio: ' + result.error) }
    } catch { alert('Error inesperado')
    } finally { setLoading(false) }
  }


  if (!user) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">Cargando...</div>
    </div>
  }

  return (
    <>
      {/* NUEVO: Modal para crear paciente */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold mb-6">Nuevo Paciente</h2>
            <form onSubmit={handleCreatePatient}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    value={newPatientName}
                    onChange={(e) => setNewPatientName(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md"
                    placeholder="Ej: Carlos Sánchez"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono (Opcional)</label>
                  <input
                    type="tel"
                    value={newPatientPhone}
                    onChange={(e) => setNewPatientPhone(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md"
                    placeholder="Ej: 11-2233-4455"
                  />
                </div>
              </div>
              <div className="mt-8 flex justify-end space-x-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200">
                  Cancelar
                </button>
                <button type="submit" disabled={isSavingPatient} className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400">
                  {isSavingPatient ? 'Guardando...' : 'Guardar Paciente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-600">Sistema Médico</h1>
            <button onClick={handleLogout} className="flex items-center space-x-2 text-gray-600 hover:text-gray-800">
              <LogOut className="w-5 h-5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <Mic className="w-5 h-5 mr-2 text-blue-600" />
                  Nueva Consulta
                </h2>
                {/* NUEVO: Botón para abrir el modal */}
                <button onClick={() => setIsModalOpen(true)} className="flex items-center space-x-2 text-sm bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600">
                  <UserPlus size={16} />
                  <span>Nuevo Paciente</span>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Paciente</label>
                  <select value={selectedPatient} onChange={(e) => setSelectedPatient(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
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
                    <button onClick={startRecording} disabled={!selectedPatient} className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 disabled:bg-gray-400">
                      <Mic className="w-4 h-4" />
                      <span>Grabar</span>
                    </button>
                  ) : (
                    <button onClick={stopRecording} className="flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">
                      <Square className="w-4 h-4" />
                      <span>Parar</span>
                    </button>
                  )}
                  {audioBlob && (
                    <button onClick={processAudio} disabled={loading} className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400">
                      <FileText className="w-4 h-4" />
                      <span>{loading ? 'Procesando...' : 'Procesar'}</span>
                    </button>
                  )}
                </div>
                
                {isRecording && <div className="text-center text-red-500 font-medium">🔴 Grabando...</div>}
                {audioBlob && !isRecording && <div className="text-center text-green-500 font-medium">✅ Audio listo para procesar</div>}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                Consultas Recientes
              </h2>
              <div className="space-y-3">
                {consultations.length === 0 ? <p className="text-gray-500 text-center py-4">No hay consultas aún</p> : (
                  consultations.map((consultation) => (
                    <Link href={`/dashboard/consultation/${consultation.id}`} key={consultation.id}>
                      <div className="border border-gray-200 rounded-md p-3 cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-800">{consultation.patients?.full_name || 'Paciente desconocido'}</h3>
                            <p className="text-sm text-gray-600">{new Date(consultation.created_at).toLocaleDateString('es-AR')}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${consultation.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {consultation.status === 'completed' ? 'Completada' : 'Procesando'}
                          </span>
                        </div>
                        {consultation.formatted_notes && (
                          <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded whitespace-pre-wrap">
                            {consultation.formatted_notes.substring(0, 100)}...
                          </div>
                        )}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}