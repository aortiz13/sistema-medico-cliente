'use client';

import { useEffect, useState, FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  Users, Trash2, User as UserIcon, Send, UserPlus
} from 'lucide-react'; // UserPlus ya está importado

// Importa componentes de UI y hooks
import { Header } from '@/components/layout/Header';
import { NotificationPopup } from '@/components/common/NotificationPopup';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import { useAuth } from '@/hooks/useAuth'; // Importa el hook de autenticación

// Importa las interfaces desde types/index.ts
import { Profile } from '@/types'; // Se mantiene si Profile es solo para este archivo o se mueve al tipo

interface Assistant { // Esta interfaz puede moverse a types/index.ts también
  id: string;
  full_name: string;
  role: string;
  avatar_url?: string | null;
}

export default function ManageAssistantsPage() {
  const { user, profile, loading: loadingAuth, handleLogout } = useAuth(); // Usa el hook de autenticación
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loadingAssistants, setLoadingAssistants] = useState(true); // Nuevo estado de carga para asistentes
  const [error, setError] = useState<string | null>(null);
  const [assistantToDelete, setAssistantToDelete] = useState<Assistant | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [newAssistantName, setNewAssistantName] = useState('');
  const [newAssistantEmail, setNewAssistantEmail] = useState('');
  const [newAssistantRole, setNewAssistantRole] = useState<'asistente' | 'doctor'>('asistente');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Redireccionar si no es doctor o no está autenticado
    if (!loadingAuth) {
      if (!user) {
        router.push('/');
      } else if (profile?.role !== 'doctor') {
        router.push('/dashboard');
      } else {
        fetchAssistants();
      }
    }
  }, [loadingAuth, user, profile, router]);

  const fetchAssistants = async () => {
    setLoadingAssistants(true);
    const { data, error } = await supabase
      .from('profiles')
      .select(`id, full_name, role, avatar_url`)
      .in('role', ['asistente', 'doctor']);
    if (error) {
      console.error("Error fetching assistants:", error);
      setError("No se pudieron cargar los asistentes.");
    }
    else {
      const filtered = (data as Assistant[]).filter(a => a.id !== user?.id);
      setAssistants(filtered);
    }
    setLoadingAssistants(false);
  };

  const handleInviteAssistant = async (e: FormEvent) => {
    e.preventDefault();
    if (!newAssistantEmail || !newAssistantName) return;
    setIsInviting(true);
    try {
      const response = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newAssistantEmail, fullName: newAssistantName, role: newAssistantRole }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Falló al enviar la invitación.');

      setNotification({ message: '¡Invitación enviada exitosamente!', type: 'success' });
      setNewAssistantName('');
      setNewAssistantEmail('');
      setNewAssistantRole('asistente');
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
  };

  if (loadingAuth || loadingAssistants) { // Considera ambos estados de carga
    return <div className="h-screen bg-base-200 flex items-center justify-center">Cargando...</div>;
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

      <ConfirmationModal
        isOpen={!!assistantToDelete}
        onClose={() => setAssistantToDelete(null)}
        onConfirm={confirmDelete}
        title="¿Estás seguro?"
        message={
          <>
            Estás a punto de eliminar al asistente <span className="font-bold">{assistantToDelete?.full_name}</span>.
            <br />Todos sus pacientes y consultas serán reasignados a tu cuenta. Esta acción no se puede deshacer.
          </>
        }
        isConfirming={isDeleting}
      />

      <div className="h-screen flex bg-base-200 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Gestión de Equipo" showSearch={false} />
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
                  <div>
                    <label className="block text-sm font-semibold text-text-secondary mb-1">Rol</label>
                    <select
                      value={newAssistantRole}
                      onChange={(e) => setNewAssistantRole(e.target.value as 'asistente' | 'doctor')}
                      className="w-full p-3 border border-base-300 rounded-lg bg-base-200 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="asistente">Asistente</option>
                      <option value="doctor">Doctor</option>
                    </select>
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
                  {assistants.length === 0 && !loadingAssistants && (<p className="text-text-secondary text-center py-8">No hay asistentes registrados.</p>)}
                  {assistants.map(assistant => (
                    <div key={assistant.id} className="flex items-center justify-between p-4 border border-base-300 rounded-lg hover:bg-base-200">
                      <div className="flex items-center">
                        {assistant.avatar_url ? (
                          <img
                            src={supabase.storage.from('avatars').getPublicUrl(assistant.avatar_url).data.publicUrl}
                            alt="Avatar"
                            className="w-12 h-12 rounded-full mr-4 object-cover"
                          />
                        ) : (
                          <div className="p-3 bg-blue-100 rounded-full mr-4"><UserIcon className="w-6 h-6 text-secondary" /></div>
                        )}
                        <div>
                          <p className="font-bold text-lg text-text-primary">{assistant.full_name}</p>
                          <p className="text-sm text-text-secondary">
                            {assistant.role === 'doctor' ? 'Doctor' : 'Asistente'}
                          </p>
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