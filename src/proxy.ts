// src/proxy.ts
// Proxy de Seguridad de Next.js — Se ejecuta en el Edge Runtime ANTES de cada request.
// Protege de forma estricta las rutas de dashboards (programador, dueño, empleado).
// Si un usuario no autenticado o cliente intenta escribir la URL directamente en el navegador,
// es bloqueado y redirigido automáticamente a la pantalla de inicio de sesión (/login).

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, createRemoteJWKSet } from 'jose';

// Rutas estrictamente protegidas y los roles autorizados para cada una
const ROLE_PROTECTED_ROUTES: Record<string, string[]> = {
  '/programador': ['programmer'],
  '/dueno': ['programmer', 'owner'],
  '/empleado': ['programmer', 'owner', 'employee'],
};

// JWKS de Firebase para validar tokens JWT en el Edge
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '';
const FIREBASE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

async function getClaimsFromToken(token: string): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jwtVerify(token, FIREBASE_JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

function getTokenFromRequest(request: NextRequest): string | null {
  // 1. Cookie de sesión de Firebase
  const sessionCookie = request.cookies.get('session')?.value;
  if (sessionCookie && !sessionCookie.startsWith('simulated-')) return sessionCookie;

  // 2. Header Authorization
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);

  return null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignorar rutas estáticas, internas de Next.js y assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Buscar si la URL solicitada coincide con alguna sección administrativa protegida
  const protectedPrefix = Object.keys(ROLE_PROTECTED_ROUTES).find((prefix) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  // Si no es una ruta protegida (ej: /, /catalogo, /login), permitir acceso libre
  if (!protectedPrefix) {
    return NextResponse.next();
  }

  const requiredRoles = ROLE_PROTECTED_ROUTES[protectedPrefix];

  // ── 1. Verificar cookie de rol autenticado (Sayta Session) ────────────────
  const simulatedRole = request.cookies.get('sayta_simulated_role')?.value;

  if (simulatedRole) {
    // Si el rol que tiene en cookies está autorizado para esta ruta:
    if (requiredRoles.includes(simulatedRole)) {
      return NextResponse.next();
    }

    // Si tiene un rol pero es inferior (ej: cliente intentando entrar a /programador)
    const unauthorizedUrl = new URL('/login', request.url);
    unauthorizedUrl.searchParams.set('redirect', pathname);
    unauthorizedUrl.searchParams.set('error', 'unauthorized_role');
    return NextResponse.redirect(unauthorizedUrl);
  }

  // ── 2. Verificar token JWT de Firebase (si inició con Google/Firebase SDK) ──
  const token = getTokenFromRequest(request);
  if (token) {
    const claims = await getClaimsFromToken(token);
    if (claims) {
      const userRole = (claims.role as string) ?? 'customer';
      if (requiredRoles.includes(userRole)) {
        if (claims.suspended === true) {
          return NextResponse.redirect(new URL('/login?error=suspended', request.url));
        }
        return NextResponse.next();
      }
    }
  }

  // ── 3. Bloqueo Total: Usuario no autenticado ──────────────────────────────
  // Redirigir de inmediato al Login impidiendo el renderizado de la página privada
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', pathname);
  loginUrl.searchParams.set('error', 'login_required');
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    // Aplicar a todas las rutas protegidas y subrutas
    '/programador/:path*',
    '/dueno/:path*',
    '/empleado/:path*',
  ],
};
