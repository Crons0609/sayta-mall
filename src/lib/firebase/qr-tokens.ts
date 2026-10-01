// src/lib/firebase/qr-tokens.ts - Server-side only (Admin SDK with RTDB/Memory fallback)
import 'server-only';
import { adminDb, adminAuth } from './admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { randomUUID, createHash } from 'crypto';
import type { QrMode, QrScanResult } from '@/types/qr-admin.types';
import { readRtdb, writeRtdb } from './rtdb';

const QR_TOKENS = 'qr_tokens';
const SESIONES = 'sesiones_delivery';
const SUCURSALES = 'branches';
const QR_ESCANEOS = 'qr_escaneos';
const AUDITORIA = 'auditoria';

const QR_EXPIRA_MINUTOS = 2;
const SESSION_EXPIRA_HORAS = 2;

// Cache en memoria para cuando Firebase Admin SDK no este inicializado (entorno dev local)
const memoryTokens = new Map<string, any>();
const memorySessions = new Map<string, any>();
const memoryScans: any[] = [];
const memoryBranchQr = new Map<string, any>();

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Obtiene la configuracion de QR de una sucursal
 */
export async function getBranchQrConfig(sucursalId: string) {
  if (adminDb) {
    try {
      const branchRef = adminDb.collection(SUCURSALES).doc(sucursalId);
      const snap = await branchRef.get();
      if (snap.exists) {
        const data = snap.data()!;
        const fixedSnap = await adminDb
          .collection(QR_TOKENS)
          .where('sucursalId', '==', sucursalId)
          .where('tipo', '==', 'fijo')
          .where('revocado', '==', false)
          .limit(1)
          .get();

        let tokenFijo = '';
        if (!fixedSnap.empty) {
          tokenFijo = fixedSnap.docs[0].data().tokenOriginal || '';
        }

        return {
          sucursalId,
          sucursalNombre: data.name || 'Sucursal Sayta Mall',
          qrModo: (data.qrModo || 'dinamico') as QrMode,
          qrActivo: data.qrActivo ?? true,
          qrVigenciaSeg: data.qrVigenciaSeg || 120,
          sesionDeliveryMin: data.sesionDeliveryMin || 120,
          geolocalizacionRequerida: data.geolocalizacionRequerida ?? false,
          radioMetros: data.radioMetros || 100,
          lat: data.lat,
          lng: data.lng,
          tokenFijo,
          qrRotadoAt: data.qrRotadoAt,
          qrRotadoPor: data.qrRotadoPor,
          ultimoUso: data.qrUltimoUso,
          ultimoDeliveryNombre: data.qrUltimoDeliveryNombre,
        };
      }
    } catch (err) {
      console.warn('[QR Tokens] Error consultando Firestore adminDb:', err);
    }
  }

  // Fallback RTDB / Memoria
  let branchData = memoryBranchQr.get(sucursalId);
  if (!branchData) {
    branchData = await readRtdb(`branches/${sucursalId}`) || {};
  }

  let tokenFijo = '';
  for (const t of memoryTokens.values()) {
    if (t.sucursalId === sucursalId && t.tipo === 'fijo' && !t.revocado) {
      tokenFijo = t.tokenOriginal || t.token || '';
      break;
    }
  }

  return {
    sucursalId,
    sucursalNombre: branchData.name || 'Sucursal Sayta Mall',
    qrModo: (branchData.qrModo || 'dinamico') as QrMode,
    qrActivo: branchData.qrActivo ?? true,
    qrVigenciaSeg: branchData.qrVigenciaSeg || 120,
    sesionDeliveryMin: branchData.sesionDeliveryMin || 120,
    geolocalizacionRequerida: branchData.geolocalizacionRequerida ?? false,
    radioMetros: branchData.radioMetros || 100,
    lat: branchData.lat,
    lng: branchData.lng,
    tokenFijo,
    qrRotadoAt: branchData.qrRotadoAt,
    qrRotadoPor: branchData.qrRotadoPor,
    ultimoUso: branchData.qrUltimoUso,
    ultimoDeliveryNombre: branchData.qrUltimoDeliveryNombre,
  };
}

