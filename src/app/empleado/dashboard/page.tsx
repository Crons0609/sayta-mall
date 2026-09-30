// src/app/empleado/dashboard/page.tsx
'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/providers/AuthProvider';
import { useBranch } from '@/providers/BranchProvider';
import { EMPLOYEE_AREA_LABELS, EmployeeArea } from '@/lib/constants';
import { ReferralLinkPanel } from '@/components/referral/ReferralLinkPanel';
import {
  CreditCard,
  Package,
  ShoppingBag,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Search,
  Store,
  DollarSign,
  ArrowUpRight,
  TrendingUp,
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';

export default function EmpleadoDashboardPage() {
  const { user, claims } = useAuth();
  const { currentBranch } = useBranch();

  // Tomamos el área del token o por defecto 'caja'
  const assignedArea = ((claims as any)?.area as string) || 'caja';
  const rawLabel = EMPLOYEE_AREA_LABELS[assignedArea as EmployeeArea];
  const areaLabel = rawLabel || (
    assignedArea.startsWith('area-')
      ? assignedArea.replace(/^area-/, '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      : assignedArea
  ) || 'General';

  // Estado de turno
  const [shiftActive, setShiftActive] = useState(true);

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
                  Estación Activa · {areaLabel}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.08] text-[#86868b]">
                  {currentBranch?.name || 'Sucursal Principal'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-0.5">
                Bienvenido, {user?.displayName || user?.email?.split('@')[0] || 'Colaborador'}
              </h1>
              <p className="text-xs text-[#86868b] mt-0.5">
                Panel operativo adaptado a tus funciones de {areaLabel}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-[#86868b] uppercase block">Estado del Turno</span>
              <span className="text-xs font-semibold text-[#30d158] flex items-center gap-1.5 justify-end">
                <span className="w-2 h-2 rounded-full bg-[#30d158] animate-pulse" />
                {shiftActive ? 'En Servicio' : 'En Pausa'}
              </span>
            </div>
            <button
              onClick={() => setShiftActive(!shiftActive)}
              className="apple-pill-btn apple-btn-secondary px-4 py-2 text-xs font-medium"
            >
              {shiftActive ? 'Pausar Turno' : 'Reanudar'}
            </button>
          </div>
        </div>

        {/* Acceso Colaborativo a Productos */}
        <div className="apple-card p-6 rounded-3xl border-white/[0.08] bg-gradient-to-r from-[#2997ff]/10 via-[#30d158]/5 to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#2997ff]/20 text-[#2997ff] flex items-center justify-center font-bold shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Subir y Administrar Productos de la Tienda</h3>
              <p className="text-xs text-[#86868b] mt-0.5">
                Colabora agregando nuevos productos, precios, descripciones y categorías. Puedes proponer descuentos para autorización del Dueño o Programador.
              </p>
            </div>
          </div>
          <Link
            href="/empleado/productos"
            className="apple-pill-btn apple-btn-primary px-5 py-2.5 text-xs font-semibold shrink-0 text-center flex items-center justify-center gap-2"
          >
            <span>Gestionar Productos</span>
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
                <h3 className="text-sm font-bold text-white">Chat Interno del Personal</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#30d158]/15 text-[#30d158] font-semibold border border-[#30d158]/20">
                  En Vivo
                </span>
              </div>
              <p className="text-xs text-[#86868b] mt-0.5">
                Comunícate al instante con tus compañeros de turno, coordina relevos de caja, reporta alertas urgentes o consulta disponibilidad de stock.
              </p>
            </div>
          </div>
          <Link
            href="/empleado/chat"
            className="apple-pill-btn apple-btn-secondary px-5 py-2.5 text-xs font-semibold shrink-0 text-center flex items-center justify-center gap-2 border-white/10 hover:border-purple-500/50 hover:text-white"
          >
            <span>Abrir Mensajería</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Tarjetas según el Área asignada */}
        {assignedArea === 'caja' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="apple-card p-5">
                <span className="text-[11px] text-[#86868b] uppercase font-medium block">
                  Apertura de Caja
                </span>
                <span className="text-2xl font-bold text-white mt-1 block font-mono">
                  C$ 1,500.00
                </span>
                <span className="text-[11px] text-[#30d158] mt-1 block">Fondo inicial confirmado</span>
              </div>

              <div className="apple-card p-5">
                <span className="text-[11px] text-[#86868b] uppercase font-medium block">
                  Cobros Realizados (Hoy)
                </span>
                <span className="text-2xl font-bold text-white mt-1 block font-mono">
                  C$ 0.00
                </span>
                <span className="text-[11px] text-[#86868b] mt-1 block">Esperando primeras transacciones</span>
              </div>

              <div className="apple-card p-5">
                <span className="text-[11px] text-[#86868b] uppercase font-medium block">
                  Tickets Emitidos
                </span>
                <span className="text-2xl font-bold text-white mt-1 block">
                  0
                </span>
                <span className="text-[11px] text-[#86868b] mt-1 block">Turno actual</span>
              </div>
            </div>

            {/* Acciones de Caja */}
            <div className="apple-card p-6 space-y-4">
              <h3 className="text-sm font-bold text-white">Operaciones de Caja</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Link
                  href="/catalogo"
                  className="p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-left transition-all group"
                >
                  <CreditCard className="w-5 h-5 text-[#2997ff] mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-xs font-semibold text-white">Nueva Venta Directa</div>
                  <div className="text-[10px] text-[#86868b] mt-0.5">Explorar catálogo y cobrar</div>
                </Link>

                <div className="p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-left transition-all group cursor-pointer">
                  <QrCode className="w-5 h-5 text-[#30d158] mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-xs font-semibold text-white">Escanear Ticket de Retiro</div>
                  <div className="text-[10px] text-[#86868b] mt-0.5">Validar pedidos de clientes</div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-left transition-all group cursor-pointer">
                  <DollarSign className="w-5 h-5 text-[#ffd60a] mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-xs font-semibold text-white">Corte de Caja Parcial</div>
                  <div className="text-[10px] text-[#86868b] mt-0.5">Reportar efectivo actual</div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-left transition-all group cursor-pointer">
                  <Clock className="w-5 h-5 text-[#bf5af2] mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-xs font-semibold text-white">Historial de Turno</div>
                  <div className="text-[10px] text-[#86868b] mt-0.5">Ver cobros recientes</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vista Bodega / Almacén */}
        {assignedArea === 'bodega' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="apple-card p-5">
                <span className="text-[11px] text-[#86868b] uppercase font-medium block">
                  Recepción de Mercancía
                </span>
                <span className="text-2xl font-bold text-white mt-1 block">Al Día</span>
                <span className="text-[11px] text-[#30d158] mt-1 block">Sin paquetes pendientes</span>
              </div>

              <div className="apple-card p-5">
                <span className="text-[11px] text-[#86868b] uppercase font-medium block">
                  Alertas de Stock Bajo
                </span>
                <span className="text-2xl font-bold text-white mt-1 block font-mono">0</span>
                <span className="text-[11px] text-[#86868b] mt-1 block">Inventario en rangos óptimos</span>
              </div>

              <div className="apple-card p-5">
                <span className="text-[11px] text-[#86868b] uppercase font-medium block">
                  Despachos Pendientes
                </span>
                <span className="text-2xl font-bold text-white mt-1 block">0</span>
                <span className="text-[11px] text-[#86868b] mt-1 block">Esperando nuevos pedidos</span>
              </div>
            </div>

            <div className="apple-card p-6">
              <h3 className="text-sm font-bold text-white mb-2">Herramientas de Bodega</h3>
              <p className="text-xs text-[#86868b] mb-4">
                Utiliza el escáner para registrar ingresos de bultos o verificar códigos de producto.
              </p>
              <div className="flex gap-3">
                <Link
                  href="/catalogo"
                  className="apple-pill-btn apple-btn-primary px-4 py-2 text-xs font-semibold inline-flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  <span>Consultar Catálogo de Inventario</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Vista General / Otras áreas */}
        {assignedArea !== 'caja' && assignedArea !== 'bodega' && (
          <div className="apple-card p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] text-white flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6 text-[#30d158]" />
            </div>
            <h2 className="text-lg font-bold text-white">
              Estación de {areaLabel} activa
            </h2>
            <p className="text-xs text-[#86868b] max-w-md mx-auto">
              Has iniciado sesión con éxito en tu turno. Puedes explorar el catálogo de la sucursal para asistir a los clientes con stock y especificaciones de productos.
            </p>
            <div className="pt-2">
              <Link
                href="/catalogo"
                className="apple-pill-btn apple-btn-primary px-6 py-2.5 text-xs font-semibold inline-flex items-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Ver Catálogo de Productos</span>
              </Link>
            </div>
          </div>
        )}
        {/* ── Enlace de Referido ── */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#2997ff]">
              Programa de Referidos
            </span>
          </div>
          <ReferralLinkPanel role="employee" />
        </div>
      </div>
    </DashboardLayout>
  );
}
