// src/components/referral/ReferralLinkPanel.tsx
// Panel completo de "Mi Enlace de Referido" para todos los dashboards.
// Compatible con roles: worker (employee), owner/admin y developer (programmer).

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import {
  Link2,
  Copy,
  CheckCheck,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  Eye,
  ShoppingBag,
  DollarSign,
  AlertTriangle,
  ExternalLink,
  Loader2,
  BarChart3,
  Clock,
  Share2,
  MessageCircle,
} from 'lucide-react';

// ─── Tipos ───────────────────────────────────────────────────────────────────
interface ReferralLink {
  id: string;
  userId: string;
  userDisplayName: string;
  userRole: string;
  code: string;
  isActive: boolean;
  createdAt: string;
  regeneratedAt: string | null;
}

interface ReferralStats {
  visits: number;
  conversions: number;
  totalAmount: number;
  currency: string;
  recentSales: Array<{
    id: string;
    amount: number;
    currency: string;
    description: string;
    createdAt: string;
  }>;
}

interface ReferralLinkPanelProps {
  /** Rol del usuario que ve el panel. Ajusta etiquetas y colores. */
  role?: 'employee' | 'owner' | 'programmer';
  /** Clase CSS adicional para el contenedor raíz */
  className?: string;
}

// ─── Colores por rol ──────────────────────────────────────────────────────────
const ROLE_ACCENT: Record<string, string> = {
  employee: '#2997ff',
  owner: '#30d158',
  programmer: '#bf5af2',
};

const ROLE_LABEL: Record<string, string> = {
  employee: 'Colaborador / Empleado',
  owner: 'Dueño / Admin',
  programmer: 'Desarrollador Superadmin',
};

