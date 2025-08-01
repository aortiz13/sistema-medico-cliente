import * as React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}

export function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  return (
    <div className="bg-card p-6 rounded-xl border border-base-300 shadow-soft flex items-center space-x-5">
      <div className={`p-4 rounded-lg ${color}`}><Icon size={28} className="text-white" /></div>
      <div>
        <p className="text-sm font-semibold text-text-secondary">{title}</p>
        <p className="text-3xl font-bold text-text-primary">{value}</p>
      </div>
    </div>
  );
}