import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Tu paleta de colores personalizada
        primary: {
          DEFAULT: "#2E53A1", // Azul principal
          light: "#4A6FBF",
        },
        secondary: "#39B6E3", // Azul secundario/turquesa
        accent: "#E74C3C", // Rojo para alertas y acciones importantes
        
        // Colores de soporte para fondos y texto
        'base-100': "#FFFFFF", // Blanco puro
        'base-200': "#F8F9FA", // Gris muy claro para fondos
        'base-300': "#E9ECEF", // Gris para bordes
        'text-primary': "#212529", // Negro suave para texto principal
        'text-secondary': "#6C757D", // Gris para texto secundario
      },
      fontFamily: {
        // Se establece 'Inter' como la fuente principal para un look moderno
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        // Sombras sutiles para dar profundidad
        'soft': '0 4px 12px rgba(0, 0, 0, 0.05)',
        'medium': '0 8px 24px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
};
export default config;
