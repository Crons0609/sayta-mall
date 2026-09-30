// src/lib/auth/claims.ts
// Funciones del servidor para leer y verificar custom claims de Firebase Auth.
// Solo se usa en API routes y Server Components (server-only).

import 'server-only';
import { adminAuth } from '@/lib/firebase/admin';
import type { UserClaims } from '@/types/user.types';
import { ROLES } from '@/lib/constants';

/**
 * Verifica el token de ID de Firebase y retorna los custom claims del usuario.
 * Lanza un error si el token es inválido.
 */
export async function verifyAndGetClaims(idToken: string): Promise<UserClaims> {
  const decodedToken = await adminAuth.verifyIdToken(idToken, true); // checkRevoked = true

  return {
    role: (decodedToken.role as UserClaims['role']) ?? ROLES.CUSTOMER,
    branchIds: (decodedToken.branchIds as string[]) ?? [],
    area: decodedToken.area as UserClaims['area'],
    suspended: decodedToken.suspended === true,
    ownerId: decodedToken.ownerId as string | undefined,
  };
}

/**
 * Asigna custom claims a un usuario. Solo llamar desde API routes protegidas.
 * Requiere que el solicitante sea programador o dueño con permisos.
 */
export async function setUserClaims(
  uid: string,
  claims: Partial<UserClaims>
): Promise<void> {
  // Obtener claims actuales para no sobreescribir campos no incluidos
  const user = await adminAuth.getUser(uid);
  const currentClaims = (user.customClaims ?? {}) as Partial<UserClaims>;

  const newClaims: UserClaims = {
    role: claims.role ?? currentClaims.role ?? ROLES.CUSTOMER,
    branchIds: claims.branchIds ?? currentClaims.branchIds ?? [],
    area: claims.area ?? currentClaims.area,
    suspended: claims.suspended ?? currentClaims.suspended ?? false,
    ownerId: claims.ownerId ?? currentClaims.ownerId,
  };

  await adminAuth.setCustomUserClaims(uid, newClaims);
}

/**
 * Elimina los custom claims de un usuario (equivale a dejarlo como customer).
 */
export async function clearUserClaims(uid: string): Promise<void> {
  await adminAuth.setCustomUserClaims(uid, {
    role: ROLES.CUSTOMER,
    branchIds: [],
    suspended: false,
  });
}

/**
 * Obtiene el token de ID desde el header Authorization de una Request.
 * Formato esperado: "Bearer <token>"
 */
export function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

/**
 * Helper que combina extractBearerToken + verifyAndGetClaims.
 * Úsalo en API routes para validar la sesión en una línea.
 */
export async function getClaimsFromRequest(
  request: Request
): Promise<UserClaims | null> {
  const token = extractBearerToken(request);
  if (!token) return null;
  try {
    return await verifyAndGetClaims(token);
  } catch {
    return null;
  }
}
