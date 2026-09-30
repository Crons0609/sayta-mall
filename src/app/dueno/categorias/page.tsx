// src/app/dueno/categorias/page.tsx
'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CategoryManager } from '@/components/categories/CategoryManager';
import { useAuth } from '@/providers/AuthProvider';

export default function DuenoCategoriasPage() {
  const { claims } = useAuth();
  const role = claims?.role === 'programmer' ? 'programmer' : 'owner';

  return (
    <DashboardLayout role={role}>
      <CategoryManager />
    </DashboardLayout>
  );
}
