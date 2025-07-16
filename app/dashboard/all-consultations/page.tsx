'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search, Calendar, FileText, User as UserIcon } from 'lucide-react';

// Importa componentes de UI y hooks
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { useConsultations } from '@/hooks/useConsultations';

// Importa las interfaces desde types/index.ts
import { Consultation } from '@/types';

export default function AllConsultationsPage() {
  const { profile, loading: loadingAuth, handleLogout } = useAuth();
  const { consultations, patientsMap, loadingConsultations, loadConsultations } = useConsultations();

  const router = useRouter();

  // --- Estados para los filtros ---
  const [nameFilter, setNameFilter] = useState('');
  const [dniFilter, setDniFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    if (!loadingAuth && profile) {
      loadConsultations();
    }
  }, [loadingAuth, profile, loadConsultations]);

  const filteredConsultations = useMemo(() => {
    return consultations
      .filter(c => {
        if (!dateFilter) return true;
        const consultationDate = new Date(c.created_at).toISOString().split('T')[0];
        return consultationDate === dateFilter;
      })
      .filter(c => {
        if (!nameFilter) return true;
        const patient = c.patient_id ? patientsMap.get(c.patient_id) : null;
        return patient?.full_name?.toLowerCase().includes(nameFilter.toLowerCase()) || false;
      })
      .filter(c => {
        if (!dniFilter) return true;
        const patient = c.patient_id ? patientsMap.get(c.patient_id) : null;
        return patient?.document_id?.toLowerCase().includes(dniFilter.toLowerCase()) || false;
      });
  }, [consultations, patientsMap, nameFilter, dniFilter, dateFilter]);

  const clearFilters = () => {
    setNameFilter('');
    setDniFilter('');
    setDateFilter('');
  };

  if (loadingAuth || loadingConsultations) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Cargando...</div>;
  }

  return (
    <div className="min-h-screen flex bg-gray-50 overflow-hidden">
      <Sidebar profile={profile} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header profile={profile} onLogout={handleLogout} title="Todas las Consultas" showSearch={false} />

        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <Link href="/dashboard" className="inline-flex items-center space-x-2 text-blue-600 hover:underline">
                <ArrowLeft className="w-5 h-5" />
                <span>Volver al Panel</span>
              </Link>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 md:p-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Historial Completo de Consultas</h1>
              <p className="text-gray-500 mb-6">Busca y filtra a través de todo el historial de consultas.</p>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border">
                <div className="relative">
                  <label className="text-sm font-medium text-gray-600">Nombre y Apellido</label>
                  <input type="text" placeholder="Buscar por nombre..." value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} className="w-full mt-1 p-2 pl-8 border border-gray-300 rounded-md" />
                  <UserIcon className="absolute left-2 top-9 w-4 h-4 text-gray-400" />
                </div>
                <div className="relative">
                  <label className="text-sm font-medium text-gray-600">Documento</label>
                  <input type="text" placeholder="Buscar por DNI..." value={dniFilter} onChange={(e) => setDniFilter(e.target.value)} className="w-full mt-1 p-2 pl-8 border border-gray-300 rounded-md" />
                  <FileText className="absolute left-2 top-9 w-4 h-4 text-gray-400" />
                </div>
                <div className="relative">
                  <label className="text-sm font-medium text-gray-600">Fecha</label>
                  <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-full mt-1 p-2 pl-8 border border-gray-300 rounded-md" />
                  <Calendar className="absolute left-2 top-9 w-4 h-4 text-gray-400" />
                </div>
                <div className="flex items-end">
                  <button type="button" onClick={clearFilters} className="w-full bg-gray-200 text-gray-700 p-2 rounded-md hover:bg-gray-300 font-semibold">Limpiar Filtros</button>
                </div>
              </div>

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
                    {consultations.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-10">No se encontraron resultados.</td></tr>
                    ) : (
                      filteredConsultations.map(c => {
                        const patient = c.patient_id ? patientsMap.get(c.patient_id) : null;
                        return (
                          <tr key={c.id} className="border-b border-gray-200 hover:bg-blue-50 cursor-pointer" onClick={() => router.push(`/dashboard/consultation/${c.id}`)}>
                            <td className="py-3 px-4 font-medium">
                              <Link
                                href={`/dashboard/patient/${c.patient_id}`}
                                className="text-blue-600 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {patient?.full_name || 'N/A'}
                              </Link>
                            </td>
                            <td className="py-3 px-4">{patient?.document_id || 'N/A'}</td>
                            <td className="py-3 px-4">{new Date(c.created_at).toLocaleDateString('es-AR')}</td>
                            <td className="py-3 px-4 text-sm text-gray-600 truncate max-w-xs">
                              {c.formatted_notes?.note_content || 'Nota no disponible.'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}