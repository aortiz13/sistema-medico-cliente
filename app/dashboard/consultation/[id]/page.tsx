'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, FileText, Mic, Download } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface ConsultationDetail {
    id: string;
    created_at: string;
    transcription: string;
    formatted_notes: string;
    patients: {
      full_name: string;
    } | null;
}

export default function ConsultationDetailPage() {
  const [consultation, setConsultation] = useState<ConsultationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  const params = useParams()
  const id = params.id as string;

  useEffect(() => {
    if (id) {
      const fetchConsultation = async () => {
        try {
          const { data, error } = await supabase
            .from('consultations')
            .select(`*, patients (full_name)`)
            .eq('id', id)
            .single()

          if (error) throw error
          if (data) setConsultation(data)
          else setError('No se encontró la consulta.')
          
        } catch (err) { 
          if (err instanceof Error) setError('Error al cargar la consulta: ' + err.message)
          else setError('Ocurrió un error desconocido.')
        } finally {
          setLoading(false)
        }
      }
      fetchConsultation()
    }
  }, [id])
  
  const handleDownloadPDF = () => {
    const input = document.getElementById('pdf-content');
    if (!input) {
      alert("Error: No se encontró el contenido para generar el PDF.");
      return;
    }

    setIsGeneratingPDF(true);

    html2canvas(input, { 
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff' // <-- AÑADE ESTA LÍNEA
    })
    .then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / canvasHeight;
      const imgWidth = pdfWidth;
      const imgHeight = pdfWidth / ratio;
      
      let height = imgHeight;
      if (imgHeight > pdfHeight) {
        height = pdfHeight;
      }
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, height);
      pdf.save(`consulta-${consultation?.patients?.full_name}-${new Date(consultation!.created_at).toLocaleDateString()}.pdf`);
    })
    .catch(err => {
      console.error("Error al generar el PDF:", err);
      alert("Hubo un error al generar el PDF. Revisa la consola para más detalles.");
    })
    .finally(() => {
      setIsGeneratingPDF(false);
    });
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Cargando detalle de la consulta...</div>
  }

  if (error) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center text-red-500">{error}</div>
  }

  if (!consultation) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Consulta no encontrada.</div>
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center space-x-2 text-blue-600 hover:underline">
            <ArrowLeft className="w-5 h-5" />
            <span>Volver al Panel</span>
          </Link>
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            <Download className="w-5 h-5" />
            <span>{isGeneratingPDF ? 'Generando...' : 'Descargar PDF'}</span>
          </button>
        </div>
      </header>

      <main id="pdf-content" className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          <div className="border-b pb-4 mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Detalle de la Consulta</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>{consultation.patients?.full_name || 'Paciente desconocido'}</span>
              </div>
              <span>|</span>
              <span>{new Date(consultation.created_at).toLocaleString('es-AR')}</span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-3 flex items-center text-gray-700">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              Notas Clínicas (Generadas por IA)
            </h2>
            <div className="bg-blue-50 p-4 rounded-md text-gray-800 whitespace-pre-wrap font-mono text-sm leading-relaxed">
              {consultation.formatted_notes}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-3 flex items-center text-gray-700">
              <Mic className="w-5 h-5 mr-2 text-blue-600" />
              Transcripción del Audio
            </h2>
            <div className="bg-gray-100 p-4 rounded-md text-gray-600 border italic text-sm">
              {consultation.transcription}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}