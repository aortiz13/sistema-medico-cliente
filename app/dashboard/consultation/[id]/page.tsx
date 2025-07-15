'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
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
interface FormattedNote {
  note_content: string;
}
interface ConsultationDetail {
    id: string;
    created_at: string;
    transcription: string;
    formatted_notes: FormattedNote | null; // Usar el tipo específico
    patients: {
      full_name: string;
      id: string;
    } | null;
}

// --- Componentes de UI Reutilizados ---
function Sidebar({ profile }: { profile: Profile | null }) {
    const NavLink = ({ href, icon: Icon, children }: { href: string, icon: React.ElementType, children: React.ReactNode }) => {
    const pathname = usePathname();
    const isActive = pathname === href;
    return (
      <li>
        <Link href={href} className={`flex items-center p-3 rounded-lg transition-all duration-200 ${isActive ? 'bg-primary text-white shadow-soft' : 'text-text-secondary hover:bg-base-200 hover:text-text-primary'}`}>
          <Icon size={22} /><span className="ml-4 font-semibold">{children}</span>
        </Link>
      </li>
    );
  };
  return (
    <aside className="w-64 bg-base-100 border-r border-base-300 flex-col flex-shrink-0 hidden md:flex">
      <div className="h-24 flex items-center justify-center px-6">
        <div className="relative w-40 h-12">
          <Image src="/logo.png" alt="Logo del Sistema Médico" fill style={{ objectFit: "contain" }} onError={(e) => e.currentTarget.src = 'https://placehold.co/160x48/39B6E3/FFFFFF?text=Logo'}/>
        </div>
      </div>
      <nav className="flex-grow px-4">
        <ul className="space-y-2">
          <NavLink href="/dashboard" icon={LayoutDashboard}>Panel Principal</NavLink>
          <NavLink href="/dashboard/all-consultations" icon={Search}>Consultas</NavLink>
          {profile?.role === 'doctor' && (
            <NavLink href="/dashboard/manage-assistants" icon={Users}>Asistentes</NavLink>
          )}
        </ul>
      </nav>
      <div className="p-4 border-t border-base-300">
        <a href="#" className="flex items-center p-3 rounded-lg text-text-secondary hover:bg-base-200"><LifeBuoy size={22} /><span className="ml-4 font-semibold">Ayuda</span></a>
        <a href="#" className="flex items-center p-3 rounded-lg text-text-secondary hover:bg-base-200"><Settings size={22} /><span className="ml-4 font-semibold">Configuración</span></a>
      </div>
    </aside>
  );
}

function Header({ profile, onLogout }: { profile: Profile | null, onLogout: () => void }) {
    return (
      <header className="bg-base-100/80 backdrop-blur-sm sticky top-0 z-10 py-5 px-8">
        <div className="flex items-center justify-end">
          <div className="flex items-center space-x-5">
            <button className="relative p-2 text-text-secondary rounded-full hover:bg-base-200 hover:text-text-primary transition-colors">
              <Bell size={24} />
              <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-accent"></span>
            </button>
            <div className="flex items-center space-x-3 border-l border-base-300 pl-5">
              <div className="w-11 h-11 rounded-full bg-secondary text-white flex items-center justify-center font-bold text-lg">{profile?.full_name?.charAt(0) || 'U'}</div>
              <div>
                <p className="font-bold text-text-primary">{profile?.full_name}</p>
                <p className="text-xs text-text-secondary capitalize">{profile?.role}</p>
              </div>
              <button onClick={onLogout} title="Cerrar Sesión" className="p-2 text-text-secondary hover:text-accent transition-colors"><LogOut size={22} /></button>
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
        if (err instanceof Error) {
          console.error("Error al cargar los datos:", err.message);
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
      backgroundColor: '#ffffff',
      onclone: (clonedDoc) => {
        const content = clonedDoc.getElementById('pdf-content');
        if (content) {
          content.style.backgroundColor = 'white';
          const allElements = content.querySelectorAll('*');
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
        const imgHeight = pdfWidth / ratio;
        let height = imgHeight;
        let position = 0;

        if (imgHeight > pdfHeight) {
          height = pdfHeight;
        }

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, height);
        let heightLeft = imgHeight - height;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
          heightLeft -= pdfHeight;
        }
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
                    {/* CORRECCIÓN: Se accede a la propiedad .note_content */}
                    {consultation.formatted_notes?.note_content || 'Nota no disponible.'}
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