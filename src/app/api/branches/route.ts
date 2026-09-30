// src/app/api/branches/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { saveBranchToRtdb, getBranchesFromRtdb, updateBranchInRtdb, deleteBranchFromRtdb } from '@/lib/firebase/rtdb';

export async function GET() {
  try {
    // 1. Obtener de Firebase Realtime Database
    const rtdbBranches = await getBranchesFromRtdb();

    // 2. Si Firebase Admin está activo, combinar con Firestore
    let firestoreBranches: any[] = [];
    if (adminDb) {
      try {
        const snapshot = await adminDb.collection('branches').where('active', '==', true).get();
        firestoreBranches = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      } catch (e) {}
    }

    // Combinar sin duplicados
    const map = new Map<string, any>();
    rtdbBranches.forEach((b) => map.set(b.id, b));
    firestoreBranches.forEach((b) => map.set(b.id, b));

    return NextResponse.json({ success: true, branches: Array.from(map.values()) });
  } catch (error: any) {
    console.error('Error fetching branches:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener sucursales' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      address,
      city = 'chichigalpa',
      phone = '',
      whatsapp = '',
      schedule = 'Lunes a Sábado: 8:00 AM - 6:00 PM',
      currency = 'NIO',
      currencySymbol = 'C$',
      deliveryType = 'both',
      ownerId = 'system_owner',
    } = body;

    if (!name || !address) {
      return NextResponse.json(
        { success: false, error: 'El nombre y la dirección son obligatorios' },
        { status: 400 }
      );
    }

    const branchId = body.id || `branch-${Date.now()}`;

    const branchData = {
      id: branchId,
      name: name.trim(),
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      address: address.trim(),
      city: city.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim(),
      description: `Sucursal ${name.trim()}`,
      currency,
      currencySymbol,
      taxRate: 15,
      taxIncluded: true,
      pickupEnabled: deliveryType === 'pickup' || deliveryType === 'both',
      deliveryEnabled: deliveryType === 'delivery' || deliveryType === 'both',
      schedule: {
        general: schedule,
      },
      ownerId,
      ownerIds: [ownerId],
      active: true,
      isPublic: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Guardar en Firebase Realtime Database
    await saveBranchToRtdb(branchData);

    // 2. Si Firebase Admin Firestore está disponible, respaldar allí también
    if (adminDb) {
      try {
        await adminDb.collection('branches').doc(branchId).set(branchData, { merge: true });
      } catch (e) {
        console.warn('[Branches API] Firestore admin fallback:', e);
      }
    }

    return NextResponse.json({
      success: true,
      branch: branchData,
      message: 'Sucursal guardada exitosamente en Firebase',
    });
  } catch (error: any) {
    console.error('Error creating branch:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno al crear sucursal' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...fields } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID de sucursal requerido' }, { status: 400 });
    }

    // Actualizar en RTDB
    await updateBranchInRtdb(id, fields);

    // Actualizar en Firestore si está disponible
    if (adminDb) {
      try {
        await adminDb.collection('branches').doc(id).update({ ...fields, updatedAt: new Date() });
      } catch (e) {
        console.warn('[Branches API PATCH] Firestore update aviso:', e);
      }
    }

    return NextResponse.json({ success: true, message: 'Sucursal actualizada exitosamente.' });
  } catch (error: any) {
    console.error('[Branches API PATCH] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID de sucursal requerido' }, { status: 400 });
    }

    // Eliminar de RTDB
    await deleteBranchFromRtdb(id);

    // Eliminar de Firestore si está disponible
    if (adminDb) {
      try {
        await adminDb.collection('branches').doc(id).delete();
      } catch (e) {
        console.warn('[Branches API DELETE] Firestore delete aviso:', e);
      }
    }

    return NextResponse.json({ success: true, message: 'Sucursal eliminada exitosamente.' });
  } catch (error: any) {
    console.error('[Branches API DELETE] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
