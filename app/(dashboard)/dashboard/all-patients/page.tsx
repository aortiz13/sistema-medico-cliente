'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { Patient } from '@/types';

interface PatientWithDoctor extends Patient {
  doctor_name?: string | null;
}

export default function AllPatientsPage() {
  const { user, profile, loading: loadingAuth } = useAuth();
  const [patients, setPatients] = useState<PatientWithDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    patientName: '',
    patientDni: '',
    doctorName: '',
  });

  const fetchPatients = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (profile?.role === 'asistente') {
        query = query.eq('user_id', user.id);
      }

      const { data: patientData, error: patientError } = await query;
      if (patientError) throw patientError;

      const userIds = Array.from(
        new Set((patientData || []).map(p => p.user_id).filter(Boolean))
      ) as string[];

      let doctorMap = new Map<string, string>();
      if (userIds.length > 0) {
        const { data: profilesData, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);
        if (profileError) throw profileError;
        doctorMap = new Map(
          (profilesData || []).map(p => [p.id as string, p.full_name as string])
        );
      }

      const formattedData = (patientData || []).map(p => ({
        ...p,
        doctor_name: doctorMap.get(p.user_id || '') || '',
      }));

      setPatients(formattedData as PatientWithDoctor[]);
    } catch (err) {
      console.error('Error al cargar pacientes:', err);
      setError('Error desconocido al cargar los pacientes.');
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    if (!loadingAuth) {
      fetchPatients();
    }
  }, [loadingAuth, fetchPatients]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ patientName: '', patientDni: '', doctorName: '' });
  };

  const filteredPatients = useMemo(() => {
    return patients.filter(patient => {
      const patientNameMatch =
        !filters.patientName ||
        patient.full_name?.toLowerCase().includes(filters.patientName.toLowerCase());
      const patientDniMatch =
        !filters.patientDni ||
        patient.document_id?.toLowerCase().includes(filters.patientDni.toLowerCase());
      const doctorNameMatch =
        !filters.doctorName ||
        patient.doctor_name?.toLowerCase().includes(filters.doctorName.toLowerCase());
      return patientNameMatch && patientDniMatch && doctorNameMatch;
    });
  }, [patients, filters]);

  if (loading || loadingAuth) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-lg text-muted-foreground">Cargando pacientes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-lg text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-foreground mb-6">Todos los Pacientes</h1>

      <div className="bg-card p-4 rounded-lg shadow-md border border-border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <Label htmlFor="patientName">Paciente</Label>
            <Input
              id="patientName"
              name="patientName"
              placeholder="Nombre o Apellido"
              value={filters.patientName}
              onChange={handleFilterChange}
            />
          </div>
          <div>
            <Label htmlFor="patientDni">DNI</Label>
            <Input
              id="patientDni"
              name="patientDni"
              placeholder="DNI del paciente"
              value={filters.patientDni}
              onChange={handleFilterChange}
            />
          </div>
          <div>
            <Label htmlFor="doctorName">Profesional</Label>
            <Input
              id="doctorName"
              name="doctorName"
              placeholder="Nombre del profesional"
              value={filters.doctorName}
              onChange={handleFilterChange}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={clearFilters} variant="outline" className="w-full">
              <X className="mr-2 h-4 w-4" /> Limpiar
            </Button>
          </div>
        </div>
      </div>

      {filteredPatients.length === 0 ? (
        <p className="text-muted-foreground text-center">No hay pacientes que coincidan con los filtros.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow-md border border-border">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-secondary">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Nombre
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  DNI
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Profesional
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {filteredPatients.map(patient => (
                <tr key={patient.id} className="hover:bg-accent/10 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {patient.full_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {patient.document_id || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {patient.doctor_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <Link href={`/dashboard/patient/${patient.id}`} className="text-primary hover:text-primary/80">
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

