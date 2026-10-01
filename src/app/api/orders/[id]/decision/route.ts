// src/app/api/orders/[id]/decision/route.ts
// Aplica la decisión del cliente sobre los productos faltantes y recalcula totales en servidor.
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { applyCustomerDecisionOnOrder } from '@/lib/firebase/conversations';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace('Bearer ', '');
    if (!idToken) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const decoded: any = await adminAuth.verifyIdToken(idToken);
    const { id: orderId } = await params;
    const body = await req.json();
    const { decision } = body;

    if (!decision || !['sin_producto', 'sustituido', 'esperar', 'cancelado'].includes(decision)) {
      return NextResponse.json({ error: 'Decisión inválida' }, { status: 400 });
    }

    const result = await applyCustomerDecisionOnOrder(orderId, decision, decoded.uid);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[Orders Decision POST]', err);
    return NextResponse.json({ error: err.message || 'Error al aplicar decisión' }, { status: 500 });
  }
}