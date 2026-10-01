// src/components/dashboard/OrdersPanel.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db, getAuthToken } from '@/lib/firebase/client';
import { useBranch } from '@/providers/BranchProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useDashboardPreferences } from '@/providers/DashboardPreferencesProvider';
import { MissingItemsModal } from '@/components/orders/MissingItemsModal';
import { OrderCustomerChat } from '@/components/chat/OrderCustomerChat';
import { ConversationsInbox } from '@/components/chat/ConversationsInbox';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  User,
  Phone,
  MapPin,
  ChevronRight,
  Filter,
  RefreshCw,
  Eye,
  X,
  CreditCard,
  ShieldCheck,
  PackageCheck,
  Loader2,
  AlertTriangle,
  MessageSquare,
  ChevronDown,
  Layers,
} from 'lucide-react';

interface OrderItem {
  id?: string;
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface OrderData {
  id: string;
  orderNumber: string;
  branchId: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  empresaDeliveryId?: string;
  empresaDeliveryNombre?: string;
  empresaDeliveryWhatsapp?: string;
  deliveryNombre?: string;
  status: string;
  total: number;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  currency: string;
  faltantes?: any[];
  decision_cliente?: string;
  conversacion_id?: string;
  espera_cliente_desde?: any;
  pago?: {
    metodo: string;
    monto: number;
    referencia?: string;
  };
  validadoAt?: any;
  createdAt?: any;
  cliente?: {
    nombre?: string;
    telefono?: string;
    direccion?: string;
    referencias?: string;
    ciudad?: string;
    notas?: string;
  };
  deliveryAddress?: {
    street?: string;
    referencias?: string;
  };
}

export function OrdersPanel() {
  const { currentBranch } = useBranch();
  const { user } = useAuth();
  const { t } = useDashboardPreferences();

  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Vista principal: Pedidos o Mensajes de Clientes
  const [viewMode, setViewMode] = useState<'pedidos' | 'mensajes'>('pedidos');

  // Items por orden y estados expandidos
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orderItemsMap, setOrderItemsMap] = useState<Record<string, OrderItem[]>>({});

  // Modales
  const [missingModalOrder, setMissingModalOrder] = useState<OrderData | null>(null);
  const [activeChatOrder, setActiveChatOrder] = useState<{
    conversationId: string;
    orderId: string;
    orderNumber: string;
    customerPhone?: string;
    customerName?: string;
  } | null>(null);

  // Escucha en tiempo real de Firestore
  useEffect(() => {
    if (!currentBranch?.id) return;
    setLoading(true);

    const pedidosRef = collection(db, 'pedidos');
    const q = query(pedidosRef, where('branchId', '==', currentBranch.id));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded: OrderData[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        loaded.sort((a, b) => {
          // Prioridad a pedidos en espera
          if (a.status === 'en_espera_cliente' && b.status !== 'en_espera_cliente') return -1;
          if (b.status === 'en_espera_cliente' && a.status !== 'en_espera_cliente') return 1;

          const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
          const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
          return tB - tA;
        });
        setOrders(loaded);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching orders:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentBranch?.id]);

  // Cargar items de una orden espec�fica
  const loadOrderItems = async (orderId: string) => {
    if (orderItemsMap[orderId]) return orderItemsMap[orderId];
    try {
      const snap = await getDocs(collection(db, 'pedidos', orderId, 'items'));
      const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setOrderItemsMap((prev) => ({ ...prev, [orderId]: items }));
      return items;
    } catch {
      return [];
    }
  };

  const handleToggleExpand = async (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
      await loadOrderItems(orderId);
    }
  };

