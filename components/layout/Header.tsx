'use client';

import * as React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Bell, LogOut, Search } from 'lucide-react';
import Link from 'next/link';

interface HeaderProps {
  title?: string;
  showSearch?: boolean;
}

export function Header({ title = "Panel Principal", showSearch = true }: HeaderProps) {
  const { profile, handleLogout } = useAuth();

  return (
    <header className="bg-base-100/80 backdrop-blur-sm sticky top-0 z-10 py-5 px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
        <div className="flex items-center space-x-5">
          {showSearch && (
            <div className="relative">
              <input type="text" placeholder="Buscar..." className="w-72 p-2.5 pl-10 border border-base-300 rounded-lg bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary" />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
            </div>
          )}
          <button className="relative p-2 text-text-secondary rounded-full hover:bg-base-200 hover:text-text-primary transition-colors">
            <Bell size={24} />
            <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-accent"></span>
          </button>
          <div className="flex items-center space-x-3 border-l border-base-300 pl-5">
            <Link href="/settings" className="flex items-center space-x-3 hover:underline">
              <div className="w-11 h-11 rounded-full bg-secondary text-white flex items-center justify-center font-bold text-lg">{profile?.full_name?.charAt(0) || 'U'}</div>
              <div className="text-left">
                <p className="font-bold text-text-primary">{profile?.full_name}</p>
                <p className="text-xs text-text-secondary capitalize">{profile?.role}</p>
              </div>
            </Link>
            <button onClick={handleLogout} title="Cerrar Sesión" className="p-2 text-text-secondary hover:text-accent transition-colors"><LogOut size={22} /></button>
          </div>
        </div>
      </div>
    </header>
  );
}