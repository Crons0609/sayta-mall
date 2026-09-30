// src/components/dashboard/EmployeeManager.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { EmployeeRecord } from '@/data/mockEmployees';
import { EMPLOYEE_AREAS, EMPLOYEE_AREA_LABELS, EmployeeArea } from '@/lib/constants';
import { useBranch } from '@/providers/BranchProvider';
import {
  UserPlus,
  Search,
  Lock,
  Mail,
  User,
  MapPin,
  Briefcase,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Power,
  RefreshCw,
  Phone,
  Shield,
  Filter,
  Trash2,
  X,
  Plus,
  Settings2,
  FolderPlus,
  Tag,
} from 'lucide-react';

export interface WorkArea {
  id: string;
  name: string;
  isCustom?: boolean;
}

interface EmployeeManagerProps {
  userRole: 'programmer' | 'owner';
  title?: string;
  subtitle?: string;
}

const FALLBACK_WORK_AREAS: WorkArea[] = [
  { id: 'caja', name: 'Caja', isCustom: false },
  { id: 'bodega', name: 'Bodega', isCustom: false },
  { id: 'ventas', name: 'Ventas', isCustom: false },
  { id: 'limpieza', name: 'Limpieza', isCustom: false },
  { id: 'atencion_cliente', name: 'Atención al Cliente', isCustom: false },
  { id: 'general', name: 'General', isCustom: false },
];

