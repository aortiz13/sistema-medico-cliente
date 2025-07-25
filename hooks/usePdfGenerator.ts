import { useState, useCallback } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface UsePdfGeneratorReturn {
  isGeneratingPDF: boolean;
  generatePdf: (elementId: string, fileName: string, options?: PdfOptions) => Promise<void>;
}

interface PdfOptions {
  backgroundColor?: string;
  onClone?: (clonedDoc: Document) => void;
  scale?: number;
}

export function usePdfGenerator(): UsePdfGeneratorReturn {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const generatePdf = useCallback(async (
    elementId: string,
    fileName: string,
    options?: PdfOptions
  ) => {
    const input = document.getElementById(elementId);
    if (!input) {
      alert("Error: No se encontró el elemento para generar el PDF.");
      return;
    }

    setIsGeneratingPDF(true);

    try {
      const canvas = await html2canvas(input, {
        scale: options?.scale || 2, // Default scale to 2 for better quality
        useCORS: true,
        backgroundColor: options?.backgroundColor || '#ffffff',
        onclone: options?.onClone,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const imgHeight = (canvasHeight * pdfWidth) / canvasWidth;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      pdf.save(fileName);
    } catch (err) {
      console.error("Error detallado al generar el PDF:", err);
      alert("Hubo un error al generar el PDF. Por favor, revisa la consola del navegador para más detalles.");
    } finally {
      setIsGeneratingPDF(false);
    }
  }, []);

  return { isGeneratingPDF, generatePdf };
}