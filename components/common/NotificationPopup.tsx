import * as React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface NotificationPopupProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export function NotificationPopup({ message, type, onClose }: NotificationPopupProps) {
  const isSuccess = type === 'success';
  const bgColor = isSuccess ? 'bg-green-100' : 'bg-red-100';
  const textColor = isSuccess ? 'text-success' : 'text-accent';
  const Icon = isSuccess ? CheckCircle : AlertCircle;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-base-100 p-8 rounded-xl shadow-2xl w-full max-w-sm text-center">
        <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full ${bgColor} mb-4`}>
          <Icon className={`h-8 w-8 ${textColor}`} />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">
          {isSuccess ? 'Éxito' : 'Error'}
        </h2>
        <p className="text-text-secondary mb-6">{message}</p>
        <button
          onClick={onClose}
          className="w-full px-6 py-2.5 rounded-lg text-white bg-primary hover:bg-primary-dark font-semibold transition-colors"
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}