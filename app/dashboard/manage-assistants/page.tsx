'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, Trash2, ShieldAlert, User as UserIcon } from 'lucide-react'

interface Assistant {
  id: string;
  full_name: string;
  patients: { count: number }[];
}

export default function ManageAssistantsPage() {
  const [assistants, setAssistants] = useState<Assistant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assistantToDelete, setAssistantToDelete] = useState<Assistant | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAdminAndFetchAssistants = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profile?.role !== 'doctor') {
        router.push('/dashboard');
        return;
      }
      
      fetchAssistants();
    }
    
    const fetchAssistants = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select(`id, full_name, patients (count)`)
        .eq('role', 'asistente');
      
      if (error) {
        console.error("Error al cargar asistentes:", error);
        setError("No se pudieron cargar los asistentes.");
      } else {
        setAssistants(data as Assistant[]);
      }
      setLoading(false);
    }

    checkAdminAndFetchAssistants();
  }, [router]);

  const handleDeleteClick = (assistant: Assistant) => {
    setAssistantToDelete(assistant);
  }

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
      if (!response.ok) {
        throw new Error(result.error || 'Falló al eliminar al asistente.');
      }
      
      alert('Asistente eliminado exitosamente.');
      setAssistantToDelete(null);
      setAssistants(assistants.filter(a => a.id !== assistantToDelete.id));

    } catch (error) {
      if (error instanceof Error) {
        alert('Error: ' + error.message);
      } else {
        alert('Ocurrió un error inesperado.');
      }
    } finally {
      setIsDeleting(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Cargando gestión de asistentes...</div>
  }

  return (
    <>
      {assistantToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <ShieldAlert className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold my-4">¿Estás seguro?</h2>
            <p className="text-gray-600 mb-2">
              Estás a punto de eliminar al asistente <span className="font-bold">{assistantToDelete.full_name}</span>.
            </p>
            <p className="text-gray-600 mb-6">
              Todos sus pacientes serán reasignados a tu cuenta. Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-center space-x-4">
              <button onClick={() => setAssistantToDelete(null)} disabled={isDeleting} className="px-6 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300">
                Cancelar
              </button>
              <button onClick={confirmDelete} disabled={isDeleting} className="px-6 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400">
                {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/dashboard" className="flex items-center space-x-2 text-blue-600 hover:underline">
              <ArrowLeft className="w-5 h-5" />
              <span>Volver al Panel</span>
            </Link>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
              <Users className="w-8 h-8 mr-3 text-blue-600" />
              Gestión de Asistentes
            </h1>
            
            {error && <p className="text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}
            
            <div className="space-y-4">
              {assistants.length === 0 && !loading && (
                <p className="text-gray-500 text-center py-8">No hay asistentes registrados.</p>
              )}
              {assistants.map(assistant => (
                <div key={assistant.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-full mr-4">
                      <UserIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-bold text-lg text-gray-800">{assistant.full_name}</p>
                      <p className="text-sm text-gray-500">
                        {assistant.patients[0].count} {assistant.patients[0].count === 1 ? 'paciente' : 'pacientes'} a cargo
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteClick(assistant)}
                    className="flex items-center space-x-2 text-sm text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-100"
                  >
                    <Trash2 size={18} />
                    <span>Eliminar</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
