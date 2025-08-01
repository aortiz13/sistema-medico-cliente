'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { LockKeyhole } from 'lucide-react'

export default function SetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isSessionReady, setIsSessionReady] = useState(false)
  const router = useRouter()

  // --- HOOK useEffect MEJORADO ---
  useEffect(() => {
    // Función asíncrona para poder usar await dentro del useEffect
    const checkSessionAndSubscribe = async () => {
      // 1. Preguntamos activamente si ya hay una sesión.
      // Supabase lee los tokens de la URL y crea la sesión automáticamente.
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log("Sesión detectada, mostrando formulario.");
        setIsSessionReady(true);
      }

      // 2. Nos suscribimos a cualquier cambio futuro en la autenticación.
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          console.log("Evento SIGNED_IN recibido.");
          setIsSessionReady(true);
        } else if (event === 'SIGNED_OUT') {
          setError("El enlace de invitación ha expirado o no es válido. Por favor, solicita una nueva invitación.");
          setIsSessionReady(false);
        }
      });

      // Función de limpieza para desuscribirse cuando el componente se desmonte
      return () => {
        subscription?.unsubscribe();
      };
    };

    checkSessionAndSubscribe();
  }, []);
  // ---------------------------------

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    setError(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        throw error
      }
      
      setMessage('¡Contraseña establecida con éxito! Serás redirigido al panel de control.')
      setTimeout(() => {
        router.push('/dashboard')
      }, 3000)

    } catch (err) {
      if (err instanceof Error) {
        setError('Error al establecer la contraseña: ' + err.message)
      } else {
        setError('Ocurrió un error inesperado.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-center mb-6">
            <LockKeyhole className="w-12 h-12 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-center mb-2 text-blue-600">
          Establecer Contraseña
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Crea una contraseña para acceder a tu cuenta.
        </p>
        
        {!isSessionReady && !error && (
            <p className="text-center text-gray-600 animate-pulse">Verificando invitación...</p>
        )}

        {isSessionReady && (
            <form onSubmit={handleSetPassword} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                Nueva Contraseña
                </label>
                <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Contraseña
                </label>
                <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                />
            </div>

            <button
                type="submit"
                disabled={loading || !!message}
                className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
                {loading ? 'Guardando...' : 'Guardar Contraseña'}
            </button>
            </form>
        )}

        {error && (
          <div className="mt-4 text-center text-red-600 bg-red-100 p-3 rounded-md">
            {error}
          </div>
        )}
        {message && (
          <div className="mt-4 text-center text-green-600 bg-green-100 p-3 rounded-md">
            {message}
          </div>
        )}
      </div>
    </div>
  )
}