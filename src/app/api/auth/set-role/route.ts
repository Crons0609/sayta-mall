// src/app/api/auth/set-role/route.ts
// POST /api/auth/set-role
// Asigna el custom claim de rol a un usuario recién autenticado.
// Lógica:
//   1. Si el email está en PROGRAMMER_EMAILS → role: programmer
//   2. Si hay una invitación pendiente para ese email → aplicar la invitación
//   3. Si no → role: customer (sin acción si ya tiene rol)

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { setUserClaims, extractBearerToken, verifyAndGetClaims } from '@/lib/auth/claims';
import { ROLES } from '@/lib/constants';
import type { InvitationDocument } from '@/types/user.types';
import { FieldValue } from 'firebase-admin/firestore';

const PROGRAMMER_EMAILS = (process.env.PROGRAMMER_EMAILS ?? 'christhiam@ghost.com')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function POST(request: NextRequest) {
  // 1. Verificar token
  const token = extractBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  let uid: string;
  let email: string;
  let existingClaims;

  try {
    const decoded = await adminAuth.verifyIdToken(token, true);
    uid = decoded.uid;
    email = (decoded.email ?? '').toLowerCase();
    existingClaims = decoded;
  } catch {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }

  // 2. Si ya tiene un rol asignado que no sea customer, no hacer nada
  // (evita sobreescribir un empleado que ya fue configurado)
  if (
    existingClaims.role &&
    existingClaims.role !== ROLES.CUSTOMER &&
    existingClaims.role !== undefined
  ) {
    return NextResponse.json({ message: 'Rol ya asignado', role: existingClaims.role });
  }

  // 3. Verificar si es programador
  if (PROGRAMMER_EMAILS.includes(email)) {
    await setUserClaims(uid, {
      role: ROLES.PROGRAMMER,
      branchIds: [],
      suspended: false,
    });
    return NextResponse.json({ message: 'Rol asignado: programador', role: ROLES.PROGRAMMER });
  }

  // 4. Buscar invitación pendiente para este email
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

    // Verificar que no haya expirado
    const expiresAt = invitation.expiresAt instanceof Date
      ? invitation.expiresAt
      : (invitation.expiresAt as FirebaseFirestore.Timestamp).toDate();

    if (expiresAt > new Date()) {
      // Aplicar la invitación
      await setUserClaims(uid, {
        role: invitation.role,
        branchIds: invitation.branchIds,
        area: invitation.area,
        suspended: false,
        ownerId: invitation.invitedBy,
      });

      // Marcar invitación como aceptada
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
      // Expirada: marcar como tal
      await adminDb.collection('invitations').doc(invitationId).update({
        status: 'expired',
      });
    }
  }

  // 5. Sin invitación → asignar como customer
  await setUserClaims(uid, {
    role: ROLES.CUSTOMER,
    branchIds: [],
    suspended: false,
  });

  return NextResponse.json({ message: 'Rol asignado: cliente', role: ROLES.CUSTOMER });
}
