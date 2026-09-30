/**
 * scripts/cleanup-production.ts
 * HERRAMIENTA DE LIMPIEZA DE BASE DE DATOS DE PRODUCCION - SAYTA MALL
 *
 * REGLAS OBLIGATORIAS:
 *   - Modo por defecto: DRY-RUN (solo lista, no borra nada).
 *   - El borrado real solo corre con: npx ts-node scripts/cleanup-production.ts --execute
 *   - En modo --execute se pide el Project ID de Firebase por teclado.
 *   - RESPALDO PREVIO AUTOMATICO en backups/YYYY-MM-DD_HHmm/
 *   - LISTA DE PROTECCION: PROGRAMMER_EMAILS y KEEP_OWNER_EMAILS (env)
 *
 * USO:
 *   npx ts-node scripts/cleanup-production.ts           -> dry-run
 *   npx ts-node scripts/cleanup-production.ts --execute -> borrado real
 */

import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';

// Carga variables de entorno desde .env.local si existe
const dotenvPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(dotenvPath)) {
  const lines = fs.readFileSync(dotenvPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore, BulkWriter, DocumentReference } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const IS_EXECUTE_MODE = process.argv.includes('--execute');
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '';

const PROGRAMMER_EMAILS: string[] = (process.env.PROGRAMMER_EMAILS ?? '')
  .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);

const KEEP_OWNER_EMAILS: string[] = (process.env.KEEP_OWNER_EMAILS ?? '')
  .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);

const PROTECTED_EMAILS = new Set([...PROGRAMMER_EMAILS, ...KEEP_OWNER_EMAILS]);

const COLLECTIONS_TO_DELETE = [
  'carts', 'favorites', 'reviews', 'orders', 'stockMovements',
  'dayOffRequests', 'attendance', 'shifts', 'tasks', 'chatChannels',
  'announcements', 'notifications', 'invitations', 'coupons', 'promotions',
  'purchases', 'transfers', 'suppliers', 'products', 'categories',
  'branches', 'auditLogs',
] as const;

const RESET = '\x1b[0m'; const RED = '\x1b[31m'; const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m'; const BLUE = '\x1b[34m'; const CYAN = '\x1b[36m';
const DIM = '\x1b[2m'; const BOLD = '\x1b[1m';

function log(msg: string) { console.log(msg); }
function logOk(msg: string) { console.log(`${GREEN}ok${RESET} ${msg}`); }
function logWarn(msg: string) { console.log(`${YELLOW}warn${RESET} ${msg}`); }
function logErr(msg: string) { console.error(`${RED}err${RESET} ${msg}`); }
function logInfo(msg: string) { console.log(`${BLUE}info${RESET} ${msg}`); }
function logSection(title: string) {
  console.log(`\n${BOLD}${CYAN}${'='.repeat(60)}${RESET}`);
  console.log(`${BOLD}${CYAN}  ${title}${RESET}`);
  console.log(`${CYAN}${'='.repeat(60)}${RESET}\n`);
}
function logDryRun(msg: string) { console.log(`${DIM}  [DRY-RUN] ${msg}${RESET}`); }

function initAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      return initializeApp({ credential: cert(sa), storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET });
    } catch { logErr('Error al parsear FIREBASE_SERVICE_ACCOUNT_JSON'); process.exit(1); }
  }
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }
  logErr('No se encontraron credenciales de Firebase Admin SDK.\nConfigura FIREBASE_SERVICE_ACCOUNT_JSON o los campos individuales en .env.local');
  process.exit(1);
}

function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => { rl.question(question, (answer) => { rl.close(); resolve(answer.trim()); }); });
}

function checkSafetyGuards(): void {
  logSection('VERIFICACIONES DE SEGURIDAD');
  if (!PROJECT_ID) { logErr('NEXT_PUBLIC_FIREBASE_PROJECT_ID no configurado. Abortando.'); process.exit(1); }
  const DEV_PATTERNS = ['demo', 'dev', 'test', 'local', 'emulator'];
  if (DEV_PATTERNS.some((p) => PROJECT_ID.toLowerCase().includes(p)) && IS_EXECUTE_MODE) {
    logErr(`El proyecto "${PROJECT_ID}" parece ser de DESARROLLO. Borrado real no permitido.`);
    process.exit(1);
  }
  if (PROGRAMMER_EMAILS.length === 0) logWarn('PROGRAMMER_EMAILS vacio. No se protegera ningun programador.');
  logOk(`Proyecto Firebase: ${PROJECT_ID}`);
  logOk(`Emails protegidos (Programadores): ${PROGRAMMER_EMAILS.join(', ') || '(ninguno)'}`);
  logOk(`Emails protegidos (Duenos): ${KEEP_OWNER_EMAILS.join(', ') || '(ninguno)'}`);
  logOk(`Modo: ${IS_EXECUTE_MODE ? 'EJECUCION REAL' : 'DRY-RUN (solo lectura)'}`);
}

