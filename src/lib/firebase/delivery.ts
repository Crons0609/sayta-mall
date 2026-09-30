// src/lib/firebase/delivery.ts
// Servicio de datos y sincronización para Empresas de Delivery y Pedidos asociados.
// Compatible con Firebase Realtime Database, Firestore y memoria local.

import { DeliveryCompany, DeliveryOrder } from '@/types/delivery.types';
import { readRtdb, writeRtdb, deleteRtdb } from './rtdb';
import { adminDb } from './admin';

// ─── Empresas iniciales (Vacío: solo aparecen las empresas creadas por el programador) ─────
export const INITIAL_DELIVERY_COMPANIES: DeliveryCompany[] = [];

// Almacén en memoria persistente durante el ciclo de vida del servidor
export let localDeliveryCompanies: DeliveryCompany[] = [];
export let localDeliveryOrders: DeliveryOrder[] = [];

// ─── CRUD EMPRESAS DE DELIVERY ───────────────────────────────────────────────

/**
 * Obtiene todas las empresas de delivery registradas.
 * @param onlyActive Si es true, retorna solo las activas y no eliminadas (para clientes/checkout).
 */
export async function getDeliveryCompaniesFromDb(onlyActive = false): Promise<DeliveryCompany[]> {
  try {
    const rtdbData = await readRtdb<Record<string, DeliveryCompany>>('delivery_companies');
    let list: DeliveryCompany[] = [];

    if (rtdbData && typeof rtdbData === 'object') {
      list = Object.entries(rtdbData).map(([id, item]) => ({
        ...item,
        id,
      }));
    }

    // Combinar con almacén local sin duplicados
    const map = new Map<string, DeliveryCompany>();
    localDeliveryCompanies.forEach((c) => map.set(c.id, c));
    list.forEach((c) => map.set(c.id, c));

    let result = Array.from(map.values());

    // Filtrar eliminadas suavemente (soft-deleted)
    result = result.filter((c) => c.deleted !== true);

    if (onlyActive) {
      result = result.filter((c) => c.estado === true);
    }

    // Ordenar por nombre
    return result.sort((a, b) => a.nombre.localeCompare(b.nombre));
  } catch (error) {
    console.warn('[Delivery Service] Fallback a memoria:', error);
    let fallback = localDeliveryCompanies.filter((c) => c.deleted !== true);
    if (onlyActive) fallback = fallback.filter((c) => c.estado === true);
    return fallback;
  }
}

/**
 * Obtiene una empresa por su ID
 */
export async function getDeliveryCompanyById(id: string): Promise<DeliveryCompany | null> {
  const all = await getDeliveryCompaniesFromDb(false);
  return all.find((c) => c.id === id) || null;
}

/**
 * Guarda o actualiza una empresa de delivery
 */
export async function saveDeliveryCompanyToDb(company: DeliveryCompany): Promise<boolean> {
  try {
    const companyId = company.id || `del-${Date.now()}`;
    const payload: DeliveryCompany = {
      ...company,
      id: companyId,
      updated_at: new Date().toISOString(),
      created_at: company.created_at || new Date().toISOString(),
    };

    // 1. Guardar en RTDB
    await writeRtdb(`delivery_companies/${companyId}`, payload);

    // 2. Guardar en Firestore Admin si está disponible
    if (adminDb) {
      try {
        await adminDb.collection('delivery_companies').doc(companyId).set(payload, { merge: true });
      } catch (err) {
        console.warn('[Delivery Service] Firestore write warning:', err);
      }
    }

    // 3. Guardar en memoria
    const idx = localDeliveryCompanies.findIndex((c) => c.id === companyId);
    if (idx >= 0) {
      localDeliveryCompanies[idx] = payload;
    } else {
      localDeliveryCompanies.unshift(payload);
    }

    return true;
  } catch (error) {
    console.error('[Delivery Service] Error guardando empresa:', error);
    return false;
  }
}

/**
 * Actualiza campos específicos de una empresa (PATCH)
 */
