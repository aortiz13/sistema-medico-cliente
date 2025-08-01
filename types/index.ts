// types/index.ts

export interface Profile {
  id: string;
  full_name: string;
  role: string;
  avatar_url?: string | null;
}

export interface Patient {
  id: string;
  full_name: string | null;
  document_id?: string | null; // <-- Ahora opcional
  date_of_birth?: string | null; // <-- Ahora opcional
  allergies?: string | null; // <-- Ahora opcional
  chronic_conditions?: string | null; // <-- Ahora opcional
  phone?: string | null; // <-- Ya era opcional, pero aseguremos
  email?: string | null; // <-- Ya era opcional, pero aseguremos
  manual_note?: string | null; // Nota escrita manualmente por el médico
  created_at: string;
  user_id?: string;
}

export interface FormattedNote {
  note_content: string;
}

export interface Consultation {
  id: string;
  created_at: string;
  status: string;
  transcription?: string;
  formatted_notes: FormattedNote | null;
  patient_id: string | null;
  doctor_id?: string;
  audio_storage_path?: string;
  consultation_type?: string;
  patients?: { full_name: string; id: string; } | null;
  profiles?: { full_name: string; id: string; } | null;
}