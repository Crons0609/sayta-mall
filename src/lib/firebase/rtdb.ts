// src/lib/firebase/rtdb.ts
// Conector y funciones de sincronización con Firebase Realtime Database
// Compatible tanto con entornos de servidor (API Routes) como de cliente (Browser).

const RTDB_URL =
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
  'https://saytamall-default-rtdb.firebaseio.com';

/**
 * Operación genérica para escribir un registro en Realtime Database
 */
export async function writeRtdb(path: string, data: any): Promise<boolean> {
  try {
    const cleanPath = path.replace(/^\/+|\/+$/g, '');
    const url = `${RTDB_URL}/${cleanPath}.json`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      cache: 'no-store',
    });
    return res.ok;
  } catch (error) {
    console.error(`[Firebase RTDB] Error escribiendo en ${path}:`, error);
    return false;
  }
}

/**
 * Operación genérica para leer datos de Realtime Database
 */
export async function readRtdb<T = any>(path: string): Promise<T | null> {
  try {
    const cleanPath = path.replace(/^\/+|\/+$/g, '');
    const url = `${RTDB_URL}/${cleanPath}.json`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error(`[Firebase RTDB] Error leyendo de ${path}:`, error);
    return null;
  }
}

/**
 * Operación genérica para eliminar datos de Realtime Database
 */
export async function deleteRtdb(path: string): Promise<boolean> {
  try {
    const cleanPath = path.replace(/^\/+|\/+$/g, '');
    const url = `${RTDB_URL}/${cleanPath}.json`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.ok;
  } catch (error) {
    console.error(`[Firebase RTDB] Error eliminando ${path}:`, error);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// SUCURSALES (Branches)
// ─────────────────────────────────────────────────────────────
export async function saveBranchToRtdb(branch: any): Promise<boolean> {
  const branchId = branch.id || `branch-${Date.now()}`;
  return writeRtdb(`branches/${branchId}`, { ...branch, id: branchId });
}

export async function getBranchesFromRtdb(): Promise<any[]> {
  const data = await readRtdb<Record<string, any>>('branches');
  if (!data) return [];
  return Object.entries(data).map(([id, item]) => ({
    id,
    ...item,
  }));
}

// ─────────────────────────────────────────────────────────────
// EMPLEADOS (Employees)
// ─────────────────────────────────────────────────────────────
export async function saveEmployeeToRtdb(employee: any): Promise<boolean> {
  const employeeId = employee.id || `emp-${Date.now()}`;
  return writeRtdb(`employees/${employeeId}`, { ...employee, id: employeeId });
}

export async function getEmployeesFromRtdb(): Promise<any[]> {
  const data = await readRtdb<Record<string, any>>('employees');
  if (!data) return [];
  return Object.entries(data).map(([id, item]) => ({
    id,
    ...item,
  }));
}

export async function deleteEmployeeFromRtdb(employeeId: string): Promise<boolean> {
  return deleteRtdb(`employees/${employeeId}`);
}

// ─────────────────────────────────────────────────────────────
// PRODUCTOS Y ARTÍCULOS (Products)
// ─────────────────────────────────────────────────────────────
export async function saveProductToRtdb(product: any): Promise<boolean> {
  const productId = product.id || product.productId || `prod-${Date.now()}`;
  return writeRtdb(`products/${productId}`, { ...product, id: productId, productId });
}

export async function getProductsFromRtdb(branchId?: string): Promise<any[]> {
  const data = await readRtdb<Record<string, any>>('products');
  if (!data) return [];
  const list = Object.entries(data).map(([id, item]) => ({
    id,
    ...item,
  }));
  if (branchId) {
    return list.filter((p) => p.branchId === branchId);
  }
  return list;
}

export async function deleteProductFromRtdb(productId: string): Promise<boolean> {
  return deleteRtdb(`products/${productId}`);
}

// ─────────────────────────────────────────────────────────────
// ALIAS GENÉRICO (para uso en API Routes)
// ─────────────────────────────────────────────────────────────
/** Alias de deleteRtdb para uso directo en API routes */
export async function deleteFromRtdb(path: string): Promise<boolean> {
  return deleteRtdb(path);
}

/** Elimina una sucursal de Firebase RTDB */
export async function deleteBranchFromRtdb(branchId: string): Promise<boolean> {
  return deleteRtdb(`branches/${branchId}`);
}

/** Actualiza campos de una sucursal en RTDB (PATCH) */
export async function updateBranchInRtdb(branchId: string, data: any): Promise<boolean> {
  const current = await readRtdb<any>(`branches/${branchId}`);
  const updated = { ...(current || {}), ...data, id: branchId, updatedAt: new Date().toISOString() };
  return writeRtdb(`branches/${branchId}`, updated);
}

// ─────────────────────────────────────────────────────────────
// DUEÑOS / JEFES (Owners)
// ─────────────────────────────────────────────────────────────
export async function saveOwnerToRtdb(owner: any): Promise<boolean> {
  const ownerId = owner.id || `owner-${Date.now()}`;
  return writeRtdb(`owners/${ownerId}`, { ...owner, id: ownerId, updatedAt: new Date().toISOString() });
}

export async function getOwnersFromRtdb(): Promise<any[]> {
  const data = await readRtdb<Record<string, any>>('owners');
  if (!data) return [];
  return Object.entries(data).map(([id, item]) => ({
    id,
    ...item,
  }));
}

export async function updateOwnerInRtdb(ownerId: string, data: any): Promise<boolean> {
  const current = await readRtdb<any>(`owners/${ownerId}`);
  const updated = { ...(current || {}), ...data, id: ownerId, updatedAt: new Date().toISOString() };
  return writeRtdb(`owners/${ownerId}`, updated);
}

export async function deleteOwnerFromRtdb(ownerId: string): Promise<boolean> {
  return deleteRtdb(`owners/${ownerId}`);
}

