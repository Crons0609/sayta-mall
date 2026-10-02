// src/components/pwa/InstallPwaModal.tsx
// Modal inteligente para agregar acceso directo / PWA en Pantalla Principal para Android, iOS y Desktop.
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useAuth } from '@/providers/AuthProvider';
import {
  Smartphone,
  Share2,
  PlusSquare,
  X,
  CheckCircle2,
  Sparkles,
  Zap,
  ShoppingBag,
  ArrowRight,
  Download,
  Info,
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function InstallPwaModal() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');
  const [isStandalone, setIsStandalone] = useState(false);
  const [installedSuccessfully, setInstalledSuccessfully] = useState(false);

  // Detección de plataforma y estado standalone
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detectar si ya está corriendo como app instalada (standalone)
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(isStandaloneMode);

    // Detectar sistema operativo
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice =
      /iphone|ipad|ipod/.test(userAgent) ||
      (window.navigator.maxTouchPoints > 1 && /macintosh/.test(userAgent));
    const isAndroidDevice = /android/.test(userAgent);

    if (isIOSDevice) {
      setPlatform('ios');
    } else if (isAndroidDevice) {
      setPlatform('android');
    } else {
      setPlatform('other');
    }

    // Escuchar el evento oficial de instalación de PWA (Chrome/Edge/Samsung/Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Escuchar cuando el usuario instala la app exitosamente
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setInstalledSuccessfully(true);
      try {
        localStorage.setItem('sayta_pwa_installed', 'true');
      } catch {}
      setTimeout(() => setIsOpen(false), 3000);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Escuchar evento personalizado para abrir el modal manualmente desde cualquier botón
    const handleOpenModal = () => {
      setIsOpen(true);
    };

    window.addEventListener('sayta_open_pwa_install', handleOpenModal);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('sayta_open_pwa_install', handleOpenModal);
    };
  }, []);

  // Disparar modal automáticamente al iniciar sesión o cuando hay una nueva sesión
  useEffect(() => {
    if (typeof window === 'undefined' || isStandalone) return;

    const checkShouldPrompt = () => {
      try {
        // Si ya está instalada, no mostrar
        if (localStorage.getItem('sayta_pwa_installed') === 'true') {
          return;
        }

        // Si se acaba de iniciar sesión mediante la bandera 'sayta_show_pwa_prompt'
        const justLoggedIn = sessionStorage.getItem('sayta_show_pwa_prompt') === 'true';

        // Si el usuario tiene sesión activa y no ha cerrado el banner recientemente (3 días)
        const dismissedAt = localStorage.getItem('sayta_pwa_dismissed_at');
        const now = Date.now();
        const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
        const isCooldownOver = !dismissedAt || now - parseInt(dismissedAt, 10) > threeDaysMs;

        if (justLoggedIn || (user && isCooldownOver)) {
          // Pequeño retardo de 800ms para permitir que la página cargue suavemente
          const timer = setTimeout(() => {
            setIsOpen(true);
            sessionStorage.removeItem('sayta_show_pwa_prompt');
          }, 800);
          return () => clearTimeout(timer);
        }
      } catch {}
    };

    checkShouldPrompt();
  }, [user, isStandalone]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setInstalledSuccessfully(true);
          try {
            localStorage.setItem('sayta_pwa_installed', 'true');
          } catch {}
          setTimeout(() => setIsOpen(false), 2500);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn('[PWA] Error al solicitar instalación:', err);
      }
    }
  };

  const handleDismiss = (neverAgain = false) => {
    setIsOpen(false);
    try {
      if (neverAgain) {
        localStorage.setItem('sayta_pwa_installed', 'true'); // tratar como no molestar más
      } else {
        localStorage.setItem('sayta_pwa_dismissed_at', Date.now().toString());
      }
    } catch {}
  };

  // Si ya corre en modo standalone, no renderizar nada
  if (isStandalone || !isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div
        className="w-full sm:max-w-md bg-[#ffffff] dark:bg-[#161617] text-[#1d1d1f] dark:text-white rounded-t-3xl sm:rounded-3xl border border-black/10 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col transition-all max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera visual con Logo SaytaMall */}
        <div className="relative p-6 pb-4 bg-gradient-to-b from-purple-500/10 via-blue-500/5 to-transparent border-b border-black/[0.06] dark:border-white/[0.08]">
          <button
            onClick={() => handleDismiss(false)}
            className="absolute top-4 right-4 p-2 rounded-full text-zinc-500 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-lg shadow-purple-500/20 ring-2 ring-purple-500/30 shrink-0 bg-white">
              <Image
                src="/images/logo.png"
                alt="SaytaMall"
                width={56}
                height={56}
                className="w-full h-full object-contain p-1"
                priority
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                <Sparkles className="w-3 h-3" />
                <span>Acceso Rápido</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-zinc-950 dark:text-white mt-1">
                Instalar SaytaMall
              </h2>
              <p className="text-xs text-zinc-600 dark:text-[#86868b]">
                Agrega la tienda a tu pantalla de inicio
              </p>
            </div>
          </div>
        </div>

        {/* Contenido con instrucciones adaptadas a Android o iOS */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {installedSuccessfully ? (
            <div className="p-4 rounded-2xl bg-[#30d158]/10 border border-[#30d158]/30 text-center space-y-2 animate-fade-in">
              <div className="w-10 h-10 rounded-full bg-[#30d158]/20 text-[#059669] dark:text-[#30d158] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-zinc-950 dark:text-white">¡Acceso directo creado!</h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">
                SaytaMall ya está disponible en tu pantalla principal como una app independiente.
              </p>
            </div>
          ) : (
            <>
              {/* Beneficios clave */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#ffd60a] shrink-0" />
                  <span className="text-zinc-800 dark:text-zinc-200 font-medium">Abre en 1 toque</span>
                </div>
                <div className="p-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#0071e3] shrink-0" />
                  <span className="text-zinc-800 dark:text-zinc-200 font-medium">Pantalla completa</span>
                </div>
              </div>

              {/* Instrucciones para iOS (iPhone / iPad) */}
              {platform === 'ios' ? (
                <div className="space-y-3 pt-1">
                  <div className="p-3.5 rounded-2xl bg-blue-500/10 dark:bg-blue-500/10 border border-blue-500/20 text-xs space-y-2.5">
                    <span className="font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                      <Info className="w-4 h-4 shrink-0" />
                      Pasos para iPhone / iPad en Safari:
                    </span>
                    <ol className="space-y-2 text-zinc-700 dark:text-zinc-300 pl-1 leading-relaxed">
                      <li className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                          1
                        </span>
                        <span>
                          Toca el botón <strong>Compartir</strong>{' '}
                          <Share2 className="inline w-3.5 h-3.5 text-blue-600 dark:text-blue-400 mx-0.5" /> (en la barra inferior).
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                          2
                        </span>
                        <span>
                          Desliza hacia abajo y pulsa{' '}
                          <strong className="text-zinc-950 dark:text-white">"Agregar a inicio"</strong>{' '}
                          <PlusSquare className="inline w-3.5 h-3.5 text-blue-600 dark:text-blue-400 mx-0.5" />.
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                          3
                        </span>
                        <span>
                          Toca <strong className="text-zinc-950 dark:text-white">"Agregar"</strong> en la esquina superior derecha.
                        </span>
                      </li>
                    </ol>
                  </div>
                </div>
              ) : (
                /* Instrucciones para Android / Chrome / Otros */
                <div className="space-y-3 pt-1">
                  {deferredPrompt ? (
                    <button
                      onClick={handleInstallClick}
                      className="w-full apple-pill-btn apple-btn-primary py-3 px-4 text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#059669]/25 hover:scale-[1.01] active:scale-[0.99] transition-all"
                    >
                      <Download className="w-4 h-4" />
                      <span>Agregar a Pantalla Principal como SaytaMall</span>
                    </button>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-2">
                      <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                        <Info className="w-4 h-4 shrink-0" />
                        Pasos para Android (Chrome o navegador móvil):
                      </span>
                      <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                        Toca el menú de <strong>tres puntos (⋮)</strong> en la esquina superior derecha de tu navegador y selecciona{' '}
                        <strong className="text-zinc-950 dark:text-white">"Instalar aplicación"</strong> o{' '}
                        <strong className="text-zinc-950 dark:text-white">"Agregar a la pantalla principal"</strong>.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Pie con opciones para cerrar o no volver a preguntar */}
        <div className="p-4 border-t border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.01] flex items-center justify-between gap-3 text-xs">
          <button
            onClick={() => handleDismiss(true)}
            className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
          >
            No volver a preguntar
          </button>
          <button
            onClick={() => handleDismiss(false)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-black/[0.06] dark:bg-white/[0.08] text-zinc-800 dark:text-zinc-200 hover:bg-black/[0.1] dark:hover:bg-white/[0.15] transition-colors"
          >
            {installedSuccessfully ? 'Entendido' : 'Ahora no'}
          </button>
        </div>
      </div>
    </div>
  );
}
