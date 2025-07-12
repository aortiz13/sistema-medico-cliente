'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
// CAMBIO: Se eliminó 'useRouter' porque no se usaba.
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, FileText, Mic } from 'lucide-react'

// Definimos un tipo más completo para la consulta
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
  const params = useParams()
  const id = params.id as string;

  useEffect(() => {
    if (id) {
      const fetchConsultation = async () => {
        try {
          const { data, error } = await supabase
            .from('consultations')
            .select(`
              *,
              patients (full_name)
            `)
            .eq('id', id)
            .single()

          if (error) {
            throw error
          }

          if (data) {
            setConsultation(data)
          } else {
            setError('No se encontró la consulta.')
          }
        // CAMBIO: Se tipó el error de forma segura en lugar de 'any'.
        } catch (err) { 
          if (err instanceof Error) {
            setError('Error al cargar la consulta: ' + err.message)
          } else {
            setError('Ocurrió un error desconocido.')
          }
        } finally {
          setLoading(false)
        }
      }
      fetchConsultation()
    }
  }, [id])

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
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/dashboard" className="flex items-center space-x-2 text-blue-600 hover:underline">
            <ArrowLeft className="w-5 h-5" />
            <span>Volver al Panel</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          {/* Encabezado de la Consulta */}
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

          {/* Notas Clínicas Formateadas */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-3 flex items-center text-gray-700">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              Notas Clínicas (Generadas por IA)
            </h2>
            <div className="bg-blue-50 p-4 rounded-md text-gray-800 whitespace-pre-wrap font-mono text-sm leading-relaxed">
              {consultation.formatted_notes}
            </div>
          </div>

          {/* Transcripción Original */}
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