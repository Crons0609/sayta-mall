// src/lib/firebase/chat.ts
// Gestión de mensajes y canales del Chat Corporativo de Empleados en Realtime Database.
// Usa el Admin SDK en el servidor para escrituras autenticadas con privilegios de administrador.

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

const RTDB_REST_URL =
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
  'https://saytamall-default-rtdb.firebaseio.com';

/**
 * Guarda un mensaje en el canal correspondiente.
 * Usa el Admin SDK (privilegios totales). Fallback a REST si Admin SDK no está disponible.
 */
export async function saveChatMessage(message: ChatMessage): Promise<boolean> {
  const channelId = message.channelId || 'general';
  const messageId = message.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const path = `chats/${channelId}/${messageId}`;
  const payload = { ...message, id: messageId };

  // Intentar con el Admin SDK del servidor (tiene privilegios totales, sin restricciones de reglas)
  try {
    const { adminRtdb } = await import('@/lib/firebase/admin');
    if (adminRtdb) {
      await adminRtdb.ref(path).set(payload);
      return true;
    }
  } catch (adminErr) {
    console.warn('[Chat] Admin SDK no disponible para escritura, usando REST:', adminErr);
  }

  // Fallback: REST público (funciona si las reglas de RTDB permiten escritura pública)
  try {
    const res = await fetch(`${RTDB_REST_URL}/${path}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error(`[Chat] Error REST al guardar mensaje (${res.status}):`, errText);
    }
    return res.ok;
  } catch (error) {
    console.error(`[Chat] Error guardando mensaje en ${path}:`, error);
    return false;
  }
}

/**
 * Obtiene los mensajes de un canal ordenados cronológicamente.
 * Usa el Admin SDK primero; fallback a REST si no está disponible.
 */
export async function getChatMessages(channelId: string, limit: number = 60): Promise<ChatMessage[]> {
  const path = `chats/${channelId}`;

  // Intentar con el Admin SDK del servidor
  try {
    const { adminRtdb } = await import('@/lib/firebase/admin');
    if (adminRtdb) {
      const snapshot = await adminRtdb.ref(path).get();
      if (!snapshot.exists()) return [];
      const data = snapshot.val() as Record<string, ChatMessage>;
      return Object.values(data)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .slice(-limit);
    }
  } catch (adminErr) {
    console.warn('[Chat] Admin SDK no disponible para lectura, usando REST:', adminErr);
  }

  // Fallback REST
  try {
    const res = await fetch(`${RTDB_REST_URL}/${path}.json`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = (await res.json()) as Record<string, ChatMessage> | null;
    if (!data) return [];
    return Object.values(data)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(-limit);
  } catch (error) {
    console.error(`[Chat] Error leyendo mensajes de ${path}:`, error);
    return [];
  }
}
