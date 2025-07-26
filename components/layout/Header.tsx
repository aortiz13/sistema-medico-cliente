'use client';

import * as React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Bell, LogOut, Search } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

interface HeaderProps {
  title?: string;
  showSearch?: boolean;
}

export function Header({ title = "Panel Principal", showSearch = true }: HeaderProps) {
  const { profile, handleLogout } = useAuth();
  const { notifications, markAllAsRead } = useNotifications(profile?.id);
  const [open, setOpen] = React.useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

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
          <div className="relative">
            <button
              onClick={() => { setOpen(o => !o); if (!open) markAllAsRead(); }}
              className="relative p-2 text-text-secondary rounded-full hover:bg-base-200 hover:text-text-primary transition-colors"
            >
              <Bell size={24} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-accent"></span>
              )}
            </button>
            {open && (
              <div className="absolute right-0 mt-2 w-72 bg-base-100 border border-base-300 rounded-lg shadow-lg z-20">
                {notifications.length === 0 ? (
                  <p className="p-4 text-sm text-text-secondary">No hay notificaciones.</p>
                ) : (
                  <ul className="max-h-60 overflow-y-auto">
                    {notifications.map(n => (
                      <li key={n.id} className="p-4 border-b border-base-300 last:border-0 text-sm text-text-primary">
                        {n.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3 border-l border-base-300 pl-5">
            <Link href="/settings" className="flex items-center space-x-3 hover:underline">
              {profile?.avatar_url ? (
                <Image
                  src={supabase.storage.from('avatars').getPublicUrl(profile.avatar_url).data.publicUrl}
                  alt="Avatar"
                  width={44}
                  height={44}
                  className="w-11 h-11 rounded-full object-cover"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-secondary text-white flex items-center justify-center font-bold text-lg">{profile?.full_name?.charAt(0) || 'U'}</div>
              )}
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