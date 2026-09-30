// src/types/product.types.ts
import type { Timestamp } from 'firebase/firestore';
import type { ProductStatus } from '@/lib/constants';

// ─── Documento en Firestore: products/{id} ────────────────────────────────────
export interface ProductDocument {
  id: string;
  branchId: string;
  name: string;
  slug: string;               // URL amigable (auto-generado)
  description: string;
  shortDescription?: string;
  images: ProductImage[];     // máx 5
  categoryId: string;
  categoryName: string;       // desnormalizado para queries rápidas
  brand?: string;
  sku?: string;               // código interno
  barcode?: string;           // código de barras
  stock: number;
  minStock: number;           // umbral de alerta de stock bajo
  status: ProductStatus;
  featured: boolean;          // destacado en la página de inicio
  tags: string[];
  // Precios y Descuentos con Autorización
  price?: number;
  compareAtPrice?: number;
  currency?: string;
  discountPercent?: number;
  discountPrice?: number;
  discountReason?: string;
  discountStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  discountRequestedBy?: { uid: string; name: string; role: string; date: string };
  discountApprovedBy?: { uid: string; name: string; role: string; date: string };
  discountRejectReason?: string;
  // Metadatos
  createdBy: string;          // UID del empleado/dueño
  createdByName?: string;
  createdByRole?: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  deletedAt?: Timestamp | Date; // papelera (soft delete)
  // Auditoría de precio
  priceLastUpdatedBy?: string;
  priceLastUpdatedAt?: Timestamp | Date;
}

// ─── Subcolección: products/{id}/pricing/data ─────────────────────────────────
// SEPARADO del documento principal para que Firestore Rules
// pueda bloquear el precio a visitantes no autenticados.
export interface ProductPricing {
  productId: string;
  branchId: string;
  price: number;              // precio base
  compareAtPrice?: number;    // precio tachado (precio original antes de oferta)
  cost?: number;              // costo (solo visible para dueño/programador)
  currency: string;
  updatedAt: Timestamp | Date;
  updatedBy: string;
}

export interface ProductImage {
  url: string;                // URL pública de Firebase Storage
  storagePath: string;        // ruta en Storage para poder eliminar
  order: number;              // orden de la galería
  alt?: string;
}

// ─── Documento en Firestore: categories/{id} ──────────────────────────────────
export interface CategoryDocument {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  parentId?: string;          // subcategorías
  branchId?: string;          // null = global, string = por sucursal
  order: number;
  active: boolean;
}

// ─── Documento en Firestore: stockMovements/{id} ──────────────────────────────
export interface StockMovementDocument {
  id: string;
  productId: string;
  productName: string;        // desnormalizado
  branchId: string;
  type: 'entry' | 'exit' | 'adjustment' | 'transfer_out' | 'transfer_in' | 'return';
  quantity: number;           // positivo = entrada, negativo = salida
  previousStock: number;
  newStock: number;
  reason: string;             // motivo del movimiento
  reference?: string;         // ej: orderId, transferId, purchaseId
  performedBy: string;        // UID
  performedByName: string;
  createdAt: Timestamp | Date;
}

// ─── Versión pública del producto (sin precio, para visitantes) ───────────────
export type PublicProductDocument = Omit<ProductDocument, 'stock' | 'minStock'> & {
  availability: 'available' | 'low_stock' | 'out_of_stock'; // sin exponer número exacto
};