async function backupCollections(db: Firestore, collections: readonly string[], backupDir: string): Promise<void> {
  logSection('RESPALDO PREVIO AUTOMATICO');
  logInfo(`Destino del respaldo: ${backupDir}`);
  fs.mkdirSync(backupDir, { recursive: true });
  for (const col of collections) {
    try {
      const snapshot = await db.collection(col).get();
      const docs: Record<string, unknown> = {};
      snapshot.docs.forEach((doc) => { docs[doc.id] = doc.data(); });
      fs.writeFileSync(path.join(backupDir, `${col}.json`), JSON.stringify(docs, null, 2), 'utf-8');
      logOk(`  Respaldado: ${col} (${snapshot.docs.length} documentos)`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logErr(`  Error respaldando ${col}: ${msg}`);
      throw new Error(`Respaldo de "${col}" fallo. Abortando para proteger datos.`);
    }
  }
  try {
    const authApp = getAuth(); const allUsers: unknown[] = []; let pageToken: string | undefined;
    do {
      const result = await authApp.listUsers(1000, pageToken);
      allUsers.push(...result.users.map((u) => ({ uid: u.uid, email: u.email, displayName: u.displayName, customClaims: u.customClaims, disabled: u.disabled, creationTime: u.metadata.creationTime })));
      pageToken = result.pageToken;
    } while (pageToken);
    fs.writeFileSync(path.join(backupDir, '_auth_users.json'), JSON.stringify(allUsers, null, 2), 'utf-8');
    logOk(`  Respaldado: Auth Users (${allUsers.length} usuarios)`);
  } catch (err: unknown) { logWarn(`  No se pudieron respaldar usuarios de Auth: ${err instanceof Error ? err.message : String(err)}`); }
  logOk(`Respaldo completado en: ${backupDir}`);
}

async function countCollection(db: Firestore, col: string): Promise<number> {
  const snapshot = await db.collection(col).count().get();
  return snapshot.data().count;
}

interface UserAudit { uid: string; email: string; protected: boolean; reason?: string; }

async function auditAuthUsers(authClient: Auth): Promise<UserAudit[]> {
  const result: UserAudit[] = []; let pageToken: string | undefined;
  do {
    const page = await authClient.listUsers(1000, pageToken);
    for (const user of page.users) {
      const email = (user.email ?? '').toLowerCase();
      const isProtected = PROTECTED_EMAILS.has(email);
      result.push({ uid: user.uid, email: user.email ?? '(sin correo)', protected: isProtected, reason: isProtected ? (PROGRAMMER_EMAILS.includes(email) ? 'PROGRAMMER_EMAILS' : 'KEEP_OWNER_EMAILS') : undefined });
    }
    pageToken = page.pageToken;
  } while (pageToken);
  return result;
}

async function deleteCollection(db: Firestore, col: string, isDryRun: boolean): Promise<number> {
  if (isDryRun) { const count = await countCollection(db, col); logDryRun(`Borraria ${count} docs de "${col}"`); return count; }
  const snapshot = await db.collection(col).get();
  if (snapshot.empty) return 0;
  const bw: BulkWriter = db.bulkWriter();
  for (const doc of snapshot.docs) bw.delete(doc.ref as DocumentReference);
  await bw.close();
  for (const doc of snapshot.docs) { try { await db.recursiveDelete(doc.ref); } catch { /* ignorar */ } }
  return snapshot.docs.length;
}

async function handleStorage(isDryRun: boolean): Promise<number> {
  try {
    const bucket = getStorage().bucket(); const [files] = await bucket.getFiles(); const count = files.length;
    if (isDryRun) { logDryRun(`Borraria ${count} archivos en Storage`); return count; }
    const batchSize = 10;
    for (let i = 0; i < files.length; i += batchSize) {
      await Promise.allSettled(files.slice(i, i + batchSize).map((f) => f.delete()));
      process.stdout.write(`\r  Eliminados: ${Math.min(i + batchSize, count)}/${count}  `);
    }
    console.log(); return count;
  } catch (err: unknown) { logWarn(`No se pudo limpiar Storage: ${err instanceof Error ? err.message : String(err)}`); return 0; }
}

async function cleanupAuthUsers(authClient: Auth, users: UserAudit[], isDryRun: boolean): Promise<{ deleted: number; protected: number }> {
  const toDelete = users.filter((u) => !u.protected); const toProtect = users.filter((u) => u.protected);
  if (isDryRun) { logDryRun(`Borraria ${toDelete.length} usuarios de Auth`); logDryRun(`Protegeria: ${toProtect.map((u) => u.email).join(', ') || '(ninguno)'}`); return { deleted: 0, protected: toProtect.length }; }
  let deleted = 0;
  for (let i = 0; i < toDelete.length; i += 100) {
    await authClient.deleteUsers(toDelete.slice(i, i + 100).map((u) => u.uid));
    deleted += Math.min(100, toDelete.length - i);
    process.stdout.write(`\r  Eliminados: ${deleted}/${toDelete.length}  `);
  }
  if (toDelete.length > 0) console.log();
  return { deleted, protected: toProtect.length };
}

async function cleanupUserDocs(db: Firestore, users: UserAudit[], isDryRun: boolean): Promise<number> {
  const toDelete = users.filter((u) => !u.protected);
  if (isDryRun) { logDryRun(`Borraria ${toDelete.length} docs de "users"`); return 0; }
  const bw = db.bulkWriter();
  for (const u of toDelete) bw.delete(db.collection('users').doc(u.uid));
  await bw.close(); return toDelete.length;
}

async function createAuditLog(db: Firestore, summary: Record<string, unknown>, isDryRun: boolean): Promise<void> {
  if (isDryRun) { logDryRun('Crearia doc en "auditLogs"'); return; }
  await db.collection('auditLogs').add({ type: 'PRODUCTION_CLEANUP', timestamp: new Date().toISOString(), operator: process.env.OPERATOR_EMAIL ?? 'script-cleanup', projectId: PROJECT_ID, summary });
}

async function main() {
  log(`\n${BOLD}${CYAN}Sayta Mall - Herramienta de Limpieza de Produccion${RESET}\n`);
  checkSafetyGuards();

  if (IS_EXECUTE_MODE) {
    logSection('CONFIRMACION OBLIGATORIA');
    logWarn('Estas a punto de BORRAR PERMANENTEMENTE datos de produccion.');
    const typed = await askQuestion(`${YELLOW}Escribe el ID del proyecto Firebase para confirmar: ${RESET}`);
    if (typed !== PROJECT_ID) { logErr(`ID "${typed}" no coincide con "${PROJECT_ID}". Abortando.`); process.exit(1); }
    logOk(`Confirmacion correcta: "${PROJECT_ID}"`);
  }

  logSection('INICIALIZANDO FIREBASE ADMIN SDK');
  const app = initAdminApp();
  const db = getFirestore(app);
  const authClient = getAuth(app);
  logOk(`Conectado al proyecto: ${PROJECT_ID}`);

  logSection('AUDITORIA DE USUARIOS FIREBASE AUTH');
  const users = await auditAuthUsers(authClient);
  const protected_ = users.filter((u) => u.protected);
  const toDeleteUsers = users.filter((u) => !u.protected);
  log(`  Total: ${users.length} | Protegidos: ${protected_.length} | A eliminar: ${toDeleteUsers.length}`);
  protected_.forEach((u) => log(`  ${GREEN}PROTEGIDO${RESET}: ${u.email} (${u.reason})`));
  if (!IS_EXECUTE_MODE) toDeleteUsers.slice(0, 10).forEach((u) => logDryRun(`Borraria: ${u.email}`));
  if (toDeleteUsers.length > 10 && !IS_EXECUTE_MODE) logDryRun(`... y ${toDeleteUsers.length - 10} mas`);

  logSection('AUDITORIA DE COLECCIONES FIRESTORE');
  const collectionCounts: Record<string, number> = {}; let totalDocs = 0;
  for (const col of COLLECTIONS_TO_DELETE) {
    try {
      const count = await countCollection(db, col); collectionCounts[col] = count; totalDocs += count;
      log(`  ${count > 0 ? RED + 'HAS' + RESET : DIM + 'empty' + RESET} ${col.padEnd(25)} ${BOLD}${count}${RESET}`);
    } catch (err: unknown) { log(`  ${YELLOW}ERR${RESET} ${col.padEnd(25)} (${err instanceof Error ? err.message : String(err)})`); collectionCounts[col] = 0; }
  }
  const usersCount = await countCollection(db, 'users');
  log(`  ${YELLOW}PARTIAL${RESET} users${' '.repeat(20)} ${BOLD}${usersCount}${RESET} total | ${toDeleteUsers.length} a eliminar | ${protected_.length} protegidos`);
  log(`\n  ${BOLD}Total documentos a eliminar: ~${totalDocs + toDeleteUsers.length}${RESET}`);

  logSection('AUDITORIA DE FIREBASE STORAGE');
  const storageCount = await handleStorage(true);

  if (!IS_EXECUTE_MODE) {
    logSection('RESUMEN DRY-RUN');
    log(`${GREEN}${BOLD}No se ha modificado nada.${RESET}\n`);
    log(`Resumen de lo que se borraria con --execute:\n`);
    log(`  - Usuarios Auth:        ${toDeleteUsers.length}`);
    log(`  - Docs Firestore:       ${totalDocs + toDeleteUsers.length}`);
    Object.entries(collectionCounts).filter(([, c]) => c > 0).forEach(([col, c]) => log(`      ${col}: ${c}`));
    log(`      users: ${toDeleteUsers.length}`);
    log(`  - Archivos Storage:     ${storageCount}`);
    log(`  - Usuarios protegidos:  ${protected_.length} (${protected_.map((u) => u.email).join(', ') || 'ninguno'})\n`);
    log(`${YELLOW}Para ejecutar el borrado real:${RESET}`);
    log(`  npx ts-node scripts/cleanup-production.ts --execute\n`);
    return;
  }

  const now = new Date();
  const stamp = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
  const backupDir = path.join(__dirname, '..', 'backups', stamp);
  try { await backupCollections(db, COLLECTIONS_TO_DELETE, backupDir); } catch (err: unknown) { logErr(`Respaldo fallido: ${err instanceof Error ? err.message : String(err)}\nAbortando.`); process.exit(1); }

  logSection('LIMPIEZA DE COLECCIONES FIRESTORE');
  let deletedDocs = 0;
  for (const col of COLLECTIONS_TO_DELETE) {
    try { process.stdout.write(`  ${col.padEnd(25)}`); const count = await deleteCollection(db, col, false); deletedDocs += count; console.log(`${GREEN}ok${RESET} ${count}`); }
    catch (err: unknown) { console.log(`${RED}err${RESET} ${err instanceof Error ? err.message : String(err)}`); }
  }

  logSection('LIMPIEZA DE COLECCION users');
  const userDocsDeleted = await cleanupUserDocs(db, users, false);
  logOk(`Docs users eliminados: ${userDocsDeleted} | Preservados: ${protected_.length}`);

  logSection('LIMPIEZA DE FIREBASE STORAGE');
  const storageDeleted = await handleStorage(false);
  logOk(`Archivos Storage eliminados: ${storageDeleted}`);

  logSection('LIMPIEZA DE FIREBASE AUTH');
  const { deleted: authDeleted, protected: authProtected } = await cleanupAuthUsers(authClient, users, false);
  logOk(`Usuarios Auth eliminados: ${authDeleted} | Protegidos: ${authProtected}`);

  logSection('REGISTRO DE AUDITORIA');
  await createAuditLog(db, { collectionsDeleted: deletedDocs, userDocsDeleted, storageFilesDeleted: storageDeleted, authUsersDeleted: authDeleted, protectedUsers: protected_.map((u) => ({ email: u.email, reason: u.reason })), backupLocation: backupDir, executedAt: new Date().toISOString() }, false);
  logOk('Documento de auditoria creado en "auditLogs".');

  logSection('RESUMEN FINAL');
  logOk(`Docs Firestore eliminados: ${deletedDocs + userDocsDeleted}`);
  logOk(`Archivos Storage eliminados: ${storageDeleted}`);
  logOk(`Usuarios Auth eliminados: ${authDeleted}`);
  logOk(`Usuarios protegidos (intactos): ${authProtected}`);
  logOk(`Respaldo en: ${backupDir}`);
  log(`\n${GREEN}${BOLD}Limpieza de produccion completada.${RESET}\n`);
}

main().catch((err) => { logErr(`Error fatal: ${err instanceof Error ? err.message : String(err)}`); process.exit(1); });
