// src/app/api/owners/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import {
  saveOwnerToRtdb,
  getOwnersFromRtdb,
  updateOwnerInRtdb,
  deleteOwnerFromRtdb,
  getBranchesFromRtdb,
  updateBranchInRtdb,
} from '@/lib/firebase/rtdb';
import crypto from 'crypto';

export interface OwnerRecord {
  id: string;
  name: string;
  email: string;
  storeName: string;
  branchCount: number;
  branchIds?: string[];
  status: 'active' | 'suspended';
  createdAt: string;
  invitationStatus?: 'pending' | 'accepted';
  invitationToken?: string;
  invitationExpiresAt?: string;
  initialPassword?: string;
}

// In-memory fallback if needed (vacío: los dueños reales vienen de RTDB)
export let mockOwnersStore: OwnerRecord[] = [];


// GET: Obtener lista de dueños
export async function GET() {
  try {
    // 1. Obtener sucursales para mapear conteo y asignación
    const rtdbBranches = await getBranchesFromRtdb();
    const branchCountMap: Record<string, { count: number; branchIds: string[] }> = {};
    rtdbBranches.forEach((b) => {
      const oId = b.ownerId || (b.ownerIds && b.ownerIds[0]);
      if (oId) {
        if (!branchCountMap[oId]) {
          branchCountMap[oId] = { count: 0, branchIds: [] };
        }
        branchCountMap[oId].count += 1;
        branchCountMap[oId].branchIds.push(b.id);
      }
    });

    // 2. Obtener dueños desde Firebase RTDB
    const rtdbOwners = await getOwnersFromRtdb();
    const ownersMap = new Map<string, OwnerRecord>();

    // Cargar iniciales / mocks primero
    mockOwnersStore.forEach((o) => {
      const assigned = branchCountMap[o.id];
      ownersMap.set(o.id, {
        ...o,
        branchCount: assigned ? assigned.count : o.branchCount,
        branchIds: assigned ? assigned.branchIds : (o.branchIds || []),
      });
    });

    // Sobrescribir con lo guardado en RTDB
    rtdbOwners.forEach((data) => {
      const assigned = branchCountMap[data.id];
      const combinedBranchIds = Array.from(
        new Set([...(data.branchIds || []), ...(assigned ? assigned.branchIds : [])])
      );
      ownersMap.set(data.id, {
        id: data.id,
        name: data.name || data.email?.split('@')[0] || 'Dueño',
        email: data.email,
        storeName: data.storeName || 'Tienda Sayta',
        branchCount: combinedBranchIds.length || (assigned ? assigned.count : (data.branchCount || 0)),
        branchIds: combinedBranchIds,
        status: data.status || 'active',
        createdAt: data.createdAt || new Date().toISOString(),
        invitationStatus: data.invitationStatus || 'accepted',
        invitationToken: data.invitationToken,
        invitationExpiresAt: data.invitationExpiresAt,
      });
    });

    // 3. Si Firebase Admin Firestore está disponible, sincronizar también
    if (adminDb) {
      try {
        const ownersSnap = await adminDb.collection('users').where('role', '==', 'owner').get();
        ownersSnap.docs.forEach((doc) => {
          const data = doc.data();
          const assigned = branchCountMap[doc.id];
          const existing = ownersMap.get(doc.id);
          const combinedBranchIds = Array.from(
            new Set([...(existing?.branchIds || []), ...(data.branchIds || []), ...(assigned ? assigned.branchIds : [])])
          );
          ownersMap.set(doc.id, {
            id: doc.id,
            name: data.displayName || data.name || data.email.split('@')[0],
            email: data.email,
            storeName: data.storeName || 'Tienda Sayta',
            branchCount: combinedBranchIds.length || (assigned ? assigned.count : 0),
            branchIds: combinedBranchIds,
            status: data.suspended ? 'suspended' : 'active',
            createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            invitationStatus: 'accepted',
          });
        });
      } catch (e) {
        console.warn('[Owners GET] Firestore fetch warning:', e);
      }
    }

    return NextResponse.json({ success: true, owners: Array.from(ownersMap.values()) });
  } catch (error: any) {
    console.error('Error in GET /api/owners:', error);
    return NextResponse.json({ success: true, owners: mockOwnersStore });
  }
}

