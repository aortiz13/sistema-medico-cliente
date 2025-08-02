'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/Header'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createClient } from '@supabase/supabase-js'

export default function SettingsPage() {
  const { user, profile, loading } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  useEffect(() => {
    if (profile) {
      const parts = profile.full_name.split(' ')
      setFirstName(parts[0] || '')
      setLastName(parts.slice(1).join(' ') || '')
      if (profile.avatar_url) {
        const { data } = supabase.storage.from('avatars').getPublicUrl(profile.avatar_url)
        setAvatarPreview(data.publicUrl)
      }
    }
    if (user) {
      setEmail(user.email || '')
    }
  }, [user, profile])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setAvatarFile(file)
    if (file) {
      setAvatarPreview(URL.createObjectURL(file))
    }
  }
const handlePasswordReset = async () => {
    if (!user?.email) return
    setSaving(true)
    setError(null)
    setMessage(null)

    // --- INICIO DE LA CORRECCIÓN ---
    // Creamos un cliente de Supabase temporal que USA la API key anónima
    // de forma garantizada, ignorando la sesión de usuario activa.
    const supabasePublicClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Usamos el cliente temporal para llamar a la función de reseteo.
    const { error: passError } = await supabasePublicClient.auth.resetPasswordForEmail(
      user.email,
      { redirectTo: `${window.location.origin}/set-password` }
    )
    // --- FIN DE LA CORRECCIÓN ---

    if (passError) {
        // Si hay un error, lo mostramos.
        setError(passError.message)
    } else {
        // Si todo sale bien, mostramos el mensaje de éxito.
        setMessage('Revisa tu correo para cambiar la contraseña')
    }
    setSaving(false)
}

  const handleDeleteAvatar = async () => {
    if (!profile?.avatar_url) return
    setSaving(true)
    setError(null)
    setMessage(null)
    const { error: removeError } = await supabase.storage
      .from('avatars')
      .remove([profile.avatar_url])
    if (removeError) {
      setError(removeError.message)
    } else {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user?.id)
      if (profileError) setError(profileError.message)
      else {
        setAvatarPreview(null)
        setMessage('Foto de perfil eliminada')
      }
    }
    setSaving(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setMessage(null)

    try {

      const fullName = `${firstName} ${lastName}`.trim()
      if (fullName && fullName !== profile?.full_name) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ full_name: fullName })
          .eq('id', user?.id)
        if (profileError) throw profileError
      }

      if (avatarFile) {
        const filePath = `${user?.id}/${Date.now()}_${avatarFile.name}`
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: true })
        if (uploadError) throw uploadError

        const { error: avatarUpdateError } = await supabase
          .from('profiles')
          .update({ avatar_url: filePath })
          .eq('id', user?.id)
        if (avatarUpdateError) throw avatarUpdateError

        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
        setAvatarPreview(data.publicUrl)
      }

      setMessage('Datos actualizados correctamente')
      setAvatarFile(null)
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
           <Input id="email" type="email" value={email} disabled />
            </div>
            <div>
              <Label htmlFor="avatar">Foto de Perfil</Label>
              <Input id="avatar" type="file" accept="image/*" onChange={handleAvatarChange} />
              {avatarPreview && (
                <img src={avatarPreview} alt="Vista previa" className="mt-2 w-24 h-24 rounded-full object-cover" />
              )}
              {profile?.avatar_url && (
                <Button type="button" variant="secondary" onClick={handleDeleteAvatar} className="mt-2">
                  Eliminar Foto de Perfil
                </Button>
              )}
            </div>
            <div>
              <Button type="button" onClick={handlePasswordReset} className="w-full" variant="outline">
                Cambiar Contraseña
              </Button>
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