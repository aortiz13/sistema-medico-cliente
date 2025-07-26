'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Mic, Download } from 'lucide-react';
import { MarkdownRenderer } from '@/components/common/MarkdownRenderer';
import { useAuth } from '@/hooks/useAuth';
import { useConsultations } from '@/hooks/useConsultations';
import { usePdfGenerator } from '@/hooks/usePdfGenerator';
import jsPDF from 'jspdf';
import { Consultation } from '@/types';

export default function ConsultationDetailPage() {
  const { profile, loading: loadingAuth } = useAuth();
  // ¡CORRECCIÓN CLAVE! -> Se añade updateConsultationNotes aquí
  const { loadConsultationById, loadingConsultations, updateConsultationNotes } = useConsultations();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');
  const [saving, setSaving] = useState(false);
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

  const handleDownloadPDF = () => {
    if (!consultation) return;
    setIsGeneratingPDF(true);
    const patientName = consultation.patients?.full_name || 'desconocido';
    const consultationDate = new Date(consultation.created_at).toLocaleDateString();
    const fileName = `consulta-${patientName}-${consultationDate}.pdf`;

    const doc = new jsPDF();
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = margin;

    doc.setFontSize(16);
    doc.text(`Consulta de ${patientName}`, margin, y);
    y += 8;
    doc.setFontSize(12);
    doc.text(`Fecha: ${new Date(consultation.created_at).toLocaleString('es-AR')}`, margin, y);
    y += 6;
    doc.text(`Médico: ${consultation.profiles?.full_name || 'N/A'}`, margin, y);
    y += 10;

    const notesText = (consultation.formatted_notes?.note_content || '').replace(/\*\*/g, '');
    const lines = doc.splitTextToSize(notesText, pageWidth - margin * 2);
    const lineHeight = 7;
    // Se añade el tipo 'string' a 'line' para solucionar el error de TypeScript
    lines.forEach((line: string) => {
      if (y + lineHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += lineHeight;
    });

    doc.save(fileName);
    setIsGeneratingPDF(false);
  };

  const handleSaveNotes = async () => {
    if (!consultation) return;
    setSaving(true);
    const success = await updateConsultationNotes(consultation.id, editedNotes);
    if (success) {
      setConsultation(prev => prev ? { ...prev, formatted_notes: { note_content: editedNotes } } : null);
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
      {/* ... Tu código JSX (sin cambios) ... */}
    </div>
  );
}