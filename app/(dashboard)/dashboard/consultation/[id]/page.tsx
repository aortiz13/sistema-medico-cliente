'use client';

import React, { useEffect, useState } from 'react'; // Asegúrate de tener React importado
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
      ArrowLeft, FileText, Mic, Download, Image as ImageIcon,
} from 'lucide-react';

// Importa componentes de UI y hooks
import { Header } from '@/components/layout/Header';
import { MarkdownRenderer } from '@/components/common/MarkdownRenderer';
import { useAuth } from '@/hooks/useAuth';
import { useConsultations } from '@/hooks/useConsultations';
import { usePdfGenerator } from '@/hooks/usePdfGenerator';
import { ImageZoomModal } from '@/components/common/ImageZoomModal';

// Importa las interfaces desde types/index.ts
import { Consultation } from '@/types';

export default function ConsultationDetailPage() {
  const { profile, loading: loadingAuth, handleLogout } = useAuth();
  const { loadConsultationById, loadingConsultations, updateConsultationNotes, addConsultationImage } = useConsultations();
  const { isGeneratingPDF, generatePdf } = usePdfGenerator();

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    if (!id || !profile) return;

    const fetchConsultation = async () => {
      setError(null);
      const data = await loadConsultationById(id);
      if (data) {
        setConsultation(data);
        setEditedNotes(data.formatted_notes?.note_content || '');
      } else {
        setError("No se pudo cargar los datos de la consulta.");
      }
    };

    if (profile) {
      fetchConsultation();
    }

  }, [id, profile, loadConsultationById]);

  const handleDownloadPDF = async () => {
    if (!consultation) return;
    const patientName = consultation.patients?.full_name || 'desconocido';
    const consultationDate = new Date(consultation.created_at).toLocaleDateString();
    const fileName = `consulta-${patientName}-${consultationDate}.pdf`;
    await generatePdf('pdf-content', fileName);
  };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !consultation) return;
    setUploadingImage(true);
    const file = e.target.files[0];
    const url = await addConsultationImage(consultation.id, file);
    if (url) {
      setConsultation({ ...consultation, images: [...(consultation.images || []), url] });
    }
    setUploadingImage(false);
  };

  const handleSaveNotes = async () => {
    if (!consultation) return;
    setSaving(true);
    const success = await updateConsultationNotes(consultation.id, editedNotes);
    if (success) {
      setConsultation({ ...consultation, formatted_notes: { note_content: editedNotes } });
      setIsEditing(false);
    } else {
      alert('No se pudo guardar la nota.');
    }
    setSaving(false);
  };

  if (loadingAuth || loadingConsultations) {
    return <div className="h-screen bg-gray-50 flex items-center justify-center">Cargando...</div>;
  }

  if (error || !consultation) {
    return <div className="h-screen bg-gray-50 flex items-center justify-center text-red-500">{error || "Consulta no encontrada."}</div>;
  }

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <div className="sticky top-0 bg-background/80 backdrop-blur-sm -mx-6 md:-mx-8 px-6 md:px-8 flex justify-between items-center mb-8 py-4 z-10 border-b">
              <div>
                <Link href="/dashboard/all-consultations" className="flex items-center space-x-2 text-blue-600 hover:underline mb-2">
                  <ArrowLeft className="w-5 h-5" />
                  <span>Volver a Todas las Consultas</span>
                </Link>
                <h1 className="text-3xl font-bold text-gray-800">Detalle de la Consulta</h1>
              </div>
              <button
                onClick={handleDownloadPDF} // <-- Usa la función ahora definida
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
                      <p className="text-sm text-gray-500 mt-1">Médico: {consultation.profiles?.full_name || 'N/A'}</p>
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
                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          className="w-full h-60 p-2 border border-gray-300 rounded-md"
                          value={editedNotes}
                          onChange={(e) => setEditedNotes(e.target.value)}
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={handleSaveNotes}
                            disabled={saving}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                          >
                            {saving ? 'Guardando...' : 'Guardar'}
                          </button>
                          <button
                            onClick={() => { setIsEditing(false); setEditedNotes(consultation.formatted_notes?.note_content || ''); }}
                            className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        {profile?.id === consultation.doctor_id && (
                          <button
                            onClick={() => setIsEditing(true)}
                            className="absolute right-0 top-0 text-sm text-blue-600 underline"
                          >
                            Editar
                          </button>
                        )}
                        <MarkdownRenderer text={consultation.formatted_notes?.note_content} />
                      </div>
                    )}
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

              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-3 flex items-center text-gray-700">
                  <ImageIcon className="w-5 h-5 mr-2 text-blue-600" />
                  Fotografías Adjuntas
                </h2>
                {profile?.id === consultation.doctor_id && (
                  <div className="mb-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {consultation.images && consultation.images.length > 0 ? (
                    consultation.images.map((url) => (
                      <img
                        key={url}
                        src={url}
                        alt="Fotografía de la consulta"
                        className="w-full h-40 object-cover rounded-md border cursor-pointer"
                        onClick={() => setSelectedImage(url)}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No hay fotografías adjuntas.</p>
                  )}
                </div>
                <ImageZoomModal
                  isOpen={!!selectedImage}
                  imageUrl={selectedImage}
                  onClose={() => setSelectedImage(null)}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}