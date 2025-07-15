'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, User, Calendar, FileText, Mic, Download, LogOut,
  LayoutDashboard, Settings, Users, Bell, LifeBuoy, Bot, Search 
} from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// --- Interfaces ---
interface Profile {
  id: string;
  full_name: string;
  role: string;
}
interface ConsultationDetail {
    id: string;
    created_at: string;
    transcription: string;
    formatted_notes: string;
    patients: {
      full_name: string;
      id: string;
    } | null;
}

// --- Componentes de UI Reutilizados ---
function Sidebar({ profile }: { profile: Profile | null }) {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex-col flex-shrink-0 hidden md:flex">
      <div className="h-20 flex items-center px-8">
        <h1 className="text-2xl font-bold text-blue-600">Sistema Médico</h1>
      </div>
      <nav className="flex-grow px-6">
        <ul className="space-y-2">
          <li><Link href="/dashboard" className="flex items-center p-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"><LayoutDashboard size={20} /><span className="ml-4">Panel Principal</span></Link></li>
          <li><Link href="/dashboard/all-consultations" className="flex items-center p-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"><Search size={20} /><span className="ml-4">Todas las Consultas</span></Link></li>
          {profile?.role === 'doctor' && (
            <>
              <li><Link href="/dashboard/manage-assistants" className="flex items-center p-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"><Users size={20} /><span className="ml-4">Gestionar Asistentes</span></Link></li>
              <li><Link href="/dashboard/ai-settings" className="flex items-center p-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"><Bot size={20} /><span className="ml-4">Plantilla de IA</span></Link></li>
            </>
          )}
        </ul>
      </nav>
      <div className="p-6 border-t border-gray-200">
        <a href="#" className="flex items-center p-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"><LifeBuoy size={20} /><span className="ml-4">Ayuda y Soporte</span></a>
        <a href="#" className="flex items-center p-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"><Settings size={20} /><span className="ml-4">Configuración</span></a>
      </div>
    </aside>
  );
}

function Header({ profile, onLogout }: { profile: Profile | null, onLogout: () => void }) {
    return (
      <header className="bg-gray-50/50 backdrop-blur-sm sticky top-0 z-10 py-4 px-6 md:py-6 md:px-8">
        <div className="flex items-center justify-end">
          <div className="flex items-center space-x-4 md:space-x-6">
            <button className="p-2 rounded-full hover:bg-gray-200"><Bell size={22} className="text-gray-600" /></button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">{profile?.full_name?.charAt(0) || 'U'}</div>
              <div className="hidden md:block">
                <p className="font-semibold text-gray-800">{profile?.full_name}</p>
                <p className="text-xs text-gray-500 capitalize">{profile?.role}</p>
              </div>
              <button onClick={onLogout} title="Cerrar Sesión" className="p-2 text-gray-500 hover:text-red-600"><LogOut size={20} /></button>
            </div>
          </div>
        </div>
      </header>
    )
}

export default function ConsultationDetailPage() {
  const [consultation, setConsultation] = useState<ConsultationDetail | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const params = useParams()
  const router = useRouter();
  const id = params.id as string;

  useEffect(() => {
    if (!id) return;

    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/');
          return;
        }

        const [profileRes, consultationRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user.id).single(),
          supabase.from('consultations').select(`*, patients!inner(id, full_name)`).eq('id', id).single()
        ]);

        if (profileRes.error) throw profileRes.error;
        if (consultationRes.error) throw consultationRes.error;
        
        setProfile(profileRes.data);
        setConsultation(consultationRes.data as ConsultationDetail);

      } catch (err) {
  // Mantenemos 'err' para poder usarlo
  if (err instanceof Error) {
    console.error("Error al cargar los datos:", err.message); // Usamos err.message
  }
  setError("No se pudieron cargar los datos de la consulta.");
} finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [id, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  }

  const handleDownloadPDF = () => {
    const input = document.getElementById('pdf-content');
    if (!input) {
        alert("Error: No se encontró el elemento para generar el PDF.");
        return;
    }

    setIsGeneratingPDF(true);
    
    html2canvas(input, { 
      scale: 2, 
      useCORS: true,
      // CAMBIO: Se aplica una solución más agresiva para garantizar la compatibilidad de colores.
      onclone: (clonedDoc) => {
        const content = clonedDoc.getElementById('pdf-content');
        if (content) {
          content.style.backgroundColor = 'white';
          const allElements = content.querySelectorAll('*');
          // Se recorren todos los elementos y se fuerza un color de texto seguro.
          allElements.forEach((el) => {
            (el as HTMLElement).style.color = '#000000';
          });
        }
      }
    })
      .then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        const imgWidth = pdfWidth;
        const imgHeight = pdfWidth / ratio;
        let height = imgHeight > pdfHeight ? pdfHeight : imgHeight;
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, height);
        pdf.save(`consulta-${consultation?.patients?.full_name}-${new Date(consultation!.created_at).toLocaleDateString()}.pdf`);
      })
      .catch(err => {
        console.error("Error detallado al generar el PDF:", err);
        alert("Hubo un error al generar el PDF. Por favor, revisa la consola del navegador para más detalles.");
      })
      .finally(() => {
        setIsGeneratingPDF(false);
      });
  };

  if (loading) {
    return <div className="h-screen bg-gray-50 flex items-center justify-center">Cargando...</div>
  }

  if (error || !consultation) {
    return <div className="h-screen bg-gray-50 flex items-center justify-center text-red-500">{error || "Consulta no encontrada."}</div>
  }

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      <Sidebar profile={profile} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header profile={profile} onLogout={handleLogout} />
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
                  <div className="bg-gray-50 p-4 rounded-md text-gray-800 whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {consultation.formatted_notes}
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
  )
}
