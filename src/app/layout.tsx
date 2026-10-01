// src/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { LanguageProvider } from '@/providers/LanguageProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { BranchProvider } from '@/providers/BranchProvider';
import { CartProvider } from '@/providers/CartProvider';
import { DashboardPreferencesProvider } from '@/providers/DashboardPreferencesProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    template: '%s | Sayta Mall',
    default: 'Sayta Mall — Super Ahorro Y Todo Aquí',
  },
  description:
    'Encuentra todo lo que necesitas en Sayta Mall. Productos de calidad, precios increíbles y entrega rápida.',
  keywords: ['tienda', 'compras', 'ofertas', 'productos', 'Sayta Mall'],
  authors: [{ name: 'Sayta Mall' }],
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    siteName: 'Sayta Mall',
    title: 'Sayta Mall — Super Ahorro Y Todo Aquí',
    description: 'Encuentra todo lo que necesitas en Sayta Mall.',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/images/logo.png',
    shortcut: '/images/logo.png',
    apple: '/images/logo.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Sayta Mall',
  },
  other: {
    'darkreader-lock': '',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f5f7' },
    { media: '(prefers-color-scheme: dark)', color: '#0A0B0D' },
  ],
  colorScheme: 'dark light',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="darkreader-lock" content="darkreader-lock" />
        {/* Script crítico: aplica el tema e idioma ANTES de que React hidrate para evitar parpadeo */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('sayta_theme');var e=t&&['light','dark','system'].includes(t)?t:'dark';var d;if(e==='system'){d=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}else{d=e;}document.documentElement.classList.remove('light','dark');document.documentElement.classList.add(d);document.documentElement.setAttribute('data-theme',d);document.documentElement.style.colorScheme=d;var l=localStorage.getItem('sayta_global_lang')||localStorage.getItem('sayta_dashboard_lang');if(l&&['es','en','zh'].includes(l)){document.documentElement.lang=l==='zh'?'zh-CN':l;}}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <BranchProvider>
                <CartProvider>
                  <DashboardPreferencesProvider>
                    {children}
                  </DashboardPreferencesProvider>
                </CartProvider>
              </BranchProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
