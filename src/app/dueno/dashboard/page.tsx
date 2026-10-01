// src/app/dueno/dashboard/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { BranchOnboardingWizard } from '@/components/branch/BranchOnboardingWizard';
import { BranchManager } from '@/components/branch/BranchManager';
import { useBranch } from '@/providers/BranchProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useDashboardPreferences } from '@/providers/DashboardPreferencesProvider';
import { ReferralLinkPanel } from '@/components/referral/ReferralLinkPanel';
import { OrdersPanel } from '@/components/dashboard/OrdersPanel';
import { QrGeneratorPanel } from '@/components/dashboard/QrGeneratorPanel';
import { BranchQrManager } from '@/components/qr/BranchQrManager';
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
  Truck,
  QrCode,
} from 'lucide-react';

export default function DuenoDashboardPage() {
  const { branches, currentBranch, branchCount, loading: branchLoading } = useBranch();
  const { user } = useAuth();
  const { t } = useDashboardPreferences();
  const [showNewBranchModal, setShowNewBranchModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'pedidos' | 'resumen' | 'sucursales' | 'qr' | 'referidos'>('pedidos');

  return (
    <DashboardLayout role="owner">
      <div className="space-y-6 animate-fade-in">
        {/* Si no hay ninguna sucursal registrada, mostrar Asistente de Creación */}
        {!branchLoading && branchCount === 0 ? (
          <div className="py-8 space-y-6">
            <div className="text-center space-y-2 max-w-lg mx-auto">
              <span className="text-[11px] font-semibold text-[#ffd60a] uppercase tracking-wider">
                {t('owner_onboarding_required', 'Configuración Inicial Requerida')}
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {t('owner_onboarding_welcome', 'Bienvenido a Sayta Mall')}
              </h1>
              <p className="text-xs text-[#86868b] leading-relaxed">
                {t('owner_onboarding_desc', 'Para comenzar a recibir pedidos y dar de alta a tus empleados, crea tu primera sucursal operativa.')}
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
                    {t('owner_portal_badge', 'Portal Ejecutivo del Dueño')}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.08] text-[#86868b]">
                    {branchCount} {branchCount === 1 ? t('owner_single_branch_active', 'Sucursal Activa') : t('owner_multi_branch_active', 'Sucursales Activas')}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
                  {t('owner_dashboard_title', 'Panel de Control de Tienda')}
                </h1>
                <p className="text-xs text-[#86868b] mt-1">
                  {t('owner_dashboard_desc', 'Gestiona las sucursales, supervisa a tu personal y monitorea los pedidos en tiempo real.')}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowNewBranchModal(true)}
                  className="apple-pill-btn apple-btn-secondary px-4 py-2 text-xs font-semibold flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('owner_btn_new_branch', 'Nueva Sucursal')}</span>
                </button>
                <Link
                  href="/dueno/productos"
                  className="apple-pill-btn apple-btn-secondary px-4 py-2 text-xs font-semibold flex items-center gap-2"
                >
                  <Package className="w-4 h-4 text-[#30d158]" />
                  <span>{t('owner_btn_products', 'Productos y Descuentos')}</span>
                </Link>
                <Link
                  href="/dueno/empleados"
                  className="apple-pill-btn apple-btn-primary px-4 py-2 text-xs font-semibold flex items-center gap-2 shadow-lg shadow-[#2997ff]/20"
                >
                  <Users className="w-4 h-4" />
                  <span>{t('owner_btn_employees', 'Gestionar Empleados')}</span>
                </Link>
              </div>
            </div>

            {/* Pestañas de Navegación del Dueño */}
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] overflow-x-auto">
              <button
                onClick={() => setActiveTab('pedidos')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
                  activeTab === 'pedidos'
                    ? 'bg-[#30d158] text-black shadow-lg shadow-[#30d158]/20'
                    : 'text-[#86868b] hover:text-white'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>{t('owner_tab_orders', 'Pedidos y Delivery')}</span>
              </button>
              <button
                onClick={() => setActiveTab('qr')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
                  activeTab === 'qr'
                    ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20'
                    : 'text-[#86868b] hover:text-white'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>{t('owner_tab_qr', 'Códigos QR de Sucursal')}</span>
              </button>
              <button
                onClick={() => setActiveTab('resumen')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
                  activeTab === 'resumen'
                    ? 'bg-white text-black shadow-lg'
                    : 'text-[#86868b] hover:text-white'
                }`}
              >
                <Store className="w-4 h-4" />
                <span>{t('owner_tab_metrics', 'Métricas de Sucursal')}</span>
              </button>
              <button
                onClick={() => setActiveTab('sucursales')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
                  activeTab === 'sucursales'
                    ? 'bg-white text-black shadow-lg'
                    : 'text-[#86868b] hover:text-white'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>{t('owner_tab_branches', 'Gestión de Sucursales')}</span>
              </button>
              <button
                onClick={() => setActiveTab('referidos')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
                  activeTab === 'referidos'
                    ? 'bg-[#2997ff] text-white shadow-lg shadow-[#2997ff]/20'
                    : 'text-[#86868b] hover:text-white'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>{t('dash_tab_referral', 'Mi Enlace de Referido')}</span>
              </button>
            </div>

            {/* CONTENIDO SEGÚN PESTAÑA */}
            {activeTab === 'pedidos' && (
              <div className="space-y-6">
                <QrGeneratorPanel />
                <OrdersPanel />
              </div>
            )}

            {activeTab === 'qr' && (
              <div className="space-y-6">
                <BranchQrManager />
              </div>
            )}

            {activeTab === 'resumen' && (
              <div className="space-y-6">
                {/* Tarjetas de Métricas Reales */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="apple-card p-4">
                    <span className="text-[11px] text-[#86868b] uppercase tracking-wider block font-medium">
                      {t('owner_stat_active_branch', 'Sucursal Activa')}
                    </span>
                    <span className="text-base sm:text-lg font-bold text-white mt-1 block truncate">
                      {currentBranch?.name || 'Central'}
                    </span>
                    <span className="text-[11px] text-[#30d158] mt-1 block">● {t('owner_stat_online', 'En línea')}</span>
                  </div>

                  <div className="apple-card p-4">
                    <span className="text-[11px] text-[#86868b] uppercase tracking-wider block font-medium">
                      {t('owner_stat_currency', 'Moneda de Operación')}
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-white mt-1 block font-mono">
                      {currentBranch?.currency || 'NIO'} ({currentBranch?.currencySymbol || 'C$'})
                    </span>
                    <span className="text-[11px] text-[#86868b] mt-1 block">{t('owner_stat_currency_local', 'Estándar local')}</span>
                  </div>

                  <div className="apple-card p-4">
                    <span className="text-[11px] text-[#86868b] uppercase tracking-wider block font-medium">
                      {t('owner_stat_dispatch', 'Despacho')}
                    </span>
                    <span className="text-base sm:text-lg font-bold text-white mt-1 block">
                      {currentBranch?.pickupEnabled && currentBranch?.deliveryEnabled
                        ? 'Pickup & Delivery'
                        : currentBranch?.pickupEnabled
                        ? 'Solo Pickup'
                        : 'Solo Delivery'}
                    </span>
                    <span className="text-[11px] text-[#2997ff] mt-1 block">{t('owner_stat_enabled', 'Habilitado')}</span>
                  </div>

                  <div className="apple-card p-4">
                    <span className="text-[11px] text-[#86868b] uppercase tracking-wider block font-medium">
                      {t('owner_stat_staff', 'Personal')}
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-white mt-1 block font-mono">
                      {t('owner_stat_active', 'Activo')}
                    </span>
                    <span className="text-[11px] text-[#86868b] mt-1 block">{t('owner_stat_manager_avail', 'Gestor disponible')}</span>
                  </div>
                </div>

                {/* Accesos Rápidos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="apple-card p-6 space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-white/[0.08]">
                      <Users className="w-4 h-4 text-[#2997ff]" />
                      <h3 className="text-sm font-bold text-white">{t('owner_card_employees_title', 'Gestión de Empleados & Turnos')}</h3>
                    </div>
                    <p className="text-xs text-[#86868b] leading-relaxed">
                      {t('owner_card_employees_desc', 'Agrega los correos y contraseñas de tus colaboradores, asígnales su sucursal y su área correspondiente (Caja, Bodega, Ventas, Limpieza, Atención o General).')}
                    </p>
                    <div className="pt-2">
                      <Link
                        href="/dueno/empleados"
                        className="w-full py-2.5 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-semibold text-white flex items-center justify-center gap-2 transition-colors"
                      >
                        <span>{t('owner_card_employees_btn', 'Abrir Gestor de Personal y Áreas')}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#2997ff]" />
                      </Link>
                    </div>
                  </div>

                  <div className="apple-card p-6 space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-white/[0.08]">
                      <Package className="w-4 h-4 text-[#30d158]" />
                      <h3 className="text-sm font-bold text-white">{t('owner_card_products_title', 'Catálogo y Descuentos')}</h3>
                    </div>
                    <p className="text-xs text-[#86868b] leading-relaxed">
                      {t('owner_card_products_desc', 'Supervisa los productos subidos por tus colaboradores y aprueba promociones o descuentos sugeridos para tu sucursal.')}
                    </p>
                    <div className="pt-2">
                      <Link
                        href="/dueno/productos"
                        className="w-full py-2.5 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-semibold text-white flex items-center justify-center gap-2 transition-colors"
                      >
                        <span>{t('owner_card_products_btn', 'Gestionar Productos')}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#30d158]" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sucursales' && (
              <div className="apple-card p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-[#30d158]" />
                    <h3 className="text-sm font-bold text-white">{t('owner_tab_branches', 'Gestión de Sucursales')}</h3>
                  </div>
                  <span className="text-xs text-[#86868b]">{branches.length} {t('owner_registered_branches', 'registradas')}</span>
                </div>
                <BranchManager />
              </div>
            )}

            {activeTab === 'referidos' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Link2 className="w-3.5 h-3.5 text-[#30d158]" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#30d158]">
                    {t('owner_referral_program', 'Mi Programa de Referidos')}
                  </span>
                </div>
                <ReferralLinkPanel role="owner" />
              </div>
            )}

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

