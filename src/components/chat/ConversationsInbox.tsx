// src/components/chat/ConversationsInbox.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useBranch } from '@/providers/BranchProvider';
import type { ConversationDocument } from '@/types/message.types';
import { OrderCustomerChat } from './OrderCustomerChat';
import {
  MessageSquare,
  AlertTriangle,
  Clock,
  User,
  ChevronRight,
  Search,
  Filter,
  RefreshCw,
  Phone,
} from 'lucide-react';

export function ConversationsInbox() {
  const { user } = useAuth();
  const { currentBranch } = useBranch();
  const [conversations, setConversations] = useState<ConversationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'todos' | 'en_espera' | 'abiertas'>('todos');
  const [selectedConv, setSelectedConv] = useState<ConversationDocument | null>(null);

  useEffect(() => {
    if (!currentBranch?.id) return;
    setLoading(true);

    const convRef = collection(db, 'conversaciones');
    const q = query(
      convRef,
      where('sucursal_id', '==', currentBranch.id)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded: ConversationDocument[] = [];
        snapshot.forEach((d) => loaded.push({ id: d.id, ...(d.data() as any) }));
        // Ordenar en memoria: en_espera_cliente primero
        loaded.sort((a, b) => {
          if (a.pedido_estado === 'en_espera_cliente' && b.pedido_estado !== 'en_espera_cliente') return -1;
          if (b.pedido_estado === 'en_espera_cliente' && a.pedido_estado !== 'en_espera_cliente') return 1;
          const tA = (a.ultimo_mensaje_at as any)?.toMillis?.() || 0;
          const tB = (b.ultimo_mensaje_at as any)?.toMillis?.() || 0;
          return tB - tA;
        });
        setConversations(loaded);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching conversations:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentBranch?.id]);

  const filtered = conversations.filter((c) => {
    if (filter === 'en_espera' && c.pedido_estado !== 'en_espera_cliente') return false;
    if (filter === 'abiertas' && c.estado !== 'abierta') return false;
    if (search.trim()) {
      const s = search.toLowerCase();
      return (
        c.cliente_nombre.toLowerCase().includes(s) ||
        (c.pedido_order_number && c.pedido_order_number.toLowerCase().includes(s)) ||
        c.ultimo_mensaje.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const countEnEspera = conversations.filter((c) => c.pedido_estado === 'en_espera_cliente').length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[720px] bg-[#141518] rounded-3xl border border-white/[0.08] overflow-hidden">
      {/* Columna Izquierda: Lista de Conversaciones */}
      <div className={`lg:col-span-5 flex flex-col border-r border-white/[0.08] ${selectedConv ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-4 border-b border-white/[0.08] space-y-3 bg-black/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#2997ff]" />
              <h3 className="font-bold text-sm text-white">Mensajes con Clientes</h3>
            </div>
            {countEnEspera > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                {countEnEspera} en espera
              </span>
            )}
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.04]">
            <button
              onClick={() => setFilter('todos')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === 'todos' ? 'bg-white text-black shadow-sm' : 'text-[#86868b] hover:text-white'
              }`}
            >
              Todos ({conversations.length})
            </button>
            <button
              onClick={() => setFilter('en_espera')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === 'en_espera' ? 'bg-amber-500 text-black shadow-sm' : 'text-[#86868b] hover:text-white'
              }`}
            >
              En Espera ({countEnEspera})
            </button>
            <button
              onClick={() => setFilter('abiertas')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === 'abiertas' ? 'bg-[#2997ff] text-white shadow-sm' : 'text-[#86868b] hover:text-white'
              }`}
            >
              Abiertas
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
              className="w-full pl-9 pr-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff]"
            />
          </div>
        </div>

        {/* Lista scrollable */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/[0.05] custom-scrollbar">
          {loading ? (
            <div className="p-8 text-center text-xs text-[#86868b]">Cargando conversaciones...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#86868b] space-y-2">
              <MessageSquare className="w-8 h-8 text-[#6e6e73] mx-auto" />
              <p>No hay mensajes en esta vista.</p>
            </div>
          ) : (
            filtered.map((conv) => {
              const isSelected = selectedConv?.id === conv.id;
              const isWaiting = conv.pedido_estado === 'en_espera_cliente';
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  className={`w-full p-4 text-left transition-all flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'bg-white/[0.08]'
                      : isWaiting
                      ? 'bg-amber-500/[0.05] hover:bg-amber-500/[0.08]'
                      : 'hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isWaiting
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-white/[0.06] text-white'
                      }`}
                    >
                      {isWaiting ? <AlertTriangle className="w-5 h-5" /> : <User className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-xs text-white truncate">{conv.cliente_nombre}</p>
                        {isWaiting && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                            Faltante
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#86868b] font-mono">
                        #{conv.pedido_order_number || conv.pedido_id?.slice(-6)}
                      </p>
                      <p className="text-xs text-[#86868b] truncate mt-1">{conv.ultimo_mensaje}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {conv.no_leidos_personal > 0 && (
                      <span className="w-5 h-5 rounded-full bg-[#2997ff] text-white text-[10px] font-bold flex items-center justify-center">
                        {conv.no_leidos_personal}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-[#6e6e73]" />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Columna Derecha: Vista del Chat Seleccionado */}
      <div className={`lg:col-span-7 h-full ${!selectedConv ? 'hidden lg:flex items-center justify-center' : 'flex flex-col'}`}>
        {selectedConv ? (
          <OrderCustomerChat
            conversationId={selectedConv.id}
            orderId={selectedConv.pedido_id}
            orderNumber={selectedConv.pedido_order_number}
            customerPhone={selectedConv.cliente_telefono}
            customerName={selectedConv.cliente_nombre}
            onClose={() => setSelectedConv(null)}
            isStaff={true}
          />
        ) : (
          <div className="text-center p-8 space-y-2 text-[#86868b]">
            <MessageSquare className="w-12 h-12 text-[#6e6e73] mx-auto" />
            <h4 className="text-sm font-bold text-white">Selecciona una conversación</h4>
            <p className="text-xs max-w-xs mx-auto">
              Elige una conversación de la lista para atender consultas y resolver productos faltantes con el cliente.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}