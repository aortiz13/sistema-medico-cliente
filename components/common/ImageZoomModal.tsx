'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
}

export function ImageZoomModal({ isOpen, onClose, imageUrl }: ImageZoomModalProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  if (!isOpen || !imageUrl) return null;

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale((prev) => {
      const next = prev + delta;
      return Math.min(Math.max(next, 1), 5);
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setPosition({ x: e.clientX - startPos.x, y: e.clientY - startPos.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const zoomIn = () => setScale((s) => Math.min(s + 0.25, 5));
  const zoomOut = () => setScale((s) => Math.max(s - 0.25, 1));

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
      <button
        onClick={() => {
          setScale(1);
          setPosition({ x: 0, y: 0 });
          onClose();
        }}
        className="absolute top-4 right-4 text-white hover:text-gray-300"
      >
        <X size={24} />
      </button>

      <div className="relative w-full h-full max-w-4xl max-h-[90vh]">
        <div
          className="w-full h-full cursor-grab overflow-hidden flex items-center justify-center"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            src={imageUrl}
            alt="Imagen adjunta"
            className="select-none pointer-events-none"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            }}
          />
        </div>

        <div className="absolute bottom-4 right-4 flex space-x-2 bg-black/50 p-2 rounded">
          <button onClick={zoomOut} className="text-white p-1 hover:text-gray-300">
            <ZoomOut />
          </button>
          <button onClick={zoomIn} className="text-white p-1 hover:text-gray-300">
            <ZoomIn />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImageZoomModal;
