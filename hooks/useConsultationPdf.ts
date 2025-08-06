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
      const lineHeight = 6;
      const bulletIndent = 6;

      const addPageIfNeeded = () => {
        if (y > pageHeight - margin) {
          pdf.addPage();
          y = margin;
        }
      };

      const tokenize = (line: string) => {
        const segments = line.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
        const tokens: { text: string; bold: boolean }[] = [];
        for (const seg of segments) {
          const bold = seg.startsWith('**') && seg.endsWith('**');
          const text = bold ? seg.slice(2, -2) : seg;
          for (const part of text.split(/(\s+)/)) {
            if (part) tokens.push({ text: part, bold });
          }
        }
        return tokens;
      };

      const wrapTokens = (tokens: { text: string; bold: boolean }[], maxWidth: number) => {
        const lines: { text: string; bold: boolean }[][] = [];
        let current: { text: string; bold: boolean }[] = [];
        let width = 0;
        for (const token of tokens) {
          const w = pdf.getTextWidth(token.text);
          if (width + w > maxWidth && current.length) {
            lines.push(current);
            current = [token];
            width = w;
          } else {
            current.push(token);
            width += w;
          }
        }
        if (current.length) lines.push(current);
        return lines;
      };

      const printMarkdown = (text: string) => {
        const rawLines = text.split('\n');
        for (const raw of rawLines) {
          let line = raw;
          const trimmed = line.trim();
          if (!trimmed) {
            y += lineHeight;
            continue;
          }

          const isBullet = trimmed.startsWith('* ');
          if (isBullet) {
            line = trimmed.slice(2);
          }

          const tokens = tokenize(line);
          const maxWidth = pageWidth - margin * 2 - (isBullet ? bulletIndent : 0);
          const wrapped = wrapTokens(tokens, maxWidth);

          wrapped.forEach((tokenLine, index) => {
            addPageIfNeeded();
            let x = margin;
            if (isBullet) {
              if (index === 0) {
                pdf.setFont('helvetica', 'normal');
                pdf.text('\u2022', x, y);
              }
              x += bulletIndent;
            }

            for (const token of tokenLine) {
              pdf.setFont('helvetica', token.bold ? 'bold' : 'normal');
              pdf.text(token.text, x, y);
              x += pdf.getTextWidth(token.text);
            }

            y += lineHeight;
          });

          y += 2; // espacio entre líneas
        }
      };

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
      printMarkdown(notes);
      y += 4;

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

