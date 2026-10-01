// src/components/qr/BranchQrManager.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { getAuthToken } from '@/lib/firebase/client';
import { useBranch } from '@/providers/BranchProvider';
import QRCode from 'qrcode';
import {
  QrCode,
  RefreshCw,
  Download,
  Printer,
  Maximize2,
  Minimize2,
  ShieldAlert,
  ShieldCheck,
  Power,
  Clock,
  History,
  Store,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Smartphone,
  Eye,
  Sliders,
} from 'lucide-react';
import type { BranchQrConfig, QrScanRecord } from '@/types/qr-admin.types';

function formatDate(val: any): string {
  if (!val) return 'Reciente';
  if (typeof val === 'object' && 'toDate' in val && typeof val.toDate === 'function') {
    return val.toDate().toLocaleString();
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? 'Reciente' : d.toLocaleString();
}

export function BranchQrManager() {
  const { user } = useAuth();
  const { branches, currentBranch, setBranchId } = useBranch();

  const selectedBranchId = currentBranch?.id || (branches.length > 0 ? branches[0].id : '');
  const activeBranch = branches.find((b) => b.id === selectedBranchId) || currentBranch;

  // Estados del QR
  const [config, setConfig] = useState<BranchQrConfig | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrSvgUrl, setQrSvgUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [showRotateConfirm, setShowRotateConfirm] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expiresInSeconds, setExpiresInSeconds] = useState(120);
  const [scans, setScans] = useState<QrScanRecord[]>([]);
  const [loadingScans, setLoadingScans] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const fullScreenRef = useRef<HTMLDivElement>(null);

  // Obtener URL de validación completa
  const appOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const validationUrl = token && selectedBranchId
    ? `${appOrigin}/validar?sucursal=${selectedBranchId}&token=${token}`
    : '';

  // 1. Cargar token y configuración
  const loadBranchQr = async () => {
    if (!selectedBranchId) return;
    setLoading(true);
    try {
      const idToken = await getAuthToken();
      const res = await fetch(`/api/qr/admin?sucursalId=${selectedBranchId}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
        setToken(data.token);
        if (data.config?.qrModo === 'dinamico') {
          setExpiresInSeconds(data.config?.qrVigenciaSeg || 120);
        }
      }
    } catch (err) {
      console.error('Error al cargar QR de sucursal:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar historial de escaneos
  const loadScanHistory = async () => {
    if (!selectedBranchId) return;
    setLoadingScans(true);
    try {
      const idToken = await getAuthToken();
      const res = await fetch(`/api/qr/admin?sucursalId=${selectedBranchId}&history=true`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.scans)) {
        setScans(data.scans);
      }
    } catch (err) {
      console.error('Error al cargar historial de escaneos:', err);
    } finally {
      setLoadingScans(false);
    }
  };

  useEffect(() => {
    loadBranchQr();
    loadScanHistory();
  }, [selectedBranchId]);

  // 2. Generar Data URLs (PNG y SVG) con alta corrección de errores (H)
  useEffect(() => {
    if (!validationUrl) {
      setQrDataUrl('');
      setQrSvgUrl('');
      return;
    }

    QRCode.toDataURL(validationUrl, {
      errorCorrectionLevel: 'H',
      width: 480,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Error generating QR PNG:', err));

    QRCode.toString(validationUrl, {
      type: 'svg',
      errorCorrectionLevel: 'H',
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((svg) => {
        const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        setQrSvgUrl(URL.createObjectURL(blob));
      })
      .catch((err) => console.error('Error generating QR SVG:', err));
  }, [validationUrl]);

  // 3. Temporizador de cuenta regresiva y renovación automática (solo si es dinámico)
  useEffect(() => {
    if (config?.qrModo !== 'dinamico' || !config?.qrActivo || expiresInSeconds <= 0) return;
    const interval = setInterval(() => {
      setExpiresInSeconds((prev) => {
        if (prev <= 1) {
          loadBranchQr();
          return config.qrVigenciaSeg || 120;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [config?.qrModo, config?.qrActivo, expiresInSeconds]);

  // 4. Rotar Token (Invalidación inmediata)
  const handleRotateToken = async () => {
    if (!selectedBranchId) return;
    setRotating(true);
    try {
      const idToken = await getAuthToken();
      const res = await fetch('/api/qr/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          action: 'rotate',
          sucursalId: selectedBranchId,
          tipo: config?.qrModo || 'dinamico',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setToken(data.token);
        setShowRotateConfirm(false);
        setStatusMessage('Token rotado exitosamente. El anterior ha sido revocado.');
        setTimeout(() => setStatusMessage(''), 4000);
        loadScanHistory();
      }
    } catch (err) {
      console.error('Error rotando token:', err);
    } finally {
      setRotating(false);
    }
  };

  // 5. Activar / Desactivar QR
  const handleToggleActive = async () => {
    if (!selectedBranchId || !config) return;
    try {
      const idToken = await getAuthToken();
      const newStatus = !config.qrActivo;
      const res = await fetch('/api/qr/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          action: 'toggle',
          sucursalId: selectedBranchId,
          activo: newStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setConfig({ ...config, qrActivo: newStatus });
      }
    } catch (err) {
      console.error('Error toggling QR:', err);
    }
  };

  // 6. Cambiar modalidad (dinámico vs fijo)
  const handleChangeModo = async (newModo: 'dinamico' | 'fijo') => {
    if (!selectedBranchId || !config || config.qrModo === newModo) return;
    try {
      const idToken = await getAuthToken();
      const res = await fetch('/api/qr/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          action: 'updateConfig',
          sucursalId: selectedBranchId,
          qr_modo: newModo,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setConfig({ ...config, qrModo: newModo });
        loadBranchQr();
      }
    } catch (err) {
      console.error('Error changing QR mode:', err);
    }
  };

  // Descargas e Impresión
  const handleDownloadPng = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR_${activeBranch?.name || 'Sucursal'}_${new Date().toISOString().slice(0, 10)}.png`;
    a.click();
  };

  const handleDownloadSvg = () => {
    if (!qrSvgUrl) return;
    const a = document.createElement('a');
    a.href = qrSvgUrl;
    a.download = `QR_${activeBranch?.name || 'Sucursal'}_${new Date().toISOString().slice(0, 10)}.svg`;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyUrl = () => {
    if (!validationUrl) return;
    navigator.clipboard.writeText(validationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isDinamico = config?.qrModo === 'dinamico';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Selector de Sucursal y Acciones Superiores */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-[#141518] border border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#30d158]/15 border border-[#30d158]/30 text-[#30d158] flex items-center justify-center font-bold">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Códigos QR de Sucursal</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.08] text-[#86868b] font-mono">
                ADMIN
              </span>
            </h2>
            <p className="text-xs text-[#86868b]">
              Gestiona, rota, imprime y monitorea los accesos de validación QR para repartidores.
            </p>
          </div>
        </div>

        {/* Dropdown de sucursales */}
        {branches.length > 1 && (
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-[#86868b]" />
            <select
              value={selectedBranchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="bg-black/50 border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2997ff]"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {statusMessage && (
        <div className="p-3.5 rounded-2xl bg-[#30d158]/15 border border-[#30d158]/30 text-[#30d158] text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Grid Principal: Visor QR + Controles */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Visor del Código QR (7 cols) */}
        <div
          ref={fullScreenRef}
          className={`lg:col-span-7 apple-card p-6 sm:p-8 rounded-3xl border border-white/[0.08] bg-[#141518] flex flex-col items-center justify-center text-center relative ${
            isFullScreen ? 'fixed inset-0 z-50 rounded-none bg-black flex flex-col justify-center' : ''
          }`}
        >
          {/* Header del visor */}
          <div className="w-full flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  config?.qrActivo ? 'bg-[#30d158] animate-pulse' : 'bg-[#ff453a]'
                }`}
              />
              <span className="text-xs font-bold text-white">
                {config?.qrActivo ? 'QR Activo y Validable' : 'QR Inactivo (Bloqueado)'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.06] text-[#86868b] uppercase font-mono">
                {config?.qrModo === 'dinamico' ? 'Dinámico' : 'Fijo Impreso'}
              </span>
            </div>

            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-[#86868b] hover:text-white transition-colors"
              title={isFullScreen ? 'Salir de pantalla completa' : 'Pantalla completa para mostrador'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Caja del Código QR */}
          <div className="relative p-6 sm:p-8 bg-white rounded-3xl shadow-2xl border-4 border-white my-3 flex items-center justify-center">
            {loading ? (
              <div className="w-64 h-64 flex flex-col items-center justify-center text-black">
                <RefreshCw className="w-8 h-8 animate-spin text-[#2997ff]" />
                <span className="text-xs font-semibold mt-3">Generando token seguro...</span>
              </div>
            ) : qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Código QR de Sucursal"
                className="w-60 h-60 sm:w-72 sm:h-72 object-contain"
              />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center text-[#ff453a]">
                <AlertTriangle className="w-8 h-8" />
              </div>
            )}
          </div>

          {/* Barra de cuenta regresiva si es dinámico */}
          {isDinamico && config?.qrActivo && (
            <div className="w-full max-w-xs mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-[#86868b]">
                <span className="flex items-center gap-1 font-medium">
                  <Clock className="w-3 h-3 text-[#30d158]" />
                  Renovación automática
                </span>
                <span className="font-mono text-white font-bold">{expiresInSeconds}s</span>
              </div>
              <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#30d158] to-[#2997ff] transition-all duration-1000"
                  style={{
                    width: `${Math.max(0, (expiresInSeconds / (config?.qrVigenciaSeg || 120)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Subtítulo informativo */}
          <p className="text-xs text-[#86868b] mt-4 max-w-sm">
            El repartidor escanea este código con la cámara nativa de su teléfono para ingresar a la lista de validación de pedidos en proceso.
          </p>

          {/* Botones de Descarga e Impresión */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mt-6 w-full">
            <button
              onClick={handleDownloadPng}
              disabled={!qrDataUrl}
              className="apple-pill-btn bg-white/[0.08] hover:bg-white/[0.14] text-white px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 border border-white/[0.1] transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar PNG</span>
            </button>
            <button
              onClick={handleDownloadSvg}
              disabled={!qrSvgUrl}
              className="apple-pill-btn bg-white/[0.08] hover:bg-white/[0.14] text-white px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 border border-white/[0.1] transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Vector SVG</span>
            </button>
            <button
              onClick={handlePrint}
              disabled={!qrDataUrl}
              className="apple-pill-btn bg-[#2997ff] hover:bg-[#1d82e2] text-white px-4 py-2 text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-[#2997ff]/20 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Plantilla Oficial</span>
            </button>
          </div>
        </div>

        {/* Columna Derecha: Configuración, Rotación y Seguridad (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Modalidad del QR */}
          <div className="apple-card p-5 rounded-3xl border border-white/[0.08] bg-[#141518] space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#2997ff]" />
                <span>Modalidad de Emisión</span>
              </h3>
              <button
                onClick={handleToggleActive}
                className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  config?.qrActivo
                    ? 'bg-[#30d158]/15 text-[#30d158] border border-[#30d158]/30 hover:bg-[#30d158]/25'
                    : 'bg-[#ff453a]/15 text-[#ff453a] border border-[#ff453a]/30 hover:bg-[#ff453a]/25'
                }`}
              >
                <Power className="w-3 h-3" />
                <span>{config?.qrActivo ? 'Activo' : 'Desactivado'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleChangeModo('dinamico')}
                className={`p-3 rounded-2xl text-left border transition-all ${
                  config?.qrModo === 'dinamico'
                    ? 'bg-[#2997ff]/15 border-[#2997ff]/40 text-white shadow-lg shadow-[#2997ff]/10'
                    : 'bg-white/[0.02] border-white/[0.06] text-[#86868b] hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">QR Dinámico</span>
                  {config?.qrModo === 'dinamico' && <ShieldCheck className="w-3.5 h-3.5 text-[#2997ff]" />}
                </div>
                <p className="text-[10px] leading-relaxed">
                  Recomendado para mostrador en pantalla. Caduca cada 120s y se renueva solo.
                </p>
              </button>

              <button
                onClick={() => handleChangeModo('fijo')}
                className={`p-3 rounded-2xl text-left border transition-all ${
                  config?.qrModo === 'fijo'
                    ? 'bg-[#2997ff]/15 border-[#2997ff]/40 text-white shadow-lg shadow-[#2997ff]/10'
                    : 'bg-white/[0.02] border-white/[0.06] text-[#86868b] hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">QR Fijo Impreso</span>
                  {config?.qrModo === 'fijo' && <ShieldCheck className="w-3.5 h-3.5 text-[#2997ff]" />}
                </div>
                <p className="text-[10px] leading-relaxed">
                  Token permanente para afiches en caja. Permite rotación manual con un toque.
                </p>
              </button>
            </div>
          </div>

          {/* Rotación y Revocación Inmediata */}
          <div className="apple-card p-5 rounded-3xl border border-white/[0.08] bg-[#141518] space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-[#ff9f0a]" />
              <span>Rotación Criptográfica de Token</span>
            </h3>
            <p className="text-xs text-[#86868b] leading-relaxed">
              Si sospechas que el QR impreso fue fotografiado o compartido indebidamente fuera de la sucursal, puedes rotarlo de inmediato. El QR anterior dejará de funcionar en el acto.
            </p>

            <button
              onClick={() => setShowRotateConfirm(true)}
              className="w-full py-2.5 rounded-xl font-semibold text-xs text-[#ff9f0a] bg-[#ff9f0a]/10 hover:bg-[#ff9f0a]/20 border border-[#ff9f0a]/30 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Regenerar / Rotar Token Ahora</span>
            </button>
          </div>

          {/* Enlace y Metadatos */}
          <div className="apple-card p-5 rounded-3xl border border-white/[0.08] bg-[#141518] space-y-3 text-xs">
            <span className="font-bold text-white uppercase tracking-wider block text-[11px]">
              Enlace de Validación Generado
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={validationUrl}
                className="w-full px-3 py-2 bg-black/50 border border-white/[0.1] rounded-xl text-[11px] font-mono text-[#86868b] truncate"
              />
              <button
                onClick={handleCopyUrl}
                className="p-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white shrink-0 transition-colors"
                title="Copiar enlace"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-[#30d158]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.06] text-[11px] text-[#86868b]">
              <div>
                <span>Última rotación:</span>
                <span className="block text-white font-mono mt-0.5">
                  {formatDate(config?.qrRotadoAt)}
                </span>
              </div>
              <div>
                <span>Sesión delivery:</span>
                <span className="block text-white font-mono mt-0.5">
                  {config?.sesionDeliveryMin || 120} minutos
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Historial de Escaneos */}
      <div className="apple-card p-6 rounded-3xl border border-white/[0.08] bg-[#141518] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#2997ff]" />
            <h3 className="text-sm font-bold text-white">Registro de Escaneos Recientes</h3>
          </div>
          <button
            onClick={loadScanHistory}
            className="text-xs text-[#86868b] hover:text-white flex items-center gap-1 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${loadingScans ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>

        {scans.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#86868b] rounded-2xl bg-white/[0.02] border border-white/[0.04]">
            No hay registros de escaneos aún para esta sucursal.
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] text-[#86868b] uppercase tracking-wider text-[10px]">
                  <th className="pb-3 font-semibold">Repartidor</th>
                  <th className="pb-3 font-semibold">Empresa Delivery</th>
                  <th className="pb-3 font-semibold">Dispositivo / IP</th>
                  <th className="pb-3 font-semibold">Fecha y Hora</th>
                  <th className="pb-3 font-semibold text-right">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {scans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 font-semibold text-white">
                      {scan.deliveryNombre || 'Anónimo'}
                    </td>
                    <td className="py-3 text-[#86868b]">
                      {scan.empresaDeliveryNombre || scan.empresaDeliveryId || 'N/A'}
                    </td>
                    <td className="py-3 font-mono text-[11px] text-[#86868b]">
                      {scan.dispositivo || 'Móvil'} {scan.ip ? `· ${scan.ip}` : ''}
                    </td>
                    <td className="py-3 font-mono text-[11px] text-[#86868b]">
                      {formatDate(scan.fecha)}
                    </td>
                    <td className="py-3 text-right">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          scan.resultado === 'valido'
                            ? 'bg-[#30d158]/15 text-[#30d158] border border-[#30d158]/20'
                            : scan.resultado === 'vencido'
                            ? 'bg-[#ff9f0a]/15 text-[#ff9f0a] border border-[#ff9f0a]/20'
                            : 'bg-[#ff453a]/15 text-[#ff453a] border border-[#ff453a]/20'
                        }`}
                      >
                        {scan.resultado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Confirmación de Dos Pasos para Rotación */}
      {showRotateConfirm && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#1c1c1e] border border-white/[0.1] shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#ff9f0a]/20 text-[#ff9f0a] flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">¿Confirmas la rotación del código QR?</h3>
              <p className="text-xs text-[#86868b] mt-1.5 leading-relaxed">
                Esta acción invalidará de inmediato el QR activo de <strong className="text-white">{activeBranch?.name}</strong>. Si tienes un QR impreso en caja o en cartelería física, dejará de funcionar y deberás imprimir el nuevo.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRotateConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#86868b] hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRotateToken}
                disabled={rotating}
                className="apple-pill-btn bg-[#ff9f0a] hover:bg-[#e08c07] text-black px-4 py-2 text-xs font-bold transition-all shadow-lg shadow-[#ff9f0a]/20 flex items-center gap-1.5"
              >
                {rotating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Rotar e Invalidar Anterior</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PLANTILLA DE IMPRESIÓN OFICIAL (Visible solo en impresión) */}
      <div className="hidden print:block p-8 bg-white text-black max-w-lg mx-auto text-center font-sans">
        <div className="border-4 border-black p-8 rounded-3xl space-y-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black uppercase tracking-tight">SAYTA MALL</h1>
            <p className="text-sm font-bold text-gray-700">SUPER AHORRO Y TODO AQUÍ</p>
            <div className="h-0.5 bg-black w-32 mx-auto my-2" />
            <h2 className="text-xl font-bold text-gray-900">{activeBranch?.name}</h2>
            <p className="text-xs text-gray-500 font-mono">ID: {selectedBranchId}</p>
          </div>

          <div className="my-6 flex justify-center">
            {qrDataUrl && (
              <img
                src={qrDataUrl}
                alt="QR de Validación"
                className="w-72 h-72 border-2 border-black p-2"
              />
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-black uppercase">Área Exclusiva de Repartidores</h3>
            <p className="text-xs text-gray-700 leading-relaxed max-w-xs mx-auto">
              1. Abre la cámara de tu teléfono móvil.<br />
              2. Escanea este código para validar tus pedidos asignados.<br />
              3. Elige tu cliente y registra el pago en caja.
            </p>
          </div>

          <p className="text-[10px] text-gray-400 font-mono pt-4 border-t border-gray-200">
            Sayta Mall · Documento Oficial de Sucursal · {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}

