import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface UseAudioRecorderReturn {
  isRecording: boolean;
  isPaused: boolean;
  audioBlob: Blob | null;
  isProcessingAudio: boolean;
  startRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => void;
  processAudio: (selectedPatientId: string, consultationType: string, user: SupabaseUser) => Promise<boolean>;
  resetAudio: () => void;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const audioChunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => audioChunks.push(event.data);
      mediaRecorder.onstop = () => {
        const recordedBlob = new Blob(audioChunks, { type: 'audio/wav' });
        setAudioBlob(recordedBlob);
        audioStreamRef.current?.getTracks().forEach(track => track.stop()); // Detener la pista de audio del micrófono
      };
      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
      setAudioBlob(null); // Reiniciar el blob de audio al iniciar una nueva grabación
    } catch (err) {
      console.error("Error al acceder al micrófono:", err);
      alert('Error al acceder al micrófono. Asegúrate de otorgar permisos.');
    }
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && (mediaRecorderRef.current.state === "recording" || mediaRecorderRef.current.state === "paused")) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsPaused(false);
  }, []);

  const processAudio = useCallback(async (selectedPatientId: string, consultationType: string, user: SupabaseUser) => {
    if (!audioBlob) {
      alert('No hay audio para procesar.');
      return false;
    }
    if (!selectedPatientId) {
      alert('Por favor, selecciona un paciente.');
      return false;
    }

    setIsProcessingAudio(true);
    try {
      const fileName = `${user.id}/${selectedPatientId}_${Date.now()}.wav`;

      // 1. Subir el archivo de audio a Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('consultation-audios')
        .upload(fileName, audioBlob);

      if (uploadError) {
        throw new Error(`Error al subir el audio: ${uploadError.message}`);
      }

      // 2. Insertar una nueva consulta con el estado 'pending'
      const { error: insertError } = await supabase
        .from('consultations')
        .insert({
          patient_id: selectedPatientId,
          doctor_id: user.id,
          status: 'pending',
          audio_storage_path: uploadData.path,
          consultation_type: consultationType,
        });

      if (insertError) {
        throw new Error(`Error al crear el registro de la consulta: ${insertError.message}`);
      }

      alert('Consulta enviada a procesar. Se actualizará en unos momentos.');
      setAudioBlob(null); // Limpiar el audio grabado
      return true;
    } catch (err: any) {
      console.error("Error en processAudio:", err);
      alert(`Error al procesar el audio: ${err.message}`);
      return false;
    } finally {
      setIsProcessingAudio(false);
    }
  }, [audioBlob]);

  const resetAudio = useCallback(() => {
    setAudioBlob(null);
    setIsRecording(false);
    setIsPaused(false);
    setIsProcessingAudio(false);
  }, []);

  return {
    isRecording,
     isPaused,
    audioBlob,
    isProcessingAudio,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    processAudio,
    resetAudio,
  };
}