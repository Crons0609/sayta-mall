// src/app/api/programmers/route.ts
// Endpoint para gestionar programadores del sistema (superadmin console)

import { NextRequest, NextResponse } from 'next/server';
import {
  getProgrammersFromDb,
  saveProgrammerToDb,
  deleteProgrammerFromDb,
  ROOT_PROGRAMMER_EMAIL,
} from '@/lib/firebase/programmers';

export async function GET(request: NextRequest) {
  try {
    const programmers = await getProgrammersFromDb();
    
    // Devolvemos la lista omitiendo la contraseña completa por seguridad
    const safeList = programmers.map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      roleTitle: p.roleTitle,
      createdAt: p.createdAt,
      isRoot: p.isRoot || p.email.toLowerCase() === ROOT_PROGRAMMER_EMAIL,
    }));

    return NextResponse.json({ success: true, programmers: safeList });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, roleTitle } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'El nombre del programador es obligatorio.' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Ingresa un correo electrónico válido.' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === ROOT_PROGRAMMER_EMAIL) {
      return NextResponse.json(
        { error: 'No se puede registrar otro usuario con el correo del superadmin principal.' },
        { status: 400 }
      );
    }

    // Verificar si ya existe
    const existing = await getProgrammersFromDb();
    if (existing.some((p) => p.email.toLowerCase() === cleanEmail)) {
      return NextResponse.json(
        { error: `Ya existe un programador con el correo ${cleanEmail}.` },
        { status: 400 }
      );
    }

    const newProg = await saveProgrammerToDb({
      name: name.trim(),
      email: cleanEmail,
      password: password.trim(),
      roleTitle: roleTitle?.trim() || 'Programador de Software',
    });

    return NextResponse.json({
      success: true,
      message: `Programador ${newProg.name} registrado con éxito.`,
      programmer: {
        id: newProg.id,
        name: newProg.name,
        email: newProg.email,
        roleTitle: newProg.roleTitle,
        createdAt: newProg.createdAt,
        isRoot: false,
      },
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
        { error: 'ID de programador requerido.' },
        { status: 400 }
      );
    }

    const deleted = await deleteProgrammerFromDb(id);
    if (!deleted) {
      return NextResponse.json(
        { error: 'No se puede eliminar este usuario o es el superadmin raíz protegido.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Acceso de programador revocado exitosamente.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
