// src/components/branch/StoreInPreparation.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Clock, LogIn, Store } from 'lucide-react';

export function StoreInPreparation() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="apple-card max-w-xl w-full p-8 sm:p-12 text-center space-y-6 animate-fade-in border-white/[0.1] shadow-2xl">
        {/* Icono Apple */}
        <div className="w-16 h-16 rounded-3xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto text-[#2997ff]">
          <Store className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ffd60a]/15 text-[#ffd60a] text-xs font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>Tienda en Preparación</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            Muy pronto abriremos nuestras puertas.
          </h2>
          <p className="text-sm text-[#86868b] leading-relaxed max-w-md mx-auto">
            Estamos configurando nuestras sucursales e inventario para brindarte la mejor experiencia de compra, super ahorro y entregas express en tu ciudad.
          </p>
        </div>

        <div className="pt-4 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/login"
            className="apple-pill-btn apple-btn-primary px-6 py-2.5 text-xs font-semibold w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Acceso Administrativo</span>
          </Link>
        </div>

        <p className="text-[11px] text-[#6e6e73]">
          ¿Eres dueño o administrador? Inicia sesión con Google para configurar tu primera sucursal.
        </p>
      </div>
    </div>
  );
}
