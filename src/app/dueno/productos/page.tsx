// src/app/dueno/productos/page.tsx
'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SharedProductManager } from '@/components/products/SharedProductManager';
import { useAuth } from '@/providers/AuthProvider';

export default function DuenoProductosPage() {
  const { claims } = useAuth();
  const role = claims?.role === 'programmer' ? 'programmer' : 'owner';

  return (
    <DashboardLayout role={role}>
      <SharedProductManager userRole={role} />
    </DashboardLayout>
  );
}
