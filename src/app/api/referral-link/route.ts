// src/app/api/referral-link/route.ts
// GET  /api/referral-link  — Devuelve el enlace del usuario autenticado.
//                           Si no existe, lo crea automáticamente.

import { NextRequest, NextResponse } from 'next/server';
import {
  getReferralLinkByUserId,
  saveReferralLink,
  type ReferralLink,
} from '@/lib/firebase/referral';
import { generateReferralCode } from '@/lib/referral-code';
import { getAuthenticatedUserFromRequest } from '@/lib/auth/serverAuth';

// ─── GET /api/referral-link ──────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const userInfo = await getAuthenticatedUserFromRequest(request);
    if (!userInfo) {
      return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
    }

    const { userId, role, displayName } = userInfo;

    // Buscar enlace existente por userId
    let link = await getReferralLinkByUserId(userId);

    if (!link) {
      // Auto-crear el enlace si no existe para este empleado/dueño
      const code = generateReferralCode(10);
      const newLink: ReferralLink = {
        id: `ref-${userId}`,
        userId,
        userDisplayName: displayName,
        userRole: role,
        code,
        isActive: true,
        createdAt: new Date().toISOString(),
        regeneratedAt: null,
      };
      await saveReferralLink(newLink);
      link = newLink;
    } else if (displayName && link.userDisplayName !== displayName && !link.userDisplayName) {
      // Actualizar nombre si antes era desconocido
      link.userDisplayName = displayName;
      await saveReferralLink(link);
    }

    const host = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `${protocol}://${host}` : 'https://sayta-mall.onrender.com');

    return NextResponse.json({
      success: true,
      link,
      url: `${appUrl}/r/${link.code}`,
    });
  } catch (error: any) {
    console.error('[referral-link GET]', error);
    return NextResponse.json({ error: 'Error interno obteniendo enlace de referidos.' }, { status: 500 });
  }
}
