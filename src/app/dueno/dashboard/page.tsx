// src/app/dueno/dashboard/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { BranchOnboardingWizard } from '@/components/branch/BranchOnboardingWizard';
import { BranchManager } from '@/components/branch/BranchManager';
import { useBranch } from '@/providers/BranchProvider';
import { useAuth } from '@/providers/AuthProvider';
import { ReferralLinkPanel } from '@/components/referral/ReferralLinkPanel';
import {
  Users,
  Store,
  ShoppingBag,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowRight,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Phone,
  MapPin,
  CreditCard,
  Package,
  Link2,
} from 'lucide-react';

export default function DuenoDashboardPage() {
  const { branches, currentBranch, branchCount, loading: branchLoading } = useBranch();
  const { user } = useAuth();
  const [showNewBranchModal, setShowNewBranchModal] = useState(false);

  return (
    <DashboardLayout role="owner">
      <div className="space-y-6 animate-fade-in">
        {/* Si no hay ninguna sucursal registrada, mostrar Asistente de Creación (Fase 1) */}
        {!branchLoading && branchCount === 0 ? (
          <div className="py-8 space-y-6">
            <div className="text-center space-y-2 max-w-lg mx-auto">
              <span className="text-[11px] font-semibold text-[#ffd60a] uppercase tracking-wider">
                Configuración Inicial Requerida
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Bienvenido a Sayta Mall
              </h1>
              <p className="text-xs text-[#86868b] leading-relaxed">
                Para comenzar a recibir pedidos y dar de alta a tus empleados, crea tu primera sucursal operativa.
              </p>
            </div>

            <BranchOnboardingWizard onSuccess={() => {}} />
          </div>
        ) : (
          <>
            {/* Header del Dashboard */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#30d158]">
                    Portal Ejecutivo del Dueño
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.08] text-[#86868b]">
                    {branchCount} {branchCount === 1 ? 'Sucursal Activa' : 'Sucursales Activas'}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
                  Panel de Control de Tienda
                </h1>
                <p className="text-xs text-[#86868b] mt-1">
                  Gestiona las sucursales, supervisa a tu personal y monitorea los pedidos en tiempo real.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowNewBranchModal(true)}
                  className="apple-pill-btn apple-btn-secondary px-4 py-2 text-xs font-semibold flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nueva Sucursal</span>
                </button>
                <Link
                  href="/dueno/productos"
                  className="apple-pill-btn apple-btn-secondary px-4 py-2 text-xs font-semibold flex items-center gap-2"
                >
                  <Package className="w-4 h-4 text-[#30d158]" />
                  <span>Productos y Descuentos</span>
                </Link>
                <Link
                  href="/dueno/empleados"
                  className="apple-pill-btn apple-btn-primary px-4 py-2 text-xs font-semibold flex items-center gap-2 shadow-lg shadow-[#2997ff]/20"
                >
                  <Users className="w-4 h-4" />
                  <span>Gestionar Empleados</span>
                </Link>
              </div>
            </div>

            {/* Tarjetas de Métricas Reales */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="apple-card p-4">
                <span className="text-[11px] text-[#86868b] uppercase tracking-wider block font-medium">
                  Sucursal Activa
                </span>
                <span className="text-base sm:text-lg font-bold text-white mt-1 block truncate">
                  {currentBranch?.name || 'Central'}
                </span>
                <span className="text-[11px] text-[#30d158] mt-1 block">● En línea</span>
              </div>

              <div className="apple-card p-4">
                <span className="text-[11px] text-[#86868b] uppercase tracking-wider block font-medium">
                  Moneda de Operación
                </span>
                <span className="text-xl sm:text-2xl font-bold text-white mt-1 block font-mono">
                  {currentBranch?.currency || 'NIO'} ({currentBranch?.currencySymbol || 'C$'})
                </span>
                <span className="text-[11px] text-[#86868b] mt-1 block">Estándar local</span>
              </div>

              <div className="apple-card p-4">
                <span className="text-[11px] text-[#86868b] uppercase tracking-wider block font-medium">
                  Despacho
                </span>
                <span className="text-base sm:text-lg font-bold text-white mt-1 block">
                  {currentBranch?.pickupEnabled && currentBranch?.deliveryEnabled
                    ? 'Pickup & Delivery'
                    : currentBranch?.pickupEnabled
                    ? 'Solo Pickup'
                    : 'Solo Delivery'}
                </span>
                <span className="text-[11px] text-[#2997ff] mt-1 block">Habilitado</span>
              </div>

              <div className="apple-card p-4">
                <span className="text-[11px] text-[#86868b] uppercase tracking-wider block font-medium">
                  Pedidos (Hoy)
                </span>
                <span className="text-xl sm:text-2xl font-bold text-white mt-1 block font-mono">
                  0
                </span>
                <span className="text-[11px] text-[#86868b] mt-1 block">Sincronizado</span>
              </div>
            </div>

            {/* Accesos Rápidos y Configuración */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sucursales Registradas - Gestión Completa */}
              <div className="apple-card p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-[#30d158]" />
                    <h3 className="text-sm font-bold text-white">Gestión de Sucursales</h3>
                  </div>
                  <span className="text-xs text-[#86868b]">{branches.length} registradas</span>
                </div>
                <BranchManager />
              </div>

              {/* Módulo de Empleados y Personal */}
              <div className="apple-card p-6 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 pb-3 border-b border-white/[0.08]">
                    <Users className="w-4 h-4 text-[#2997ff]" />
                    <h3 className="text-sm font-bold text-white">Gestión de Empleados & Turnos</h3>
                  </div>
                  <p className="text-xs text-[#86868b] mt-3 leading-relaxed">
                    Agrega los correos y contraseñas de tus colaboradores, asígnales su sucursal y su área correspondiente (Caja, Bodega, Ventas, Limpieza, Atención o General).
                  </p>
                </div>

                <div className="pt-4 border-t border-white/[0.06]">
                  <Link
                    href="/dueno/empleados"
                    className="w-full py-2.5 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-semibold text-white flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>Abrir Gestor de Personal y Áreas</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#2997ff]" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Enlace de Referido del Dueño */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Link2 className="w-3.5 h-3.5 text-[#30d158]" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#30d158]">
                  Mi Programa de Referidos
                </span>
              </div>
              <ReferralLinkPanel role="owner" />
            </div>

            {/* Modal Nueva Sucursal */}
            {showNewBranchModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
                <div className="max-w-xl w-full">
                  <div className="text-right mb-2">
                    <button
                      onClick={() => setShowNewBranchModal(false)}
                      className="text-xs text-[#86868b] hover:text-white px-3 py-1 rounded-lg bg-white/10"
                    >
                      Cerrar
                    </button>
                  </div>
                  <BranchOnboardingWizard
                    onSuccess={() => setShowNewBranchModal(false)}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
