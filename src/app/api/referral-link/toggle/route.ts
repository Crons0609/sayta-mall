// src/app/api/referral-link/toggle/route.ts
// PATCH /api/referral-link/toggle — Activa o desactiva el enlace del usuario.

import { NextRequest, NextResponse } from 'next/server';
import { getReferralLinkByUserId, saveReferralLink } from '@/lib/firebase/referral';
import { getAuthenticatedUserFromRequest } from '@/lib/auth/serverAuth';

export async function PATCH(request: NextRequest) {
  try {
    const userInfo = await getAuthenticatedUserFromRequest(request);
    if (!userInfo) {
      return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
    }

    const { userId } = userInfo;
    const link = await getReferralLinkByUserId(userId);

    if (!link) {
      return NextResponse.json({ error: 'Enlace no encontrado.' }, { status: 404 });
    }

    const updatedLink = { ...link, isActive: !link.isActive };
    await saveReferralLink(updatedLink);

    return NextResponse.json({
      success: true,
      isActive: updatedLink.isActive,
      link: updatedLink,
    });
  } catch (error: any) {
    console.error('[referral-link/toggle]', error);
    return NextResponse.json({ error: 'Error interno cambiando estado.' }, { status: 500 });
  }
}
