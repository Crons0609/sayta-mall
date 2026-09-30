// src/components/auth/AgeVerificationModal.tsx
'use client';

import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, X, Lock, Heart } from 'lucide-react';

interface AgeVerificationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const SESSION_KEY = 'sayta_age_verified';

/** Verifica si el usuario ya confirmó su mayoría de edad en esta sesión */
export function hasAgeVerified(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(SESSION_KEY) === 'true';
}

/** Marca la sesión como verificada (adulto confirmado) */
export function setAgeVerified(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SESSION_KEY, 'true');
}

export function AgeVerificationModal({ isOpen, onConfirm, onCancel }: AgeVerificationModalProps) {
  const [confirmed, setConfirmed] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!confirmed) return;
    setAgeVerified();
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-lg"
        onClick={onCancel}
      />
      {/* Modal */}
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#1a0a1e] to-[#0d0010] border border-[#bf5af2]/30 rounded-3xl shadow-2xl shadow-[#bf5af2]/10 overflow-hidden animate-fade-in">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#bf5af2]/20 blur-3xl pointer-events-none rounded-full" />
        <div className="relative px-6 pt-8 pb-4 text-center">
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-[#86868b] hover:text-white transition-all"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-[#bf5af2]/30 to-[#9b3cc7]/20 border border-[#bf5af2]/40 flex items-center justify-center shadow-lg shadow-[#bf5af2]/20">
            <span className="text-2xl font-black text-[#bf5af2]">🔞</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#bf5af2]/15 border border-[#bf5af2]/30 text-[#bf5af2] text-[11px] font-semibold mb-3">
            <Lock className="w-3 h-3" />
            <span>Contenido para Adultos — Solo +18</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Verificación de Edad</h2>
          <p className="mt-2 text-xs text-[#86868b] leading-relaxed max-w-sm mx-auto">
            Esta sección contiene productos íntimos exclusivamente para adultos.
            Para acceder debes confirmar que tienes <strong className="text-white">18 años o más</strong>.
          </p>
        </div>
        <div className="mx-6 mb-4 p-3 rounded-xl bg-[#ffd60a]/[0.07] border border-[#ffd60a]/20 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-[#ffd60a] mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-[#ffd60a]/90 leading-relaxed">
            El acceso por menores de 18 años está <strong>estrictamente prohibido</strong>.
            Al continuar, confirmas bajo tu responsabilidad que eres mayor de edad.
          </p>
        </div>
        <div className="mx-6 mb-6">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-0.5 flex-shrink-0">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="sr-only peer"
                id="age-confirm-checkbox"
              />
              <div
                className="w-5 h-5 rounded-md border-2 border-[#bf5af2]/40 transition-all flex items-center justify-center"
                style={{ background: confirmed ? '#bf5af2' : 'rgba(255,255,255,0.03)', borderColor: confirmed ? '#bf5af2' : 'rgba(191,90,242,0.4)' }}
                onClick={() => setConfirmed(!confirmed)}
              >
                {confirmed && <ShieldCheck className="w-3 h-3 text-white" />}
              </div>
            </div>
            <span className="text-[12px] text-[#86868b] group-hover:text-[#f5f5f7] transition-colors leading-relaxed">
              Confirmo que tengo <strong className="text-white">18 años o más</strong> y acepto ver
              contenido para adultos de carácter íntimo y personal.
            </span>
          </label>
        </div>
        <div className="px-6 pb-7 flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={handleConfirm}
            disabled={!confirmed}
            className={`flex-1 py-3 rounded-2xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              confirmed
                ? 'bg-[#bf5af2] text-white hover:bg-[#a348d6] shadow-lg shadow-[#bf5af2]/30 active:scale-95'
                : 'bg-white/[0.04] text-[#6e6e73] cursor-not-allowed'
            }`}
          >
            <Heart className="w-4 h-4" />
            Soy mayor de 18 años — Ingresar
          </button>
          <button
            onClick={onCancel}
            className="flex-1 sm:flex-initial py-3 sm:px-5 rounded-2xl text-sm font-medium bg-white/[0.04] border border-white/[0.08] text-[#86868b] hover:text-white hover:bg-white/[0.08] transition-all"
          >
            Cancelar
          </button>
        </div>
        <div className="px-6 pb-5 text-center">
          <p className="text-[10px] text-[#3d3d3f] leading-relaxed">
            Sayta Mall promueve el uso responsable y legal de productos para adultos.
            Esta verificación es de buena fe. El titular del local no se hace responsable del uso indebido.
          </p>
        </div>
      </div>
    </div>
  );
}
