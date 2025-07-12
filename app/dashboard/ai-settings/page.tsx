'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Bot, FilePlus, Activity } from 'lucide-react'

interface Template {
  template_type: string;
  template_name: string;
  prompt_text: string;
}

export default function AISettingsPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [activeTab, setActiveTab] = useState('new_patient');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAdminAndFetchPrompts = async () => {
      // ... (código de verificación de admin, sin cambios)
      
      const { data, error } = await supabase
        .from('ai_prompt_template')
        .select('*');
      
      if (error) {
        setError('No se pudieron cargar las plantillas.');
      } else {
        setTemplates(data || []);
      }
      setLoading(false);
    }
    checkAdminAndFetchPrompts();
  }, [router]);

  const handlePromptChange = (text: string) => {
    setTemplates(currentTemplates => 
      currentTemplates.map(t => 
        t.template_type === activeTab ? { ...t, prompt_text: text } : t
      )
    );
  };

  const handleSavePrompt = async () => {
    const activeTemplate = templates.find(t => t.template_type === activeTab);
    if (!activeTemplate) return;
    
    setIsSaving(true);
    try {
      const response = await fetch('/api/update-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          templateType: activeTemplate.template_type, 
          newPrompt: activeTemplate.prompt_text 
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      alert('¡Plantilla guardada con éxito!');
    } catch (err: any) {
      alert('Error al guardar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const activeTemplateText = templates.find(t => t.template_type === activeTab)?.prompt_text || '';

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Cargando...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center space-x-2 text-blue-600 hover:underline">
            <ArrowLeft className="w-5 h-5" />
            <span>Volver al Panel</span>
          </Link>
          <button onClick={handleSavePrompt} disabled={isSaving} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400">
            <Save className="w-5 h-5" />
            <span>{isSaving ? 'Guardando...' : 'Guardar Plantilla'}</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
            <Bot className="w-8 h-8 mr-3 text-blue-600" />
            Configurar Plantillas de IA
          </h1>
          <p className="text-gray-500 mb-6">
            Define la estructura que la IA usará para generar las notas clínicas.
          </p>
          
          {/* Pestañas para seleccionar la plantilla */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {templates.map((template) => (
                <button
                  key={template.template_type}
                  onClick={() => setActiveTab(template.template_type)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === template.template_type
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {template.template_name}
                </button>
              ))}
            </nav>
          </div>
          
          {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}
          
          <textarea
            value={activeTemplateText}
            onChange={(e) => handlePromptChange(e.target.value)}
            className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Escribe aquí las instrucciones para la IA..."
          />
        </div>
      </main>
    </div>
  );
}
