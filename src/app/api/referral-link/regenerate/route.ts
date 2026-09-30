// src/app/api/referral-link/regenerate/route.ts
// POST /api/referral-link/regenerate — Regenera el code del enlace del usuario.
// El code anterior queda inválido (se elimina del índice).

import { NextRequest, NextResponse } from 'next/server';
import {
  getReferralLinkByUserId,
  saveReferralLink,
  invalidateOldCode,
  type ReferralLink,
} from '@/lib/firebase/referral';
import { generateReferralCode } from '@/lib/referral-code';
import { getAuthenticatedUserFromRequest } from '@/lib/auth/serverAuth';

export async function POST(request: NextRequest) {
  try {
    const userInfo = await getAuthenticatedUserFromRequest(request);
    if (!userInfo) {
      return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
    }

    const { userId, role, displayName } = userInfo;
    const existingLink = await getReferralLinkByUserId(userId);

    const newCode = generateReferralCode(10);

    // Invalidar código anterior en el índice
    if (existingLink?.code) {
      await invalidateOldCode(existingLink.code);
    }

    const updatedLink: ReferralLink = {
      id: existingLink?.id ?? `ref-${userId}`,
      userId,
      userDisplayName: displayName,
      userRole: role,
      code: newCode,
      isActive: existingLink?.isActive ?? true,
      createdAt: existingLink?.createdAt ?? new Date().toISOString(),
      regeneratedAt: new Date().toISOString(),
    };

    await saveReferralLink(updatedLink);

    const host = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `${protocol}://${host}` : 'https://sayta-mall.onrender.com');

    return NextResponse.json({
      success: true,
      link: updatedLink,
      url: `${appUrl}/r/${updatedLink.code}`,
    });
  } catch (error: any) {
    console.error('[referral-link/regenerate]', error);
    return NextResponse.json({ error: 'Error interno regenerando enlace.' }, { status: 500 });
  }
}
