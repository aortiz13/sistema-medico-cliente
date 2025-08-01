'use client';

import { useState, useEffect } from 'react';

const WORDS = ["IA", "Inteligente", "Autónomo"];
const TYPING_SPEED = 150; // Velocidad de escritura (ms por caracter)
const DELETING_SPEED = 75; // Velocidad de borrado (ms por caracter)
const PAUSE_DURATION = 2000; // Pausa al final de cada palabra (ms)

export function AnimatedIntelligence() {
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = WORDS[wordIndex];
    let timeoutId: NodeJS.Timeout;

    if (isDeleting) {
      // Lógica para borrar el texto
      if (text.length > 0) {
        timeoutId = setTimeout(() => {
          setText(currentWord.substring(0, text.length - 1));
        }, DELETING_SPEED);
      } else {
        setIsDeleting(false);
        setWordIndex((prevIndex) => (prevIndex + 1) % WORDS.length);
      }
    } else {
      // Lógica para escribir el texto
      if (text.length < currentWord.length) {
        timeoutId = setTimeout(() => {
          setText(currentWord.substring(0, text.length + 1));
        }, TYPING_SPEED);
      } else {
        // Pausa antes de empezar a borrar
        timeoutId = setTimeout(() => {
          setIsDeleting(true);
        }, PAUSE_DURATION);
      }
    }

    // Limpieza al desmontar el componente o al cambiar de estado
    return () => clearTimeout(timeoutId);
  }, [text, isDeleting, wordIndex]);

  return (
    <span className="text-primary font-bold">
      {text}
      <span className="animate-pulse">|</span>
    </span>
  );
}
