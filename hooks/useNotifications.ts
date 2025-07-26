import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface Notification {
  id: string;
  message: string;
  read: boolean;
}

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const markAllAsRead = useCallback(() => {
    setNotifications(n => n.map(notif => ({ ...notif, read: true })));
  }, []);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('consultation_notifications')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'consultations', filter: `doctor_id=eq.${userId}` },
        payload => {
          const oldStatus = (payload as any).old?.status;
          const newStatus = (payload as any).new?.status;
          if (oldStatus === 'pending' && newStatus === 'completed') {
            setNotifications(n => [
              ...n,
              { id: (payload.new as any).id as string, message: 'La consulta ha sido procesada.', read: false }
            ]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { notifications, markAllAsRead };
}
