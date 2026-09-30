// src/components/products/PriceHistoryModal.tsx
// Modal interactiva para consultar la evolución de precios de un producto.

'use client';

import React, { useState, useEffect } from 'react';
import { PriceHistoryRecord, getProductPriceHistory } from '@/lib/products/pricingEngine';
import { formatCurrency } from '@/lib/utils/currency';
import {
  History,
  TrendingDown,
  TrendingUp,
  Clock,
  User,
  X,
  Tag,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface PriceHistoryModalProps {
  productId: string | null;
  productName: string;
  onClose: () => void;
}

export function PriceHistoryModal({ productId, productName, onClose }: PriceHistoryModalProps) {
  const [history, setHistory] = useState<PriceHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    getProductPriceHistory(productId)
      .then((data) => {
        setHistory(data);
      })
      .catch((e) => console.error('Error cargando historial:', e))
      .finally(() => setLoading(false));
  }, [productId]);

  if (!productId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="max-w-xl w-full max-h-[85vh] bg-[#0c0c10] border border-white/[0.12] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Cabecera */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2997ff]/20 text-[#2997ff] flex items-center justify-center font-bold">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">
                Historial de Precios y Descuentos
              </h3>
              <p className="text-xs text-[#86868b] truncate max-w-sm">
                {productName}
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

        {/* Lista de Registros */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-xs text-[#86868b]">
              <div className="w-6 h-6 border-2 border-[#2997ff] border-t-transparent rounded-full animate-spin" />
              <span>Cargando auditoría de precios...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#86868b] space-y-2">
              <Tag className="w-8 h-8 text-[#86868b]/40 mx-auto" />
              <p>No hay variaciones de precio registradas para este producto.</p>
              <p className="text-[11px] text-[#86868b]/70">El precio se mantiene con su valor inicial.</p>
            </div>
          ) : (
            history.map((record, index) => {
              const esBajada = record.precioNuevo < record.precioAnterior;
              const esSubida = record.precioNuevo > record.precioAnterior;
              const fechaStr = new Date(record.fecha).toLocaleDateString('es-NI', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={record.id || index}
                  className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.1] transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {esBajada ? (
                        <span className="w-7 h-7 rounded-xl bg-[#30d158]/15 text-[#30d158] flex items-center justify-center">
                          <TrendingDown className="w-4 h-4" />
                        </span>
                      ) : esSubida ? (
                        <span className="w-7 h-7 rounded-xl bg-[#ff453a]/15 text-[#ff453a] flex items-center justify-center">
                          <TrendingUp className="w-4 h-4" />
                        </span>
                      ) : (
                        <span className="w-7 h-7 rounded-xl bg-white/[0.08] text-white flex items-center justify-center">
                          <Tag className="w-4 h-4" />
                        </span>
                      )}
                      <div>
                        <span className="text-xs font-bold text-white block">
                          {record.tipo === 'descuento_automatico'
                            ? 'Descuento Automático Aplicado'
                            : record.tipo === 'creacion'
                            ? 'Precio de Lanzamiento Inicial'
                            : record.tipo === 'restauracion'
                            ? 'Restauración a Precio Original'
                            : 'Ajuste de Precio'}
                        </span>
                        <span className="text-[10px] text-[#86868b] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {fechaStr}
                        </span>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <div className="text-sm font-bold text-white">
                        {formatCurrency(record.precioNuevo, 'NIO')}
                      </div>
                      {record.precioAnterior !== record.precioNuevo && (
                        <span className="text-[10px] text-[#86868b] line-through block">
                          Antes: {formatCurrency(record.precioAnterior, 'NIO')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Detalle y Autor */}
                  <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-[#86868b]">
                    <span className="truncate max-w-[280px]">
                      {record.motivo || 'Actualización registrada en el sistema'}
                    </span>
                    <span className="flex items-center gap-1 shrink-0 font-medium text-white/80">
                      <User className="w-3 h-3 text-[#2997ff]" />
                      {record.empleadoNombre || 'Personal'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pie */}
        <div className="p-4 border-t border-white/[0.08] bg-white/[0.01] flex justify-end">
          <button
            onClick={onClose}
            className="apple-pill-btn apple-btn-secondary px-5 py-2 text-xs font-semibold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
