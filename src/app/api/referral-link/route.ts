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

// ─── Helpers de autenticación simulada ──────────────────────────────────────
function getUserIdFromRequest(request: NextRequest): { userId: string; role: string; displayName: string } | null {
  // En desarrollo, el userId se extrae de la cookie de simulación
  const simulatedRole = request.cookies.get('sayta_simulated_role')?.value;
  if (!simulatedRole) return null;

  // Mapeamos rol → datos de usuario simulado
  const simulatedUsers: Record<string, { userId: string; role: string; displayName: string }> = {
    programmer: { userId: 'programmer-1', role: 'programmer', displayName: 'Programador Superadmin' },
    owner: { userId: 'owner-1', role: 'owner', displayName: 'Dueño Sayta Mall' },
    employee: { userId: 'employee-1', role: 'employee', displayName: 'Empleado' },
  };

  return simulatedUsers[simulatedRole] ?? null;
}

// ─── GET /api/referral-link ──────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const userInfo = getUserIdFromRequest(request);
    if (!userInfo) {
      return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
    }

    const { userId, role, displayName } = userInfo;

    // Buscar enlace existente
    let link = await getReferralLinkByUserId(userId);

    if (!link) {
      // Auto-crear el enlace si no existe
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
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.json({
      success: true,
      link,
      url: `${appUrl}/r/${link.code}`,
    });
  } catch (error: any) {
    console.error('[referral-link GET]', error);
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}
