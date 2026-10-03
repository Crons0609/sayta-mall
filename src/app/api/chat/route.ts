// src/app/api/chat/route.ts
// API Route para mensajería interna entre empleados y equipo administrativo.

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserFromRequest } from '@/lib/auth/serverAuth';
import { getChatMessages, saveChatMessage, DEFAULT_CHANNELS, type ChatMessage } from '@/lib/firebase/chat';
import { buildDirectChannelId } from '@/lib/firebase/chat-types';
import { getEmployeesFromRtdb, getOwnersFromRtdb, readRtdb, writeRtdb } from '@/lib/firebase/rtdb';
import { getProgrammersFromDb } from '@/lib/firebase/programmers';
import { localEmployees } from '@/app/api/employees/route';
import { INITIAL_EMPLOYEES } from '@/data/mockEmployees';
import { mockOwnersStore } from '@/app/api/owners/route';

export async function GET(request: NextRequest) {
  try {
    const userInfo = await getAuthenticatedUserFromRequest(request);
    if (!userInfo) {
      return NextResponse.json({ error: 'No autenticado para acceder al chat.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId') || 'general';

    // 1. Obtener mensajes del canal activo
    const messages = await getChatMessages(channelId, 100);

    // 2. Registrar presencia/latido del usuario actual en RTDB (keepalive activo)
    const userCleanKey = (userInfo.email || userInfo.userId || 'anon')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '_');
    writeRtdb(`presence/${userCleanKey}`, {
      lastSeen: Date.now(),
      email: userInfo.email || '',
      displayName: userInfo.displayName || 'Colaborador',
      role: userInfo.role || 'employee',
      isOnline: true,
    }).catch(() => {});

    // 3. Leer presencias y metadatos de canales DM en paralelo
    const [presenceMap, dmMetaMap] = await Promise.all([
      readRtdb<Record<string, { lastSeen?: number; isOnline?: boolean }>>('presence').catch(() => null),
      readRtdb<Record<string, { lastMessage?: string; lastTime?: string; lastSenderEmail?: string }>>('dm_meta').catch(() => null),
    ]);

    // 4. Obtener todos los colaboradores del equipo (Empleados, Jefes/Dueños y Programadores)
    const contactsMap = new Map<string, any>();

    // 4.1 Empleados
    try {
      const rtdbEmployees = await getEmployeesFromRtdb();
      const allEmps = [...(rtdbEmployees || []), ...(localEmployees || []), ...(INITIAL_EMPLOYEES || [])];
      allEmps.forEach((e) => {
        const emailKey = (e.email || e.id || '').toLowerCase().trim();
        if (emailKey && !contactsMap.has(emailKey)) {
          contactsMap.set(emailKey, {
            id: e.id || emailKey,
            email: e.email || '',
            displayName: e.displayName || e.name || emailKey.split('@')[0],
            area: e.area || 'Ventas',
            role: 'employee',
            branchName: e.branchName || 'Sucursal Principal',
          });
        }
      });
    } catch {}

    // 4.2 Dueños / Jefes
    try {
      const rtdbOwners = await getOwnersFromRtdb();
      const allOwners = [...(rtdbOwners || []), ...(mockOwnersStore || [])];
      allOwners.forEach((o) => {
        const emailKey = (o.email || o.id || '').toLowerCase().trim();
        if (emailKey && !contactsMap.has(emailKey)) {
          contactsMap.set(emailKey, {
            id: o.id || o.uid || emailKey,
            email: o.email || '',
            displayName: o.name || o.displayName || emailKey.split('@')[0],
            area: 'Gerencia',
            role: 'owner',
            branchName: o.storeName || 'Sayta Mall',
          });
        }
      });
    } catch {}

    // 4.3 Programadores
    try {
      const dbProgs = await getProgrammersFromDb();
      dbProgs.forEach((p) => {
        const emailKey = (p.email || p.id || '').toLowerCase().trim();
        if (emailKey && !contactsMap.has(emailKey)) {
          contactsMap.set(emailKey, {
            id: p.id || emailKey,
            email: p.email || '',
            displayName: p.name || 'Programador',
            area: 'Sistemas',
            role: 'programmer',
            branchName: 'Sede Central',
          });
        }
      });
    } catch {}

    // 5. Enriquecer contactos con estado en línea real y último mensaje recibido
    const now = Date.now();
    const myEmail = (userInfo.email || '').toLowerCase().trim();

    const sanitizedContacts = Array.from(contactsMap.values()).map((c) => {
      const cKey = (c.email || c.id).toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
      const pres = presenceMap ? presenceMap[cKey] : null;
      // Considerar "En línea" si su latido ocurrió en los últimos 75 segundos
      const isOnline = Boolean(pres && pres.lastSeen && now - pres.lastSeen < 75_000);

      // Metadatos de la conversación DM entre este contacto y el usuario actual
      const dmChannelId = buildDirectChannelId(userInfo, c);
      const meta = dmMetaMap ? dmMetaMap[dmChannelId] : null;

      let lastMessage = '';
      let lastMessageTime = '';
      let hasUnread = false;

      if (meta) {
        lastMessage = meta.lastMessage || '';
        lastMessageTime = meta.lastTime || '';
        if (meta.lastSenderEmail && myEmail) {
          hasUnread = meta.lastSenderEmail.toLowerCase() !== myEmail;
        }
      }

      return {
        ...c,
        isOnline,
        lastSeen: pres?.lastSeen || null,
        lastMessage,
        lastMessageTime,
        hasUnread,
      };
    });

    return NextResponse.json({
      success: true,
      channelId,
      messages,
      channels: DEFAULT_CHANNELS,
      contacts: sanitizedContacts,
    });
  } catch (error: any) {
    console.error('[API Chat GET]', error);
    return NextResponse.json({ error: 'Error cargando mensajes del chat.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userInfo = await getAuthenticatedUserFromRequest(request);
    if (!userInfo) {
      return NextResponse.json({ error: 'No autenticado para enviar mensajes.' }, { status: 401 });
    }

    const body = await request.json();
    const { channelId = 'general', text, type = 'text', senderArea } = body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'El mensaje no puede estar vacío.' }, { status: 400 });
    }

    const cleanText = text.trim();
    const nowIso = new Date().toISOString();

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      channelId,
      senderId: userInfo.userId,
      senderName: userInfo.displayName || 'Colaborador',
      senderRole: userInfo.role,
      senderArea: senderArea || request.cookies.get('sayta_user_area')?.value || 'general',
      text: cleanText,
      type,
      createdAt: nowIso,
    };

    await saveChatMessage(newMessage);

    // Si es un canal privado (DM), persistir metadatos para vista de bandeja de entrada y badge de no leídos
    if (channelId.startsWith('dm_')) {
      writeRtdb(`dm_meta/${channelId}`, {
        channelId,
        lastMessage: cleanText,
        lastSenderId: userInfo.userId,
        lastSenderEmail: userInfo.email || '',
        lastSenderName: userInfo.displayName || 'Colaborador',
        lastTime: nowIso,
      }).catch(() => {});
    }

    // Actualizar latido de presencia
    const userCleanKey = (userInfo.email || userInfo.userId || 'anon')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '_');
    writeRtdb(`presence/${userCleanKey}`, {
      lastSeen: Date.now(),
      email: userInfo.email || '',
      displayName: userInfo.displayName || 'Colaborador',
      role: userInfo.role || 'employee',
      isOnline: true,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: newMessage,
    });
  } catch (error: any) {
    console.error('[API Chat POST]', error);
    return NextResponse.json({ error: 'Error enviando el mensaje.' }, { status: 500 });
  }
}