export function EmployeeManager({ userRole, title, subtitle }: EmployeeManagerProps) {
  const { branches } = useBranch();
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [workAreas, setWorkAreas] = useState<WorkArea[]>(FALLBACK_WORK_AREAS);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('all');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('all');

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedArea, setSelectedArea] = useState<string>('caja');
  const [selectedBranchId, setSelectedBranchId] = useState<string>(branches[0]?.id || '');
  const [phone, setPhone] = useState('');

  // Inline Work Area creation state
  const [isInlineAddingArea, setIsInlineAddingArea] = useState(false);
  const [inlineAreaName, setInlineAreaName] = useState('');
  const [creatingArea, setCreatingArea] = useState(false);

  // Manage Areas Modal State
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [modalNewAreaName, setModalNewAreaName] = useState('');
  const [deletingAreaId, setDeletingAreaId] = useState<string | null>(null);

  // Status feedback
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Cargar lista de empleados
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/employees');
      const data = await res.json();
      if (data.success && Array.isArray(data.employees)) {
        setEmployees(data.employees);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar áreas de trabajo dinámicas
  const fetchWorkAreas = async () => {
    try {
      const res = await fetch('/api/work-areas');
      const data = await res.json();
      if (data.success && Array.isArray(data.areas) && data.areas.length > 0) {
        setWorkAreas(data.areas);
      }
    } catch (err) {
      console.error('Error fetching work areas:', err);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchWorkAreas();
  }, []);

  // Obtener etiqueta legible de un área
  const getAreaLabel = (areaKey: string) => {
    const found = workAreas.find((a) => a.id === areaKey);
    if (found) return found.name;
    return EMPLOYEE_AREA_LABELS[areaKey as EmployeeArea] || areaKey.replace(/^area-/, '').replace(/_/g, ' ');
  };

  // Crear nueva área de trabajo
  const handleCreateWorkArea = async (name: string, selectImmediately: boolean = false) => {
    const cleanName = name.trim();
    if (!cleanName) return;

    try {
      setCreatingArea(true);
      const res = await fetch('/api/work-areas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanName }),
      });
      const data = await res.json();

      if (data.success && data.area) {
        setWorkAreas((prev) => {
          if (prev.some((a) => a.id === data.area.id)) return prev;
          return [...prev, data.area];
        });

        if (selectImmediately) {
          setSelectedArea(data.area.id);
          setIsInlineAddingArea(false);
          setInlineAreaName('');
        } else {
          setModalNewAreaName('');
        }

        setSuccessMessage(`Área "${data.area.name}" creada exitosamente.`);
        setTimeout(() => setSuccessMessage(null), 3500);
      } else {
        setErrorMessage(data.error || 'No se pudo crear el área de trabajo.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al crear área.');
    } finally {
      setCreatingArea(false);
    }
  };

  // Eliminar área de trabajo personalizada
  const handleDeleteWorkArea = async (id: string, name: string) => {
    try {
      setDeletingAreaId(id);
      const res = await fetch(`/api/work-areas?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        setWorkAreas((prev) => prev.filter((a) => a.id !== id));
        if (selectedArea === id) {
          setSelectedArea('caja');
        }
        setSuccessMessage(`Área "${name}" eliminada.`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setErrorMessage(data.error || 'No se pudo eliminar el área.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al eliminar área.');
    } finally {
      setDeletingAreaId(null);
    }
  };

  // Generador de contraseñas seguras
  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    let generated = 'Sayta!';
    for (let i = 0; i < 6; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(generated);
    setShowPassword(true);
  };

  // Enviar formulario
  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !password || !selectedArea || !selectedBranchId) {
      setErrorMessage('Por favor completa todos los campos requeridos.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('La contraseña debe tener mínimo 6 caracteres.');
      return;
    }

    try {
      setSubmitting(true);
      const branchObj = branches.find((b) => b.id === selectedBranchId);

      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: fullName,
          email,
          password,
          area: selectedArea,
          branchId: selectedBranchId,
          branchName: branchObj?.name || 'Sayta Central',
          phone,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error al crear el empleado');
      }

      setSuccessMessage(`Empleado ${email} registrado exitosamente en el área de ${getAreaLabel(selectedArea)}.`);
      // Reset form
      setFullName('');
      setEmail('');
      setPassword('');
      setPhone('');
      setIsFormOpen(false);
      fetchEmployees();

      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error de conexión.');
    } finally {
      setSubmitting(false);
    }
  };

  // Alternar estado suspendido
  const handleToggleSuspend = async (employee: EmployeeRecord) => {
    const newStatus = !employee.suspended;
    try {
      await fetch('/api/employees', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: employee.id,
          suspended: newStatus,
        }),
      });
      setEmployees((prev) =>
        prev.map((e) => (e.id === employee.id ? { ...e, suspended: newStatus } : e))
      );
    } catch (err) {
      console.error('Error toggling suspend:', err);
    }
  };

  // Copiar credenciales
  const handleCopyCredentials = (emp: EmployeeRecord) => {
    const text = `Credenciales Sayta Mall:\nUsuario: ${emp.email}\nÁrea: ${getAreaLabel(emp.area)}\nSucursal: ${emp.branchName}`;
    navigator.clipboard.writeText(text);
    setCopiedId(emp.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Eliminar empleado
  const handleDeleteEmployee = async (id: string) => {
    try {
      setDeleting(true);
      const res = await fetch(`/api/employees?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setEmployees((prev) => prev.filter((e) => e.id !== id));
        setSuccessMessage('Empleado eliminado exitosamente.');
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage(data.error || 'Error al eliminar empleado.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error de conexión.');
    } finally {
      setDeleting(false);
      setDeleteConfirmId(null);
    }
  };

  // Filtrado
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesArea =
      selectedAreaFilter === 'all' || emp.area === selectedAreaFilter;
    const matchesBranch =
      selectedBranchFilter === 'all' || emp.branchId === selectedBranchFilter;
    return matchesSearch && matchesArea && matchesBranch;
  });

  return (
    <div className="w-full space-y-6">
      {/* Cabecera del Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[#2997ff]" />
            <span>{title || 'Gestión y Registro de Empleados'}</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#86868b] mt-1">
            {subtitle || 'Da de alta empleados con correo, contraseña y área de trabajo personalizada asignada.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Botón Gestionar Áreas */}
          <button
            onClick={() => setIsAreaModalOpen(true)}
            type="button"
            className="apple-pill-btn bg-white/[0.08] hover:bg-white/[0.14] text-white px-3.5 py-2.5 text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-white/[0.1] transition-all"
            title="Administrar y crear áreas de trabajo personalizadas"
          >
            <FolderPlus className="w-4 h-4 text-[#2997ff]" />
            <span>Gestionar Áreas ({workAreas.length})</span>
          </button>

          {/* Botón Nuevo Empleado */}
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            type="button"
            className="apple-pill-btn apple-btn-primary px-4 py-2.5 text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isFormOpen ? 'Ocultar Formulario' : 'Nuevo Empleado'}</span>
          </button>
        </div>
      </div>

      {/* Alerta de Éxito / Error */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-[#30d158]/10 border border-[#30d158]/30 text-xs sm:text-sm text-[#30d158] flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs sm:text-sm text-rose-400 flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ─── FORMULARIO DE ALTA DE EMPLEADOS (Apple Card) ─── */}
      {isFormOpen && (
        <form
          onSubmit={handleCreateEmployee}
          className="apple-card p-5 sm:p-8 space-y-5 animate-fade-in border-[#2997ff]/30 shadow-xl"
        >
          <div className="border-b border-white/[0.08] pb-3 flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#ffd60a]" />
              <span>Registrar Credenciales y Asignar Área</span>
            </h3>
            <span className="text-[11px] text-[#86868b]">Rol: Empleado con Claims de Acceso</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Nombre Completo */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#f5f5f7] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#86868b]" /> Nombre del Empleado
              </label>
              <input
                type="text"
                placeholder="Ej. Roberto Sánchez"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-xs sm:text-sm text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff]"
              />
            </div>

            {/* Correo Electrónico */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#f5f5f7] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#86868b]" /> Correo Electrónico
              </label>
              <input
                type="email"
                placeholder="empleado@saytamall.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-xs sm:text-sm text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff]"
              />
            </div>

            {/* Contraseña Inicial */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-[#f5f5f7] flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#86868b]" /> Contraseña Inicial
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="text-[11px] text-[#2997ff] hover:underline"
                >
                  Generar Segura
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-xs sm:text-sm text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff] font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Área Asignada con Creación Personalizada */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-[#f5f5f7] flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-[#86868b]" /> Área de Trabajo
                </label>
                <button
                  type="button"
                  onClick={() => setIsInlineAddingArea(!isInlineAddingArea)}
                  className="text-[11px] text-[#2997ff] hover:underline flex items-center gap-1 font-medium"
                >
                  <Plus className="w-3 h-3" />
                  <span>{isInlineAddingArea ? 'Cancelar' : '+ Nueva Área'}</span>
                </button>
              </div>

              {isInlineAddingArea ? (
                <div className="flex items-center gap-2 pt-1 animate-fade-in">
                  <input
                    type="text"
                    placeholder="Ej. Cocina, Empaque, Soporte..."
                    value={inlineAreaName}
                    onChange={(e) => setInlineAreaName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateWorkArea(inlineAreaName, true);
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-xl bg-white/[0.08] border border-[#2997ff]/40 text-xs text-white placeholder-[#86868b] focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={creatingArea || !inlineAreaName.trim()}
                    onClick={() => handleCreateWorkArea(inlineAreaName, true)}
                    className="px-3 py-2 rounded-xl bg-[#2997ff] text-black text-xs font-semibold hover:bg-[#2997ff]/90 disabled:opacity-50"
                  >
                    {creatingArea ? '...' : 'Crear'}
                  </button>
                </div>
              ) : (
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1c1c1e] border border-white/[0.1] text-xs sm:text-sm text-white focus:outline-none focus:border-[#2997ff] cursor-pointer"
                >
                  {workAreas.map((area) => (
                    <option key={area.id} value={area.id} className="bg-[#1c1c1e] text-white">
                      {area.name} {area.isCustom ? '★ (Personalizada)' : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Sucursal Asignada */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#f5f5f7] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#86868b]" /> Sucursal Asignada
              </label>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1c1c1e] border border-white/[0.1] text-xs sm:text-sm text-white focus:outline-none focus:border-[#2997ff] cursor-pointer"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id} className="bg-[#1c1c1e] text-white">
                    {b.name} ({b.city || 'Sucursal'})
                  </option>
                ))}
              </select>
            </div>

            {/* Teléfono de Contacto (Opcional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#f5f5f7] flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#86868b]" /> Teléfono de Contacto
              </label>
              <input
                type="tel"
                placeholder="+52 55 0000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-xs sm:text-sm text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff]"
              />
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-full text-xs font-medium text-[#86868b] hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto apple-pill-btn apple-btn-primary px-6 py-2.5 text-xs font-semibold disabled:opacity-50"
            >
              {submitting ? 'Creando Empleado...' : 'Guardar y Otorgar Acceso'}
            </button>
          </div>
        </form>
      )}

      {/* ─── FILTROS Y BÚSQUEDA RESPONSIVE ─── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
        {/* Input de búsqueda */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#86868b] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff]"
          />
        </div>

        {/* Filtros Dropdown */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Filtro por Área Dinámica */}
          <select
            value={selectedAreaFilter}
            onChange={(e) => setSelectedAreaFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#1c1c1e] border border-white/[0.08] text-xs text-white focus:outline-none"
          >
            <option value="all">Todas las áreas</option>
            {workAreas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name} {area.isCustom ? '★' : ''}
              </option>
            ))}
          </select>

          {/* Filtro por Sucursal */}
          <select
            value={selectedBranchFilter}
            onChange={(e) => setSelectedBranchFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#1c1c1e] border border-white/[0.08] text-xs text-white focus:outline-none"
          >
            <option value="all">Todas las sucursales</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          <button
            onClick={() => {
              fetchEmployees();
              fetchWorkAreas();
            }}
            className="p-2 rounded-xl text-[#86868b] hover:text-white bg-white/[0.05] border border-white/[0.08]"
            title="Recargar lista y áreas"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── LISTA RESPONSIVE DE EMPLEADOS ─── */}
      {/* Vista Móvil: Tarjetas táctiles (md:hidden) */}
      <div className="block md:hidden space-y-3">
        {filteredEmployees.length === 0 ? (
          <div className="apple-card p-8 text-center text-xs text-[#86868b]">
            No hay empleados que coincidan con la búsqueda.
          </div>
        ) : (
          filteredEmployees.map((emp) => (
            <div
              key={emp.id}
              className={`apple-card p-4 space-y-3 ${
                emp.suspended ? 'opacity-60 border-rose-500/20' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-semibold text-white">{emp.displayName}</h4>
                  <p className="text-xs text-[#86868b] font-mono">{emp.email}</p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    emp.suspended
                      ? 'bg-rose-500/15 text-rose-400'
                      : 'bg-[#30d158]/15 text-[#30d158]'
                  }`}
                >
                  {emp.suspended ? 'Suspendido' : 'Activo'}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-white/[0.06] text-[#2997ff] font-medium flex items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  {getAreaLabel(emp.area)}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white/[0.06] text-[#f5f5f7] flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#30d158]" />
                  {emp.branchName}
                </span>
              </div>

              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-2">
                <button
                  onClick={() => handleCopyCredentials(emp)}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.06] text-xs text-[#f5f5f7] flex items-center gap-1"
                >
                  {copiedId === emp.id ? <Check className="w-3.5 h-3.5 text-[#30d158]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === emp.id ? 'Copiado' : 'Credenciales'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleSuspend(emp)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                      emp.suspended
                        ? 'bg-[#30d158]/20 text-[#30d158]'
                        : 'bg-rose-500/10 text-rose-400'
                    }`}
                  >
                    {emp.suspended ? 'Reactivar' : 'Suspender'}
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(emp.id)}
                    className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                    title="Eliminar empleado"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Vista Tablet / Desktop: Tabla estilo Apple (hidden md:block) */}
      <div className="hidden md:block apple-card overflow-hidden">
        <table className="w-full text-left text-xs text-[#86868b]">
          <thead className="bg-white/[0.02] border-b border-white/[0.06] text-[#f5f5f7] uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3.5 px-4 font-semibold">Empleado</th>
              <th className="py-3.5 px-4 font-semibold">Área Asignada</th>
              <th className="py-3.5 px-4 font-semibold">Sucursal</th>
              <th className="py-3.5 px-4 font-semibold">Estado</th>
              <th className="py-3.5 px-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-xs text-[#6e6e73]">
                  No se encontraron empleados registrados.
                </td>
              </tr>
            ) : (
              filteredEmployees.map((emp) => (
                <tr
                  key={emp.id}
                  className={`hover:bg-white/[0.02] transition-colors ${
                    emp.suspended ? 'opacity-60' : ''
                  }`}
                >
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-[#f5f5f7]">{emp.displayName}</div>
                    <div className="text-[11px] text-[#86868b] font-mono">{emp.email}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#2997ff]/10 text-[#2997ff] font-medium">
                      <Briefcase className="w-3 h-3" />
                      {getAreaLabel(emp.area)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-[#f5f5f7]">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#30d158]" />
                      {emp.branchName}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                        emp.suspended
                          ? 'bg-rose-500/15 text-rose-400'
                          : 'bg-[#30d158]/15 text-[#30d158]'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${emp.suspended ? 'bg-rose-400' : 'bg-[#30d158]'}`} />
                      {emp.suspended ? 'Suspendido' : 'Activo'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <button
                      onClick={() => handleCopyCredentials(emp)}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-[#f5f5f7] text-[11px] transition-all"
                      title="Copiar datos de acceso"
                    >
                      {copiedId === emp.id ? 'Copiado ✓' : 'Copiar'}
                    </button>
                    <button
                      onClick={() => handleToggleSuspend(emp)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                        emp.suspended
                          ? 'bg-[#30d158]/20 text-[#30d158] hover:bg-[#30d158]/30'
                          : 'bg-rose-500/15 text-rose-400 hover:bg-rose-500/25'
                      }`}
                    >
                      {emp.suspended ? 'Reactivar' : 'Suspender'}
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(emp.id)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                      title="Eliminar empleado permanentemente"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ─── MODAL GESTIONAR ÁREAS DE TRABAJO ─── */}
      {isAreaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="apple-card p-6 max-w-lg w-full space-y-5 border-[#2997ff]/30 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-[#2997ff]" />
                <h3 className="text-base font-bold text-white">Gestionar Áreas de Trabajo</h3>
              </div>
              <button onClick={() => setIsAreaModalOpen(false)} className="text-[#86868b] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#86868b]">
              Crea tus propias áreas operativas para clasificar a los empleados según las necesidades de tu franquicia o sucursal.
            </p>

            {/* Input para agregar nueva área */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Nombre de nueva área (Ej. Cocina, Empaque, Soporte, Seguridad)..."
                value={modalNewAreaName}
                onChange={(e) => setModalNewAreaName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateWorkArea(modalNewAreaName, false);
                  }
                }}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff]"
              />
              <button
                type="button"
                disabled={creatingArea || !modalNewAreaName.trim()}
                onClick={() => handleCreateWorkArea(modalNewAreaName, false)}
                className="apple-pill-btn apple-btn-primary px-4 py-2.5 text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{creatingArea ? 'Guardando...' : 'Agregar'}</span>
              </button>
            </div>

            {/* Lista de Áreas */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {workAreas.map((area) => (
                <div
                  key={area.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Briefcase className="w-4 h-4 text-[#2997ff]" />
                    <span className="text-xs font-semibold text-white">{area.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        area.isCustom
                          ? 'bg-[#2997ff]/20 text-[#2997ff]'
                          : 'bg-white/[0.08] text-[#86868b]'
                      }`}
                    >
                      {area.isCustom ? 'Personalizada' : 'Predeterminada'}
                    </span>
                  </div>

                  {area.isCustom && (
                    <button
                      onClick={() => handleDeleteWorkArea(area.id, area.name)}
                      disabled={deletingAreaId === area.id}
                      className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50"
                      title="Eliminar área personalizada"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-white/[0.08] flex justify-end">
              <button
                onClick={() => setIsAreaModalOpen(false)}
                className="apple-pill-btn bg-white/[0.08] hover:bg-white/[0.14] text-white px-5 py-2 text-xs font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL DE CONFIRMACIÓN DE ELIMINACIÓN DE EMPLEADO ─── */}
      {deleteConfirmId &&
        (() => {
          const emp = employees.find((e) => e.id === deleteConfirmId);
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
              <div className="apple-card p-6 max-w-sm w-full space-y-4 border-red-500/30 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-red-500/15 flex items-center justify-center">
                      <Trash2 className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Eliminar Empleado</h3>
                      <p className="text-[11px] text-[#86868b]">Esta acción es permanente</p>
                    </div>
                  </div>
                  <button onClick={() => setDeleteConfirmId(null)} className="text-[#86868b] hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-[#86868b] leading-relaxed">
                  ¿Estás seguro de que deseas eliminar a{' '}
                  <span className="text-white font-semibold">{emp?.displayName || emp?.email}</span>?
                  Se eliminará su acceso al sistema de forma permanente.
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-medium text-[#86868b] bg-white/[0.06] hover:bg-white/[0.1] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleDeleteEmployee(deleteConfirmId)}
                    disabled={deleting}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 transition-colors disabled:opacity-50"
                  >
                    {deleting ? 'Eliminando...' : 'Sí, Eliminar'}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}
