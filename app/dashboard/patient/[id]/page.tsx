'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  ArrowLeft, User as UserIcon, Calendar, BookOpen, AlertTriangle,
  HeartPulse, Stethoscope,
} from 'lucide-react';

// Importa componentes de UI y hooks
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth'; // Importa el hook de autenticación
import { useConsultations } from '@/hooks/useConsultations'; // Importa el hook de consultas
import { supabase } from '@/lib/supabase'; // Importa supabase si sigue siendo necesario directamente aquí

// Importa las interfaces desde types/index.ts
import { Patient, Consultation } from '@/types';

export default function PatientProfilePage() {
  const { user, profile, loading: loadingAuth, handleLogout } = useAuth(); // Usa el hook de autenticación
  const { consultations, loadConsultations } = useConsultations(); // Usamos loadConsultations para cargar las consultas del paciente

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loadingPatientData, setLoadingPatientData] = useState(true); // Nuevo estado de carga para los datos específicos del paciente
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingHistory, setIsGeneratingHistory] = useState(false);
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  useEffect(() => {
    if (!id || !user) return; // Espera a que el usuario esté cargado
    const fetchPatientSpecificData = async () => {
      setLoadingPatientData(true);
      setError(null);
      try {
        const { data: patientRes, error: patientError } = await supabase.from('patients').select('*').eq('id', id).single();
        if (patientError) throw patientError;
        setPatient(patientRes);

        // Cargar consultas específicas del paciente usando la función del hook de consultas
        const { data: consultationsRes, error: consultationsError } = await supabase.from('consultations')
          .select('id, created_at, formatted_notes')
          .eq('patient_id', id)
          .order('created_at', { ascending: false });

        if (consultationsError) throw consultationsError;
        // El hook useConsultations ya mantiene su propio estado 'consultations',
        // pero aquí necesitamos las consultas filtradas por paciente para este componente.
        // Podríamos extender useConsultations para filtrar, o simplemente fetchear aquí como está.
        // Para simplificar, asumimos que 'consultations' en este componente ahora se refiere a las del paciente.
        // (Nota: Si useConsultations se extiende para filtrar, esta parte se haría con ese hook)
        // Por ahora, para no reintroducir un estado duplicado en el hook de consultas,
        // simplemente mantenemos el estado local de 'consultations' aquí para las consultas del paciente.
        // Idealmente, useConsultations debería tener una función `loadConsultationsByPatient(patientId)`
        // y este componente la usaría para obtener las consultas y las asignaría a su propio estado local.
        setConsultations(consultationsRes || []);

      } catch (err) {
        if (err instanceof Error) {
          console.error("Error al cargar los datos del paciente:", err.message);
        }
        setError("No se pudieron cargar los datos del paciente o sus consultas.");
      } finally {
        setLoadingPatientData(false);
      }
    };

    if (user) {
      fetchPatientSpecificData();
    }
  }, [id, user, router]); // Dependencia de 'user' para esperar autenticación

  const calculateAge = (dob: string | null | undefined) => {
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

  const handleDownloadHistory = async () => {
    if (!patient) return;
    setIsGeneratingHistory(true);

    const reportElement = document.createElement('div');
    reportElement.id = 'full-history-report';
    reportElement.style.position = 'absolute';
    reportElement.style.left = '-9999px';
    reportElement.style.width = '1000px';
    reportElement.style.padding = '40px';
    reportElement.style.backgroundColor = 'white';

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

    const input = document.getElementById('full-history-report');
    if (input) {
        await html2canvas(input, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
            .then((canvas) => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
                const pdfWidth = pdf.internal.pageSize.getWidth();
                let pdfHeight = pdf.internal.pageSize.getHeight();
                const canvasWidth = canvas.width;
                const canvasHeight = canvas.height;
                const ratio = canvasWidth / canvasHeight;
                let finalHeight = pdfWidth / ratio;

                let heightLeft = finalHeight;
                let position = 0;

                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, finalHeight);
                heightLeft -= pdfHeight;

                while (heightLeft > 0) {
                    position = heightLeft - finalHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, finalHeight);
                    heightLeft -= pdfHeight;
                }
                pdf.save(`historial-completo-${patient.full_name}.pdf`);
            });
    }

    document.body.removeChild(reportElement);
    setIsGeneratingHistory(false);
  };


  if (loadingAuth || loadingPatientData) {
    return <div className="h-screen bg-base-200 flex items-center justify-center">Cargando...</div>;
  }

  return (
    <div className="h-screen flex bg-base-200 overflow-hidden">
      <Sidebar profile={profile} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header profile={profile} onLogout={handleLogout} title="Ficha del Paciente" showSearch={false} />
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <Link href="/dashboard/all-consultations" className="inline-flex items-center space-x-2 text-text-secondary hover:text-primary transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span className="font-semibold">Volver a Consultas</span>
              </Link>
            </div>

            <div className="bg-base-100 rounded-xl shadow-soft border border-base-300 p-8 mb-8">
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="flex items-center space-x-6">
                  <div className="w-24 h-24 rounded-full bg-primary text-white flex items-center justify-center text-5xl font-bold flex-shrink-0">
                    {patient?.full_name?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-text-primary">{patient?.full_name}</h1>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-text-secondary mt-2">
                      <span className="flex items-center"><UserIcon className="w-4 h-4 mr-2" /> DNI: {patient?.document_id || 'No registrado'}</span>
                      <span className="flex items-center"><Calendar className="w-4 h-4 mr-2" /> Edad: {calculateAge(patient?.date_of_birth)} años</span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2 mt-4 md:mt-0">
                  <button
                    onClick={handleDownloadHistory}
                    disabled={isGeneratingHistory}
                    className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark disabled:bg-gray-400 transition-colors shadow-soft"
                  >
                    <BookOpen className="w-5 h-5" />
                    <span className="font-semibold">{isGeneratingHistory ? 'Generando...' : 'Historial Completo'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-1 space-y-8">
                <div className="bg-base-100 rounded-xl shadow-soft border border-base-300 p-6">
                  <h2 className="text-xl font-bold text-text-primary mb-4">Información Médica Clave</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-text-secondary flex items-center"><AlertTriangle className="w-4 h-4 mr-2 text-accent"/>Alergias</h3>
                      <p className="text-text-primary mt-1 pl-6">{patient?.allergies || 'No se registran alergias.'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-text-secondary flex items-center"><HeartPulse className="w-4 h-4 mr-2 text-warning"/>Condiciones Crónicas</h3>
                      <p className="text-text-primary mt-1 pl-6">{patient?.chronic_conditions || 'No se registran condiciones crónicas.'}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-base-100 rounded-xl shadow-soft border border-base-300 p-6">
                  <h2 className="text-xl font-bold text-text-primary mb-4">Datos de Contacto</h2>
                  <div className="space-y-2 text-text-primary">
                    <p><span className="font-semibold">Teléfono:</span> {patient?.phone || 'No registrado'}</p>
                    <p><span className="font-semibold">Email:</span> {patient?.email || 'No registrado'}</p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 bg-base-100 rounded-xl shadow-soft border border-base-300 p-6">
                <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center">
                  <Stethoscope className="w-6 h-6 mr-3 text-primary"/>
                  Historial de Consultas
                </h2>
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-3">
                  {consultations.length === 0 ? (
                    <p className="text-text-secondary text-center py-8">Este paciente no tiene consultas registradas.</p>
                  ) : (
                    consultations.map(consultation => (
                      <Link href={`/dashboard/consultation/${consultation.id}`} key={consultation.id}>
                        <div className="border border-base-300 rounded-lg p-4 cursor-pointer hover:bg-base-200 hover:border-primary transition-all">
                          <div className="flex justify-between items-center mb-2">
                            <p className="font-semibold text-primary">Consulta del {new Date(consultation.created_at).toLocaleDateString('es-AR', { timeZone: 'UTC' })}</p>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Ver Detalle</span>
                          </div>
                          <p className="text-sm text-text-secondary truncate">{consultation.formatted_notes}</p>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}