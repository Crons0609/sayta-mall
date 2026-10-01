// src/components/orders/MissingItemsModal.tsx
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useDashboardPreferences } from '@/providers/DashboardPreferencesProvider';
import { getAuthToken } from '@/lib/firebase/client';
import type { MissingItemRecord } from '@/types/message.types';
import {
  AlertTriangle,
  X,
  Plus,
  Trash2,
  Package,
  MessageSquare,
  Loader2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface Props {
  orderId: string;
  orderNumber: string;
  customerName: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    productImage?: string;
  }>;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (conversationId: string) => void;
}

export function MissingItemsModal({
  orderId,
  orderNumber,
  customerName,
  items,
  isOpen,
  onClose,
  onSuccess,
}: Props) {
  const { user } = useAuth();
  const { t } = useDashboardPreferences();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Lista de faltantes a reportar
  const [missingList, setMissingList] = useState<MissingItemRecord[]>([
    {
      productId: items[0]?.productId || '',
      productName: items[0]?.productName || '',
      cantidadFaltante: 1,
      cantidadOriginal: items[0]?.quantity || 1,
      precioUnitario: items[0]?.unitPrice || 0,
      motivo: 'agotado',
      sustitutoSugerido: undefined,
    },
  ]);

  // Modal para ingresar sustituto
  const [substituteInputs, setSubstituteInputs] = useState<
    Record<number, { name: string; price: string }>
  >({});

  if (!isOpen) return null;

  const handleItemSelect = (index: number, prodId: string) => {
    const it = items.find((i) => i.productId === prodId);
    if (!it) return;
    setMissingList((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        productId: it.productId,
        productName: it.productName,
        cantidadOriginal: it.quantity,
        cantidadFaltante: Math.min(copy[index].cantidadFaltante, it.quantity),
        precioUnitario: it.unitPrice,
      };
      return copy;
    });
  };

  const handleAddMissingItem = () => {
    const unusedItem = items.find((it) => !missingList.some((m) => m.productId === it.productId)) || items[0];
    if (!unusedItem) return;
    setMissingList((prev) => [
      ...prev,
      {
        productId: unusedItem.productId,
        productName: unusedItem.productName,
        cantidadFaltante: 1,
        cantidadOriginal: unusedItem.quantity,
        precioUnitario: unusedItem.unitPrice,
        motivo: 'agotado',
      },
    ]);
  };

  const handleRemoveMissingItem = (index: number) => {
    if (missingList.length === 1) return;
    setMissingList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones
    for (const m of missingList) {
      if (m.cantidadFaltante <= 0 || m.cantidadFaltante > m.cantidadOriginal) {
        setError(`Cantidad faltante de "${m.productName}" debe ser entre 1 y ${m.cantidadOriginal}`);
        return;
      }
    }

    setLoading(true);
    try {
      const idToken = await getAuthToken();
      const payloadFaltantes = missingList.map((m, idx) => {
        const sub = substituteInputs[idx];
        return {
          ...m,
          sustitutoSugerido: sub?.name?.trim()
            ? {
                productId: `subst-${Date.now()}-${idx}`,
                name: sub.name.trim(),
                price: parseFloat(sub.price) || m.precioUnitario,
              }
            : undefined,
        };
      });

      const res = await fetch(`/api/orders/${orderId}/missing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ faltantes: payloadFaltantes }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Error al reportar faltante');

      onSuccess(data.conversationId);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
      <div className="w-full max-w-xl bg-[#141518] border border-white/[0.12] rounded-3xl p-6 shadow-2xl text-white space-y-5 my-8">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {t('missing_modal_title', 'Reportar Producto No Disponible')}
              </h3>
              <p className="text-xs text-[#86868b]">
                Orden #{orderNumber} • Cliente: <span className="text-white">{customerName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#86868b] hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-[#86868b] leading-relaxed">
            {t('missing_modal_desc', 'Al marcar productos no disponibles, el pedido pasará a En espera del cliente y se bloqueará para el delivery. Se creará un chat en vivo con opciones de decisión.')}
          </p>

          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            {missingList.map((m, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                    Producto #{idx + 1}
                  </span>
                  {missingList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMissingItem(idx)}
                      className="text-red-400 hover:text-red-300 p-1"
                      title="Quitar de la lista de faltantes"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Selección de producto del pedido */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#86868b] mb-1">
                    Seleccionar Producto del Pedido
                  </label>
                  <select
                    value={m.productId}
                    onChange={(e) => handleItemSelect(idx, e.target.value)}
                    className="w-full px-3 py-2 bg-[#1c1c1e] border border-white/[0.1] rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 transition-colors"
                  >
                    {items.map((it) => (
                      <option key={it.productId} value={it.productId}>
                        {it.productName} ({it.quantity} unidades • C$ {it.unitPrice})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Cantidad faltante */}
                  <div>
                    <label className="block text-[11px] font-semibold text-[#86868b] mb-1">
                      Cantidad Faltante (de {m.cantidadOriginal})
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={m.cantidadOriginal}
                      value={m.cantidadFaltante}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setMissingList((prev) => {
                          const copy = [...prev];
                          copy[idx].cantidadFaltante = val;
                          return copy;
                        });
                      }}
                      className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.1] rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>

                  {/* Motivo */}
                  <div>
                    <label className="block text-[11px] font-semibold text-[#86868b] mb-1">
                      Motivo
                    </label>
                    <select
                      value={m.motivo}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setMissingList((prev) => {
                          const copy = [...prev];
                          copy[idx].motivo = val;
                          return copy;
                        });
                      }}
                      className="w-full px-3 py-2 bg-[#1c1c1e] border border-white/[0.1] rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 transition-colors"
                    >
                      <option value="agotado">{t('missing_opt_out_of_stock', 'Agotado en sucursal')}</option>
                      <option value="dañado">{t('missing_opt_damaged', 'Unidad dañada o vencida')}</option>
                      <option value="error_inventario">{t('missing_opt_inventory_diff', 'Diferencia de inventario')}</option>
                    </select>
                  </div>
                </div>

                {/* Producto sustituto sugerido (opcional) */}
                <div className="pt-2 border-t border-white/[0.06]">
                  <span className="text-[10px] font-semibold text-[#86868b] uppercase tracking-wider block mb-1">
                    {t('missing_suggest_title', 'Sugerir alternativa (Opcional)')}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder={t('missing_substitute_name', 'Nombre del producto sustituto')}
                      value={substituteInputs[idx]?.name || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSubstituteInputs((prev) => ({
                          ...prev,
                          [idx]: { ...(prev[idx] || { price: '' }), name: val },
                        }));
                      }}
                      className="sm:col-span-2 px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs text-white placeholder-[#6e6e73] focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder={t('missing_substitute_price', 'Precio sugerido')}
                      value={substituteInputs[idx]?.price || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSubstituteInputs((prev) => ({
                          ...prev,
                          [idx]: { ...(prev[idx] || { name: '' }), price: val },
                        }));
                      }}
                      className="px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs text-white placeholder-[#6e6e73] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {missingList.length < items.length && (
            <button
              type="button"
              onClick={handleAddMissingItem}
              className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-[#2997ff] flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('missing_btn_add_another', 'Agregar otro producto faltante')}</span>
            </button>
          )}

          {/* Botones de acción */}
          <div className="pt-4 border-t border-white/[0.08] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-white transition-colors"
            >
              {t('btn_close', 'Cancelar')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <MessageSquare className="w-4 h-4" />
                  <span>{t('missing_btn_notify', 'Pausar y Notificar al Cliente')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
