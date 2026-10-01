// src/components/branch/BranchManager.tsx
'use client';

import React, { useState } from 'react';
import {
  Store,
  MapPin,
  Phone,
  Clock,
  Edit3,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Save,
  Building2,
  Coins,
  Truck,
  Users,
} from 'lucide-react';
import { useBranch } from '@/providers/BranchProvider';
import { useDashboardPreferences } from '@/providers/DashboardPreferencesProvider';

interface BranchManagerProps {
  onBranchDeleted?: () => void;
  onBranchUpdated?: () => void;
}

interface BranchEditState {
  name: string;
  address: string;
  city: string;
  phone: string;
  whatsapp: string;
  schedule: string;
  currency: string;
  deliveryType: 'both' | 'pickup' | 'delivery';
  ownerId: string;
}

export function BranchManager({ onBranchDeleted, onBranchUpdated }: BranchManagerProps) {
  const { t } = useDashboardPreferences();
  const { branches } = useBranch();
  const [owners, setOwners] = useState<Array<{ id: string; name: string; storeName: string; email?: string }>>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<BranchEditState>({
    name: '',
    address: '',
    city: '',
    phone: '',
    whatsapp: '',
    schedule: '',
    currency: 'NIO',
    deliveryType: 'both',
    ownerId: '',
  });

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    fetch('/api/owners')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.owners)) {
          setOwners(data.owners);
        }
      })
      .catch(() => {});
  }, []);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };
  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 5000);
  };

  const startEdit = (branch: any) => {
    setEditingId(branch.id);
    const scheduleStr =
      typeof branch.schedule === 'object'
        ? branch.schedule?.general || ''
        : branch.schedule || '';
    setEditForm({
      name: branch.name || '',
      address: branch.address || '',
      city: branch.city || '',
      phone: branch.phone || '',
      whatsapp: branch.whatsapp || '',
      schedule: scheduleStr,
      currency: branch.currency || 'NIO',
      deliveryType:
        branch.pickupEnabled && branch.deliveryEnabled
          ? 'both'
          : branch.pickupEnabled
          ? 'pickup'
          : 'delivery',
      ownerId: branch.ownerId || branch.ownerIds?.[0] || '',
    });
  };

  const handleSaveEdit = async (branchId: string) => {
    if (!editForm.name.trim() || !editForm.address.trim()) {
      showError('El nombre y la dirección son obligatorios.');
      return;
    }
    try {
      setSaving(true);
      const selectedOwner = owners.find((o) => o.id === editForm.ownerId);
      const payload = {
        id: branchId,
        name: editForm.name.trim(),
        address: editForm.address.trim(),
        city: editForm.city.trim(),
        phone: editForm.phone.trim(),
        whatsapp: editForm.whatsapp.trim(),
        schedule: { general: editForm.schedule },
        currency: editForm.currency,
        currencySymbol: editForm.currency === 'NIO' ? 'C$' : '$',
        pickupEnabled: editForm.deliveryType === 'pickup' || editForm.deliveryType === 'both',
        deliveryEnabled: editForm.deliveryType === 'delivery' || editForm.deliveryType === 'both',
        slug: editForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        ownerId: editForm.ownerId || undefined,
        ownerIds: editForm.ownerId ? [editForm.ownerId] : [],
        ownerName: selectedOwner?.name || '',
      };

      const res = await fetch('/api/branches', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        showSuccess('Sucursal actualizada exitosamente en Firebase.');
        setEditingId(null);
        // Recargar la página para reflejar cambios
        window.location.reload();
        onBranchUpdated?.();
      } else {
        showError(data.error || 'Error al actualizar la sucursal.');
      }
    } catch (err: any) {
      showError(err.message || 'Error de conexión.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (branchId: string) => {
    try {
      setDeleting(true);
      const res = await fetch(`/api/branches?id=${encodeURIComponent(branchId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        showSuccess('Sucursal eliminada exitosamente.');
        setDeleteConfirmId(null);
        window.location.reload();
        onBranchDeleted?.();
      } else {
        showError(data.error || 'Error al eliminar la sucursal.');
      }
    } catch (err: any) {
      showError(err.message || 'Error de conexión.');
    } finally {
      setDeleting(false);
    }
  };

  if (!branches || branches.length === 0) {
    return (
      <div className="apple-card p-8 text-center text-xs text-[#86868b]">
        {t('branch_mgr_empty_title', 'No hay sucursales registradas.')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Alertas */}
      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-[#30d158]/10 border border-[#30d158]/30 text-xs text-[#30d158] flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Lista de sucursales */}
      {branches.map((branch: any) => (
        <div key={branch.id} className="apple-card overflow-hidden">
          {/* Cabecera de la sucursal */}
          <div className="p-4 sm:p-5 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#30d158]/10 border border-[#30d158]/20 flex items-center justify-center flex-shrink-0">
                <Store className="w-5 h-5 text-[#30d158]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white truncate">{branch.name}</h3>
                <p className="text-[11px] text-[#86868b] flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">
                    {branch.address}, {branch.city}
                  </span>
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {branch.phone && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-[#86868b] flex items-center gap-1">
                      <Phone className="w-2.5 h-2.5" /> {branch.phone}
                    </span>
                  )}
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2997ff]/10 text-[#2997ff] font-medium flex items-center gap-1">
                    <Coins className="w-2.5 h-2.5" /> {branch.currency || 'NIO'}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#30d158]/10 text-[#30d158] font-medium flex items-center gap-1">
                    <Truck className="w-2.5 h-2.5" />
                    {branch.pickupEnabled && branch.deliveryEnabled
                      ? 'Pickup & Delivery'
                      : branch.pickupEnabled
                      ? 'Pickup'
                      : 'Delivery'}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#30d158]/15 text-[#30d158]">
                    ● {t('status_on_duty', 'Activa')}
                  </span>
                  {(branch.ownerName || branch.ownerId) && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2997ff]/10 text-[#2997ff] flex items-center gap-1 font-medium">
                      <Users className="w-2.5 h-2.5" />
                      {owners.find((o) => o.id === branch.ownerId)?.name || branch.ownerName || 'Dueño asignado'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Botones acción */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() =>
                  editingId === branch.id ? setEditingId(null) : startEdit(branch)
                }
                className="px-3 py-1.5 rounded-xl text-[11px] font-medium bg-[#2997ff]/10 text-[#2997ff] hover:bg-[#2997ff]/20 flex items-center gap-1.5 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                {editingId === branch.id ? t('emp_mgr_form_cancel', 'Cancelar') : t('branch_mgr_btn_edit', 'Editar')}
              </button>
              <button
                onClick={() => setDeleteConfirmId(branch.id)}
                className="px-3 py-1.5 rounded-xl text-[11px] font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t('branch_mgr_btn_delete', 'Eliminar')}
              </button>
            </div>
          </div>

          {/* Formulario de Edición (expandible) */}
          {editingId === branch.id && (
            <div className="border-t border-white/[0.08] p-4 sm:p-5 space-y-4 bg-white/[0.02] animate-fade-in">
              <h4 className="text-xs font-semibold text-[#f5f5f7] flex items-center gap-2">
                <Edit3 className="w-3.5 h-3.5 text-[#2997ff]" />
                {t('branch_mgr_btn_edit', 'Editar datos de la sucursal')}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Nombre */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#86868b] flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> {t('branch_mgr_field_name', 'Nombre')} *
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.1] text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff]"
                    placeholder="Ej. Sayta Mall Centro"
                  />
                </div>

                {/* Ciudad */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#86868b] flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {t('branch_mgr_field_city', 'Ciudad')}
                  </label>
                  <input
                    type="text"
                    value={editForm.city}
                    onChange={(e) => setEditForm((p) => ({ ...p, city: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.1] text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff]"
                    placeholder="Ej. Chichigalpa"
                  />
                </div>

                {/* Dirección */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-medium text-[#86868b] flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Dirección *
                  </label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.1] text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff]"
                    placeholder="Ej. De la Alcaldía 3 cuadras al norte"
                  />
                </div>

                {/* Teléfono */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#86868b] flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {t('branch_mgr_field_phone', 'Teléfono')}
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.1] text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff]"
                    placeholder="+505 2222-0000"
                  />
                </div>

                {/* WhatsApp */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#86868b] flex items-center gap-1">
                    <Phone className="w-3 h-3" /> WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={editForm.whatsapp}
                    onChange={(e) => setEditForm((p) => ({ ...p, whatsapp: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.1] text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff]"
                    placeholder="+505 8888-0000"
                  />
                </div>

                {/* Horario */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-medium text-[#86868b] flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Horario de Atención
                  </label>
                  <input
                    type="text"
                    value={editForm.schedule}
                    onChange={(e) => setEditForm((p) => ({ ...p, schedule: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.1] text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff]"
                    placeholder="Ej. Lunes a Sábado: 8:00 AM - 6:00 PM"
                  />
                </div>

                {/* Moneda */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#86868b] flex items-center gap-1">
                    <Coins className="w-3 h-3" /> Moneda
                  </label>
                  <select
                    value={editForm.currency}
                    onChange={(e) => setEditForm((p) => ({ ...p, currency: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-[#1c1c1e] border border-white/[0.1] text-xs text-white focus:outline-none focus:border-[#2997ff]"
                  >
                    <option value="NIO">Córdoba (C$)</option>
                    <option value="USD">Dólar ($)</option>
                  </select>
                </div>

                {/* Tipo de Despacho */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#86868b] flex items-center gap-1">
                    <Truck className="w-3 h-3" /> Tipo de Despacho
                  </label>
                  <select
                    value={editForm.deliveryType}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, deliveryType: e.target.value as any }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#1c1c1e] border border-white/[0.1] text-xs text-white focus:outline-none focus:border-[#2997ff]"
                  >
                    <option value="both">Pickup y Delivery</option>
                    <option value="pickup">Solo Pickup</option>
                    <option value="delivery">Solo Delivery</option>
                  </select>
                </div>

                {/* Dueño o Jefe Asignado */}
                {owners.length > 0 && (
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[11px] font-medium text-[#86868b] flex items-center gap-1">
                      <Users className="w-3 h-3 text-[#2997ff]" /> Dueño / Jefe Encargado
                    </label>
                    <select
                      value={editForm.ownerId}
                      onChange={(e) => setEditForm((p) => ({ ...p, ownerId: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-[#1c1c1e] border border-white/[0.1] text-xs text-white focus:outline-none focus:border-[#2997ff]"
                    >
                      <option value="">-- Sin asignar --</option>
                      {owners.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name} — {o.storeName} ({o.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Botones guardar/cancelar */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/[0.06]">
                <button
                  onClick={() => setEditingId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#86868b] hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleSaveEdit(branch.id)}
                  disabled={saving}
                  className="apple-pill-btn apple-btn-primary px-5 py-2 text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? t('branch_mgr_btn_saving', 'Guardando...') : t('branch_mgr_btn_save', 'Guardar Cambios')}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Modal de Confirmación de Eliminación */}
      {deleteConfirmId &&
        (() => {
          const branch = branches.find((b: any) => b.id === deleteConfirmId);
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
              <div className="apple-card p-6 max-w-sm w-full space-y-4 border-red-500/30 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-red-500/15 flex items-center justify-center">
                      <Trash2 className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Eliminar Sucursal</h3>
                      <p className="text-[11px] text-[#86868b]">Esta acción es permanente</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="text-[#86868b] hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-[#86868b] leading-relaxed">
                  ¿Estás seguro de que deseas eliminar la sucursal{' '}
                  <span className="text-white font-semibold">{branch?.name}</span>? Se
                  eliminarán todos sus datos de Firebase permanentemente.
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-medium text-[#86868b] bg-white/[0.06] hover:bg-white/[0.1] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleDelete(deleteConfirmId)}
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
