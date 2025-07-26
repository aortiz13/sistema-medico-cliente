import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Consultation, Patient } from '@/types'; // Importa las interfaces

interface UseConsultationsReturn {
  consultations: Consultation[];
  patientsMap: Map<string, Patient>; // Mapa para acceso rápido a datos de paciente
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
      // Optimizamos la carga para obtener consultas y pacientes en paralelo
      const [consultationsRes, patientsRes] = await Promise.all([
        supabase.from('consultations').select(`*, patients!inner(full_name, id, document_id, date_of_birth, allergies, chronic_conditions, phone, email)`).order('created_at', { ascending: false }).limit(limit || 100), // Límite por defecto
        supabase.from('patients').select('*') // Carga todos los pacientes para el mapa
      ]);

      if (consultationsRes.error) throw consultationsRes.error;
      if (patientsRes.error) throw patientsRes.error;

      const pMap = new Map(patientsRes.data.map(p => [p.id, p]));
      setPatientsMap(pMap);

      // Mapear los nombres de pacientes a las consultas si es necesario para el estado
      const formattedConsultations = consultationsRes.data.map(c => ({
        ...c,
        patients: pMap.get(c.patient_id || '') || null // Asegurarse de que `patients` se completa
      }));

      setConsultations(formattedConsultations as Consultation[]);
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
        .select(`*, patients!inner(id, full_name)`)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Consultation;
    } catch (err: any) {
      console.error("Error al cargar la consulta por ID:", err.message);
      setErrorConsultations("No se pudo cargar la consulta.");
      return null;
    } finally {
      setLoadingConsultations(false);
    }
  }, []);

  const updateConsultationNotes = useCallback(
    async (id: string, note: string) => {
      setErrorConsultations(null);
      try {
        const { error } = await supabase
          .from('consultations')
          .update({ formatted_notes: { note_content: note } })
          .eq('id', id);

        if (error) throw error;

        // Actualizar el estado local para reflejar el cambio
        setConsultations((prev) =>
          prev.map((c) =>
            c.id === id ? { ...c, formatted_notes: { note_content: note } } : c
          )
        );

        return true;
      } catch (err: any) {
        console.error('Error al actualizar la nota de la consulta:', err);
        setErrorConsultations('No se pudo actualizar la nota.');
        return false;
      }
    },
    []
  );


  return {
    consultations,
    patientsMap,
    loadingConsultations,
    errorConsultations,
    loadConsultations,
    loadConsultationById,
    updateConsultationNotes
  };
}