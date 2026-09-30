// src/app/api/delivery-companies/[id]/route.ts
// Operaciones individuales sobre una Empresa de Delivery (GET, PATCH, DELETE)
// Restringido al rol: Programador

import { NextRequest, NextResponse } from 'next/server';
import {
  getDeliveryCompanyById,
  updateDeliveryCompanyInDb,
  deleteDeliveryCompanyFromDb,
} from '@/lib/firebase/delivery';

function isProgrammer(request: NextRequest): boolean {
  const roleCookie = request.cookies.get('sayta_simulated_role')?.value;
  if (roleCookie === 'programmer') return true;
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.toLowerCase().includes('programmer')) return true;
  return false;
}

// GET: Obtener detalle de una empresa
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const company = await getDeliveryCompanyById(id);

    if (!company) {
      return NextResponse.json(
        { error: 'Empresa de delivery no encontrada.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, company });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH / PUT: Actualizar campos de la empresa
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isProgrammer(request)) {
      return NextResponse.json(
        { error: 'No autorizado. Se requieren permisos de Programador.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await getDeliveryCompanyById(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Empresa de delivery no encontrada.' },
        { status: 404 }
      );
    }

    // Normalizar zonas si vienen en string
    let parsedZonas = existing.zonas_cobertura;
    if (body.zonas_cobertura !== undefined) {
      if (Array.isArray(body.zonas_cobertura)) {
        parsedZonas = body.zonas_cobertura.map((z: any) => String(z).trim()).filter(Boolean);
      } else if (typeof body.zonas_cobertura === 'string') {
        parsedZonas = body.zonas_cobertura.split(',').map((z: string) => z.trim()).filter(Boolean);
      }
    }

    // Normalizar whatsapp si viene en body
    let cleanWhatsapp = existing.whatsapp;
    if (body.whatsapp) {
      const cleanDigits = body.whatsapp.replace(/\D/g, '');
      if (cleanDigits.length < 8) {
        return NextResponse.json(
          { error: 'Número de WhatsApp inválido (mínimo 8 dígitos).' },
          { status: 400 }
        );
      }
      cleanWhatsapp = body.whatsapp.trim().startsWith('+') ? body.whatsapp.trim() : `+${cleanDigits}`;
    }

    const updates = {
      ...(body.nombre !== undefined && { nombre: body.nombre.trim() }),
      ...(body.whatsapp !== undefined && { whatsapp: cleanWhatsapp }),
      ...(body.telefono !== undefined && { telefono: body.telefono.trim() || undefined }),
      ...(body.email !== undefined && { email: body.email.trim().toLowerCase() || undefined }),
      ...(body.costo_envio !== undefined && { costo_envio: Number(body.costo_envio) || 0 }),
      ...(body.logo !== undefined && { logo: body.logo.trim() || undefined }),
      ...(body.estado !== undefined && { estado: Boolean(body.estado) }),
      ...(body.zonas_cobertura !== undefined && { zonas_cobertura: parsedZonas }),
    };

    const updated = await updateDeliveryCompanyInDb(id, updates);

    return NextResponse.json({
      success: true,
      message: 'Empresa de delivery actualizada exitosamente.',
      company: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Eliminar o Soft-Delete
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isProgrammer(request)) {
      return NextResponse.json(
        { error: 'No autorizado. Se requieren permisos de Programador.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const result = await deleteDeliveryCompanyFromDb(id);

    if (!result.success) {
      return NextResponse.json(
        { error: 'No se pudo eliminar la empresa de delivery.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      softDeleted: result.softDeleted,
      message: result.softDeleted
        ? 'La empresa tiene pedidos registrados en el historial; ha sido desactivada y archivada (soft-delete).'
        : 'Empresa de delivery eliminada permanentemente.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
