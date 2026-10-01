// src/app/dueno/empleados/page.tsx
'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { EmployeeManager } from '@/components/dashboard/EmployeeManager';
import { BranchOnboardingWizard } from '@/components/branch/BranchOnboardingWizard';
import { useBranch } from '@/providers/BranchProvider';
import { useAuth } from '@/providers/AuthProvider';
import { Store, Plus, AlertCircle, Sparkles } from 'lucide-react';

export default function DuenoEmpleadosPage() {
  const { branchCount, loading } = useBranch();
  const { claims } = useAuth();
  const role = claims?.role === 'programmer' ? 'programmer' : 'owner';
  const [showWizard, setShowWizard] = useState(false);

  return (
    <DashboardLayout role={role}>
      <div className="space-y-6">
        {loading ? (
          <div className="py-20 text-center text-xs text-[#86868b] animate-pulse">
            Verificando configuración de sucursales...
          </div>
        ) : branchCount === 0 ? (
          // Bloqueo si no hay sucursales: Se requiere al menos 1 sucursal para dar de alta empleados
          <div className="py-12 px-4 max-w-xl mx-auto text-center space-y-6 animate-fade-in">
            <div className="w-16 h-16 rounded-3xl bg-[#ffd60a]/10 border border-[#ffd60a]/25 text-[#ffd60a] flex items-center justify-center mx-auto">
              <Store className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Crea primero una sucursal antes de agregar empleados
              </h2>
              <p className="text-xs text-[#86868b] leading-relaxed">
                Los empleados del sistema deben estar asignados a una sucursal física operativa (para delimitar su caja, inventario y turno).
              </p>
            </div>

            {!showWizard ? (
              <button
                onClick={() => setShowWizard(true)}
                className="apple-pill-btn apple-btn-primary px-6 py-3 text-xs font-semibold inline-flex items-center gap-2 shadow-lg shadow-[#2997ff]/20"
              >
                <Plus className="w-4 h-4" />
                <span>Configurar Primera Sucursal Ahora</span>
              </button>
            ) : (
              <div className="pt-4 text-left">
                <BranchOnboardingWizard onSuccess={() => setShowWizard(false)} />
              </div>
            )}
          </div>
        ) : (
          // Vista completa con EmployeeManager
          <EmployeeManager
            userRole="owner"
            title="Gestión de Personal y Asignación de Áreas"
            subtitle="Registra a tus empleados con correo y contraseña. Asígnales sucursal y una estación operativa (Caja, Bodega, Ventas, Limpieza, Atención al Cliente o General)."
          />
        )}
      </div>
    </DashboardLayout>
  );
}