  const handleOpenMissingModal = async (order: OrderData) => {
    const items = await loadOrderItems(order.id);
    setMissingModalOrder(order);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      setActionLoading(true);
      setErrorMsg('');
      const idToken = await getAuthToken();
      const res = await fetch('/api/orders/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Error al cambiar estado');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error actualizando pedido');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('�Seguro que deseas cancelar este pedido y liberar el stock reservado?')) return;
    try {
      setActionLoading(true);
      setErrorMsg('');
      const idToken = await getAuthToken();
      const res = await fetch('/api/orders/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ orderId, motivo: 'Cancelado desde panel de empleados' }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Error al cancelar');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error cancelando pedido');
    } finally {
      setActionLoading(false);
    }
  };

  const statusBadge = (st: string) => {
    switch (st) {
      case 'pendiente':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#ffd60a]/15 text-[#ffd60a] border border-[#ffd60a]/30 flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            <span>{t('orders_tab_pending', 'Pendiente')}</span>
          </span>
        );
      case 'en_preparacion':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#2997ff]/15 text-[#2997ff] border border-[#2997ff]/30 flex items-center gap-1.5">
            <PackageCheck className="w-3 h-3" />
            <span>{t('orders_tab_preparing', 'En Preparación')}</span>
          </span>
        );
      case 'en_espera_cliente':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1.5 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{t('orders_tab_waiting', 'En Espera Cliente')}</span>
          </span>
        );
      case 'listo_para_entrega':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#bf5af2]/15 text-[#bf5af2] border border-[#bf5af2]/30 flex items-center gap-1.5">
            <Truck className="w-3 h-3" />
            <span>{t('orders_tab_ready', 'Listo para Delivery')}</span>
          </span>
        );
      case 'comprado':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#30d158]/20 text-[#30d158] border border-[#30d158]/40 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t('orders_tab_validated', 'Validado por Delivery')}</span>
          </span>
        );
      case 'en_camino':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5">
            <Truck className="w-3 h-3" />
            <span>{t('orders_status_on_way', 'En Camino')}</span>
          </span>
        );
      case 'entregado':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#30d158]/15 text-[#30d158] border border-[#30d158]/25 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3" />
            <span>{t('orders_status_delivered', 'Entregado')}</span>
          </span>
        );
      case 'cancelado':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-500/15 text-red-400 border border-red-500/25 flex items-center gap-1.5">
            <X className="w-3 h-3" />
            <span>{t('orders_status_cancelled', 'Cancelado')}</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/[0.08] text-white">
            {st}
          </span>
        );
    }
  };

  const countByStatus = (st: string) => orders.filter((o) => o.status === st).length;

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'todos') return true;
    return o.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Selector de Modo: Lista de Pedidos o Bandeja de Mensajes Clientes */}
      <div className="flex items-center justify-between gap-3 p-1.5 rounded-2xl bg-[#141518] border border-white/[0.08]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('pedidos')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              viewMode === 'pedidos'
                ? 'bg-white text-black shadow-md'
                : 'text-[#86868b] hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{t('orders_title', 'Monitor de Pedidos')} ({orders.length})</span>
          </button>
          <button
            onClick={() => setViewMode('mensajes')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              viewMode === 'mensajes'
                ? 'bg-[#2997ff] text-white shadow-md'
                : 'text-[#86868b] hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>{t('orders_inbox', 'Bandeja de Mensajes')}</span>
            {countByStatus('en_espera_cliente') > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#86868b] px-3">
          <span className="w-2 h-2 rounded-full bg-[#30d158] animate-pulse" />
          <span>{t('orders_live', 'Firestore en vivo')}</span>
        </div>
      </div>

      {viewMode === 'mensajes' ? (
        <ConversationsInbox />
      ) : (
        <>
          {/* Barra de Filtros de Estado */}
          <div className="apple-card p-4 rounded-2xl border border-white/[0.08] bg-[#141518] flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setStatusFilter('todos')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  statusFilter === 'todos'
                    ? 'bg-white text-black shadow-md'
                    : 'bg-white/[0.05] text-[#86868b] hover:text-white'
                }`}
              >
                {t('orders_tab_all', 'Todos')} ({orders.length})
              </button>
              <button
                onClick={() => setStatusFilter('pendiente')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  statusFilter === 'pendiente'
                    ? 'bg-[#ffd60a] text-black shadow-md'
                    : 'bg-white/[0.05] text-[#86868b] hover:text-white'
                }`}
              >
                {t('orders_tab_pending', 'Pendientes')} ({countByStatus('pendiente')})
              </button>
              <button
                onClick={() => setStatusFilter('en_preparacion')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  statusFilter === 'en_preparacion'
                    ? 'bg-[#2997ff] text-white shadow-md'
                    : 'bg-white/[0.05] text-[#86868b] hover:text-white'
                }`}
              >
                {t('orders_tab_preparing', 'En Preparación')} ({countByStatus('en_preparacion')})
              </button>
              <button
                onClick={() => setStatusFilter('en_espera_cliente')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  statusFilter === 'en_espera_cliente'
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'bg-white/[0.05] text-[#86868b] hover:text-white'
                }`}
              >
                {t('orders_tab_waiting', 'En Espera')} ({countByStatus('en_espera_cliente')})
              </button>
              <button
                onClick={() => setStatusFilter('listo_para_entrega')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  statusFilter === 'listo_para_entrega'
                    ? 'bg-[#bf5af2] text-white shadow-md'
                    : 'bg-white/[0.05] text-[#86868b] hover:text-white'
                }`}
              >
                {t('orders_tab_ready', 'Listos QR')} ({countByStatus('listo_para_entrega')})
              </button>
              <button
                onClick={() => setStatusFilter('comprado')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  statusFilter === 'comprado'
                    ? 'bg-[#30d158] text-black shadow-md'
                    : 'bg-white/[0.05] text-[#86868b] hover:text-white'
                }`}
              >
                {t('orders_tab_validated', 'Validados')} ({countByStatus('comprado')})
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Lista de Pedidos */}
          {loading ? (
            <div className="apple-card p-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#2997ff] animate-spin mx-auto" />
              <p className="text-xs text-[#86868b]">Cargando pedidos de la sucursal...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="apple-card p-12 text-center space-y-3 border-white/[0.06]">
              <ShoppingBag className="w-12 h-12 text-[#6e6e73] mx-auto" />
              <h4 className="text-sm font-bold text-white">{t('orders_empty_title', 'No hay pedidos en esta categoría')}</h4>
              <p className="text-xs text-[#86868b]">{t('orders_empty_desc', 'Los nuevos pedidos aparecerán automáticamente aquí.')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredOrders.map((order) => {
                const clienteName = order.cliente?.nombre || order.customerName || 'Cliente';
                const clienteTel = order.cliente?.telefono || order.customerPhone;
                const direccion = order.cliente?.direccion || order.deliveryAddress?.street;
                const isExpanded = expandedOrderId === order.id;
                const items = orderItemsMap[order.id] || [];

                return (
                  <div
                    key={order.id}
                    className={`apple-card p-5 rounded-2xl border transition-all space-y-4 ${
                      order.status === 'en_espera_cliente'
                        ? 'border-amber-500/30 bg-amber-500/[0.02]'
                        : 'border-white/[0.08] bg-[#141518]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shrink-0 ${
                            order.status === 'en_espera_cliente'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-white/[0.06]'
                          }`}
                        >
                          {order.status === 'en_espera_cliente' ? (
                            <AlertTriangle className="w-5 h-5" />
                          ) : (
                            <ShoppingBag className="w-5 h-5 text-[#2997ff]" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white text-sm">
                              #{order.orderNumber}
                            </span>
                            {statusBadge(order.status)}
                          </div>
                          <p className="text-xs text-[#86868b] mt-0.5">
                            {t('orders_card_customer', 'Cliente')}: <strong className="text-white">{clienteName}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:text-right">
                        <div>
                          <span className="text-[10px] text-[#86868b] uppercase block">{t('orders_card_total', 'Total Pedido')}</span>
                          <span className="text-base font-bold text-[#30d158] font-mono">
                            C$ {Number(order.total || 0).toLocaleString('es-NI')} NIO
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Banner si el pedido est� en espera por faltante */}
                    {order.status === 'en_espera_cliente' && (
                      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 text-xs text-amber-300">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                          <span>
                            Pedido pausado por falta de producto(s).{' '}
                            <strong>Bloqueado para validaci�n de delivery.</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {order.conversacion_id && (
                            <button
                              type="button"
                              onClick={() =>
                                setActiveChatOrder({
                                  conversationId: order.conversacion_id!,
                                  orderId: order.id,
                                  orderNumber: order.orderNumber,
                                  customerPhone: clienteTel,
                                  customerName: clienteName,
                                })
                              }
                              className="px-3 py-1.5 rounded-xl bg-[#2997ff] hover:bg-[#1a85ea] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>{t('orders_btn_chat', 'Abrir Chat Cliente')}</span>
                            </button>
                          )}

                          {clienteTel && (
                            <a
                              href={`https://wa.me/${clienteTel.replace(/\D/g, '')}?text=${encodeURIComponent(
                                `Hola ${clienteName}, te escribimos de Sayta Mall sobre tu pedido #${order.orderNumber}:`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-xl bg-[#30d158]/20 hover:bg-[#30d158]/30 text-[#30d158] text-xs font-bold flex items-center gap-1.5 transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Info de contacto y entrega */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] text-xs">
                      <div>
                        <span className="text-[#86868b] block text-[10px] uppercase">Contacto</span>
                        <span className="text-white font-medium">{clienteName}</span>
                        {clienteTel && (
                          <a
                            href={`https://wa.me/${clienteTel.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#30d158] hover:underline flex items-center gap-1 mt-0.5"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{clienteTel}</span>
                          </a>
                        )}
                      </div>

                      <div>
                        <span className="text-[#86868b] block text-[10px] uppercase">Direcci�n</span>
                        <span className="text-white truncate block">
                          {direccion || 'A retirar en sucursal'}
                        </span>
                        {order.cliente?.referencias && (
                          <span className="text-[#86868b] text-[11px] truncate block">
                            Ref: {order.cliente.referencias}
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="text-[#86868b] block text-[10px] uppercase">Delivery / Pago</span>
                        <span className="text-white block">
                          {order.empresaDeliveryNombre || 'Delivery local'}
                        </span>
                        {order.deliveryNombre && (
                          <span className="text-[#30d158] text-[11px] block">
                            Repartidor: {order.deliveryNombre}
                          </span>
                        )}
                        {order.pago?.metodo && (
                          <span className="text-white/80 text-[11px] block">
                            Pago: {order.pago.metodo} {order.pago.referencia ? `(${order.pago.referencia})` : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Desplegable de Checklist de Art�culos */}
                    <div>
                      <button
                        type="button"
                        onClick={() => handleToggleExpand(order.id)}
                        className="text-xs text-[#2997ff] hover:underline flex items-center gap-1"
                      >
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                        <span>{isExpanded ? t('orders_hide_items', 'Ocultar checklist de productos') : t('orders_show_items', 'Ver productos a preparar')}</span>
                      </button>

                      {isExpanded && (
                        <div className="mt-3 p-3 rounded-xl bg-black/40 border border-white/[0.06] divide-y divide-white/[0.05] animate-fade-in text-xs">
                          {items.length === 0 ? (
                            <p className="text-center py-2 text-[#86868b]">{t('orders_loading_items', 'Cargando artículos...')}</p>
                          ) : (
                            items.map((it, idx) => (
                              <div key={idx} className="py-2 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="w-5 h-5 rounded bg-white/[0.08] flex items-center justify-center font-bold text-white font-mono shrink-0">
                                    {it.quantity}
                                  </span>
                                  <span className="text-white truncate">{it.productName}</span>
                                </div>
                                <span className="text-[#86868b] font-mono shrink-0">
                                  C$ {(it.unitPrice * it.quantity).toLocaleString('es-NI')}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {/* Acciones de Empleado */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/[0.06]">
                      <div className="flex flex-wrap items-center gap-2">
                        {order.status === 'pendiente' && (
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleUpdateStatus(order.id, 'en_preparacion')}
                            className="apple-pill-btn apple-btn-primary px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            <span>{t('orders_btn_prepare', 'Iniciar Preparación')}</span>
                          </button>
                        )}

                        {order.status === 'en_preparacion' && (
                          <>
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => handleUpdateStatus(order.id, 'listo_para_entrega')}
                              className="px-3.5 py-1.5 rounded-full bg-[#bf5af2] hover:bg-[#a642dc] text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>{t('orders_btn_ready', 'Marcar Listo para Delivery')}</span>
                            </button>

                            {/* Bot�n Reportar Faltante */}
                            <button
                              type="button"
                              onClick={() => handleOpenMissingModal(order)}
                              className="px-3.5 py-1.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>{t('orders_btn_missing', 'Reportar Producto No Disponible')}</span>
                            </button>
                          </>
                        )}

                        {order.status === 'listo_para_entrega' && (
                          <span className="text-xs text-[#ffd60a] flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{t('orders_ready_msg', 'Listo para que el delivery escanee el QR en mostrador...')}</span>
                          </span>
                        )}

                        {order.status === 'comprado' && (
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleUpdateStatus(order.id, 'en_camino')}
                            className="px-3.5 py-1.5 rounded-full bg-cyan-500 hover:bg-cyan-600 text-black text-xs font-bold flex items-center gap-1.5 transition-all"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>{t('orders_btn_dispatch', 'Despachar (En Camino)')}</span>
                          </button>
                        )}

                        {order.status === 'en_camino' && (
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleUpdateStatus(order.id, 'entregado')}
                            className="px-3.5 py-1.5 rounded-full bg-[#30d158] hover:bg-[#2dba4e] text-black text-xs font-bold flex items-center gap-1.5 transition-all"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{t('orders_btn_deliver', 'Marcar Entregado al Cliente')}</span>
                          </button>
                        )}
                      </div>

                      {['pendiente', 'en_preparacion', 'en_espera_cliente', 'listo_para_entrega'].includes(
                        order.status
                      ) && (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleCancelOrder(order.id)}
                          className="text-xs text-red-400 hover:text-red-300 hover:underline transition-colors"
                        >
                          {t('orders_btn_cancel', 'Cancelar y liberar stock')}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modal Reportar Faltante */}
      {missingModalOrder && (
        <MissingItemsModal
          orderId={missingModalOrder.id}
          orderNumber={missingModalOrder.orderNumber}
          customerName={missingModalOrder.cliente?.nombre || missingModalOrder.customerName}
          items={orderItemsMap[missingModalOrder.id] || []}
          isOpen={true}
          onClose={() => setMissingModalOrder(null)}
          onSuccess={(conversationId) => {
            setActiveChatOrder({
              conversationId,
              orderId: missingModalOrder.id,
              orderNumber: missingModalOrder.orderNumber,
              customerPhone: missingModalOrder.cliente?.telefono || missingModalOrder.customerPhone,
              customerName: missingModalOrder.cliente?.nombre || missingModalOrder.customerName,
            });
            setMissingModalOrder(null);
          }}
        />
      )}

      {/* Modal / Drawer de Chat con Cliente */}
      {activeChatOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-xl h-[650px] my-auto">
            <OrderCustomerChat
              conversationId={activeChatOrder.conversationId}
              orderId={activeChatOrder.orderId}
              orderNumber={activeChatOrder.orderNumber}
              customerPhone={activeChatOrder.customerPhone}
              customerName={activeChatOrder.customerName}
              onClose={() => setActiveChatOrder(null)}
              isStaff={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}


