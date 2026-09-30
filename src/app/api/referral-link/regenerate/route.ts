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

export async function POST(request: NextRequest) {
  try {
    const userInfo = getUserIdFromRequest(request);
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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.json({
      success: true,
      link: updatedLink,
      url: `${appUrl}/r/${updatedLink.code}`,
    });
  } catch (error: any) {
    console.error('[referral-link/regenerate]', error);
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}