// ─── Componente ───────────────────────────────────────────────────────────────
export function ReferralLinkPanel({ role = 'employee', className = '' }: ReferralLinkPanelProps) {
  const { user, claims } = useAuth();
  const accent = ROLE_ACCENT[role] || '#2997ff';

  const [link, setLink] = useState<ReferralLink | null>(null);
  const [fullUrl, setFullUrl] = useState('');
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper para generar headers con token y datos de contexto
  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (user) {
      try {
        const token = await user.getIdToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
      } catch {}

      if (user.uid) headers['x-user-id'] = user.uid;
      if (user.displayName) headers['x-user-name'] = encodeURIComponent(user.displayName);
      if (user.email) headers['x-user-email'] = user.email;
    }

    const effectiveRole = claims?.role || role;
    if (effectiveRole) {
      headers['x-user-role'] = effectiveRole;
    }

    return headers;
  }, [user, claims, role]);

  // ─── Carga inicial del enlace ─────────────────────────────────────────────
  const fetchLink = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const headers = await getAuthHeaders();

      // Añadimos query params como fallback
      const qParams = new URLSearchParams();
      if (user?.uid) qParams.set('userId', user.uid);
      if (user?.displayName) qParams.set('name', user.displayName);
      qParams.set('role', claims?.role || role);

      const res = await fetch(`/api/referral-link?${qParams.toString()}`, {
        headers,
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success && data.link) {
        setLink(data.link);
        setFullUrl(data.url);
      } else {
        setError(data.error || 'Error cargando el enlace de referido.');
      }
    } catch {
      setError('Error de conexión al cargar tu enlace.');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, user, claims, role]);

  // ─── Carga de estadísticas ────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const headers = await getAuthHeaders();
      const qParams = new URLSearchParams();
      if (user?.uid) qParams.set('userId', user.uid);
      qParams.set('role', claims?.role || role);

      const res = await fetch(`/api/referral-link/stats?${qParams.toString()}`, {
        headers,
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success && data.stats) {
        setStats(data.stats);
      }
    } catch {
      // silencioso
    } finally {
      setStatsLoading(false);
    }
  }, [getAuthHeaders, user, claims, role]);

  useEffect(() => {
    fetchLink();
    fetchStats();
  }, [fetchLink, fetchStats]);

  // ─── Copiar al portapapeles ───────────────────────────────────────────────
  const handleCopy = async () => {
    if (!fullUrl) return;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback para navegadores sin Clipboard API
      const input = document.createElement('input');
      input.value = fullUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // ─── Compartir por WhatsApp ───────────────────────────────────────────────
  const handleShareWhatsApp = () => {
    if (!fullUrl) return;
    const msg = encodeURIComponent(
      `¡Hola! Te invito a comprar en Sayta Mall a través de mi enlace oficial. ¡Explora el catálogo y aprovecha las mejores ofertas aquí!\n👉 ${fullUrl}`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  // ─── Regenerar código ─────────────────────────────────────────────────────
  const handleRegenerate = async () => {
    if (!confirmRegenerate) {
      setConfirmRegenerate(true);
      return;
    }
    try {
      setRegenerating(true);
      setConfirmRegenerate(false);
      const headers = await getAuthHeaders();
      const qParams = new URLSearchParams();
      if (user?.uid) qParams.set('userId', user.uid);
      if (user?.displayName) qParams.set('name', user.displayName);
      qParams.set('role', claims?.role || role);

      const res = await fetch(`/api/referral-link/regenerate?${qParams.toString()}`, {
        method: 'POST',
        headers,
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setLink(data.link);
        setFullUrl(data.url);
      } else {
        setError(data.error || 'No se pudo regenerar el enlace.');
      }
    } catch {
      setError('Error regenerando el enlace.');
    } finally {
      setRegenerating(false);
    }
  };

  // ─── Activar / Desactivar ─────────────────────────────────────────────────
  const handleToggle = async () => {
    try {
      setToggling(true);
      const headers = await getAuthHeaders();
      const qParams = new URLSearchParams();
      if (user?.uid) qParams.set('userId', user.uid);
      qParams.set('role', claims?.role || role);

      const res = await fetch(`/api/referral-link/toggle?${qParams.toString()}`, {
        method: 'PATCH',
        headers,
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success && link) {
        setLink({ ...link, isActive: data.isActive });
      }
    } catch {
      setError('Error cambiando el estado del enlace.');
    } finally {
      setToggling(false);
    }
  };

  // ─── Formateo de moneda ───────────────────────────────────────────────────
  const formatCurrency = (amount: number, currency: string) => {
    try {
      return new Intl.NumberFormat('es-NI', {
        style: 'currency',
        currency: currency || 'NIO',
        minimumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${currency} ${amount.toFixed(2)}`;
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={`apple-card p-6 flex flex-col items-center justify-center gap-3 border-white/[0.08] ${className}`}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: accent }} />
        <span className="text-xs text-[#86868b]">Cargando tu enlace de referidos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`apple-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-white/[0.08] ${className}`}>
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-[#ff453a] shrink-0" />
          <div>
            <p className="text-xs font-semibold text-white">No se pudo cargar el programa de referidos</p>
            <p className="text-[11px] text-[#86868b]">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchLink}
          className="apple-pill-btn apple-btn-secondary px-4 py-2 text-xs font-semibold text-[#2997ff] flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reintentar</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* ── Cabecera y Enlace Principal ── */}
      <div className="apple-card p-6 space-y-5 border-white/[0.08] bg-gradient-to-br from-white/[0.03] to-transparent">
        {/* Título y badge */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: `${accent}22`, border: `1px solid ${accent}44` }}
            >
              <Link2 className="w-5 h-5" style={{ color: accent }} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">
                Mi Enlace de Referidos y Ventas
              </h3>
              <p className="text-[11px] text-[#86868b] mt-0.5">
                {link?.userDisplayName ? `Asignado a: ${link.userDisplayName}` : ROLE_LABEL[role]}
              </p>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wide flex items-center gap-1.5 transition-all ${
              link?.isActive
                ? 'bg-[#30d158]/15 text-[#30d158] border border-[#30d158]/25'
                : 'bg-[#ff453a]/15 text-[#ff453a] border border-[#ff453a]/25'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                link?.isActive ? 'bg-[#30d158] animate-pulse' : 'bg-[#ff453a]'
              }`}
            />
            {link?.isActive ? 'Enlace Activo' : 'Desactivado'}
          </span>
        </div>

        {/* Descripción informativa */}
        <p className="text-xs text-[#86868b] leading-relaxed">
          Comparte este enlace con tus clientes por WhatsApp o redes sociales. Cada compra que realicen
          usando tu link se atribuirá automáticamente a tu estación para el registro de ventas.
        </p>

        {/* Caja de URL copiable */}
        <div className="space-y-2">
          <span className="text-[10px] text-[#86868b] uppercase tracking-wider font-semibold block">
            Enlace Directo para Clientes
          </span>
          <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.1] focus-within:border-[#2997ff]/60 transition-colors">
            <code className="flex-1 text-xs text-[#2997ff] font-mono truncate px-2 select-all">
              {fullUrl || '—'}
            </code>
            <button
              onClick={handleCopy}
              disabled={!link}
              title="Copiar enlace"
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                copied
                  ? 'bg-[#30d158] text-black shadow-lg shadow-[#30d158]/20'
                  : 'bg-white/[0.1] hover:bg-white/[0.18] text-white'
              }`}
            >
              {copied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>
            <a
              href={fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-[#86868b] hover:text-white transition-colors"
              title="Abrir tienda con tu enlace"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          {copied && (
            <p className="text-xs text-[#30d158] font-medium animate-fade-in flex items-center gap-1.5">
              <CheckCheck className="w-3.5 h-3.5" />
              ¡Enlace copiado al portapapeles! Listo para enviar a tus clientes.
            </p>
          )}
        </div>

        {/* Código y estado */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#86868b] uppercase tracking-wider">Código Único:</span>
            <code className="text-sm font-bold font-mono tracking-widest text-white px-2 py-0.5 rounded-md bg-white/[0.06]">
              {link?.code || '—'}
            </code>
          </div>
          {link?.regeneratedAt && (
            <span className="text-[10px] text-[#86868b] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Actualizado: {new Date(link.regeneratedAt).toLocaleDateString('es-NI')}
            </span>
          )}
        </div>

        {/* Botones de acción principales */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          {/* Botón WhatsApp */}
          <button
            onClick={handleShareWhatsApp}
            disabled={!link || !link.isActive}
            className="apple-pill-btn px-4 py-2.5 text-xs font-semibold flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-black shadow-lg shadow-[#25D366]/20 disabled:opacity-50"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Compartir por WhatsApp</span>
          </button>

          {/* Botón Copiar Grande */}
          <button
            onClick={handleCopy}
            disabled={!link}
            className="apple-pill-btn apple-btn-primary px-4 py-2.5 text-xs font-semibold flex items-center gap-2"
          >
            {copied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '¡Copiado!' : 'Copiar Link'}</span>
          </button>

          {/* Toggle Activar/Desactivar */}
          <button
            onClick={handleToggle}
            disabled={toggling || !link}
            className="apple-pill-btn apple-btn-secondary px-3.5 py-2 text-xs font-medium flex items-center gap-1.5 text-[#86868b] hover:text-white"
          >
            {toggling ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : link?.isActive ? (
              <ToggleRight className="w-4 h-4 text-[#30d158]" />
            ) : (
              <ToggleLeft className="w-4 h-4 text-[#ff453a]" />
            )}
            <span>{link?.isActive ? 'Desactivar Enlace' : 'Activar Enlace'}</span>
          </button>

          {/* Regenerar */}
          {confirmRegenerate ? (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-[11px] text-[#ffd60a]">¿Generar nuevo código?</span>
              <button
                onClick={handleRegenerate}
                className="text-xs font-semibold text-[#ff453a] hover:underline"
              >
                Sí, generar
              </button>
              <button
                onClick={() => setConfirmRegenerate(false)}
                className="text-xs text-[#86868b] hover:underline"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmRegenerate(true)}
              disabled={regenerating || !link}
              className="apple-pill-btn apple-btn-secondary px-3 py-2 text-xs text-[#86868b] hover:text-white flex items-center gap-1.5 ml-auto"
              title="Cambiar código por uno nuevo"
            >
              {regenerating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              <span>Regenerar</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Panel de Métricas de Ventas ── */}
      <div className="apple-card p-6 space-y-4 border-white/[0.08]">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" style={{ color: accent }} />
            <h4 className="text-sm font-bold text-white">Rendimiento de tu Enlace</h4>
          </div>
          <button
            onClick={() => { fetchStats(); }}
            className="text-[11px] text-[#86868b] hover:text-white flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Actualizar métricas
          </button>
        </div>

        {statsLoading ? (
          <div className="flex items-center gap-2 py-4 justify-center">
            <Loader2 className="w-4 h-4 animate-spin text-[#86868b]" />
            <span className="text-xs text-[#86868b]">Cargando métricas...</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Visitas */}
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.06] space-y-1">
                <div className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-[#86868b]" />
                  <span className="text-[10px] text-[#86868b] uppercase tracking-wider">Visitas</span>
                </div>
                <span className="text-2xl font-bold text-white block font-mono">
                  {stats?.visits ?? 0}
                </span>
                <span className="text-[10px] text-[#86868b]">Personas que abrieron tu link</span>
              </div>

              {/* Conversiones / Ventas */}
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.06] space-y-1">
                <div className="flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-[#30d158]" />
                  <span className="text-[10px] text-[#86868b] uppercase tracking-wider">Compras</span>
                </div>
                <span className="text-2xl font-bold text-white block font-mono">
                  {stats?.conversions ?? 0}
                </span>
                <span className="text-[10px] text-[#30d158]">
                  {stats && stats.visits > 0
                    ? `${((stats.conversions / stats.visits) * 100).toFixed(1)}% tasa de éxito`
                    : 'Esperando compras'}
                </span>
              </div>

              {/* Monto generado */}
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.06] space-y-1">
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-[#2997ff]" />
                  <span className="text-[10px] text-[#86868b] uppercase tracking-wider">Total Atribuido</span>
                </div>
                <span className="text-xl font-bold block font-mono" style={{ color: accent }}>
                  {stats ? formatCurrency(stats.totalAmount, stats.currency) : 'C$ 0.00'}
                </span>
                <span className="text-[10px] text-[#86868b]">Ventas generadas</span>
              </div>
            </div>

            {/* Historial de ventas recientes */}
            {stats && stats.recentSales.length > 0 && (
              <div className="space-y-2 pt-2">
                <h5 className="text-xs font-semibold text-[#86868b] uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Ventas Recientes con tu Enlace
                </h5>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {stats.recentSales.map((sale) => (
                    <div
                      key={sale.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-white truncate">{sale.description || 'Venta atribuida'}</p>
                        <p className="text-[#86868b] text-[10px] mt-0.5">
                          {new Date(sale.createdAt).toLocaleDateString('es-NI', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <span className="font-bold font-mono shrink-0 ml-3" style={{ color: accent }}>
                        {formatCurrency(sale.amount, sale.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
