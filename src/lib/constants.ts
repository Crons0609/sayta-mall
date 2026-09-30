// src/lib/constants.ts
// Constantes globales del sistema: roles, estados, áreas y configuración.

// ─── Roles del sistema ─────────────────────────────────────────────────────────
export const ROLES = {
  PROGRAMMER: 'programmer',
  OWNER: 'owner',
  EMPLOYEE: 'employee',
  CUSTOMER: 'customer',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

// ─── Áreas de trabajo para empleados ───────────────────────────────────────────
export const EMPLOYEE_AREAS = {
  CAJA: 'caja',
  BODEGA: 'bodega',
  VENTAS: 'ventas',
  LIMPIEZA: 'limpieza',
  ATENCION_CLIENTE: 'atencion_cliente',
  GENERAL: 'general',
} as const;

export type EmployeeArea = (typeof EMPLOYEE_AREAS)[keyof typeof EMPLOYEE_AREAS];

export const EMPLOYEE_AREA_LABELS: Record<EmployeeArea, string> = {
  caja: 'Caja',
  bodega: 'Bodega',
  ventas: 'Ventas',
  limpieza: 'Limpieza',
  atencion_cliente: 'Atención al Cliente',
  general: 'General',
};

// ─── Estados de productos ──────────────────────────────────────────────────────
export const PRODUCT_STATUS = {
  ACTIVE: 'active',
  HIDDEN: 'hidden',
  OUT_OF_STOCK: 'out_of_stock',
  DELETED: 'deleted', // papelera (soft delete)
} as const;

export type ProductStatus = (typeof PRODUCT_STATUS)[keyof typeof PRODUCT_STATUS];

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  active: 'Activo',
  hidden: 'Oculto',
  out_of_stock: 'Agotado',
  deleted: 'Eliminado',
};

// ─── Estados de pedidos ────────────────────────────────────────────────────────
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  preparing: 'En Preparación',
  ready: 'Listo para Recoger',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

// ─── Tipos de entrega ──────────────────────────────────────────────────────────
export const DELIVERY_TYPES = {
  PICKUP: 'pickup',
  DELIVERY: 'delivery',
} as const;

export type DeliveryType = (typeof DELIVERY_TYPES)[keyof typeof DELIVERY_TYPES];

export const DELIVERY_TYPE_LABELS: Record<DeliveryType, string> = {
  pickup: 'Recoger en Tienda',
  delivery: 'Entrega a Domicilio',
};

// ─── Estados de tareas ─────────────────────────────────────────────────────────
export const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
  CANCELLED: 'cancelled',
} as const;

export type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];

// ─── Prioridades de tareas ─────────────────────────────────────────────────────
export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export type TaskPriority = (typeof TASK_PRIORITY)[keyof typeof TASK_PRIORITY];

// ─── Tipos de movimiento de inventario ────────────────────────────────────────
export const STOCK_MOVEMENT_TYPES = {
  ENTRY: 'entry',       // compra/reabastecimiento
  EXIT: 'exit',         // venta
  ADJUSTMENT: 'adjustment', // corrección manual
  TRANSFER_OUT: 'transfer_out', // salida por transferencia
  TRANSFER_IN: 'transfer_in',   // entrada por transferencia
  RETURN: 'return',     // devolución
} as const;

export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[keyof typeof STOCK_MOVEMENT_TYPES];

// ─── Estados de días libres ────────────────────────────────────────────────────
export const DAY_OFF_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type DayOffStatus = (typeof DAY_OFF_STATUS)[keyof typeof DAY_OFF_STATUS];

// ─── Límites de negocio ────────────────────────────────────────────────────────
export const LIMITS = {
  MAX_PRODUCT_IMAGES: 5,
  MAX_IMAGE_SIZE_MB: 5,
  MAX_COMPRESSED_SIZE_KB: 800,
  MAX_PENDING_ORDERS_PER_CUSTOMER: 3,
  LOW_STOCK_THRESHOLD: 5,
  ITEMS_PER_PAGE: 20,
} as const;

// ─── Canales de chat ───────────────────────────────────────────────────────────
export const CHAT_CHANNEL_TYPES = {
  GENERAL: 'general',
  AREA: 'area',
  DIRECT: 'direct',
  GLOBAL: 'global', // dueño + programador
} as const;

export type ChatChannelType = (typeof CHAT_CHANNEL_TYPES)[keyof typeof CHAT_CHANNEL_TYPES];
