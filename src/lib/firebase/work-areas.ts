// src/lib/firebase/work-areas.ts
// Gestión y persistencia de Áreas de Trabajo (predeterminadas y personalizadas)

import { readRtdb, writeRtdb, deleteRtdb } from './rtdb';

export interface WorkArea {
  id: string;
  name: string;
  isCustom?: boolean;
  createdAt?: string;
}

// Áreas predeterminadas del sistema
export const DEFAULT_WORK_AREAS: WorkArea[] = [
  { id: 'caja', name: 'Caja', isCustom: false },
  { id: 'bodega', name: 'Bodega', isCustom: false },
  { id: 'ventas', name: 'Ventas', isCustom: false },
  { id: 'limpieza', name: 'Limpieza', isCustom: false },
  { id: 'atencion_cliente', name: 'Atención al Cliente', isCustom: false },
  { id: 'general', name: 'General', isCustom: false },
];

let localCustomAreas: WorkArea[] = [];

/**
 * Obtiene todas las áreas de trabajo (predeterminadas + personalizadas guardadas en RTDB)
 */
export async function getWorkAreasFromDb(): Promise<WorkArea[]> {
  try {
    const rtdbAreas = await readRtdb<Record<string, WorkArea>>('work_areas');
    let customList: WorkArea[] = [];

    if (rtdbAreas && typeof rtdbAreas === 'object') {
      customList = Object.entries(rtdbAreas).map(([id, item]) => ({
        ...item,
        id,
        isCustom: true,
      }));
    }

    // Combinar con memoria
    const map = new Map<string, WorkArea>();
    DEFAULT_WORK_AREAS.forEach((a) => map.set(a.id, a));
    localCustomAreas.forEach((a) => map.set(a.id, a));
    customList.forEach((a) => map.set(a.id, a));

    return Array.from(map.values());
  } catch (error) {
    console.warn('[Work Areas] Error leyendo de RTDB:', error);
    const map = new Map<string, WorkArea>();
    DEFAULT_WORK_AREAS.forEach((a) => map.set(a.id, a));
    localCustomAreas.forEach((a) => map.set(a.id, a));
    return Array.from(map.values());
  }
}

/**
 * Guarda una nueva área de trabajo personalizada
 */
export async function saveWorkAreaToDb(name: string): Promise<WorkArea> {
  const cleanName = name.trim();
  const id = `area-${cleanName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')}`;

  const newArea: WorkArea = {
    id,
    name: cleanName,
    isCustom: true,
    createdAt: new Date().toISOString(),
  };

  await writeRtdb(`work_areas/${id}`, newArea);

  // Memoria
  const exists = localCustomAreas.some((a) => a.id === id);
  if (!exists) {
    localCustomAreas.push(newArea);
  }

  return newArea;
}

/**
 * Elimina un área personalizada de RTDB
 */
export async function deleteWorkAreaFromDb(id: string): Promise<boolean> {
  // No permitir borrar áreas predeterminadas
  if (DEFAULT_WORK_AREAS.some((a) => a.id === id)) {
    return false;
  }

  await deleteRtdb(`work_areas/${id}`);
  localCustomAreas = localCustomAreas.filter((a) => a.id !== id);
  return true;
}
