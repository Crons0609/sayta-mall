// src/components/chat/OrderCustomerChat.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, doc, where, limit } from 'firebase/firestore';
import { db, getAuthToken } from '@/lib/firebase/client';
import { useAuth } from '@/providers/AuthProvider';
import type { MessageDocument, ConversationDocument, CustomerDecision } from '@/types/message.types';
import {
  Send,
  MessageSquare,
  AlertCircle,
  Clock,
  Phone,
  Check,
  CheckCheck,
  Package,
  X,
  Loader2,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface Props {
  conversationId?: string;
  orderId?: string;
  orderNumber?: string;
  customerPhone?: string;
  customerName?: string;
  onClose?: () => void;
  isStaff?: boolean;
}

export function OrderCustomerChat({
  conversationId,
  orderId,
  orderNumber,
  customerPhone,
  customerName,
  onClose,
  isStaff = false,
}: Props) {
  const { user } = useAuth();
  const [effectiveConvId, setEffectiveConvId] = useState<string | null>(conversationId || null);
  const [messages, setMessages] = useState<MessageDocument[]>([]);
  const [conversation, setConversation] = useState<ConversationDocument | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Resolver ID de conversación si solo viene orderId
  useEffect(() => {
    if (conversationId) {
      setEffectiveConvId(conversationId);
      return;
    }
    if (!orderId) return;

    const q = query(
      collection(db, 'conversaciones'),
      where('pedido_id', '==', orderId),
      limit(1)
    );
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setEffectiveConvId(snap.docs[0].id);
      }
    });
    return () => unsub();
  }, [conversationId, orderId]);

  // Escuchar conversación en Firestore
  useEffect(() => {
    if (!effectiveConvId) return;
    const convRef = doc(db, 'conversaciones', effectiveConvId);
    const unsubConv = onSnapshot(convRef, (snap) => {
      if (snap.exists()) {
        setConversation({ id: snap.id, ...(snap.data() as any) });
      }
    });

    // Escuchar mensajes en tiempo real
    const messagesRef = collection(db, 'conversaciones', effectiveConvId, 'mensajes');
    const q = query(messagesRef, orderBy('created_at', 'asc'));
    const unsubMsgs = onSnapshot(q, (snapshot) => {
      const msgs: MessageDocument[] = [];
      snapshot.forEach((d) => msgs.push({ id: d.id, ...(d.data() as any) }));
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    // Marcar como leído
    const markRead = async () => {
      try {
        const idToken = await getAuthToken();
        await fetch(`/api/messages/${effectiveConvId}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${idToken}` },
        });
      } catch {}
    };
    markRead();

    return () => {
      unsubConv();
      unsubMsgs();
    };
  }, [effectiveConvId, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !effectiveConvId) return;

    setSending(true);
    try {
      const idToken = await getAuthToken();
      const res = await fetch(`/api/messages/${effectiveConvId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ contenido: newMessage.trim(), tipo: 'texto' }),
      });
      if (!res.ok) throw new Error('Error al enviar');
      setNewMessage('');
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleSelectDecision = async (decision: CustomerDecision) => {
    if (!orderId && !conversation?.pedido_id) return;
    const targetOrderId = orderId || conversation?.pedido_id;

    const confirmText =
      decision === 'cancelado'
        ? '¿Seguro que deseas cancelar el pedido completo?'
        : decision === 'sin_producto'
        ? '¿Deseas continuar con el pedido sin los productos faltantes? Se recalculará el total.'
        : decision === 'sustituido'
        ? '¿Deseas aceptar los productos sustitutos sugeridos?'
        : '¿Deseas esperar a que la sucursal surta el inventario?';

    if (!confirm(confirmText)) return;

    setActionLoading(true);
    setStatusMessage('');
    try {
      const idToken = await getAuthToken();
      const res = await fetch(`/api/orders/${targetOrderId}/decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ decision }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Error al aplicar decisión');

      setStatusMessage(data.message || 'Decisión registrada correctamente.');
    } catch (err: any) {
      alert(err.message || 'Error al procesar decisión');
    } finally {
      setActionLoading(false);
    }
  };

  const cleanPhone = (customerPhone || conversation?.cliente_telefono || '').replace(/\D/g, '');

  return (
    <div className="flex flex-col h-full bg-[#121316] text-white rounded-3xl border border-white/[0.08] overflow-hidden shadow-2xl animate-fade-in">
      {/* Header del Chat */}
      <div className="p-4 bg-black/40 border-b border-white/[0.08] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-[#2997ff]/15 border border-[#2997ff]/30 text-[#2997ff] flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white truncate">
                {isStaff
                  ? conversation?.cliente_nombre || customerName || 'Cliente'
                  : conversation?.sucursal_nombre || 'Soporte de Tienda'}
              </h3>
              {conversation?.pedido_estado === 'en_espera_cliente' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                  En espera de cliente
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#86868b] font-mono truncate">
              Orden #{orderNumber || conversation?.pedido_order_number || orderId?.slice(-6)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Botón WhatsApp directo para el empleado */}
          {isStaff && cleanPhone && (
            <a
              href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                `Hola ${customerName || 'Cliente'}, te escribimos de Sayta Mall sobre tu pedido #${orderNumber || conversation?.pedido_order_number}:`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-[#30d158]/15 hover:bg-[#30d158]/25 text-[#30d158] transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Contactar al cliente por WhatsApp"
            >
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#86868b] hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-[#30d158]/15 border-b border-[#30d158]/30 text-[#30d158] text-xs flex items-center gap-2 px-4">
          <Check className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Lista de Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-xs text-[#86868b] space-y-2">
            <MessageSquare className="w-8 h-8 text-[#6e6e73]" />
            <p>Inicia la conversación para coordinar los detalles del pedido.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.emisor_id === user?.uid;
            const isSystem = msg.emisor_rol === 'sistema' || msg.tipo === 'sistema' || msg.tipo === 'accion';

            if (isSystem) {
              return (
                <div
                  key={msg.id}
                  className="p-4 rounded-2xl bg-amber-500/[0.08] border border-amber-500/25 space-y-3 animate-fade-in"
                >
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>Aviso del Sistema</span>
                  </div>
                  <p className="text-xs text-white/90 whitespace-pre-line leading-relaxed">
                    {msg.contenido}
                  </p>

                  {/* Botones de acción para el cliente */}
                  {msg.acciones && msg.acciones.length > 0 && !isStaff && (
                    <div className="pt-2 border-t border-amber-500/20 space-y-2">
                      <p className="text-[11px] font-semibold text-amber-300">
                        Selecciona tu decisión:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {msg.acciones.map((acc) => (
                          <button
                            key={acc.id}
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleSelectDecision(acc.decision)}
                            className={`p-2.5 rounded-xl text-xs font-bold transition-all text-left flex items-center justify-between ${
                              acc.estilo === 'primary'
                                ? 'bg-[#30d158] hover:bg-[#2dba4e] text-black shadow-md'
                                : acc.estilo === 'danger'
                                ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30'
                                : acc.estilo === 'warning'
                                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30'
                                : 'bg-white/[0.08] hover:bg-white/[0.14] text-white border border-white/10'
                            }`}
                          >
                            <span>{acc.label}</span>
                            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {msg.acciones && msg.acciones.length > 0 && isStaff && (
                    <p className="text-[11px] text-[#86868b] italic">
                      Esperando que el cliente seleccione una opción desde su app o por WhatsApp.
                    </p>
                  )}
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
              >
                <span className="text-[10px] text-[#86868b] px-1">
                  {msg.emisor_nombre} · {msg.emisor_rol === 'empleado' ? 'Personal' : 'Cliente'}
                </span>
                <div
                  className={`max-w-[80%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                    isMe
                      ? 'bg-[#2997ff] text-white rounded-tr-none'
                      : 'bg-white/[0.06] border border-white/[0.08] text-white rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.contenido}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de Mensaje */}
      <form onSubmit={handleSendMessage} className="p-3 bg-black/40 border-t border-white/[0.08] flex items-center gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-1 px-4 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-2xl text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff] transition-colors"
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="p-2.5 rounded-2xl bg-[#2997ff] hover:bg-[#1a85ea] disabled:opacity-40 text-white transition-all shadow-md shrink-0"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}
