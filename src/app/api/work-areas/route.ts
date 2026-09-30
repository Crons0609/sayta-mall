// src/app/api/work-areas/route.ts
// API para listar, crear y eliminar áreas de trabajo personalizadas

import { NextRequest, NextResponse } from 'next/server';
import {
  getWorkAreasFromDb,
  saveWorkAreaToDb,
  deleteWorkAreaFromDb,
} from '@/lib/firebase/work-areas';

export async function GET() {
  try {
    const areas = await getWorkAreasFromDb();
    return NextResponse.json({ success: true, areas });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'El nombre del área de trabajo es obligatorio.' },
        { status: 400 }
      );
    }

    const saved = await saveWorkAreaToDb(name.trim());
    return NextResponse.json({
      success: true,
      message: `Área "${saved.name}" agregada exitosamente.`,
      area: saved,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID de área de trabajo requerido.' },
        { status: 400 }
      );
    }

    const deleted = await deleteWorkAreaFromDb(id);
    if (!deleted) {
      return NextResponse.json(
        { error: 'No se puede eliminar un área predeterminada del sistema.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Área personalizada eliminada correctamente.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
