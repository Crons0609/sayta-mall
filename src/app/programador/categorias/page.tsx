// src/app/programador/categorias/page.tsx
'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CategoryManager } from '@/components/categories/CategoryManager';

export default function ProgramadorCategoriasPage() {
  return (
    <DashboardLayout role="programmer">
      <CategoryManager />
    </DashboardLayout>
  );
}
