// components/common/AudioPlayerModal.tsx
import * as React from 'react';
import { X, Music } from 'lucide-react';

interface AudioPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  audioUrl: string | null;
  title?: string;
}

export function AudioPlayerModal({
  isOpen,
  onClose,
  audioUrl,
  title = 'Reproducir Grabación'
}: AudioPlayerModalProps) {
  if (!isOpen || !audioUrl) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-card p-8 rounded-xl shadow-2xl w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={24} />
        </button>
        
        <div className="flex flex-col items-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
            <Music className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2 text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground mb-6">Escuche la grabación de la consulta.</p>

          <audio controls autoPlay src={audioUrl} className="w-full">
            Tu navegador no soporta el elemento de audio.
          </audio>
        </div>
      </div>
    </div>
  );
}