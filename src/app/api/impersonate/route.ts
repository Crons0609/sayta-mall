// src/app/api/impersonate/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ownerId, name, email, storeName } = body;

    if (!ownerId) {
      return NextResponse.json({ success: false, error: 'ID de dueño requerido' }, { status: 400 });
    }

    const impersonationData = JSON.stringify({
      id: ownerId,
      name: name || 'Dueño',
      email: email || '',
      storeName: storeName || 'Tienda Sayta',
    });

    const response = NextResponse.json({
      success: true,
      message: `Modo soporte activado. Viendo como ${name}`,
      redirectUrl: '/dueno/dashboard',
    });

    // Establecer cookies
    response.cookies.set('sayta_simulated_role', 'owner', {
      path: '/',
      maxAge: 60 * 60 * 2, // 2 horas
      sameSite: 'lax',
    });

    response.cookies.set('sayta_impersonating_owner', impersonationData, {
      path: '/',
      maxAge: 60 * 60 * 2,
      sameSite: 'lax',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: 'Modo soporte finalizado. Regresando a superadmin.',
    redirectUrl: '/programador/duenos',
  });

  // Restaurar rol de programador
  response.cookies.set('sayta_simulated_role', 'programmer', {
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
  });

  // Eliminar cookie de impersonación
  response.cookies.set('sayta_impersonating_owner', '', {
    path: '/',
    maxAge: 0,
  });

  return response;
}