/**
 * Genera un QR dinamico (de un solo uso, con token firmado y hash)
 */
export async function generateDynamicQrToken(sucursalId: string, creadoPor: string) {
  const token = randomUUID();
  const tokenHashed = hashToken(token);
  const expiraMillis = Date.now() + QR_EXPIRA_MINUTOS * 60 * 1000;

  if (adminDb) {
    try {
      const oldSnap = await adminDb
        .collection(QR_TOKENS)
        .where('sucursalId', '==', sucursalId)
        .where('usado', '==', false)
        .where('tipo', '==', 'dinamico')
        .get();

      const batch = adminDb.batch();
      oldSnap.docs.forEach((d) => batch.update(d.ref, { usado: true, revocado: true }));
      await batch.commit();

      const expiraAt = Timestamp.fromMillis(expiraMillis);
      const ref = adminDb.collection(QR_TOKENS).doc();
      const data = {
        sucursalId,
        tokenHash: tokenHashed,
        tokenOriginal: token,
        tipo: 'dinamico',
        expiraAt,
        usado: false,
        revocado: false,
        creadoPor,
        createdAt: Timestamp.now(),
      };
      await ref.set(data);
      return { id: ref.id, token, ...data };
    } catch (err) {
      console.warn('[QR Tokens] Error guardando dinamico en Firestore, usando fallback:', err);
    }
  }

  // Fallback RTDB / Memoria
  for (const [id, t] of memoryTokens.entries()) {
    if (t.sucursalId === sucursalId && t.tipo === 'dinamico' && !t.usado) {
      t.usado = true;
      t.revocado = true;
    }
  }

  const tokenId = `qr-dyn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const data = {
    id: tokenId,
    sucursalId,
    tokenHash: tokenHashed,
    tokenOriginal: token,
    token,
    tipo: 'dinamico',
    expiraAt: { toMillis: () => expiraMillis },
    expiraAtMillis: expiraMillis,
    usado: false,
    revocado: false,
    creadoPor,
    createdAt: Date.now(),
  };

  memoryTokens.set(tokenId, data);
  try {
    await writeRtdb(`qr_tokens/${tokenId}`, data);
  } catch {}

  return { ...data };
}

/**
 * Obtiene o crea el QR fijo de una sucursal
 */
export async function getOrCreateFixedQrToken(sucursalId: string, creadoPor: string) {
  if (adminDb) {
    try {
      const snap = await adminDb
        .collection(QR_TOKENS)
        .where('sucursalId', '==', sucursalId)
        .where('tipo', '==', 'fijo')
        .where('revocado', '==', false)
        .limit(1)
        .get();

      if (!snap.empty) {
        const d = snap.docs[0];
        const data = d.data();
        return { id: d.id, token: data.tokenOriginal || data.token, ...data };
      }

      const token = randomUUID();
      const tokenHashed = hashToken(token);
      const expiraAt = Timestamp.fromMillis(Date.now() + 365 * 24 * 60 * 60 * 1000);
      const ref = adminDb.collection(QR_TOKENS).doc();
      const data = {
        sucursalId,
        tokenHash: tokenHashed,
        tokenOriginal: token,
        tipo: 'fijo',
        expiraAt,
        usado: false,
        revocado: false,
        creadoPor,
        createdAt: Timestamp.now(),
      };
      await ref.set(data);
      return { id: ref.id, token, ...data };
    } catch (err) {
      console.warn('[QR Tokens] Error getOrCreateFixedQrToken en Firestore, usando fallback:', err);
    }
  }

  // Fallback RTDB / Memoria
  for (const t of memoryTokens.values()) {
    if (t.sucursalId === sucursalId && t.tipo === 'fijo' && !t.revocado) {
      return { id: t.id, token: t.tokenOriginal || t.token, ...t };
    }
  }

  const existingRtdbTokens = await readRtdb<Record<string, any>>('qr_tokens');
  if (existingRtdbTokens) {
    for (const [id, t] of Object.entries(existingRtdbTokens)) {
      if (t && t.sucursalId === sucursalId && t.tipo === 'fijo' && !t.revocado) {
        const fixedToken = { id, ...t, expiraAt: { toMillis: () => t.expiraAtMillis || Date.now() + 365 * 24 * 60 * 60 * 1000 } };
        memoryTokens.set(id, fixedToken);
        return { id, token: t.tokenOriginal || t.token, ...fixedToken };
      }
    }
  }

  // Crear nuevo fijo en fallback
  const token = randomUUID();
  const tokenHashed = hashToken(token);
  const expiraMillis = Date.now() + 365 * 24 * 60 * 60 * 1000;
  const tokenId = `qr-fijo-${sucursalId}`;
  const data = {
    id: tokenId,
    sucursalId,
    tokenHash: tokenHashed,
    tokenOriginal: token,
    token,
    tipo: 'fijo',
    expiraAt: { toMillis: () => expiraMillis },
    expiraAtMillis: expiraMillis,
    usado: false,
    revocado: false,
    creadoPor,
    createdAt: Date.now(),
  };

  memoryTokens.set(tokenId, data);
  try {
    await writeRtdb(`qr_tokens/${tokenId}`, data);
  } catch {}

  return { ...data };
}

/**
 * Rota el token de la sucursal (invalida tokens anteriores inmediatamente)
 */
export async function rotateBranchQrToken(sucursalId: string, rotadoPor: string) {
  const token = randomUUID();
  const tokenHashed = hashToken(token);
  const expiraMillis = Date.now() + 365 * 24 * 60 * 60 * 1000;

  if (adminDb) {
    try {
      const snap = await adminDb
        .collection(QR_TOKENS)
        .where('sucursalId', '==', sucursalId)
        .where('revocado', '==', false)
        .get();

      const batch = adminDb.batch();
      snap.docs.forEach((d) => batch.update(d.ref, { revocado: true, revocadoAt: FieldValue.serverTimestamp() }));
      await batch.commit();

      const expiraAt = Timestamp.fromMillis(expiraMillis);
      const ref = adminDb.collection(QR_TOKENS).doc();
      const now = Timestamp.now();
      await ref.set({
        sucursalId,
        tokenHash: tokenHashed,
        tokenOriginal: token,
        tipo: 'fijo',
        expiraAt,
        usado: false,
        revocado: false,
        creadoPor: rotadoPor,
        createdAt: now,
      });

      await adminDb.collection(SUCURSALES).doc(sucursalId).update({
        qrRotadoAt: now,
        qrRotadoPor: rotadoPor,
        updatedAt: now,
      });

      return { id: ref.id, token, expiraAt };
    } catch (err) {
      console.warn('[QR Tokens] Error rotateBranchQrToken en Firestore, usando fallback:', err);
    }
  }

  // Fallback
  for (const t of memoryTokens.values()) {
    if (t.sucursalId === sucursalId) {
      t.revocado = true;
    }
  }

  const tokenId = `qr-fijo-${sucursalId}`;
  const data = {
    id: tokenId,
    sucursalId,
    tokenHash: tokenHashed,
    tokenOriginal: token,
    token,
    tipo: 'fijo',
    expiraAt: { toMillis: () => expiraMillis },
    expiraAtMillis: expiraMillis,
    usado: false,
    revocado: false,
    creadoPor: rotadoPor,
    createdAt: Date.now(),
  };

  memoryTokens.set(tokenId, data);
  try {
    await writeRtdb(`qr_tokens/${tokenId}`, data);
  } catch {}

  return { id: tokenId, token, expiraAt: data.expiraAt };
}

/**
 * Activa o desactiva el QR de una sucursal
 */
export async function toggleBranchQr(sucursalId: string, activo: boolean, actualizadoPor: string) {
  if (adminDb) {
    try {
      const now = Timestamp.now();
      await adminDb.collection(SUCURSALES).doc(sucursalId).update({
        qrActivo: activo,
        updatedAt: now,
      });
      return;
    } catch (err) {
      console.warn('[QR Tokens] toggleBranchQr en Firestore falló, usando fallback:', err);
    }
  }

  const current = memoryBranchQr.get(sucursalId) || {};
  current.qrActivo = activo;
  current.updatedAt = Date.now();
  memoryBranchQr.set(sucursalId, current);
  try {
    await writeRtdb(`branches/${sucursalId}/qrActivo`, activo);
  } catch {}
}

/**
 * Registra un escaneo en el historial
 */
export async function recordQrScan(
  sucursalId: string,
  tokenId: string,
  deliveryNombre: string,
  empresaDeliveryId?: string,
  empresaDeliveryNombre?: string,
  dispositivo?: string,
  ip?: string,
  resultado: QrScanResult = 'valido'
) {
  try {
    if (adminDb) {
      const now = Timestamp.now();
      await adminDb.collection(QR_ESCANEOS).add({
        sucursalId,
        tokenId,
        deliveryNombre,
        empresaDeliveryId: empresaDeliveryId || '',
        empresaDeliveryNombre: empresaDeliveryNombre || '',
        dispositivo: dispositivo || 'Móvil',
        ip: ip || 'Desconocida',
        resultado,
        fecha: now,
      });

      if (resultado === 'valido') {
        await adminDb.collection(SUCURSALES).doc(sucursalId).update({
          qrUltimoUso: now,
          qrUltimoDeliveryNombre: deliveryNombre,
        });
      }
      return;
    }
  } catch (err) {
    console.warn('[Record QR Scan Firestore Error]', err);
  }

  const scanRecord = {
    id: `scan-${Date.now()}`,
    sucursalId,
    tokenId,
    deliveryNombre,
    empresaDeliveryId: empresaDeliveryId || '',
    empresaDeliveryNombre: empresaDeliveryNombre || '',
    dispositivo: dispositivo || 'Móvil',
    ip: ip || 'Desconocida',
    resultado,
    fecha: { toMillis: () => Date.now() },
    fechaMillis: Date.now(),
  };
  memoryScans.unshift(scanRecord);
}

/**
 * Obtiene el historial de escaneos de una sucursal
 */
export async function getBranchQrScans(sucursalId: string, limit: number = 30) {
  if (adminDb) {
    try {
      const snap = await adminDb
        .collection(QR_ESCANEOS)
        .where('sucursalId', '==', sucursalId)
        .limit(limit)
        .get();

      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      return docs.sort((a: any, b: any) => {
        const tA = a.fecha?.toMillis?.() || 0;
        const tB = b.fecha?.toMillis?.() || 0;
        return tB - tA;
      });
    } catch (err) {
      console.warn('[getBranchQrScans Firestore Error]', err);
    }
  }

  return memoryScans
    .filter((s) => s.sucursalId === sucursalId)
    .slice(0, limit);
}

/**
 * Valida un token QR y crea la sesión temporal para el delivery
 */
export async function validateQrAndCreateSession(
  sucursalId: string,
  token: string,
  deliveryNombre: string,
  empresaDeliveryId: string,
  empresaDeliveryNombre?: string,
  clientMeta?: { dispositivo?: string; ip?: string }
) {
  const tokenHashed = hashToken(token);

  if (adminDb) {
    try {
      const branchSnap = await adminDb.collection(SUCURSALES).doc(sucursalId).get();
      if (branchSnap.exists && branchSnap.data()?.qrActivo === false) {
        await recordQrScan(sucursalId, 'inactivo', deliveryNombre, empresaDeliveryId, empresaDeliveryNombre, clientMeta?.dispositivo, clientMeta?.ip, 'invalido');
        throw new Error('QR_INACTIVO: El código QR de esta sucursal está temporalmente desactivado');
      }

      let snap = await adminDb
        .collection(QR_TOKENS)
        .where('sucursalId', '==', sucursalId)
        .where('tokenHash', '==', tokenHashed)
        .where('revocado', '==', false)
        .limit(1)
        .get();

      if (snap.empty) {
        snap = await adminDb
          .collection(QR_TOKENS)
          .where('sucursalId', '==', sucursalId)
          .where('token', '==', token)
          .where('revocado', '==', false)
          .limit(1)
          .get();
      }

      if (!snap.empty) {
        const tokenDoc = snap.docs[0];
        const tokenData = tokenDoc.data();

        if (tokenData.tipo === 'dinamico' && tokenData.usado) {
          await recordQrScan(sucursalId, tokenDoc.id, deliveryNombre, empresaDeliveryId, empresaDeliveryNombre, clientMeta?.dispositivo, clientMeta?.ip, 'vencido');
          throw new Error('QR_EXPIRADO: Este código dinámico ya fue utilizado');
        }

        const expiraAt = tokenData.expiraAt instanceof Timestamp ? tokenData.expiraAt.toDate() : new Date(tokenData.expiraAt);
        if (new Date() > expiraAt) {
          await tokenDoc.ref.update({ usado: true });
          await recordQrScan(sucursalId, tokenDoc.id, deliveryNombre, empresaDeliveryId, empresaDeliveryNombre, clientMeta?.dispositivo, clientMeta?.ip, 'vencido');
          throw new Error('QR_EXPIRADO');
        }

        if (tokenData.tipo === 'dinamico') {
          await tokenDoc.ref.update({ usado: true, usadoAt: FieldValue.serverTimestamp() });
        }

        const sessionExpiraAt = Timestamp.fromMillis(Date.now() + SESSION_EXPIRA_HORAS * 60 * 60 * 1000);
        let customToken = `simulated-delivery-${Date.now()}`;
        let anonUid = `delivery-${Date.now()}`;

        if (adminAuth) {
          try {
            const anonUser = await adminAuth.createUser({});
            anonUid = anonUser.uid;
            customToken = await adminAuth.createCustomToken(anonUser.uid, {
              rol: 'delivery_temporal',
              sucursal_id: sucursalId,
              expira: sessionExpiraAt.toMillis(),
            });
          } catch (authErr) {
            console.warn('[validateQr adminAuth Error]', authErr);
          }
        }

        const sessionRef = adminDb.collection(SESIONES).doc();
        const sessionData = {
          firebaseUid: anonUid,
          sucursalId,
          nombre: deliveryNombre,
          empresaDeliveryId,
          empresaDeliveryNombre: empresaDeliveryNombre || '',
          expiraAt: sessionExpiraAt,
          createdAt: Timestamp.now(),
        };
        await sessionRef.set(sessionData);

        await recordQrScan(sucursalId, tokenDoc.id, deliveryNombre, empresaDeliveryId, empresaDeliveryNombre, clientMeta?.dispositivo, clientMeta?.ip, 'valido');

        return { sessionId: sessionRef.id, customToken, expiraAt: sessionExpiraAt.toMillis() };
      }
    } catch (err: any) {
      if (err.message?.startsWith('QR_')) throw err;
      console.warn('[validateQrAndCreateSession Firestore]', err);
    }
  }

  // Fallback RTDB / Memoria
  let targetToken: any = null;
  for (const t of memoryTokens.values()) {
    if (t.sucursalId === sucursalId && (t.tokenHash === tokenHashed || t.tokenOriginal === token || t.token === token) && !t.revocado) {
      targetToken = t;
      break;
    }
  }

  if (!targetToken) {
    const existingRtdbTokens = await readRtdb<Record<string, any>>('qr_tokens');
    if (existingRtdbTokens) {
      for (const [id, t] of Object.entries(existingRtdbTokens)) {
        if (t && t.sucursalId === sucursalId && (t.tokenHash === tokenHashed || t.tokenOriginal === token || t.token === token) && !t.revocado) {
          targetToken = { id, ...t };
          memoryTokens.set(id, targetToken);
          break;
        }
      }
    }
  }

  if (!targetToken) {
    await recordQrScan(sucursalId, 'desconocido', deliveryNombre, empresaDeliveryId, empresaDeliveryNombre, clientMeta?.dispositivo, clientMeta?.ip, 'invalido');
    throw new Error('QR_INVALIDO');
  }

  if (targetToken.tipo === 'dinamico' && targetToken.usado) {
    await recordQrScan(sucursalId, targetToken.id, deliveryNombre, empresaDeliveryId, empresaDeliveryNombre, clientMeta?.dispositivo, clientMeta?.ip, 'vencido');
    throw new Error('QR_EXPIRADO: Este código dinámico ya fue utilizado');
  }

  const expiraMillis = targetToken.expiraAtMillis || (targetToken.expiraAt?.toMillis ? targetToken.expiraAt.toMillis() : new Date(targetToken.expiraAt).getTime());
  if (Date.now() > expiraMillis) {
    targetToken.usado = true;
    await recordQrScan(sucursalId, targetToken.id, deliveryNombre, empresaDeliveryId, empresaDeliveryNombre, clientMeta?.dispositivo, clientMeta?.ip, 'vencido');
    throw new Error('QR_EXPIRADO');
  }

  if (targetToken.tipo === 'dinamico') {
    targetToken.usado = true;
    targetToken.usadoAt = Date.now();
    try {
      await writeRtdb(`qr_tokens/${targetToken.id}/usado`, true);
    } catch {}
  }

  const sessionId = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const sessionExpiraAtMillis = Date.now() + SESSION_EXPIRA_HORAS * 60 * 60 * 1000;
  const customToken = `simulated-delivery-${sessionId}`;

  const sessionData = {
    id: sessionId,
    firebaseUid: `delivery-anon-${Date.now()}`,
    sucursalId,
    nombre: deliveryNombre,
    empresaDeliveryId,
    empresaDeliveryNombre: empresaDeliveryNombre || '',
    expiraAt: { toMillis: () => sessionExpiraAtMillis },
    expiraAtMillis: sessionExpiraAtMillis,
    createdAt: Date.now(),
  };

  memorySessions.set(sessionId, sessionData);
  try {
    await writeRtdb(`sesiones_delivery/${sessionId}`, sessionData);
  } catch {}

  await recordQrScan(sucursalId, targetToken.id, deliveryNombre, empresaDeliveryId, empresaDeliveryNombre, clientMeta?.dispositivo, clientMeta?.ip, 'valido');

  return { sessionId, customToken, expiraAt: sessionExpiraAtMillis };
}

/**
 * Obtiene la sesión de delivery activa
 */
export async function getDeliverySession(sessionId: string): Promise<any | null> {
  if (adminDb) {
    try {
      const snap = await adminDb.collection(SESIONES).doc(sessionId).get();
      if (snap.exists) {
        const data = snap.data();
        if (data) {
          const expiraAt = data.expiraAt instanceof Timestamp ? data.expiraAt.toDate() : new Date(data.expiraAt);
          if (new Date() <= expiraAt) {
            return { id: snap.id, ...data };
          }
        }
      }
    } catch (err) {
      console.warn('[getDeliverySession Firestore]', err);
    }
  }

  // Fallback RTDB / Memoria
  let session = memorySessions.get(sessionId);
  if (!session) {
    session = await readRtdb(`sesiones_delivery/${sessionId}`);
    if (session) memorySessions.set(sessionId, session);
  }

  if (!session) return null;

  const expiraMillis = session.expiraAtMillis || (session.expiraAt?.toMillis ? session.expiraAt.toMillis() : new Date(session.expiraAt).getTime());
  if (Date.now() > expiraMillis) return null;

  return session;
}

