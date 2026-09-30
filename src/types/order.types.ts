// src/types/order.types.ts
import type { Timestamp } from 'firebase/firestore';
import type { OrderStatus, DeliveryType } from '@/lib/constants';

// ─── Documento en Firestore: orders/{id} ──────────────────────────────────────
export interface OrderDocument {
  id: string;
  branchId: string;
  customerId: string;           // UID del cliente
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  status: OrderStatus;
  deliveryType: DeliveryType;
  // Dirección de entrega (solo si deliveryType === 'delivery')
  deliveryAddress?: {
    street: string;
    colonia: string;
    city: string;
    state: string;
    postalCode: string;
    references?: string;
  };
  // Resumen de precios
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  couponCode?: string;
  // Notas
  customerNotes?: string;       // notas del cliente
  staffNotes?: string;          // notas internas del personal
  // Metadatos de estado
  confirmedAt?: Timestamp | Date;
  preparingAt?: Timestamp | Date;
  readyAt?: Timestamp | Date;
  deliveredAt?: Timestamp | Date;
  cancelledAt?: Timestamp | Date;
  cancellationReason?: string;
  cancelledBy?: string;         // UID de quien canceló
  // Asignación
  assignedTo?: string;          // UID del empleado asignado
  assignedToName?: string;
  // Auditoría
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

// ─── Documento en Firestore: orderItems/{id} ──────────────────────────────────
// Subcolección: orders/{orderId}/items/{itemId}
export interface OrderItemDocument {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productImage: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

// ─── Documento en Firestore: carts/{uid} ─────────────────────────────────────
export interface CartDocument {
  uid: string;                  // mismo que el UID del usuario
  branchId: string;
  items: CartItem[];
  updatedAt: Timestamp | Date;
}

export interface CartItem {
  productId: string;
  productName: string;
  productImage: string;
  unitPrice: number;
  quantity: number;
  maxQuantity: number;          // stock disponible al momento de agregar
}
