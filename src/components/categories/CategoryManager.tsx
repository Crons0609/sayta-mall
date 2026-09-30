// src/components/categories/CategoryManager.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Edit3,
  Trash2,
  X,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Lock,
  Sparkles,
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  badge?: string;
  isCustom: boolean;
  createdAt: string;
}

export function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📦');
  const [description, setDescription] = useState('');
  const [badge, setBadge] = useState('');

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editBadge, setEditBadge] = useState('');

  // Status
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(null), 4000); };
  const showError = (msg: string) => { setErrorMsg(msg); setTimeout(() => setErrorMsg(null), 5000); };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success) setCategories(data.categories);
    } catch (e) {
      console.error('Error fetching categories:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { showError('El nombre es obligatorio.'); return; }
    try {
      setSaving(true);
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, icon, description, badge: badge || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess('Categoría creada exitosamente.');
        setName(''); setIcon('📦'); setDescription(''); setBadge('');
        setShowForm(false);
        fetchCategories();
      } else {
        showError(data.error || 'Error al crear categoría.');
      }
    } catch (err: any) {
      showError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditIcon(cat.icon);
    setEditDescription(cat.description);
    setEditBadge(cat.badge || '');
  };

  const handleSaveEdit = async (id: string) => {
    try {
      setSaving(true);
      const res = await fetch('/api/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: editName, icon: editIcon, description: editDescription, badge: editBadge || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess('Categoría actualizada.');
        setEditingId(null);
        fetchCategories();
      } else {
        showError(data.error || 'Error al actualizar.');
      }
    } catch (err: any) {
      showError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeleting(id);
      const res = await fetch(`/api/categories?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showSuccess('Categoría eliminada.');
        setDeleteConfirmId(null);
        fetchCategories();
      } else {
        showError(data.error || 'Error al eliminar.');
      }
    } catch (err: any) {
      showError(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const customCategories = categories.filter((c) => c.isCustom);
  const baseCategories = categories.filter((c) => !c.isCustom);

  const COMMON_ICONS = ['📦', '🛒', '🎁', '🍕', '🥤', '🧴', '🎮', '💊', '🔑', '🌿', '🎨', '📱', '🧩', '⚙️', '🧹', '🪴', '🍰', '🎵', '🧲', '🔒'];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#ffd60a]" />
            <span>Gestión de Categorías</span>
          </h2>
          <p className="text-xs text-[#86868b] mt-1">
            Crea categorías personalizadas para organizar tus productos. Las categorías del sistema son de solo lectura.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchCategories}
            className="p-2.5 rounded-xl text-[#86868b] hover:text-white bg-white/[0.05] border border-white/[0.08] transition-colors"
            title="Recargar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="apple-pill-btn apple-btn-primary px-4 py-2.5 text-xs font-semibold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>{showForm ? 'Cancelar' : 'Nueva Categoría'}</span>
          </button>
        </div>
      </div>

      {/* Alertas */}
      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-[#30d158]/10 border border-[#30d158]/30 text-xs text-[#30d158] flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" /><span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /><span>{errorMsg}</span>
        </div>
      )}

      {/* Formulario de nueva categoría */}
      {showForm && (
        <form onSubmit={handleCreate} className="apple-card p-5 sm:p-6 space-y-4 border-[#ffd60a]/20 animate-fade-in">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#ffd60a]" />
            Crear Categoría Personalizada
          </h3>

          {/* Selector de emoji */}
          <div className="space-y-2">
            <label className="text-[11px] font-medium text-[#86868b]">Icono (Emoji)</label>
            <div className="flex flex-wrap gap-2">
              {COMMON_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all border ${
                    icon === emoji
                      ? 'bg-[#ffd60a]/20 border-[#ffd60a]/60 scale-110'
                      : 'bg-white/[0.05] border-white/[0.08] hover:bg-white/[0.1]'
                  }`}
                >
                  {emoji}
                </button>
              ))}
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="🔖"
                maxLength={4}
                className="w-20 px-2 py-1.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-xs text-white text-center focus:outline-none focus:border-[#ffd60a]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[#86868b]">Nombre *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Artículos de Oficina"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#ffd60a]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[#86868b]">Etiqueta (Opcional)</label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="Ej. Nuevo, Popular, Oferta"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#ffd60a]"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[11px] font-medium text-[#86868b]">Descripción</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve descripción de qué productos incluye esta categoría"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#ffd60a]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-xs font-medium text-[#86868b] hover:text-white transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="apple-pill-btn apple-btn-primary px-6 py-2.5 text-xs font-semibold flex items-center gap-2 disabled:opacity-50">
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Guardando...' : 'Crear Categoría'}
            </button>
          </div>
        </form>
      )}

      {/* Mis Categorías Personalizadas */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-white">Mis Categorías</h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ffd60a]/15 text-[#ffd60a] font-semibold">
            {customCategories.length} personalizadas
          </span>
        </div>

        {customCategories.length === 0 ? (
          <div className="apple-card p-8 text-center space-y-2">
            <div className="text-3xl">📂</div>
            <p className="text-xs text-[#86868b]">Aún no has creado categorías personalizadas.</p>
            <button onClick={() => setShowForm(true)} className="text-xs text-[#ffd60a] hover:underline">
              Crear primera categoría →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {customCategories.map((cat) => (
              <div key={cat.id} className="apple-card p-4 space-y-3 border-[#ffd60a]/15">
                {editingId === cat.id ? (
                  // Modo edición
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {COMMON_ICONS.slice(0, 10).map((emoji) => (
                        <button key={emoji} type="button" onClick={() => setEditIcon(emoji)}
                          className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all border ${editIcon === emoji ? 'bg-[#ffd60a]/20 border-[#ffd60a]/60' : 'bg-white/[0.05] border-white/[0.08]'}`}
                        >{emoji}</button>
                      ))}
                    </div>
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.1] text-xs text-white focus:outline-none focus:border-[#ffd60a]" />
                    <input type="text" value={editDescription} onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Descripción" className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.1] text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#ffd60a]" />
                    <input type="text" value={editBadge} onChange={(e) => setEditBadge(e.target.value)}
                      placeholder="Etiqueta (opcional)" className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.1] text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#ffd60a]" />
                    <div className="flex gap-2">
                      <button onClick={() => setEditingId(null)} className="flex-1 py-2 rounded-xl text-xs text-[#86868b] bg-white/[0.05] hover:bg-white/[0.1]">Cancelar</button>
                      <button onClick={() => handleSaveEdit(cat.id)} disabled={saving} className="flex-1 py-2 rounded-xl text-xs font-semibold bg-[#ffd60a]/20 text-[#ffd60a] hover:bg-[#ffd60a]/30 disabled:opacity-50">
                        {saving ? 'Guardando...' : 'Guardar'}
                      </button>
                    </div>
                  </div>
                ) : (
                  // Vista normal
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{cat.icon}</span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">{cat.name}</span>
                            {cat.badge && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#ffd60a]/20 text-[#ffd60a] font-semibold">{cat.badge}</span>
                            )}
                          </div>
                          {cat.description && <p className="text-[10px] text-[#86868b] mt-0.5">{cat.description}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button onClick={() => startEdit(cat)}
                          className="p-1.5 rounded-lg bg-[#2997ff]/10 text-[#2997ff] hover:bg-[#2997ff]/20 transition-colors">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteConfirmId(cat.id)}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <span className="text-[9px] text-[#6e6e73]">Personalizada · Creada {new Date(cat.createdAt).toLocaleDateString('es-NI')}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Categorías del Sistema (solo lectura) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-[#86868b]">Categorías del Sistema</h3>
          <Lock className="w-3 h-3 text-[#6e6e73]" />
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-[#6e6e73]">Solo lectura</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {baseCategories.map((cat) => (
            <div key={cat.id} className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center gap-2.5 opacity-70">
              <span className="text-xl">{cat.icon}</span>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-[#86868b] truncate">{cat.name}</p>
                {cat.badge && <span className="text-[9px] text-[#6e6e73]">{cat.badge}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de confirmación de eliminación */}
      {deleteConfirmId && (() => {
        const cat = categories.find((c) => c.id === deleteConfirmId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="apple-card p-6 max-w-sm w-full space-y-4 border-red-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-500/15 flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Eliminar Categoría</h3>
                    <p className="text-[11px] text-[#86868b]">Esta acción es permanente</p>
                  </div>
                </div>
                <button onClick={() => setDeleteConfirmId(null)} className="text-[#86868b] hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-[#86868b]">
                ¿Eliminar la categoría{' '}
                <span className="text-white font-semibold">{cat?.icon} {cat?.name}</span>?
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-medium text-[#86868b] bg-white/[0.06] hover:bg-white/[0.1]">
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirmId)}
                  disabled={deleting === deleteConfirmId}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 disabled:opacity-50"
                >
                  {deleting === deleteConfirmId ? 'Eliminando...' : 'Sí, Eliminar'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
