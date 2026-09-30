// src/data/mockEmployees.ts
import { EmployeeArea } from '@/lib/constants';

export interface EmployeeRecord {
  id: string;
  displayName: string;
  email: string;
  role: 'employee';
  area: EmployeeArea;
  branchId: string;
  branchName: string;
  suspended: boolean;
  createdAt: string;
  initialPassword?: string;
  phone?: string;
}

// Lista vacía por defecto: solo aparecen los empleados reales registrados en el sistema
export const INITIAL_EMPLOYEES: EmployeeRecord[] = [];
