// src/app/api/referral-link/stats/route.ts
// GET /api/referral-link/stats — Devuelve visitas, conversiones y monto total.

import { NextRequest, NextResponse } from 'next/server';
import {
  getReferralLinkByUserId,
  getReferralVisits,
  getReferralSales,
} from '@/lib/firebase/referral';

function getUserIdFromRequest(request: NextRequest): { userId: string } | null {
  const simulatedRole = request.cookies.get('sayta_simulated_role')?.value;
  if (!simulatedRole) return null;
  const simulatedUsers: Record<string, { userId: string }> = {
    programmer: { userId: 'programmer-1' },
    owner: { userId: 'owner-1' },
    employee: { userId: 'employee-1' },
  };
  return simulatedUsers[simulatedRole] ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const userInfo = getUserIdFromRequest(request);
    if (!userInfo) {
      return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
    }

    const { userId } = userInfo;
    const link = await getReferralLinkByUserId(userId);

    if (!link) {
      return NextResponse.json({
        success: true,
        stats: { visits: 0, conversions: 0, totalAmount: 0, currency: 'NIO', recentSales: [] },
      });
    }

    const [visits, sales] = await Promise.all([
      getReferralVisits(link.id),
      getReferralSales(link.id),
    ]);

    const totalAmount = sales.reduce((sum, s) => sum + (s.amount || 0), 0);
    const currency = sales.length > 0 ? sales[0].currency : 'NIO';

    // Últimas 10 ventas, más recientes primero
    const recentSales = [...sales]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      stats: {
        visits: visits.length,
        conversions: sales.length,
        totalAmount,
        currency,
        recentSales,
      },
    });
  } catch (error: any) {
    console.error('[referral-link/stats]', error);
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}
