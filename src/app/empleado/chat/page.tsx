// src/app/empleado/chat/page.tsx
'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { EmployeeChat } from '@/components/chat/EmployeeChat';

export default function EmpleadoChatPage() {
  return (
    <DashboardLayout role="employee">
      <div className="space-y-4 animate-fade-in">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Chat Interno del Personal
          </h1>
          <p className="text-xs text-[#86868b] mt-0.5">
            Comunícate en tiempo real con tus compañeros de sucursal, consulta stock y coordina turnos.
          </p>
        </div>

        <EmployeeChat />
      </div>
    </DashboardLayout>
  );
}
