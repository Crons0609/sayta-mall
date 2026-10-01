// src/components/delivery/OrderValidationForm.tsx
// Detalle del pedido + formulario de pago + confirmaci�n.
'use client';

import React, { useState } from 'react';
import { auth, getAuthToken } from '@/lib/firebase/client';
import {
  ArrowLeft,
  Package,
  MapPin,
  Phone,
  CreditCard,
  Banknote,
  ArrowLeftRight,
  Loader2,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface Props {
  order: any;
  sessionId: string;
  onBack: () => void;
  onValidated: (orderNumber: string, total: number) => void;
}

type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia';

export function OrderValidationForm({ order, sessionId, onBack, onValidated }: Props) {
  const [metodo, setMetodo] = useState<PaymentMethod>('efectivo');
  const [monto, setMonto] = useState(String(order.total));
  const [referencia, setReferencia] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const paymentOptions: { value: PaymentMethod; label: string; icon: React.ElementType; color: string }[] = [
    { value: 'efectivo', label: 'Efectivo', icon: Banknote, color: '#30d158' },
    { value: 'tarjeta', label: 'Tarjeta', icon: CreditCard, color: '#2997ff' },
    { value: 'transferencia', label: 'Transferencia', icon: ArrowLeftRight, color: '#ffd60a' },
  ];

  const handleConfirm = async () => {
    setError('');
    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      setError('Ingresa un monto v�lido');
      return;
    }
    if (metodo === 'transferencia' && !referencia.trim()) {
      setError('La referencia bancaria es obligatoria para transferencias');
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Sesi�n expirada. Escanea el QR de nuevo.');
      const idToken = await getAuthToken();

      const res = await fetch('/api/delivery/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          sessionId,
          orderId: order.id,
          pago: {
            metodo,
            monto: montoNum,
            referencia: referencia.trim() || undefined,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error al validar compra');
      }

      onValidated(order.orderNumber, order.total);
    } catch (err: any) {
      setError(err.message || 'Error al registrar validaci�n');
      setConfirming(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/[0.08] px-4 py-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-white/[0.06] border border-white/[0.08] text-[#86868b] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-base font-bold text-white tracking-tight">Validar Pedido</h1>
          <p className="text-xs text-[#86868b] font-mono">#{order.orderNumber}</p>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">
        {/* Error */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2.5 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Cliente y destino */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
          <h3 className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">
            Datos del Cliente
          </h3>
          <div className="space-y-1.5 text-sm">
            <p className="font-bold text-white text-base">{order.customerName}</p>
            {order._telefono && (
              <p className="text-xs text-[#86868b] flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#30d158]" />
                <a href={`tel:${order._telefono}`} className="text-[#30d158] hover:underline">
                  {order._telefono}
                </a>
              </p>
            )}
            {order._direccion && (
              <p className="text-xs text-[#86868b] flex items-start gap-2 pt-1">
                <MapPin className="w-3.5 h-3.5 text-[#ffd60a] shrink-0 mt-0.5" />
                <span>
                  {order._direccion.street || order._direccion}
                  {order._direccion.referencias ? ` (${order._direccion.referencias})` : ''}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Lista de productos */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[#86868b] uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-[#2997ff]" />
              <span>Productos ({order._items?.length || 0})</span>
            </h3>
            <span className="text-xs text-[#30d158] font-bold">Verificar unidades</span>
          </div>

          <div className="divide-y divide-white/[0.06]">
            {(order._items || []).map((item: any, i: number) => (
              <div key={i} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-white/[0.08] flex items-center justify-center font-bold text-white shrink-0 font-mono">
                    {item.quantity}x
                  </span>
                  <span className="text-white truncate font-medium">{item.productName || item.name}</span>
                </div>
                <span className="text-[#86868b] font-mono shrink-0">
                  C$ {((item.unitPrice || item.price || 0) * (item.quantity || 1)).toLocaleString('es-NI')}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-white/[0.08] flex justify-between items-center text-sm font-bold">
            <span className="text-white">Total a Cobrar</span>
            <span className="text-lg text-[#30d158] font-mono">
              C$ {Number(order.total).toLocaleString('es-NI')} NIO
            </span>
          </div>
        </div>

        {/* Formulario de Pago */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-4">
          <h3 className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">
            Registro del Pago en Sucursal
          </h3>

          {/* M�todo */}
          <div>
            <label className="block text-xs text-[#86868b] mb-2 font-medium">M�todo de Pago</label>
            <div className="grid grid-cols-3 gap-2">
              {paymentOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = metodo === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMetodo(opt.value)}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-white/[0.1] border-white/30 text-white shadow-lg'
                        : 'bg-white/[0.02] border-white/[0.06] text-[#86868b] hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" style={{ color: isSelected ? opt.color : undefined }} />
                    <span className="text-xs font-semibold">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Monto pagado */}
          <div>
            <label className="block text-xs text-[#86868b] mb-1 font-medium">
              Monto Pagado (C$ NIO)
            </label>
            <input
              type="number"
              step="0.01"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-xl text-base font-bold font-mono text-white focus:outline-none focus:border-[#30d158] transition-colors"
            />
          </div>

          {/* Referencia si no es efectivo */}
          {metodo !== 'efectivo' && (
            <div>
              <label className="block text-xs text-[#86868b] mb-1 font-medium">
                N�mero de Referencia / Voucher {metodo === 'transferencia' ? '*' : '(Opcional)'}
              </label>
              <input
                type="text"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                placeholder="Ej: REF-983210"
                className="w-full px-4 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-xl text-sm text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#30d158] transition-colors"
              />
            </div>
          )}
        </div>

        {/* Modal de Confirmaci�n */}
        {confirming && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-sm rounded-3xl bg-[#1c1c1e] border border-white/[0.15] p-6 text-center space-y-4 shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-[#30d158]/20 border border-[#30d158]/30 text-[#30d158] flex items-center justify-center mx-auto">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">�Confirmar compra del pedido?</h3>
              <p className="text-xs text-[#86868b] leading-relaxed">
                Est�s a punto de validar la compra de la orden{' '}
                <strong className="text-white">#{order.orderNumber}</strong> para el cliente{' '}
                <strong className="text-white">{order.customerName}</strong> por un monto de{' '}
                <strong className="text-[#30d158]">C$ {parseFloat(monto || '0').toLocaleString('es-NI')} NIO</strong>.
              </p>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-[#30d158] hover:bg-[#2dba4e] text-black font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#30d158]/20"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Confirmar y Registrar Venta</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bot�n flotante inferior para validar */}
        <div className="fixed bottom-0 inset-x-0 p-4 bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-white/[0.08] max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="w-full py-4 rounded-2xl bg-[#30d158] hover:bg-[#2dba4e] text-black font-bold text-sm shadow-xl shadow-[#30d158]/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Validar y Aceptar Compra</span>
          </button>
        </div>
      </div>
    </div>
  );
}

