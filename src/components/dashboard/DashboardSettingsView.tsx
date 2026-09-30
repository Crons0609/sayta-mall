// src/components/dashboard/DashboardSettingsView.tsx
// Vista y panel de ajustes de tema e idioma para cada usuario.
'use client';

import React, { useState } from 'react';
import {
  useDashboardPreferences,
  DASHBOARD_THEMES,
  DashboardTheme,
  DashboardLanguage,
} from '@/providers/DashboardPreferencesProvider';
import {
  Palette,
  Languages,
  Check,
  Shield,
  Sparkles,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

export function DashboardSettingsView() {
  const { theme, language, setTheme, setLanguage, t, themeConfig } = useDashboardPreferences();
  const [showSavedToast, setShowSavedToast] = useState(false);

  const handleSelectTheme = (newTheme: DashboardTheme) => {
    setTheme(newTheme);
    triggerSaved();
  };

  const handleSelectLanguage = (newLang: DashboardLanguage) => {
    setLanguage(newLang);
    triggerSaved();
  };

  const triggerSaved = () => {
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2200);
  };

  const themesList = Object.values(DASHBOARD_THEMES);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Toast de confirmación flotante */}
      {showSavedToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-2xl bg-[#30d158] text-black font-semibold text-xs flex items-center gap-2 shadow-2xl animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{t('settings_applied', '¡Ajustes guardados para tu dashboard!')}</span>
        </div>
      )}

      {/* Banner informativo de aislamiento */}
      <div className="apple-card p-5 rounded-3xl border-white/[0.08] bg-gradient-to-r from-blue-500/10 via-purple-500/5 to-transparent flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-2xl bg-[#2997ff]/20 text-[#2997ff] flex items-center justify-center shrink-0 mt-0.5">
          <Shield className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            {language === 'es' ? 'Preferencia Personalizada Aislada' : 'Isolated Personal Preferences'}
          </h4>
          <p className="text-xs text-[#86868b] leading-relaxed">
            {t('settings_notice')}
          </p>
        </div>
      </div>

      {/* ── SECCIÓN 1: TEMA VISUAL ── */}
      <div className="apple-card p-6 rounded-3xl border-white/[0.08] space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-white/[0.08]">
          <Palette className="w-5 h-5 text-[#2997ff]" />
          <div>
            <h3 className="text-sm font-bold text-white">{t('settings_theme_label')}</h3>
            <p className="text-xs text-[#86868b]">
              {language === 'es'
                ? 'Elige la paleta y tonalidad que mejor se adapte a tu comodidad visual.'
                : 'Select the color palette and tone that best suits your eyes.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
          {themesList.map((th) => {
            const isSelected = theme === th.id;
            return (
              <button
                key={th.id}
                type="button"
                onClick={() => handleSelectTheme(th.id)}
                className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#2997ff] shadow-xl shadow-[#2997ff]/10 scale-[1.02]'
                    : 'border-white/[0.08] hover:border-white/[0.2] bg-white/[0.02] hover:bg-white/[0.04]'
                }`}
                style={{ backgroundColor: th.cardBg }}
              >
                {/* Previsualización de colores */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                        style={{ backgroundColor: th.previewAccent }}
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-white/20"
                        style={{ backgroundColor: th.previewBg }}
                      />
                    </div>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-[#2997ff] text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-white mb-1">
                    {language === 'es' ? th.name : th.nameEn}
                  </h4>
                  <p className="text-[11px] text-[#86868b] leading-relaxed">
                    {language === 'es' ? th.description : th.descriptionEn}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[10px]">
                  <span className="text-[#86868b]">Acento</span>
                  <span className="font-mono font-semibold" style={{ color: th.previewAccent }}>
                    {th.previewAccent}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── SECCIÓN 2: IDIOMA DEL DASHBOARD ── */}
      <div className="apple-card p-6 rounded-3xl border-white/[0.08] space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-white/[0.08]">
          <Languages className="w-5 h-5 text-[#30d158]" />
          <div>
            <h3 className="text-sm font-bold text-white">{t('settings_lang_label')}</h3>
            <p className="text-xs text-[#86868b]">
              {language === 'es'
                ? 'Elige el idioma en el que deseas visualizar tu panel operativo.'
                : 'Choose the language you prefer for your workspace dashboard.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Opción Español */}
          <button
            type="button"
            onClick={() => handleSelectLanguage('es')}
            className={`p-3.5 sm:p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
              language === 'es'
                ? 'bg-[#30d158]/10 border-[#30d158] shadow-lg shadow-[#30d158]/10'
                : 'bg-white/[0.02] border-white/[0.08] hover:border-white/[0.18]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-xl sm:text-2xl">🇳🇮</span>
              <div>
                <h4 className="text-xs font-bold text-white">Español</h4>
                <p className="text-[10px] text-[#86868b]">Latinoamérica</p>
              </div>
            </div>
            {language === 'es' && (
              <span className="w-5 h-5 rounded-full bg-[#30d158] text-black flex items-center justify-center font-bold shrink-0">
                <Check className="w-3 h-3 stroke-[3]" />
              </span>
            )}
          </button>

          {/* Opción Inglés */}
          <button
            type="button"
            onClick={() => handleSelectLanguage('en')}
            className={`p-3.5 sm:p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
              language === 'en'
                ? 'bg-[#2997ff]/10 border-[#2997ff] shadow-lg shadow-[#2997ff]/10'
                : 'bg-white/[0.02] border-white/[0.08] hover:border-white/[0.18]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-xl sm:text-2xl">🇺🇸</span>
              <div>
                <h4 className="text-xs font-bold text-white">English</h4>
                <p className="text-[10px] text-[#86868b]">Global / US</p>
              </div>
            </div>
            {language === 'en' && (
              <span className="w-5 h-5 rounded-full bg-[#2997ff] text-white flex items-center justify-center font-bold shrink-0">
                <Check className="w-3 h-3 stroke-[3]" />
              </span>
            )}
          </button>

          {/* Opción Chino Simplificado */}
          <button
            type="button"
            onClick={() => handleSelectLanguage('zh')}
            className={`p-3.5 sm:p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
              language === 'zh'
                ? 'bg-[#ff453a]/15 border-[#ff453a] shadow-lg shadow-[#ff453a]/15'
                : 'bg-white/[0.02] border-white/[0.08] hover:border-white/[0.18]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-xl sm:text-2xl">🇨🇳</span>
              <div>
                <h4 className="text-xs font-bold text-white">中文 (简体)</h4>
                <p className="text-[10px] text-[#86868b]">简体中文 / China</p>
              </div>
            </div>
            {language === 'zh' && (
              <span className="w-5 h-5 rounded-full bg-[#ff453a] text-white flex items-center justify-center font-bold shrink-0">
                <Check className="w-3 h-3 stroke-[3]" />
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
