// src/app/dueno/ajustes/page.tsx
'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DashboardSettingsView } from '@/components/dashboard/DashboardSettingsView';
import { useDashboardPreferences } from '@/providers/DashboardPreferencesProvider';

function DuenoAjustesContent() {
  const { t } = useDashboardPreferences();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          {t('settings_title')}
        </h1>
        <p className="text-xs text-[#86868b] mt-0.5">
          {t('settings_subtitle')}
        </p>
      </div>

      <DashboardSettingsView />
    </div>
  );
}

export default function DuenoAjustesPage() {
  return (
    <DashboardLayout role="owner">
      <DuenoAjustesContent />
    </DashboardLayout>
  );
}
