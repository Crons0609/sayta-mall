// src/app/api/orders/[id]/missing/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { createMissingItemsAlert } from '@/lib/firebase/conversations';
import type { MissingItemRecord } from '@/types/message.types';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const role = (decoded.role as string) || (decoded.rol as string);

    // Solo personal o administradores pueden reportar faltantes
    if (!['employee', 'empleado', 'owner', 'dueno', 'programmer', 'programador', 'jefe'].includes(role)) {
      return NextResponse.json({ error: 'Acceso denegado: se requiere rol de personal' }, { status: 403 });
    }

    const body = await req.json();
    const faltantes = body.faltantes as MissingItemRecord[];

    if (!Array.isArray(faltantes) || faltantes.length === 0) {
      return NextResponse.json({ error: 'Se requiere al menos un producto faltante' }, { status: 400 });
    }

    const result = await createMissingItemsAlert(id, faltantes, {
      uid: decoded.uid,
      name: decoded.name || decoded.email?.split('@')[0] || 'Personal de Tienda',
    });

    return NextResponse.json({
      success: true,
      message: 'Faltantes registrados. Pedido en espera del cliente.',
      conversationId: result.conversationId,
      messageId: result.messageId,
    });
  } catch (error: any) {
    console.error('Error en /api/orders/[id]/missing:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
