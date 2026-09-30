// src/app/api/referral-link/attribute-sale/route.ts
// POST /api/referral-link/attribute-sale
// Registra una venta y la atribuye al propietario del enlace de referido,
// leyendo el code desde la cookie HttpOnly (nunca del cliente).
//
// Body esperado:
// { amount: number, currency: string, description: string, orderId?: string }

import { NextRequest, NextResponse } from 'next/server';
import {
  getReferralLinkByCode,
  saveReferralSale,
  type ReferralSale,
} from '@/lib/firebase/referral';
import { REFERRAL_COOKIE_NAME } from '@/lib/referral-code';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency = 'NIO', description = 'Venta atribuida', orderId } = body;

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Monto inválido.' }, { status: 400 });
    }

    // ── Leer el code de referido desde la cookie del servidor (no del cliente) ──
    const referralCode = request.cookies.get(REFERRAL_COOKIE_NAME)?.value ?? null;

    if (!referralCode) {
      // No hay cookie de referido — registrar venta sin atribución
      return NextResponse.json({
        success: true,
        attributed: false,
        message: 'Venta registrada sin atribución (no hay cookie de referido).',
      });
    }

    // ── Validar el enlace ──────────────────────────────────────────────────────
    const link = await getReferralLinkByCode(referralCode);

    if (!link || !link.isActive) {
      return NextResponse.json({
        success: true,
        attributed: false,
        message: 'Enlace inactivo o inexistente. Venta sin atribución.',
      });
    }

    // ── Guardar la venta atribuida ─────────────────────────────────────────────
    const saleId = orderId ?? `sale-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const sale: ReferralSale = {
      id: saleId,
      referralLinkId: link.id,
      attributedUserId: link.userId,
      amount,
      currency,
      description,
      createdAt: new Date().toISOString(),
    };

    await saveReferralSale(sale);

    return NextResponse.json({
      success: true,
      attributed: true,
      attributedUserId: link.userId,
      attributedUserDisplayName: link.userDisplayName,
      saleId,
    });
  } catch (error: any) {
    console.error('[referral-link/attribute-sale]', error);
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}
