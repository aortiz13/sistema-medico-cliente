// app/dashboard/all-consultations/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase'; // Importa tu cliente de Supabase
import { format } from 'date-fns'; // Para formatear fechas
import { es } from 'date-fns/locale'; // Para el idioma español en el formato de fecha
import { useRouter } from 'next/navigation';
// Se elimina la importación de Sidebar ya que no se usa en esta página
// import { Sidebar } from '@/components/layout/Sidebar'; // ELIMINAR ESTA LÍNEA

// Definición de tipos para la consulta y el perfil del paciente
interface Consultation {
  id: string;
  patient_id: string;
  doctor_id: string;
  consultation_date: string;
  diagnosis: string;
  treatment: string;
  notes: string;
  patients: { // Relación con la tabla de pacientes
    full_name: string;
    email: string;
  } | null; // Puede ser null si no hay paciente asociado
  profiles: { // Relación con la tabla de perfiles (para el doctor)
    full_name: string;
  } | null; // Puede ser null si no hay doctor asociado
}

export default function AllConsultationsPage() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchConsultations = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: supabaseError } = await supabase
          .from('consultations')
          .select(`
            id,
            consultation_date,
            diagnosis,
            treatment,
            notes,
            patient_id,
            doctor_id,
            patients ( full_name, email ),
            profiles ( full_name )
          `); // Selecciona los datos de la consulta y las relaciones

        if (supabaseError) {
          throw supabaseError;
        }

        // MODIFICACIÓN: Convertir a 'unknown' primero antes de 'Consultation[]'
        setConsultations(data as unknown as Consultation[]);
      } catch (err: unknown) {
        console.error('Error al cargar las consultas:', err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Error desconocido al cargar las consultas.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchConsultations();
  }, []);

  const handleViewConsultation = (id: string) => {
    router.push(`/dashboard/consultation/${id}`);
  };

  if (loading) {
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

      {consultations.length === 0 ? (
        <p className="text-muted-foreground">No hay consultas registradas.</p>
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
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Doctor
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Diagnóstico
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {consultations.map((consultation) => (
                <tr key={consultation.id} className="hover:bg-accent/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                    {format(new Date(consultation.consultation_date), 'dd MMMM yyyy', { locale: es })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {consultation.patients?.full_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {consultation.profiles?.full_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground max-w-xs truncate">
                    {consultation.diagnosis}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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