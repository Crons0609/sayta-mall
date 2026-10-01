// src/app/api/messages/route.ts
// Lista conversaciones según el rol del usuario autenticado (cliente o empleado/dueño).
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace('Bearer ', '');
    if (!idToken) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const decoded: any = await adminAuth.verifyIdToken(idToken);
    const role = (decoded.role || decoded.rol || 'client') as string;
    const isStaff = ['employee', 'owner', 'programmer'].includes(role);

    const { searchParams } = new URL(req.url);
    const sucursalId = searchParams.get('sucursalId');

    let query: FirebaseFirestore.Query = adminDb.collection('conversaciones');

    if (isStaff && sucursalId) {
      query = query.where('sucursal_id', '==', sucursalId);
    } else if (isStaff && !sucursalId) {
      // Si es personal pero no filtró por sucursal
      query = query.orderBy('ultimo_mensaje_at', 'desc').limit(50);
    } else {
      // Cliente: solo sus propias conversaciones
      query = query.where('usuario_id', '==', decoded.uid);
    }

    const snap = await query.get();
    const conversations = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Ordenar en memoria
    conversations.sort((a: any, b: any) => {
      // Prioridad: pedidos en_espera_cliente van primero para el personal
      if (isStaff) {
        if (a.pedido_estado === 'en_espera_cliente' && b.pedido_estado !== 'en_espera_cliente') return -1;
        if (b.pedido_estado === 'en_espera_cliente' && a.pedido_estado !== 'en_espera_cliente') return 1;
      }
      const tA = a.ultimo_mensaje_at?.toMillis?.() || 0;
      const tB = b.ultimo_mensaje_at?.toMillis?.() || 0;
      return tB - tA;
    });

    return NextResponse.json({ success: true, conversations });
  } catch (err: any) {
    console.error('[Messages GET]', err);
    return NextResponse.json({ error: err.message || 'Error al obtener conversaciones' }, { status: 500 });
  }
}