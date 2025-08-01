'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { Consultation } from '@/types';
import { AudioPlayerModal } from '@/components/common/AudioPlayerModal'; // <-- IMPORTA EL NUEVO COMPONENTE

interface RecordingWithProfile extends Consultation {
  patients: { id: string; full_name: string; document_id: string | null } | null;
  profiles: { id: string; full_name: string } | null;
  publicUrl?: string | null;
}

export default function RecordingsPage() {
  const { user, profile, loading: loadingAuth } = useAuth();
  const [records, setRecords] = useState<RecordingWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [filters, setFilters] = useState({
    patientName: '',
    patientDni: '',
    doctorName: '',
    consultationDate: '',
  });

  // --- NUEVOS ESTADOS PARA EL MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [loadingAudio, setLoadingAudio] = useState(false);
  // ------------------------------------

  const fetchRecords = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('consultations')
        .select(
          `
            id,
            created_at,
            doctor_id,
            audio_storage_path,
            status,
            patients ( id, full_name, document_id ),
            profiles ( id, full_name )
          `
        )
        .not('audio_storage_path', 'is', null)
        .order('created_at', { ascending: false });

      if (profile?.role === 'asistente') {
        query = query.eq('doctor_id', user.id);
      }

      const { data, error: supabaseError } = await query;
      if (supabaseError) throw supabaseError;

      const formattedData = (data || []).map((c) => ({
        ...c,
        patients: Array.isArray(c.patients) ? c.patients[0] : c.patients,
        profiles: Array.isArray(c.profiles) ? c.profiles[0] : c.profiles,
      }));

      setRecords(formattedData as RecordingWithProfile[]);
    } catch (err) {
      console.error('Error al cargar las grabaciones:', err);
      setError('Error desconocido al cargar las grabaciones.');
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    if (!loadingAuth) {
      if (profile?.role !== 'doctor') {
        router.push('/dashboard');
        return;
      }
      fetchRecords();
    }
  }, [loadingAuth, profile, fetchRecords, router]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ patientName: '', patientDni: '', doctorName: '', consultationDate: '' });
  };

  const filtered = useMemo(() => {
    return records.filter(record => {
      const patientNameMatch =
        !filters.patientName ||
        record.patients?.full_name?.toLowerCase().includes(filters.patientName.toLowerCase());

      const patientDniMatch =
        !filters.patientDni ||
        record.patients?.document_id?.toLowerCase().includes(filters.patientDni.toLowerCase());

      const doctorNameMatch =
        !filters.doctorName ||
        record.profiles?.full_name?.toLowerCase().includes(filters.doctorName.toLowerCase());

      const dateMatch =
        !filters.consultationDate ||
        format(new Date(record.created_at), 'yyyy-MM-dd') === filters.consultationDate;

      return patientNameMatch && patientDniMatch && doctorNameMatch && dateMatch;
    });
  }, [records, filters]);

  // --- FUNCIÓN MODIFICADA PARA ABRIR EL MODAL ---
  const handleViewRecording = async (record: RecordingWithProfile) => {
    if (!record.audio_storage_path) {
      alert('No hay una ruta de audio para esta grabación.');
      return;
    }
    setLoadingAudio(true);
    try {
      const { data, error } = await supabase.storage
        .from('consultation-audios')
        .createSignedUrl(record.audio_storage_path, 3600); // URL válida por 1 hora

      if (error) throw error;

      if (data?.signedUrl) {
        setCurrentAudioUrl(data.signedUrl);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error('Error al generar la URL firmada:', error);
      alert('No se pudo obtener el enlace de la grabación.');
    } finally {
      setLoadingAudio(false);
    }
  };
  // ---------------------------------------------

  if (loading || loadingAuth) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-lg text-muted-foreground">Cargando grabaciones...</p>
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
    <>
      {/* --- RENDERIZA EL MODAL AQUÍ --- */}
      <AudioPlayerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        audioUrl={currentAudioUrl}
      />
      {/* ---------------------------------- */}
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold text-foreground mb-6">Grabaciones de Consultas</h1>

        <div className="bg-card p-4 rounded-lg shadow-md border border-border mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div>
              <Label htmlFor="patientName">Paciente</Label>
              <Input id="patientName" name="patientName" placeholder="Nombre o Apellido" value={filters.patientName} onChange={handleFilterChange} />
            </div>
            <div>
              <Label htmlFor="patientDni">DNI</Label>
              <Input id="patientDni" name="patientDni" placeholder="DNI del paciente" value={filters.patientDni} onChange={handleFilterChange} />
            </div>
            <div>
              <Label htmlFor="doctorName">Profesional</Label>
              <Input id="doctorName" name="doctorName" placeholder="Nombre del profesional" value={filters.doctorName} onChange={handleFilterChange} />
            </div>
            <div>
              <Label htmlFor="consultationDate">Fecha</Label>
              <Input id="consultationDate" name="consultationDate" type="date" value={filters.consultationDate} onChange={handleFilterChange} />
            </div>
            <div className="flex gap-2">
              <Button onClick={clearFilters} variant="outline" className="w-full">
                <X className="mr-2 h-4 w-4" /> Limpiar
              </Button>
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-muted-foreground text-center">No hay grabaciones que coincidan con los filtros.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow-md border border-border">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-secondary">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Fecha</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Paciente</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">DNI</th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Profesional</th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {filtered.map(record => (
                  <tr key={record.id} className="hover:bg-accent/10 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                      {format(new Date(record.created_at), 'dd MMMM yyyy', { locale: es })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {record.patients?.full_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {record.patients?.document_id || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-foreground">
                      {record.profiles?.full_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <button
                        onClick={() => handleViewRecording(record)}
                        className="text-primary hover:text-primary/80"
                        disabled={loadingAudio}
                      >
                        {loadingAudio ? 'Cargando...' : 'Escuchar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}