'use client'

import { useEffect, useState, useRef, FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Mic, Square, FileText, LogOut, UserPlus, X, Users,
  LayoutDashboard, Settings, Search, Bell, LifeBuoy, Activity
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
  email?: string;
  created_at: string;
}

// Define un tipo específico para el objeto de las notas
interface FormattedNote {
  note_content: string;
}

interface Consultation {
  id: string;
  created_at: string;
  status: string;
  // Usa el tipo FormattedNote en lugar de 'any' para mayor seguridad
  formatted_notes: FormattedNote | null;
  patient_id: string | null;
  patients?: { full_name: string; } | null;
}

// --- Componentes de UI ---
function Sidebar({ profile }: { profile: Profile | null }) {
  const NavLink = ({ href, icon: Icon, children }: { href: string, icon: React.ElementType, children: React.ReactNode }) => {
    const pathname = usePathname();
    const isActive = pathname === href;
    return (
      <li>
        <Link href={href} className={`flex items-center p-3 rounded-lg transition-all duration-200 ${isActive ? 'bg-primary text-white shadow-soft' : 'text-text-secondary hover:bg-base-200 hover:text-text-primary'}`}>
          <Icon size={22} /><span className="ml-4 font-semibold">{children}</span>
        </Link>
      </li>
    );
  };
  return (
    <aside className="w-64 bg-base-100 border-r border-base-300 flex-col flex-shrink-0 hidden md:flex">
      <div className="h-24 flex items-center justify-center px-6">
        <div className="relative w-40 h-12">
          <Image src="/logo.png" alt="Logo del Sistema Médico" fill style={{ objectFit: "contain" }} onError={(e) => e.currentTarget.src = 'https://placehold.co/160x48/39B6E3/FFFFFF?text=Logo'}/>
        </div>
      </div>
      <nav className="flex-grow px-4">
        <ul className="space-y-2">
          <NavLink href="/dashboard" icon={LayoutDashboard}>Panel Principal</NavLink>
          <NavLink href="/dashboard/all-consultations" icon={Search}>Consultas</NavLink>
          {profile?.role === 'doctor' && (
            <>
              <NavLink href="/dashboard/manage-assistants" icon={Users}>Asistentes</NavLink>
            </>
          )}
        </ul>
      </nav>
      <div className="p-4 border-t border-base-300">
        <a href="#" className="flex items-center p-3 rounded-lg text-text-secondary hover:bg-base-200"><LifeBuoy size={22} /><span className="ml-4 font-semibold">Ayuda</span></a>
        <a href="#" className="flex items-center p-3 rounded-lg text-text-secondary hover:bg-base-200"><Settings size={22} /><span className="ml-4 font-semibold">Configuración</span></a>
      </div>
    </aside>
  );
}

function Header({ profile, onLogout }: { profile: Profile | null, onLogout: () => void }) {
  return (
    <header className="bg-base-100/80 backdrop-blur-sm sticky top-0 z-10 py-5 px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Panel Principal</h1>
        <div className="flex items-center space-x-5">
          <div className="relative">
            <input type="text" placeholder="Buscar..." className="w-72 p-2.5 pl-10 border border-base-300 rounded-lg bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary" />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
          </div>
          <button className="relative p-2 text-text-secondary rounded-full hover:bg-base-200 hover:text-text-primary transition-colors">
            <Bell size={24} />
            <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-accent"></span>
          </button>
          <div className="flex items-center space-x-3 border-l border-base-300 pl-5">
            <div className="w-11 h-11 rounded-full bg-secondary text-white flex items-center justify-center font-bold text-lg">{profile?.full_name?.charAt(0) || 'U'}</div>
            <div>
              <p className="font-bold text-text-primary">{profile?.full_name}</p>
              <p className="text-xs text-text-secondary capitalize">{profile?.role}</p>
            </div>
            <button onClick={onLogout} title="Cerrar Sesión" className="p-2 text-text-secondary hover:text-accent transition-colors"><LogOut size={22} /></button>
          </div>
        </div>
      </div>
    </header>
  )
}

