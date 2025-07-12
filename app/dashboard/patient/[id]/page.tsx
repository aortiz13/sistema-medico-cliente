'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, User, Calendar, AlertTriangle, Stethoscope, FileText, 
  HeartPulse, Mail, Download, BookOpen,
  UserIcon
} from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// --- Interfaces ---
interface Patient {
  id: string;
  full_name: string;
  document_id: string | null;
  phone: string | null;
  email: string | null;
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
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingHistory, setIsGeneratingHistory] = useState(false);
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  useEffect(() => {
    if (!id) return;

    const fetchPatientData = async () => {
      setLoading(true);
      setError(null);
      try {
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

  const handleDownloadPDF = (elementId: string, fileName: string) => {
    const input = document.getElementById(elementId);
    if (!input) return;

    setIsGeneratingPDF(true);
    html2canvas(input, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
      .then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = imgWidth / imgHeight;
        const pdfHeight = pdfWidth / ratio;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(fileName);
      })
      .finally(() => setIsGeneratingPDF(false));
  };

  // NUEVO: Función para descargar el historial completo
  const handleDownloadHistory = async () => {
    if (!patient) return;
    setIsGeneratingHistory(true);

    // 1. Crear un contenedor temporal y oculto para el reporte
    const reportElement = document.createElement('div');
    reportElement.id = 'full-history-report';
    reportElement.style.position = 'absolute';
    reportElement.style.left = '-9999px';
    reportElement.style.width = '1000px'; // Ancho fijo para consistencia
    reportElement.style.padding = '40px';
    reportElement.style.backgroundColor = 'white';
    
    // 2. Construir el contenido HTML del reporte
    let reportHTML = `
      <div style="font-family: sans-serif; color: #333;">
        <h1 style="font-size: 28px; font-weight: bold; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 20px;">Historia Clínica Completa</h1>
        <h2 style="font-size: 22px; font-weight: bold;">${patient.full_name}</h2>
        <p><strong>DNI:</strong> ${patient.document_id || 'No registrado'}</p>
        <p><strong>Fecha de Nacimiento:</strong> ${patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString('es-AR', { timeZone: 'UTC' }) : 'No registrada'}</p>
        <hr style="margin: 20px 0;" />
    `;

    consultations.forEach(consult => {
      reportHTML += `
        <div style="margin-bottom: 30px; page-break-inside: avoid;">
          <h3 style="font-size: 18px; font-weight: bold; background-color: #f3f4f6; padding: 10px; border-radius: 5px;">Consulta del ${new Date(consult.created_at).toLocaleDateString('es-AR', { timeZone: 'UTC' })}</h3>
          <div style="white-space: pre-wrap; padding: 10px; font-size: 14px;">${consult.formatted_notes}</div>
        </div>
      `;
    });
    
    reportHTML += '</div>';
    reportElement.innerHTML = reportHTML;
    document.body.appendChild(reportElement);

    // 3. Generar el PDF a partir del elemento oculto
    await handleDownloadPDF('full-history-report', `historial-completo-${patient.full_name}.pdf`);

    // 4. Limpiar y eliminar el elemento temporal
    document.body.removeChild(reportElement);
    setIsGeneratingHistory(false);
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Cargando...</div>
  }

  if (error || !patient) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-500">{error || "Paciente no encontrado."}</div>
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
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 rounded-full bg-blue-500 text-white flex items-center justify-center text-5xl font-bold flex-shrink-0">
                {patient.full_name?.charAt(0) || 'P'}
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-800">{patient.full_name}</h1>
                {/* CAMBIO: Se añade DNI y Fecha de Nacimiento a la cabecera */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-gray-500 mt-2">
                  <span className="flex items-center"><UserIcon className="w-4 h-4 mr-2" /> DNI: {patient.document_id || 'No registrado'}</span>
                  <span className="flex items-center"><Calendar className="w-4 h-4 mr-2" /> Nacimiento: {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString('es-AR', { timeZone: 'UTC' }) : 'No registrada'}</span>
                </div>
              </div>
            </div>
            {/* CAMBIO: Se añade el nuevo botón de descarga */}
            <div className="flex space-x-2 mt-4 md:mt-0">
              <button
                onClick={handleDownloadHistory}
                disabled={isGeneratingHistory}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors shadow-sm"
              >
                <BookOpen className="w-5 h-5" />
                <span>{isGeneratingHistory ? 'Generando...' : 'Historial Completo'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
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
                <p><span className="font-semibold">Email:</span> {patient.email || 'No registrado'}</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <Stethoscope className="w-6 h-6 mr-3 text-blue-600"/>
              Historial de Consultas Recientes
            </h2>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-3">
              {consultations.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Este paciente no tiene consultas registradas.</p>
              ) : (
                consultations.map(consultation => (
                  <div id={`consultation-${consultation.id}`} key={consultation.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-all">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-semibold text-blue-600">Consulta del {new Date(consultation.created_at).toLocaleDateString('es-AR', { timeZone: 'UTC' })}</p>
                      <button onClick={() => handleDownloadPDF(`consultation-${consultation.id}`, `consulta-${new Date(consultation.created_at).toLocaleDateString()}.pdf`)}
                        className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-600"
                      >
                        <Download size={14}/>
                        <span>PDF</span>
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{consultation.formatted_notes}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}