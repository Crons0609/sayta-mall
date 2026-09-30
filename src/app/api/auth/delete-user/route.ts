// src/app/api/auth/delete-user/route.ts
// DELETE /api/auth/delete-user
// Elimina un usuario completamente: Firebase Auth + datos de Firestore.
// Solo puede ser llamado por un dueño (para sus empleados) o un programador.
// Conserva los registros de auditoría y logs históricos.

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { getClaimsFromRequest } from '@/lib/auth/claims';
import { ROLES } from '@/lib/constants';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';

const DeleteUserSchema = z.object({
  uid: z.string().min(1, 'UID requerido'),
  reason: z.string().min(3, 'Motivo requerido').max(500),
});

export async function DELETE(request: NextRequest) {
  // 1. Verificar autenticación y rol del solicitante
  const callerClaims = await getClaimsFromRequest(request);
  if (!callerClaims) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const isProgrammer = callerClaims.role === ROLES.PROGRAMMER;
  const isOwner = callerClaims.role === ROLES.OWNER;

  if (!isProgrammer && !isOwner) {
    return NextResponse.json({ error: 'Prohibido: se requiere rol dueño o programador' }, { status: 403 });
  }

  // 2. Validar el body
  let body: z.infer<typeof DeleteUserSchema>;
  try {
    const json = await request.json();
    body = DeleteUserSchema.parse(json);
  } catch (err) {
    return NextResponse.json({ error: 'Datos inválidos', details: err }, { status: 400 });
  }

  const { uid: targetUid, reason } = body;

  // 3. Obtener el usuario a eliminar
  let targetUser;
  try {
    targetUser = await adminAuth.getUser(targetUid);
  } catch {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  const targetClaims = targetUser.customClaims as { role?: string; branchIds?: string[] } | undefined;

  // 4. Verificar que el dueño solo puede eliminar empleados de sus sucursales
  if (isOwner && !isProgrammer) {
    if (targetClaims?.role === ROLES.OWNER || targetClaims?.role === ROLES.PROGRAMMER) {
      return NextResponse.json(
        { error: 'Un dueño no puede eliminar a otro dueño o programador' },
        { status: 403 }
      );
    }

    const targetBranchIds = targetClaims?.branchIds ?? [];
    const hasOverlap = targetBranchIds.some((bid) => callerClaims.branchIds.includes(bid));
    if (!hasOverlap) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar este usuario' },
        { status: 403 }
      );
    }
  }

  // 5. No se puede auto-eliminar
  const token = request.headers.get('Authorization')?.slice(7) ?? '';
  const decodedToken = await adminAuth.verifyIdToken(token);
  if (decodedToken.uid === targetUid) {
    return NextResponse.json({ error: 'No puedes eliminarte a ti mismo' }, { status: 400 });
  }

  // 6. Soft-delete del documento de Firestore (conservar para auditoría)
  const batch = adminDb.batch();
  const userRef = adminDb.collection('users').doc(targetUid);
  batch.update(userRef, {
    deletedAt: FieldValue.serverTimestamp(),
    deletedBy: decodedToken.uid,
    deletedByEmail: decodedToken.email,
    deletionReason: reason,
    // Borrar datos personales (privacidad) pero conservar el registro
    displayName: '[Cuenta Eliminada]',
    photoURL: null,
    email: `deleted_${targetUid}@eliminado.local`,
    suspended: true,
  });

  // 7. Registrar en auditLogs
  const auditRef = adminDb.collection('auditLogs').doc();
  batch.set(auditRef, {
    action: 'user_deleted',
    targetUid,
    targetEmail: targetUser.email,
    performedBy: decodedToken.uid,
    performedByEmail: decodedToken.email,
    reason,
    timestamp: FieldValue.serverTimestamp(),
    metadata: {
      targetRole: targetClaims?.role,
      targetBranchIds: targetClaims?.branchIds,
    },
  });

  await batch.commit();

  // 8. Eliminar de Firebase Auth (después del batch para no perder el audit log si falla)
  await adminAuth.deleteUser(targetUid);

  return NextResponse.json({
    message: 'Usuario eliminado correctamente',
    uid: targetUid,
  });
}
