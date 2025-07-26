// hooks/useConsultations.ts
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Consultation, Patient } from '@/types'; // Importa las interfaces

interface UseConsultationsReturn {
  consultations: Consultation[];
  patientsMap: Map<string, Patient>;
  loadingConsultations: boolean;
  errorConsultations: string | null;
  loadConsultations: (limit?: number) => Promise<void>;
  loadConsultationById: (id: string) => Promise<Consultation | null>;
  updateConsultationNotes: (id: string, note: string) => Promise<boolean>;
}

export function useConsultations(): UseConsultationsReturn {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [patientsMap, setPatientsMap] = useState<Map<string, Patient>>(new Map());
  const [loadingConsultations, setLoadingConsultations] = useState(true);
  const [errorConsultations, setErrorConsultations] = useState<string | null>(null);

  const loadConsultations = useCallback(async (limit?: number) => {
    setLoadingConsultations(true);
    setErrorConsultations(null);
    try {
      const { data, error } = await supabase
        .from('consultations')
        .select(`*, patients!inner(full_name, id)`)
        .order('created_at', { ascending: false })
        .limit(limit || 100);
      if (error) throw error;
      setConsultations(data as Consultation[]);
    } catch (err: any) {
      console.error("Error al cargar consultas:", err.message);
      setErrorConsultations("No se pudieron cargar las consultas.");
    } finally {
      setLoadingConsultations(false);
    }
  }, []);

  const loadConsultationById = useCallback(async (id: string) => {
    setLoadingConsultations(true);
    setErrorConsultations(null);
    try {
      const { data, error } = await supabase
        .from('consultations')
        .select(`*, patients!inner(id, full_name), profiles(id, full_name)`)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Estandariza el formato de los datos relacionados
      const formattedData = {
        ...data,
        patients: Array.isArray(data.patients) ? data.patients[0] : data.patients,
        profiles: Array.isArray(data.profiles) ? data.profiles[0] : data.profiles,
      } as Consultation;

      return formattedData;
    } catch (err: any) {
      console.error("Error al cargar la consulta por ID:", err.message);
      setErrorConsultations("No se pudo cargar la consulta.");
      return null;
    } finally {
      setLoadingConsultations(false);
    }
  }, []);

  const updateConsultationNotes = useCallback(async (id: string, note: string) => {
    try {
      const { error } = await supabase
        .from('consultations')
        .update({ formatted_notes: { note_content: note } })
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error('Error al actualizar la nota:', err);
      return false;
    }
  }, []);


  return {
    consultations,
    patientsMap,
    loadingConsultations,
    errorConsultations,
    loadConsultations,
    loadConsultationById,
    updateConsultationNotes,
  };
}