function StatCard({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: React.ElementType, color: string }) {
  return (
    <div className="bg-base-100 p-6 rounded-xl border border-base-300 shadow-soft flex items-center space-x-5">
      <div className={`p-4 rounded-lg ${color}`}><Icon size={28} className="text-white" /></div>
      <div>
        <p className="text-sm font-semibold text-text-secondary">{title}</p>
        <p className="text-3xl font-bold text-text-primary">{value}</p>
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
  
  const [consultationType, setConsultationType] = useState('new_patient');

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
    const { data, error } = await supabase.from('consultations').select(`*, patients!inner(full_name)`).order('created_at', { ascending: false }).limit(5)
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
    try {
      const { error } = await supabase
        .from('patients')
        .insert([{ 
          full_name: newPatientName, 
          phone: newPatientPhone,
          email: newPatientEmail,
          user_id: user.id 
        }]);

      if (error) throw error;

      alert("¡Paciente creado exitosamente!");
      setNewPatientName('');
      setNewPatientPhone('');
      setNewPatientEmail('');
      setIsPatientModalOpen(false);
      await loadPatients();
    } catch (err) {
        if (err instanceof Error) {
            alert("Error al crear el paciente: " + err.message);
        } else {
            alert("Ocurrió un error inesperado al crear el paciente.");
        }
    } finally {
      setIsSavingPatient(false);
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
      formData.append('consultationType', consultationType)

      const response = await fetch('/api/transcribe', { method: 'POST', body: formData })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Respuesta de error no es JSON' }));
        throw new Error(errorData.error || `Error de red o API: ${response.status} ${response.statusText}`);
      }

      const result = await response.json()
      if (result.success && result.clinicalNote) {

        const notesAsJson = {
          note_content: result.clinicalNote 
        };
        
        const dataToInsert = {
          patient_id: selectedPatient,
          doctor_id: user.id,
          transcription: result.transcription,
          formatted_notes: notesAsJson,
          status: 'completed'
        };

        const { error: consultationError } = await supabase
          .from('consultations')
          .insert([dataToInsert]);

        if (consultationError) {
          console.error("Error al insertar en Supabase:", consultationError);
          throw consultationError;
        }

        alert('¡Consulta procesada exitosamente!')
        setAudioBlob(null)
        setSelectedPatient('')
        await loadConsultations()

      } else { 
        alert('Error al procesar audio: ' + (result.error || 'La API no devolvió una nota clínica válida.')) 
      }
    } catch (err) { 
      console.error("Error general en processAudio:", err);
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('Error inesperado. Revisa la consola para más detalles.');
      }
    } finally { 
      setIsProcessingAudio(false) 
    }
  }

  if (loading) {
    return <div className="h-screen bg-base-200 flex items-center justify-center text-text-secondary">Cargando...</div>
  }

  return (
    <div className="h-screen flex bg-base-200 overflow-hidden">
      {isPatientModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
          <div className="bg-base-100 p-8 rounded-xl shadow-2xl w-full max-w-md relative">
            <button onClick={() => setIsPatientModalOpen(false)} className="absolute top-4 right-4 text-text-secondary hover:text-accent transition-colors"><X size={24} /></button>
            <h2 className="text-2xl font-bold mb-6 text-text-primary">Nuevo Paciente</h2>
            <form onSubmit={handleCreatePatient}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-1">Nombre Completo</label>
                  <input type="text" value={newPatientName} onChange={(e) => setNewPatientName(e.target.value)} className="w-full p-3 border border-base-300 rounded-lg bg-base-200 focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Ej: Carlos Sánchez" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-1">Teléfono (Opcional)</label>
                  <input type="tel" value={newPatientPhone} onChange={(e) => setNewPatientPhone(e.target.value)} className="w-full p-3 border border-base-300 rounded-lg bg-base-200 focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Ej: 11-2233-4455" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-1">Email (Opcional)</label>
                  <input type="email" value={newPatientEmail} onChange={(e) => setNewPatientEmail(e.target.value)} className="w-full p-3 border border-base-300 rounded-lg bg-base-200 focus:outline-none focus:ring-2 focus:ring-primary" placeholder="ejemplo@correo.com" />
                </div>
              </div>
              <div className="mt-8 flex justify-end space-x-4">
                <button type="button" onClick={() => setIsPatientModalOpen(false)} className="px-5 py-2.5 rounded-lg text-text-primary bg-base-200 hover:bg-base-300 font-semibold transition-colors">Cancelar</button>
                <button type="submit" disabled={isSavingPatient} className="px-5 py-2.5 rounded-lg text-white bg-secondary hover:opacity-90 disabled:bg-gray-400 font-semibold transition-colors shadow-soft">{isSavingPatient ? 'Guardando...' : 'Guardar Paciente'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="h-screen flex bg-base-200 overflow-hidden">
        <Sidebar profile={profile} />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header profile={profile} onLogout={handleLogout} />
          
          <main className="flex-1 p-8 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <StatCard title="Pacientes Totales" value={patients.length} icon={Users} color="bg-orange-400" />
              <StatCard title="Consultas Hoy" value="12" icon={Activity} color="bg-green-500" />
              <StatCard title="Nuevos Pacientes (Mes)" value="8" icon={UserPlus} color="bg-secondary" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2 bg-base-100 rounded-xl shadow-soft border border-base-300 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-text-primary flex items-center"><Mic className="w-6 h-6 mr-3 text-primary" />Nueva Consulta</h2>
                  <button onClick={() => setIsPatientModalOpen(true)} className="flex items-center space-x-2 text-sm bg-secondary text-white px-4 py-2 rounded-lg hover:opacity-90 transition-colors shadow-soft">
                    <UserPlus size={16} />
                    <span className="font-semibold">Nuevo Paciente</span>
                  </button>
                </div>

                <div className="bg-base-200 p-4 rounded-lg">
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-text-secondary mb-2">1. Tipo de Consulta</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center cursor-pointer"><input type="radio" name="consultationType" value="new_patient" checked={consultationType === 'new_patient'} onChange={(e) => setConsultationType(e.target.value)} className="h-4 w-4 text-primary border-gray-300 focus:ring-primary" /><span className="ml-2 text-sm text-text-primary">Primera Vez</span></label>
                      <label className="flex items-center cursor-pointer"><input type="radio" name="consultationType" value="follow_up" checked={consultationType === 'follow_up'} onChange={(e) => setConsultationType(e.target.value)} className="h-4 w-4 text-primary border-gray-300 focus:ring-primary" /><span className="ml-2 text-sm text-text-primary">Seguimiento</span></label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-text-secondary mb-2">2. Seleccionar Paciente</label>
                      <select value={selectedPatient} onChange={(e) => setSelectedPatient(e.target.value)} className="w-full p-3 border border-base-300 rounded-lg bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary">
                        <option value="">Seleccionar...</option>
                        {patients.map((patient) => (<option key={patient.id} value={patient.id}>{patient.full_name}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-text-secondary mb-2">3. Grabar Audio</label>
                      <div className="flex space-x-3">
                        {!isRecording ? (<button onClick={startRecording} disabled={!selectedPatient} className="flex items-center space-x-2 bg-accent text-white px-5 py-3 rounded-lg hover:opacity-90 disabled:bg-gray-300 transition-all shadow-soft"><Mic className="w-5 h-5" /><span className="font-semibold">Grabar</span></button>) : (<button onClick={stopRecording} className="flex items-center space-x-2 bg-gray-700 text-white px-5 py-3 rounded-lg hover:bg-gray-800 transition-colors shadow-soft"><Square className="w-5 h-5" /><span className="font-semibold">Parar</span></button>)}
                        {audioBlob && (<button onClick={processAudio} disabled={isProcessingAudio} className="flex items-center space-x-2 bg-primary text-white px-5 py-3 rounded-lg hover:bg-primary-dark disabled:bg-gray-300 transition-colors shadow-soft"><FileText className="w-5 h-5" /><span className="font-semibold">{isProcessingAudio ? 'Procesando...' : 'Procesar'}</span></button>)}
                      </div>
                    </div>
                  </div>
                  {isRecording && <div className="text-center text-accent font-medium pt-4">🔴 Grabando...</div>}
                  {audioBlob && !isRecording && <div className="text-center text-success font-medium pt-4">✅ Audio listo para procesar</div>}
                </div>
              </div>

              <div className="lg:col-span-1 bg-base-100 rounded-xl shadow-soft border border-base-300 p-6 flex flex-col">
                <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center flex-shrink-0"><FileText className="w-6 h-6 mr-3 text-primary" />Consultas Recientes</h2>
                <div className="space-y-3 flex-1 overflow-y-auto -mr-3 pr-3">
                  {consultations.length === 0 ? <p className="text-text-secondary text-center py-8">No hay consultas aún.</p> : (
                    consultations.map((consultation) => (
                      <Link href={`/dashboard/consultation/${consultation.id}`} key={consultation.id}>
                        <div className="border border-base-300 rounded-lg p-3 cursor-pointer hover:bg-base-200 hover:border-primary transition-all">
                          <div className="flex justify-between items-start">
                            <p className="font-bold text-text-primary text-sm">{consultation.patients?.full_name || 'Paciente desconocido'}</p>
                            <p className="text-xs text-text-secondary">{new Date(consultation.created_at).toLocaleDateString('es-AR')}</p>
                          </div>
                          <p className="mt-1 text-sm text-text-secondary truncate">
                            {consultation.formatted_notes?.note_content || 'Nota no disponible'}
                          </p>
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
    </div>
  )
}
