import { useState } from 'react';
import jsPDF from 'jspdf';
import { Consultation } from '@/types';

interface UseConsultationPdfReturn {
  isGeneratingPDF: boolean;
  generatePdf: (consultation: Consultation, fileName: string) => Promise<void>;
}

export function useConsultationPdf(): UseConsultationPdfReturn {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const generatePdf = async (consultation: Consultation, fileName: string) => {
    setIsGeneratingPDF(true);
    try {
      const pdf = new jsPDF();
      const margin = 20;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let y = margin;

      pdf.setFontSize(16);
      pdf.text('Detalle de la Consulta', pageWidth / 2, y, { align: 'center' });
      y += 10;

      pdf.setFontSize(12);
      pdf.text(`Paciente: ${consultation.patients?.full_name || 'Desconocido'}`, margin, y);
      y += 6;
      pdf.text(`Médico: ${consultation.profiles?.full_name || 'N/A'}`, margin, y);
      y += 6;
      const date = new Date(consultation.created_at).toLocaleDateString();
      pdf.text(`Fecha: ${date}`, margin, y);
      y += 10;

      pdf.setFontSize(14);
      pdf.text('Notas Clínicas', margin, y);
      y += 8;

      pdf.setFontSize(12);
      const notes = consultation.formatted_notes?.note_content || '';
      const lines = pdf.splitTextToSize(notes, pageWidth - margin * 2);
      pdf.text(lines, margin, y);
      y += lines.length * 6 + 10;

      if (consultation.images && consultation.images.length > 0) {
        for (const url of consultation.images) {
          const imgData = await fetchImageAsDataURL(url);
          const imgProps = pdf.getImageProperties(imgData);
          const maxWidth = pageWidth - margin * 2;
          const ratio = maxWidth / imgProps.width;
          const imgHeight = imgProps.height * ratio;
          if (y + imgHeight > pageHeight - margin) {
            pdf.addPage();
            y = margin;
          }
          pdf.addImage(imgData, 'PNG', margin, y, maxWidth, imgHeight);
          y += imgHeight + 10;
        }
      }

      pdf.save(fileName);
    } catch (error) {
      console.error('Error generando el PDF de consulta:', error);
      alert('Hubo un error al generar el PDF.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return { isGeneratingPDF, generatePdf };
}

async function fetchImageAsDataURL(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

