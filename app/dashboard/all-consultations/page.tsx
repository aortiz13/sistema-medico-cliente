'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Search, Calendar, FileText, User as UserIcon } from 'lucide-react'

// --- Interfaces ---
// CAMBIO: Se ajustó la interfaz para que coincida con la respuesta de Supabase
interface ConsultationWithPatient {
  id: string;
  created_at: string;
  status: string;
  formatted_notes: string;
  patients: {
    full_name: string;
    document_id: string | null;
  } | null; // Supabase devuelve un objeto, no un array, para esta relación
}

export default function AllConsultationsPage() {
  const [consultations, setConsultations] = useState<ConsultationWithPatient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter();

  // --- Estados para los filtros ---
  const [nameFilter, setNameFilter] = useState('');
  const [dniFilter, setDniFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // CAMBIO: Se movió la carga inicial a un useEffect para que se ejecute solo una vez
  useEffect(() => {
    fetchConsultations(true); // Carga inicial
  }, []);

  // Función para buscar y filtrar las consultas
  const fetchConsultations = async (isInitialLoad = false) => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from('consultations')
      .select(`
        id,
        created_at,
        status,
        formatted_notes,
        patients (
          full_name,
          document_id
        )
      `)
      .order('created_at', { ascending: false });

    // Aplicar filtros solo si no es la carga inicial o si se han modificado
    if (!isInitialLoad) {
        if (nameFilter) {
          query = query.ilike('patients.full_name', `%${nameFilter}%`);
        }
        if (dniFilter) {
          query = query.ilike('patients.document_id', `%${dniFilter}%`);
        }
        if (dateFilter) {
          const startDate = new Date(dateFilter);
          startDate.setUTCHours(0, 0, 0, 0);
          const endDate = new Date(dateFilter);
          endDate.setUTCHours(23, 59, 59, 999);
          
          query = query
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());
        }
    }


    const { data, error } = await query;

    if (error) {
      console.error("Error al cargar consultas:", error);
      setError("No se pudieron cargar las consultas.");
    } else {
      // Se asegura que el tipado sea correcto
      setConsultations(data as ConsultationWithPatient[]);
    }
    setLoading(false);
  }

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchConsultations();
  }

  const clearFilters = () => {
    setNameFilter('');
    setDniFilter('');
    setDateFilter('');
    // Se necesita llamar a fetchConsultations después de limpiar para recargar la lista completa
    // Lo hacemos en un useEffect para que se ejecute después de que se actualicen los estados
  }

  useEffect(() => {
    // Este efecto se dispara cuando los filtros se limpian
    if (!nameFilter && !dniFilter && !dateFilter) {
        fetchConsultations(true);
    }
  }, [nameFilter, dniFilter, dateFilter]);


  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/dashboard" className="flex items-center space-x-2 text-blue-600 hover:underline">
            <ArrowLeft className="w-5 h-5" />
            <span>Volver al Panel</span>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Todas las Consultas</h1>
          <p className="text-gray-500 mb-6">Busca y filtra a través de todo el historial de consultas.</p>

          {/* --- Barra de Filtros --- */}
          <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border">
            <div className="relative">
              <label className="text-sm font-medium text-gray-600">Nombre y Apellido</label>
              <input 
                type="text"
                placeholder="Buscar por nombre..."
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                className="w-full mt-1 p-2 pl-8 border border-gray-300 rounded-md"
              />
              <UserIcon className="absolute left-2 top-9 w-4 h-4 text-gray-400" />
            </div>
            <div className="relative">
              <label className="text-sm font-medium text-gray-600">Documento</label>
              <input 
                type="text"
                placeholder="Buscar por DNI..."
                value={dniFilter}
                onChange={(e) => setDniFilter(e.target.value)}
                className="w-full mt-1 p-2 pl-8 border border-gray-300 rounded-md"
              />
              <FileText className="absolute left-2 top-9 w-4 h-4 text-gray-400" />
            </div>
            <div className="relative">
              <label className="text-sm font-medium text-gray-600">Fecha</label>
              <input 
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full mt-1 p-2 pl-8 border border-gray-300 rounded-md"
              />
              <Calendar className="absolute left-2 top-9 w-4 h-4 text-gray-400" />
            </div>
            <div className="flex items-end space-x-2">
              <button type="submit" className="w-full flex-1 bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 font-semibold">Buscar</button>
              <button type="button" onClick={clearFilters} className="w-full flex-1 bg-gray-200 text-gray-700 p-2 rounded-md hover:bg-gray-300">Limpiar</button>
            </div>
          </form>

          {/* --- Tabla de Resultados --- */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Paciente</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Documento</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Fecha</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Resumen</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {loading ? (
                  <tr><td colSpan={4} className="text-center py-10">Cargando...</td></tr>
                ) : error ? (
                  <tr><td colSpan={4} className="text-center py-10 text-red-500">{error}</td></tr>
                ) : consultations.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-10">No se encontraron resultados para tu búsqueda.</td></tr>
                ) : (
                  consultations.map(consultation => (
                    // CAMBIO: Se accede a la información del paciente correctamente
                    <tr key={consultation.id} className="border-b border-gray-200 hover:bg-blue-50 cursor-pointer" onClick={() => router.push(`/dashboard/consultation/${consultation.id}`)}>
                      <td className="py-3 px-4 font-medium">{consultation.patients?.full_name || 'N/A'}</td>
                      <td className="py-3 px-4">{consultation.patients?.document_id || 'N/A'}</td>
                      <td className="py-3 px-4">{new Date(consultation.created_at).toLocaleDateString('es-AR')}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 truncate max-w-xs">{consultation.formatted_notes}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}