// src/lib/firebase/conversations.ts - Server-side only (Admin SDK)
import 'server-only';
import { adminDb } from './admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { MissingItemRecord, CustomerDecision, ActionButton } from '@/types/message.types';

const CONVERSACIONES = 'conversaciones';
const PEDIDOS = 'pedidos';
const AUDITORIA = 'auditoria';

/**
 * Sanitiza texto simple para evitar HTML o scripts en los mensajes
 */
export function sanitizeMessageText(text: string): string {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '') // Quita tags HTML
    .trim()
    .slice(0, 1000); // Limita longitud
}

/**
 * Registra un evento en auditoría
 */
export async function logAudit(evento: string, detalles: any, usuarioId?: string) {
  try {
    await adminDb.collection(AUDITORIA).add({
      evento,
      detalles,
      usuarioId: usuarioId || 'sistema',
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.error('[Audit Log Error]', err);
  }
}

/**
 * Crea o recupera la conversación de un pedido y envía el aviso de faltante(s)
 */
export async function createMissingItemsAlert(
  orderId: string,
  faltantes: MissingItemRecord[],
  empleado: { uid: string; name: string }
) {
  const orderRef = adminDb.collection(PEDIDOS).doc(orderId);
  const snap = await orderRef.get();
  if (!snap.exists) throw new Error('Pedido no encontrado');
  const orderData = snap.data()!;

  // 1. Crear o buscar conversación vinculada al pedido
  const convQuery = await adminDb
    .collection(CONVERSACIONES)
    .where('pedido_id', '==', orderId)
    .limit(1)
    .get();

  let convRef: FirebaseFirestore.DocumentReference;
  let convId: string;

  const now = Timestamp.now();

  if (convQuery.empty) {
    convRef = adminDb.collection(CONVERSACIONES).doc();
    convId = convRef.id;
    await convRef.set({
      pedido_id: orderId,
      pedido_order_number: orderData.orderNumber || orderId,
      usuario_id: orderData.customerId,
      cliente_nombre: orderData.cliente?.nombre || orderData.customerName || 'Cliente',
      cliente_telefono: orderData.cliente?.telefono || orderData.customerPhone || '',
      sucursal_id: orderData.branchId,
      sucursal_nombre: orderData.sucursal_nombre || 'Sucursal Sayta Mall',
      tipo: 'pedido',
      estado: 'abierta',
      ultimo_mensaje: 'Aviso importante: Producto(s) no disponibles',
      ultimo_mensaje_at: now,
      no_leidos_cliente: 1,
      no_leidos_personal: 0,
      pedido_estado: 'en_espera_cliente',
      empleado_responsable_id: empleado.uid,
      empleado_responsable_nombre: empleado.name,
      created_at: now,
      updated_at: now,
    });
  } else {
    convRef = convQuery.docs[0].ref;
    convId = convRef.id;
    await convRef.update({
      estado: 'abierta',
      pedido_estado: 'en_espera_cliente',
      ultimo_mensaje: 'Aviso importante: Producto(s) no disponibles',
      ultimo_mensaje_at: now,
      no_leidos_cliente: FieldValue.increment(1),
      empleado_responsable_id: empleado.uid,
      empleado_responsable_nombre: empleado.name,
      updated_at: now,
    });
  }

  // 2. Construir mensaje agrupado si falta más de un producto
  const itemsText = faltantes
    .map((f) => {
      const motivoLabel =
        f.motivo === 'agotado'
          ? 'Agotado en sucursal'
          : f.motivo === 'dañado'
          ? 'Unidad dañada/averiada'
          : 'Diferencia de inventario';
      let extra = `• ${f.productName}: Faltan ${f.cantidadFaltante} de ${f.cantidadOriginal} (${motivoLabel})`;
      if (f.sustitutoSugerido) {
        extra += `\n  ↳ Sugerencia alternativa: ${f.sustitutoSugerido.name} (C$ ${f.sustitutoSugerido.price} NIO)`;
      }
      return extra;
    })
    .join('\n');

  const contenidoMensaje =
    `Hola ${orderData.cliente?.nombre || orderData.customerName || ''}. Al preparar tu orden #${orderData.orderNumber}, notamos que no contamos con stock suficiente de lo siguiente:\n\n` +
    `${itemsText}\n\n` +
    `Por favor indícanos cómo deseas proceder con tu pedido tocando una de las siguientes opciones:`;

  const acciones: ActionButton[] = [
    {
      id: 'continue_without',
      label: 'Continuar sin los productos faltantes',
      decision: 'sin_producto',
      estilo: 'primary',
      datos: { faltantes },
    },
  ];

  const tieneSustituto = faltantes.some((f) => f.sustitutoSugerido);
  if (tieneSustituto) {
    acciones.push({
      id: 'substitute',
      label: 'Aceptar sustitutos sugeridos',
      decision: 'sustituido',
      estilo: 'secondary',
      datos: { faltantes },
    });
  }

  acciones.push(
    {
      id: 'wait_stock',
      label: 'Esperar a que surtan stock',
      decision: 'esperar',
      estilo: 'warning',
    },
    {
      id: 'cancel_order',
      label: 'Cancelar el pedido completo',
      decision: 'cancelado',
      estilo: 'danger',
    }
  );

  // 3. Insertar mensaje del sistema en la subcolección
  const msgRef = convRef.collection('mensajes').doc();
  await msgRef.set({
    conversacion_id: convId,
    emisor_id: empleado.uid,
    emisor_nombre: `Sistema · ${empleado.name}`,
    emisor_rol: 'sistema',
    tipo: 'accion',
    contenido: contenidoMensaje,
    acciones,
    estado: 'enviado',
    created_at: now,
  });

  // 4. Actualizar pedido en Firestore (pausar y bloquear para delivery)
  await orderRef.update({
    status: 'en_espera_cliente',
    faltantes,
    espera_cliente_desde: now,
    total_original: orderData.total_original ?? orderData.total,
    conversacion_id: convId,
    updatedAt: now,
  });

  // 5. Registrar en auditoría
  await logAudit(
    'pedido_faltante_marcado',
    { orderId, orderNumber: orderData.orderNumber, faltantes, empleadoId: empleado.uid },
    empleado.uid
  );

  return { conversationId: convId, messageId: msgRef.id };
}

/**
 * Envía un mensaje en una conversación
 */
export async function sendChatMessage(
  conversationId: string,
  sender: { id: string; name: string; role: 'cliente' | 'empleado' | 'sistema' },
  contenido: string,
  tipo: 'texto' | 'imagen' | 'sistema' | 'accion' = 'texto',
  acciones?: ActionButton[],
  imagenUrl?: string
) {
  const convRef = adminDb.collection(CONVERSACIONES).doc(conversationId);
  const snap = await convRef.get();
  if (!snap.exists) throw new Error('Conversación no encontrada');

  const now = Timestamp.now();
  const cleanText = sanitizeMessageText(contenido);

  const msgRef = convRef.collection('mensajes').doc();
  const msgData = {
    conversacion_id: conversationId,
    emisor_id: sender.id,
    emisor_nombre: sender.name,
    emisor_rol: sender.role,
    tipo,
    contenido: cleanText,
    imagen_url: imagenUrl || null,
    acciones: acciones || null,
    estado: 'enviado',
    created_at: now,
  };
  await msgRef.set(msgData);

  // Incrementar no leídos del otro lado
  const unreadField =
    sender.role === 'cliente' ? 'no_leidos_personal' : 'no_leidos_cliente';

  await convRef.update({
    ultimo_mensaje: cleanText || (tipo === 'imagen' ? '📷 Imagen' : 'Nuevo mensaje'),
    ultimo_mensaje_at: now,
    [unreadField]: FieldValue.increment(1),
    updated_at: now,
  });

  return { id: msgRef.id, ...msgData };
}

/**
 * Marca una conversación como leída
 */
export async function markConversationAsRead(
  conversationId: string,
  readerRole: 'cliente' | 'personal'
) {
  const convRef = adminDb.collection(CONVERSACIONES).doc(conversationId);
  const fieldToReset =
    readerRole === 'cliente' ? 'no_leidos_cliente' : 'no_leidos_personal';
  await convRef.update({
    [fieldToReset]: 0,
    updated_at: FieldValue.serverTimestamp(),
  });
}

/**
 * Aplica la decisión del cliente sobre el pedido en el servidor y recalcula totales
 */
export async function applyCustomerDecisionOnOrder(
  orderId: string,
  decision: CustomerDecision,
  customerId: string
) {
  const orderRef = adminDb.collection(PEDIDOS).doc(orderId);

  return await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(orderRef);
    if (!snap.exists) throw new Error('Pedido no encontrado');
    const orderData = snap.data()!;

    if (orderData.customerId !== customerId) {
      throw new Error('No autorizado para modificar este pedido');
    }

    if (orderData.status !== 'en_espera_cliente') {
      throw new Error(`El pedido ya no está en espera (estado actual: ${orderData.status})`);
    }

    const itemsSnap = await tx.get(orderRef.collection('items'));
    const items = itemsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const faltantes: MissingItemRecord[] = orderData.faltantes || [];
    const now = Timestamp.now();

    // ── CASO 1: CANCELAR PEDIDO ──
    if (decision === 'cancelado') {
      tx.update(orderRef, {
        status: 'cancelado',
        canceladoAt: now,
        canceladoPor: customerId,
        motivoCancelacion: 'Cancelado por el cliente debido a productos faltantes',
        updatedAt: now,
      });

      // Actualizar conversación
      if (orderData.conversacion_id) {
        const convRef = adminDb.collection(CONVERSACIONES).doc(orderData.conversacion_id);
        tx.update(convRef, {
          estado: 'cerrada',
          pedido_estado: 'cancelado',
          ultimo_mensaje: 'El cliente canceló el pedido.',
          ultimo_mensaje_at: now,
          updated_at: now,
        });
      }

      await logAudit(
        'pedido_cancelado_por_cliente',
        { orderId, orderNumber: orderData.orderNumber, decision },
        customerId
      );

      return {
        success: true,
        orderId,
        newStatus: 'cancelado',
        message: 'Pedido cancelado correctamente y stock liberado.',
      };
    }

    // ── CASO 2: ESPERAR STOCK ──
    if (decision === 'esperar') {
      tx.update(orderRef, {
        decision_cliente: 'esperar',
        staffNotes: `El cliente eligió esperar disponibilidad de stock (${now.toDate().toLocaleDateString()})`,
        updatedAt: now,
      });

      if (orderData.conversacion_id) {
        const convRef = adminDb.collection(CONVERSACIONES).doc(orderData.conversacion_id);
        tx.update(convRef, {
          ultimo_mensaje: 'El cliente eligió esperar stock.',
          ultimo_mensaje_at: now,
          updated_at: now,
        });
      }

      return {
        success: true,
        orderId,
        newStatus: 'en_espera_cliente',
        message: 'Hemos notificado al equipo que prefieres esperar disponibilidad.',
      };
    }

    // ── CASO 3: CONTINUAR SIN EL PRODUCTO O SUSTITUIR ──
    let newSubtotal = 0;
    let totalItemsCount = 0;

    for (const itemDoc of itemsSnap.docs) {
      const itemData: any = itemDoc.data();
      const faltante = faltantes.find((f) => f.productId === itemData.productId);

      if (!faltante) {
        // Ítem sin problema
        newSubtotal += itemData.subtotal;
        totalItemsCount += itemData.quantity;
      } else {
        if (decision === 'sin_producto') {
          // Descontar la cantidad faltante
          const remainingQty = Math.max(0, itemData.quantity - faltante.cantidadFaltante);
          if (remainingQty === 0) {
            tx.update(itemDoc.ref, {
              quantity: 0,
              subtotal: 0,
              estado_item: 'eliminado',
              motivo_faltante: faltante.motivo,
            });
          } else {
            const newSub = remainingQty * itemData.unitPrice;
            newSubtotal += newSub;
            totalItemsCount += remainingQty;
            tx.update(itemDoc.ref, {
              quantity: remainingQty,
              subtotal: newSub,
              estado_item: 'faltante',
              motivo_faltante: faltante.motivo,
            });
          }
        } else if (decision === 'sustituido' && faltante.sustitutoSugerido) {
          // Sustituir por el producto alternativo
          const subst = faltante.sustitutoSugerido;
          const newSub = itemData.quantity * subst.price;
          newSubtotal += newSub;
          totalItemsCount += itemData.quantity;

          tx.update(itemDoc.ref, {
            productId: subst.productId,
            productName: subst.name,
            productImage: subst.image || itemData.productImage,
            unitPrice: subst.price,
            subtotal: newSub,
            estado_item: 'sustituido',
            sustituto_producto_id: subst.productId,
          });
        }
      }
    }

    // Si el pedido quedó sin artículos -> Auto cancelar
    if (totalItemsCount <= 0) {
      tx.update(orderRef, {
        status: 'cancelado',
        canceladoAt: now,
        canceladoPor: 'sistema',
        motivoCancelacion: 'Cancelado automáticamente: no quedaron productos disponibles en el pedido',
        subtotal: 0,
        total: 0,
        updatedAt: now,
      });

      if (orderData.conversacion_id) {
        const convRef = adminDb.collection(CONVERSACIONES).doc(orderData.conversacion_id);
        tx.update(convRef, {
          estado: 'cerrada',
          pedido_estado: 'cancelado',
          ultimo_mensaje: 'Pedido cancelado automáticamente al no haber productos disponibles.',
          ultimo_mensaje_at: now,
          updated_at: now,
        });
      }

      return {
        success: true,
        orderId,
        newStatus: 'cancelado',
        message: 'El pedido fue cancelado ya que no contiene más artículos disponibles.',
      };
    }

    // Recalcular total con delivery y descuento
    const deliveryFee = orderData.deliveryFee || 0;
    const discount = orderData.discount || 0;
    const newTotal = Math.max(0, newSubtotal - discount + deliveryFee);

    tx.update(orderRef, {
      status: 'en_preparacion',
      decision_cliente: decision,
      subtotal: newSubtotal,
      total: newTotal,
      total_ajustado: newTotal,
      faltantes: faltantes.map((f) => ({ ...f, resuelto: true, decisionCliente: decision })),
      updatedAt: now,
    });

    if (orderData.conversacion_id) {
      const convRef = adminDb.collection(CONVERSACIONES).doc(orderData.conversacion_id);
      tx.update(convRef, {
        pedido_estado: 'en_preparacion',
        ultimo_mensaje: `Decisión registrada: ${
          decision === 'sin_producto' ? 'Continuar sin faltante' : 'Sustituir producto'
        }. Total actualizado: C$ ${newTotal} NIO.`,
        ultimo_mensaje_at: now,
        updated_at: now,
      });
    }

    await logAudit(
      'pedido_decision_cliente_aplicada',
      {
        orderId,
        decision,
        nuevoSubtotal: newSubtotal,
        nuevoTotal: newTotal,
        totalOriginal: orderData.total,
      },
      customerId
    );

    return {
      success: true,
      orderId,
      newStatus: 'en_preparacion',
      newTotal,
      message: `Total recalculado en C$ ${newTotal.toLocaleString('es-NI')} NIO. Pedido en preparación.`,
    };
  });
}
