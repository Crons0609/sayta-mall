// src/types/user.types.ts
import { UserRole, EmployeeArea } from '@/lib/constants';

// ─── Custom Claims (almacenados en el JWT de Firebase Auth) ────────────────────
export interface UserClaims {
  role: UserRole;
  branchIds: string[];  // Sucursales accesibles
  area?: EmployeeArea;  // Solo para empleados
  suspended?: boolean;  // Empleado suspendido temporalmente
  ownerId?: string;     // Para empleados: UID del dueño que los invitó
  phoneNumber?: string;
  phoneVerified?: boolean;
  isNaturalPerson?: boolean;
}

// ─── Documento en Firestore: users/{uid} ───────────────────────────────────────
export interface UserDocument {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: UserRole;
  branchIds: string[];
  area?: EmployeeArea;
  suspended: boolean;
  ownerId?: string;
  phoneNumber?: string;
  phoneVerified?: boolean;
  isNaturalPerson?: boolean;
  phoneVerifiedAt?: FirebaseFirestore.Timestamp | Date;
  createdAt: FirebaseFirestore.Timestamp | Date;
  updatedAt: FirebaseFirestore.Timestamp | Date;
  lastLoginAt?: FirebaseFirestore.Timestamp | Date;
  deletedAt?: FirebaseFirestore.Timestamp | Date; // soft delete
  // Preferencias del usuario
  preferences?: {
    darkMode?: boolean;
    language?: string;
    notifications?: boolean;
  };
}

// ─── Documento en Firestore: invitations/{id} ─────────────────────────────────
export interface InvitationDocument {
  id: string;
  email: string;             // Correo Gmail del invitado
  role: 'owner' | 'employee';
  branchIds: string[];       // Sucursales a las que se da acceso
  area?: EmployeeArea;       // Para empleados
  invitedBy: string;         // UID del dueño o programador que invitó
  invitedByName: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  createdAt: FirebaseFirestore.Timestamp | Date;
  expiresAt: FirebaseFirestore.Timestamp | Date;  // 7 días por defecto
  acceptedAt?: FirebaseFirestore.Timestamp | Date;
  acceptedByUid?: string;
}

// ─── Versión "segura" del perfil para exponer al cliente ──────────────────────
export interface PublicUserProfile {
  uid: string;
  displayName: string;
  photoURL: string | null;
}
