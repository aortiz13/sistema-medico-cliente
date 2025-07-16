import * as React from 'react';

interface MarkdownRendererProps {
  text: string | undefined | null;
}

export function MarkdownRenderer({ text }: MarkdownRendererProps) {
  if (!text) {
    return <p>Nota no disponible.</p>;
  }

  // Convierte **texto** a <strong>texto</strong> y saltos de línea a <br />
  const processedText = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br />');

  return <div dangerouslySetInnerHTML={{ __html: processedText }} />;
}