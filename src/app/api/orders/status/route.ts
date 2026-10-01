// src/app/api/orders/status/route.ts
// Cambia el estado de un pedido. Solo empleados, dueños y programadores autorizados.
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { updateOrderStatus, getOrderById } from '@/lib/firebase/orders';
import { FieldValue } from 'firebase-admin/firestore';

const ALLOWED_ROLES = ['employee', 'owner', 'programmer'];

async function handleStatusChange(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace('Bearer ', '');
    if (!idToken) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const decoded: any = await adminAuth.verifyIdToken(idToken);
    const role = (decoded.role || decoded.rol || '') as string;
    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Sin permiso para cambiar estados de pedidos' }, { status: 403 });
    }

    const body = await req.json();
    const orderId = body.orderId;
    const newStatus = body.newStatus || body.status;
    const staffNotes = body.staffNotes;

    if (!orderId || !newStatus) {
      return NextResponse.json({ error: 'orderId y status son requeridos' }, { status: 400 });
    }

    const order: any = await getOrderById(orderId);
    if (!order) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });

    // Validar transiciones permitidas
    const ALLOWED_TRANSITIONS: Record<string, string[]> = {
      pendiente: ['en_preparacion', 'listo_para_entrega', 'cancelado'],
      en_preparacion: ['listo_para_entrega', 'cancelado'],
      listo_para_entrega: ['cancelado', 'en_preparacion'],
      comprado: ['en_camino', 'entregado'],
      en_camino: ['entregado'],
    };

    const allowed = ALLOWED_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(newStatus)) {
      return NextResponse.json(
        { error: `Transición "${order.status}" -> "${newStatus}" no permitida` },
        { status: 400 }
      );
    }

    const extra: Record<string, unknown> = {};
    if (newStatus === 'en_preparacion') {
      extra.empleadoAsignadoId = decoded.uid;
      extra.empleadoAsignadoNombre = decoded.name ?? decoded.email;
      extra.preparandoAt = FieldValue.serverTimestamp();
    }
    if (newStatus === 'listo_para_entrega') extra.listoAt = FieldValue.serverTimestamp();
    if (staffNotes) extra.staffNotes = staffNotes;

    await updateOrderStatus(orderId, newStatus as any, extra);

    return NextResponse.json({ success: true, orderId, newStatus });
  } catch (err: any) {
    console.error('[Status POST/PATCH]', err);
    return NextResponse.json({ error: err.message || 'Error actualizando estado' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return handleStatusChange(req);
}

export async function PATCH(req: NextRequest) {
  return handleStatusChange(req);
}
