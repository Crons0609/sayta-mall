// src/lib/firebase/admin.ts
// Firebase Admin SDK — SOLO para uso en el servidor (API routes, Server Components).
// Esta importación fallará si se incluye en código del cliente.
// Next.js automáticamente excluye este módulo del bundle del cliente
// gracias al tree-shaking y la marca 'server-only'.

import 'server-only';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';
import { getDatabase, Database } from 'firebase-admin/database';

function getAdminApp(): App | null {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // Soporte para Opción A: JSON completo del Service Account
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      return initializeApp({
        credential: cert(serviceAccount),
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'https://saytamall-default-rtdb.firebaseio.com',
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    } catch (e) {
      console.warn('[Firebase Admin] Error parseando FIREBASE_SERVICE_ACCOUNT_JSON:', e);
    }
  }

  // Soporte para Opción B: campos individuales
  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    try {
      return initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'https://saytamall-default-rtdb.firebaseio.com',
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    } catch (e) {
      console.warn('[Firebase Admin] Error inicializando con campos individuales:', e);
    }
  }

  return null;
}

const adminApp = getAdminApp();

export const adminAuth = adminApp ? getAuth(adminApp) : (null as unknown as Auth);
export const adminDb = adminApp ? getFirestore(adminApp) : (null as unknown as Firestore);
export const adminStorage = adminApp ? getStorage(adminApp) : (null as unknown as Storage);
export const adminRtdb = adminApp ? getDatabase(adminApp) : (null as unknown as Database);
export const isFirebaseAdminConfigured = !!adminApp;

export default adminApp;
