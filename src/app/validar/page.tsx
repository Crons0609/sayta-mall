// src/app/validar/page.tsx
// Pantalla principal del QR delivery. El delivery escanea y llega aquí.
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { Truck, AlertCircle, CheckCircle, QrCode, Loader2, Sparkles } from 'lucide-react';
import { DeliveryLoginForm } from '@/components/delivery/DeliveryLoginForm';
import { PendingOrdersList } from '@/components/delivery/PendingOrdersList';

type Step = 'login' | 'orders' | 'success' | 'error';

function ValidarContent() {
  const searchParams = useSearchParams();
  const sucursalId = searchParams.get('sucursal') ?? '';
  const token = searchParams.get('token') ?? '';

  const [step, setStep] = useState<Step>('login');
  const [sessionId, setSessionId] = useState('');
  const [deliveryToken, setDeliveryToken] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [sessionInfo, setSessionInfo] = useState<{ nombre: string; empresaDeliveryId: string } | null>(null);
  const [lastValidated, setLastValidated] = useState<{ orderNumber: string; total: number } | null>(null);

  useEffect(() => {
    if (!sucursalId || !token) {
      setErrorMsg('Enlace QR inválido. Pide al personal de la sucursal que te muestre un código QR activo.');
      setStep('error');
    }
  }, [sucursalId, token]);

  const handleLogin = async (nombre: string, empresaDeliveryId: string) => {
    try {
      const res = await fetch('/api/qr/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sucursalId, token, nombre, empresaDeliveryId }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Error al validar el código QR');

      // Iniciar sesión anónima con el custom token emitido
      await signInWithCustomToken(auth, data.customToken);
      setSessionId(data.sessionId);
      setDeliveryToken(data.customToken);
      setSessionInfo({ nombre, empresaDeliveryId });
      setStep('orders');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al conectar con la sucursal');
      setStep('error');
    }
  };

  const handleValidated = (orderNumber: string, total: number) => {
    setLastValidated({ orderNumber, total });
    setStep('success');
  };

  if (step === 'error') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Acceso no válido</h2>
          <p className="text-sm text-[#86868b] leading-relaxed">{errorMsg}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-semibold transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (step === 'orders') {
    return (
      <PendingOrdersList
        sessionId={sessionId}
        sucursalId={sucursalId}
        sessionInfo={sessionInfo}
        onValidated={handleValidated}
      />
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6 animate-fade-in">
        <div className="max-w-sm w-full text-center space-y-5">
          <div className="w-20 h-20 rounded-3xl bg-[#30d158]/20 border border-[#30d158]/40 text-[#30d158] flex items-center justify-center mx-auto shadow-xl shadow-[#30d158]/20">
            <CheckCircle className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#30d158]">
              ¡Compra Validada y Pagada!
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Orden #{lastValidated?.orderNumber}
            </h2>
            <p className="text-lg font-mono font-bold text-[#30d158]">
              C$ {lastValidated?.total?.toLocaleString('es-NI')} NIO
            </p>
          </div>
          <p className="text-xs text-[#86868b] leading-relaxed">
            El pago fue registrado exitosamente en el sistema de la sucursal. Ya puedes retirar el paquete y proceder a la entrega al cliente.
          </p>
          <div className="pt-4 space-y-2">
            <button
              onClick={() => setStep('orders')}
              className="w-full py-4 rounded-2xl bg-[#30d158] hover:bg-[#2dba4e] text-black font-bold text-sm transition-all shadow-xl shadow-[#30d158]/20"
            >
              Ver Otros Pedidos Pendientes
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step === 'login'
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col justify-center px-6 py-12">
      <div className="max-w-sm w-full mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-[#30d158]/15 border border-[#30d158]/30 text-[#30d158] flex items-center justify-center mx-auto shadow-lg shadow-[#30d158]/10">
            <Truck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Sayta Mall Delivery</h1>
          <p className="text-xs text-[#86868b]">
            Ingreso temporal por código QR para validar y cobrar pedidos.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-[#1c1c1e] border border-white/[0.08] shadow-2xl">
          <DeliveryLoginForm onLogin={handleLogin} />
        </div>

        <p className="text-center text-[11px] text-[#6e6e73]">
          No requieres contraseña. Tu sesión vence en 30 minutos.
        </p>
      </div>
    </div>
  );
}

export default function ValidarPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#30d158] animate-spin" />
        </div>
      }
    >
      <ValidarContent />
    </Suspense>
  );
}
