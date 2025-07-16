// components/Sidebar.tsx
import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Users, Bot, LayoutDashboard, Settings, LifeBuoy, Search, Stethoscope // Asegúrate de que Stethoscope esté importado
} from 'lucide-react';

interface Profile {
  id: string;
  full_name: string;
  role: string;
}

interface NavLinkProps {
  href: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

function NavLink({ href, icon: Icon, children }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <li>
      <Link
        href={href}
        // Clases de Tailwind para el estilo minimalista y limpio
        className={`flex items-center p-2 rounded-md transition-all duration-200 
          ${isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-accent hover:text-accent-foreground'}`
        }
      >
        <Icon size={22} /><span className="ml-4 font-semibold">{children}</span>
      </Link>
    </li>
  );
}

export function Sidebar({ profile }: { profile: Profile | null }) {
  return (
    // Sidebar principal con estilos de la opción 1
    <aside className="w-64 bg-secondary text-foreground border-r border-border h-screen p-4 flex flex-col shadow-sm flex-shrink-0 hidden md:flex">
      {/* Logo y nombre de la aplicación */}
      <div className="h-24 flex items-center px-2 mb-6"> {/* Ajustado padding y añadido mb-6 */}
        <div className="relative flex items-center"> {/* Contenedor para el logo y texto */}
          <Image
            src="/logo.png"
            alt="Logo del Sistema Médico"
            width={40} // Tamaño fijo para el logo
            height={40} // Tamaño fijo para el logo
            className="mr-3 rounded-full" // Clases de Tailwind para el estilo del logo
            onError={(e) => e.currentTarget.src = 'https://placehold.co/40x40/39B6E3/FFFFFF?text=Logo'} // Fallback para el logo
          />
          <span className="font-semibold text-xl">MedSys MVP</span>
        </div>
      </div>
      <nav className="flex-grow px-2"> {/* Ajustado padding */}
        <ul className="space-y-2">
          <NavLink href="/dashboard" icon={LayoutDashboard}>Panel Principal</NavLink>
          <NavLink href="/dashboard/all-consultations" icon={Stethoscope}>Consultas</NavLink> {/* Usando Stethoscope para consultas */}
          {profile?.role === 'doctor' && (
            <>
              <NavLink href="/dashboard/manage-assistants" icon={Users}>Asistentes</NavLink>
              {/* <NavLink href="/dashboard/ai-settings" icon={Bot}>Ajustes IA</NavLink> */} {/* Ejemplo si tienes esta ruta */}
            </>
          )}
        </ul>
      </nav>
      <div className="p-2 border-t border-border pt-4"> {/* Ajustado padding y borde */}
        <Link href="/help" className="flex items-center p-2 rounded-lg text-foreground hover:bg-accent hover:text-accent-foreground">
          <LifeBuoy size={22} /><span className="ml-4 font-semibold">Ayuda</span>
        </Link>
        <Link href="/settings" className="flex items-center p-2 rounded-lg text-foreground hover:bg-accent hover:text-accent-foreground">
          <Settings size={22} /><span className="ml-4 font-semibold">Configuración</span>
        </Link>
        {/* Aquí puedes añadir el botón de cerrar sesión si lo deseas */}
        {/* <button
          onClick={() => { /* Lógica para cerrar sesión * / }}
          className="flex items-center p-2 rounded-md hover:bg-accent transition-colors w-full text-left text-foreground"
        >
          <LogOut size={22} /><span className="ml-4 font-semibold">Cerrar Sesión</span>
        </button> */}
      </div>
    </aside>
  );
}