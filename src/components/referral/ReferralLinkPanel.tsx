// src/components/referral/ReferralLinkPanel.tsx
// Panel completo de "Mi Enlace de Referido" para todos los dashboards.
// Compatible con roles: worker (employee), owner/admin y developer (programmer).

'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  employee: 'Trabajador',
  owner: 'Dueño / Admin',
  programmer: 'Desarrollador',
};

// ─── Componente ───────────────────────────────────────────────────────────────
export function ReferralLinkPanel({ role = 'employee', className = '' }: ReferralLinkPanelProps) {
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

  // ─── Carga inicial del enlace ─────────────────────────────────────────────
  const fetchLink = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/referral-link');
      const data = await res.json();
      if (data.success) {
        setLink(data.link);
        setFullUrl(data.url);
      } else {
        setError(data.error || 'Error cargando el enlace.');
      }
    } catch {
      setError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Carga de estadísticas ────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await fetch('/api/referral-link/stats');
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch {
      // silencioso
    } finally {
      setStatsLoading(false);
    }
  }, []);

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

  // ─── Regenerar código ─────────────────────────────────────────────────────
  const handleRegenerate = async () => {
    if (!confirmRegenerate) {
      setConfirmRegenerate(true);
      return;
    }
    try {
      setRegenerating(true);
      setConfirmRegenerate(false);
      const res = await fetch('/api/referral-link/regenerate', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setLink(data.link);
        setFullUrl(data.url);
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
      const res = await fetch('/api/referral-link/toggle', { method: 'PATCH' });
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
      <div className={`apple-card p-6 flex items-center justify-center gap-3 ${className}`}>
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: accent }} />
        <span className="text-sm text-[#86868b]">Cargando tu enlace de referido…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`apple-card p-6 flex items-center gap-3 ${className}`}>
        <AlertTriangle className="w-5 h-5 text-[#ff453a] shrink-0" />
        <span className="text-sm text-[#ff453a]">{error}</span>
        <button onClick={fetchLink} className="ml-auto text-xs text-[#2997ff] hover:underline">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* ── Cabecera ── */}
      <div className="apple-card p-6 space-y-5">
        {/* Título */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: `${accent}22` }}
            >
              <Link2 className="w-4.5 h-4.5" style={{ color: accent }} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">Mi Enlace de Referido</h3>
              <p className="text-[11px] text-[#86868b] mt-0.5">{ROLE_LABEL[role]}</p>
            </div>
          </div>
          {/* Badge de estado */}
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide flex items-center gap-1.5 transition-all ${
              link?.isActive
                ? 'bg-[#30d158]/15 text-[#30d158]'
                : 'bg-[#ff453a]/15 text-[#ff453a]'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                link?.isActive ? 'bg-[#30d158] animate-pulse' : 'bg-[#ff453a]'
              }`}
            />
            {link?.isActive ? 'Activo' : 'Desactivado'}
          </span>
        </div>

        {/* URL del enlace */}
        <div className="space-y-2">
          <span className="text-[11px] text-[#86868b] uppercase tracking-wider font-medium">
            Tu enlace único
          </span>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.04] border border-white/[0.08]">
            <code className="flex-1 text-xs text-white font-mono truncate select-all">
              {fullUrl || '—'}
            </code>
            <button
              onClick={handleCopy}
              disabled={!link}
              title="Copiar enlace"
              className="shrink-0 p-1.5 rounded-lg hover:bg-white/[0.08] transition-colors disabled:opacity-40"
            >
              {copied ? (
                <CheckCheck className="w-4 h-4 text-[#30d158]" />
              ) : (
                <Copy className="w-4 h-4 text-[#86868b]" />
              )}
            </button>
            <a
              href={fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 p-1.5 rounded-lg hover:bg-white/[0.08] transition-colors"
              title="Abrir enlace"
            >
              <ExternalLink className="w-4 h-4 text-[#86868b]" />
            </a>
          </div>
          {copied && (
            <p className="text-[11px] text-[#30d158] animate-fade-in">
              ✓ Enlace copiado al portapapeles
            </p>
          )}
        </div>

        {/* Código visible */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <span className="text-[11px] text-[#86868b] uppercase tracking-wider">Código:</span>
          <code
            className="text-sm font-bold font-mono tracking-widest"
            style={{ color: accent }}
          >
            {link?.code || '—'}
          </code>
          {link?.regeneratedAt && (
            <span className="ml-auto text-[10px] text-[#86868b] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Regenerado: {new Date(link.regeneratedAt).toLocaleDateString('es-NI')}
            </span>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {/* Copiar */}
          <button
            onClick={handleCopy}
            disabled={!link}
            className="apple-pill-btn apple-btn-primary px-4 py-2 text-xs font-semibold flex items-center gap-2 shadow-lg"
            style={{ '--btn-accent': accent } as React.CSSProperties}
          >
            {copied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copiado' : 'Copiar Enlace'}
          </button>

          {/* Toggle activo/inactivo */}
          <button
            onClick={handleToggle}
            disabled={toggling || !link}
            className="apple-pill-btn apple-btn-secondary px-4 py-2 text-xs font-semibold flex items-center gap-2"
          >
            {toggling ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : link?.isActive ? (
              <ToggleRight className="w-3.5 h-3.5 text-[#30d158]" />
            ) : (
              <ToggleLeft className="w-3.5 h-3.5 text-[#ff453a]" />
            )}
            {link?.isActive ? 'Desactivar' : 'Activar'}
          </button>

          {/* Regenerar */}
          {confirmRegenerate ? (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#ffd60a]">¿Confirmar regeneración?</span>
              <button
                onClick={handleRegenerate}
                className="text-xs font-semibold text-[#ff453a] hover:underline"
              >
                Sí, regenerar
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
              className="apple-pill-btn apple-btn-secondary px-4 py-2 text-xs font-semibold flex items-center gap-2"
            >
              {regenerating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              Regenerar Código
            </button>
          )}
        </div>

        <p className="text-[11px] text-[#86868b] leading-relaxed pt-1 border-t border-white/[0.05]">
          Comparte tu enlace y cada venta realizada a través de él se atribuirá automáticamente a tu perfil.
          La atribución usa la regla de <strong className="text-white/60">último clic</strong> — la cookie
          se actualiza con el enlace más reciente visitado y tiene una vigencia de <strong className="text-white/60">30 días</strong>.
        </p>
      </div>

      {/* ── Panel de Métricas ── */}
      <div className="apple-card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" style={{ color: accent }} />
            <h4 className="text-sm font-bold text-white">Métricas de Rendimiento</h4>
          </div>
          <button
            onClick={() => { fetchStats(); }}
            className="text-[11px] text-[#86868b] hover:text-white flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Actualizar
          </button>
        </div>

        {statsLoading ? (
          <div className="flex items-center gap-2 py-4 justify-center">
            <Loader2 className="w-4 h-4 animate-spin text-[#86868b]" />
            <span className="text-xs text-[#86868b]">Cargando métricas…</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              {/* Visitas */}
              <div className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.06] space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-[#86868b]" />
                  <span className="text-[10px] text-[#86868b] uppercase tracking-wider">Visitas</span>
                </div>
                <span className="text-2xl font-bold text-white block font-mono">
                  {stats?.visits ?? 0}
                </span>
                <span className="text-[10px] text-[#86868b]">Últimos 30 días</span>
              </div>

              {/* Conversiones */}
              <div className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.06] space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-[#86868b]" />
                  <span className="text-[10px] text-[#86868b] uppercase tracking-wider">Ventas</span>
                </div>
                <span className="text-2xl font-bold text-white block font-mono">
                  {stats?.conversions ?? 0}
                </span>
                <span className="text-[10px] text-[#86868b]">
                  {stats && stats.visits > 0
                    ? `${((stats.conversions / stats.visits) * 100).toFixed(1)}% conv.`
                    : '—'}
                </span>
              </div>

              {/* Monto generado */}
              <div className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.06] space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-[#86868b]" />
                  <span className="text-[10px] text-[#86868b] uppercase tracking-wider">Monto</span>
                </div>
                <span className="text-lg font-bold block font-mono" style={{ color: accent }}>
                  {stats ? formatCurrency(stats.totalAmount, stats.currency) : '—'}
                </span>
                <span className="text-[10px] text-[#86868b]">Total generado</span>
              </div>
            </div>

            {/* Historial de ventas recientes */}
            {stats && stats.recentSales.length > 0 && (
              <div className="space-y-2 pt-2">
                <h5 className="text-xs font-semibold text-[#86868b] uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Ventas Recientes Atribuidas
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

            {stats && stats.recentSales.length === 0 && (
              <div className="text-center py-6 space-y-2">
                <TrendingUp className="w-8 h-8 text-[#86868b]/40 mx-auto" />
                <p className="text-xs text-[#86868b]">
                  Aún no hay ventas atribuidas a tu enlace.
                </p>
                <p className="text-[11px] text-[#86868b]/70">
                  Comparte tu enlace para comenzar a generar conversiones.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
