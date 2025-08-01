'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  ArrowLeft, User as UserIcon, Calendar, BookOpen, AlertTriangle,
  HeartPulse, Stethoscope,
} from 'lucide-react';

// Importa componentes de UI y hooks
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { useConsultations } from '@/hooks/useConsultations';
import { usePdfGenerator } from '@/hooks/usePdfGenerator';
import { usePatients } from '@/hooks/usePatients';
import { supabase } from '@/lib/supabase';
import { MarkdownRenderer } from '@/components/common/MarkdownRenderer';

// Importa las interfaces desde types/index.ts
import { Patient, Consultation } from '@/types';

export default function PatientProfilePage() {
  const { user, profile, loading: loadingAuth, handleLogout } = useAuth();
  const { isGeneratingPDF, generatePdf } = usePdfGenerator();
  const { updatePatientManualNote } = usePatients();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loadingPatientData, setLoadingPatientData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [editedNote, setEditedNote] = useState('');
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  useEffect(() => {
    if (!id || !user) return;

    const fetchPatientSpecificData = async () => {
      setLoadingPatientData(true);
      setError(null);
      try {
        const { data: patientRes, error: patientError } = await supabase.from('patients').select('*').eq('id', id).single();
        if (patientError) throw patientError;
        setPatient(patientRes);
        setEditedNote(patientRes.manual_note || '');

        const { data: consultationsRes, error: consultationsError } = await supabase.from('consultations')
          .select('id, created_at, formatted_notes, status, patient_id')
          .eq('patient_id', id)
          .order('created_at', { ascending: false });

        if (consultationsError) throw consultationsError;
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
  }, [id, user]);

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

    const fileName = `historial-completo-${patient.full_name || 'paciente'}.pdf`;

    generatePdf('full-history-report', fileName, {
      onClone: (clonedDoc) => {
        const content = clonedDoc.getElementById('full-history-report');
        if (content) {
          content.style.backgroundColor = 'white';
          const allElements = content.querySelectorAll('*');
          allElements.forEach((el) => {
            (el as HTMLElement).style.color = '#000000';
          });
        }
      }
    });
  };

  const handleSaveNote = async () => {
    if (!patient) return;
    const success = await updatePatientManualNote(patient.id, editedNote);
    if (success) {
      setPatient({ ...patient, manual_note: editedNote });
      setIsEditingNote(false);
    } else {
      alert('No se pudo guardar la nota.');
    }
  };

  if (loadingAuth || loadingPatientData) {
    return <div className="h-screen bg-base-200 flex items-center justify-center">Cargando...</div>;
  }

  return (
    <div className="h-screen flex bg-base-200 overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <Link href="/dashboard/all-consultations" className="inline-flex items-center space-x-2 text-text-secondary hover:text-primary transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span>Volver a Consultas</span>
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
                    disabled={isGeneratingPDF}
                    className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark disabled:bg-gray-400 transition-colors shadow-soft"
                  >
                    <BookOpen className="w-5 h-5" />
                    <span className="font-semibold">{isGeneratingPDF ? 'Generando...' : 'Historial Completo'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Este div es creado temporalmente para la generación del PDF. No es visible */}
            <div id="full-history-report" style={{ position: 'absolute', left: '-9999px', width: '1000px', padding: '40px', backgroundColor: 'white', color: '#333', fontFamily: 'sans-serif' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 'bold', borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>Historia Clínica Completa</h1>
                <h2 style={{ fontSize: '22px', fontWeight: 'bold' }}>{patient?.full_name}</h2>
                <p><strong>DNI:</strong> {patient?.document_id || 'No registrado'}</p>
                <p><strong>Fecha de Nacimiento:</strong> {patient?.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString('es-AR', { timeZone: 'UTC' }) : 'No registrada'}</p>
                {patient?.manual_note && (
                  <div style={{ marginTop: '10px', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Nota del Médico</h3>
                    <div style={{ whiteSpace: 'pre-wrap', fontSize: '14px' }}>
                      <MarkdownRenderer text={patient.manual_note} />
                    </div>
                  </div>
                )}
                <hr style={{ margin: '20px 0' }} />
                {consultations.map(consult => (
                  <div key={consult.id} style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', backgroundColor: '#f3f4f6', padding: '10px', borderRadius: '5px' }}>Consulta del {new Date(consult.created_at).toLocaleDateString('es-AR', { timeZone: 'UTC' })}</h3>
                    <div style={{ whiteSpace: 'pre-wrap', padding: '10px', fontSize: '14px' }}>
                      <MarkdownRenderer text={consult.formatted_notes?.note_content} /> {/* <-- Corregido 'consultation' a 'consult' */}
                    </div>
                  </div>
                ))}
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
                <div className="bg-base-100 rounded-xl shadow-soft border border-base-300 p-6">
                  <h2 className="text-xl font-bold text-text-primary mb-4">Nota del Médico</h2>
                  {isEditingNote ? (
                    <div className="space-y-2">
                      <textarea
                        className="w-full h-40 p-2 border border-base-300 rounded-md"
                        value={editedNote}
                        onChange={(e) => setEditedNote(e.target.value)}
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSaveNote}
                          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => { setIsEditingNote(false); setEditedNote(patient?.manual_note || ''); }}
                          className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      {profile?.id === patient?.user_id && (
                        <button
                          onClick={() => setIsEditingNote(true)}
                          className="absolute right-0 top-0 text-sm text-primary underline"
                        >
                          Editar
                        </button>
                      )}
                      <MarkdownRenderer text={patient?.manual_note || ''} />
                    </div>
                  )}
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
                          <div className="text-sm text-text-secondary truncate">
                            <MarkdownRenderer text={consultation.formatted_notes?.note_content} />
                          </div>
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