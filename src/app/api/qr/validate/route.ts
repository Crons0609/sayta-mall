// src/app/api/qr/validate/route.ts
// Valida el token QR y crea una sesión temporal anónima para el delivery.
import { NextRequest, NextResponse } from 'next/server';
import { validateQrAndCreateSession } from '@/lib/firebase/qr-tokens';
import { getDeliveryCompanyById } from '@/lib/firebase/delivery';

export async function POST(req: NextRequest) {
  try {
    const { sucursalId, token, nombre, empresaDeliveryId } = await req.json();

    if (!sucursalId || !token) return NextResponse.json({ error: 'Parámetros incompletos' }, { status: 400 });
    if (!nombre?.trim()) return NextResponse.json({ error: 'Por favor ingresa tu nombre' }, { status: 400 });
    if (!empresaDeliveryId) return NextResponse.json({ error: 'Selecciona tu empresa de delivery' }, { status: 400 });

    const empresa = await getDeliveryCompanyById(empresaDeliveryId);
    if (!empresa) return NextResponse.json({ error: 'Empresa de delivery no encontrada' }, { status: 400 });

    const session = await validateQrAndCreateSession(
      sucursalId, token, nombre.trim(),
      empresaDeliveryId, empresa.nombre
    );

    return NextResponse.json({
      success: true,
      sessionId: session.sessionId,
      customToken: session.customToken,
      expiraAt: session.expiraAt,
    });
  } catch (err: any) {
    console.error('[QR Validate POST]', err);
    const code = err.message === 'QR_EXPIRADO' ? 'QR_EXPIRADO' : err.message === 'QR_INVALIDO' ? 'QR_INVALIDO' : 'ERROR';
    const msg = code === 'QR_EXPIRADO' ? 'El código QR ha expirado. Pide uno nuevo al empleado.' 
              : code === 'QR_INVALIDO' ? 'Código QR inválido o ya utilizado.' 
              : (err.message || 'Error al validar QR');
    return NextResponse.json({ error: msg, code }, { status: 400 });
  }
}
