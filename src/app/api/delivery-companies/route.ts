// src/app/api/delivery-companies/route.ts
// API para listar y registrar Empresas de Delivery / Envíos Locales
// Acceso de administración restringido al rol: Programador

import { NextRequest, NextResponse } from 'next/server';
import {
  getDeliveryCompaniesFromDb,
  saveDeliveryCompanyToDb,
} from '@/lib/firebase/delivery';
import { DeliveryCompany } from '@/types/delivery.types';

// Helper de verificación de permisos de Programador
function isProgrammer(request: NextRequest): boolean {
  const roleCookie = request.cookies.get('sayta_simulated_role')?.value;
  if (roleCookie === 'programmer') return true;

  // Authorization header o token
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.toLowerCase().includes('programmer')) return true;

  return false;
}

// GET: Listar empresas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const programmerMode = isProgrammer(request);
    const onlyActiveParam = searchParams.get('onlyActive');

    // Si no es programador, o si se pide explícitamente onlyActive=true, devolver solo activas
    const onlyActive = onlyActiveParam === 'true' || !programmerMode;

    const companies = await getDeliveryCompaniesFromDb(onlyActive);

    return NextResponse.json({
      success: true,
      companies,
      total: companies.length,
      mode: programmerMode ? 'admin' : 'public',
    });
  } catch (error: any) {
    console.error('[API Delivery Companies GET] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error consultando empresas de delivery.' },
      { status: 500 }
    );
  }
}

// POST: Registrar nueva empresa de delivery (Solo Programador)
export async function POST(request: NextRequest) {
  try {
    if (!isProgrammer(request)) {
      return NextResponse.json(
        { error: 'No autorizado. Solo el rol Programador puede registrar empresas de delivery.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      nombre,
      whatsapp,
      telefono,
      email,
      zonas_cobertura,
      costo_envio,
      logo,
      estado = true,
    } = body;

    // ── Validaciones ──────────────────────────────────────────────
    if (!nombre || !nombre.trim()) {
      return NextResponse.json(
        { error: 'El nombre de la empresa de delivery es obligatorio.' },
        { status: 400 }
      );
    }

    if (!whatsapp || !whatsapp.trim()) {
      return NextResponse.json(
        { error: 'El número de WhatsApp es obligatorio para enviar pedidos.' },
        { status: 400 }
      );
    }

    // Validación de formato WhatsApp internacional (ej: +50588881234 o 50588881234)
    const cleanDigits = whatsapp.replace(/\D/g, '');
    if (cleanDigits.length < 8 || cleanDigits.length > 16) {
      return NextResponse.json(
        { error: 'El formato de WhatsApp no es válido. Debe contener código de país y al menos 8 dígitos (ej: +50588881234).' },
        { status: 400 }
      );
    }

    // Parsear zonas de cobertura
    let parsedZonas: string[] = [];
    if (Array.isArray(zonas_cobertura)) {
      parsedZonas = zonas_cobertura.map((z: any) => String(z).trim()).filter(Boolean);
    } else if (typeof zonas_cobertura === 'string') {
      parsedZonas = zonas_cobertura
        .split(',')
        .map((z) => z.trim())
        .filter(Boolean);
    }

    const companyId = `del-${Date.now()}`;
    const newCompany: DeliveryCompany = {
      id: companyId,
      nombre: nombre.trim(),
      whatsapp: whatsapp.trim().startsWith('+') ? whatsapp.trim() : `+${cleanDigits}`,
      telefono: telefono ? telefono.trim() : undefined,
      email: email ? email.trim().toLowerCase() : undefined,
      zonas_cobertura: parsedZonas,
      costo_envio: Number(costo_envio) || 0,
      logo: logo ? logo.trim() : undefined,
      estado: Boolean(estado),
      deleted: false,
      orders_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const saved = await saveDeliveryCompanyToDb(newCompany);
    if (!saved) {
      throw new Error('No se pudo guardar la empresa en la base de datos.');
    }

    return NextResponse.json({
      success: true,
      message: 'Empresa de delivery registrada exitosamente.',
      company: newCompany,
    });
  } catch (error: any) {
    console.error('[API Delivery Companies POST] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error registrando empresa de delivery.' },
      { status: 500 }
    );
  }
}
