import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Patient } from '@/types'; // Importa la interfaz Patient

interface UsePatientsReturn {
  patients: Patient[];
  loadingPatients: boolean;
  errorPatients: string | null;
  loadPatients: () => Promise<void>;
  createPatient: (newPatient: Omit<Patient, 'id' | 'created_at'>, userId: string) => Promise<boolean>;
  updatePatientManualNote: (id: string, note: string) => Promise<boolean>;
}

export function usePatients(): UsePatientsReturn {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [errorPatients, setErrorPatients] = useState<string | null>(null);

  const loadPatients = useCallback(async () => {
    setLoadingPatients(true);
    setErrorPatients(null);
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPatients(data || []);
    } catch (err: any) {
      console.error("Error al cargar pacientes:", err.message);
      setErrorPatients("No se pudieron cargar los pacientes.");
    } finally {
      setLoadingPatients(false);
    }
  }, []);

  const createPatient = useCallback(async (newPatient: Omit<Patient, 'id' | 'created_at'>, userId: string) => {
    setErrorPatients(null);
    try {
      const { error } = await supabase
        .from('patients')
        .insert([{
          full_name: newPatient.full_name,
            document_id: newPatient.document_id,
          phone: newPatient.phone,
          email: newPatient.email,
          user_id: userId
        }]);

      if (error) throw error;
      await loadPatients(); // Recargar la lista de pacientes después de crear uno nuevo
      return true;
    } catch (err: any) {
      console.error("Error al crear el paciente:", err.message);
      setErrorPatients("Error al crear el paciente: " + err.message);
      return false;
    }
  }, [loadPatients]);

  const updatePatientManualNote = useCallback(async (id: string, note: string) => {
    try {
      const { error } = await supabase
        .from('patients')
        .update({ manual_note: note })
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error('Error al actualizar nota manual:', err.message);
      return false;
    }
  }, []);

  return { patients, loadingPatients, errorPatients, loadPatients, createPatient, updatePatientManualNote };
}