'use client'

import { useEffect, useState, useRef, FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
// CAMBIO: Se importa el ícono 'Search'
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

// --- Componente de la Barra Lateral (sin cambios) ---
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
  
  // NUEVO: Estados para la búsqueda
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

  // CAMBIO: La función de carga ahora acepta un término de búsqueda
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

  // CAMBIO: La función de carga ahora acepta un término de búsqueda
  const loadConsultations = async (searchTerm: string) => {
    let query = supabase
      .from('consultations')
      .select(`*, patients (full_name)`)
      .order('created_at', { ascending: false })
      .limit(10);

    if (searchTerm) {
      // Buscamos tanto en las notas como en el nombre del paciente
      query = query.or(`formatted_notes.ilike.%${searchTerm}%,patients.full_name.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query;
    if(error) console.error("Error al cargar consultas:", error);
    else setConsultations(data || []);
  }

  // CAMBIO: Carga inicial de datos
  useEffect(() => {
    const checkUserAndProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
      } else {
        setUser(user)
        const { data: userProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(userProfile);
        await loadPatients(''); // Carga inicial sin búsqueda
        await loadConsultations(''); // Carga inicial sin búsqueda
        setLoading(false);
      }
    }
    checkUserAndProfile()
  }, [router])

  // NUEVO: useEffect para la búsqueda "debounced" de pacientes
  useEffect(() => {
    const timer = setTimeout(() => {
      loadPatients(patientSearch);
    }, 500); // Espera 500ms después de que el usuario deja de escribir
    return () => clearTimeout(timer);
  }, [patientSearch]);

  // NUEVO: useEffect para la búsqueda "debounced" de consultas
  useEffect(() => {
    const timer = setTimeout(() => {
      loadConsultations(consultationSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [consultationSearch]);


  const handleLogout = async () => { /* ...código sin cambios... */ }
  const handleInviteAssistant = async (e: FormEvent) => { /* ...código sin cambios... */ };
  const handleCreatePatient = async (e: FormEvent) => { /* ...código sin cambios... */ };
  const startRecording = async () => { /* ...código sin cambios... */ };
  const stopRecording = () => { /* ...código sin cambios... */ };
  const processAudio = async () => { /* ...código sin cambios... */ };

  if (loading) {
    return <div className="h-screen bg-gray-50 flex items-center justify-center">Cargando...</div>
  }

  return (
    <>
      {/* Modal para crear paciente (sin cambios) */}
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
                      {/* CAMBIO: Se añade barra de búsqueda de pacientes */}
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
                      <div className="flex space-x-3">{/* ...botones de grabación sin cambios... */}</div>
                    </div>
                    
                    {isRecording && <div className="text-center text-red-500 font-medium pt-2">🔴 Grabando...</div>}
                    {audioBlob && !isRecording && <div className="text-center text-green-600 font-medium pt-2">✅ Audio listo para procesar</div>}
                  </div>
                </div>

                {profile?.role === 'doctor' && (
                  <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">{/* ...panel de gestión sin cambios... */}</div>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center"><FileText className="w-6 h-6 mr-3 text-blue-600" />Consultas Recientes</h2>
                {/* CAMBIO: Se añade barra de búsqueda de consultas */}
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
                        <div className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-all">{/* ...contenido de la tarjeta de consulta sin cambios... */}</div>
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