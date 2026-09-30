// src/types/branch.types.ts
import type { Timestamp } from 'firebase/firestore';

// ─── Documento en Firestore: branches/{id} ────────────────────────────────────
export interface BranchDocument {
  id: string;
  name: string;
  slug: string;               // URL amigable
  ownerId: string;            // UID del dueño principal
  ownerIds: string[];         // Todos los dueños (puede ser varios)
  address: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  description?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  // Horarios de apertura
  schedule?: {
    [day: string]: { open: string; close: string; closed?: boolean };
  };
  // Configuración de moneda e impuestos
  currency: string;           // 'MXN', 'USD', etc.
  currencySymbol: string;     // '$', 'Q', etc.
  taxRate: number;            // porcentaje, ej: 16 para 16%
  taxIncluded: boolean;       // si el precio incluye IVA
  // Entrega
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  deliveryZones?: DeliveryZone[];
  // Coordenadas para el mapa
  lat?: number;
  lng?: number;
  mapsUrl?: string;
  // Estado
  active: boolean;
  status?: 'active' | 'inactive' | 'closed';
  isPublic?: boolean;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface DeliveryZone {
  name: string;
  deliveryFee: number;
  estimatedMinutes: number;
  areas: string[]; // colonias, barrios o códigos postales
}

// ─── Tipos de documentos de productos ────────────────────────────────────────
export interface BranchStats {
  branchId: string;
  branchName: string;
  totalProducts: number;
  totalOrders: number;
  totalSalesAmount: number;
  pendingOrders: number;
  lowStockProducts: number;
  totalEmployees: number;
}
