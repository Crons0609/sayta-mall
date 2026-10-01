// src/components/dashboard/AuditLogPanel.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useDashboardPreferences } from '@/providers/DashboardPreferencesProvider';
import { readRtdb } from '@/lib/firebase/rtdb';
import {
  ShieldAlert,
  RefreshCw,
  Search,
  Filter,
  Package,
  Edit2,
  Trash2,
  RotateCcw,
  Percent,
  Plus,
  Clock,
  User,
  ChevronDown,
  X,
} from 'lucide-react';

interface AuditEntry {
  action: string;
  productId?: string;
  productName?: string;
  sku?: string;
  price?: number;
  discountPercent?: number;
  by: string;
  byName?: string;
  role?: string;
  timestamp: string;
  precioAnterior?: number;
  precioNuevo?: number;
}

const ACTION_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  create_product: {
    label: 'Producto creado',
    icon: <Plus className="w-3.5 h-3.5" />,
    color: 'text-[#30d158] bg-[#30d158]/10 border-[#30d158]/20',
  },
  edit_product: {
    label: 'Producto editado',
    icon: <Edit2 className="w-3.5 h-3.5" />,
    color: 'text-[#2997ff] bg-[#2997ff]/10 border-[#2997ff]/20',
  },
  delete_product: {
    label: 'Producto eliminado',
    icon: <Trash2 className="w-3.5 h-3.5" />,
    color: 'text-[#ff453a] bg-[#ff453a]/10 border-[#ff453a]/20',
  },
  restore_price: {
    label: 'Precio restaurado',
    icon: <RotateCcw className="w-3.5 h-3.5" />,
    color: 'text-[#ffd60a] bg-[#ffd60a]/10 border-[#ffd60a]/20',
  },
  auto_discount: {
    label: 'Descuento automático',
    icon: <Percent className="w-3.5 h-3.5" />,
    color: 'text-[#ff9f0a] bg-[#ff9f0a]/10 border-[#ff9f0a]/20',
  },
};

