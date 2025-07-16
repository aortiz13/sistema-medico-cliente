// types/index.ts

export interface Profile {
  id: string;
  full_name: string;
  role: string;
}

export interface Patient {
  id: string;
  full_name: string | null;
  document_id: string | null;
  date_of_birth: string | null;
  allergies: string | null;
  chronic_conditions: string | null;
  phone: string | null;
  email: string | null;
  created_at: string; // Añadido si se usa en Patient para ordenamiento
  user_id?: string; // Propiedad opcional si se usa para crear un paciente
}

export interface FormattedNote {
  note_content: string;
}

export interface Consultation {
  id: string;
  created_at: string;
  status: string;
  transcription?: string; // Puede no estar disponible inicialmente
  formatted_notes: FormattedNote | null;
  patient_id: string | null;
  doctor_id?: string; // Añadido para el Dashboard
  audio_storage_path?: string; // Añadido para el Dashboard
  consultation_type?: string; // Añadido para el Dashboard
  patients?: { full_name: string; id: string; } | null; // Usado en algunas consultas
}