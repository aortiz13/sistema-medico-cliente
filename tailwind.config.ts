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
        // Paleta de colores basada en tu logo
        primary: {
          DEFAULT: "#39B6E3", // Azul del logo
          dark: "#2E9AC4",   // Un tono más oscuro para hover
        },
        secondary: "#2E53A1", // Azul oscuro para acentos
        accent: {
          DEFAULT: "#E74C3C", // Rojo para alertas
          hover: "#C0392B",
        },
        success: "#2ECC71", // Verde para estados de éxito
        warning: "#F39C12", // Naranja para advertencias
        
        // Colores de soporte para la interfaz
        'base-100': "#FFFFFF", // Blanco puro para fondos de tarjetas
        'base-200': "#F8F9FA", // Gris muy claro para el fondo principal
        'base-300': "#E9ECEF", // Gris para bordes sutiles
        'text-primary': "#212529", // Negro suave para texto principal
        'text-secondary': "#6C757D", // Gris para texto secundario y descriptivo
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 12px rgba(0, 0, 0, 0.05)',
        'medium': '0 8px 24px rgba(0, 0, 0, 0.08)',
      },
      borderRadius: {
        'xl': '1rem', // Bordes más redondeados para un look moderno
      }
    },
  },
  plugins: [],
};
export default config;