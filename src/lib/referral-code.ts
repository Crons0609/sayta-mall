// src/lib/referral-code.ts
// Generación segura de códigos de referido y utilidades de cookie.

import { cookies } from 'next/headers';

/**
 * Genera un código alfanumérico criptográficamente seguro de longitud `len`.
 * Usa el módulo `crypto` de Node.js (disponible en Next.js API routes).
 */
export function generateReferralCode(len = 10): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  // Eliminamos caracteres confusos: 0/O, 1/I/l
  const randomBytes = new Uint8Array(len * 2);
  crypto.getRandomValues(randomBytes);
  let result = '';
  for (let i = 0; i < randomBytes.length && result.length < len; i++) {
    const idx = randomBytes[i] % alphabet.length;
    result += alphabet[idx];
  }
  return result.slice(0, len);
}

// ─── Cookie helpers ──────────────────────────────────────────────────────────

export const REFERRAL_COOKIE_NAME = 'sayta_ref';
export const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 días

/**
 * Lee el código de referido desde la cookie (server-side).
 */
export async function getReferralCodeFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(REFERRAL_COOKIE_NAME)?.value ?? null;
}
