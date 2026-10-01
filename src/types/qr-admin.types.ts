// src/types/qr-admin.types.ts
import type { Timestamp } from 'firebase/firestore';

export type QrMode = 'dinamico' | 'fijo';
export type QrStatus = 'activo' | 'inactivo' | 'vencido';
export type QrScanResult = 'valido' | 'vencido' | 'invalido' | 'fuera_de_zona';

export interface BranchQrConfig {
  sucursalId: string;
  sucursalNombre: string;
  qrModo: QrMode;
  qrActivo: boolean;
  qrVigenciaSeg: number;           // Ej: 120s para dinámico
  sesionDeliveryMin: number;       // Ej: 60 - 120 minutos
  geolocalizacionRequerida: boolean;
  radioMetros?: number;
  lat?: number;
  lng?: number;
  tokenHash?: string;
  tokenOriginal?: string;          // Solo en memoria/fijo para imprimir
  ultimoUso?: Timestamp | Date;
  ultimoDeliveryNombre?: string;
  qrRotadoAt?: Timestamp | Date;
  qrRotadoPor?: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface QrScanRecord {
  id: string;
  sucursalId: string;
  tokenId: string;
  deliveryNombre: string;
  empresaDeliveryId?: string;
  empresaDeliveryNombre?: string;
  dispositivo?: string;
  ip?: string;
  resultado: QrScanResult;
  fecha: Timestamp | Date;
}