export async function updateDeliveryCompanyInDb(
  id: string,
  updates: Partial<DeliveryCompany>
): Promise<DeliveryCompany | null> {
  const current = await getDeliveryCompanyById(id);
  if (!current) return null;

  const updated: DeliveryCompany = {
    ...current,
    ...updates,
    id,
    updated_at: new Date().toISOString(),
  };

  await saveDeliveryCompanyToDb(updated);
  return updated;
}

/**
 * Elimina o aplica Soft Delete a una empresa de delivery
 * Si tiene pedidos asociados, se marca deleted=true y estado=false
 */
export async function deleteDeliveryCompanyFromDb(id: string): Promise<{ success: boolean; softDeleted: boolean }> {
  try {
    const orders = await getDeliveryOrdersFromDb(id);
    const hasOrders = orders.length > 0;

    if (hasOrders) {
      // Soft delete: conservar registros de auditoría
      await updateDeliveryCompanyInDb(id, {
        deleted: true,
        estado: false,
      });

      // Actualizar memoria
      const found = localDeliveryCompanies.find((c) => c.id === id);
      if (found) {
        found.deleted = true;
        found.estado = false;
      }

      return { success: true, softDeleted: true };
    }

    // Hard delete si no hay pedidos históricos
    await deleteRtdb(`delivery_companies/${id}`);
    if (adminDb) {
      try {
        await adminDb.collection('delivery_companies').doc(id).delete();
      } catch (e) {}
    }
    localDeliveryCompanies = localDeliveryCompanies.filter((c) => c.id !== id);

    return { success: true, softDeleted: false };
  } catch (error) {
    console.error('[Delivery Service] Error eliminando empresa:', error);
    return { success: false, softDeleted: false };
  }
}

// ─── GESTIÓN DE PEDIDOS ASOCIADOS A DELIVERY ────────────────────────────────

/**
 * Guarda un nuevo pedido con atribución a empresa de delivery
 */
export async function saveDeliveryOrderToDb(order: DeliveryOrder): Promise<boolean> {
  try {
    const orderId = order.id || `SAYTA-${Math.floor(10000 + Math.random() * 90000)}`;
    const payload: DeliveryOrder = {
      ...order,
      id: orderId,
      created_at: order.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 1. Guardar pedido en RTDB
    await writeRtdb(`delivery_orders/${orderId}`, payload);

    // 2. Incrementar contador de pedidos en la empresa de delivery
    const company = await getDeliveryCompanyById(order.empresa_delivery_id);
    if (company) {
      await updateDeliveryCompanyInDb(company.id, {
        orders_count: (company.orders_count || 0) + 1,
      });
    }

    // 3. Guardar en Firestore Admin si está disponible
    if (adminDb) {
      try {
        await adminDb.collection('orders').doc(orderId).set(payload, { merge: true });
      } catch (err) {
        console.warn('[Delivery Service] Firestore order warning:', err);
      }
    }

    // 4. Memoria
    localDeliveryOrders.unshift(payload);

    return true;
  } catch (error) {
    console.error('[Delivery Service] Error registrando pedido de delivery:', error);
    return false;
  }
}

/**
 * Consulta pedidos de delivery (opcionalmente filtrados por empresa)
 */
export async function getDeliveryOrdersFromDb(companyId?: string): Promise<DeliveryOrder[]> {
  try {
    const rtdbOrders = await readRtdb<Record<string, DeliveryOrder>>('delivery_orders');
    let list: DeliveryOrder[] = [];

    if (rtdbOrders && typeof rtdbOrders === 'object') {
      list = Object.entries(rtdbOrders).map(([id, item]) => ({
        ...item,
        id,
      }));
    }

    // Combinar con memoria
    const map = new Map<string, DeliveryOrder>();
    localDeliveryOrders.forEach((o) => map.set(o.id, o));
    list.forEach((o) => map.set(o.id, o));

    let result = Array.from(map.values());

    if (companyId) {
      result = result.filter((o) => o.empresa_delivery_id === companyId);
    }

    return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (error) {
    let fallback = [...localDeliveryOrders];
    if (companyId) fallback = fallback.filter((o) => o.empresa_delivery_id === companyId);
    return fallback;
  }
}
