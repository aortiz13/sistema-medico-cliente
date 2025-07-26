'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/Header'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default function SettingsPage() {
  const { user, profile, loading } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (profile) {
      const parts = profile.full_name.split(' ')
      setFirstName(parts[0] || '')
      setLastName(parts.slice(1).join(' ') || '')
    }
    if (user) {
      setEmail(user.email || '')
    }
  }, [user, profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      if (email && email !== user?.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email })
        if (emailError) throw emailError
      }

      if (password) {
        const { error: passError } = await supabase.auth.updateUser({ password })
        if (passError) throw passError
      }

      const fullName = `${firstName} ${lastName}`.trim()
      if (fullName && fullName !== profile?.full_name) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ full_name: fullName })
          .eq('id', user?.id)
        if (profileError) throw profileError
      }

      setMessage('Datos actualizados correctamente')
      setPassword('')
    } catch (err) {
      if (err instanceof Error) setError(err.message)
      else setError('Ocurrió un error inesperado')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="h-screen bg-base-200 flex items-center justify-center">Cargando...</div>
  }

  return (
    <div className="h-screen flex bg-base-200 overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Mi Cuenta" showSearch={false} />
        <main className="flex-1 p-8 overflow-y-auto">
          <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-4 bg-base-100 p-6 rounded-lg shadow-soft border border-base-300">
            <div>
              <Label htmlFor="firstName">Nombre</Label>
              <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="lastName">Apellido</Label>
              <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="password">Nueva contraseña</Label>
              <Input id="password" type="password" value={password} placeholder="••••••••" onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            {message && <p className="text-green-600 text-sm">{message}</p>}
            <Button type="submit" disabled={saving} className="w-full">
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </form>
        </main>
      </div>
    </div>
  )
}