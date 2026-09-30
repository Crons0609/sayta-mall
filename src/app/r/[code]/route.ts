// src/app/r/[code]/route.ts
// GET /r/{code} — Ruta pública de entrada. Valida el code, registra la visita
// y guarda el code en una cookie HttpOnly para atribución posterior.
// Redirige al catálogo principal de Sayta Mall.

import { NextRequest, NextResponse } from 'next/server';
import { getReferralLinkByCode, recordReferralVisit } from '@/lib/firebase/referral';
import { REFERRAL_COOKIE_NAME, REFERRAL_COOKIE_MAX_AGE } from '@/lib/referral-code';
import crypto from 'crypto';

// Rate limiting básico en memoria (en producción usa Redis/Upstash)
const visitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minuto
const RATE_LIMIT_MAX = 15; // máx 15 visitas por IP por minuto

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (visitMap.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT_MAX) return true;
  timestamps.push(now);
  visitMap.set(ip, timestamps);
  return false;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Rate limiting por IP
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '0.0.0.0';

  if (isRateLimited(ip)) {
    return NextResponse.redirect(new URL('/catalogo', appUrl), { status: 302 });
  }

  // Validar el code
  if (!code || code.length < 8) {
    return NextResponse.redirect(new URL('/catalogo', appUrl), { status: 302 });
  }

  const link = await getReferralLinkByCode(code);

  if (link && link.isActive) {
    // Registrar visita (async, no blocking el redirect)
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);
    const visitId = `v-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    recordReferralVisit({
      id: visitId,
      referralLinkId: link.id,
      visitedAt: new Date().toISOString(),
      ipHash,
      userAgent: (request.headers.get('user-agent') ?? '').slice(0, 200),
    }).catch((e) => console.warn('[r/code] Error registrando visita:', e));

    // Guardar cookie de atribución (último clic gana)
    const response = NextResponse.redirect(new URL('/catalogo', appUrl), { status: 302 });
    response.cookies.set(REFERRAL_COOKIE_NAME, code, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: REFERRAL_COOKIE_MAX_AGE,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
    });
    return response;
  }

  // Code inválido o inactivo → redirigir sin cookie
  return NextResponse.redirect(new URL('/catalogo', appUrl), { status: 302 });
}
