'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  ArrowLeft, FileText, Mic, Download,
} from 'lucide-react';

// Importa componentes de UI y hooks
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MarkdownRenderer } from '@/components/common/MarkdownRenderer';
import { useAuth } from '@/hooks/useAuth'; // Importa el hook de autenticación
import { useConsultations } from '@/hooks/useConsultations'; // Importa el hook de consultas

// Importa las interfaces desde types/index.ts
import { Consultation } from '@/types';

export default function ConsultationDetailPage() {
  const { profile, loading: loadingAuth, handleLogout } = useAuth(); // Usa el hook de autenticación
  const { loadConsultationById, loadingConsultations } = useConsultations(); // Usa el hook de consultas para cargar por ID

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  useEffect(() => {
    if (!id || !profile) return; // Espera a que el perfil esté cargado

    const fetchConsultation = async () => {
      setError(null);
      const data = await loadConsultationById(id);
      if (data) {
        setConsultation(data);
      } else {
        setError("No se pudo cargar los datos de la consulta.");
      }
    };

    if (profile) { // Solo si el perfil ya está cargado
      fetchConsultation();
    }

  }, [id, profile, loadConsultationById]); // Dependencia de 'profile' para esperar su carga

  if (loadingAuth || loadingConsultations) {
    return <div className="h-screen bg-gray-50 flex items-center justify-center">Cargando...</div>;
  }

  if (error || !consultation) {
    return <div className="h-screen bg-gray-50 flex items-center justify-center text-red-500">{error || "Consulta no encontrada."}</div>;
  }

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      <Sidebar profile={profile} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header profile={profile} onLogout={handleLogout} title="Detalle de la Consulta" showSearch={false} />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <Link href="/dashboard/all-consultations" className="flex items-center space-x-2 text-blue-600 hover:underline mb-2">
                  <ArrowLeft className="w-5 h-5" />
                  <span>Volver a Todas las Consultas</span>
                </Link>
                <h1 className="text-3xl font-bold text-gray-800">Detalle de la Consulta</h1>
              </div>
              <button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors shadow-sm"
              >
                <Download className="w-5 h-5" />
                <span>{isGeneratingPDF ? 'Generando...' : 'Descargar PDF'}</span>
              </button>
            </div>

            <div id="pdf-content" className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
              <div className="border-b pb-4 mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Paciente</p>
                    <Link href={`/dashboard/patient/${consultation.patients?.id}`} className="text-2xl font-bold text-gray-800 hover:underline">
                      {consultation.patients?.full_name || 'Paciente desconocido'}
                    </Link>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 text-right">Fecha de Consulta</p>
                    <p className="text-lg font-semibold text-gray-800">{new Date(consultation.created_at).toLocaleString('es-AR')}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h2 className="text-xl font-semibold mb-3 flex items-center text-gray-700">
                    <FileText className="w-5 h-5 mr-2 text-blue-600" />
                    Notas Clínicas (Generadas por IA)
                  </h2>
                  <div className="bg-gray-50 p-4 rounded-md text-gray-800 font-sans text-sm leading-relaxed">
                    <MarkdownRenderer text={consultation.formatted_notes?.note_content} />
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-3 flex items-center text-gray-700">
                    <Mic className="w-5 h-5 mr-2 text-blue-600" />
                    Transcripción del Audio
                  </h2>
                  <div className="bg-gray-100 p-4 rounded-md text-gray-600 border italic text-sm max-h-80 overflow-y-auto">
                    {consultation.transcription}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}