function formatCurrency(value?: number) {
  if (value === undefined || value === null) return '—';
  return `C$ ${value.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function timeAgo(timestamp: string) {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'hace un momento';
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return new Date(timestamp).toLocaleDateString('es-NI');
}

export function AuditLogPanel() {
  const { t } = useDashboardPreferences();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const loadLogs = useCallback(async () => {
    setLoading(true);
    const allLogs: AuditEntry[] = [];

    // 1. Cargar desde RTDB
    try {
      const rtdbData = await readRtdb<Record<string, AuditEntry>>('audit_logs');
      if (rtdbData) {
        Object.values(rtdbData).forEach((entry) => allLogs.push(entry));
      }
    } catch {}

    // 2. Combinar con localStorage
    try {
      const localData: AuditEntry[] = JSON.parse(localStorage.getItem('sayta_audit_logs') || '[]');
      localData.forEach((entry) => {
        // Evitar duplicados por timestamp+action
        if (!allLogs.some((l) => l.timestamp === entry.timestamp && l.action === entry.action)) {
          allLogs.push(entry);
        }
      });
    } catch {}

    // Ordenar más recientes primero
    allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setLogs(allLogs);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadLogs();
    // Escuchar cambios de productos
    const handleUpdate = () => loadLogs();
    window.addEventListener('sayta_products_updated', handleUpdate);
    return () => window.removeEventListener('sayta_products_updated', handleUpdate);
  }, [loadLogs]);

  const filtered = logs.filter((log) => {
    const matchesSearch =
      !searchQuery ||
      log.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.byName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.by?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#ff9f0a]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#ff9f0a]">
              Registro de Auditoría
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mt-0.5">{t('audit_mgr_title', 'Actividad de Empleados')}</h2>
          <p className="text-xs text-[#86868b] mt-0.5">
            {t('audit_mgr_sub', 'Todas las acciones sobre productos: crear, editar, eliminar, descuentos y restauraciones.')}
          </p>
        </div>
        <button
          onClick={loadLogs}
          disabled={loading}
          className="shrink-0 px-4 py-2 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-semibold text-white flex items-center gap-2 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#2997ff]' : 'text-[#86868b]'}`} />
          {t('users_reg_btn_refresh', 'Actualizar')}
        </button>
      </div>

      {/* Contadores rápidos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Creaciones', key: 'create_product', color: '#30d158' },
          { label: 'Ediciones', key: 'edit_product', color: '#2997ff' },
          { label: 'Eliminaciones', key: 'delete_product', color: '#ff453a' },
          { label: 'Descuentos Auto', key: 'auto_discount', color: '#ff9f0a' },
        ].map(({ label, key, color }) => (
          <button
            key={key}
            onClick={() => setActionFilter(actionFilter === key ? 'all' : key)}
            className={`p-3 rounded-2xl border text-left transition-all ${
              actionFilter === key
                ? 'bg-white/[0.08] border-white/[0.2]'
                : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.1]'
            }`}
          >
            <div className="text-lg font-bold text-white">
              {logs.filter((l) => l.action === key).length}
            </div>
            <div className="text-[11px] mt-0.5" style={{ color }}>{label}</div>
          </button>
        ))}
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('audit_mgr_search_ph', 'Buscar por producto, empleado o SKU...')}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/[0.1] text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff]"
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
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(0); }}
          className="bg-black/40 border border-white/[0.1] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#2997ff]"
        >
          <option value="all">{t('audit_mgr_filter_all', 'Todas las acciones')}</option>
          <option value="create_product">Solo creaciones</option>
          <option value="edit_product">Solo ediciones</option>
          <option value="delete_product">Solo eliminaciones</option>
          <option value="restore_price">Restauraciones de precio</option>
        </select>
      </div>

      {/* Lista de logs */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-white/[0.02] border border-white/[0.06] animate-pulse" />
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <div className="p-12 text-center apple-card rounded-3xl border-white/[0.06]">
          <ShieldAlert className="w-8 h-8 text-[#86868b] mx-auto mb-3" />
          <p className="text-sm font-semibold text-white">{t('audit_mgr_empty', 'Sin registros de auditoría')}</p>
          <p className="text-xs text-[#86868b] mt-1">
            Las acciones de los empleados aparecerán aquí automáticamente.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {paginated.map((log, i) => {
            const meta = ACTION_META[log.action] || {
              label: log.action,
              icon: <Clock className="w-3.5 h-3.5" />,
              color: 'text-[#86868b] bg-white/[0.04] border-white/[0.08]',
            };
            return (
              <div
                key={`${log.timestamp}-${i}`}
                className="p-3 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.1] transition-all flex items-start gap-3"
              >
                {/* Ícono de acción */}
                <div className={`shrink-0 w-8 h-8 rounded-xl border flex items-center justify-center mt-0.5 ${meta.color}`}>
                  {meta.icon}
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.color}`}>
                      {meta.label}
                    </span>
                    {log.role && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-[#86868b]">
                        {log.role === 'employee' ? t('role_employee', 'Empleado') : log.role === 'owner' ? t('role_owner', 'Dueño') : t('role_programmer', 'Programador')}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-white font-medium truncate">
                    {log.productName || log.productId || 'Acción del sistema'}
                    {log.sku && <span className="ml-1.5 font-mono text-[#86868b] text-[10px]">#{log.sku}</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-[#86868b]">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {log.byName || log.by}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo(log.timestamp)}
                    </span>
                    {log.precioAnterior !== undefined && log.precioNuevo !== undefined && (
                      <span className="flex items-center gap-1 text-[10px]">
                        <span className="line-through text-[#86868b]">{formatCurrency(log.precioAnterior)}</span>
                        <span className="text-white">→</span>
                        <span className="text-[#30d158] font-mono font-semibold">{formatCurrency(log.precioNuevo)}</span>
                        {log.discountPercent && (
                          <span className="ml-1 font-bold text-[#ff3b30]">-{log.discountPercent}%</span>
                        )}
                      </span>
                    )}
                    {log.price !== undefined && !log.precioAnterior && (
                      <span className="font-mono text-[10px] text-white">
                        C$ {log.price.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Timestamp completo */}
                <div className="shrink-0 text-[10px] text-[#6e6e73] hidden sm:block whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString('es-NI', { dateStyle: 'short', timeStyle: 'short' })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs text-white disabled:opacity-40 transition-all"
          >
            ← Anterior
          </button>
          <span className="text-xs text-[#86868b]">
            Pág. {page + 1} / {totalPages} · {filtered.length} registros
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs text-white disabled:opacity-40 transition-all"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
