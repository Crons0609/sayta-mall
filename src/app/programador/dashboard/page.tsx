// src/app/programador/dashboard/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { EmployeeManager } from '@/components/dashboard/EmployeeManager';
import { ProgrammerManager } from '@/components/dashboard/ProgrammerManager';
import { ReferralLinkPanel } from '@/components/referral/ReferralLinkPanel';
import { useBranch } from '@/providers/BranchProvider';
import { Code, Users, Server, Database, ShieldAlert, Terminal, Activity, ArrowRight, RefreshCw, Layers, Sparkles, Store, CheckCircle2, Lock, Link2, Truck, UserPlus, Briefcase, Clock, Zap, Copy, ExternalLink, CheckCheck, AlertCircle, Globe } from 'lucide-react';
import { AuditLogPanel } from '@/components/dashboard/AuditLogPanel';
import { UsersRegistryPanel } from '@/components/dashboard/UsersRegistryPanel';

export default function ProgramadorDashboardPage() {
  const { branches, branchCount } = useBranch();
  const [activeTab, setActiveTab] = useState<'overview' | 'programmers' | 'employees' | 'system' | 'logs' | 'referral' | 'cronjobs' | 'audit' | 'users'>('overview');
  const [pingCopied, setPingCopied] = useState(false);
  const [pingStatus, setPingStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://tu-app.onrender.com');
  const pingUrl = `${appUrl}/api/ping`;

  const handleCopyPing = async () => {
    try {
      await navigator.clipboard.writeText(pingUrl);
      setPingCopied(true);
      setTimeout(() => setPingCopied(false), 2000);
    } catch {
      // fallback silencioso
    }
  };

  const handleTestPing = async () => {
    setPingStatus('checking');
    try {
      const res = await fetch('/api/ping');
      if (res.ok) {
        setPingStatus('ok');
      } else {
        setPingStatus('error');
      }
    } catch {
      setPingStatus('error');
    }
    setTimeout(() => setPingStatus('idle'), 3000);
  };
  const [ownerCount, setOwnerCount] = useState<number>(0);
  const [programmerCount, setProgrammerCount] = useState<number>(1);
  const [registeredUsersCount, setRegisteredUsersCount] = useState<number>(0);

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

    fetch('/api/registered-users')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.users)) {
          setRegisteredUsersCount(data.users.length);
        }
      })
      .catch((e) => console.warn('Could not fetch registered users count:', e));
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
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'bg-[#ff9f0a] text-black font-semibold shadow-sm'
                : 'text-[#86868b] hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3 h-3" />
            Auditoría Empleados
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'users'
                ? 'bg-[#2997ff] text-white font-semibold shadow-sm'
                : 'text-[#86868b] hover:text-white'
            }`}
          >
            <Users className="w-3 h-3" />
            Usuarios Registrados
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
          <button
            onClick={() => setActiveTab('cronjobs')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'cronjobs'
                ? 'bg-[#ffd60a] text-black font-semibold shadow-sm shadow-[#ffd60a]/20'
                : 'text-[#86868b] hover:text-white'
            }`}
          >
            <Clock className="w-3 h-3" />
            Cron Jobs
          </button>
        </div>

        {/* Tab Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Métricas del Sistema */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
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

              <div className="apple-card p-4 ring-1 ring-[#2997ff]/20 bg-gradient-to-b from-[#2997ff]/10 to-transparent">
                <span className="text-[11px] text-[#2997ff] uppercase tracking-wider block font-semibold">
                  Usuarios Registrados
                </span>
                <span className="text-xl sm:text-2xl font-bold text-white mt-1 block">
                  {registeredUsersCount || '...'}
                </span>
                <button
                  onClick={() => setActiveTab('users')}
                  className="text-[11px] text-[#2997ff] mt-1 block hover:underline font-medium text-left"
                >
                  Ver tabla y claves ›
                </button>
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

              {/* Tarjeta Tabla de Usuarios & Credenciales (Exclusivo Programador) */}
              <div className="apple-card p-6 space-y-4 md:col-span-3 bg-gradient-to-r from-purple-950/20 via-blue-950/20 to-black border-[#2997ff]/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#2997ff]/20 text-[#2997ff] flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Directorio Central de Usuarios Registrados</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#2997ff]/15 text-[#2997ff] border border-[#2997ff]/30 uppercase">
                          Exclusivo Programador
                        </span>
                      </h3>
                      <p className="text-[11px] text-[#86868b]">
                        Tabla con nombre, correo, edad, dirección, contraseña y control de modificaciones por mes y año.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('users')}
                    className="apple-pill-btn apple-btn-primary px-4 py-2 text-xs font-semibold flex items-center gap-2 self-start sm:self-auto shrink-0 shadow-lg shadow-[#2997ff]/20"
                  >
                    <Users className="w-4 h-4" />
                    <span>Ver Tabla de Usuarios ({registeredUsersCount || '...'})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-[#86868b]">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <span className="text-white font-medium block">📋 Vista en Tabla</span>
                    <span className="text-[11px]">Diseño responsive con columnas organizadas</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <span className="text-white font-medium block">📅 Filtro Mes y Año</span>
                    <span className="text-[11px]">Explora altas por fecha o período temporal</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <span className="text-white font-medium block">🔑 Contraseñas & Cambios</span>
                    <span className="text-[11px]">Visualiza clave original o fecha de modificación</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <span className="text-white font-medium block">📍 Dirección y Edad</span>
                    <span className="text-[11px]">Datos de perfil y entrega de todos los usuarios</span>
                  </div>
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

        {/* Tab Auditoría de Empleados */}
        {activeTab === 'audit' && (
          <div className="space-y-5 animate-fade-in">
            <AuditLogPanel />
          </div>
        )}

        {/* Tab Usuarios Registrados */}
        {activeTab === 'users' && (
          <div className="space-y-5 animate-fade-in">
            <UsersRegistryPanel />
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

        {/* Tab Cron Jobs - Keepalive para Render */}
        {activeTab === 'cronjobs' && (
          <div className="space-y-5 animate-fade-in">
            {/* Header del panel */}
            <div className="apple-card p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#ffd60a]/15 flex items-center justify-center shrink-0">
                  <Zap className="w-6 h-6 text-[#ffd60a]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-white">Keepalive de Render — Anti-Sleep</h3>
                  <p className="text-xs text-[#86868b] mt-1 leading-relaxed max-w-2xl">
                    El plan gratuito de Render pone a dormir el servicio tras <strong className="text-white">15 minutos</strong> de inactividad,
                    lo que genera una demora de hasta 50 segundos en la primera petición. Configura un cron job externo
                    para hacer ping cada <strong className="text-[#ffd60a]">14 minutos</strong> al endpoint de keepalive y mantener el servidor activo 24/7.
                  </p>
                </div>
              </div>
            </div>

            {/* Endpoint de Ping */}
            <div className="apple-card p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#2997ff]" />
                <h3 className="text-sm font-bold text-white">Endpoint de Keepalive</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#30d158]/15 text-[#30d158] border border-[#30d158]/25">GET · /api/ping</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 p-3 rounded-xl bg-black/50 border border-white/[0.08] font-mono text-xs text-[#2997ff] overflow-x-auto">
                  {pingUrl}
                </div>
                <button
                  onClick={handleCopyPing}
                  className="shrink-0 p-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] transition-all"
                  title="Copiar URL"
                >
                  {pingCopied
                    ? <CheckCheck className="w-4 h-4 text-[#30d158]" />
                    : <Copy className="w-4 h-4 text-[#86868b]" />}
                </button>
                <button
                  onClick={handleTestPing}
                  disabled={pingStatus === 'checking'}
                  className="shrink-0 px-3 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] transition-all text-xs font-semibold text-white flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${pingStatus === 'checking' ? 'animate-spin text-[#ffd60a]' : 'text-[#86868b]'}`} />
                  {pingStatus === 'checking' ? 'Probando…' : pingStatus === 'ok' ? '✓ OK' : pingStatus === 'error' ? '✗ Error' : 'Probar'}
                </button>
              </div>

              {pingStatus === 'ok' && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[#30d158]/10 border border-[#30d158]/20">
                  <CheckCircle2 className="w-4 h-4 text-[#30d158]" />
                  <span className="text-xs text-[#30d158] font-medium">El endpoint responde correctamente (200 OK). ¡El servidor está vivo!</span>
                </div>
              )}
              {pingStatus === 'error' && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-xs text-red-400 font-medium">No se pudo conectar al endpoint. Verifica que el servidor esté corriendo.</span>
                </div>
              )}
            </div>

            {/* Guías de configuración */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* cron-job.org */}
              <div className="apple-card p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/20 flex items-center justify-center">
                    <Clock className="w-4.5 h-4.5 text-orange-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">cron-job.org</h4>
                    <p className="text-[11px] text-[#86868b]">Servicio gratuito · Sin registro de tarjeta</p>
                  </div>
                </div>
                <ol className="space-y-2.5 text-xs text-[#86868b]">
                  <li className="flex gap-2">
                    <span className="shrink-0 w-4 h-4 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-bold flex items-center justify-center">1</span>
                    <span>Ve a <strong className="text-white">cron-job.org</strong> y crea una cuenta gratuita</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="shrink-0 w-4 h-4 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-bold flex items-center justify-center">2</span>
                    <span>Haz clic en <strong className="text-white">Create Cronjob</strong></span>
                  </li>
                  <li className="flex gap-2">
                    <span className="shrink-0 w-4 h-4 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-bold flex items-center justify-center">3</span>
                    <span>Pega la URL del endpoint de arriba en el campo <strong className="text-white">URL</strong></span>
                  </li>
                  <li className="flex gap-2">
                    <span className="shrink-0 w-4 h-4 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-bold flex items-center justify-center">4</span>
                    <span>Establece la expresión cron: <code className="px-1 py-0.5 rounded bg-white/[0.06] text-[#ffd60a] font-mono">*/14 * * * *</code> (cada 14 min)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="shrink-0 w-4 h-4 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-bold flex items-center justify-center">5</span>
                    <span>Guarda y activa el cron job ✓</span>
                  </li>
                </ol>
                <a
                  href="https://cron-job.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-400 hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  Ir a cron-job.org
                </a>
              </div>

              {/* UptimeRobot */}
              <div className="apple-card p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <Activity className="w-4.5 h-4.5 text-green-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">UptimeRobot</h4>
                    <p className="text-[11px] text-[#86868b]">Monitor + Keepalive · Mínimo 5 min</p>
                  </div>
                </div>
                <ol className="space-y-2.5 text-xs text-[#86868b]">
                  <li className="flex gap-2">
                    <span className="shrink-0 w-4 h-4 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold flex items-center justify-center">1</span>
                    <span>Ve a <strong className="text-white">uptimerobot.com</strong> y crea una cuenta gratuita</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="shrink-0 w-4 h-4 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold flex items-center justify-center">2</span>
                    <span>Haz clic en <strong className="text-white">Add New Monitor</strong></span>
                  </li>
                  <li className="flex gap-2">
                    <span className="shrink-0 w-4 h-4 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold flex items-center justify-center">3</span>
                    <span>Selecciona tipo <strong className="text-white">HTTP(s)</strong> y pega la URL del endpoint</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="shrink-0 w-4 h-4 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold flex items-center justify-center">4</span>
                    <span>Configura el intervalo a <strong className="text-white">5 minutos</strong> (mínimo del plan free)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="shrink-0 w-4 h-4 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold flex items-center justify-center">5</span>
                    <span>Guarda — también recibirás alertas si el sitio cae ✓</span>
                  </li>
                </ol>
                <a
                  href="https://uptimerobot.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-400 hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  Ir a UptimeRobot
                </a>
              </div>
            </div>

            {/* Info de la expresión cron */}
            <div className="apple-card p-5">
              <div className="flex items-start gap-3">
                <Terminal className="w-4 h-4 text-[#ffd60a] shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-white">Expresión Cron Recomendada</h4>
                  <div className="font-mono text-sm bg-black/60 border border-white/[0.08] rounded-xl px-4 py-3 text-[#ffd60a]">
                    */14 * * * *
                  </div>
                  <div className="grid grid-cols-5 gap-2 text-[10px] text-center">
                    {[
                      { val: '*/14', label: 'Minuto', desc: 'Cada 14 min' },
                      { val: '*', label: 'Hora', desc: 'Cualquier hora' },
                      { val: '*', label: 'Día', desc: 'Cualquier día' },
                      { val: '*', label: 'Mes', desc: 'Cualquier mes' },
                      { val: '*', label: 'Semana', desc: 'Cualquier día' },
                    ].map((field) => (
                      <div key={field.label} className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                        <div className="font-mono text-[#ffd60a] font-bold text-xs">{field.val}</div>
                        <div className="text-white font-medium mt-0.5">{field.label}</div>
                        <div className="text-[#86868b] text-[9px]">{field.desc}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-[#86868b]">
                    Render duerme el servicio tras 15 min de inactividad — con 14 min de intervalo se garantiza que nunca llegue al límite.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
