// src/app/empleado/productos/page.tsx
'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SharedProductManager } from '@/components/products/SharedProductManager';

export default function EmpleadoProductosPage() {
  return (
    <DashboardLayout role="employee">
      <SharedProductManager userRole="employee" />
    </DashboardLayout>
  );
}
