// src/lib/firebase/referral.ts
// Funciones de persistencia en Firebase RTDB para el sistema de referral links.
// Todas las operaciones son server-side únicamente.

import { readRtdb, writeRtdb, deleteRtdb } from './rtdb';

// ─── Tipos ──────────────────────────────────────────────────────────────────
export interface ReferralLink {
  id: string;
  userId: string;
  userDisplayName: string;
  userRole: string;
  code: string;
  isActive: boolean;
  createdAt: string;
  regeneratedAt: string | null;
}

export interface ReferralVisit {
  id: string;
  referralLinkId: string;
  visitedAt: string;
  ipHash: string;
  userAgent: string;
}

export interface ReferralSale {
  id: string;
  referralLinkId: string;
  attributedUserId: string;
  amount: number;
  currency: string;
  description: string;
  createdAt: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Lee el enlace de referido de un usuario desde RTDB.
 * Indexado por userId (clave principal) y por code (clave secundaria).
 */
export async function getReferralLinkByUserId(userId: string): Promise<ReferralLink | null> {
  return readRtdb<ReferralLink>(`referral_links/by_user/${userId}`);
}

export async function getReferralLinkByCode(code: string): Promise<ReferralLink | null> {
  // El índice by_code almacena solo el userId; luego leemos el objeto completo
  const userId = await readRtdb<string>(`referral_links/code_index/${code}`);
  if (!userId) return null;
  return getReferralLinkByUserId(userId);
}

export async function saveReferralLink(link: ReferralLink): Promise<boolean> {
  const saved = await writeRtdb(`referral_links/by_user/${link.userId}`, link);
  // Mantener índice inverso code → userId
  const indexed = await writeRtdb(`referral_links/code_index/${link.code}`, link.userId);
  return saved && indexed;
}

/**
 * Invalida el code antiguo del índice cuando se regenera.
 */
export async function invalidateOldCode(oldCode: string): Promise<boolean> {
  return deleteRtdb(`referral_links/code_index/${oldCode}`);
}

// ─── Visitas ────────────────────────────────────────────────────────────────

export async function recordReferralVisit(visit: ReferralVisit): Promise<boolean> {
  return writeRtdb(`referral_visits/${visit.referralLinkId}/${visit.id}`, visit);
}

export async function getReferralVisits(referralLinkId: string): Promise<ReferralVisit[]> {
  const data = await readRtdb<Record<string, ReferralVisit>>(
    `referral_visits/${referralLinkId}`
  );
  if (!data) return [];
  return Object.values(data);
}

// ─── Ventas atribuidas ───────────────────────────────────────────────────────

export async function saveReferralSale(sale: ReferralSale): Promise<boolean> {
  return writeRtdb(`referral_sales/${sale.referralLinkId}/${sale.id}`, sale);
}

export async function getReferralSales(referralLinkId: string): Promise<ReferralSale[]> {
  const data = await readRtdb<Record<string, ReferralSale>>(
    `referral_sales/${referralLinkId}`
  );
  if (!data) return [];
  return Object.values(data);
}

export async function getAllReferralSalesByUser(userId: string): Promise<ReferralSale[]> {
  const link = await getReferralLinkByUserId(userId);
  if (!link) return [];
  return getReferralSales(link.id);
}
