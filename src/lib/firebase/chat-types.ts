// src/lib/firebase/chat-types.ts
// Tipos y constantes del Chat -- SEGUROS para cliente y servidor.
// NO importar aquí ningún módulo de servidor (firebase-admin, server-only, etc.)

export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderArea?: string;
  text: string;
  type?: 'text' | 'urgent' | 'shift' | 'stock_alert';
  createdAt: string;
}

export interface ChatChannel {
  id: string;
  name: string;
  description: string;
  isDirect?: boolean;
  targetUserId?: string;
  targetUserName?: string;
  badge?: string;
  iconName?: string;
}

// Canales predeterminados de la empresa
export const DEFAULT_CHANNELS: ChatChannel[] = [
  {
    id: 'general',
    name: '📢 Sala General del Equipo',
    description: 'Comunicaciones globales, avisos y anuncios para todo el personal.',
    badge: 'Todos',
  },
  {
    id: 'ferreteria',
    name: '🔧 Ferretería & Mostrador',
    description: 'Consultas de herramientas, precios, especificaciones y clientes en tienda.',
    badge: 'Área',
  },
  {
    id: 'caja',
    name: '💳 Caja & Facturación',
    description: 'Arqueos, comprobantes de pago, tickets y confirmación de retiros.',
    badge: 'Área',
  },
  {
    id: 'bodega',
    name: '📦 Bodega & Despacho',
    description: 'Control de existencias, recepción de paquetes y pedidos listos para entrega.',
    badge: 'Área',
  },
];

/**
 * Genera un ID de canal 1 a 1 determinista y bidireccional.
 * Prioriza el correo electrónico (es 100% idéntico en todos los dispositivos y sesiones).
 */
export function buildDirectChannelId(
  userA: { id?: string; email?: string } | string,
  userB: { id?: string; email?: string } | string
): string {
  const getKey = (u: { id?: string; email?: string } | string): string => {
    if (!u) return 'unknown';
    if (typeof u === 'string') {
      return u.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
    }
    const val = u.email || u.id || 'unknown';
    return val.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
  };

  const keyA = getKey(userA);
  const keyB = getKey(userB);
  const sorted = [keyA, keyB].sort();
  return `dm_${sorted[0]}__${sorted[1]}`;
}

