/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Advertencia: Esto permite que la compilación de producción se complete
    // incluso si tu proyecto tiene errores de ESLint.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;