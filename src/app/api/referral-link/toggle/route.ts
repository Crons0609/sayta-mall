// src/app/api/referral-link/toggle/route.ts
// PATCH /api/referral-link/toggle — Activa o desactiva el enlace del usuario.

import { NextRequest, NextResponse } from 'next/server';
import { getReferralLinkByUserId, saveReferralLink } from '@/lib/firebase/referral';

function getUserIdFromRequest(request: NextRequest): { userId: string; role: string; displayName: string } | null {
  const simulatedRole = request.cookies.get('sayta_simulated_role')?.value;
  if (!simulatedRole) return null;
  const simulatedUsers: Record<string, { userId: string; role: string; displayName: string }> = {
    programmer: { userId: 'programmer-1', role: 'programmer', displayName: 'Programador Superadmin' },
    owner: { userId: 'owner-1', role: 'owner', displayName: 'Dueño Sayta Mall' },
    employee: { userId: 'employee-1', role: 'employee', displayName: 'Empleado' },
  };
  return simulatedUsers[simulatedRole] ?? null;
}

export async function PATCH(request: NextRequest) {
  try {
    const userInfo = getUserIdFromRequest(request);
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
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}
