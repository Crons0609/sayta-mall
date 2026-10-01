// src/app/empleado/dashboard/page.tsx
'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/providers/AuthProvider';
import { useBranch } from '@/providers/BranchProvider';
import { useDashboardPreferences } from '@/providers/DashboardPreferencesProvider';
import { EMPLOYEE_AREA_LABELS, EmployeeArea } from '@/lib/constants';
import { ReferralLinkPanel } from '@/components/referral/ReferralLinkPanel';
import { OrdersPanel } from '@/components/dashboard/OrdersPanel';
import { QrGeneratorPanel } from '@/components/dashboard/QrGeneratorPanel';
import {
  CreditCard,
  Package,
  ShoppingBag,
  Store,
  DollarSign,
  ArrowUpRight,
  TrendingUp,
  MessageSquare,
  Truck,
  CheckCircle2,
  Search,
  Clock,
  QrCode,
} from 'lucide-react';
import Link from 'next/link';

export default function EmpleadoDashboardPage() {
  const { user, claims } = useAuth();
  const { currentBranch } = useBranch();
  const { t } = useDashboardPreferences();

  // Tomamos el area del token o por defecto 'caja'
  const assignedArea = ((claims as any)?.area as string) || 'caja';
  const cleanArea = assignedArea.replace(/^area-/, '');
  const areaKey = `area_${cleanArea}`;
  const defaultLabel = EMPLOYEE_AREA_LABELS[assignedArea as EmployeeArea] || cleanArea;
  const areaLabel = t(areaKey, defaultLabel);

  // Estado de turno
  const [shiftActive, setShiftActive] = useState(true);
  const [activeTab, setActiveTab] = useState<'pedidos' | 'estacion' | 'referidos'>('pedidos');

  return (
    <DashboardLayout role="employee">
      <div className="space-y-6 animate-fade-in">
        {/* Cabecera del Empleado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 apple-card p-6 border-white/[0.08] rounded-3xl bg-gradient-to-r from-white/[0.03] to-white/[0.01]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#2997ff]/15 border border-[#2997ff]/25 text-[#2997ff] flex items-center justify-center font-bold text-xl shadow-lg shadow-[#2997ff]/10">
              {assignedArea === 'caja' ? (
                <CreditCard className="w-7 h-7" />
              ) : assignedArea === 'bodega' ? (
                <Package className="w-7 h-7" />
              ) : (
                <ShoppingBag className="w-7 h-7" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#30d158]">
                  {t('dash_active_station', 'Estación Activa')} • {areaLabel}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.08] text-[#86868b]">
                  {currentBranch?.name || t('dash_branch_main', 'Sucursal Principal')}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-0.5">
                {t('dash_welcome', 'Bienvenido')}, {user?.displayName || user?.email?.split('@')[0] || t('role_employee', 'Colaborador')}
              </h1>
              <p className="text-xs text-[#86868b] mt-0.5">
                {t('dash_employee_subtitle', 'Panel operativo adaptado a tus funciones de')} {areaLabel}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-[#86868b] uppercase block">
                {t('dash_shift_status', 'Estado del Turno')}
              </span>
              <span className="text-xs font-semibold text-[#30d158] flex items-center gap-1.5 justify-end">
                <span className="w-2 h-2 rounded-full bg-[#30d158] animate-pulse" />
                {shiftActive ? t('dash_on_duty_label', 'En Servicio') : t('dash_on_pause_label', 'En Pausa')}
              </span>
            </div>
            <button
              onClick={() => setShiftActive(!shiftActive)}
              className="apple-pill-btn apple-btn-secondary px-4 py-2 text-xs font-medium"
            >
              {shiftActive ? t('btn_pause_shift', 'Pausar Turno') : t('btn_resume_shift', 'Reanudar')}
            </button>
          </div>
        </div>

        {/* Pestanas de Navegacion del Empleado */}
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
            <span>{t('dash_tab_orders_qr', 'Pedidos y Validación QR')}</span>
          </button>
          <button
            onClick={() => setActiveTab('estacion')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'estacion'
                ? 'bg-white text-black shadow-lg'
                : 'text-[#86868b] hover:text-white'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>{t('dash_tab_station_tools', 'Herramientas de Estación')}</span>
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

        {/* CONTENIDO SEGUN PESTANA */}
        {activeTab === 'pedidos' && (
          <div className="space-y-6">
            {/* Panel de Generacion de QR para Repartidores */}
            <QrGeneratorPanel />

            {/* Panel de Pedidos en Vivo */}
            <OrdersPanel />
          </div>
        )}

        {activeTab === 'estacion' && (
          <div className="space-y-6">
            {/* Acceso Colaborativo a Productos */}
            <div className="apple-card p-6 rounded-3xl border-white/[0.08] bg-gradient-to-r from-[#2997ff]/10 via-[#30d158]/5 to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#2997ff]/20 text-[#2997ff] flex items-center justify-center font-bold shrink-0">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {t('dash_collaborative_title', 'Subir y Administrar Productos de la Tienda')}
                  </h3>
                  <p className="text-xs text-[#86868b] mt-0.5">
                    {t('dash_collaborative_desc', 'Colabora agregando nuevos productos, precios, descripciones y categorías. Puedes proponer descuentos para autorización del Dueño o Programador.')}
                  </p>
                </div>
              </div>
              <Link
                href="/empleado/productos"
                className="apple-pill-btn apple-btn-primary px-5 py-2.5 text-xs font-semibold shrink-0 text-center flex items-center justify-center gap-2"
              >
                <span>{t('dash_manage_products_btn', 'Gestionar Productos')}</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Chat Interno del Personal */}
            <div className="apple-card p-6 rounded-3xl border-white/[0.08] bg-gradient-to-r from-purple-500/10 via-[#2997ff]/5 to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold shrink-0">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">
                      {t('dash_internal_chat_title', 'Chat Interno del Personal')}
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#30d158]/15 text-[#30d158] font-semibold border border-[#30d158]/20">
                      {t('badge_live', 'En Vivo')}
                    </span>
                  </div>
                  <p className="text-xs text-[#86868b] mt-0.5">
                    {t('dash_internal_chat_desc', 'Comunícate al instante con tus compañeros de turno, coordina relevos de caja, reporta alertas urgentes o consulta disponibilidad de stock.')}
                  </p>
                </div>
              </div>
              <Link
                href="/empleado/chat"
                className="apple-pill-btn apple-btn-secondary px-5 py-2.5 text-xs font-semibold shrink-0 text-center flex items-center justify-center gap-2 border-white/10 hover:border-purple-500/50 hover:text-white"
              >
                <span>{t('dash_open_chat_btn', 'Abrir Mensajería')}</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Tarjetas segun el area asignada */}
            {assignedArea === 'caja' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="apple-card p-5">
                    <span className="text-[11px] text-[#86868b] uppercase font-medium block">
                      {t('dash_cashier_opening', 'Apertura de Caja')}
                    </span>
                    <span className="text-2xl font-bold text-white mt-1 block font-mono">
                      C$ 1,500.00
                    </span>
                    <span className="text-[11px] text-[#30d158] mt-1 block">
                      {t('dash_cashier_opening_note', 'Fondo inicial confirmado')}
                    </span>
                  </div>

                  <div className="apple-card p-5">
                    <span className="text-[11px] text-[#86868b] uppercase font-medium block">
                      {t('dash_cashier_sales_today', 'Cobros Realizados (Hoy)')}
                    </span>
                    <span className="text-2xl font-bold text-white mt-1 block font-mono">
                      C$ 0.00
                    </span>
                    <span className="text-[11px] text-[#86868b] mt-1 block">
                      {t('dash_cashier_sales_waiting', 'Esperando primeras transacciones')}
                    </span>
                  </div>

                  <div className="apple-card p-5">
                    <span className="text-[11px] text-[#86868b] uppercase font-medium block">
                      {t('dash_cashier_tickets', 'Tickets Emitidos')}
                    </span>
                    <span className="text-2xl font-bold text-white mt-1 block">0</span>
                    <span className="text-[11px] text-[#86868b] mt-1 block">
                      {t('dash_cashier_tickets_note', 'Turno actual')}
                    </span>
                  </div>
                </div>

                {/* Acciones de Caja */}
                <div className="apple-card p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white">
                    {t('dash_station_tools', 'Operaciones de Caja')}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <Link
                      href="/catalogo"
                      className="p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-left transition-all group"
                    >
                      <CreditCard className="w-5 h-5 text-[#2997ff] mb-2 group-hover:scale-110 transition-transform" />
                      <div className="text-xs font-semibold text-white">
                        {t('dash_sale_direct', 'Nueva Venta Directa')}
                      </div>
                      <div className="text-[10px] text-[#86868b] mt-0.5">
                        {t('dash_sale_direct_desc', 'Explorar catálogo y cobrar')}
                      </div>
                    </Link>

                    <button
                      type="button"
                      onClick={() => setActiveTab('pedidos')}
                      className="p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-left transition-all group"
                    >
                      <QrCode className="w-5 h-5 text-[#30d158] mb-2 group-hover:scale-110 transition-transform" />
                      <div className="text-xs font-semibold text-white">
                        {t('dash_validate_delivery', 'Validar Retiro Delivery')}
                      </div>
                      <div className="text-[10px] text-[#86868b] mt-0.5">
                        {t('dash_validate_delivery_desc', 'Generar QR para repartidor')}
                      </div>
                    </button>

                    <div className="p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-left transition-all group cursor-pointer">
                      <DollarSign className="w-5 h-5 text-[#ffd60a] mb-2 group-hover:scale-110 transition-transform" />
                      <div className="text-xs font-semibold text-white">
                        {t('dash_cash_partial', 'Corte de Caja Parcial')}
                      </div>
                      <div className="text-[10px] text-[#86868b] mt-0.5">
                        {t('dash_cash_partial_desc', 'Reportar efectivo actual')}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-left transition-all group cursor-pointer">
                      <Clock className="w-5 h-5 text-[#bf5af2] mb-2 group-hover:scale-110 transition-transform" />
                      <div className="text-xs font-semibold text-white">
                        {t('dash_shift_history', 'Historial de Turno')}
                      </div>
                      <div className="text-[10px] text-[#86868b] mt-0.5">
                        {t('dash_shift_history_desc', 'Ver cobros recientes')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Vista Bodega / Almacen */}
            {assignedArea === 'bodega' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="apple-card p-5">
                    <span className="text-[11px] text-[#86868b] uppercase font-medium block">
                      {t('dash_warehouse_received', 'Artículos Ingresados')}
                    </span>
                    <span className="text-2xl font-bold text-white mt-1 block">
                      {t('dash_warehouse_received_note', 'Al Día')}
                    </span>
                    <span className="text-[11px] text-[#30d158] mt-1 block">
                      {t('dash_general_all_clear', 'Sin paquetes pendientes')}
                    </span>
                  </div>

                  <div className="apple-card p-5">
                    <span className="text-[11px] text-[#86868b] uppercase font-medium block">
                      {t('dash_warehouse_low_stock', 'Alertas de Stock Bajo')}
                    </span>
                    <span className="text-2xl font-bold text-white mt-1 block font-mono">0</span>
                    <span className="text-[11px] text-[#86868b] mt-1 block">
                      {t('dash_warehouse_low_stock_note', 'Inventario en rangos óptimos')}
                    </span>
                  </div>

                  <div className="apple-card p-5">
                    <span className="text-[11px] text-[#86868b] uppercase font-medium block">
                      {t('dash_warehouse_transfers', 'Movimientos de Sucursal')}
                    </span>
                    <span className="text-2xl font-bold text-white mt-1 block font-mono">
                      {shiftActive ? '1+' : '0'}
                    </span>
                    <span className="text-[11px] text-[#86868b] mt-1 block">
                      {t('dash_warehouse_transfers_note', 'Traslados pendientes')}
                    </span>
                  </div>
                </div>

                <div className="apple-card p-6">
                  <h3 className="text-sm font-bold text-white mb-2">
                    {t('dash_tab_station_tools', 'Herramientas de Bodega')}
                  </h3>
                  <p className="text-xs text-[#86868b] mb-4">
                    {t('dash_warehouse_scan_desc', 'Utiliza el escáner para registrar ingresos de bultos o verificar códigos de producto.')}
                  </p>
                  <div className="flex gap-3">
                    <Link
                      href="/catalogo"
                      className="apple-pill-btn apple-btn-primary px-4 py-2 text-xs font-semibold inline-flex items-center gap-2"
                    >
                      <Search className="w-4 h-4" />
                      <span>{t('nav_catalog', 'Consultar Catálogo de Inventario')}</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Vista General / Otras areas */}
            {assignedArea !== 'caja' && assignedArea !== 'bodega' && (
              <div className="apple-card p-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.04] text-white flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6 text-[#30d158]" />
                </div>
                <h2 className="text-lg font-bold text-white">
                  {t('dash_active_station', 'Estación de')} {areaLabel} {t('status_on_duty', 'activa')}
                </h2>
                <p className="text-xs text-[#86868b] max-w-md mx-auto">
                  {t('dash_employee_subtitle', 'Has iniciado sesión con éxito en tu turno. Puedes explorar el catálogo de la sucursal para asistir a los clientes con stock y especificaciones de productos.')}
                </p>
                <div className="pt-2">
                  <Link
                    href="/catalogo"
                    className="apple-pill-btn apple-btn-primary px-6 py-2.5 text-xs font-semibold inline-flex items-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>{t('nav_catalog', 'Ver Catálogo de Productos')}</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PESTANA REFERIDOS */}
        {activeTab === 'referidos' && <ReferralLinkPanel />}
      </div>
    </DashboardLayout>
  );
}
