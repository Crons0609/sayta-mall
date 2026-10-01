// src/components/dashboard/UsersRegistryPanel.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDashboardPreferences } from '@/providers/DashboardPreferencesProvider';
import {
  Users,
  RefreshCw,
  Search,
  Briefcase,
  Crown,
  Code,
  ShoppingBag,
  Calendar,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  Copy,
  Check,
  Filter,
  Download,
  MapPin,
  Clock,
  UserCheck,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ChevronDown,
  Edit3,
  X,
  LayoutGrid,
  Table,
  SlidersHorizontal,
  Mail,
  Phone,
} from 'lucide-react';
import { FullRegisteredUser } from '@/app/api/registered-users/route';

const MONTH_NAMES = [
  { value: '1', label: 'Enero' },
  { value: '2', label: 'Febrero' },
  { value: '3', label: 'Marzo' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Mayo' },
  { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
];

const AVAILABLE_YEARS = ['2026', '2025', '2024', '2023'];

const ROLE_META: Record<string, { label: string; icon: React.ReactNode; color: string; badge: string }> = {
  programmer: {
    label: 'Programador',
    icon: <Code className="w-3.5 h-3.5" />,
    color: 'text-purple-400',
    badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  },
  owner: {
    label: 'Dueño',
    icon: <Crown className="w-3.5 h-3.5" />,
    color: 'text-[#2997ff]',
    badge: 'bg-[#2997ff]/15 text-[#2997ff] border-[#2997ff]/30',
  },
  employee: {
    label: 'Empleado',
    icon: <Briefcase className="w-3.5 h-3.5" />,
    color: 'text-[#30d158]',
    badge: 'bg-[#30d158]/15 text-[#30d158] border-[#30d158]/30',
  },
  customer: {
    label: 'Cliente',
    icon: <ShoppingBag className="w-3.5 h-3.5" />,
    color: 'text-[#ffd60a]',
    badge: 'bg-[#ffd60a]/15 text-[#ffd60a] border-[#ffd60a]/30',
  },
};

function formatDate(dateStr?: string) {
  if (!dateStr) return 'Sin fecha';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('es-NI', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function timeAgo(timestamp?: string) {
  if (!timestamp) return 'Sin registro';
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `hace ${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `hace ${months}m`;
  return `hace ${Math.floor(months / 12)}a`;
}

export function UsersRegistryPanel() {
  const { t } = useDashboardPreferences();
  const [users, setUsers] = useState<FullRegisteredUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modo de visualización: Tarjetas táctiles (ideal móvil) o Tabla (ideal desktop/tablet)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [showMobileDateFilters, setShowMobileDateFilters] = useState(false);

  // Detección automática de dispositivo móvil al montar
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setViewMode('cards');
    }
  }, []);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [passwordStatusFilter, setPasswordStatusFilter] = useState<'all' | 'original' | 'modified'>('all');
  const [specificDate, setSpecificDate] = useState<string>('');

  // Estados visuales de contraseñas
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedUid, setCopiedUid] = useState<string | null>(null);

  // Modal para editar/modificar contraseña directamente
  const [editingUser, setEditingUser] = useState<FullRegisteredUser | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [updateFeedback, setUpdateFeedback] = useState<string | null>(null);

  // Paginación
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Cargar usuarios desde la API centralizada
  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/registered-users', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users);
      } else {
        setError(data.error || 'No se pudieron cargar los usuarios');
      }
    } catch (err: any) {
      console.error('Error fetching registered users:', err);
      setError('Error al conectar con la base de datos de usuarios.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Toggle revelación de contraseña
  const toggleRevealPassword = (uid: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [uid]: !prev[uid],
    }));
  };

  // Copiar contraseña al portapapeles
  const handleCopyPassword = async (uid: string, pass?: string) => {
    if (!pass) return;
    try {
      await navigator.clipboard.writeText(pass);
      setCopiedUid(uid);
      setTimeout(() => setCopiedUid(null), 2000);
    } catch {
      // fallback
    }
  };

  // Guardar cambio de contraseña
  const handleSavePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !newPasswordInput.trim()) return;

    if (newPasswordInput.length < 6) {
      setUpdateFeedback('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setUpdatingPassword(true);
    setUpdateFeedback(null);
    try {
      const res = await fetch('/api/registered-users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: editingUser.uid,
          newPassword: newPasswordInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u.uid === editingUser.uid
              ? {
                  ...u,
                  password: newPasswordInput.trim(),
                  passwordModified: true,
                  passwordModifiedAt: data.passwordModifiedAt || new Date().toISOString(),
                }
              : u
          )
        );
        setUpdateFeedback('✓ Contraseña actualizada y registrada como modificada.');
        setTimeout(() => {
          setEditingUser(null);
          setNewPasswordInput('');
          setUpdateFeedback(null);
        }, 1200);
      } else {
        setUpdateFeedback(data.error || 'Error al actualizar contraseña.');
      }
    } catch (err: any) {
      setUpdateFeedback('Error al comunicarse con el servidor.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Filtrado de usuarios
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // 1. Rol
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;

      // 2. Estado de contraseña
      if (passwordStatusFilter === 'modified' && !u.passwordModified) return false;
      if (passwordStatusFilter === 'original' && u.passwordModified) return false;

      // 3. Fecha específica (YYYY-MM-DD)
      if (specificDate && u.createdAt) {
        const uDate = new Date(u.createdAt).toISOString().split('T')[0];
        if (uDate !== specificDate) return false;
      }

      // 4. Año
      if (yearFilter !== 'all' && u.createdAt) {
        const y = new Date(u.createdAt).getFullYear().toString();
        if (y !== yearFilter) return false;
      }

      // 5. Mes
      if (monthFilter !== 'all' && u.createdAt) {
        const m = (new Date(u.createdAt).getMonth() + 1).toString();
        if (m !== monthFilter) return false;
      }

      // 6. Texto de búsqueda
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = u.displayName.toLowerCase().includes(q);
        const matchesEmail = u.email.toLowerCase().includes(q);
        const matchesAddress = (u.direccion || '').toLowerCase().includes(q);
        const matchesUid = u.uid.toLowerCase().includes(q);
        const matchesPhone = (u.phone || '').toLowerCase().includes(q);
        const matchesArea = (u.area || '').toLowerCase().includes(q);
        const matchesBranch = (u.branchName || '').toLowerCase().includes(q);
        if (
          !matchesName &&
          !matchesEmail &&
          !matchesAddress &&
          !matchesUid &&
          !matchesPhone &&
          !matchesArea &&
          !matchesBranch
        ) {
          return false;
        }
      }

      return true;
    });
  }, [users, roleFilter, passwordStatusFilter, specificDate, yearFilter, monthFilter, searchQuery]);

  // Paginación
  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  // Contadores por rol
  const counts = useMemo(() => {
    return {
      all: users.length,
      programmer: users.filter((u) => u.role === 'programmer').length,
      owner: users.filter((u) => u.role === 'owner').length,
      employee: users.filter((u) => u.role === 'employee').length,
      customer: users.filter((u) => u.role === 'customer').length,
      modifiedPasswords: users.filter((u) => u.passwordModified).length,
    };
  }, [users]);

  // Limpiar filtros de fecha
  const clearDateFilters = () => {
    setYearFilter('all');
    setMonthFilter('all');
    setSpecificDate('');
    setCurrentPage(1);
  };

  const hasDateFiltersActive = yearFilter !== 'all' || monthFilter !== 'all' || specificDate !== '';

  // Exportar a CSV
  const handleExportCSV = () => {
    const headers = [
      'UID',
      'Nombre',
      'Correo',
      'Rol',
      'Edad',
      'Direccion',
      'Telefono',
      'Contrasena',
      'Modifico_Contrasena',
      'Fecha_Modificacion_Contrasena',
      'Fecha_Registro',
    ];
    const rows = filteredUsers.map((u) => [
      `"${u.uid}"`,
      `"${u.displayName || ''}"`,
      `"${u.email || ''}"`,
      `"${u.role || ''}"`,
      `"${u.age || 'N/A'}"`,
      `"${(u.direccion || '').replace(/"/g, '""')}"`,
      `"${u.phone || ''}"`,
      `"${u.password || ''}"`,
      `"${u.passwordModified ? 'SI' : 'NO'}"`,
      `"${u.passwordModifiedAt ? formatDate(u.passwordModifiedAt) : 'N/A'}"`,
      `"${formatDate(u.createdAt)}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `saytamall_usuarios_registrados_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in text-left">
      {/* ── Encabezado Principal Responsivo ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-purple-950/40 via-blue-950/30 to-black border border-white/[0.08]">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3" />
              Solo Programador
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#2997ff]/15 text-[#2997ff] border border-[#2997ff]/25">
              Supervisión de Registros
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5 mt-1">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-[#2997ff] shrink-0" />
            {t('users_reg_title', 'Directorio de Usuarios Registrados')}
          </h2>
          <p className="text-xs text-[#86868b] max-w-2xl leading-relaxed">
            {t('users_reg_sub', 'Control integral de todas las cuentas: nombre, correo, edad, dirección, contraseña, historial de cambios y fecha de alta.')}
          </p>
        </div>

        {/* Acciones y Selector de Modo de Visualización (Tarjetas vs Tabla) */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
          {/* Switch Tarjetas / Tabla */}
          <div className="flex items-center p-1 bg-black/60 rounded-2xl border border-white/[0.1] shadow-inner">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                viewMode === 'cards'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-[#86868b] hover:text-white'
              }`}
              title="Vista en tarjetas táctiles (ideal móviles)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Tarjetas</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-[#86868b] hover:text-white'
              }`}
              title="Vista en tabla con columnas"
            >
              <Table className="w-3.5 h-3.5" />
              <span>Tabla</span>
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs font-semibold text-white flex items-center gap-1.5 transition-all shadow-sm"
            title="Descargar lista filtrada en formato CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#2997ff]" />
            <span className="hidden sm:inline">{t('users_reg_btn_export', 'Exportar CSV')}</span>
            <span className="sm:hidden">CSV</span>
          </button>

          <button
            onClick={loadUsers}
            disabled={loading}
            className="px-3.5 py-2 rounded-2xl bg-[#2997ff] hover:bg-[#2997ff]/90 text-xs font-semibold text-white flex items-center gap-1.5 transition-all shadow-lg shadow-[#2997ff]/25 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{t('users_reg_btn_refresh', 'Actualizar')}</span>
          </button>
        </div>
      </div>

      {/* ── Tarjetas de Resumen & Filtros Rápidos de Rol ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        {/* Todos */}
        <button
          onClick={() => {
            setRoleFilter('all');
            setCurrentPage(1);
          }}
          className={`p-3 rounded-2xl border text-left transition-all ${
            roleFilter === 'all'
              ? 'bg-white/10 border-white/30 shadow-md ring-1 ring-white/20'
              : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.15]'
          }`}
        >
          <div className="flex items-center justify-between text-[#86868b] text-[11px] font-medium mb-0.5">
            <span>Todos</span>
            <Users className="w-3 h-3 text-white" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-white">{counts.all}</div>
          <span className="text-[10px] text-[#86868b] block truncate">Total usuarios</span>
        </button>

        {/* Programadores */}
        <button
          onClick={() => {
            setRoleFilter(roleFilter === 'programmer' ? 'all' : 'programmer');
            setCurrentPage(1);
          }}
          className={`p-3 rounded-2xl border text-left transition-all ${
            roleFilter === 'programmer'
              ? 'bg-purple-500/20 border-purple-500/50 shadow-md ring-1 ring-purple-500/30'
              : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.15]'
          }`}
        >
          <div className="flex items-center justify-between text-purple-300 text-[11px] font-medium mb-0.5">
            <span>Programadores</span>
            <Code className="w-3 h-3" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-white">{counts.programmer}</div>
          <span className="text-[10px] text-purple-300/70 block truncate">Equipo dev</span>
        </button>

        {/* Dueños */}
        <button
          onClick={() => {
            setRoleFilter(roleFilter === 'owner' ? 'all' : 'owner');
            setCurrentPage(1);
          }}
          className={`p-3 rounded-2xl border text-left transition-all ${
            roleFilter === 'owner'
              ? 'bg-[#2997ff]/20 border-[#2997ff]/50 shadow-md ring-1 ring-[#2997ff]/30'
              : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.15]'
          }`}
        >
          <div className="flex items-center justify-between text-[#2997ff] text-[11px] font-medium mb-0.5">
            <span>Dueños / Jefes</span>
            <Crown className="w-3 h-3" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-white">{counts.owner}</div>
          <span className="text-[10px] text-[#2997ff]/70 block truncate">Administradores</span>
        </button>

        {/* Empleados */}
        <button
          onClick={() => {
            setRoleFilter(roleFilter === 'employee' ? 'all' : 'employee');
            setCurrentPage(1);
          }}
          className={`p-3 rounded-2xl border text-left transition-all ${
            roleFilter === 'employee'
              ? 'bg-[#30d158]/20 border-[#30d158]/50 shadow-md ring-1 ring-[#30d158]/30'
              : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.15]'
          }`}
        >
          <div className="flex items-center justify-between text-[#30d158] text-[11px] font-medium mb-0.5">
            <span>Empleados</span>
            <Briefcase className="w-3 h-3" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-white">{counts.employee}</div>
          <span className="text-[10px] text-[#30d158]/70 block truncate">Colaboradores</span>
        </button>

        {/* Clientes */}
        <button
          onClick={() => {
            setRoleFilter(roleFilter === 'customer' ? 'all' : 'customer');
            setCurrentPage(1);
          }}
          className={`p-3 rounded-2xl border text-left transition-all ${
            roleFilter === 'customer'
              ? 'bg-[#ffd60a]/20 border-[#ffd60a]/50 shadow-md ring-1 ring-[#ffd60a]/30'
              : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.15]'
          }`}
        >
          <div className="flex items-center justify-between text-[#ffd60a] text-[11px] font-medium mb-0.5">
            <span>Clientes</span>
            <ShoppingBag className="w-3 h-3" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-white">{counts.customer}</div>
          <span className="text-[10px] text-[#ffd60a]/70 block truncate">Compradores</span>
        </button>

        {/* Claves Modificadas */}
        <button
          onClick={() => {
            setPasswordStatusFilter(passwordStatusFilter === 'modified' ? 'all' : 'modified');
            setCurrentPage(1);
          }}
          className={`p-3 rounded-2xl border text-left transition-all ${
            passwordStatusFilter === 'modified'
              ? 'bg-amber-500/20 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
              : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.15]'
          }`}
        >
          <div className="flex items-center justify-between text-amber-400 text-[11px] font-medium mb-0.5">
            <span>Claves Cambiadas</span>
            <KeyRound className="w-3 h-3" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-white">{counts.modifiedPasswords}</div>
          <span className="text-[10px] text-amber-300/70 block truncate">Con modificación</span>
        </button>
      </div>

      {/* ── Barra de Búsqueda y Filtros de Fecha (Mes, Año, Rango) ── */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/[0.03] border border-white/[0.08] space-y-3 sm:space-y-4">
        {/* Fila 1: Búsqueda y Dropdowns Principales */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          {/* Buscador */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre, correo, edad, dirección..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-black/50 border border-white/[0.1] text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtro por Rol y Contraseña */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full sm:w-auto bg-black/50 border border-white/[0.1] rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#2997ff]"
            >
              <option value="all">Todos los roles</option>
              <option value="customer">Clientes</option>
              <option value="employee">Empleados</option>
              <option value="owner">Dueños</option>
              <option value="programmer">Programadores</option>
            </select>

            <select
              value={passwordStatusFilter}
              onChange={(e) => {
                setPasswordStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full sm:w-auto bg-black/50 border border-white/[0.1] rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#2997ff]"
            >
              <option value="all">Todas las claves</option>
              <option value="modified">⚠️ Clave Modificada</option>
              <option value="original">✓ Clave Original</option>
            </select>
          </div>
        </div>

        {/* Fila 2: Filtros Especiales por Fecha (Año, Mes, Selector de Fecha) */}
        <div className="pt-3 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Botón para colapsar/expandir filtros de fecha en pantallas pequeñas */}
          <div className="flex sm:hidden items-center justify-between">
            <button
              onClick={() => setShowMobileDateFilters(!showMobileDateFilters)}
              className="text-xs text-[#2997ff] font-semibold flex items-center gap-1.5 py-1"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{showMobileDateFilters ? 'Ocultar filtros de fecha' : 'Filtrar por Mes / Año / Día'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMobileDateFilters ? 'rotate-180' : ''}`} />
            </button>
            {hasDateFiltersActive && (
              <span className="px-2 py-0.5 rounded-full bg-[#2997ff]/20 text-[#2997ff] text-[10px] font-bold">
                Activo
              </span>
            )}
          </div>

          <div className={`${showMobileDateFilters ? 'flex' : 'hidden'} sm:flex flex-wrap items-center gap-2.5`}>
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-[#86868b]">
              <Calendar className="w-3.5 h-3.5 text-[#2997ff]" />
              <span>Fecha:</span>
            </div>

            {/* Selector de Año */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-[#6e6e73]">Año:</span>
              <select
                value={yearFilter}
                onChange={(e) => {
                  setYearFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className={`rounded-xl px-2.5 py-1.5 text-xs font-medium border transition-all ${
                  yearFilter !== 'all'
                    ? 'bg-[#2997ff]/20 text-[#2997ff] border-[#2997ff]/40 font-semibold'
                    : 'bg-black/40 text-white border-white/[0.1]'
                }`}
              >
                <option value="all">Todos los años</option>
                {AVAILABLE_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Selector de Mes */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-[#6e6e73]">Mes:</span>
              <select
                value={monthFilter}
                onChange={(e) => {
                  setMonthFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className={`rounded-xl px-2.5 py-1.5 text-xs font-medium border transition-all ${
                  monthFilter !== 'all'
                    ? 'bg-[#2997ff]/20 text-[#2997ff] border-[#2997ff]/40 font-semibold'
                    : 'bg-black/40 text-white border-white/[0.1]'
                }`}
              >
                <option value="all">Todos los meses</option>
                {MONTH_NAMES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Selector de Día / Fecha Exacta */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-[#6e6e73]">Día:</span>
              <input
                type="date"
                value={specificDate}
                onChange={(e) => {
                  setSpecificDate(e.target.value);
                  setCurrentPage(1);
                }}
                className={`rounded-xl px-2.5 py-1.5 text-xs border transition-all ${
                  specificDate
                    ? 'bg-[#2997ff]/20 text-[#2997ff] border-[#2997ff]/40 font-semibold'
                    : 'bg-black/40 text-[#86868b] border-white/[0.1]'
                }`}
              />
            </div>

            {/* Botón para restablecer fechas si están activas */}
            {hasDateFiltersActive && (
              <button
                onClick={clearDateFilters}
                className="px-2.5 py-1 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-[11px] text-white flex items-center gap-1 transition-all"
              >
                <RotateCcw className="w-3 h-3 text-[#ffd60a]" />
                Limpiar fecha
              </button>
            )}
          </div>

          {/* Contador de registros en el filtro activo */}
          <div className="text-xs text-[#86868b] flex items-center justify-between sm:justify-end gap-2">
            <span>
              Mostrando <strong className="text-white">{filteredUsers.length}</strong> de{' '}
              <strong className="text-white">{users.length}</strong> usuarios
            </span>
            {hasDateFiltersActive && (
              <span className="px-2 py-0.5 rounded-md bg-[#2997ff]/10 text-[#2997ff] text-[10px] font-medium border border-[#2997ff]/20">
                Filtro fecha activo
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── CONTENIDO PRINCIPAL: TARJETAS O TABLA ── */}
      <div className="apple-card overflow-hidden rounded-3xl border border-white/[0.08] shadow-2xl">
        {loading ? (
          <div className="p-8 sm:p-12 space-y-4">
            <div className="flex items-center justify-center gap-3 text-sm text-[#86868b]">
              <RefreshCw className="w-5 h-5 animate-spin text-[#2997ff]" />
              <span>Cargando directorio global de usuarios...</span>
            </div>
            <div className="space-y-2 pt-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 rounded-2xl bg-white/[0.02] animate-pulse border border-white/[0.04]" />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-white">{error}</p>
            <button
              onClick={loadUsers}
              className="mt-4 px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-xs font-semibold text-white inline-flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reintentar
            </button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 sm:p-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-3 border border-white/[0.08]">
              <Users className="w-6 h-6 text-[#86868b]" />
            </div>
            <h4 className="text-sm font-bold text-white">No se encontraron usuarios</h4>
            <p className="text-xs text-[#86868b] mt-1 max-w-sm mx-auto">
              No hay coincidencias con los filtros aplicados.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setRoleFilter('all');
                setPasswordStatusFilter('all');
                clearDateFilters();
              }}
              className="mt-4 px-3.5 py-1.5 rounded-xl bg-[#2997ff]/20 text-[#2997ff] border border-[#2997ff]/30 text-xs font-semibold hover:bg-[#2997ff]/30 transition-all inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restablecer filtros
            </button>
          </div>
        ) : viewMode === 'cards' ? (
          /* ── 📱 VISTA DE TARJETAS MÓVILES (TOUCH OPTIMIZED) ── */
          <div className="p-3 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {paginatedUsers.map((u) => {
              const roleMeta = ROLE_META[u.role] || ROLE_META.customer;
              const isPassRevealed = Boolean(revealedPasswords[u.uid]);
              const isCopied = copiedUid === u.uid;

              return (
                <div
                  key={u.uid}
                  className="p-4 rounded-2xl bg-white/[0.025] hover:bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.15] transition-all space-y-3"
                >
                  {/* Fila superior: Avatar, Nombre y Rol */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center font-bold text-xs text-white shrink-0">
                        {(u.displayName || u.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-white text-xs truncate">
                          {u.displayName || 'Sin nombre'}
                        </h4>
                        <span className="font-mono text-[9px] text-[#6e6e73] block truncate">
                          {u.uid}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${roleMeta.badge}`}
                    >
                      {roleMeta.icon}
                      {roleMeta.label}
                    </span>
                  </div>

                  {/* Datos del usuario: Correo, Teléfono, Edad, Dirección */}
                  <div className="space-y-1.5 text-xs text-[#86868b] pt-1 border-t border-white/[0.04]">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-[#2997ff] shrink-0" />
                      <span className="truncate select-all text-white/90">{u.email}</span>
                    </div>

                    {u.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-[#30d158] shrink-0" />
                        <span className="text-white/80">{u.phone}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                      {u.age ? (
                        <span className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-white text-[11px] font-medium">
                          Edad: {u.age} años
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#6e6e73] italic">Edad no especificada</span>
                      )}

                      {u.area && (
                        <span className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-[#86868b] text-[11px]">
                          {u.area}
                        </span>
                      )}
                    </div>

                    <div className="flex items-start gap-1.5 pt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-[#2997ff] shrink-0 mt-0.5" />
                      <span className="text-white/80 text-[11px] leading-snug">
                        {u.direccion || 'Sin dirección registrada'}
                      </span>
                    </div>
                  </div>

                  {/* Contenedor de Contraseña y Estado */}
                  <div className="p-3 rounded-xl bg-black/60 border border-white/[0.08] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#86868b] uppercase tracking-wider font-semibold">
                        Credencial de Acceso
                      </span>
                      {u.passwordModified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                          Modificada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#30d158]/15 text-[#30d158] border border-[#30d158]/30">
                          <Check className="w-2.5 h-2.5" />
                          Original
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-white select-all">
                        {isPassRevealed ? u.password || '••••••••' : '••••••••••••'}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleRevealPassword(u.uid)}
                          className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-[#86868b] hover:text-white transition-all"
                          title={isPassRevealed ? 'Ocultar clave' : 'Ver clave'}
                        >
                          {isPassRevealed ? (
                            <EyeOff className="w-3.5 h-3.5 text-[#ffd60a]" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleCopyPassword(u.uid, u.password)}
                          className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-[#86868b] hover:text-white transition-all"
                          title="Copiar clave"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-[#30d158]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {u.passwordModified && u.passwordModifiedAt && (
                      <div className="text-[10px] text-amber-300/80">
                        Cambiada el: {formatDate(u.passwordModifiedAt)}
                      </div>
                    )}
                  </div>

                  {/* Pie de la tarjeta con fecha y botón de cambiar clave */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.06] text-[11px]">
                    <div className="text-[#86868b]">
                      <span>Alta: </span>
                      <strong className="text-white/90">{formatDate(u.createdAt)}</strong>
                      <span className="block text-[10px] text-[#6e6e73]">
                        {timeAgo(u.createdAt)}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setEditingUser(u);
                        setNewPasswordInput('');
                        setUpdateFeedback(null);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs font-semibold text-white inline-flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#2997ff]" />
                      <span>Cambiar Clave</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── 💻 VISTA DE TABLA COMPLETA CON SCROLL HORIZONTAL TÁCTIL ── */
          <div className="overflow-x-auto touch-pan-x no-scrollbar">
            <div className="md:hidden px-4 py-2 bg-[#2997ff]/10 border-b border-[#2997ff]/20 text-[11px] text-[#2997ff] flex items-center justify-between">
              <span>Desliza horizontalmente la tabla para ver todas las columnas</span>
              <span>➔</span>
            </div>
            <table className="w-full min-w-[850px] text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.03] text-[#86868b] uppercase tracking-wider font-semibold text-[10px]">
                  <th className="py-3.5 px-4">Usuario / Nombre</th>
                  <th className="py-3.5 px-4">Correo Electrónico</th>
                  <th className="py-3.5 px-4">Rol</th>
                  <th className="py-3.5 px-4">Edad</th>
                  <th className="py-3.5 px-4">Dirección</th>
                  <th className="py-3.5 px-4">Contraseña</th>
                  <th className="py-3.5 px-4">Estado de Clave</th>
                  <th className="py-3.5 px-4">Fecha de Registro</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {paginatedUsers.map((u) => {
                  const roleMeta = ROLE_META[u.role] || ROLE_META.customer;
                  const isPassRevealed = Boolean(revealedPasswords[u.uid]);
                  const isCopied = copiedUid === u.uid;

                  return (
                    <tr
                      key={u.uid}
                      className="hover:bg-white/[0.025] transition-colors group"
                    >
                      {/* 1. Nombre */}
                      <td className="py-3 px-4 font-medium text-white">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center font-bold text-xs text-white shrink-0">
                            {(u.displayName || u.email || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-white block truncate max-w-[180px]">
                              {u.displayName || 'Sin nombre'}
                            </span>
                            <span className="font-mono text-[9px] text-[#6e6e73] block truncate max-w-[150px]">
                              {u.uid}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Correo */}
                      <td className="py-3 px-4 text-[#86868b]">
                        <span className="text-white/90 select-all block truncate max-w-[200px]" title={u.email}>
                          {u.email}
                        </span>
                        {u.phone && (
                          <span className="text-[10px] text-[#6e6e73] block">{u.phone}</span>
                        )}
                      </td>

                      {/* 3. Rol */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${roleMeta.badge}`}
                        >
                          {roleMeta.icon}
                          {roleMeta.label}
                        </span>
                        {u.area && (
                          <span className="block text-[9px] text-[#6e6e73] mt-0.5 truncate max-w-[110px]">
                            {u.area}
                          </span>
                        )}
                      </td>

                      {/* 4. Edad */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {u.age ? (
                          <span className="px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white font-medium text-[11px]">
                            {u.age} años
                          </span>
                        ) : (
                          <span className="text-[#6e6e73] italic text-[11px]">No especificada</span>
                        )}
                      </td>

                      {/* 5. Dirección */}
                      <td className="py-3 px-4 text-[#86868b] max-w-[220px]">
                        {u.direccion && u.direccion !== 'Sin dirección' ? (
                          <div className="flex items-start gap-1.5" title={u.direccion}>
                            <MapPin className="w-3 h-3 text-[#2997ff] shrink-0 mt-0.5" />
                            <span className="text-white/80 truncate block text-[11px]">
                              {u.direccion}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#6e6e73] italic text-[11px]">Sin dirección</span>
                        )}
                      </td>

                      {/* 6. Contraseña */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-semibold px-2 py-1 rounded-lg bg-black/60 border border-white/[0.08] text-white select-all">
                            {isPassRevealed ? u.password || '••••••••' : '••••••••••••'}
                          </span>
                          <button
                            onClick={() => toggleRevealPassword(u.uid)}
                            className="p-1 rounded-lg hover:bg-white/[0.1] text-[#86868b] hover:text-white transition-all"
                            title={isPassRevealed ? 'Ocultar clave' : 'Ver clave'}
                          >
                            {isPassRevealed ? (
                              <EyeOff className="w-3.5 h-3.5 text-[#ffd60a]" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleCopyPassword(u.uid, u.password)}
                            className="p-1 rounded-lg hover:bg-white/[0.1] text-[#86868b] hover:text-white transition-all"
                            title="Copiar clave"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-[#30d158]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* 7. Estado de Modificación de Contraseña */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {u.passwordModified ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              <AlertTriangle className="w-3 h-3 text-amber-400" />
                              Modificada
                            </span>
                            {u.passwordModifiedAt && (
                              <span className="block text-[9px] text-[#86868b]">
                                {formatDate(u.passwordModifiedAt)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#30d158]/15 text-[#30d158] border border-[#30d158]/30">
                              <Check className="w-3 h-3" />
                              Original
                            </span>
                            <span className="block text-[9px] text-[#6e6e73]">Sin cambios</span>
                          </div>
                        )}
                      </td>

                      {/* 8. Fecha de Registro */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-white block font-medium text-[11px]">
                          {formatDate(u.createdAt)}
                        </span>
                        <span className="text-[10px] text-[#6e6e73] block flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {timeAgo(u.createdAt)}
                        </span>
                      </td>

                      {/* 9. Acciones */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setNewPasswordInput('');
                            setUpdateFeedback(null);
                          }}
                          className="px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-[11px] font-medium text-white inline-flex items-center gap-1.5 transition-all"
                          title="Cambiar contraseña de este usuario"
                        >
                          <Edit3 className="w-3 h-3 text-[#2997ff]" />
                          <span>Cambiar Clave</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pie de Tabla / Paginación Responsiva ── */}
        {!loading && filteredUsers.length > 0 && (
          <div className="p-3.5 sm:p-4 border-t border-white/[0.06] bg-white/[0.01] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 text-[#86868b]">
              <span>
                Pág. <strong className="text-white">{currentPage}</strong> de{' '}
                <strong className="text-white">{totalPages}</strong>
              </span>
              <span className="text-[#6e6e73]">|</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px]">Filas:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-black/60 border border-white/[0.1] rounded-lg px-2 py-0.5 text-xs text-white"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            {/* Botones de navegación táctiles */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-end">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-xs font-medium text-white disabled:opacity-30 transition-all"
              >
                ← Anterior
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                  let pNum = idx + 1;
                  if (totalPages > 5 && currentPage > 3) {
                    pNum = currentPage - 3 + idx;
                    if (pNum > totalPages) pNum = totalPages - (4 - idx);
                  }
                  return (
                    <button
                      key={pNum}
                      onClick={() => setCurrentPage(pNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                        currentPage === pNum
                          ? 'bg-[#2997ff] text-white shadow-sm'
                          : 'bg-white/[0.04] text-[#86868b] hover:text-white'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-xs font-medium text-white disabled:opacity-30 transition-all"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal Móvil-Friendly para Modificar Contraseña de un Usuario ── */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="w-full max-w-md apple-card p-5 sm:p-6 rounded-3xl border border-white/[0.15] shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#ffd60a]" />
                <h3 className="text-sm font-bold text-white">Modificar Contraseña</h3>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg text-[#86868b] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-xs space-y-1">
              <div className="text-white font-semibold">{editingUser.displayName}</div>
              <div className="text-[#86868b] truncate">{editingUser.email}</div>
              <div className="text-[10px] text-[#6e6e73] font-mono truncate">UID: {editingUser.uid}</div>
            </div>

            <form onSubmit={handleSavePasswordChange} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-[#86868b] block mb-1.5">
                  Nueva Contraseña para el Usuario
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ingresa la nueva contraseña..."
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/[0.1] text-xs text-white font-mono placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff]"
                />
                <p className="text-[10px] text-[#86868b] mt-1 leading-relaxed">
                  Al guardar, se registrará el cambio en tiempo real y el estado cambiará a &quot;Modificada&quot;.
                </p>
              </div>

              {updateFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium ${
                    updateFeedback.startsWith('✓')
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}
                >
                  {updateFeedback}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-white transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updatingPassword || !newPasswordInput.trim()}
                  className="px-4 py-2 rounded-xl bg-[#2997ff] hover:bg-[#2997ff]/90 text-xs font-semibold text-white transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {updatingPassword ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Guardar Clave</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
