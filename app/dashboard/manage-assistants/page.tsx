'use client'

import { useEffect, useState, FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Users, Trash2, ShieldAlert, User as UserIcon, LogOut, 
  LayoutDashboard, Settings, Bell, LifeBuoy, Bot, Search, Send, UserPlus, X,
  CheckCircle, AlertCircle
} from 'lucide-react'

// --- Interfaces ---
interface Profile { id: string; full_name: string; role: string; }
interface Assistant { id: string; full_name: string; }

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
          <Image src="/logo.png" alt="Logo del Sistema Médico" fill style={{ objectFit: "contain" }} />
        </div>
      </div>
      <nav className="flex-grow px-4">
        <ul className="space-y-2">
          <NavLink href="/dashboard" icon={LayoutDashboard}>Panel Principal</NavLink>
          <NavLink href="/dashboard/all-consultations" icon={Search}>Consultas</NavLink>
          <NavLink href="/dashboard/manage-assistants" icon={Users}>Asistentes</NavLink>
          <NavLink href="/dashboard/ai-settings" icon={Bot}>Plantilla IA</NavLink>
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
        <h1 className="text-2xl font-bold text-text-primary">Gestión de Equipo</h1>
        <div className="flex items-center space-x-5">
          <button className="relative p-2 text-text-secondary rounded-full hover:bg-base-200"><Bell size={24} /><span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-accent"></span></button>
          <div className="flex items-center space-x-3 border-l border-base-300 pl-5">
            <div className="w-11 h-11 rounded-full bg-secondary text-white flex items-center justify-center font-bold text-lg">{profile?.full_name?.charAt(0) || 'U'}</div>
            <div>
              <p className="font-bold text-text-primary">{profile?.full_name}</p>
              <p className="text-xs text-text-secondary capitalize">{profile?.role}</p>
            </div>
            <button onClick={onLogout} title="Cerrar Sesión" className="p-2 text-text-secondary hover:text-accent"><LogOut size={22} /></button>
          </div>
        </div>
      </div>
    </header>
  )
}

