// src/types/delivery.types.ts
// Tipos de datos para el módulo de Empresas de Delivery y Envíos Locales

export interface DeliveryCompany {
  id: string;
  nombre: string;
  whatsapp: string;            // Formato internacional, ej: +50588881234
  telefono?: string;           // Teléfono alternativo
  email?: string;              // Para notificaciones automáticas por correo
  zonas_cobertura: string[];   // Lista de ciudades/zonas donde opera (ej: ['Chichigalpa', 'Chinandega'])
  costo_envio: number;         // Tarifa base de envío en moneda local
  logo?: string;               // URL de la imagen o logo de la empresa
  estado: boolean;             // true = activa, false = inactiva
  deleted?: boolean;           // Soft delete para preservar histórico de pedidos
  orders_count?: number;       // Contador de pedidos asignados
  created_at: string;          // ISO timestamp
  updated_at: string;          // ISO timestamp
}

export type OrderChannel = 'web' | 'whatsapp';

export type DeliveryOrderStatus =
  | 'pendiente'
  | 'enviado_a_empresa'
  | 'en_camino'
  | 'entregado'
  | 'cancelado';

export interface OrderItemPayload {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
  image?: string;
}

export interface CustomerDeliveryInfo {
  nombre: string;
  telefono: string;
  direccion: string;
  referencias?: string;
  ciudad?: string;
  notas?: string;
}

export interface DeliveryOrder {
  id: string;                  // Código ej: SAYTA-12345
  customerId?: string;
  cliente: CustomerDeliveryInfo;
  empresa_delivery_id: string;
  empresa_delivery_nombre: string;
  empresa_delivery_whatsapp: string;
  sucursal_nombre?: string;    // Nombre de la sucursal donde se realiza el pedido
  canal_pedido: OrderChannel;
  items: OrderItemPayload[];
  subtotal: number;
  costo_envio: number;
  descuento: number;
  total: number;
  moneda: string;              // 'NIO' | 'MXN' | 'USD'
  metodo_pago: string;         // 'efectivo' | 'transferencia' | 'tarjeta'
  estado: DeliveryOrderStatus;
  notificado_empresa: boolean;
  whatsapp_url?: string;
  created_at: string;
  updated_at: string;
}
