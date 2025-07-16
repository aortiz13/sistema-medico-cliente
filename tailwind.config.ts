import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"], // Habilita el modo oscuro basado en la clase 'dark'
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    // Asegúrate de que Tailwind escanee también los componentes de shadcn/ui si los tienes en una carpeta 'ui'
    // "./components/ui/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Colores base de shadcn/ui que usan tus variables CSS
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Aquí puedes reintroducir tus colores personalizados si son *adicionales*
        // a los de shadcn/ui y no reemplazos de sus variables principales.
        // Por ejemplo, si 'alert-red' fuera diferente de 'destructive' de shadcn/ui.
        // Puedes renombrarlos para evitar conflictos o eliminarlos si shadcn/ui cubre la necesidad.
        'success-custom': "#2ECC71", // Mantener como un color adicional si es necesario
        'warning-custom': "#F39C12", // Mantener como un color adicional si es necesario
        
        // Los siguientes colores probablemente son cubiertos por las variables de shadcn/ui
        // 'base-100': "hsl(var(--card))", // O 'hsl(var(--background))' si es para el fondo principal
        // 'base-200': "hsl(var(--background))",
        // 'base-300': "hsl(var(--border))",
        // 'text-primary': "hsl(var(--foreground))",
        // 'text-secondary': "hsl(var(--muted-foreground))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // Puedes mantener 'xl' si quieres un radio adicional específico
        // 'xl': '1rem',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Ya lo tienes, asegúrate de que 'Inter' se importa en globals.css
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      boxShadow: {
        'soft': '0 4px 12px rgba(0, 0, 0, 0.05)',
        'medium': '0 8px 24px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate") // Plugin común de shadcn/ui para animaciones
  ],
};
export default config;