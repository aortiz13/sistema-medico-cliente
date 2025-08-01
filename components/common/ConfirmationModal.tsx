import * as React from 'react';
import { ShieldAlert } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmButtonText?: string;
  cancelButtonText?: string;
  isConfirming?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = 'Sí, eliminar',
  cancelButtonText = 'Cancelar',
  isConfirming = false,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-card p-8 rounded-xl shadow-2xl w-full max-w-md text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
          <ShieldAlert className="h-8 w-8 text-accent" />
        </div>
        <h2 className="text-2xl font-bold my-2 text-foreground">{title}</h2>
        <p className="text-muted-foreground mb-6">{message}</p>
        <div className="flex justify-center space-x-4">
          <button onClick={onClose} disabled={isConfirming} className="px-6 py-2.5 rounded-lg text-text-primary bg-base-200 hover:bg-base-300 font-semibold">
            {cancelButtonText}
          </button>
          <button onClick={onConfirm} disabled={isConfirming} className="px-6 py-2.5 rounded-lg text-white bg-accent hover:opacity-90 disabled:opacity-50 font-semibold">
            {isConfirming ? 'Procesando...' : confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
}