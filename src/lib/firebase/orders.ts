// src/lib/firebase/orders.ts - Server-side only (Admin SDK with RTDB fallback)
import 'server-only';
import { adminDb } from './admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { readRtdb, writeRtdb } from './rtdb';

const PEDIDOS = 'pedidos';
const EXPIRA_HORAS = 2;

// Fallback en memoria si adminDb es nulo
const memoryOrders = new Map<string, any>();
const memoryOrderItems = new Map<string, any[]>();

function generateOrderNumber() {
  return `SAYTA-${Math.floor(10000 + Math.random() * 90000)}`;
}

export async function createOrder(
  payload: any,
  customerId: string,
  customerName: string,
  customerEmail: string,
  customerPhone?: string,
  empresaDeliveryNombre?: string,
  empresaDeliveryWhatsapp?: string,
  deliveryFee: number = 0
) {
  const orderNumber = generateOrderNumber();
  const now = adminDb ? Timestamp.now() : new Date();
  const expiraMillis = Date.now() + EXPIRA_HORAS * 60 * 60 * 1000;
  const expiraAt = adminDb ? Timestamp.fromMillis(expiraMillis) : new Date(expiraMillis);
  const subtotal = payload.items.reduce((s: number, i: any) => s + (i.price || i.precio || 0) * (i.quantity || i.cantidad || 1), 0);
  const discount = payload.descuento ?? 0;
  const total = Math.max(0, subtotal - discount + deliveryFee);
  const orderId = `order-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const orderData: any = {
    id: orderId,
    orderNumber,
    branchId: payload.sucursalId,
    customerId,
    customerName,
    customerEmail,
    customerPhone: customerPhone || payload.cliente?.telefono || '',
    empresaDeliveryId: payload.empresaDeliveryId,
    empresaDeliveryNombre: empresaDeliveryNombre || '',
    empresaDeliveryWhatsapp: empresaDeliveryWhatsapp || '',
    status: 'pendiente',
    deliveryType: 'delivery',
    cliente: {
      nombre: payload.cliente?.nombre || customerName,
      telefono: payload.cliente?.telefono || customerPhone || '',
      direccion: payload.cliente?.direccion || '',
      referencias: payload.cliente?.referencias || '',
      ciudad: payload.cliente?.ciudad || '',
      notas: payload.cliente?.notas || '',
    },
    deliveryAddress: {
      street: payload.cliente?.direccion || '',
      referencias: payload.cliente?.referencias || '',
      ciudad: payload.cliente?.ciudad || '',
      notas: payload.cliente?.notas || '',
    },
    subtotal,
    deliveryFee,
    discount,
    total,
    currency: 'NIO',
    createdAt: now,
    updatedAt: now,
    expiraAt,
    _items: payload.items,
  };

  if (adminDb) {
    try {
      const orderRef = adminDb.collection(PEDIDOS).doc(orderId);
      await adminDb.runTransaction(async (tx) => {
        tx.set(orderRef, orderData);
        for (const item of payload.items) {
          const itemRef = orderRef.collection('items').doc();
          const q = item.quantity || item.cantidad || 1;
          const p = item.price || item.precio || 0;
          tx.set(itemRef, {
            orderId,
            productId: item.productId || item.id,
            productName: item.name || item.nombre || 'Producto',
            productImage: item.image || item.imagen || '',
            quantity: q,
            unitPrice: p,
            subtotal: p * q,
          });
        }
      });
      return { id: orderId, ...orderData };
    } catch (err) {
      console.warn('[Orders createOrder Firestore Error, using RTDB fallback]:', err);
    }
  }

  // Fallback RTDB / Memoria
  memoryOrders.set(orderId, orderData);
  memoryOrderItems.set(orderId, payload.items.map((i: any, idx: number) => ({
    id: `item-${idx}`,
    orderId,
    productId: i.productId || i.id,
    productName: i.name || i.nombre || 'Producto',
    productImage: i.image || i.imagen || '',
    quantity: i.quantity || i.cantidad || 1,
    unitPrice: i.price || i.precio || 0,
    subtotal: (i.price || i.precio || 0) * (i.quantity || i.cantidad || 1),
  })));

  try {
    await writeRtdb(`pedidos/${orderId}`, {
      ...orderData,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      expiraAt: expiraMillis,
    });
  } catch {}

  return { id: orderId, ...orderData };
}

export async function updateOrderStatus(orderId: string, newStatus: string, extra: any = {}) {
  if (adminDb) {
    try {
      await adminDb.collection(PEDIDOS).doc(orderId).update({
        status: newStatus,
        updatedAt: FieldValue.serverTimestamp(),
        ...extra,
      });
      return;
    } catch (err) {
      console.warn('[Orders updateOrderStatus Firestore Error]:', err);
    }
  }

  const existing = memoryOrders.get(orderId) || {};
  const updated = { ...existing, status: newStatus, updatedAt: Date.now(), ...extra };
  memoryOrders.set(orderId, updated);
  try {
    await writeRtdb(`pedidos/${orderId}/status`, newStatus);
    await writeRtdb(`pedidos/${orderId}/updatedAt`, Date.now());
  } catch {}
}

export async function cancelOrder(orderId: string, canceladoPor: string, motivo = '') {
  if (adminDb) {
    try {
      const ref = adminDb.collection(PEDIDOS).doc(orderId);
      const snap = await ref.get();
      if (snap.exists) {
        const data = snap.data()!;
        if (['comprado', 'entregado', 'cancelado', 'expirado'].includes(data.status)) {
          throw new Error(`No se puede cancelar en estado "${data.status}"`);
        }
        await ref.update({
          status: 'cancelado',
          canceladoAt: FieldValue.serverTimestamp(),
          canceladoPor,
          motivoCancelacion: motivo,
          updatedAt: FieldValue.serverTimestamp(),
        });
        return;
      }
    } catch (err: any) {
      if (err.message?.includes('No se puede cancelar')) throw err;
      console.warn('[Orders cancelOrder Firestore Error]:', err);
    }
  }

  const existing = memoryOrders.get(orderId) || (await readRtdb(`pedidos/${orderId}`));
  if (!existing) throw new Error('Pedido no encontrado');
  if (['comprado', 'entregado', 'cancelado', 'expirado'].includes(existing.status)) {
    throw new Error(`No se puede cancelar en estado "${existing.status}"`);
  }

  existing.status = 'cancelado';
  existing.canceladoAt = Date.now();
  existing.canceladoPor = canceladoPor;
  existing.motivoCancelacion = motivo;
  memoryOrders.set(orderId, existing);
  try {
    await writeRtdb(`pedidos/${orderId}`, existing);
  } catch {}
}

export async function getOrderById(orderId: string) {
  if (adminDb) {
    try {
      const snap = await adminDb.collection(PEDIDOS).doc(orderId).get();
      if (snap.exists) return { id: snap.id, ...snap.data() };
    } catch (err) {
      console.warn('[Orders getOrderById Firestore Error]:', err);
    }
  }

  let order = memoryOrders.get(orderId);
  if (!order) {
    order = await readRtdb(`pedidos/${orderId}`);
    if (order) memoryOrders.set(orderId, order);
  }
  return order || null;
}

export async function getActiveBranchOrders(sucursalId: string, statusFilter?: string[]) {
  const statuses = statusFilter ?? ['pendiente', 'en_preparacion', 'listo_para_entrega'];

  if (adminDb) {
    try {
      const snap = await adminDb.collection(PEDIDOS)
        .where('branchId', '==', sucursalId)
        .where('status', 'in', statuses)
        .get();

      const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      return orders.sort((a: any, b: any) => {
        const tA = a.createdAt?.toMillis?.() || (a.createdAt?._seconds ? a.createdAt._seconds * 1000 : 0);
        const tB = b.createdAt?.toMillis?.() || (b.createdAt?._seconds ? b.createdAt._seconds * 1000 : 0);
        return tB - tA;
      });
    } catch (err) {
      console.warn('[Orders getActiveBranchOrders Firestore Error]:', err);
    }
  }

  // Fallback RTDB / Memoria
  let allOrders: any[] = Array.from(memoryOrders.values());
  const rtdbOrders = await readRtdb<Record<string, any>>('pedidos');
  if (rtdbOrders) {
    for (const [id, o] of Object.entries(rtdbOrders)) {
      if (o && !memoryOrders.has(id)) {
        allOrders.push({ id, ...o });
      }
    }
  }

  return allOrders
    .filter((o) => o.branchId === sucursalId && statuses.includes(o.status))
    .sort((a, b) => {
      const tA = a.createdAt?.toMillis?.() || a.createdAt || 0;
      const tB = b.createdAt?.toMillis?.() || b.createdAt || 0;
      return tB - tA;
    });
}

export async function getOrderItems(orderId: string) {
  if (adminDb) {
    try {
      const snap = await adminDb.collection(PEDIDOS).doc(orderId).collection('items').get();
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
    } catch (err) {
      console.warn('[Orders getOrderItems Firestore Error]:', err);
    }
  }

  const items = memoryOrderItems.get(orderId);
  if (items) return items;

  const order = memoryOrders.get(orderId) || (await readRtdb(`pedidos/${orderId}`));
  if (order?._items) {
    return order._items.map((i: any, idx: number) => ({
      id: `item-${idx}`,
      orderId,
      productId: i.productId || i.id,
      productName: i.name || i.nombre || 'Producto',
      productImage: i.image || i.imagen || '',
      quantity: i.quantity || i.cantidad || 1,
      unitPrice: i.price || i.precio || 0,
      subtotal: (i.price || i.precio || 0) * (i.quantity || i.cantidad || 1),
    }));
  }

  return [];
}

export async function validateOrderPayment(
  orderId: string,
  deliveryUid: string,
  deliveryNombre: string,
  empresaDeliveryId: string,
  pago: { metodo: string; monto: number; referencia?: string; billeteConElQuePaga?: number }
) {
  if (adminDb) {
    try {
      const ref = adminDb.collection(PEDIDOS).doc(orderId);
      return await adminDb.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists) throw new Error('Pedido no encontrado');
        const data = snap.data()!;

        if (!['pendiente', 'en_preparacion', 'listo_para_entrega'].includes(data.status)) {
          throw new Error(`Pedido no disponible para validación (estado actual: ${data.status})`);
        }

        if (Math.abs(pago.monto - (data.total || 0)) > 0.5) {
          throw new Error(`Monto incorrecto: pagado C$ ${pago.monto}, total C$ ${data.total}`);
        }

        const updates = {
          status: 'comprado',
          pago,
          deliveryNombre,
          validadoPor: deliveryUid,
          empresaDeliveryId,
          validadoAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        };

        tx.update(ref, updates);
        return { id: orderId, ...data, ...updates };
      });
    } catch (err: any) {
      if (err.message?.includes('no disponible para validación') || err.message?.includes('Monto incorrecto')) {
        throw err;
      }
      console.warn('[Orders validateOrderPayment Firestore Error]:', err);
    }
  }

  // Fallback RTDB / Memoria
  const order = memoryOrders.get(orderId) || (await readRtdb(`pedidos/${orderId}`));
  if (!order) throw new Error('Pedido no encontrado');

  if (!['pendiente', 'en_preparacion', 'listo_para_entrega'].includes(order.status)) {
    throw new Error(`Pedido no disponible para validación (estado actual: ${order.status})`);
  }

  if (Math.abs(pago.monto - (order.total || 0)) > 0.5) {
    throw new Error(`Monto incorrecto: pagado C$ ${pago.monto}, total C$ ${order.total}`);
  }

  const updates = {
    status: 'comprado',
    pago,
    deliveryNombre,
    validadoPor: deliveryUid,
    empresaDeliveryId,
    validadoAt: Date.now(),
    updatedAt: Date.now(),
  };

  const updatedOrder = { ...order, ...updates };
  memoryOrders.set(orderId, updatedOrder);
  try {
    await writeRtdb(`pedidos/${orderId}`, updatedOrder);
  } catch {}

  return { id: orderId, ...updatedOrder };
}
