// app/(dashboard)/dashboard/all-consultations/page.tsx
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { Consultation } from '@/types';

// Extendemos la interfaz para incluir el perfil del profesional
interface ConsultationWithProfile extends Consultation {
  profiles: {
    id: string;
    full_name: string;
  } | null;
}

export default function AllConsultationsPage() {
  const { user, profile, loading: loadingAuth } = useAuth();
  const [consultations, setConsultations] = useState<ConsultationWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [filters, setFilters] = useState({
    patientName: '',
    doctorName: '',
    consultationDate: '',
  });

  const fetchConsultations = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('consultations')
        .select(`
          id,
          created_at,
          patient_id,
          doctor_id,
          consultation_type,
          status,
          formatted_notes,
          patients ( full_name ),
          profiles ( full_name )
        `)
        .order('created_at', { ascending: false });

      if (profile?.role === 'asistente') {
        query = query.eq('doctor_id', user.id);
      }

      const { data, error: supabaseError } = await query;
      if (supabaseError) throw supabaseError;

      // Transformación de los datos para asegurar que las relaciones sean objetos y no arrays
      const formattedData = data.map(c => ({
        ...c,
        patients: Array.isArray(c.patients) ? c.patients[0] : c.patients,
        profiles: Array.isArray(c.profiles) ? c.profiles[0] : c.profiles,
      }));
      
      setConsultations(formattedData as ConsultationWithProfile[]);
    } catch (err) {
      console.error('Error al cargar las consultas:', err);
      setError('Error desconocido al cargar las consultas.');
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    if (!loadingAuth) {
      fetchConsultations();
    }
  }, [loadingAuth, fetchConsultations]);


  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const clearFilters = () => {
    setFilters({
        patientName: '',
        doctorName: '',
        consultationDate: '',
    });
  };

  const filteredConsultations = useMemo(() => {
    return consultations.filter(consultation => {
      const patientNameMatch =
        !filters.patientName ||
        consultation.patients?.full_name?.toLowerCase().includes(filters.patientName.toLowerCase());

      const doctorNameMatch =
        !filters.doctorName ||
        consultation.profiles?.full_name?.toLowerCase().includes(filters.doctorName.toLowerCase());

        const dateMatch = !filters.consultationDate || 
        format(new Date(consultation.created_at), 'yyyy-MM-dd') === filters.consultationDate;


      return patientNameMatch && doctorNameMatch && dateMatch;
    });
  }, [consultations, filters]);

  const handleViewConsultation = (id: string) => {
    router.push(`/dashboard/consultation/${id}`);
  };

  if (loading || loadingAuth) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-lg text-muted-foreground">Cargando consultas...</p>
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
      <h1 className="text-3xl font-bold text-foreground mb-6">Todas las Consultas</h1>

      {/* Sección de Filtros */}
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
          {profile?.role !== 'asistente' && (
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
          )}
          <div>
            <Label htmlFor="consultationDate">Fecha de consulta</Label>
            <Input
              id="consultationDate"
              name="consultationDate"
              type="date"
              value={filters.consultationDate}
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

      {filteredConsultations.length === 0 ? (
        <p className="text-muted-foreground text-center">No hay consultas que coincidan con los filtros.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow-md border border-border">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-secondary">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Fecha
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Paciente
                </th>
                {profile?.role !== 'asistente' && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Profesional
                  </th>
                )}
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Tipo de Consulta
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {filteredConsultations.map((consultation) => (
                <tr key={consultation.id} className="hover:bg-accent/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                    {format(new Date(consultation.created_at), 'dd MMMM yyyy', { locale: es })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {consultation.patients?.full_name || 'N/A'}
                  </td>
                  {profile?.role !== 'asistente' && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {consultation.profiles?.full_name || 'N/A'}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-foreground">
                    {consultation.consultation_type === 'new_patient' ? 'Primera Vez' : 'Seguimiento'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <button
                      onClick={() => handleViewConsultation(consultation.id)}
                      className="text-primary hover:text-primary/80"
                    >
                      Ver Detalles
                    </button>
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