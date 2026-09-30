// src/app/api/chat/route.ts
// API Route para mensajería interna entre empleados y equipo administrativo.

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserFromRequest } from '@/lib/auth/serverAuth';
import { getChatMessages, saveChatMessage, DEFAULT_CHANNELS, type ChatMessage } from '@/lib/firebase/chat';
import { getEmployeesFromRtdb } from '@/lib/firebase/rtdb';
import { localEmployees } from '@/app/api/employees/route';
import { INITIAL_EMPLOYEES } from '@/data/mockEmployees';

export async function GET(request: NextRequest) {
  try {
    const userInfo = await getAuthenticatedUserFromRequest(request);
    if (!userInfo) {
      return NextResponse.json({ error: 'No autenticado para acceder al chat.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId') || 'general';

    // 1. Obtener mensajes del canal
    const messages = await getChatMessages(channelId, 100);

    // 2. Obtener lista de colaboradores para mensajes directos
    let allEmployees: any[] = [];
    try {
      const rtdbEmployees = await getEmployeesFromRtdb();
      allEmployees = [...(rtdbEmployees || [])];
    } catch {}

    const extraSources = [...(localEmployees || []), ...(INITIAL_EMPLOYEES || [])];
    extraSources.forEach((emp) => {
      if (!allEmployees.some((e) => e.id === emp.id || (e.email && emp.email && e.email.toLowerCase() === emp.email.toLowerCase()))) {
        allEmployees.push(emp);
      }
    });

    const sanitizedContacts = allEmployees.map((e) => ({
      id: e.id,
      displayName: e.displayName || e.email?.split('@')[0] || 'Compañero',
      area: e.area || 'general',
      role: e.role || 'employee',
      branchName: e.branchName || 'Sucursal Principal',
    }));

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

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      channelId,
      senderId: userInfo.userId,
      senderName: userInfo.displayName || 'Colaborador',
      senderRole: userInfo.role,
      senderArea: senderArea || request.cookies.get('sayta_user_area')?.value || 'general',
      text: text.trim(),
      type,
      createdAt: new Date().toISOString(),
    };

    await saveChatMessage(newMessage);

    return NextResponse.json({
      success: true,
      message: newMessage,
    });
  } catch (error: any) {
    console.error('[API Chat POST]', error);
    return NextResponse.json({ error: 'Error enviando el mensaje.' }, { status: 500 });
  }
}
