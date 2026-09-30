// src/components/auth/PhoneVerificationModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import {
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Lock,
  ArrowRight,
  RotateCcw,
  Smartphone,
  UserCheck,
} from 'lucide-react';

interface PhoneVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (phone: string) => void;
}

export function PhoneVerificationModal({ isOpen, onClose, onSuccess }: PhoneVerificationModalProps) {
  const { phoneVerified, phoneNumber: currentPhone, sendPhoneVerification, confirmPhoneVerification, user } = useAuth();

  const [countryCode, setCountryCode] = useState('+505'); // Nicaragua por defecto
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'input' | 'otp' | 'success'>('input');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [isDevBypass, setIsDevBypass] = useState(false);

  useEffect(() => {
    if (phoneVerified) {
      setStep('success');
    } else {
      setStep('input');
    }
    setError(null);
  }, [isOpen, phoneVerified]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  if (!isOpen) return null;

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanNum = phoneNumber.replace(/\D/g, '');
    if (cleanNum.length < 8) {
      setError('Por favor ingresa un número telefónico válido de al menos 8 dígitos.');
      return;
    }

    const fullPhone = `${countryCode}${cleanNum}`;

    try {
      setLoading(true);
      const res = await sendPhoneVerification(fullPhone, 'modal-recaptcha-container');
      if (res.error) {
        throw new Error(res.error);
      }
      setConfirmationResult(res.confirmationResult || null);
      setIsDevBypass(Boolean(res.devMode));
      setStep('otp');
      setCountdown(45);
    } catch (err: any) {
      setError(err.message || 'No se pudo enviar el código SMS. Verifica el número e intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!otpCode || otpCode.trim().length < 4) {
      setError('Por favor ingresa el código de 6 dígitos recibido por SMS.');
      return;
    }

    const fullPhone = `${countryCode}${phoneNumber.replace(/\D/g, '')}`;

    try {
      setLoading(true);
      await confirmPhoneVerification(confirmationResult, otpCode.trim(), fullPhone);
      setStep('success');
      if (onSuccess) onSuccess(fullPhone);
    } catch (err: any) {
      setError(err.message || 'El código es incorrecto o ha expirado. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-md apple-card p-6 sm:p-8 bg-[#161617] border-white/[0.1] rounded-3xl shadow-2xl space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Contenedor invisible para reCAPTCHA de Firebase */}
        <div id="modal-recaptcha-container" />

        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/[0.04] hover:bg-white/[0.1] text-[#86868b] hover:text-white transition-colors"
          title="Cerrar modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ─── PASO 1: Ingreso de Número ─── */}
        {step === 'input' && (
          <form onSubmit={handleSendCode} className="space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#30d158]/15 border border-[#30d158]/25 text-[#30d158] flex items-center justify-center mx-auto shadow-lg shadow-[#30d158]/10">
                <Smartphone className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Verificación de
              </h2>
              <p className="text-xs text-[#86868b] leading-relaxed">
                Vincula tu número celular verificado mediante Firebase SMS para confirmar tu identidad como persona real y natural.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-2xl bg-[#ff453a]/10 border border-[#ff453a]/20 text-[#ff453a] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-3">
              <label className="text-xs font-semibold text-white block">
                Número de Teléfono Celular
              </label>

              <div className="flex gap-2">
                {/* Selector de prefijo de país */}
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="bg-black/50 border border-white/[0.1] rounded-2xl px-3 py-3 text-xs text-white focus:outline-none focus:border-[#30d158]"
                >
                  <option value="+505">🇳🇮 +505 (Nicaragua)</option>
                  <option value="+506">🇨🇷 +506 (Costa Rica)</option>
                  <option value="+504">🇭🇳 +504 (Honduras)</option>
                  <option value="+503">🇸🇻 +503 (El Salvador)</option>
                  <option value="+502">🇬🇹 +502 (Guatemala)</option>
                  <option value="+52">🇲🇽 +52 (México)</option>
                  <option value="+1">🇺🇸 +1 (USA)</option>
                </select>

                <div className="relative flex-1">
                  <input
                    type="tel"
                    required
                    placeholder="8888 1234"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-black/50 border border-white/[0.1] rounded-2xl px-4 py-3 text-sm text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#30d158] transition-colors"
                  />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-[11px] text-[#86868b] flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#30d158] shrink-0 mt-0.5" />
                <span>
                  Te enviaremos un SMS con un código de seguridad de 6 dígitos. No compartas este código con nadie.
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full apple-pill-btn apple-btn-primary py-3 text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[#0071e3]/20 disabled:opacity-50"
            >
              {loading ? (
                <span>Enviando código SMS...</span>
              ) : (
                <>
                  <span>Enviar Código de Verificación</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ─── PASO 2: Ingreso de Código OTP ─── */}
        {step === 'otp' && (
          <form onSubmit={handleConfirmCode} className="space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#2997ff]/15 border border-[#2997ff]/25 text-[#2997ff] flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Ingresa el Código SMS
              </h2>
              <p className="text-xs text-[#86868b]">
                Código enviado a <strong className="text-white">{countryCode} {phoneNumber}</strong>
              </p>
            </div>

            {isDevBypass && (
              <div className="p-3 rounded-2xl bg-[#ffd60a]/10 border border-[#ffd60a]/20 text-[#ffd60a] text-xs flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Modo Simulación:</strong> Puedes usar el código de prueba <code className="bg-black/40 px-1.5 py-0.5 rounded font-mono font-bold">123456</code>.
                </span>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-2xl bg-[#ff453a]/10 border border-[#ff453a]/20 text-[#ff453a] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-white block text-center">
                Código de 6 Dígitos
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full bg-black/60 border border-white/[0.12] rounded-2xl px-4 py-3.5 text-center text-2xl font-mono tracking-widest text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#30d158]"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full apple-pill-btn apple-btn-primary py-3 text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[#0071e3]/20 disabled:opacity-50"
            >
              {loading ? (
                <span>Validando identidad...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#30d158]" />
                  <span>Confirmar y Verificar Identidad</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => setStep('input')}
                className="text-[#86868b] hover:text-white"
              >
                Cambiar número
              </button>

              {countdown > 0 ? (
                <span className="text-[#86868b]">Reenviar en {countdown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendCode}
                  className="text-[#2997ff] hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reenviar SMS</span>
                </button>
              )}
            </div>
          </form>
        )}

        {/* ─── PASO 3: Éxito / Verificado ─── */}
        {step === 'success' && (
          <div className="text-center space-y-5 py-4">
            <div className="w-16 h-16 rounded-full bg-[#30d158]/20 border border-[#30d158]/40 text-[#30d158] flex items-center justify-center mx-auto shadow-xl shadow-[#30d158]/20 animate-scale-in">
              <UserCheck className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#30d158] px-2.5 py-1 rounded-full bg-[#30d158]/10 border border-[#30d158]/20">
                Verificada
              </span>
              <h2 className="text-2xl font-bold text-white tracking-tight pt-2">
                ¡Cuenta Verificada con Éxito!
              </h2>
              <p className="text-xs text-[#86868b] max-w-xs mx-auto">
                Tu número celular ha sido validado correctamente en Firebase. Tu cuenta ahora goza de estatus de <strong></strong> con máxima confianza.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-xs text-white font-mono flex items-center justify-center gap-2">
              <Phone className="w-4 h-4 text-[#30d158]" />
              <span>{currentPhone || `${countryCode} ${phoneNumber}`}</span>
            </div>

            <button
              onClick={onClose}
              className="w-full apple-pill-btn apple-btn-primary py-3 text-xs font-semibold"
            >
              Entendido y Continuar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
