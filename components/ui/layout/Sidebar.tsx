import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Users, Bot, LayoutDashboard, Settings, LifeBuoy, Search
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
      <Link href={href} className={`flex items-center p-3 rounded-lg transition-all duration-200 ${isActive ? 'bg-primary text-white shadow-soft' : 'text-text-secondary hover:bg-base-200 hover:text-text-primary'}`}>
        <Icon size={22} /><span className="ml-4 font-semibold">{children}</span>
      </Link>
    </li>
  );
}

export function Sidebar({ profile }: { profile: Profile | null }) {
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
            <>
              <NavLink href="/dashboard/manage-assistants" icon={Users}>Asistentes</NavLink>
              {/* Se asume que 'ai-settings' también es solo para doctores */}
              <NavLink href="/dashboard/ai-settings" icon={Bot}>Plantilla IA</NavLink>
            </>
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