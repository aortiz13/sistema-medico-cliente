import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface DashboardStats {
  totalPatients: number;
  consultationsToday: number;
  newPatientsThisMonth: number;
  loading: boolean;
}

export function useDashboardStats(): DashboardStats {
  const [totalPatients, setTotalPatients] = useState(0);
  const [consultationsToday, setConsultationsToday] = useState(0);
  const [newPatientsThisMonth, setNewPatientsThisMonth] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

        const { count: totalPatientsCount } = await supabase
          .from('patients')
          .select('*', { count: 'exact', head: true });

        const { count: consultationsTodayCount } = await supabase
          .from('consultations')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startOfToday);

        const { count: newPatientsThisMonthCount } = await supabase
          .from('patients')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startOfMonth);

        setTotalPatients(totalPatientsCount || 0);
        setConsultationsToday(consultationsTodayCount || 0);
        setNewPatientsThisMonth(newPatientsThisMonthCount || 0);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { totalPatients, consultationsToday, newPatientsThisMonth, loading };
}