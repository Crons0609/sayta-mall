// src/app/programador/duenos/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useDashboardPreferences } from '@/providers/DashboardPreferencesProvider';
import {
  Users,
  UserPlus,
  Search,
  Store,
  Clock,
  Shield,
  ShieldAlert,
  Power,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Mail,
  Lock,
  Building,
  Sparkles,
  RefreshCw,
  Eye,
  Key,
} from 'lucide-react';

interface Owner {
  id: string;
  name: string;
  email: string;
  storeName: string;
  branchCount: number;
  branchIds?: string[];
  status: 'active' | 'suspended';
  createdAt: string;
  invitationStatus?: 'pending' | 'accepted';
  invitationToken?: string;
  invitationExpiresAt?: string;
}

interface BranchOption {
  id: string;
  name: string;
  city?: string;
  address?: string;
}

export default function ProgrammerOwnersPage() {
  const { t } = useDashboardPreferences();
  const [owners, setOwners] = useState<Owner[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal para agregar dueño
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [storeName, setStoreName] = useState('');
  const [password, setPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [creationSuccess, setCreationSuccess] = useState<string | null>(null);

  // Modal para eliminar dueño (confirmación en 2 pasos)
  const [ownerToDelete, setOwnerToDelete] = useState<Owner | null>(null);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Mensajes de estado
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const fetchOwners = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/owners');
      const data = await res.json();
      if (data.success && Array.isArray(data.owners)) {
        setOwners(data.owners);
      }
    } catch (e) {
      console.error('Error fetching owners:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await fetch('/api/branches');
      const data = await res.json();
      if (data.success && Array.isArray(data.branches)) {
        setBranches(data.branches);
      }
    } catch (e) {
      console.error('Error fetching branches:', e);
    }
  };

  useEffect(() => {
    fetchOwners();
    fetchBranches();
  }, []);

  // Generador de contraseñas para jefes / dueños
  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    let generated = 'Dueño!';
    for (let i = 0; i < 6; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(generated);
  };

  // Invitar / Registrar dueño
  const handleAddOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      alert('Por favor ingresa una contraseña de al menos 6 caracteres para que el dueño/jefe pueda iniciar sesión.');
      return;
    }
    setCreating(true);
    setCreationSuccess(null);

    try {
      const res = await fetch('/api/owners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          storeName: storeName || `Tienda de ${name}`,
          temporaryPassword: password || undefined,
          branchIds: selectedBranchIds,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setCreationSuccess(data.message || 'Dueño invitado con éxito.');
        setName('');
        setEmail('');
        setStoreName('');
        setPassword('');
        setSelectedBranchIds([]);
        fetchOwners();
        fetchBranches();
        setTimeout(() => {
          setIsAddModalOpen(false);
          setCreationSuccess(null);
        }, 1500);
      } else {
        alert(data.error || 'Error al agregar dueño');
      }
    } catch (err: any) {
      alert(err.message || 'Error de conexión');
    } finally {
      setCreating(false);
    }
  };

  // Toggle Suspender / Reactivar
  const handleToggleStatus = async (owner: Owner) => {
    const nextStatus = owner.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch('/api/owners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId: owner.id, status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: 'success',
          message: `Estado de ${owner.name} cambiado a ${nextStatus === 'active' ? 'Activo' : 'Suspendido'}.`,
        });
        fetchOwners();
      } else {
        setFeedback({ type: 'error', message: data.error || 'No se pudo actualizar' });
      }
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message });
    }
  };

  // Iniciar Modo Soporte (Impersonation)
  const handleImpersonate = async (owner: Owner) => {
    try {
      const res = await fetch('/api/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId: owner.id,
          name: owner.name,
          email: owner.email,
          storeName: owner.storeName,
        }),
      });
      const data = await res.json();
      if (data.success && data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch (e: any) {
      alert('Error activando modo soporte: ' + e.message);
    }
  };

  // Confirmar eliminación
  const handleDeleteOwner = async () => {
    if (!ownerToDelete) return;
    if (confirmationInput.trim() !== ownerToDelete.storeName.trim()) {
      alert('El nombre ingresado no coincide con el nombre exacto de la tienda.');
      return;
    }

    try {
      setDeleting(true);
      const res = await fetch('/api/owners', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId: ownerToDelete.id,
          storeNameConfirmation: confirmationInput,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setFeedback({ type: 'success', message: data.message });
        setOwnerToDelete(null);
        setConfirmationInput('');
        fetchOwners();
      } else {
        alert(data.error || 'Error al eliminar');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setDeleting(false);
    }
  };

  const filteredOwners = owners.filter((o) => {
    const q = searchQuery.toLowerCase();
    return (
      o.name.toLowerCase().includes(q) ||
      o.email.toLowerCase().includes(q) ||
      o.storeName.toLowerCase().includes(q)
    );
  });

  return (
    <DashboardLayout role="programmer">
      <div className="space-y-6 animate-fade-in">
        {/* Cabecera de Página */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#2997ff]">
                {t('owners_badge', 'Consola Superadmin')}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.08] text-[#86868b]">
                {owners.length} {t('owners_count_label', 'Dueños Registrados')}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
              {t('owners_title', 'Gestión de Dueños de Tienda')}
            </h1>
            <p className="text-xs text-[#86868b] mt-1 max-w-2xl">
              {t('owners_desc', 'Administra los accesos de franquiciatarios y dueños de tienda.')}
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="apple-pill-btn apple-btn-primary px-4 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-[#2997ff]/20"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t('owners_btn_add', 'Agregar Dueño')}</span>
          </button>
        </div>

        {/* Feedback visual */}
        {feedback && (
          <div
            className={`p-3.5 rounded-2xl text-xs flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-[#30d158]/10 text-[#30d158] border border-[#30d158]/25'
                : 'bg-[#ff453a]/10 text-[#ff453a] border border-[#ff453a]/25'
            }`}
          >
            <span>{feedback.message}</span>
            <button
              onClick={() => setFeedback(null)}
              className="text-white/60 hover:text-white ml-2 text-sm"
            >
              ×
            </button>
          </div>
        )}

        {/* Buscador y Filtros */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#86868b] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('owners_search_placeholder', 'Buscar por nombre, correo o nombre de tienda...')}
              className="w-full pl-9 pr-4 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff]"
            />
          </div>

          <button
            onClick={fetchOwners}
            className="p-2 rounded-xl border border-white/[0.08] bg-white/[0.04] text-[#86868b] hover:text-white hover:bg-white/[0.08] transition-colors"
            title="Refrescar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Tabla de Dueños */}
        <div className="apple-card overflow-hidden border border-white/[0.08] rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[#86868b] font-medium uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">{t('owners_col_owner', 'Dueño & Correo')}</th>
                  <th className="py-3 px-4">{t('owners_col_store', 'Tienda Asignada')}</th>
                  <th className="py-3 px-4">{t('owners_col_branches', 'Sucursales')}</th>
                  <th className="py-3 px-4">{t('owners_col_status', 'Estado')}</th>
                  <th className="py-3 px-4">{t('owners_col_date', 'Fecha de Alta')}</th>
                  <th className="py-3 px-4 text-right">{t('owners_col_actions', 'Acciones')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#86868b]">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#2997ff]" />
                      <span>{t('loading', 'Cargando...')}</span>
                    </td>
                  </tr>
                ) : filteredOwners.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#86868b]">
                      {t('owners_empty_title', 'Ningún dueño registrado aún.')}
                    </td>
                  </tr>
                ) : (
                  filteredOwners.map((owner) => (
                    <tr key={owner.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Nombre & Correo */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{owner.name}</div>
                        <div className="text-[11px] text-[#86868b]">{owner.email}</div>
                      </td>

                      {/* Tienda */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-white">
                          <Store className="w-3.5 h-3.5 text-[#2997ff]" />
                          <span>{owner.storeName}</span>
                        </div>
                      </td>

                      {/* Sucursales */}
                      <td className="py-3 px-4">
                        <div className="font-mono text-white font-medium">
                          {owner.branchCount} {owner.branchCount === 1 ? t('owners_branches_label', 'sucursal') : t('owners_branches_plural', 'sucursales')}
                        </div>
                        {owner.branchIds && owner.branchIds.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1 max-w-[200px]">
                            {owner.branchIds.map((bId) => {
                              const bName = branches.find((b) => b.id === bId)?.name || bId;
                              return (
                                <span
                                  key={bId}
                                  className="text-[9px] px-1.5 py-0.5 rounded bg-[#2997ff]/10 text-[#2997ff] border border-[#2997ff]/20 truncate"
                                  title={bName}
                                >
                                  {bName}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            owner.status === 'active'
                              ? 'bg-[#30d158]/15 text-[#30d158]'
                              : 'bg-[#ff453a]/15 text-[#ff453a]'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              owner.status === 'active' ? 'bg-[#30d158]' : 'bg-[#ff453a]'
                            }`}
                          />
                          {owner.status === 'active' ? t('owners_status_active', 'Activo') : t('owners_status_suspended', 'Suspendido')}
                        </span>
                        {owner.invitationStatus === 'pending' && (
                          <span className="ml-1 text-[9px] text-[#ffd60a] bg-[#ffd60a]/10 px-1.5 py-0.5 rounded-full">
                            {t('owners_status_pending', '7d Pendiente')}
                          </span>
                        )}
                      </td>

                      {/* Fecha */}
                      <td className="py-3 px-4 text-[#86868b] text-[11px]">
                        {new Date(owner.createdAt).toLocaleDateString('es-NI', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          {/* Botón Modo Soporte */}
                          <button
                            onClick={() => handleImpersonate(owner)}
                            className="p-1.5 rounded-lg text-[#2997ff] hover:bg-[#2997ff]/10 transition-colors"
                            title="Modo Soporte (Ver como este dueño)"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Toggle Suspender / Reactivar */}
                          <button
                            onClick={() => handleToggleStatus(owner)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              owner.status === 'active'
                                ? 'text-[#ffd60a] hover:bg-[#ffd60a]/10'
                                : 'text-[#30d158] hover:bg-[#30d158]/10'
                            }`}
                            title={owner.status === 'active' ? 'Suspender dueño' : 'Reactivar dueño'}
                          >
                            <Power className="w-4 h-4" />
                          </button>

                          {/* Botón Eliminar con confirmación */}
                          <button
                            onClick={() => {
                              setOwnerToDelete(owner);
                              setConfirmationInput('');
                            }}
                            className="p-1.5 rounded-lg text-[#ff453a] hover:bg-[#ff453a]/10 transition-colors"
                            title="Eliminar dueño"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Agregar Dueño */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="apple-card max-w-md w-full p-6 bg-[#161617] border border-white/[0.1] rounded-3xl space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#2997ff]/20 text-[#2997ff] flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">{t('owners_modal_title', 'Agregar Nuevo Dueño')}</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#86868b] hover:text-white"
              >
                ✕
              </button>
            </div>

            {creationSuccess && (
              <div className="p-3 bg-[#30d158]/15 border border-[#30d158]/25 text-[#30d158] text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{creationSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAddOwner} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#86868b] mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Roberto Somarriba"
                  className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#86868b] mb-1">
                  Correo Electrónico (Gmail o Corporativo) *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo.dueno@gmail.com"
                  className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff]"
                />
                <span className="text-[10px] text-[#86868b] mt-1 block">
                  Se generará una invitación con vigencia de 7 días.
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#86868b] mb-1">
                  Nombre de la Tienda / Franquicia
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Ej. Sayta Metrocentro"
                  className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-[#86868b]">
                    Contraseña de Acceso al Dashboard *
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[10px] text-[#2997ff] hover:underline flex items-center gap-1 font-medium"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generar Segura</span>
                  </button>
                </div>
                <div className="relative">
                  <Key className="w-3.5 h-3.5 text-[#86868b] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres para entrar al dashboard"
                    className="w-full pl-9 pr-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff]"
                  />
                </div>
                <span className="text-[10px] text-[#86868b] mt-1 block">
                  El dueño podrá ingresar a su dashboard con este correo y esta contraseña.
                </span>
              </div>

              {/* ASIGNACIÓN DE SUCURSALES EXISTENTES */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-[#86868b]">
                    Asignar Sucursales para Gestión
                  </label>
                  <span className="text-[10px] text-[#2997ff]">
                    {selectedBranchIds.length} seleccionada(s)
                  </span>
                </div>
                {branches.length === 0 ? (
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-[11px] text-[#86868b]">
                    No hay sucursales registradas aún. Podrás crear una sucursal posteriormente y asignarla a este dueño.
                  </div>
                ) : (
                  <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-black/40 border border-white/[0.08] rounded-xl custom-scrollbar">
                    {branches.map((branch) => {
                      const isSelected = selectedBranchIds.includes(branch.id);
                      return (
                        <label
                          key={branch.id}
                          className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                            isSelected
                              ? 'bg-[#2997ff]/15 border border-[#2997ff]/30 text-white'
                              : 'bg-white/[0.02] border border-transparent text-[#86868b] hover:bg-white/[0.05] hover:text-white'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedBranchIds((prev) => [...prev, branch.id]);
                              } else {
                                setSelectedBranchIds((prev) => prev.filter((id) => id !== branch.id));
                              }
                            }}
                            className="w-3.5 h-3.5 rounded border-white/20 text-[#2997ff] focus:ring-0 bg-transparent"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold truncate">{branch.name}</div>
                            {branch.address && (
                              <div className="text-[10px] text-[#86868b] truncate">{branch.address}</div>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#86868b] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="apple-pill-btn apple-btn-primary px-5 py-2 text-xs font-semibold disabled:opacity-50"
                >
                  {creating ? 'Guardando...' : 'Crear Dueño'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Eliminar Dueño (Confirmación en 2 pasos) */}
      {ownerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="apple-card max-w-md w-full p-6 bg-[#161617] border border-[#ff453a]/30 rounded-3xl space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-[#ff453a]">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Eliminar Dueño de Tienda</h3>
            </div>

            <p className="text-xs text-[#86868b] leading-relaxed">
              Esta acción es irreversible. Se revocarán todos los tokens de autenticación en Firebase Auth y se eliminarán sus permisos sobre la tienda{' '}
              <strong className="text-white">{ownerToDelete.storeName}</strong>.
            </p>

            <div className="p-3 bg-black/50 border border-white/10 rounded-xl space-y-1.5">
              <label className="block text-[11px] font-medium text-white">
                Para confirmar, escribe exactamente el nombre de la tienda:{' '}
                <span className="text-[#ffd60a] font-mono">{ownerToDelete.storeName}</span>
              </label>
              <input
                type="text"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder={ownerToDelete.storeName}
                className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-[#ff453a]"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setOwnerToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs text-[#86868b] hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={confirmationInput.trim() !== ownerToDelete.storeName.trim() || deleting}
                onClick={handleDeleteOwner}
                className="px-4 py-2 rounded-xl bg-[#ff453a] hover:bg-[#d70015] text-white font-semibold text-xs disabled:opacity-40 transition-colors"
              >
                {deleting ? 'Eliminando...' : 'Confirmar y Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
