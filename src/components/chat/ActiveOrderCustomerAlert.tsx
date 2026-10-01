// src/components/chat/ActiveOrderCustomerAlert.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { OrderCustomerChat } from './OrderCustomerChat';
import { AlertTriangle, MessageSquare, ChevronRight, X, Sparkles } from 'lucide-react';

interface WaitingOrder {
  id: string;
  numero_orden: string;
  sucursal_id: string;
  cliente: {
    nombre: string;
    telefono?: string;
  };
  total_original?: number;
  total_ajustado?: number;
  total: number;
  faltantes?: Array<{
    producto_id: string;
    nombre: string;
    cantidad_faltante: number;
    motivo: string;
    sustituto_sugerido_id?: string;
    sustituto_nombre?: string;
  }>;
}

export function ActiveOrderCustomerAlert() {
  const { user } = useAuth();
  const [waitingOrders, setWaitingOrders] = useState<WaitingOrder[]>([]);
  const [activeChatOrder, setActiveChatOrder] = useState<WaitingOrder | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!user?.uid) {
      setWaitingOrders([]);
      return;
    }

    try {
      const q = query(
        collection(db, 'pedidos'),
        where('usuario_id', '==', user.uid),
        where('estado', '==', 'en_espera_cliente')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: WaitingOrder[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            list.push({
              id: doc.id,
              numero_orden: data.numero_orden || doc.id.slice(0, 8),
              sucursal_id: data.sucursal_id || '',
              cliente: {
                nombre: data.cliente?.nombre || user.displayName || 'Cliente',
                telefono: data.cliente?.telefono || '',
              },
              total_original: data.total_original,
              total_ajustado: data.total_ajustado,
              total: data.total || 0,
              faltantes: data.faltantes || [],
            });
          });
          setWaitingOrders(list);
          if (list.length > 0) {
            setIsDismissed(false);
          }
        },
        (err) => {
          console.warn('ActiveOrderCustomerAlert listener note:', err);
        }
      );

      return () => unsubscribe();
    } catch (e) {
      console.warn('Error setting up listener:', e);
    }
  }, [user?.uid]);

  if (!user || waitingOrders.length === 0 || isDismissed) {
    return null;
  }

  const primaryOrder = waitingOrders[0];

  return (
    <>
      {/* Barra de Alerta Flotante */}
      <aside aria-label="Alerta de pedido pausado" className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 animate-slide-up">
        <div className="p-4 rounded-2xl bg-[#1c1c1e]/95 backdrop-blur-xl border border-[#ff453a]/40 shadow-2xl shadow-black/80 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ff453a]/20 border border-[#ff453a]/30 text-[#ff453a] flex items-center justify-center shrink-0 animate-pulse">
            <AlertTriangle className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#ff453a]">
                Acción Requerida
              </span>
              <span className="text-[10px] text-[#86868b]">• Orden #{primaryOrder.numero_orden}</span>
            </div>
            <h4 className="text-xs font-bold text-white mt-0.5 truncate">
              Faltan productos en tu pedido
            </h4>
            <p className="text-[11px] text-[#86868b] mt-0.5 leading-snug">
              La sucursal necesita tu decisión para continuar preparando tu compra (sustituir, quitar o esperar).
            </p>

            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => setActiveChatOrder(primaryOrder)}
                className="apple-pill-btn bg-[#2997ff] hover:bg-[#1d82e2] text-white px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-[#2997ff]/20 transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Ver Chat y Responder</span>
                <ChevronRight className="w-3 h-3" />
              </button>
              <button
                onClick={() => setIsDismissed(true)}
                className="text-[11px] text-[#86868b] hover:text-white px-2 py-1 transition-colors"
              >
                Ocultar
              </button>
            </div>
          </div>

          <button
            onClick={() => setIsDismissed(true)}
            className="text-[#86868b] hover:text-white p-1 rounded-lg transition-colors"
            title="Cerrar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Modal / Drawer del Chat */}
      {activeChatOrder && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-xl h-[85vh] max-h-[750px] bg-[#141518] rounded-3xl border border-white/[0.1] shadow-2xl overflow-hidden flex flex-col">
            <OrderCustomerChat
              orderId={activeChatOrder.id}
              orderNumber={activeChatOrder.numero_orden}
              customerName={activeChatOrder.cliente.nombre}
              customerPhone={activeChatOrder.cliente.telefono}
              isStaff={false}
              onClose={() => setActiveChatOrder(null)}
            />
          </div>
        </div>
      )}
    </>
  );
}
