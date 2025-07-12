'use client'

import { useEffect, useState, useRef, FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Mic, Square, FileText, LogOut, UserPlus, X, Send, Users, 
  LayoutDashboard, Settings, ChevronLeft, Menu, Search
} from 'lucide-react'
import { User as SupabaseUser } from '@supabase/supabase-js'

// --- Interfaces ---
interface Profile {
  id: string;
  full_name: string;
  role: string;
}
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
  patients: { full_name: string; } | null;
}

// --- Componente de la Barra Lateral ---
function Sidebar({ profile, onLogout }: { profile: Profile | null, onLogout: () => void }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && <span className="text-xl font-bold text-blue-600">Sistema Médico</span>}
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-2 rounded-md hover:bg-gray-100">
          {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
      <nav className="flex-grow p-4 space-y-2">
        <Link href="/dashboard" className="flex items-center p-3 rounded-lg text-gray-700 bg-blue-50 font-semibold">
          <LayoutDashboard size={20} className="text-blue-600" />
          {!isCollapsed && <span className="ml-4">Panel Principal</span>}
        </Link>
        {profile?.role === 'doctor' && (
          <Link href="/dashboard/manage-assistants" className="flex items-center p-3 rounded-lg text-gray-600 hover:bg-gray-100">
            <Users size={20} />
            {!isCollapsed && <span className="ml-4">Gestionar Asistentes</span>}
          </Link>
        )}
        <a href="#" className="flex items-center p-3 rounded-lg text-gray-600 hover:bg-gray-100">
          <Settings size={20} />
          {!isCollapsed && <span className="ml-4">Configuración</span>}
        </a>
      </nav>
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
            {profile?.full_name?.charAt(0) || 'U'}
          </div>
          {!isCollapsed && (
            <div className="ml-3">
              <p className="text-sm font-semibold text-gray-800">{profile?.full_name}</p>
              <p className="text-xs text-gray-500 capitalize">{profile?.role}</p>
            </div>
          )}
        </div>
        <button onClick={onLogout} className="w-full mt-4 flex items-center justify-center p-3 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600">
          <LogOut size={20} />
          {!isCollapsed && <span className="ml-4">Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
}


export default function Dashboard() {
  // --- Estados y Hooks ---
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null);
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState('')
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  
  const [patientSearch, setPatientSearch] = useState('');
  const [consultationSearch, setConsultationSearch] = useState('');

  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [isSavingPatient, setIsSavingPatient] = useState(false);
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  const loadPatients = async (searchTerm: string) => {
    let query = supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });

    if (searchTerm) {
      query = query.ilike('full_name', `%${searchTerm}%`);
    }

    const { data, error } = await query;
    if (error) console.error("Error al cargar pacientes:", error);
    else setPatients(data || []);
  }

  const loadConsultations = async (searchTerm: string) => {
    let query = supabase
      .from('consultations')
      .select(`*, patients (full_name)`)
      .order('created_at', { ascending: false })
      .limit(10);

    if (searchTerm) {
      query = query.or(`formatted_notes.ilike.%${searchTerm}%,patients.full_name.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query;
    if(error) console.error("Error al cargar consultas:", error);
    else setConsultations(data || []);
  }

  useEffect(() => {
    const checkUserAndProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
      } else {
        setUser(user)
        const { data: userProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(userProfile);
        await loadPatients('');
        await loadConsultations('');
        setLoading(false);
      }
    }
    checkUserAndProfile()
  }, [router])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPatients(patientSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [patientSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadConsultations(consultationSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [consultationSearch]);


  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  }
  
  const handleInviteAssistant = async (e: FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setIsInviting(true);

    try {
      const response = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Falló al enviar la invitación.');
      }
      alert('¡Invitación enviada exitosamente!');
      setInviteEmail('');
    } catch (error) {
      if (error instanceof Error) {
        alert('Error: ' + error.message);
      } else {
        alert('Ocurrió un error inesperado.');
      }
    } finally {
      setIsInviting(false);
    }
  };

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
          user_id: user.id
        }
      ]);

    setIsSavingPatient(false);

    if (error) {
      alert("Error al crear el paciente: " + error.message);
    } else {
      alert("¡Paciente creado exitosamente!");
      setNewPatientName('');
      setNewPatientPhone('');
      setIsPatientModalOpen(false);
      await loadPatients('');
    }
  };

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
    setIsProcessingAudio(true)
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'audio.wav')
      formData.append('patientId', selectedPatient)
      const response = await fetch('/api/transcribe', { method: 'POST', body: formData })
      const result = await response.json()
      
      if (result.success) {
        // En la base de datos, usamos 'formatted_notes' (snake_case)
        const { error } = await supabase
          .from('consultations')
          .insert([{
              patient_id: selectedPatient,
              doctor_id: user.id,
              transcription: result.transcription,
              formatted_notes: result.formattedNotes, // Usamos la variable correcta de la API
              status: 'completed'
          }])
        if (error) { 
          alert('Error al guardar en la base de datos: ' + error.message);
        } else {
          alert('¡Consulta procesada exitosamente!');
          
          if (process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL) {
            // CAMBIO: Se usa result.formattedNotes (camelCase)
            const notesForN8N = result.formattedNotes ? result.formattedNotes.substring(0, 200) + '...' : 'Sin resumen.';
            fetch(process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                patientName: patients.find(p => p.id === selectedPatient)?.full_name || 'Desconocido',
                notes: notesForN8N
              })
            }).catch(err => console.error("La llamada a n8n falló:", err));
          }
          
          setAudioBlob(null);
          setSelectedPatient('');
          await loadConsultations('');
        }
      } else { 
        alert('Error al procesar audio: ' + (result.error || 'Error desconocido'));
      }
    } catch (err) { 
      console.error("Error general en processAudio:", err);
      alert('Error inesperado. Revisa la consola para más detalles.');
    } finally { 
      setIsProcessingAudio(false);
    }
  }

  if (loading) {
    return <div className="h-screen bg-gray-50 flex items-center justify-center">Cargando...</div>
  }

  return (
    <>
      {isPatientModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md relative">
            <button onClick={() => setIsPatientModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors"><X size={24} /></button>
            <h2 className="text-2xl font-bold mb-6">Nuevo Paciente</h2>
            <form onSubmit={handleCreatePatient}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                  <input type="text" value={newPatientName} onChange={(e) => setNewPatientName(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej: Carlos Sánchez" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono (Opcional)</label>
                  <input type="tel" value={newPatientPhone} onChange={(e) => setNewPatientPhone(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej: 11-2233-4455" />
                </div>
              </div>
              <div className="mt-8 flex justify-end space-x-4">
                <button type="button" onClick={() => setIsPatientModalOpen(false)} className="px-4 py-2 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">Cancelar</button>
                <button type="submit" disabled={isSavingPatient} className="px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 transition-colors">{isSavingPatient ? 'Guardando...' : 'Guardar Paciente'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="h-screen flex bg-gray-50">
        <Sidebar profile={profile} onLogout={handleLogout} />
        
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Panel Principal</h1>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
              <div className="space-y-8">
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center"><Mic className="w-6 h-6 mr-3 text-blue-600" />Nueva Consulta</h2>
                    <button onClick={() => setIsPatientModalOpen(true)} className="flex items-center space-x-2 text-sm bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors shadow-sm"><UserPlus size={16} /><span>Nuevo Paciente</span></button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">1. Buscar y Seleccionar Paciente</label>
                      <div className="relative">
                        <input 
                          type="text"
                          placeholder="Buscar paciente por nombre..."
                          value={patientSearch}
                          onChange={(e) => setPatientSearch(e.target.value)}
                          className="w-full p-3 pl-10 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      </div>
                      <select value={selectedPatient} onChange={(e) => setSelectedPatient(e.target.value)} className="w-full p-3 mt-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Seleccionar de la lista...</option>
                        {patients.map((patient) => (
                          <option key={patient.id} value={patient.id}>{patient.full_name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">2. Grabar Audio</label>
                      <div className="flex space-x-3">
                        {!isRecording ? (
                          <button onClick={startRecording} disabled={!selectedPatient} className="flex items-center space-x-2 bg-red-500 text-white px-5 py-3 rounded-lg hover:bg-red-600 disabled:bg-gray-300 transition-colors shadow-sm">
                            <Mic className="w-5 h-5" />
                            <span className="font-semibold">Grabar</span>
                          </button>
                        ) : (
                          <button onClick={stopRecording} className="flex items-center space-x-2 bg-gray-700 text-white px-5 py-3 rounded-lg hover:bg-gray-800 transition-colors shadow-sm">
                            <Square className="w-5 h-5" />
                            <span className="font-semibold">Parar</span>
                          </button>
                        )}
                        {audioBlob && (
                          <button onClick={processAudio} disabled={isProcessingAudio} className="flex items-center space-x-2 bg-blue-500 text-white px-5 py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors shadow-sm">
                            <FileText className="w-5 h-5" />
                            <span className="font-semibold">{isProcessingAudio ? 'Procesando...' : 'Procesar'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {isRecording && <div className="text-center text-red-500 font-medium pt-2">🔴 Grabando...</div>}
                    {audioBlob && !isRecording && <div className="text-center text-green-600 font-medium pt-2">✅ Audio listo para procesar</div>}
                  </div>
                </div>

                {profile?.role === 'doctor' && (
                  <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                      <Users className="w-6 h-6 mr-3 text-blue-600" />
                      Gestión de Equipo
                    </h2>
                    <div className="space-y-4">
                      <form onSubmit={handleInviteAssistant} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                        <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="flex-grow p-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="email@asistente.com" required />
                        <button type="submit" disabled={isInviting} className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors shadow-sm">
                          <Send size={16} />
                          <span className="font-semibold">{isInviting ? 'Enviando...' : 'Invitar'}</span>
                        </button>
                      </form>
                      <Link href="/dashboard/manage-assistants" className="block w-full text-center bg-gray-200 text-gray-800 px-4 py-3 rounded-lg hover:bg-gray-300 font-semibold transition-colors">
                        Gestionar Asistentes
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center"><FileText className="w-6 h-6 mr-3 text-blue-600" />Consultas Recientes</h2>
                <div className="relative mb-4">
                  <input 
                    type="text"
                    placeholder="Buscar en notas o pacientes..."
                    value={consultationSearch}
                    onChange={(e) => setConsultationSearch(e.target.value)}
                    className="w-full p-3 pl-10 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                <div className="space-y-3">
                  {consultations.length === 0 ? <p className="text-gray-500 text-center py-8">No se encontraron consultas.</p> : (
                    consultations.map((consultation) => (
                      <Link href={`/dashboard/consultation/${consultation.id}`} key={consultation.id}>
                        <div className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-all">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-gray-800">{consultation.patients?.full_name || 'Paciente desconocido'}</h3>
                              <p className="text-sm text-gray-500">{new Date(consultation.created_at).toLocaleDateString('es-AR')}</p>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${consultation.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              Completada
                            </span>
                          </div>
                          {consultation.formatted_notes && (
                            <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                              {consultation.formatted_notes.substring(0, 100)}...
                            </p>
                          )}
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}