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
  createManualConsultation: (patientId: string, doctorId: string, note: string) => Promise<Consultation | null>;
  addConsultationImage: (id: string, file: File) => Promise<string | null>;
  deleteConsultationImage: (id: string, imageUrl: string) => Promise<boolean>;
  deleteConsultation: (id: string) => Promise<boolean>;
}

export function useConsultations(): UseConsultationsReturn {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [patientsMap, setPatientsMap] = useState<Map<string, Patient>>(new Map());
  const [loadingConsultations, setLoadingConsultations] = useState(true);
  const [errorConsultations, setErrorConsultations] = useState<string | null>(null);

  // Esta función ya no es necesaria para cargar consultas,
  // pero la mantenemos por si se usa en otro lugar.
  const getPublicImageUrls = (images?: string[]): string[] => {
    if (!images) return [];
    return images.map((path) => {
      const { data } = supabase.storage
        .from('consultation-images')
        .getPublicUrl(path);
      return data.publicUrl;
    });
  };

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
      // CORRECCIÓN: Se elimina el mapeo innecesario.
      // Las URLs de las imágenes ya vienen completas desde la base de datos.
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

      // CORRECCIÓN: Se elimina el llamado a getPublicImageUrls.
      // La propiedad 'images' ya contiene las URLs públicas completas.

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


  const createManualConsultation = useCallback(async (patientId: string, doctorId: string, note: string) => {
    try {
      const { data, error } = await supabase
        .from('consultations')
        .insert({
          patient_id: patientId,
          doctor_id: doctorId,
          status: 'completed',
          formatted_notes: { note_content: note },
          consultation_type: 'manual_note',
        })
        .select('id, created_at, formatted_notes, status, patient_id')
        .single();
      if (error) throw error;
      const newConsult = data as Consultation;
      setConsultations(prev => [newConsult, ...prev]);
      return newConsult;
    } catch (err: any) {
      console.error('Error al crear nota manual:', err.message);
      return null;
    }
  }, []);

  const deleteConsultation = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('consultations')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setConsultations(prev => prev.filter(c => c.id !== id));
      return true;
    } catch (err) {
      console.error('Error al eliminar la consulta:', err);
      return false;
    }
  }, []);

  const addConsultationImage = useCallback(async (id: string, file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('consultation-images')
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from('consultation-images')
        .getPublicUrl(filePath);
      const publicUrl = publicData.publicUrl;

      const { data: existing, error: fetchError } = await supabase
        .from('consultations')
        .select('images')
        .eq('id', id)
        .single();
      if (fetchError) throw fetchError;

      const images = (existing?.images as string[] | null) || [];
      images.push(publicUrl);

      const { error: updateError } = await supabase
        .from('consultations')
        .update({ images })
        .eq('id', id);
      if (updateError) throw updateError;

      setConsultations(prev => prev.map(c => c.id === id ? { ...c, images } : c));
      return publicUrl;
    } catch (err) {
      console.error('Error al subir la imagen:', err);
      return null;
    }
  }, []);

  const deleteConsultationImage = useCallback(async (id: string, imageUrl: string) => {
    try {
      const url = new URL(imageUrl);
      const path = url.pathname.split('/storage/v1/object/public/consultation-images/')[1];
      if (!path) throw new Error('Invalid image URL');

      const { error: removeError } = await supabase.storage
        .from('consultation-images')
        .remove([path]);
      if (removeError) throw removeError;

      const { data: existing, error: fetchError } = await supabase
        .from('consultations')
        .select('images')
        .eq('id', id)
        .single();
      if (fetchError) throw fetchError;

      const images = (existing?.images as string[] | null) || [];
      const updatedImages = images.filter((url) => url !== imageUrl);

      const { error: updateError } = await supabase
        .from('consultations')
        .update({ images: updatedImages })
        .eq('id', id);
      if (updateError) throw updateError;

      setConsultations(prev => prev.map(c => c.id === id ? { ...c, images: updatedImages } : c));
      return true;
    } catch (err) {
      console.error('Error al eliminar la imagen:', err);
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
    createManualConsultation,
    deleteConsultation,
    addConsultationImage,
    deleteConsultationImage,
  };
}