// src/components/dashboard/DashboardSettingsModal.tsx
// Modal flotante de ajustes de tema e idioma accesible desde la barra superior.
'use client';

import React from 'react';
import { useDashboardPreferences } from '@/providers/DashboardPreferencesProvider';
import { DashboardSettingsView } from './DashboardSettingsView';
import { X, Sliders } from 'lucide-react';

export function DashboardSettingsModal() {
  const { settingsModalOpen, setSettingsModalOpen, t } = useDashboardPreferences();

  if (!settingsModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="max-w-2xl w-full max-h-[90vh] bg-[#0c0c10] border border-white/[0.12] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Cabecera Modal */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2997ff]/20 text-[#2997ff] flex items-center justify-center font-bold">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {t('settings_title')}
              </h2>
              <p className="text-xs text-[#86868b]">
                {t('settings_subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSettingsModalOpen(false)}
            className="p-2 rounded-xl text-[#86868b] hover:text-white hover:bg-white/[0.08] transition-colors"
            title="Cerrar ajustes"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="p-6 overflow-y-auto flex-1">
          <DashboardSettingsView />
        </div>

        {/* Pie Modal */}
        <div className="p-4 border-t border-white/[0.08] bg-white/[0.01] flex justify-end">
          <button
            onClick={() => setSettingsModalOpen(false)}
            className="apple-pill-btn apple-btn-primary px-6 py-2 text-xs font-semibold"
          >
            {t('btn_close')}
          </button>
        </div>
      </div>
    </div>
  );
}
