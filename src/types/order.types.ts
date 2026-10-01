// src/types/order.types.ts
import type { Timestamp } from 'firebase/firestore';
import type { OrderStatus, DeliveryType } from '@/lib/constants';
import type { MissingItemRecord } from './message.types';

// --- Documento en Firestore: pedidos/{id} ------------------------------------
export interface OrderDocument {
  id: string;
  orderNumber: string; // Número amigable ej: SAYTA-12345

  branchId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;

  empresaDeliveryId?: string;
  empresaDeliveryNombre?: string;
  empresaDeliveryWhatsapp?: string;

  status: OrderStatus;
  deliveryType: DeliveryType;

  cliente?: {
    nombre: string;
    telefono?: string;
    direccion: string;
    referencias?: string;
    ciudad?: string;
    notas?: string;
  };

  deliveryAddress?: {
    street: string;
    referencias?: string;
    ciudad?: string;
    notas?: string;
  };

  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  currency: string;

  // Faltantes y gestión de espera
  faltantes?: MissingItemRecord[];
  decision_cliente?: string;
  espera_cliente_desde?: Timestamp | Date;
  total_original?: number;
  total_ajustado?: number;
  conversacion_id?: string;

  customerNotes?: string;
  staffNotes?: string;

  // Pago - rellenado al validar por el delivery
  pago?: {
    metodo: 'efectivo' | 'tarjeta' | 'transferencia';
    monto: number;
    referencia?: string;
  };

  deliveryNombre?: string;
  validadoPor?: string;

  empleadoAsignadoId?: string;
  empleadoAsignadoNombre?: string;

  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  expiraAt?: Timestamp | Date;
  validadoAt?: Timestamp | Date;
  preparandoAt?: Timestamp | Date;
  listoAt?: Timestamp | Date;
  canceladoAt?: Timestamp | Date;
  canceladoPor?: string;
  motivoCancelacion?: string;
}

// --- Subcolección: pedidos/{id}/items/{itemId} -------------------------------
export interface OrderItemDocument {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  estado_item?: 'ok' | 'faltante' | 'sustituido' | 'eliminado';
  sustituto_producto_id?: string;
  motivo_faltante?: string;
}

// --- QR Token (qr_tokens/{id}) -----------------------------------------------
export interface QrToken {
  id: string;
  sucursalId: string;
  token: string;
  tipo: 'dinamico' | 'fijo';
  expiraAt: Timestamp | Date;
  usado: boolean;
  creadoPor: string;
  createdAt: Timestamp | Date;
}

// --- Sesión temporal del delivery (sesiones_delivery/{id}) -------------------
export interface DeliverySession {
  id: string;
  firebaseUid: string;
  sucursalId: string;
  nombre: string;
  empresaDeliveryId: string;
  empresaDeliveryNombre: string;
  expiraAt: Timestamp | Date;
  createdAt: Timestamp | Date;
}

// --- Payload checkout desde el CartDrawer ------------------------------------
export interface CheckoutPayload {
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  cliente: {
    nombre: string;
    telefono: string;
    direccion: string;
    referencias?: string;
    ciudad?: string;
    notas?: string;
  };
  empresaDeliveryId: string;
  sucursalId: string;
  descuento?: number;
}
