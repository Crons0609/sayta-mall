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
