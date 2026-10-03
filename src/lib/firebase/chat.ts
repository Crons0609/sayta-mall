// src/lib/firebase/chat.ts
// Funciones de servidor para el Chat Corporativo (SOLO servidor — API Routes).
// Los tipos y constantes están en ./chat-types.ts (cliente+servidor seguros).
import 'server-only';

export type { ChatMessage, ChatChannel } from './chat-types';
export { DEFAULT_CHANNELS } from './chat-types';
import type { ChatMessage } from './chat-types';

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