// POST: Invitar o agregar dueño (con token y expiración de 7 días)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, storeName, temporaryPassword, branchIds = [] } = body;

    if (!email || !name) {
      return NextResponse.json(
        { success: false, error: 'Nombre y correo son requeridos.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días
    let createdUid: string | null = null;

    // 1. Guardar en Firestore Admin si está disponible
    if (adminDb) {
      try {
        await adminDb.collection('invitations').add({
          email: cleanEmail,
          name: name.trim(),
          storeName: (storeName || `Tienda de ${name}`).trim(),
          role: 'owner',
          branchIds: Array.isArray(branchIds) ? branchIds : [],
          token,
          status: 'pending',
          expiresAt,
          createdAt: new Date(),
          invitedBy: 'programmer',
        });

        // Si se proporcionó contraseña, crear usuario directamente en Firebase Auth
        if (temporaryPassword && adminAuth) {
          try {
            const userRecord = await adminAuth.createUser({
              email: cleanEmail,
              password: temporaryPassword,
              displayName: name.trim(),
            });
            createdUid = userRecord.uid;

            await adminAuth.setCustomUserClaims(userRecord.uid, {
              role: 'owner',
              branchIds: Array.isArray(branchIds) ? branchIds : [],
              suspended: false,
            });

            await adminDb.collection('users').doc(userRecord.uid).set({
              uid: userRecord.uid,
              name: name.trim(),
              email: cleanEmail,
              role: 'owner',
              storeName: storeName || `Tienda de ${name}`,
              branchIds: Array.isArray(branchIds) ? branchIds : [],
              suspended: false,
              createdAt: new Date(),
            });
          } catch (authErr: any) {
            console.warn('Auth user creation warning:', authErr.message);
          }
        }

        // Registro en auditLogs
        await adminDb.collection('auditLogs').add({
          action: 'owner_invited',
          targetEmail: cleanEmail,
          storeName,
          timestamp: new Date(),
          performedBy: 'programmer',
        });
      } catch (adminErr) {
        console.warn('[Owners POST] Admin Firestore warning:', adminErr);
      }
    }

    const ownerId = createdUid || `owner-${Date.now()}`;
    const selectedBranchIds: string[] = Array.isArray(branchIds) ? branchIds : [];
    const initialPassword = (temporaryPassword || body.password || '').trim();

    const newOwner: OwnerRecord = {
      id: ownerId,
      name: name.trim(),
      email: cleanEmail,
      storeName: (storeName || `Tienda de ${name}`).trim(),
      branchCount: selectedBranchIds.length,
      branchIds: selectedBranchIds,
      status: 'active',
      initialPassword: initialPassword || undefined,
      createdAt: new Date().toISOString(),
      invitationStatus: 'pending',
      invitationToken: token,
      invitationExpiresAt: expiresAt.toISOString(),
    };

    // 2. Guardar en Firebase Realtime Database
    await saveOwnerToRtdb(newOwner);

    // 3. Vincular sucursales seleccionadas a este dueño en RTDB
    if (selectedBranchIds.length > 0) {
      for (const bId of selectedBranchIds) {
        try {
          await updateBranchInRtdb(bId, {
            ownerId: newOwner.id,
            ownerName: newOwner.name,
            ownerEmail: newOwner.email,
          });
        } catch (linkErr) {
          console.error(`Error vinculando sucursal ${bId} a dueño:`, linkErr);
        }
      }
    }

    mockOwnersStore.unshift(newOwner);

    return NextResponse.json({
      success: true,
      message: 'Dueño registrado y vinculado exitosamente.',
      owner: newOwner,
      invitationLink: `/login?invitation=${token}`,
    });
  } catch (error: any) {
    console.error('Error in POST /api/owners:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al invitar al dueño.' },
      { status: 500 }
    );
  }
}

