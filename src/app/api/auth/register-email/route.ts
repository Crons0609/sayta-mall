// src/app/api/auth/register-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function POST(req: NextRequest) {
  try {
    const { email, password, displayName, age } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Correo y contraseña son obligatorios.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe contener al menos 6 caracteres.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const name = displayName?.trim() || cleanEmail.split('@')[0];
    const parsedAge = age ? parseInt(String(age), 10) : null;

    if (parsedAge !== null && (isNaN(parsedAge) || parsedAge < 12 || parsedAge > 120)) {
      return NextResponse.json(
        { error: 'Por favor ingresa una edad válida (entre 12 y 120 años).' },
        { status: 400 }
      );
    }

    let uid = `user-${Date.now()}`;

    // Si Firebase Admin está configurado
    if (adminAuth) {
      try {
        const userRecord = await adminAuth.createUser({
          email: cleanEmail,
          password,
          displayName: name,
        });
        uid = userRecord.uid;

        // Custom claim como cliente
        await adminAuth.setCustomUserClaims(uid, {
          role: 'customer',
          branchIds: [],
          suspended: false,
        });

        if (adminDb) {
          await adminDb.collection('users').doc(uid).set({
            uid,
            email: cleanEmail,
            displayName: name,
            role: 'customer',
            age: parsedAge,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      } catch (authError: any) {
        if (authError.code === 'auth/email-already-exists') {
          return NextResponse.json(
            { error: 'Este correo ya se encuentra registrado. Inicia sesión.' },
            { status: 409 }
          );
        }
        console.warn('Firebase Admin register fallback:', authError.message);
      }
    }

    const response = NextResponse.json({
      success: true,
      role: 'customer',
      email: cleanEmail,
      displayName: name,
      age: parsedAge,
      uid,
      message: 'Cuenta creada exitosamente.',
    });

    response.cookies.set('sayta_simulated_role', 'customer', {
      path: '/',
      maxAge: 604800,
      sameSite: 'lax',
    });
    response.cookies.set('sayta_user_email', cleanEmail, {
      path: '/',
      maxAge: 604800,
      sameSite: 'lax',
    });
    if (parsedAge) {
      response.cookies.set('sayta_user_age', String(parsedAge), {
        path: '/',
        maxAge: 604800,
        sameSite: 'lax',
      });
    }

    return response;
  } catch (error: any) {
    console.error('Error in /api/auth/register-email:', error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar el registro.' },
      { status: 500 }
    );
  }
}
