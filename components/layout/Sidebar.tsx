// components/layout/Sidebar.tsx
'use client'; // <--- ¡Añade esta línea aquí!

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Users, Bot, LayoutDashboard, Settings, LifeBuoy, Search, Stethoscope
} from 'lucide-react';

interface Profile {
  id: string;
  full_name: string;
  role: string;
  avatar_url?: string | null;
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
    <aside className="hidden md:flex w-64 flex-shrink-0 flex-col h-screen p-4 bg-card text-foreground border border-border rounded-lg shadow-md">
      <div className="h-24 flex items-center px-2 mb-6">
        <div className="relative flex items-center">
          <Image
            src="/logo.png"
            alt="Logo del Sistema Médico"
            width={40}
            height={40}
            className="mr-3 rounded-full"
            onError={(e) => e.currentTarget.src = 'https://placehold.co/40x40/39B6E3/FFFFFF?text=Logo'}
          />
          <span className="font-semibold text-xl">MedSys MVP</span>
        </div>
      </div>
      <nav className="flex-grow px-2">
        <ul className="space-y-2">
          <NavLink href="/dashboard" icon={LayoutDashboard}>Panel Principal</NavLink>
          <NavLink href="/dashboard/all-consultations" icon={Stethoscope}>Consultas</NavLink>
          {profile?.role === 'doctor' && (
            <>
              <NavLink href="/dashboard/manage-assistants" icon={Users}>Asistentes</NavLink>
            </>
          )}
        </ul>
      </nav>
      <div className="p-2 border-t border-border pt-4">
        <Link href="/help" className="flex items-center p-2 rounded-lg text-foreground hover:bg-accent hover:text-accent-foreground">
          <LifeBuoy size={22} /><span className="ml-4 font-semibold">Ayuda</span>
        </Link>
        <Link href="/settings" className="flex items-center p-2 rounded-lg text-foreground hover:bg-accent hover:text-accent-foreground">
          <Settings size={22} /><span className="ml-4 font-semibold">Configuración</span>
        </Link>
      </div>
    </aside>
  );
}
