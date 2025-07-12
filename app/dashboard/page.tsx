'use client'

import { useEffect, useState, useRef, FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Mic, Square, FileText, LogOut, UserPlus, X, Send, Users, 
  LayoutDashboard, Settings, Search, Bell, LifeBuoy, BarChart3
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
  patient_id: string | null;
  patients: { full_name: string; } | null;
}

// --- Componentes de UI Rediseñados ---
function Sidebar({ profile }: { profile: Profile | null }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={`bg-white border-r border-gray-200 flex-col flex-shrink-0 hidden md:flex transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="h-20 flex items-center px-6 justify-center">
        <h1 className={`text-2xl font-bold text-blue-600 overflow-hidden transition-all ${isCollapsed ? 'w-0' : 'w-auto'}`}>Sistema Médico</h1>
      </div>
      <nav className="flex-grow px-4">
        <ul className="space-y-2">
          <li>
            <Link href="/dashboard" className="flex items-center p-3 rounded-lg text-white bg-blue-600 font-semibold shadow-md">
              <LayoutDashboard size={20} />
              {!isCollapsed && <span className="ml-4">Panel Principal</span>}
            </Link>
          </li>
          {profile?.role === 'doctor' && (
            <li>
              <Link href="/dashboard/manage-assistants" className="flex items-center p-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                <Users size={20} />
                {!isCollapsed && <span className="ml-4">Gestionar Asistentes</span>}
              </Link>
            </li>
          )}
           <li>
            <Link href="/dashboard/all-consultations" className="flex items-center p-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
              <Search size={20} />
              {!isCollapsed && <span className="ml-4">Todas las Consultas</span>}
            </Link>
          </li>
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-200">
        <a href="#" className="flex items-center p-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
          <LifeBuoy size={20} />
          {!isCollapsed && <span className="ml-4">Ayuda y Soporte</span>}
        </a>
        <a href="#" className="flex items-center p-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
          <Settings size={20} />
          {!isCollapsed && <span className="ml-4">Configuración</span>}
        </a>
      </div>
    </aside>
  );
}

function Header({ profile, onLogout }: { profile: Profile | null, onLogout: () => void }) {
  return (
    <header className="bg-gray-50/50 backdrop-blur-sm sticky top-0 z-10 py-4 px-6 md:py-6 md:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Bienvenido, {profile?.full_name?.split(' ')[0]}</h2>
          <p className="text-sm text-gray-500 hidden md:block">Aquí tienes el resumen de tu actividad.</p>
        </div>
        <div className="flex items-center space-x-4 md:space-x-6">
          <div className="relative hidden md:block">
            <input 
              type="text"
              placeholder="Buscar..."
              className="w-full md:w-72 p-2 pl-10 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          <button className="p-2 rounded-full hover:bg-gray-200">
            <Bell size={22} className="text-gray-600" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
              {profile?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="hidden md:block">
              <p className="font-semibold text-gray-800">{profile?.full_name}</p>
              <p className="text-xs text-gray-500 capitalize">{profile?.role}</p>
            </div>
            <button onClick={onLogout} title="Cerrar Sesión" className="p-2 text-gray-500 hover:text-red-600">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

function StatCard({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: React.ElementType, color: string }) {
  return (
    <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
      <div className={`p-3 rounded-full ${color}`}>
        <Icon size={20} className="md:size-24 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-xl md:text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  )
}


export default function Dashboard() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null);
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState('')
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [newPatientEmail, setNewPatientEmail] = useState('');
  const [isSavingPatient, setIsSavingPatient] = useState(false);
  
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const checkUserAndProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
      } else {
        setUser(user)
        const { data: userProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(userProfile);
        await loadPatients();
        await loadConsultations();
        setLoading(false);
      }
    }
    checkUserAndProfile()
  }, [router])

  const loadPatients = async () => {
    const { data, error } = await supabase.from('patients').select('*').order('created_at', { ascending: false })
    if (error) console.error("Error al cargar pacientes:", error); else setPatients(data || [])
  }

  const loadConsultations = async () => {
    const { data, error } = await supabase.from('consultations').select(`*, patients!inner(full_name)`).order('created_at', { ascending: false }).limit(20)
    if(error) console.error("Error al cargar consultas:", error); else setConsultations(data || [])
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  }

  const handleCreatePatient = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPatientName || !user) {
      alert('El nombre del paciente es obligatorio.');
      return;
    }
    setIsSavingPatient(true);
    const { error } = await supabase
      .from('patients')
      .insert([{ 
        full_name: newPatientName, 
        phone: newPatientPhone,
        email: newPatientEmail,
        user_id: user.id 
      }]);
    setIsSavingPatient(false);
    if (error) {
      alert("Error al crear el paciente: " + error.message);
    } else {
      alert("¡Paciente creado exitosamente!");
      setNewPatientName('');
      setNewPatientPhone('');
      setNewPatientEmail('');
      setIsPatientModalOpen(false);
      await loadPatients();
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
          setAudioBlob(null)
          setSelectedPatient('')
          await loadConsultations()
        }
      } else { alert('Error al procesar audio: ' + (result.error || 'Error desconocido')) }
    } catch (err) { 
      console.error("Error general en processAudio:", err);
      alert('Error inesperado. Revisa la consola para más detalles.');
    } finally { setIsProcessingAudio(false) }
  }

  if (loading) {
    return <div className="h-screen bg-gray-50 flex items-center justify-center">Cargando...</div>
  }

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email (Opcional)</label>
                  <input type="email" value={newPatientEmail} onChange={(e) => setNewPatientEmail(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="ejemplo@correo.com" />
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

      <Sidebar profile={profile} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header profile={profile} onLogout={handleLogout} />
        
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <StatCard title="Pacientes Totales" value={patients.length} icon={Users} color="bg-orange-500" />
            <StatCard title="Consultas Hoy" value="12" icon={FileText} color="bg-green-500" />
            <StatCard title="Nuevos Pacientes (Mes)" value="8" icon={UserPlus} color="bg-blue-500" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center"><Mic className="w-6 h-6 mr-3 text-blue-600" />Nueva Consulta</h2>
                <button onClick={() => setIsPatientModalOpen(true)} className="flex items-center space-x-2 text-sm bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors shadow-sm">
                  <UserPlus size={16} />
                  <span>Nuevo Paciente</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">1. Seleccionar Paciente</label>
                  <select value={selectedPatient} onChange={(e) => setSelectedPatient(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Seleccionar...</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>{patient.full_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">2. Grabar Audio</label>
                  <div className="flex space-x-3">
                    {!isRecording ? (
                      <button onClick={startRecording} disabled={!selectedPatient} className="flex items-center space-x-2 bg-red-500 text-white px-5 py-3 rounded-lg hover:bg-red-600 disabled:bg-gray-300 transition-colors shadow-sm"><Mic className="w-5 h-5" /><span className="font-semibold">Grabar</span></button>
                    ) : (
                      <button onClick={stopRecording} className="flex items-center space-x-2 bg-gray-700 text-white px-5 py-3 rounded-lg hover:bg-gray-800 transition-colors shadow-sm"><Square className="w-5 h-5" /><span className="font-semibold">Parar</span></button>
                    )}
                    {audioBlob && (
                      <button onClick={processAudio} disabled={isProcessingAudio} className="flex items-center space-x-2 bg-blue-500 text-white px-5 py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors shadow-sm"><FileText className="w-5 h-5" /><span className="font-semibold">{isProcessingAudio ? 'Procesando...' : 'Procesar'}</span></button>
                    )}
                  </div>
                </div>
              </div>
              {isRecording && <div className="text-center text-red-500 font-medium pt-4">🔴 Grabando...</div>}
              {audioBlob && !isRecording && <div className="text-center text-green-600 font-medium pt-4">✅ Audio listo para procesar</div>}
            </div>

            <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col" style={{height: '500px'}}>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center flex-shrink-0"><FileText className="w-6 h-6 mr-3 text-blue-600" />Consultas Recientes</h2>
              <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                {consultations.length === 0 ? <p className="text-gray-500 text-center py-8">No hay consultas aún.</p> : (
                  consultations.map((consultation) => (
                    <Link href={`/dashboard/consultation/${consultation.id}`} key={consultation.id}>
                      <div className="border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-all">
                        <div className="flex justify-between items-start">
                          <p className="font-semibold text-gray-800 text-sm">{consultation.patients?.full_name || 'Paciente desconocido'}</p>
                          <p className="text-xs text-gray-500">{new Date(consultation.created_at).toLocaleDateString('es-AR')}</p>
                        </div>
                        <p className="mt-1 text-xs text-gray-600 truncate">{consultation.formatted_notes}</p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}