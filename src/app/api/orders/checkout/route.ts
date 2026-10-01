// src/app/api/orders/checkout/route.ts
// Crea el pedido en Firestore en estado "pendiente" y notifica al delivery por WhatsApp.
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { createOrder } from '@/lib/firebase/orders';
import { getDeliveryCompanyById } from '@/lib/firebase/delivery';
import { buildWhatsAppDeliveryNotification } from '@/lib/whatsapp-order';

export async function POST(req: NextRequest) {
  try {
    // -- 1. Autenticar cliente ------------------------------------------------
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace('Bearer ', '');
    if (!idToken) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const decoded = await adminAuth.verifyIdToken(idToken);
    const customerId = decoded.uid;
    const customerEmail = decoded.email ?? '';
    const customerName = decoded.name ?? decoded.email ?? 'Cliente';
    const customerPhone = decoded.phone_number ?? undefined;

    // Bloquear acceso de delivery temporal
    if (decoded.rol === 'delivery_temporal') {
      return NextResponse.json({ error: 'Acceso no permitido' }, { status: 403 });
    }

    const body = await req.json();
    const { items, cliente, empresaDeliveryId, sucursalId, descuento = 0 } = body;

    // -- 2. Validaciones básicas ----------------------------------------------
    if (!items?.length) return NextResponse.json({ error: 'Cesta vacía' }, { status: 400 });
    if (!cliente?.nombre || !cliente?.direccion) return NextResponse.json({ error: 'Datos de entrega incompletos' }, { status: 400 });
    if (!empresaDeliveryId) return NextResponse.json({ error: 'Selecciona una empresa de delivery' }, { status: 400 });
    if (!sucursalId) return NextResponse.json({ error: 'Sucursal no especificada' }, { status: 400 });

    // -- 3. Obtener empresa de delivery ---------------------------------------
    const empresa = await getDeliveryCompanyById(empresaDeliveryId);
    if (!empresa || !empresa.estado || empresa.deleted) {
      return NextResponse.json({ error: 'Empresa de delivery no disponible' }, { status: 400 });
    }

    // -- 4. Crear pedido en Firestore -----------------------------------------
    const order = await createOrder(
      { items, cliente, empresaDeliveryId, sucursalId, descuento },
      customerId, customerName, customerEmail, customerPhone,
      empresa.nombre, empresa.whatsapp, empresa.costo_envio ?? 0
    );

    // -- 5. Generar link WhatsApp para el delivery (notificación) -------------
    const waUrl = buildWhatsAppDeliveryNotification(order, empresa, items);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      whatsappDeliveryUrl: waUrl,
      message: 'Pedido creado. Notificando al delivery...',
    });
  } catch (err: any) {
    console.error('[Checkout POST]', err);
    return NextResponse.json({ error: err.message || 'Error al crear el pedido' }, { status: 500 });
  }
}
