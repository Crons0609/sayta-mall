// src/lib/firebase/chat.ts
// Gestión de mensajes y canales del Chat Corporativo de Empleados en Realtime Database.

import { readRtdb, writeRtdb } from './rtdb';

export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderRole: string; // 'employee', 'owner', 'programmer'
  senderArea?: string; // 'caja', 'bodega', 'ferreteria', etc.
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
 * Guarda un mensaje en el canal correspondiente
 */
export async function saveChatMessage(message: ChatMessage): Promise<boolean> {
  const channelId = message.channelId || 'general';
  const messageId = message.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  return writeRtdb(`chats/${channelId}/${messageId}`, { ...message, id: messageId });
}

/**
 * Obtiene los mensajes de un canal ordenados cronológicamente
 */
export async function getChatMessages(channelId: string, limit: number = 60): Promise<ChatMessage[]> {
  const data = await readRtdb<Record<string, ChatMessage>>(`chats/${channelId}`);
  if (!data) return [];

  return Object.values(data)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(-limit);
}