// PATCH: Suspender o Reactivar dueño
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { ownerId, status, branchIds } = body; // status: 'active' | 'suspended'

    if (!ownerId) {
      return NextResponse.json({ success: false, error: 'Parámetros incompletos' }, { status: 400 });
    }

    const isSuspended = status === 'suspended';

    // 1. Actualizar en Firebase RTDB
    const updateData: any = {};
    if (status) updateData.status = status;
    if (branchIds && Array.isArray(branchIds)) {
      updateData.branchIds = branchIds;
      updateData.branchCount = branchIds.length;
      // Actualizar sucursales
      for (const bId of branchIds) {
        await updateBranchInRtdb(bId, { ownerId });
      }
    }
    await updateOwnerInRtdb(ownerId, updateData);

    // 2. Si Firestore Admin está activo
    if (adminDb && !ownerId.startsWith('owner-')) {
      try {
        const userDoc = await adminDb.collection('users').doc(ownerId).get();
        if (userDoc.exists) {
          await adminDb.collection('users').doc(ownerId).update({
            ...(status ? { suspended: isSuspended } : {}),
            ...(branchIds ? { branchIds } : {}),
            updatedAt: new Date(),
          });

          if (adminAuth) {
            await adminAuth.setCustomUserClaims(ownerId, {
              ...userDoc.data()?.claims,
              role: 'owner',
              ...(status ? { suspended: isSuspended } : {}),
              ...(branchIds ? { branchIds } : {}),
            });
            if (isSuspended) {
              await adminAuth.revokeRefreshTokens(ownerId);
            }
          }
        }

        await adminDb.collection('auditLogs').add({
          action: isSuspended ? 'owner_suspended' : 'owner_reactivated',
          targetOwnerId: ownerId,
          timestamp: new Date(),
        });
      } catch (adminErr) {
        console.warn('[Owners PATCH] Admin warning:', adminErr);
      }
    }

    // Actualizar store local
    mockOwnersStore = mockOwnersStore.map((o) =>
      o.id === ownerId ? { ...o, ...updateData } : o
    );

    return NextResponse.json({
      success: true,
      message: `El dueño ahora está ${isSuspended ? 'suspendido' : 'activo'}.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Eliminar dueño con confirmación auditada
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { ownerId, storeNameConfirmation } = body;

    if (!ownerId || !storeNameConfirmation) {
      return NextResponse.json(
        { success: false, error: 'Confirmación de nombre de tienda requerida' },
        { status: 400 }
      );
    }

    // 1. Eliminar de RTDB
    await deleteOwnerFromRtdb(ownerId);

    // 2. Verificar y eliminar de Firestore Admin
    if (adminDb && !ownerId.startsWith('owner-')) {
      try {
        if (adminAuth) {
          try {
            await adminAuth.deleteUser(ownerId);
            await adminAuth.revokeRefreshTokens(ownerId);
          } catch (e) {
            console.warn('Could not delete auth user:', e);
          }
        }
        await adminDb.collection('users').doc(ownerId).delete();

        await adminDb.collection('auditLogs').add({
          action: 'owner_deleted',
          targetOwnerId: ownerId,
          storeName: storeNameConfirmation,
          timestamp: new Date(),
        });
      } catch (adminErr) {
        console.warn('[Owners DELETE] Admin warning:', adminErr);
      }
    }

    mockOwnersStore = mockOwnersStore.filter((o) => o.id !== ownerId);

    return NextResponse.json({
      success: true,
      message: `Dueño y credenciales asociadas a "${storeNameConfirmation}" eliminados correctamente.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
