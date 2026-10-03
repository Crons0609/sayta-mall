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
