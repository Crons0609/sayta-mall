// src/app/api/orders/cancel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { cancelOrder, getOrderById } from '@/lib/firebase/orders';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace('Bearer ', '');
    if (!idToken) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const decoded: any = await adminAuth.verifyIdToken(idToken);
    const body = await req.json();
    const { orderId, motivo = '' } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'orderId es requerido' }, { status: 400 });
    }

    const order: any = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    // El cliente solo puede cancelar sus propios pedidos si están pendientes
    const isOwnerOrStaff = ['programmer', 'owner', 'employee'].includes(decoded.role || decoded.rol || '');
    const isCustomer = order.customerId === decoded.uid;

    if (!isOwnerOrStaff && !isCustomer) {
      return NextResponse.json({ error: 'No tienes permiso para cancelar este pedido' }, { status: 403 });
    }

    await cancelOrder(orderId, decoded.name || decoded.email || decoded.uid, motivo);

    return NextResponse.json({
      success: true,
      message: 'Pedido cancelado correctamente',
    });
  } catch (err: any) {
    console.error('[Orders Cancel POST]', err);
    return NextResponse.json({ error: err.message || 'Error al cancelar pedido' }, { status: 500 });
  }
}
