// src/app/api/qr/admin/route.ts
// Panel administrativo de Códigos QR para Jefe, Dueño y Programador.
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import {
  getBranchQrConfig,
  rotateBranchQrToken,
  toggleBranchQr,
  getBranchQrScans,
  getOrCreateFixedQrToken,
} from '@/lib/firebase/qr-tokens';

const QR_ADMIN_ROLES = ['owner', 'programmer', 'employee'];

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace('Bearer ', '');
    if (!idToken) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const decoded: any = await adminAuth.verifyIdToken(idToken);
    const role = (decoded.role || decoded.rol || '') as string;
    if (!QR_ADMIN_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Acceso restringido a Jefe, Dueño y Programador' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const specificBranchId = searchParams.get('sucursalId');

    let branchesQuery: FirebaseFirestore.Query = adminDb.collection('branches');
    if (specificBranchId) {
      const singleConfig = await getBranchQrConfig(specificBranchId);
      const scans = await getBranchQrScans(specificBranchId, 20);
      return NextResponse.json({ success: true, config: singleConfig, scans });
    }

    const branchesSnap = await branchesQuery.get();
    const configs = await Promise.all(
      branchesSnap.docs.map(async (doc) => {
        const conf = await getBranchQrConfig(doc.id);
        return conf || { sucursalId: doc.id, sucursalNombre: doc.data().name || doc.id, qrActivo: true, qrModo: 'dinamico' };
      })
    );

    return NextResponse.json({ success: true, configs });
  } catch (err: any) {
    console.error('[QR Admin GET]', err);
    return NextResponse.json({ error: err.message || 'Error cargando configuración QR' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace('Bearer ', '');
    if (!idToken) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const decoded: any = await adminAuth.verifyIdToken(idToken);
    const role = (decoded.role || decoded.rol || '') as string;
    if (!QR_ADMIN_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Acceso restringido a Jefe, Dueño y Programador' }, { status: 403 });
    }

    const body = await req.json();
    const { action, sucursalId } = body;

    if (!sucursalId) {
      return NextResponse.json({ error: 'sucursalId es requerido' }, { status: 400 });
    }

    const operatorName = decoded.name || decoded.email || decoded.uid;

    if (action === 'rotate') {
      const rotated = await rotateBranchQrToken(sucursalId, operatorName);
      return NextResponse.json({
        success: true,
        message: 'Código QR rotado exitosamente. Los tokens anteriores han sido invalidados.',
        token: rotated.token,
      });
    }

    if (action === 'toggle') {
      const { activo } = body;
      await toggleBranchQr(sucursalId, Boolean(activo), operatorName);
      return NextResponse.json({
        success: true,
        message: activo ? 'Código QR de sucursal activado' : 'Código QR de sucursal desactivado',
      });
    }

    if (action === 'update_config') {
      const { qrModo, qrVigenciaSeg, sesionDeliveryMin, geolocalizacionRequerida, radioMetros } = body;
      await adminDb.collection('branches').doc(sucursalId).update({
        ...(qrModo && { qrModo }),
        ...(qrVigenciaSeg && { qrVigenciaSeg: Number(qrVigenciaSeg) }),
        ...(sesionDeliveryMin && { sesionDeliveryMin: Number(sesionDeliveryMin) }),
        ...(geolocalizacionRequerida !== undefined && { geolocalizacionRequerida: Boolean(geolocalizacionRequerida) }),
        ...(radioMetros && { radioMetros: Number(radioMetros) }),
        updatedAt: new Date(),
      });
      return NextResponse.json({ success: true, message: 'Configuración actualizada' });
    }

    if (action === 'scans') {
      const scans = await getBranchQrScans(sucursalId, 50);
      return NextResponse.json({ success: true, scans });
    }

    if (action === 'get_or_create_fixed') {
      const fixed = await getOrCreateFixedQrToken(sucursalId, operatorName);
      return NextResponse.json({ success: true, token: fixed.token });
    }

    return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 });
  } catch (err: any) {
    console.error('[QR Admin POST]', err);
    return NextResponse.json({ error: err.message || 'Error ejecutando acción' }, { status: 500 });
  }
}