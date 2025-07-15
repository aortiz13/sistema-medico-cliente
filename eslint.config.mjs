// eslint.config.mjs

import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // --- AÑADE ESTE OBJETO PARA MODIFICAR LAS REGLAS ---
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "warn", // Cambia de 'error' a 'warn'
      "prefer-const": "warn" // Opcional: también para las variables que pueden ser constantes
    }
  }
  // ----------------------------------------------------
];

export default eslintConfig;