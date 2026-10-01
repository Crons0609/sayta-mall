// src/app/api/messages/[id]/route.ts
// Gestión de mensajes dentro de una conversación específica.
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { sendChatMessage, markConversationAsRead } from '@/lib/firebase/conversations';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace('Bearer ', '');
    if (!idToken) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const decoded: any = await adminAuth.verifyIdToken(idToken);
    const { id: conversationId } = await params;

    const convRef = adminDb.collection('conversaciones').doc(conversationId);
    const convSnap = await convRef.get();
    if (!convSnap.exists) {
      return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 });
    }

    const convData = convSnap.data()!;
    const isStaff = ['employee', 'owner', 'programmer'].includes(decoded.role || decoded.rol || '');
    if (!isStaff && convData.usuario_id !== decoded.uid) {
      return NextResponse.json({ error: 'No tienes acceso a esta conversación' }, { status: 403 });
    }

    const msgSnap = await convRef.collection('mensajes').orderBy('created_at', 'asc').get();
    const messages = msgSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    return NextResponse.json({
      success: true,
      conversation: { id: convSnap.id, ...convData },
      messages,
    });
  } catch (err: any) {
    console.error('[Messages Detail GET]', err);
    return NextResponse.json({ error: err.message || 'Error al obtener mensajes' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace('Bearer ', '');
    if (!idToken) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const decoded: any = await adminAuth.verifyIdToken(idToken);
    const { id: conversationId } = await params;
    const body = await req.json();
    const { contenido, tipo = 'texto', imagenUrl } = body;

    if (!contenido && !imagenUrl) {
      return NextResponse.json({ error: 'El mensaje no puede estar vacío' }, { status: 400 });
    }

    const isStaff = ['employee', 'owner', 'programmer'].includes(decoded.role || decoded.rol || '');
    const senderRole = isStaff ? 'empleado' : 'cliente';
    const senderName = decoded.name || decoded.email || (isStaff ? 'Personal' : 'Cliente');

    const msg = await sendChatMessage(
      conversationId,
      { id: decoded.uid, name: senderName, role: senderRole },
      contenido || '',
      tipo,
      undefined,
      imagenUrl
    );

    return NextResponse.json({ success: true, message: msg });
  } catch (err: any) {
    console.error('[Messages Detail POST]', err);
    return NextResponse.json({ error: err.message || 'Error al enviar mensaje' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace('Bearer ', '');
    if (!idToken) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const decoded: any = await adminAuth.verifyIdToken(idToken);
    const { id: conversationId } = await params;
    const isStaff = ['employee', 'owner', 'programmer'].includes(decoded.role || decoded.rol || '');

    await markConversationAsRead(conversationId, isStaff ? 'personal' : 'cliente');

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Messages Detail PATCH]', err);
    return NextResponse.json({ error: err.message || 'Error' }, { status: 500 });
  }
}