// src/app/empleado/chat/page.tsx
'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { EmployeeChat } from '@/components/chat/EmployeeChat';
import { useAuth } from '@/providers/AuthProvider';
import { useDashboardPreferences } from '@/providers/DashboardPreferencesProvider';

export default function EmpleadoChatPage() {
  const { t } = useDashboardPreferences();
  const { claims } = useAuth();
  const role = claims?.role === 'programmer' ? 'programmer' : claims?.role === 'owner' ? 'owner' : 'employee';

  return (
    <DashboardLayout role={role}>
      <div className="space-y-4 animate-fade-in">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {t('chat_title', 'Chat Interno del Personal')}
          </h1>
          <p className="text-xs text-[#86868b] mt-0.5">
            {t('chat_desc', 'Comunícate en tiempo real con tus compañeros de sucursal, consulta stock y coordina turnos.')}
          </p>
        </div>

        <EmployeeChat />
      </div>
    </DashboardLayout>
  );
}
