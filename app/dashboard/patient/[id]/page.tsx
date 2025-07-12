'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Calendar, AlertTriangle, Stethoscope, FileText, HeartPulse, UserIcon } from 'lucide-react'

// --- Interfaces ---
interface Patient {
  id: string;
  full_name: string;
  document_id: string | null;
  phone: string | null;
  date_of_birth: string | null;
  allergies: string | null;
  chronic_conditions: string | null;
}

interface Consultation {
  id: string;
  created_at: string;
  formatted_notes: string;
}

export default function PatientProfilePage() {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  useEffect(() => {
    if (!id) return;

    const fetchPatientData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Hacemos dos peticiones en paralelo para mayor eficiencia
        const [patientRes, consultationsRes] = await Promise.all([
          supabase.from('patients').select('*').eq('id', id).single(),
          supabase.from('consultations').select('id, created_at, formatted_notes').eq('patient_id', id).order('created_at', { ascending: false })
        ]);

        if (patientRes.error) throw patientRes.error;
        if (consultationsRes.error) throw consultationsRes.error;

        setPatient(patientRes.data);
        setConsultations(consultationsRes.data || []);

      } catch (err: any) {
        console.error("Error al cargar los datos del paciente:", err);
        setError("No se pudieron cargar los datos del paciente.");
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [id]);

  const calculateAge = (dob: string | null) => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Cargando perfil del paciente...</div>
  }

  if (error) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-500">{error}</div>
  }

  if (!patient) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Paciente no encontrado.</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/dashboard" className="flex items-center space-x-2 text-blue-600 hover:underline">
            <ArrowLeft className="w-5 h-5" />
            <span>Volver al Panel</span>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* --- Cabecera del Perfil --- */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 md:p-8 mb-8">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 rounded-full bg-blue-500 text-white flex items-center justify-center text-5xl font-bold">
              {patient.full_name?.charAt(0) || 'P'}
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-800">{patient.full_name}</h1>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-gray-500 mt-2">
                <span className="flex items-center"><UserIcon className="w-4 h-4 mr-2" /> DNI: {patient.document_id || 'No registrado'}</span>
                <span className="flex items-center"><Calendar className="w-4 h-4 mr-2" /> Edad: {calculateAge(patient.date_of_birth)} años</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* --- Columna Izquierda: Información Médica y Datos --- */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Información Médica Clave</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 flex items-center"><AlertTriangle className="w-4 h-4 mr-2 text-red-500"/>Alergias</h3>
                  <p className="text-gray-800 mt-1 pl-6">{patient.allergies || 'No se registran alergias.'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 flex items-center"><HeartPulse className="w-4 h-4 mr-2 text-yellow-500"/>Condiciones Crónicas</h3>
                  <p className="text-gray-800 mt-1 pl-6">{patient.chronic_conditions || 'No se registran condiciones crónicas.'}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Datos de Contacto</h2>
              <div className="space-y-2 text-gray-800">
                <p><span className="font-semibold">Teléfono:</span> {patient.phone || 'No registrado'}</p>
                <p><span className="font-semibold">Fecha de Nacimiento:</span> {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString('es-AR') : 'No registrada'}</p>
              </div>
            </div>
          </div>

          {/* --- Columna Derecha: Historial de Consultas --- */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <Stethoscope className="w-6 h-6 mr-3 text-blue-600"/>
              Historial de Consultas
            </h2>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-3">
              {consultations.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Este paciente no tiene consultas registradas.</p>
              ) : (
                consultations.map(consultation => (
                  <Link href={`/dashboard/consultation/${consultation.id}`} key={consultation.id}>
                    <div className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-all">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-semibold text-blue-600">Consulta del {new Date(consultation.created_at).toLocaleDateString('es-AR')}</p>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Ver Detalle</span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{consultation.formatted_notes}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}