function NotificationPopup({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void; }) {
  const isSuccess = type === 'success';
  const bgColor = isSuccess ? 'bg-green-100' : 'bg-red-100';
  const textColor = isSuccess ? 'text-success' : 'text-accent';
  const Icon = isSuccess ? CheckCircle : AlertCircle;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-base-100 p-8 rounded-xl shadow-2xl w-full max-w-sm text-center">
        <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full ${bgColor} mb-4`}>
          <Icon className={`h-8 w-8 ${textColor}`} />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">
          {isSuccess ? 'Éxito' : 'Error'}
        </h2>
        <p className="text-text-secondary mb-6">{message}</p>
        <button
          onClick={onClose}
          className="w-full px-6 py-2.5 rounded-lg text-white bg-primary hover:bg-primary-dark font-semibold transition-colors"
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}


export default function ManageAssistantsPage() {
  const [assistants, setAssistants] = useState<Assistant[]>([])
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assistantToDelete, setAssistantToDelete] = useState<Assistant | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [newAssistantName, setNewAssistantName] = useState('');
  const [newAssistantEmail, setNewAssistantEmail] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAdminAndFetchAssistants = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/'); return; }

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profileData?.role !== 'doctor') { router.push('/dashboard'); return; }
      
      setProfile(profileData);
      fetchAssistants();
    }
    
    checkAdminAndFetchAssistants();
  }, [router]);

  const fetchAssistants = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('profiles').select(`id, full_name`).eq('role', 'asistente');
    if (error) { 
      console.error("Error fetching assistants:", error);
      setError("No se pudieron cargar los asistentes."); 
    } 
    else { setAssistants(data as Assistant[]); }
    setLoading(false);
  }

  const handleInviteAssistant = async (e: FormEvent) => {
    e.preventDefault();
    if (!newAssistantEmail || !newAssistantName) return;
    setIsInviting(true);
    try {
      const response = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newAssistantEmail, fullName: newAssistantName }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Falló al enviar la invitación.');
      
      setNotification({ message: '¡Invitación enviada exitosamente!', type: 'success' });
      setNewAssistantName('');
      setNewAssistantEmail('');
      fetchAssistants();
    } catch (error) {
      if (error instanceof Error) { setNotification({ message: error.message, type: 'error' }); } 
      else { setNotification({ message: 'Ocurrió un error inesperado.', type: 'error' }); }
    } finally {
      setIsInviting(false);
    }
  };

  const confirmDelete = async () => {
    if (!assistantToDelete) return;
    setIsDeleting(true);
    try {
      const response = await fetch('/api/delete-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assistantId: assistantToDelete.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Falló al eliminar al asistente.');
      
      setAssistants(assistants.filter(a => a.id !== assistantToDelete.id));
      setAssistantToDelete(null);
      setNotification({ message: 'Asistente eliminado exitosamente.', type: 'success' });

    } catch (error) {
      setAssistantToDelete(null);
      if (error instanceof Error) { setNotification({ message: error.message, type: 'error' }); } 
      else { setNotification({ message: 'Ocurrió un error inesperado.', type: 'error' }); }
    } finally {
      setIsDeleting(false);
    }
  }

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/'); }

  if (loading) {
    return <div className="h-screen bg-base-200 flex items-center justify-center">Cargando...</div>
  }

  return (
    <>
      {notification && (
        <NotificationPopup 
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {assistantToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
          <div className="bg-base-100 p-8 rounded-xl shadow-2xl w-full max-w-md text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <ShieldAlert className="h-8 w-8 text-accent" />
            </div>
            <h2 className="text-2xl font-bold my-2 text-text-primary">¿Estás seguro?</h2>
            <p className="text-text-secondary mb-2">Estás a punto de eliminar al asistente <span className="font-bold">{assistantToDelete.full_name}</span>.</p>
            <p className="text-text-secondary mb-6">Todos sus pacientes serán reasignados a tu cuenta. Esta acción no se puede deshacer.</p>
            <div className="flex justify-center space-x-4">
              <button onClick={() => setAssistantToDelete(null)} disabled={isDeleting} className="px-6 py-2.5 rounded-lg text-text-primary bg-base-200 hover:bg-base-300 font-semibold">Cancelar</button>
              <button onClick={confirmDelete} disabled={isDeleting} className="px-6 py-2.5 rounded-lg text-white bg-accent hover:opacity-90 disabled:opacity-50 font-semibold">{isDeleting ? 'Eliminando...' : 'Sí, eliminar'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="h-screen flex bg-base-200 overflow-hidden">
        <Sidebar profile={profile} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header profile={profile} onLogout={handleLogout} />
          <main className="flex-1 p-8 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-1 bg-base-100 rounded-xl shadow-soft border border-base-300 p-6">
                <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center"><UserPlus className="w-6 h-6 mr-3 text-primary" />Invitar Nuevo Asistente</h2>
                <form onSubmit={handleInviteAssistant} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-text-secondary mb-1">Nombre Completo</label>
                    <input type="text" value={newAssistantName} onChange={(e) => setNewAssistantName(e.target.value)} className="w-full p-3 border border-base-300 rounded-lg bg-base-200 focus:outline-none focus:ring-2 focus:ring-primary" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text-secondary mb-1">Email de Invitación</label>
                    <input type="email" value={newAssistantEmail} onChange={(e) => setNewAssistantEmail(e.target.value)} className="w-full p-3 border border-base-300 rounded-lg bg-base-200 focus:outline-none focus:ring-2 focus:ring-primary" required />
                  </div>
                  <button type="submit" disabled={isInviting} className="w-full flex items-center justify-center space-x-2 bg-secondary text-white px-5 py-3 rounded-lg hover:opacity-90 disabled:bg-gray-400 font-semibold transition-colors shadow-soft">
                    <Send size={18} />
                    <span>{isInviting ? 'Enviando Invitación...' : 'Enviar Invitación'}</span>
                  </button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-base-100 rounded-xl shadow-soft border border-base-300 p-6">
                <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center"><Users className="w-6 h-6 mr-3 text-primary" />Lista de Asistentes</h2>
                <div className="space-y-3">
                  {error && <p className="text-accent bg-red-100 p-3 rounded-md">{error}</p>}
                  {assistants.length === 0 && !loading && (<p className="text-text-secondary text-center py-8">No hay asistentes registrados.</p>)}
                  {assistants.map(assistant => (
                    <div key={assistant.id} className="flex items-center justify-between p-4 border border-base-300 rounded-lg hover:bg-base-200">
                      <div className="flex items-center">
                        <div className="p-3 bg-blue-100 rounded-full mr-4"><UserIcon className="w-6 h-6 text-secondary" /></div>
                        <div>
                          <p className="font-bold text-lg text-text-primary">{assistant.full_name}</p>
                          <p className="text-sm text-text-secondary">Asistente</p>
                        </div>
                      </div>
                      <button onClick={() => setAssistantToDelete(assistant)} className="flex items-center space-x-2 text-sm text-accent hover:text-accent-hover p-2 rounded-md hover:bg-red-100">
                        <Trash2 size={18} /><span>Eliminar</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}