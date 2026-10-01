// src/app/api/delivery/orders/route.ts
// Lista pedidos listos para validar en una sucursal (sesion temporal delivery).
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { getDeliverySession } from '@/lib/firebase/qr-tokens';
import { getActiveBranchOrders, getOrderItems } from '@/lib/firebase/orders';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId') ?? '';

    const session: any = await getDeliverySession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Sesion expirada. Escanea el QR nuevamente.' }, { status: 401 });
    }

    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace('Bearer ', '').trim();

    let sucursalId = session.sucursalId;

    if (adminAuth && idToken && !idToken.startsWith('simulated-')) {
      try {
        const decoded = await adminAuth.verifyIdToken(idToken);
        if (decoded.rol !== 'delivery_temporal') {
          return NextResponse.json({ error: 'Acceso solo para sesiones delivery' }, { status: 403 });
        }
        if (decoded.sucursal_id) {
          sucursalId = decoded.sucursal_id as string;
        }
      } catch (authErr) {
        console.warn('[Delivery Orders GET] verifyIdToken fallback to session:', authErr);
      }
    }

    // Pedidos pendientes, en preparacion o listos
    const orders = await getActiveBranchOrders(sucursalId, ['pendiente', 'en_preparacion', 'listo_para_entrega']);

    // Enriquecer con items
    const enriched = await Promise.all(orders.map(async (order: any) => {
      const items = await getOrderItems(order.id);
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName || order.cliente?.nombre || 'Cliente',
        status: order.status,
        total: order.total,
        currency: order.currency || 'NIO',
        itemCount: items.length,
        createdAt: order.createdAt,
        _items: items,
        _telefono: order.customerPhone || order.cliente?.telefono,
        _direccion: order.deliveryAddress || order.cliente?.direccion,
        _empresaDeliveryId: order.empresaDeliveryId,
      };
    }));

    return NextResponse.json({
      success: true,
      orders: enriched,
      session: { nombre: session.nombre, empresaDeliveryId: session.empresaDeliveryId },
    });
  } catch (err: any) {
    console.error('[Delivery Orders GET]', err);
    return NextResponse.json({ error: err.message || 'Error' }, { status: 500 });
  }
}
