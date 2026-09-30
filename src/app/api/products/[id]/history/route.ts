// src/app/api/products/[id]/history/route.ts
// Obtiene el historial de precios y cambios de un producto.

import { NextRequest, NextResponse } from 'next/server';
import { getProductPriceHistory } from '@/lib/products/pricingEngine';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'ID de producto no proporcionado.' }, { status: 400 });
    }

    const history = await getProductPriceHistory(id);

    return NextResponse.json({
      success: true,
      productId: id,
      history,
    });
  } catch (error: any) {
    console.error('[API Product History]', error);
    return NextResponse.json({ error: 'Error obteniendo historial de precios.' }, { status: 500 });
  }
}
