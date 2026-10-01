// src/lib/whatsapp-order.ts
// Generador y formateador de mensajes para pedidos vía WhatsApp con empresas de Delivery.

import { DeliveryOrder } from '@/types/delivery.types';

/**
 * Limpia y normaliza el número de WhatsApp para usar en https://wa.me/
 * Ej: "+505 8888-1234" -> "50588881234"
 */
export function sanitizeWhatsAppNumber(phone: string): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

/**
 * Genera el mensaje amigable y personalizado del pedido para enviar al delivery.
 * Formato exacto solicitado por el negocio.
 */
export function generateWhatsAppOrderMessage(order: DeliveryOrder): string {
  // Lista de productos en formato "X nombre del producto"
  const itemsList = order.items
    .map((item) => `${item.quantity} ${item.name}`)
    .join('\n');

  const sucursalNombre = order.sucursal_nombre || 'nuestra tienda';

  const lines = [
    `¡Hola! Soy ${order.cliente.nombre} y quisiera hacer el siguiente pedido en la sucursal ${sucursalNombre}:`,
    ``,
    `📋 *Lista de compras:*`,
    itemsList,
    ``,
    `📍 *Dirección de entrega:* ${order.cliente.direccion}`,
  ];

  // Campos opcionales
  if (order.cliente.referencias) {
    lines.push(`🏠 *Referencias:* ${order.cliente.referencias}`);
  }
  if (order.cliente.ciudad) {
    lines.push(`🌆 *Ciudad / Barrio:* ${order.cliente.ciudad}`);
  }
  if (order.cliente.notas) {
    lines.push(`📝 *Instrucciones:* ${order.cliente.notas}`);
  }
  if (order.cliente.telefono) {
    lines.push(`📞 *Mi teléfono:* ${order.cliente.telefono}`);
  }

  lines.push(``);
  lines.push(`¡Muchas gracias! 😊`);

  return lines.join('\n');
}

/**
 * Genera el enlace directo listo para abrir WhatsApp
 */
export function buildWhatsAppOrderUrl(order: DeliveryOrder): string {
  const cleanPhone = sanitizeWhatsAppNumber(order.empresa_delivery_whatsapp);
  const text = generateWhatsAppOrderMessage(order);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Notificación formal al delivery para que retire el pedido en sucursal y valide con QR
 */
export function buildWhatsAppDeliveryNotification(
  order: any,
  empresa: any,
  items: any[]
): string {
  const cleanPhone = sanitizeWhatsAppNumber(empresa.whatsapp || order.empresaDeliveryWhatsapp);
  const itemsText = (items || [])
    .map((it) => `• ${it.quantity || it.cantidad}x ${it.name || it.nombre}`)
    .join('\n');

  const text = [
    `🛵 *NUEVO PEDIDO SAYTA MALL* 🛵`,
    `━━━━━━━━━━━━━━━━━━`,
    `📦 *Orden:* #${order.orderNumber || order.id?.slice(-6)}`,
    `👤 *Cliente:* ${order.customerName || order.cliente?.nombre || 'Cliente'}`,
    `📞 *Teléfono:* ${order.customerPhone || order.cliente?.telefono || 'No indicado'}`,
    `📍 *Dirección:* ${order.deliveryAddress?.street || order.cliente?.direccion || 'A coordinar'}`,
    order.deliveryAddress?.referencias || order.cliente?.referencias
      ? `🏠 *Referencias:* ${order.deliveryAddress?.referencias || order.cliente?.referencias}`
      : '',
    ``,
    `📋 *Productos para entrega:*`,
    itemsText,
    ``,
    `💰 *Total a liquidar:* C$ ${Number(order.total || 0).toLocaleString('es-NI')} NIO`,
    `━━━━━━━━━━━━━━━━━━`,
    `⚠️ *IMPORTANTE PARA EL REPARTIDOR:*`,
    `Al llegar a la sucursal, solicita escanear el *CÓDIGO QR* en caja para seleccionar al cliente y validar el pago de la compra.`,
    `¡Gracias por tu servicio!`
  ].filter(Boolean).join('\n');

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}
