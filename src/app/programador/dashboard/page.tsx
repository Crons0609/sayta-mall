// src/app/programador/dashboard/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { EmployeeManager } from '@/components/dashboard/EmployeeManager';
import { ProgrammerManager } from '@/components/dashboard/ProgrammerManager';
import { ReferralLinkPanel } from '@/components/referral/ReferralLinkPanel';
import { useBranch } from '@/providers/BranchProvider';
import {
  Code,
  Users,
  Server,
  Database,
  ShieldAlert,
  Terminal,
  Activity,
  ArrowRight,
  RefreshCw,
  Layers,
  Sparkles,
  Store,
  CheckCircle2,
  Lock,
  Link2,
  Truck,
  UserPlus,
  Briefcase,
} from 'lucide-react';

export default function ProgramadorDashboardPage() {
  const { branches, branchCount } = useBranch();
  const [activeTab, setActiveTab] = useState<'overview' | 'programmers' | 'employees' | 'system' | 'logs' | 'referral'>('overview');
  const [ownerCount, setOwnerCount] = useState<number>(0);
  const [programmerCount, setProgrammerCount] = useState<number>(1);

  useEffect(() => {
    fetch('/api/owners')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.owners)) {
          setOwnerCount(data.owners.length);
        }
      })
      .catch((e) => console.warn('Could not fetch owners count:', e));

    fetch('/api/programmers')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.programmers)) {
          setProgrammerCount(data.programmers.length);
        }
      })
      .catch((e) => console.warn('Could not fetch programmers count:', e));
  }, []);

  return (
    <DashboardLayout role="programmer">
      <div className="space-y-6 animate-fade-in">
        {/* Cabecera del Superadmin */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#2997ff]">
                Consola Principal del Desarrollador
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                SUPERADMIN ACCESS
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
              Panel de Control Maestro
            </h1>
            <p className="text-xs text-[#86868b] mt-1 max-w-2xl">
              Monitoreo integral de Firebase Auth, gestión de programadores, roles privilegiados, invitaciones de dueños y registro de empleados.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('programmers')}
              className="apple-pill-btn bg-white/[0.08] hover:bg-white/[0.14] text-white px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 border border-white/[0.1] transition-all"
            >
              <Code className="w-3.5 h-3.5 text-[#2997ff]" />
              <span>+ Programadores</span>
            </button>
            <Link
              href="/programador/delivery"
              className="apple-pill-btn bg-white/[0.08] hover:bg-white/[0.14] text-white px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 border border-white/[0.1] transition-all"
            >
              <Truck className="w-3.5 h-3.5 text-[#30d158]" />
              <span>Delivery</span>
            </Link>
            <Link
              href="/programador/duenos"
              className="apple-pill-btn apple-btn-primary px-4 py-2 text-xs font-semibold flex items-center gap-2 shadow-lg shadow-[#2997ff]/20"
            >
              <Users className="w-4 h-4" />
              <span>Dueños</span>
            </Link>
          </div>
        </div>

        {/* Pestañas de la Consola */}
        <div className="flex items-center gap-1.5 p-1 bg-white/[0.04] rounded-2xl border border-white/[0.06] w-fit overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 ${
              activeTab === 'overview'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-[#86868b] hover:text-white'
            }`}
          >
            Resumen General
          </button>
          <button
            onClick={() => setActiveTab('programmers')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'programmers'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-[#86868b] hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5 text-[#2997ff]" />
            <span>Equipo de Programadores ({programmerCount})</span>
          </button>
          <Link
            href="/programador/duenos"
            className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 text-[#86868b] hover:text-white hover:bg-white/[0.04] flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5 text-[#2997ff]" />
            <span>Jefes & Dueños</span>
          </Link>
          <Link
            href="/programador/delivery"
            className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 text-[#86868b] hover:text-white hover:bg-white/[0.04] flex items-center gap-1.5"
          >
            <Truck className="w-3.5 h-3.5 text-[#30d158]" />
            <span>Empresas de Delivery</span>
          </Link>
          <button
            onClick={() => setActiveTab('employees')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 ${
              activeTab === 'employees'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-[#86868b] hover:text-white'
            }`}
          >
            Trabajadores & Empleados
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 ${
              activeTab === 'system'
                ? 'bg-white text-black shadow-sm'
                : 'text-[#86868b] hover:text-white'
            }`}
          >
            Estado del Sistema
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 ${
              activeTab === 'logs'
                ? 'bg-white text-black shadow-sm'
                : 'text-[#86868b] hover:text-white'
            }`}
          >
            Logs de Auditoría
          </button>
          <button
            onClick={() => setActiveTab('referral')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'referral'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-[#86868b] hover:text-white'
            }`}
          >
            <Link2 className="w-3 h-3" />
            Mi Enlace Referido
          </button>
        </div>

        {/* Tab Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Métricas del Sistema */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="apple-card p-4">
                <span className="text-[11px] text-[#86868b] uppercase tracking-wider block font-medium">
                  Dueños Registrados
                </span>
                <span className="text-xl sm:text-2xl font-bold text-white mt-1 block">
                  {ownerCount}
                </span>
                <Link href="/programador/duenos" className="text-[11px] text-[#2997ff] mt-1 block hover:underline">
                  Ver directorio ›
                </Link>
              </div>

              <div className="apple-card p-4">
                <span className="text-[11px] text-[#86868b] uppercase tracking-wider block font-medium">
                  Sucursales Activas
                </span>
                <span className="text-xl sm:text-2xl font-bold text-white mt-1 block">
                  {branchCount}
                </span>
                <span className="text-[11px] text-[#30d158] mt-1 block">Operativas</span>
              </div>

              <div className="apple-card p-4">
                <span className="text-[11px] text-[#86868b] uppercase tracking-wider block font-medium">
                  Firebase Admin SDK
                </span>
                <span className="text-xl sm:text-2xl font-bold text-[#30d158] mt-1 block">
                  Conectado
                </span>
                <span className="text-[11px] text-[#86868b] mt-1 block">Claims & Auth API</span>
              </div>

              <div className="apple-card p-4">
                <span className="text-[11px] text-[#86868b] uppercase tracking-wider block font-medium">
                  Seguridad de Roles
                </span>
                <span className="text-xl sm:text-2xl font-bold text-white mt-1 block">
                  Activa
                </span>
                <span className="text-[11px] text-[#2997ff] mt-1 block">Proxy Middleware</span>
              </div>
            </div>

            {/* Accesos Principales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Tarjeta Gestión de Programadores */}
              <div className="apple-card p-6 space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-white/[0.08]">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
                    <Code className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Equipo de Programadores</h3>
                    <p className="text-[11px] text-[#86868b]">Alta de desarrolladores con credenciales</p>
                  </div>
                </div>
                <p className="text-xs text-[#86868b] leading-relaxed">
                  Crea y administra accesos de programadores con contraseñas seguras y roles especializados para colaborar en la administración de la plataforma.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab('programmers')}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-purple-400 hover:underline"
                  >
                    <span>Gestionar Programadores ({programmerCount})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Tarjeta Gestión de Dueños */}
              <div className="apple-card p-6 space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-white/[0.08]">
                  <div className="w-10 h-10 rounded-xl bg-[#2997ff]/20 text-[#2997ff] flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Directorio de Dueños</h3>
                    <p className="text-[11px] text-[#86868b]">Control de franquicias y tiendas</p>
                  </div>
                </div>
                <p className="text-xs text-[#86868b] leading-relaxed">
                  Genera invitaciones con token único de 7 días, activa el modo soporte para inspeccionar la tienda como el dueño, o revoca credenciales de manera auditada.
                </p>
                <div className="pt-2">
                  <Link
                    href="/programador/duenos"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-[#2997ff] hover:underline"
                  >
                    <span>Ir a Dueños ({ownerCount})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Tarjeta Empleados */}
              <div className="apple-card p-6 space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-white/[0.08]">
                  <div className="w-10 h-10 rounded-xl bg-[#30d158]/20 text-[#30d158] flex items-center justify-center">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Registro de Empleados</h3>
                    <p className="text-[11px] text-[#86868b]">Altas directas con área personalizada</p>
                  </div>
                </div>
                <p className="text-xs text-[#86868b] leading-relaxed">
                  Crea credenciales operativas asignando áreas de trabajo estándar o personalizadas por ti para una mejor administración.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab('employees')}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-[#30d158] hover:underline"
                  >
                    <span>Abrir Módulo de Empleados</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Programmers */}
        {activeTab === 'programmers' && (
          <div className="space-y-6">
            <ProgrammerManager />
          </div>
        )}

        {/* Tab Employees */}
        {activeTab === 'employees' && (
          <div className="space-y-6">
            <EmployeeManager
              userRole="programmer"
              title="Consola Superadmin · Registro de Empleados"
              subtitle="Crea correos y contraseñas de empleados para cualquier sucursal y gestiona tus propias áreas de trabajo personalizadas."
            />
          </div>
        )}

        {/* Tab System Status */}
        {activeTab === 'system' && (
          <div className="space-y-4">
            <div className="apple-card p-6 space-y-4">
              <h3 className="text-sm font-bold text-white">Arquitectura & Servicios en Tiempo Real</h3>
              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                  <div>
                    <strong className="text-white block">Next.js App Router (Turbopack)</strong>
                    <span className="text-[#86868b]">SSR, Server Components & Dynamic API Routes</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#30d158]/15 text-[#30d158] text-[10px] font-semibold">
                    Saludable (200 OK)
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                  <div>
                    <strong className="text-white block">Firestore Database</strong>
                    <span className="text-[#86868b]">Colecciones: users, branches, products, invitations, auditLogs</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#30d158]/15 text-[#30d158] text-[10px] font-semibold">
                    Tiempo Real
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                  <div>
                    <strong className="text-white block">Sistema de Precios Ocultos</strong>
                    <span className="text-[#86868b]">Los precios y botones de compra son inaccesibles para visitantes sin sesión</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#2997ff]/15 text-[#2997ff] text-[10px] font-semibold">
                    Protegido
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                  <div>
                    <strong className="text-white block">Moneda del Sistema</strong>
                    <span className="text-[#86868b]">Córdobas Nicaragüenses (C$ / NIO) por defecto con formateo Intl</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#ffd60a]/15 text-[#ffd60a] text-[10px] font-semibold">
                    Configurado
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Logs */}
        {activeTab === 'logs' && (
          <div className="apple-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#2997ff]" />
              <span>Registro de Eventos y Auditoría del Sistema</span>
            </h3>
            <div className="p-4 rounded-xl bg-black font-mono text-[11px] text-[#86868b] space-y-2 border border-white/[0.08]">
              <p className="text-[#30d158]">[READY] Sayta Mall production-ready server online.</p>
              <p className="text-white">[SYSTEM] BranchProvider initialized with Firestore real-time listener.</p>
              <p className="text-[#2997ff]">[SECURITY] Secret pricing filter active. Anonymous visitors gated.</p>
              <p className="text-[#ffd60a]">[CONFIG] Default currency standard: C$ (NIO) Nicaragua.</p>
              <p className="text-[#86868b]">[AUDIT] Superadmin accessed control console.</p>
            </div>
          </div>
        )}
        {activeTab === 'referral' && (
          <div className="space-y-2">
            <p className="text-xs text-[#86868b] max-w-xl">
              Gestiona tu enlace único de atribución como desarrollador. Toda venta originada desde
              tu enlace queda registrada automáticamente bajo tu perfil.
            </p>
            <ReferralLinkPanel role="programmer" />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
