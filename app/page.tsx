'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image'; // Importa el componente Image de Next.js

// Importa los componentes de Shadcn UI
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Importa tu cliente de Supabase
import { supabase } from '@/lib/supabase';

export default function AuthenticationPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(''); // Estado para mensajes de error/éxito
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(''); // Limpia mensajes anteriores

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message); // Muestra el error en la UI
      } else {
        setMessage('¡Inicio de sesión exitoso! Redireccionando...');
        router.push('/dashboard'); // Redirecciona al dashboard
      }
    } catch (error) {
      console.error('Error inesperado durante el login:', error);
      setMessage('Error inesperado. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // Contenedor principal con grid para dividir la pantalla en dos columnas en pantallas grandes
    <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      {/* Panel izquierdo (visible solo en pantallas grandes) */}
      {/* Fondo con el color 'auth-background' y texto con 'text-primary' */}
      <div className="relative hidden h-full flex-col bg-auth-background p-10 text-primary dark:border-r lg:flex">
        {/* Contenido del panel izquierdo */}
        <div className="relative z-20 flex items-center text-lg font-medium">
          {/* Logo de la aplicación */}
          <Image
            src="/logo.png" // Ruta de tu logo
            alt="Logo Sistema Médico MVP"
            width={32} // Ajusta el ancho según sea necesario
            height={32} // Ajusta la altura según sea necesario
            className="mr-2 rounded-full" // Clases de Tailwind para el estilo del logo
          />
          Sistema Médico MVP
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;Este sistema ha simplificado drásticamente la gestión de pacientes y consultas, permitiéndonos enfocarnos en lo que realmente importa: la salud.&rdquo;
            </p>
            <footer className="text-sm">Dr. Juan Pérez</footer>
          </blockquote>
        </div>
      </div>

      {/* Panel derecho (formulario de login) */}
      <div className="lg:p-8 flex items-center justify-center bg-background">
        <Card className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <CardHeader className="flex flex-col space-y-2 text-center">
            <CardTitle className="text-2xl font-semibold tracking-tight">
              Inicia sesión
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Ingresa tus credenciales para acceder a tu cuenta.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <form onSubmit={handleLogin} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {message && (
                <p className={`text-sm text-center ${message.includes('éxito') ? 'text-green-500' : 'text-red-500'}`}>
                  {message}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Cargando...' : 'Iniciar sesión'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <div className="relative flex justify-center text-xs uppercase w-full">
              <span className="bg-background px-2 text-muted-foreground">
                O continúa con
              </span>
            </div>
            <Button variant="outline" className="w-full">
              Google
            </Button>
            <p className="px-8 text-center text-sm text-muted-foreground">
              ¿No tienes una cuenta?{' '}
              <Link
                href="/register" // Asegúrate de que esta ruta sea la correcta para tu página de registro
                className="underline underline-offset-4 hover:text-primary"
              >
                Regístrate
              </Link>
              .
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
