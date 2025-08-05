/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración existente para ignorar errores de 'código limpio'
  eslint: {
    ignoreDuringBuilds: false,
  },
  // CAMBIO: Se añade esta configuración para ignorar errores de tipos de TypeScript
  // durante el despliegue. Esta es la solución al problema actual.
  typescript: {
    // !! ADVERTENCIA !!
    // Permite que la compilación de producción se complete exitosamente
    // incluso si el proyecto tiene errores de tipos.
    ignoreBuildErrors: false,
  },
  // --- AGREGA ESTE BLOQUE ---
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ixvfbjftrfaypozhnmrp.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/avatars/**',
      },
      {
        protocol: 'https',
        hostname: 'ixvfbjftrfaypozhnmrp.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/consultation-images/**',
      },
    ],
  },
};

export default nextConfig;
