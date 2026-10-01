// src/app/api/delivery/validate/route.ts
// Registra el pago y valida la compra. Solo sesiones delivery temporales.
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { getDeliverySession } from '@/lib/firebase/qr-tokens';
import { validateOrderPayment } from '@/lib/firebase/orders';

export async function POST(req: NextRequest) {
  try {
    const { orderId, sessionId, pago } = await req.json();

    if (!orderId) return NextResponse.json({ error: 'orderId requerido' }, { status: 400 });
    if (!pago?.metodo || !pago?.monto) return NextResponse.json({ error: 'Datos de pago incompletos' }, { status: 400 });
    if (pago.metodo === 'transferencia' && !pago.referencia) {
      return NextResponse.json({ error: 'La referencia es obligatoria para transferencias' }, { status: 400 });
    }

    // Verificar sesion activa
    const session: any = await getDeliverySession(sessionId);
    if (!session) return NextResponse.json({ error: 'Sesion expirada. Escanea el QR nuevamente.' }, { status: 401 });

    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace('Bearer ', '').trim();

    let deliveryUid = session.firebaseUid || `delivery-${session.nombre}`;
    let sucursalId = session.sucursalId;

    if (adminAuth && idToken && !idToken.startsWith('simulated-')) {
      try {
        const decoded = await adminAuth.verifyIdToken(idToken);
        if (decoded.rol === 'delivery_temporal') {
          deliveryUid = decoded.uid;
          if (decoded.sucursal_id) sucursalId = decoded.sucursal_id as string;
        }
      } catch (authErr) {
        console.warn('[Delivery Validate POST] verifyIdToken fallback:', authErr);
      }
    }

    const updatedOrder: any = await validateOrderPayment(
      orderId,
      deliveryUid,
      session.nombre,
      session.empresaDeliveryId,
      { metodo: pago.metodo, monto: Number(pago.monto), referencia: pago.referencia }
    );

    // Verificar que el pedido pertenece a la sucursal correcta
    if (updatedOrder.branchId && sucursalId && updatedOrder.branchId !== sucursalId) {
      return NextResponse.json({ error: 'El pedido no pertenece a esta sucursal' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      orderId,
      orderNumber: updatedOrder.orderNumber,
      total: updatedOrder.total,
      validadoPor: session.nombre,
      message: `¡Compra validada! Pedido ${updatedOrder.orderNumber} por C$ ${updatedOrder.total} NIO.`,
    });
  } catch (err: any) {
    console.error('[Delivery Validate POST]', err);
    return NextResponse.json({ error: err.message || 'Error al validar compra' }, { status: 500 });
  }
}
