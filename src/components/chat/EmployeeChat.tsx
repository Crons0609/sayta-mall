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
  Clock,
  Search,
  CheckCheck,
  RefreshCw,
  ChevronLeft,
  ChevronDown,
  Flame,
  Package,
  Wrench,
  Sparkles,
} from 'lucide-react';
import { ChatMessage, ChatChannel, DEFAULT_CHANNELS, buildDirectChannelId } from '@/lib/firebase/chat-types';

interface Contact {
  id: string;
  displayName: string;
  email?: string;
  area: string;
  role: string;
  branchName?: string;
  isOnline?: boolean;
  lastSeen?: number | null;
  lastMessage?: string;
  lastMessageTime?: string;
  hasUnread?: boolean;
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
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isInitialLoadRef = useRef(true);
  const prevMessagesCountRef = useRef(0);

  const isDirectChat =
    activeChannelId.startsWith('dm_') ||
    activeChannelId.startsWith('direct_') ||
    activeChannelTitle.startsWith('💬');

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
  const loadMessages = useCallback(
    async (channelId: string, isSilent = false) => {
      try {
        if (!isSilent) setLoading(true);
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/chat?channelId=${encodeURIComponent(channelId)}`, {
          headers,
          credentials: 'include',
        });
        const data = await res.json();
        if (data.success) {
          const newMsgs: ChatMessage[] = data.messages || [];
          setMessages((prev) => {
            // Comparar si no hubo cambios reales para no re-renderizar ni alterar el scroll
            if (prev.length === newMsgs.length) {
              const prevLast = prev[prev.length - 1];
              const newLast = newMsgs[newMsgs.length - 1];
              if (
                (!prevLast && !newLast) ||
                (prevLast?.id === newLast?.id && prevLast?.text === newLast?.text)
              ) {
                return prev;
              }
            }
            return newMsgs;
          });

          if (data.contacts) {
            setContacts((prev) => {
              if (
                prev.length === data.contacts.length &&
                prev.every((c, i) => c.id === data.contacts[i]?.id)
              ) {
                return prev;
              }
              return data.contacts;
            });
          }
        }
      } catch (e) {
        console.error('[EmployeeChat] Error cargando mensajes:', e);
      } finally {
        if (!isSilent) setLoading(false);
      }
    },
    [getAuthHeaders]
  );

  // Carga inicial al montar o cambiar canal
  useEffect(() => {
    loadMessages(activeChannelId);
  }, [activeChannelId, loadMessages]);

  // Polling silencioso en segundo plano cada 3 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      loadMessages(activeChannelId, true);
    }, 3000);
    return () => clearInterval(interval);
  }, [activeChannelId, loadMessages]);

  // Auto-scroll inteligente: NUNCA usar scrollIntoView (que causa que toda la página salte abajo)
  // Manipulamos exclusivamente scrollTop del contenedor interno de mensajes
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // En carga inicial del canal: posicionar al final sin animación brusca
    if (isInitialLoadRef.current) {
      if (messages.length > 0) {
        isInitialLoadRef.current = false;
        prevMessagesCountRef.current = messages.length;
        requestAnimationFrame(() => {
          if (container) container.scrollTop = container.scrollHeight;
        });
      }
      return;
    }

    // Si la cantidad de mensajes no cambió, NO mover el scroll
    if (messages.length === prevMessagesCountRef.current) return;
    const hasNew = messages.length > prevMessagesCountRef.current;
    prevMessagesCountRef.current = messages.length;
    if (!hasNew) return;

    const lastMsg = messages[messages.length - 1];
    const isMine =
      lastMsg &&
      (lastMsg.senderId === user?.uid ||
        lastMsg.senderName.toLowerCase() === (user?.displayName || '').toLowerCase());

    // Si el usuario subió a leer mensajes anteriores y el nuevo NO es suyo, respetar su posición
    if (userScrolledUp && !isMine) {
      return;
    }

    // Si es mensaje propio o está dentro del margen inferior (< 140px), hacer scroll suave en el contenedor
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (isMine || distanceFromBottom < 140) {
      requestAnimationFrame(() => {
        if (container) {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth',
          });
        }
      });
    }
  }, [messages, userScrolledUp, user?.uid, user?.displayName]);

  // Detectar si el usuario subió manualmente dentro del chat
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    setUserScrolledUp(distanceFromBottom > 120);
  };

  // Enviar mensaje
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || sending) return;

    const textToSend = inputText.trim();
    const typeToSend = msgType;
    setInputText('');
    setSending(true);
    setUserScrolledUp(false);

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

    // Bajar contenedor de inmediato para el mensaje enviado por el usuario
    requestAnimationFrame(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }
    });

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
      // Solo hacer focus en desktop para no disparar el teclado en teléfonos móviles
      if (typeof window !== 'undefined' && window.innerWidth > 768) {
        inputRef.current?.focus();
      }
    }
  };

  // Cambiar a canal grupal
  const handleSelectChannel = (channel: ChatChannel) => {
    setActiveChannelId(channel.id);
    setActiveChannelTitle(channel.name);
    setActiveChannelSubtitle(channel.description);
    setMobileView('chat');
    setUserScrolledUp(false);
    isInitialLoadRef.current = true;
  };

  // Cambiar a chat privado 1 a 1 determinista
  const handleSelectContact = (contact: Contact) => {
    const directChannelId = buildDirectChannelId(
      { id: user?.uid, email: user?.email || undefined },
      { id: contact.id, email: contact.email }
    );

    setActiveChannelId(directChannelId);
    setActiveChannelTitle(`💬 ${contact.displayName}`);
    setActiveChannelSubtitle(
      `Chat directo · ${contact.area.toUpperCase()} (${
        contact.role === 'owner' ? 'Jefe / Dueño' : contact.role === 'programmer' ? 'Programador' : 'Colaborador'
      })`
    );
    setMobileView('chat');
    setUserScrolledUp(false);
    isInitialLoadRef.current = true;
  };

  const myEmail = (user?.email || '').toLowerCase().trim();
  const myId = user?.uid || '';
  const myName = (user?.displayName || '').toLowerCase().trim();

  // Filtrar para NUNCA mostrar al usuario actual en su propia lista de contactos
  const filteredContacts = contacts.filter((c) => {
    const cEmail = (c.email || '').toLowerCase().trim();
    const cId = c.id || '';
    const cName = (c.displayName || '').toLowerCase().trim();

    // 1. Excluirse a sí mismo
    if (myEmail && cEmail && myEmail === cEmail) return false;
    if (myId && cId && myId === cId) return false;
    if (myName && cName && myName === cName) return false;

    // 2. Filtro de búsqueda
    return (
      c.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="apple-card border border-white/[0.08] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl bg-[#0a0a0c] flex h-[calc(100dvh-8.5rem)] sm:h-[calc(100dvh-12rem)] md:h-[750px] md:max-h-[82vh] relative">
      {/* ── BARRA LATERAL (Canales y Contactos) ── */}
      <div
        className={`w-full md:w-80 shrink-0 border-r border-white/[0.08] flex flex-col bg-[#0d0d10] min-h-0 ${
          mobileView === 'chat' ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Cabecera Sidebar */}
        <div className="p-3.5 sm:p-4 border-b border-white/[0.08] shrink-0 bg-white/[0.01]">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2997ff]/20 to-[#0071e3]/20 border border-[#2997ff]/30 text-[#2997ff] flex items-center justify-center font-bold shadow-sm">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                  {t('nav_chat_staff', 'Chat de Empleados')}
                </h3>
                <p className="text-[10px] text-[#30d158] flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#30d158] animate-pulse" />
                  {t('status_connected', 'Red Interna Conectada')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => loadMessages(activeChannelId)}
              className="p-1.5 rounded-lg text-[#86868b] hover:text-white hover:bg-white/[0.06] active:scale-95 transition-all"
              title="Refrescar mensajes"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#2997ff]' : ''}`} />
            </button>
          </div>

          {/* Buscador */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#86868b] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={t('search_placeholder', 'Buscar canal o compañero...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-[#86868b] focus:outline-none focus:border-[#2997ff]/60 transition-colors"
            />
          </div>
        </div>

        {/* Lista scrollable de canales y personas */}
        <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-3 sm:space-y-4">
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
                  type="button"
                  onClick={() => handleSelectChannel(ch)}
                  className={`w-full text-left p-2.5 rounded-2xl flex items-center gap-2.5 transition-all ${
                    isActive
                      ? 'bg-[#2997ff]/15 border border-[#2997ff]/30 text-white shadow-md'
                      : 'hover:bg-white/[0.04] text-[#86868b] hover:text-white border border-transparent'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      isActive ? 'bg-[#2997ff] text-white shadow-md shadow-[#2997ff]/30' : 'bg-white/[0.06] text-white'
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
              {t('chat_coworkers', 'Equipo y Colaboradores')} ({filteredContacts.length})
            </span>
            {filteredContacts.length === 0 ? (
              <p className="text-[11px] text-[#86868b] px-2 py-1">
                {t('chat_no_coworkers', 'No se encontraron compañeros.')}
              </p>
            ) : (
              filteredContacts.map((contact) => {
                const isSelected = activeChannelTitle.includes(contact.displayName);
                return (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => handleSelectContact(contact)}
                    className={`w-full text-left p-2.5 rounded-2xl flex items-center gap-2.5 transition-all ${
                      isSelected
                        ? 'bg-[#2997ff]/15 border border-[#2997ff]/30 text-white shadow-md'
                        : 'hover:bg-white/[0.04] text-[#86868b] hover:text-white border border-transparent'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/[0.08] text-white flex items-center justify-center font-bold text-xs">
                        {contact.displayName.slice(0, 2).toUpperCase()}
                      </div>
                      {contact.isOnline ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-[#30d158] absolute -bottom-0.5 -right-0.5 ring-2 ring-[#0a0a0c] shadow-sm shadow-[#30d158]/50 animate-pulse" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-zinc-600 absolute -bottom-0.5 -right-0.5 ring-2 ring-[#0a0a0c]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold truncate text-white">{contact.displayName}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded uppercase font-medium ${
                            contact.role === 'owner'
                              ? 'bg-[#ffd60a]/15 text-[#ffd60a]'
                              : contact.role === 'programmer'
                              ? 'bg-[#bf5af2]/15 text-[#bf5af2]'
                              : 'bg-white/[0.06] text-[#86868b]'
                          }`}
                        >
                          {contact.role === 'owner' ? 'Dueño' : contact.role === 'programmer' ? 'Admin' : contact.area}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-[10px] truncate max-w-[150px]">
                          {contact.lastMessage ? (
                            <span className={contact.hasUnread ? 'text-[#2997ff] font-semibold' : 'text-[#86868b]'}>
                              {contact.lastMessage}
                            </span>
                          ) : contact.isOnline ? (
                            <span className="text-[#30d158] font-medium flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#30d158] inline-block" /> En línea
                            </span>
                          ) : (
                            <span className="text-[#86868b]">Desconectado</span>
                          )}
                        </p>
                        {contact.hasUnread && (
                          <span className="px-1.5 py-0.2 rounded-full bg-[#2997ff] text-white text-[9px] font-bold shadow-md shadow-[#2997ff]/40 animate-pulse">
                            Nuevo
                          </span>
                        )}
                      </div>
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
        className={`flex-1 flex flex-col bg-[#0a0a0c] min-w-0 min-h-0 ${
          mobileView === 'sidebar' ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Cabecera del Chat Activo */}
        <div className="h-14 sm:h-16 px-3 sm:px-4 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {/* Botón Volver en móvil */}
            <button
              type="button"
              onClick={() => setMobileView('sidebar')}
              className="md:hidden p-2 -ml-1 rounded-xl text-[#2997ff] hover:bg-white/[0.08] active:scale-95 transition-all shrink-0 flex items-center gap-0.5"
              title="Volver a canales"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-xs font-semibold">Canales</span>
            </button>

            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-[#2997ff]/20 to-[#bf5af2]/20 border border-white/[0.1] text-[#2997ff] flex items-center justify-center font-bold shadow-md shrink-0">
              {isDirectChat ? (
                <span className="text-xs font-bold text-white">
                  {activeChannelTitle.replace(/^[^\w\s]+/, '').trim().slice(0, 2).toUpperCase() || 'DM'}
                </span>
              ) : (
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-[#2997ff]" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight leading-tight truncate">
                {isDirectChat ? activeChannelTitle : t(`chat_ch_${activeChannelId}`, activeChannelTitle)}
              </h2>
              <p className="text-[10px] sm:text-[11px] text-[#86868b] truncate">
                {isDirectChat ? activeChannelSubtitle : t(`chat_ch_${activeChannelId}_desc`, activeChannelSubtitle)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span className="text-[10px] font-semibold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-[#30d158]/10 text-[#30d158] border border-[#30d158]/20 hidden sm:inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#30d158] animate-pulse" />
              {t('chat_active_channel', 'Canal Activo')}
            </span>
            <button
              type="button"
              onClick={() => loadMessages(activeChannelId)}
              className="p-2 rounded-xl text-[#86868b] hover:text-white hover:bg-white/[0.06] active:scale-95 transition-all"
              title="Recargar conversación"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${loading ? 'animate-spin text-[#2997ff]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Historial de Mensajes */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-3 bg-gradient-to-b from-black via-[#0a0a0c] to-[#070708] relative"
        >
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
                    className={`max-w-[88%] sm:max-w-[70%] p-3 sm:p-3.5 rounded-2xl text-xs leading-relaxed shadow-lg relative group ${
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
                    <div className="flex items-center justify-end gap-1 mt-1 text-[9px] opacity-70">
                      <span>{timeStr}</span>
                      {isMine && <CheckCheck className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Botón flotante para bajar si el usuario subió */}
          {userScrolledUp && (
            <div className="sticky bottom-1 flex justify-end pointer-events-none z-10">
              <button
                type="button"
                onClick={() => {
                  setUserScrolledUp(false);
                  if (messagesContainerRef.current) {
                    messagesContainerRef.current.scrollTo({
                      top: messagesContainerRef.current.scrollHeight,
                      behavior: 'smooth',
                    });
                  }
                }}
                className="pointer-events-auto px-3 py-1.5 rounded-full bg-[#2997ff] text-white text-xs font-semibold shadow-2xl flex items-center gap-1 hover:bg-[#0071e3] active:scale-95 transition-all animate-bounce"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                <span>{t('chat_scroll_down', 'Ver nuevos')}</span>
              </button>
            </div>
          )}
        </div>

        {/* Barra de Etiquetas Rápidas */}
        <div className="px-3 sm:px-4 py-1.5 sm:py-2 border-t border-white/[0.06] bg-white/[0.01] flex items-center gap-1.5 sm:gap-2 overflow-x-auto shrink-0 scrollbar-none">
          <span className="text-[10px] text-[#86868b] uppercase tracking-wider font-semibold shrink-0 hidden xs:inline">
            {t('chat_quick_tags', 'Avisos:')}
          </span>
          <button
            type="button"
            onClick={() => setMsgType(msgType === 'urgent' ? 'text' : 'urgent')}
            className={`px-2 py-1 sm:px-2.5 rounded-lg text-[10px] font-semibold flex items-center gap-1 shrink-0 transition-all ${
              msgType === 'urgent'
                ? 'bg-[#ff453a] text-white shadow-md shadow-[#ff453a]/30'
                : 'bg-white/[0.04] text-[#ff453a] hover:bg-[#ff453a]/15 border border-[#ff453a]/30'
            }`}
          >
            <Flame className="w-3 h-3" />
            <span>{t('chat_tag_urgent', 'Urgente')}</span>
          </button>
          <button
            type="button"
            onClick={() => setMsgType(msgType === 'shift' ? 'text' : 'shift')}
            className={`px-2 py-1 sm:px-2.5 rounded-lg text-[10px] font-semibold flex items-center gap-1 shrink-0 transition-all ${
              msgType === 'shift'
                ? 'bg-[#bf5af2] text-white shadow-md shadow-[#bf5af2]/30'
                : 'bg-white/[0.04] text-[#bf5af2] hover:bg-[#bf5af2]/15 border border-[#bf5af2]/30'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>{t('chat_tag_shift', 'Turno')}</span>
          </button>
          <button
            type="button"
            onClick={() => setMsgType(msgType === 'stock_alert' ? 'text' : 'stock_alert')}
            className={`px-2 py-1 sm:px-2.5 rounded-lg text-[10px] font-semibold flex items-center gap-1 shrink-0 transition-all ${
              msgType === 'stock_alert'
                ? 'bg-[#ffd60a] text-black shadow-md shadow-[#ffd60a]/30'
                : 'bg-white/[0.04] text-[#ffd60a] hover:bg-[#ffd60a]/15 border border-[#ffd60a]/30'
            }`}
          >
            <Package className="w-3 h-3" />
            <span>{t('chat_tag_stock', 'Stock')}</span>
          </button>

          <div className="h-3 w-px bg-white/10 shrink-0 mx-0.5" />

          {/* Emojis rápidos */}
          <div className="flex items-center gap-1 shrink-0">
            {['👍', '👋', '✅', '📦', '🙏'].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setInputText((prev) => prev + emoji)}
                className="w-6 h-6 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] active:scale-90 text-xs flex items-center justify-center transition-all"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Barra de Entrada / Redacción */}
        <form onSubmit={handleSend} className="p-2 sm:p-3 border-t border-white/[0.08] bg-[#0c0c0f] flex items-center gap-2 shrink-0">
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
                : `${t('chat_placeholder_general', 'Mensaje para')} ${isDirectChat ? activeChannelTitle : t(`chat_ch_${activeChannelId}`, activeChannelTitle)}...`
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 min-w-0 bg-white/[0.05] border border-white/[0.1] rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs text-white placeholder:text-[#86868b] focus:outline-none focus:border-[#2997ff] transition-colors"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="apple-pill-btn apple-btn-primary px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-semibold flex items-center gap-1.5 shadow-lg disabled:opacity-40 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('chat_btn_send', 'Enviar')}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
