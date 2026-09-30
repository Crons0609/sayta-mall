// src/lib/auth/roles.ts
// Helpers y constantes del sistema de roles.

import { ROLES, UserRole } from '@/lib/constants';
import type { UserClaims } from '@/types/user.types';

// ─── Guards de rol ─────────────────────────────────────────────────────────────
export const isProgrammer = (claims: UserClaims | null): boolean =>
  claims?.role === ROLES.PROGRAMMER;

export const isOwner = (claims: UserClaims | null): boolean =>
  claims?.role === ROLES.OWNER || claims?.role === ROLES.PROGRAMMER;

export const isEmployee = (claims: UserClaims | null): boolean =>
  claims?.role === ROLES.EMPLOYEE ||
  claims?.role === ROLES.OWNER ||
  claims?.role === ROLES.PROGRAMMER;

export const isCustomer = (claims: UserClaims | null): boolean =>
  claims?.role === ROLES.CUSTOMER ||
  claims?.role === ROLES.EMPLOYEE ||
  claims?.role === ROLES.OWNER ||
  claims?.role === ROLES.PROGRAMMER;

export const isAuthenticated = (claims: UserClaims | null): boolean =>
  claims !== null;

// ─── Verificación de acceso a sucursal ────────────────────────────────────────
export const hasBranchAccess = (
  claims: UserClaims | null,
  branchId: string
): boolean => {
  if (!claims) return false;
  if (claims.role === ROLES.PROGRAMMER) return true; // acceso total
  return claims.branchIds.includes(branchId);
};

// ─── Verificación de suspensión ────────────────────────────────────────────────
export const isSuspended = (claims: UserClaims | null): boolean =>
  claims?.suspended === true;

// ─── Obtener ruta de inicio según rol ─────────────────────────────────────────
export const getDefaultRoute = (role: UserRole): string => {
  switch (role) {
    case ROLES.PROGRAMMER:
      return '/programador/dashboard';
    case ROLES.OWNER:
      return '/dueno/dashboard';
    case ROLES.EMPLOYEE:
      return '/empleado/dashboard';
    case ROLES.CUSTOMER:
      return '/';
    default:
      return '/';
  }
};

// ─── Etiquetas legibles de roles ──────────────────────────────────────────────
export const ROLE_LABELS: Record<UserRole, string> = {
  programmer: 'Programador',
  owner: 'Dueño',
  employee: 'Empleado',
  customer: 'Cliente',
};

// ─── Rutas protegidas por rol ─────────────────────────────────────────────────
export const PROTECTED_ROUTES: Record<string, UserRole[]> = {
  '/programador': ['programmer'],
  '/dueno': ['programmer', 'owner'],
  '/empleado': ['programmer', 'owner', 'employee'],
  '/carrito': ['programmer', 'owner', 'employee', 'customer'],
  '/pedidos': ['programmer', 'owner', 'employee', 'customer'],
  '/favoritos': ['programmer', 'owner', 'employee', 'customer'],
  '/perfil': ['programmer', 'owner', 'employee', 'customer'],
};
