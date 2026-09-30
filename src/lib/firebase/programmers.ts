// src/lib/firebase/programmers.ts
// Gestión y persistencia del equipo de programadores (Multi-Programmer)
// Mantiene seguro y protegido al Programador Superadmin principal (christhiam@ghost.com)

import { readRtdb, writeRtdb, deleteRtdb } from './rtdb';

export interface ProgrammerRecord {
  id: string;
  email: string;
  name: string;
  password?: string; // Almacenado para autenticación
  roleTitle: string; // Ej: "Superadmin Principal", "Backend Lead", "Fullstack Developer"
  createdAt: string;
  isRoot?: boolean; // true únicamente para christhiam@ghost.com
}

// Credenciales del Superadmin Principal (Root)
export const ROOT_PROGRAMMER_EMAIL = (
  process.env.PROGRAMMER_EMAIL || 'christhiam@ghost.com'
).trim().toLowerCase();

export const ROOT_PROGRAMMER_PASSWORD =
  process.env.PROGRAMMER_PASSWORD || '27478426.27478426';

export const ROOT_PROGRAMMER: ProgrammerRecord = {
  id: 'programmer-root',
  email: ROOT_PROGRAMMER_EMAIL,
  name: 'Christhiam Superadmin',
  roleTitle: 'Superadmin & Arquitecto Principal',
  password: ROOT_PROGRAMMER_PASSWORD,
  createdAt: '2025-01-01T00:00:00.000Z',
  isRoot: true,
};

// Almacén en memoria para respaldo
let localProgrammers: ProgrammerRecord[] = [];

/**
 * Obtiene la lista completa de programadores autorizados
 * Siempre incluye al root (christhiam@ghost.com)
 */
export async function getProgrammersFromDb(): Promise<ProgrammerRecord[]> {
  try {
    const rtdbProgrammers = await readRtdb<Record<string, ProgrammerRecord>>('programmers');
    let dbList: ProgrammerRecord[] = [];

    if (rtdbProgrammers && typeof rtdbProgrammers === 'object') {
      dbList = Object.entries(rtdbProgrammers).map(([id, item]) => ({
        ...item,
        id,
        isRoot: item.email?.trim().toLowerCase() === ROOT_PROGRAMMER_EMAIL,
      }));
    }

    // Combinar mapa
    const map = new Map<string, ProgrammerRecord>();
    // 1. Agregar root
    map.set(ROOT_PROGRAMMER.email.toLowerCase(), ROOT_PROGRAMMER);

    // 2. Agregar memoria
    localProgrammers.forEach((p) => {
      map.set(p.email.toLowerCase(), p);
    });

    // 3. Agregar de RTDB
    dbList.forEach((p) => {
      map.set(p.email.toLowerCase(), p);
    });

    return Array.from(map.values());
  } catch (error) {
    console.warn('[Programmers] Error leyendo de RTDB:', error);
    const map = new Map<string, ProgrammerRecord>();
    map.set(ROOT_PROGRAMMER.email.toLowerCase(), ROOT_PROGRAMMER);
    localProgrammers.forEach((p) => map.set(p.email.toLowerCase(), p));
    return Array.from(map.values());
  }
}

/**
 * Guarda o crea un nuevo programador en el sistema
 */
export async function saveProgrammerToDb(data: {
  name: string;
  email: string;
  password: string;
  roleTitle?: string;
}): Promise<ProgrammerRecord> {
  const cleanEmail = data.email.trim().toLowerCase();

  // No permitir sobreescribir al root
  if (cleanEmail === ROOT_PROGRAMMER_EMAIL) {
    throw new Error('No es posible modificar al programador principal del sistema.');
  }

  const id = `prog_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newProgrammer: ProgrammerRecord = {
    id,
    email: cleanEmail,
    name: data.name.trim(),
    password: data.password.trim(),
    roleTitle: (data.roleTitle || 'Desarrollador / Programador').trim(),
    createdAt: new Date().toISOString(),
    isRoot: false,
  };

  // Guardar en RTDB
  await writeRtdb(`programmers/${id}`, newProgrammer);

  // Guardar en memoria
  localProgrammers = localProgrammers.filter((p) => p.email.toLowerCase() !== cleanEmail);
  localProgrammers.push(newProgrammer);

  return newProgrammer;
}

/**
 * Elimina un programador del sistema (excepto el root)
 */
export async function deleteProgrammerFromDb(id: string): Promise<boolean> {
  // Proteger el root
  if (id === ROOT_PROGRAMMER.id) {
    return false;
  }

  const programmers = await getProgrammersFromDb();
  const target = programmers.find((p) => p.id === id);

  if (!target || target.isRoot || target.email.toLowerCase() === ROOT_PROGRAMMER_EMAIL) {
    return false;
  }

  await deleteRtdb(`programmers/${id}`);
  localProgrammers = localProgrammers.filter((p) => p.id !== id);
  return true;
}
