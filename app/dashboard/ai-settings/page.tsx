'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Bot } from 'lucide-react'

export default function AISettingsPage() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAdminAndFetchPrompt = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role !== 'doctor') {
        router.push('/dashboard');
        return;
      }
      
      const { data: templateData, error: templateError } = await supabase
        .from('ai_prompt_template')
        .select('prompt_text')
        .eq('id', 1)
        .single();
      
      if (templateError) {
        setError('No se pudo cargar la plantilla.');
      } else {
        setPrompt(templateData.prompt_text);
      }
      setLoading(false);
    }
    checkAdminAndFetchPrompt();
  }, [router]);

  const handleSavePrompt = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/update-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPrompt: prompt }),
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
          <button
            onClick={handleSavePrompt}
            disabled={isSaving}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            <Save className="w-5 h-5" />
            <span>{isSaving ? 'Guardando...' : 'Guardar Plantilla'}</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
            <Bot className="w-8 h-8 mr-3 text-blue-600" />
            Configurar Plantilla de la IA
          </h1>
          <p className="text-gray-500 mb-6">
            Modifica las instrucciones que sigue la inteligencia artificial para estructurar las notas de las consultas.
            Este formato se aplicará para todos los usuarios.
          </p>
          
          {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}
          
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Escribe aquí las instrucciones para la IA..."
          />
        </div>
      </main>
    </div>
  );
}