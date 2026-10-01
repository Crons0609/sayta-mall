// src/app/api/qr/generate/route.ts
// Genera un token QR dinamico (2 min) o retorna el token fijo de la sucursal.
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { generateDynamicQrToken, getOrCreateFixedQrToken } from '@/lib/firebase/qr-tokens';

const ALLOWED_ROLES = ['employee', 'owner', 'programmer'];
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://sayta-mall.onrender.com';

async function handleGenerate(req: NextRequest, sucursalId: string | null, tipo: string = 'dinamico') {
  try {
    let uid = '';
    let role = '';

    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace('Bearer ', '').trim();

    if (idToken && !idToken.startsWith('simulated-')) {
      try {
        const decoded = await adminAuth.verifyIdToken(idToken);
        uid = decoded.uid;
        role = (decoded.role || (decoded as any).rol || '') as string;
      } catch (tokenErr) {
        console.warn('[QR Generate] Token verify failed, falling back to cookie session:', tokenErr);
      }
    }

    const roleCookie = req.cookies.get('sayta_simulated_role')?.value;
    const userCookie = req.cookies.get('sayta_user_id')?.value;

    if (!role) {
      if (roleCookie && ALLOWED_ROLES.includes(roleCookie)) {
        role = roleCookie;
        uid = userCookie || 'simulated-employee';
      }
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Sin permiso para generar QR' }, { status: 403 });
    }

    if (!sucursalId) {
      return NextResponse.json({ error: 'sucursalId requerido' }, { status: 400 });
    }

    let tokenData: any;
    if (tipo === 'fijo') {
      tokenData = await getOrCreateFixedQrToken(sucursalId, uid);
    } else {
      tokenData = await generateDynamicQrToken(sucursalId, uid);
    }

    const qrUrl = `${BASE_URL}/validar?sucursal=${sucursalId}&token=${tokenData.token}`;

    return NextResponse.json({
      success: true,
      qrUrl,
      token: tokenData.token,
      tipo: tokenData.tipo,
      expiraAt: tokenData.expiraAt?.toMillis?.() ?? null,
    });
  } catch (err: any) {
    console.error('[QR Generate Handler]', err);
    return NextResponse.json({ error: err.message || 'Error generando QR' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sucursalId = searchParams.get('sucursalId');
  const tipo = searchParams.get('tipo') || 'dinamico';
  return handleGenerate(req, sucursalId, tipo);
}

export async function POST(req: NextRequest) {
  let sucursalId: string | null = null;
  let tipo: string = 'dinamico';

  try {
    const body = await req.json();
    sucursalId = body?.sucursalId || null;
    tipo = body?.tipo || 'dinamico';
  } catch {
    const { searchParams } = new URL(req.url);
    sucursalId = searchParams.get('sucursalId');
    tipo = searchParams.get('tipo') || 'dinamico';
  }

  return handleGenerate(req, sucursalId, tipo);
}
