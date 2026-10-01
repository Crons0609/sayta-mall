// src/components/dashboard/QrGeneratorPanel.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useBranch } from '@/providers/BranchProvider';
import { useDashboardPreferences } from '@/providers/DashboardPreferencesProvider';
import { auth, getAuthToken } from '@/lib/firebase/client';
import QRCode from 'qrcode';
import {
  QrCode,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Clock,
} from 'lucide-react';

export function QrGeneratorPanel() {
  const { user } = useAuth();
  const { currentBranch } = useBranch();
  const { t } = useDashboardPreferences();

  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [validationUrl, setValidationUrl] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [qrType, setQrType] = useState<'dinamico' | 'fijo'>('fijo');
  const [expiresInSeconds, setExpiresInSeconds] = useState(120);

  const fetchToken = async (tipo: 'dinamico' | 'fijo' = qrType) => {
    let branchId = currentBranch?.id;
    if (!branchId) {
      try {
        const bRes = await fetch('/api/branches');
        const bData = await bRes.json();
        if (bData.branches?.length > 0) {
          branchId = bData.branches[0].id;
        }
      } catch {}
    }

    if (!branchId) return;
    setLoading(true);
    try {
      const idToken = typeof user?.getIdToken === 'function' ? await user.getIdToken() : await getAuthToken();
      const res = await fetch(
        `/api/qr/generate?sucursalId=${branchId}&tipo=${tipo}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            sucursalId: branchId,
            tipo,
          }),
        }
      );
      const data = await res.json();
      if (data.success && data.token) {
        setToken(data.token);
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const url = data.qrUrl || `${origin}/validar?sucursal=${branchId}&token=${data.token}`;
        setValidationUrl(url);
        setExpiresInSeconds(tipo === 'dinamico' ? 120 : 86400 * 30);

        try {
          const dUrl = await QRCode.toDataURL(url, {
            width: 280,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' },
          });
          setQrDataUrl(dUrl);
        } catch {
          setQrDataUrl(`https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(url)}`);
        }
      } else {
        console.warn('[QrGeneratorPanel] No se obtuvo token:', data);
      }
    } catch (err) {
      console.error('Error generating QR token:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToken(qrType);
  }, [currentBranch?.id, qrType]);

  // Contador regresivo para token dinamico
  useEffect(() => {
    if (qrType !== 'dinamico' || expiresInSeconds <= 0) return;
    const interval = setInterval(() => {
      setExpiresInSeconds((prev) => {
        if (prev <= 1) {
          fetchToken('dinamico');
          return 120;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [qrType, expiresInSeconds]);

  const handleCopy = () => {
    if (!validationUrl) return;
    navigator.clipboard.writeText(validationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayQrSrc = qrDataUrl || (validationUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(validationUrl)}` : '');

  const subtitleText = t('qr_panel_desc', 'El repartidor escanea este código al llegar a {branch} para validar el pedido y registrar el pago.')
    .replace('{branch}', currentBranch?.name || 'Sayta Mall');

  return (
    <div className="apple-card p-6 rounded-3xl border border-white/[0.08] bg-[#141518] space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#30d158]/15 border border-[#30d158]/25 text-[#30d158] flex items-center justify-center font-bold">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              {t('qr_panel_title', 'Código QR para Repartidores')}
            </h3>
            <p className="text-xs text-[#86868b]">
              {subtitleText}
            </p>
          </div>
        </div>

        {/* Tipo de QR */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.05] border border-white/[0.08] self-start sm:self-center">
          <button
            type="button"
            onClick={() => setQrType('dinamico')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              qrType === 'dinamico'
                ? 'bg-[#30d158] text-black shadow-md'
                : 'text-[#86868b] hover:text-white'
            }`}
          >
            {t('qr_type_dynamic', 'Dinámico (2 min)')}
          </button>
          <button
            type="button"
            onClick={() => setQrType('fijo')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              qrType === 'fijo'
                ? 'bg-white text-black shadow-md'
                : 'text-[#86868b] hover:text-white'
            }`}
          >
            {t('qr_type_fixed', 'Fijo (Mostrador)')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Visualizacion del QR */}
        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-black/40 border border-white/[0.06]">
          <div className="relative p-4 rounded-3xl bg-white shadow-2xl flex items-center justify-center">
            {loading ? (
              <div className="w-56 h-56 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-black animate-spin" />
              </div>
            ) : displayQrSrc ? (
              <img
                src={displayQrSrc}
                alt="QR Delivery"
                className="w-56 h-56 object-contain rounded-xl"
              />
            ) : (
              <div className="w-56 h-56 flex flex-col items-center justify-center text-black text-xs gap-2">
                <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
                <span>{t('qr_generating', 'Generando QR...')}</span>
              </div>
            )}
          </div>

          {qrType === 'dinamico' && (
            <div className="mt-4 flex items-center gap-2 text-xs text-[#86868b]">
              <Clock className="w-3.5 h-3.5 text-[#30d158]" />
              <span>
                {t('qr_auto_refresh', 'Se actualiza automáticamente en')}{' '}
                <strong className="text-white font-mono">{expiresInSeconds}s</strong>
              </span>
            </div>
          )}
        </div>

        {/* Instrucciones y Enlaces */}
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#30d158] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t('qr_security_flow', 'Flujo de Seguridad')}</span>
            </span>
            <ul className="text-xs text-[#86868b] space-y-1.5 list-disc pl-4">
              <li>{t('qr_step_1', 'El repartidor llega al mostrador y escanea este QR con su cámara.')}</li>
              <li>{t('qr_step_2', 'Ingresa su nombre y selecciona su empresa de delivery (sin contraseña).')}</li>
              <li>{t('qr_step_3', 'Selecciona al cliente de la lista de pedidos pendientes.')}</li>
              <li>{t('qr_step_4', 'Revisa la mercadería y registra el pago para completar la venta.')}</li>
            </ul>
          </div>

          {/* Enlace directo */}
          <div>
            <label className="block text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-1.5">
              {t('qr_direct_link', 'Enlace directo de validación')}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={validationUrl}
                placeholder={t('qr_generating', 'Generando enlace...')}
                className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs text-white font-mono truncate focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopy}
                disabled={!validationUrl}
                className="p-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] disabled:opacity-40 text-white transition-colors shrink-0"
                title={t('btn_copy_link', 'Copiar enlace')}
              >
                {copied ? <Check className="w-4 h-4 text-[#30d158]" /> : <Copy className="w-4 h-4" />}
              </button>
              {validationUrl ? (
                <a
                  href={validationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-[#30d158]/15 hover:bg-[#30d158]/25 text-[#30d158] transition-colors shrink-0"
                  title="Abrir como repartidor"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              ) : null}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => fetchToken(qrType)}
              disabled={loading}
              className="apple-pill-btn apple-btn-secondary px-4 py-2 text-xs font-semibold flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{t('qr_btn_regenerate', 'Regenerar Código QR Ahora')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
