// src/lib/auth/serverAuth.ts
// Helper unificado para resolver la identidad del usuario autenticado en API Routes.
// Soporta:
// 1. Firebase Auth ID Token (Header Authorization Bearer)
// 2. Cookie de sesión de Firebase o Sayta (session)
// 3. Cookies directas de autenticación (sayta_user_id, sayta_simulated_role, sayta_user_email)
// 4. Headers de contexto enviados por el cliente autenticado (x-user-id, x-user-role, x-user-name)
// 5. Búsqueda automática en Realtime Database (empleados, dueños, programadores)

import { NextRequest } from 'next/server';
import { adminAuth, adminDb, isFirebaseAdminConfigured } from '@/lib/firebase/admin';
import { getEmployeesFromRtdb, getOwnersFromRtdb } from '@/lib/firebase/rtdb';
import { getProgrammersFromDb } from '@/lib/firebase/programmers';
import { extractBearerToken } from './claims';

export interface AuthUserInfo {
  userId: string;
  email: string;
  role: string;
  displayName: string;
}

export async function getAuthenticatedUserFromRequest(
  request: NextRequest
): Promise<AuthUserInfo | null> {
  // ── 1. Verificar Token Bearer en Header Authorization ──
  const bearerToken = extractBearerToken(request);
  if (bearerToken && isFirebaseAdminConfigured && adminAuth) {
    try {
      const decoded = await adminAuth.verifyIdToken(bearerToken, true);
      const uid = decoded.uid;
      const email = (decoded.email || '').toLowerCase();
      let role = (decoded.role as string) || '';
      let displayName =
        (decoded.name as string) ||
        (decoded.displayName as string) ||
        (email ? email.split('@')[0] : 'Colaborador');

      // Si el rol es customer o no viene en claims, buscar si es empleado o dueño en RTDB
      if (!role || role === 'customer') {
        try {
          const employees = await getEmployeesFromRtdb();
          const emp = employees.find(
            (e) => (e.email && e.email.toLowerCase() === email) || e.id === uid
          );
          if (emp) {
            role = 'employee';
            if (emp.displayName) displayName = emp.displayName;
          }
        } catch {
          // ignore
        }
      }

      if (!role || role === 'customer') {
        try {
          const owners = await getOwnersFromRtdb();
          const owner = owners.find(
            (o) => (o.email && o.email.toLowerCase() === email) || o.id === uid
          );
          if (owner) {
            role = 'owner';
            if (owner.name) displayName = owner.name;
          }
        } catch {
          // ignore
        }
      }

      return {
        userId: uid,
        email,
        role: role || 'employee',
        displayName,
      };
    } catch (tokenErr) {
      console.warn('[serverAuth] Token Bearer no válido, intentando cookies:', tokenErr);
    }
  }

  // ── 2. Verificar Cookie de Sesión de Firebase (session) ──
  const sessionCookie = request.cookies.get('session')?.value;
  if (sessionCookie && !sessionCookie.startsWith('simulated-') && isFirebaseAdminConfigured && adminAuth) {
    try {
      const decoded = await adminAuth.verifyIdToken(sessionCookie, true);
      const uid = decoded.uid;
      const email = (decoded.email || '').toLowerCase();
      let role = (decoded.role as string) || '';
      let displayName =
        (decoded.name as string) ||
        (decoded.displayName as string) ||
        (email ? email.split('@')[0] : 'Colaborador');

      if (!role || role === 'customer') {
        try {
          const employees = await getEmployeesFromRtdb();
          const emp = employees.find(
            (e) => (e.email && e.email.toLowerCase() === email) || e.id === uid
          );
          if (emp) {
            role = 'employee';
            if (emp.displayName) displayName = emp.displayName;
          }
        } catch {}
      }

      return {
        userId: uid,
        email,
        role: role || 'employee',
        displayName,
      };
    } catch {}
  }

  // ── 3. Verificar Cookies Sayta (Sesión directa) ──
  const cookieRole = request.cookies.get('sayta_simulated_role')?.value;
  const cookieUserId = request.cookies.get('sayta_user_id')?.value;
  const cookieEmail = request.cookies.get('sayta_user_email')?.value?.toLowerCase();
  const rawCookieName = request.cookies.get('sayta_user_name')?.value;
  const cookieName = rawCookieName ? decodeURIComponent(rawCookieName) : null;

  // Si tenemos email o userId, verificar en RTDB para obtener nombre exacto
  if (cookieEmail || cookieUserId) {
    try {
      const employees = await getEmployeesFromRtdb();
      const emp = employees.find(
        (e) => (cookieEmail && e.email?.toLowerCase() === cookieEmail) || (cookieUserId && e.id === cookieUserId)
      );
      if (emp) {
        return {
          userId: emp.id || cookieUserId || `emp-${Date.now()}`,
          email: emp.email || cookieEmail || '',
          role: 'employee',
          displayName: emp.displayName || cookieName || emp.email?.split('@')[0] || 'Colaborador',
        };
      }

      const owners = await getOwnersFromRtdb();
      const owner = owners.find(
        (o) => (cookieEmail && o.email?.toLowerCase() === cookieEmail) || (cookieUserId && o.id === cookieUserId)
      );
      if (owner) {
        return {
          userId: owner.id || cookieUserId || `owner-${Date.now()}`,
          email: owner.email || cookieEmail || '',
          role: 'owner',
          displayName: owner.name || cookieName || owner.email?.split('@')[0] || 'Dueño',
        };
      }
    } catch {
      // ignore
    }

    if (cookieRole || cookieUserId) {
      return {
        userId: cookieUserId || `user-${cookieRole || 'employee'}-1`,
        email: cookieEmail || '',
        role: cookieRole || 'employee',
        displayName: cookieName || (cookieEmail ? cookieEmail.split('@')[0] : 'Colaborador'),
      };
    }
  }

  // ── 4. Headers de contexto pasados por el cliente autenticado ──
  const headerUserId = request.headers.get('x-user-id');
  const headerUserRole = request.headers.get('x-user-role');
  const headerUserName = request.headers.get('x-user-name');
  const headerUserEmail = request.headers.get('x-user-email');

  if (headerUserId && headerUserRole) {
    return {
      userId: headerUserId,
      role: headerUserRole,
      email: headerUserEmail || '',
      displayName: headerUserName ? decodeURIComponent(headerUserName) : (headerUserEmail ? headerUserEmail.split('@')[0] : 'Colaborador'),
    };
  }

  // ── 5. Query parameters de respaldo ──
  try {
    const url = new URL(request.url);
    const qUserId = url.searchParams.get('userId');
    const qRole = url.searchParams.get('role');
    const qName = url.searchParams.get('name');
    if (qUserId && qRole) {
      return {
        userId: qUserId,
        role: qRole,
        email: url.searchParams.get('email') || '',
        displayName: qName ? decodeURIComponent(qName) : 'Colaborador',
      };
    }
  } catch {}

  // ── 6. Fallback final si solo hay cookieRole (para compatibilidad de desarrollo) ──
  if (cookieRole) {
    const fallbackUsers: Record<string, { userId: string; role: string; displayName: string }> = {
      programmer: { userId: 'programmer-1', role: 'programmer', displayName: 'Programador Superadmin' },
      owner: { userId: 'owner-1', role: 'owner', displayName: 'Dueño Sayta Mall' },
      employee: { userId: 'employee-1', role: 'employee', displayName: 'Colaborador' },
    };
    const resolved = fallbackUsers[cookieRole];
    if (resolved) {
      return {
        ...resolved,
        email: cookieEmail || '',
      };
    }
  }

  return null;
}
