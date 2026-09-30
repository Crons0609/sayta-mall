// src/app/api/auth/set-role/route.ts
// POST /api/auth/set-role
// Asigna o preserva el custom claim de rol a un usuario recién autenticado.
// Lógica robusta:
//   1. Si es el programador principal (o está en RTDB programadores) → role: programmer
//   2. Si está registrado en RTDB / Firestore como empleado → role: employee, área y sucursal
//   3. Si está registrado en RTDB / Firestore como dueño → role: owner
//   4. Si hay una invitación pendiente para ese email → aplicar la invitación
//   5. Si ya tiene un rol administrativo previo → respetarlo
//   6. Si no → role: customer

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, isFirebaseAdminConfigured } from '@/lib/firebase/admin';
import { setUserClaims, extractBearerToken } from '@/lib/auth/claims';
import { getEmployeesFromRtdb, getOwnersFromRtdb } from '@/lib/firebase/rtdb';
import { ROLES } from '@/lib/constants';
import type { InvitationDocument, UserClaims } from '@/types/user.types';
import { FieldValue } from 'firebase-admin/firestore';

const PROGRAMMER_EMAILS = (process.env.PROGRAMMER_EMAILS ?? 'christhiam@ghost.com')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function POST(request: NextRequest) {
  const token = extractBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  if (!isFirebaseAdminConfigured || !adminAuth) {
    return NextResponse.json({ message: 'Firebase Admin no configurado en entorno local.' });
  }

  let uid: string;
  let email: string;
  let existingClaims: any = {};

  try {
    const decoded = await adminAuth.verifyIdToken(token, true);
    uid = decoded.uid;
    email = (decoded.email ?? '').toLowerCase();
    existingClaims = decoded;
  } catch {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }

  // 1. Verificar si es Programador
  if (PROGRAMMER_EMAILS.includes(email)) {
    await setUserClaims(uid, {
      role: ROLES.PROGRAMMER,
      branchIds: [],
      suspended: false,
    });
    return NextResponse.json({ message: 'Rol asignado: programador', role: ROLES.PROGRAMMER });
  }

  // 2. Verificar si es un Empleado en RTDB
  try {
    const employees = await getEmployeesFromRtdb();
    const foundEmp = employees.find(
      (e) => (email && e.email?.toLowerCase() === email) || e.id === uid
    );
    if (foundEmp) {
      const claimsToSet: Partial<UserClaims> = {
        role: ROLES.EMPLOYEE,
        branchIds: foundEmp.branchId ? [foundEmp.branchId] : (foundEmp.branchIds || []),
        area: foundEmp.area || 'general',
        suspended: foundEmp.suspended === true,
      };
      await setUserClaims(uid, claimsToSet);
      return NextResponse.json({
        message: 'Rol asignado: empleado',
        role: ROLES.EMPLOYEE,
        area: foundEmp.area,
      });
    }
  } catch (err) {
    console.warn('[set-role] Error verificando empleado en RTDB:', err);
  }

  // 3. Verificar si es un Dueño en RTDB
  try {
    const owners = await getOwnersFromRtdb();
    const foundOwner = owners.find(
      (o) => (email && o.email?.toLowerCase() === email) || o.id === uid
    );
    if (foundOwner) {
      const claimsToSet: Partial<UserClaims> = {
        role: ROLES.OWNER,
        branchIds: foundOwner.branchIds || [],
        suspended: foundOwner.status === 'suspended',
      };
      await setUserClaims(uid, claimsToSet);
      return NextResponse.json({
        message: 'Rol asignado: dueño',
        role: ROLES.OWNER,
      });
    }
  } catch (err) {
    console.warn('[set-role] Error verificando dueño en RTDB:', err);
  }

  // 4. Si ya tiene un rol administrativo asignado, respetarlo y no degradar a customer
  if (
    existingClaims.role &&
    existingClaims.role !== ROLES.CUSTOMER &&
    existingClaims.role !== undefined
  ) {
    return NextResponse.json({ message: 'Rol ya asignado', role: existingClaims.role });
  }

  // 5. Buscar documento en Firestore 'users'
  try {
    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      if (userData?.role && userData.role !== ROLES.CUSTOMER) {
        await setUserClaims(uid, {
          role: userData.role,
          branchIds: userData.branchIds || [],
          area: userData.area,
          suspended: userData.suspended === true,
        });
        return NextResponse.json({
          message: `Rol asignado desde Firestore: ${userData.role}`,
          role: userData.role,
        });
      }
    }
  } catch (err) {
    console.warn('[set-role] Error verificando userDoc en Firestore:', err);
  }

  // 6. Buscar invitación pendiente para este email
  try {
    const invitationsSnapshot = await adminDb
      .collection('invitations')
      .where('email', '==', email)
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (!invitationsSnapshot.empty) {
      const invitation = invitationsSnapshot.docs[0].data() as InvitationDocument;
      const invitationId = invitationsSnapshot.docs[0].id;

      const expiresAt =
        invitation.expiresAt instanceof Date
          ? invitation.expiresAt
          : (invitation.expiresAt as FirebaseFirestore.Timestamp).toDate();

      if (expiresAt > new Date()) {
        await setUserClaims(uid, {
          role: invitation.role,
          branchIds: invitation.branchIds,
          area: invitation.area,
          suspended: false,
          ownerId: invitation.invitedBy,
        });

        await adminDb.collection('invitations').doc(invitationId).update({
          status: 'accepted',
          acceptedAt: FieldValue.serverTimestamp(),
          acceptedByUid: uid,
        });

        return NextResponse.json({
          message: `Invitación aceptada. Rol asignado: ${invitation.role}`,
          role: invitation.role,
        });
      } else {
        await adminDb.collection('invitations').doc(invitationId).update({
          status: 'expired',
        });
      }
    }
  } catch (err) {
    console.warn('[set-role] Error verificando invitaciones:', err);
  }

  // 7. Sin ningún rol previo ni registro de empleado/dueño → asignar customer
  await setUserClaims(uid, {
    role: ROLES.CUSTOMER,
    branchIds: [],
    suspended: false,
  });

  return NextResponse.json({ message: 'Rol asignado: cliente', role: ROLES.CUSTOMER });
}
