// src/types/message.types.ts
import type { Timestamp } from 'firebase/firestore';

export type ConversationType = 'pedido' | 'general';
export type ConversationStatus = 'abierta' | 'cerrada';
export type MessageSenderRole = 'cliente' | 'empleado' | 'sistema';
export type MessageType = 'texto' | 'imagen' | 'sistema' | 'accion';
export type MessageStatus = 'enviado' | 'entregado' | 'leido';

export type CustomerDecision = 'sin_producto' | 'sustituido' | 'esperar' | 'cancelado';

export interface ActionButton {
  id: string; // 'continue_without' | 'substitute' | 'wait_stock' | 'cancel_order'
  label: string;
  decision: CustomerDecision;
  estilo?: 'primary' | 'secondary' | 'danger' | 'warning';
  datos?: any; // Ej: { productId: string, substituteProductId?: string, diffPrice?: number }
}

export interface MissingItemRecord {
  productId: string;
  productName: string;
  cantidadFaltante: number;
  cantidadOriginal: number;
  precioUnitario: number;
  motivo: 'agotado' | 'dañado' | 'error_inventario';
  sustitutoSugerido?: {
    productId: string;
    name: string;
    price: number;
    image?: string;
  };
  decisionCliente?: CustomerDecision;
  resuelto?: boolean;
}

export interface ConversationDocument {
  id: string;
  pedido_id?: string;
  pedido_order_number?: string;
  usuario_id: string; // ID del cliente
  cliente_nombre: string;
  cliente_telefono?: string;
  sucursal_id: string;
  sucursal_nombre: string;
  tipo: ConversationType;
  estado: ConversationStatus;
  ultimo_mensaje: string;
  ultimo_mensaje_at: Timestamp | Date;
  no_leidos_cliente: number;
  no_leidos_personal: number;
  pedido_estado?: string;
  empleado_responsable_id?: string;
  empleado_responsable_nombre?: string;
  created_at: Timestamp | Date;
  updated_at: Timestamp | Date;
}

export interface MessageDocument {
  id: string;
  conversacion_id: string;
  emisor_id: string;
  emisor_nombre: string;
  emisor_rol: MessageSenderRole;
  tipo: MessageType;
  contenido: string;
  imagen_url?: string;
  acciones?: ActionButton[];
  respuesta_elegida?: string;
  estado: MessageStatus;
  created_at: Timestamp | Date;
}

export interface MessageTemplate {
  id: string;
  titulo: string;
  texto: string;
  sucursal_id?: string;
}
