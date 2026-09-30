// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Permitir imágenes desde Firebase Storage y Google
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/v0/b/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // fotos de perfil de Google
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Headers de seguridad
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://*.firebaseapp.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com",
              "frame-src https://accounts.google.com https://*.firebaseapp.com",
            ].join('; '),
          },
        ],
      },
    ];
  },

  // Redirigir /admin → /dueno para compatibilidad
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/dueno/dashboard',
        permanent: false,
      },
    ];
  },

  // Variables de entorno expuestas al servidor (no al cliente)
  serverExternalPackages: ['firebase-admin'],

  // Optimizaciones
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;
