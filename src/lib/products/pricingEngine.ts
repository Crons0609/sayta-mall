// src/lib/products/pricingEngine.ts
// Motor de detección de duplicados, cálculo automático de descuentos e historial de precios.

import { readRtdb, writeRtdb } from '@/lib/firebase/rtdb';

export interface PriceHistoryRecord {
  id: string;
  productId: string;
  productName: string;
  sku?: string;
  precioAnterior: number;
  precioNuevo: number;
  porcentajeCambio: number; // Porcentaje de cambio (negativo si es bajada/descuento)
  tipo: 'descuento_automatico' | 'creacion' | 'ajuste_manual' | 'restauracion';
  empleadoId: string;
  empleadoNombre: string;
  fecha: string;
  motivo?: string;
}

/**
 * Normaliza el nombre de un producto para comparación fiable de duplicados
 * (elimina tildes, minúsculas, espacios adicionales y signos)
 */
export function normalizeProductName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/[^a-z0-9\s]/g, '')     // Quitar puntuación
    .replace(/\s+/g, ' ')            // Unificar espacios
    .trim();
}

/**
 * Normaliza el código SKU para búsqueda exacta
 */
export function normalizeSku(sku?: string): string {
  if (!sku) return '';
  return sku.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
}

/**
 * Busca si un producto ya existe en la lista de inventario.
 * Prioridad 1: Coincidencia por SKU (si está presente).
 * Prioridad 2: Coincidencia por nombre normalizado.
 */
export function findDuplicateProduct(
  candidate: { sku?: string; name: string; id?: string },
  productsList: any[]
): any | null {
  if (!productsList || productsList.length === 0) return null;

  const candidateSku = normalizeSku(candidate.sku);
  const candidateName = normalizeProductName(candidate.name);

  // 1. Buscar por SKU si se ingresó
  if (candidateSku) {
    const matchBySku = productsList.find((p) => {
      if (candidate.id && p.id === candidate.id) return false;
      const existingSku = normalizeSku(p.sku || p.barcode || p.codigo);
      return existingSku === candidateSku;
    });
    if (matchBySku) return matchBySku;
  }

  // 2. Buscar por nombre normalizado
  if (candidateName) {
    const matchByName = productsList.find((p) => {
      if (candidate.id && p.id === candidate.id) return false;
      const existingName = normalizeProductName(p.name || p.nombre || '');
      return existingName === candidateName;
    });
    if (matchByName) return matchByName;
  }

  return null;
}

/**
 * Calcula el porcentaje de descuento y ahorro cuando un precio es menor al original.
 * Fórmula: ((precioOriginal - precioNuevo) / precioOriginal) * 100
 */
export function calculateAutomaticDiscount(
  precioOriginal: number,
  precioNuevo: number
): {
  porcentaje: number;
  ahorro: number;
  esMenor: boolean;
  esIgual: boolean;
  esMayor: boolean;
} {
  const orig = Number(precioOriginal) || 0;
  const nuevo = Number(precioNuevo) || 0;

  if (orig <= 0 || nuevo <= 0) {
    return { porcentaje: 0, ahorro: 0, esMenor: false, esIgual: true, esMayor: false };
  }

  if (nuevo < orig) {
    const rawPercent = ((orig - nuevo) / orig) * 100;
    const porcentaje = Math.round(rawPercent * 100) / 100; // 2 decimales
    const ahorro = Math.round((orig - nuevo) * 100) / 100;
    return {
      porcentaje,
      ahorro,
      esMenor: true,
      esIgual: false,
      esMayor: false,
    };
  }

  if (nuevo > orig) {
    const rawPercent = ((nuevo - orig) / orig) * 100;
    const porcentaje = Math.round(rawPercent * 100) / 100;
    return {
      porcentaje,
      ahorro: 0,
      esMenor: false,
      esIgual: false,
      esMayor: true,
    };
  }

  return {
    porcentaje: 0,
    ahorro: 0,
    esMenor: false,
    esIgual: true,
    esMayor: false,
  };
}

/**
 * Guarda un registro en el historial de precios de RTDB y localStorage
 */
export async function recordPriceHistory(historyItem: PriceHistoryRecord): Promise<boolean> {
  try {
    const recordId = historyItem.id || `ph_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const fullRecord = { ...historyItem, id: recordId };

    // 1. Guardar en Realtime Database
    try {
      await writeRtdb(`price_history/${historyItem.productId}/${recordId}`, fullRecord);
    } catch (e) {
      console.warn('[pricingEngine] RTDB history fallback:', e);
    }

    // 2. Guardar en almacenamiento local
    if (typeof window !== 'undefined') {
      try {
        const key = `sayta_price_history_${historyItem.productId}`;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        existing.unshift(fullRecord);
        localStorage.setItem(key, JSON.stringify(existing.slice(0, 50)));
      } catch {}
    }

    return true;
  } catch (error) {
    console.error('[pricingEngine] Error registrando historial de precio:', error);
    return false;
  }
}

/**
 * Obtiene el historial de precios para un producto
 */
export async function getProductPriceHistory(productId: string): Promise<PriceHistoryRecord[]> {
  const historyList: PriceHistoryRecord[] = [];

  // 1. Leer de RTDB
  try {
    const rtdbData = await readRtdb<Record<string, PriceHistoryRecord>>(`price_history/${productId}`);
    if (rtdbData) {
      Object.values(rtdbData).forEach((item) => historyList.push(item));
    }
  } catch {}

  // 2. Combinar con localStorage
  if (typeof window !== 'undefined') {
    try {
      const key = `sayta_price_history_${productId}`;
      const localData: PriceHistoryRecord[] = JSON.parse(localStorage.getItem(key) || '[]');
      localData.forEach((item) => {
        if (!historyList.some((h) => h.id === item.id)) {
          historyList.push(item);
        }
      });
    } catch {}
  }

  // Ordenar más recientes primero
  return historyList.sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );
}
