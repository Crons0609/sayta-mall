// src/components/chat/EmployeeChat.tsx
// Interfaz de mensajería interna entre colaboradores estilo WhatsApp / Telegram.
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useDashboardPreferences } from '@/providers/DashboardPreferencesProvider';
import { getAuthToken } from '@/lib/firebase/client';
import {
  Send,
  MessageSquare,
  Users,
  AlertCircle,
  Clock,
  Sparkles,
  Search,
  CheckCheck,
  RefreshCw,
  ChevronLeft,
  Flame,
  Package,
  CreditCard,
  Wrench,
  Smile,
  ShieldCheck,
} from 'lucide-react';
import { ChatMessage, ChatChannel, DEFAULT_CHANNELS } from '@/lib/firebase/chat';

interface Contact {
  id: string;
  displayName: string;
  area: string;
  role: string;
  branchName?: string;
}

export function EmployeeChat() {
  const { t } = useDashboardPreferences();
  const { user, claims } = useAuth();

  const [activeChannelId, setActiveChannelId] = useState<string>('general');
  const [activeChannelTitle, setActiveChannelTitle] = useState<string>('📢 Sala General del Equipo');
  const [activeChannelSubtitle, setActiveChannelSubtitle] = useState<string>('Comunicados de toda la tienda');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [inputText, setInputText] = useState('');
  const [msgType, setMsgType] = useState<'text' | 'urgent' | 'shift' | 'stock_alert'>('text');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileView, setMobileView] = useState<'sidebar' | 'chat'>('sidebar');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Helper para headers
  const getAuthHeaders = useCallback(async () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (user) {
      try {
        const token = await getAuthToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
      } catch {}
      if (user.uid) headers['x-user-id'] = user.uid;
      if (user.displayName) headers['x-user-name'] = encodeURIComponent(user.displayName);
    }
    if (claims?.role) headers['x-user-role'] = claims.role;
    return headers;
  }, [user, claims]);

  // Cargar mensajes del canal activo
  const loadMessages = useCallback(async (channelId: string, isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/chat?channelId=${encodeURIComponent(channelId)}`, {
        headers,
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
        if (data.contacts) setContacts(data.contacts);
      }
    } catch (e) {
      console.error('[EmployeeChat] Error cargando mensajes:', e);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [getAuthHeaders]);

  // Carga inicial y auto-scroll
  useEffect(() => {
    loadMessages(activeChannelId);
  }, [activeChannelId, loadMessages]);

  // Polling en tiempo real cada 3 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      loadMessages(activeChannelId, true);
    }, 3000);
    return () => clearInterval(interval);
  }, [activeChannelId, loadMessages]);

  // Desplazar automáticamente al fondo al recibir mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Enviar mensaje
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || sending) return;

    const textToSend = inputText.trim();
    const typeToSend = msgType;
    setInputText('');
    setSending(true);

    // Mensaje optimista
    const tempMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      channelId: activeChannelId,
      senderId: user?.uid || 'temp',
      senderName: user?.displayName || user?.email?.split('@')[0] || 'Tú',
      senderRole: claims?.role || 'employee',
      senderArea: (claims as any)?.area || 'general',
      text: textToSend,
      type: typeToSend,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          channelId: activeChannelId,
          text: textToSend,
          type: typeToSend,
          senderArea: (claims as any)?.area || 'general',
        }),
      });
      const data = await res.json();
      if (data.success && data.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempMsg.id ? data.message : m))
        );
      }
    } catch (err) {
      console.error('[EmployeeChat] Error enviando:', err);
    } finally {
      setSending(false);
      setMsgType('text');
      inputRef.current?.focus();
    }
  };

  // Cambiar a canal directo o grupal
  const handleSelectChannel = (channel: ChatChannel) => {
    setActiveChannelId(channel.id);
    setActiveChannelTitle(channel.name);
    setActiveChannelSubtitle(channel.description);
    setMobileView('chat');
  };

  const handleSelectContact = (contact: Contact) => {
    const myId = user?.uid || 'me';
    // ID determinista para el canal privado 1 a 1
    const sortedIds = [myId, contact.id].sort();
    const directChannelId = `dm_${sortedIds[0]}_${sortedIds[1]}`;

    setActiveChannelId(directChannelId);
    setActiveChannelTitle(`💬 ${contact.displayName}`);
    setActiveChannelSubtitle(`Chat directo · ${contact.area.toUpperCase()} (${contact.branchName || 'Sucursal'})`);
    setMobileView('chat');
  };

  const filteredContacts = contacts.filter((c) =>
    c.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.area.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="apple-card border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl bg-[#0a0a0c] flex h-[760px] max-h-[85vh]">
      {/* ── BARRA LATERAL (Canales y Contactos) ── */}
      <div
        className={`w-full md:w-80 shrink-0 border-r border-white/[0.08] flex flex-col bg-[#0d0d10] ${
          mobileView === 'chat' ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Cabecera Sidebar */}
        <div className="p-4 border-b border-white/[0.08]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#2997ff]/20 text-[#2997ff] flex items-center justify-center font-bold">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">{t('nav_chat_staff', 'Chat de Empleados')}</h3>
                <p className="text-[10px] text-[#30d158] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#30d158] animate-pulse" />
                  {t('status_connected', 'Red Interna Conectada')}
                </p>
              </div>
            </div>
            <button
              onClick={() => loadMessages(activeChannelId)}
              className="p-1.5 rounded-lg text-[#86868b] hover:text-white hover:bg-white/[0.06] transition-colors"
              title="Refrescar mensajes"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Buscador */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#86868b] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('search_placeholder', 'Buscar canal o compañero...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-[#86868b] focus:outline-none focus:border-[#2997ff]/60 transition-colors"
            />
          </div>
        </div>

        {/* Lista scrollable de canales y personas */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {/* Canales Oficiales */}
          <div className="space-y-1">
            <span className="text-[10px] text-[#86868b] font-semibold uppercase tracking-wider px-2 block">
              {t('chat_team_rooms', 'Salas de Equipo')}
            </span>
            {DEFAULT_CHANNELS.map((ch) => {
              const isActive = activeChannelId === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => handleSelectChannel(ch)}
                  className={`w-full text-left p-2.5 rounded-2xl flex items-center gap-2.5 transition-all ${
                    isActive
                      ? 'bg-[#2997ff]/15 border border-[#2997ff]/30 text-white shadow-md'
                      : 'hover:bg-white/[0.04] text-[#86868b] hover:text-white border border-transparent'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      isActive ? 'bg-[#2997ff] text-white' : 'bg-white/[0.06] text-white'
                    }`}
                  >
                    {ch.id === 'general' ? <Users className="w-4 h-4" /> : <Wrench className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold truncate text-white">{t(`chat_ch_${ch.id}`, ch.name)}</span>
                    </div>
                    <p className="text-[10px] text-[#86868b] truncate mt-0.5">{t(`chat_ch_${ch.id}_desc`, ch.description)}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Contactos / Empleados */}
          <div className="space-y-1">
            <span className="text-[10px] text-[#86868b] font-semibold uppercase tracking-wider px-2 block">
              {t('chat_coworkers', 'Compañeros de Turno')} ({filteredContacts.length})
            </span>
            {filteredContacts.length === 0 ? (
              <p className="text-[11px] text-[#86868b] px-2 py-1">{t('chat_no_coworkers', 'No se encontraron compañeros.')}</p>
            ) : (
              filteredContacts.map((contact) => {
                const isSelected = activeChannelTitle.includes(contact.displayName);
                return (
                  <button
                    key={contact.id}
                    onClick={() => handleSelectContact(contact)}
                    className={`w-full text-left p-2.5 rounded-2xl flex items-center gap-2.5 transition-all ${
                      isSelected
                        ? 'bg-[#30d158]/15 border border-[#30d158]/30 text-white shadow-md'
                        : 'hover:bg-white/[0.04] text-[#86868b] hover:text-white border border-transparent'
                    }`}
                  >
                    <div className="relative">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/[0.08] text-white flex items-center justify-center font-bold text-xs">
                        {contact.displayName.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="w-2 h-2 rounded-full bg-[#30d158] absolute -bottom-0.5 -right-0.5 ring-2 ring-[#0a0a0c]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold truncate text-white">{contact.displayName}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.06] text-[#86868b] uppercase">
                          {contact.area}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#30d158] mt-0.5 flex items-center gap-1">
                        <span>{t('chat_on_shift', 'En turno')}</span>
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── PANEL DERECHO (CONVERSACIÓN ACTIVA) ── */}
      <div
        className={`flex-1 flex flex-col bg-[#0a0a0c] ${
          mobileView === 'sidebar' ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Cabecera del Chat Activo */}
        <div className="h-16 px-4 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileView('sidebar')}
              className="md:hidden p-2 rounded-xl text-[#86868b] hover:text-white hover:bg-white/[0.08]"
              title="Volver a canales"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-2xl bg-[#2997ff]/20 text-[#2997ff] flex items-center justify-center font-bold shadow-lg">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight leading-tight">
                {activeChannelId.startsWith('direct_') ? activeChannelTitle : t(`chat_ch_${activeChannelId}`, activeChannelTitle)}
              </h2>
              <p className="text-[11px] text-[#86868b] truncate max-w-xs sm:max-w-md">
                {activeChannelId.startsWith('direct_') ? activeChannelSubtitle : t(`chat_ch_${activeChannelId}_desc`, activeChannelSubtitle)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#30d158]/10 text-[#30d158] border border-[#30d158]/20 hidden sm:inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#30d158] animate-pulse" />
              {t('chat_active_channel', 'Canal Activo')}
            </span>
            <button
              onClick={() => loadMessages(activeChannelId)}
              className="p-2 rounded-xl text-[#86868b] hover:text-white hover:bg-white/[0.06] transition-colors"
              title="Recargar conversación"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Historial de Mensajes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gradient-to-b from-black via-[#0a0a0c] to-[#070708]">
          {loading ? (
            <div className="h-full flex items-center justify-center text-xs text-[#86868b] gap-2">
              <div className="w-4 h-4 border-2 border-[#2997ff] border-t-transparent rounded-full animate-spin" />
              <span>{t('chat_syncing', 'Sincronizando mensajes del canal...')}</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.04] text-[#86868b] flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">{t('chat_empty_title', 'No hay mensajes aún en este canal')}</h4>
              <p className="text-xs text-[#86868b] max-w-xs">
                {t('chat_empty_desc', '¡Sé el primero en escribir! Puedes consultar stock, coordinar turnos o avisar a tus compañeros.')}
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine =
                msg.senderId === user?.uid ||
                msg.senderName.toLowerCase() === (user?.displayName || '').toLowerCase();

              const isUrgent = msg.type === 'urgent';
              const isShift = msg.type === 'shift';
              const isStock = msg.type === 'stock_alert';

              const timeStr = new Date(msg.createdAt).toLocaleTimeString('es-NI', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} animate-fade-in`}
                >
                  {/* Etiqueta del autor */}
                  {!isMine && (
                    <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px]">
                      <span className="font-semibold text-white/90">{msg.senderName}</span>
                      {msg.senderArea && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/[0.08] text-[#86868b] uppercase">
                          {msg.senderArea}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Burbuja del mensaje */}
                  <div
                    className={`max-w-[85%] sm:max-w-[70%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-lg relative group ${
                      isUrgent
                        ? 'bg-[#ff453a]/20 border border-[#ff453a]/40 text-white'
                        : isShift
                        ? 'bg-[#bf5af2]/20 border border-[#bf5af2]/40 text-white'
                        : isStock
                        ? 'bg-[#ffd60a]/15 border border-[#ffd60a]/30 text-white'
                        : isMine
                        ? 'bg-gradient-to-r from-[#2997ff] to-[#0071e3] text-white rounded-br-xs'
                        : 'bg-white/[0.06] border border-white/[0.08] text-white/95 rounded-bl-xs'
                    }`}
                  >
                    {/* Badge especial si aplica */}
                    {isUrgent && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-[#ff453a] mb-1">
                        <Flame className="w-3 h-3" />
                        <span>{t('chat_urgent_badge', 'AVISO URGENTE')}</span>
                      </div>
                    )}
                    {isShift && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-[#bf5af2] mb-1">
                        <Clock className="w-3 h-3" />
                        <span>{t('chat_shift_badge', 'RELEVO DE TURNO')}</span>
                      </div>
                    )}
                    {isStock && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-[#ffd60a] mb-1">
                        <Package className="w-3 h-3" />
                        <span>{t('chat_stock_badge', 'CONSULTA DE STOCK')}</span>
                      </div>
                    )}

                    {/* Texto del mensaje */}
                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>

                    {/* Hora y check */}
                    <div className="flex items-center justify-end gap-1 mt-1.5 text-[9px] opacity-70">
                      <span>{timeStr}</span>
                      {isMine && <CheckCheck className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Barra de Etiquetas Rápidas */}
        <div className="px-4 py-2 border-t border-white/[0.06] bg-white/[0.01] flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] text-[#86868b] uppercase tracking-wider font-semibold shrink-0">
            {t('chat_quick_tags', 'Avisos Rápidos:')}
          </span>
          <button
            onClick={() => setMsgType(msgType === 'urgent' ? 'text' : 'urgent')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 shrink-0 transition-colors ${
              msgType === 'urgent'
                ? 'bg-[#ff453a] text-white'
                : 'bg-white/[0.04] text-[#ff453a] hover:bg-[#ff453a]/15 border border-[#ff453a]/30'
            }`}
          >
            <Flame className="w-3 h-3" />
            <span>{t('chat_tag_urgent', 'Urgente')}</span>
          </button>
          <button
            onClick={() => setMsgType(msgType === 'shift' ? 'text' : 'shift')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 shrink-0 transition-colors ${
              msgType === 'shift'
                ? 'bg-[#bf5af2] text-white'
                : 'bg-white/[0.04] text-[#bf5af2] hover:bg-[#bf5af2]/15 border border-[#bf5af2]/30'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>{t('chat_tag_shift', 'Turno')}</span>
          </button>
          <button
            onClick={() => setMsgType(msgType === 'stock_alert' ? 'text' : 'stock_alert')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 shrink-0 transition-colors ${
              msgType === 'stock_alert'
                ? 'bg-[#ffd60a] text-black'
                : 'bg-white/[0.04] text-[#ffd60a] hover:bg-[#ffd60a]/15 border border-[#ffd60a]/30'
            }`}
          >
            <Package className="w-3 h-3" />
            <span>{t('chat_tag_stock', 'Stock')}</span>
          </button>

          {/* Emojis rápidos */}
          <div className="ml-auto flex items-center gap-1 shrink-0">
            {['👍', '👋', '✅', '📦', '🙏'].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setInputText((prev) => prev + emoji)}
                className="w-6 h-6 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-xs flex items-center justify-center transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Barra de Entrada / Redacción */}
        <form onSubmit={handleSend} className="p-3 border-t border-white/[0.08] bg-[#0c0c0f] flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder={
              msgType === 'urgent'
                ? t('chat_placeholder_urgent', 'Escribe un aviso prioritario o urgente...')
                : msgType === 'shift'
                ? t('chat_placeholder_shift', 'Reporta inicio, cambio o pausa de turno...')
                : msgType === 'stock_alert'
                ? t('chat_placeholder_stock', 'Pregunta o avisa sobre stock de un producto...')
                : `${t('chat_placeholder_general', 'Mensaje para')} ${activeChannelId.startsWith('direct_') ? activeChannelTitle : t(`chat_ch_${activeChannelId}`, activeChannelTitle)}...`
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-white/[0.05] border border-white/[0.1] rounded-2xl px-4 py-2.5 text-xs text-white placeholder:text-[#86868b] focus:outline-none focus:border-[#2997ff] transition-colors"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="apple-pill-btn apple-btn-primary px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 shadow-lg disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('chat_btn_send', 'Enviar')}</span>
          </button>
        </form>
      </div>
    </div>
  );
}


