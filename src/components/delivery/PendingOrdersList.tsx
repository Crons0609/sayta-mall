// src/components/delivery/PendingOrdersList.tsx
// Lista de clientes con pedidos pendientes. El delivery selecciona y valida.
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { auth, getAuthToken } from '@/lib/firebase/client';
import { Package, Search, ChevronRight, Loader2, RefreshCw, AlertCircle, User } from 'lucide-react';
import { OrderValidationForm } from './OrderValidationForm';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  status: string;
  total: number;
  currency: string;
  itemCount: number;
  createdAt: any;
  _items: any[];
  _telefono?: string;
  _direccion?: any;
  _empresaDeliveryId?: string;
}

interface Props {
  sessionId: string;
  sucursalId: string;
  sessionInfo: { nombre: string; empresaDeliveryId: string } | null;
  onValidated: (orderNumber: string, total: number) => void;
}

export function PendingOrdersList({ sessionId, sucursalId, sessionInfo, onValidated }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const user = auth.currentUser;
      if (!user) {
        setError('Sesi�n expirada');
        return;
      }
      const idToken = await getAuthToken();
      const res = await fetch(`/api/delivery/orders?sessionId=${sessionId}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error);
      setOrders(data.orders ?? []);
    } catch (err: any) {
      setError(err.message || 'Error cargando pedidos');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filtered = orders.filter(
    (o) =>
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase())
  );

  const statusLabel: Record<string, string> = {
    pendiente: '? Pendiente',
    en_preparacion: '????? En preparaci�n',
    listo_para_entrega: '? Listo para entrega',
  };
  const statusColor: Record<string, string> = {
    pendiente: '#ffd60a',
    en_preparacion: '#2997ff',
    listo_para_entrega: '#30d158',
  };

  if (selectedOrder) {
    return (
      <OrderValidationForm
        order={selectedOrder}
        sessionId={sessionId}
        onBack={() => setSelectedOrder(null)}
        onValidated={(orderNumber, total) => {
          setSelectedOrder(null);
          onValidated(orderNumber, total);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/[0.08] px-4 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Pedidos en Sucursal</h1>
            {sessionInfo && (
              <p className="text-xs text-[#86868b]">
                Repartidor: <span className="text-[#30d158] font-semibold">{sessionInfo.nombre}</span>
              </p>
            )}
          </div>
          <button
            onClick={loadOrders}
            disabled={loading}
            className="p-2 rounded-xl bg-white/[0.06] border border-white/[0.08] text-[#86868b] hover:text-white transition-colors"
            title="Recargar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        {/* Buscador */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#86868b] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente o # pedido..."
            className="w-full pl-9 pr-4 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-xl text-sm text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#30d158] transition-colors"
          />
        </div>
      </div>

      <div className="p-4 space-y-3 max-w-lg mx-auto">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <Loader2 className="w-8 h-8 text-[#30d158] animate-spin" />
            <p className="text-sm text-[#86868b]">Cargando pedidos pendientes...</p>
          </div>
        )}

        {error && !loading && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 space-y-3 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
              <Package className="w-8 h-8 text-[#86868b]" />
            </div>
            <h3 className="text-base font-semibold text-white">Sin pedidos pendientes</h3>
            <p className="text-sm text-[#86868b] max-w-xs">
              No hay pedidos pendientes para retiro en esta sucursal en este momento.
            </p>
          </div>
        )}

        {!loading &&
          filtered.map((order) => {
            const isMyCompany = sessionInfo?.empresaDeliveryId === order._empresaDeliveryId;
            return (
              <button
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className={`w-full p-4 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                  isMyCompany
                    ? 'bg-[#30d158]/[0.08] border-[#30d158]/40 hover:bg-[#30d158]/[0.12]'
                    : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.08] flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-white truncate text-base">{order.customerName}</p>
                      <p className="text-xs text-[#86868b] font-mono">#{order.orderNumber}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#86868b] shrink-0 mt-1" />
                </div>

                <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                      style={{
                        backgroundColor: `${statusColor[order.status] ?? '#86868b'}20`,
                        color: statusColor[order.status] ?? '#86868b',
                      }}
                    >
                      {statusLabel[order.status] ?? order.status}
                    </span>
                    <span className="text-[#86868b]">�</span>
                    <span className="text-[#86868b]">
                      {order.itemCount} {order.itemCount === 1 ? 'producto' : 'productos'}
                    </span>
                  </div>
                  <span className="text-base font-black text-[#30d158] font-mono">
                    C$ {order.total.toLocaleString('es-NI')}
                  </span>
                </div>
              </button>
            );
          })}
      </div>
    </div>
  );
}

