// src/app/api/auth/login-email/route.ts
// Sistema de autenticación completo y robusto:
// - Programador: christhiam@ghost.com / 27478426.27478426 (único superadmin, elimina todos los anteriores)
// - Dueños / Jefes: buscados en RTDB y almacén de dueños por correo + contraseña
// - Empleados / Trabajadores: buscados en RTDB y almacén de empleados por correo + contraseña
// - Cliente: cualquier otro correo con contraseña ≥ 6 caracteres

import { NextRequest, NextResponse } from 'next/server';
import { getEmployeesFromRtdb, getOwnersFromRtdb } from '@/lib/firebase/rtdb';
import { getProgrammersFromDb } from '@/lib/firebase/programmers';
import { mockOwnersStore } from '@/app/api/owners/route';
import { localEmployees } from '@/app/api/employees/route';
import { INITIAL_EMPLOYEES } from '@/data/mockEmployees';

// ─── Credenciales del Programador (Superadmin) ───────────────────────────────
// Superadmin principal
const PROGRAMMER_EMAIL = (
  process.env.PROGRAMMER_EMAIL || 'christhiam@ghost.com'
).trim().toLowerCase();

const PROGRAMMER_PASSWORD =
  process.env.PROGRAMMER_PASSWORD || '27478426.27478426';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Por favor ingresa tu correo y contraseña.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // ── 1. Programador Superadmin Principal ─────────────────────────────────
    if (cleanEmail === PROGRAMMER_EMAIL) {
      if (password !== PROGRAMMER_PASSWORD) {
        return NextResponse.json(
          { error: 'Contraseña incorrecta para la cuenta de programador.' },
          { status: 401 }
        );
      }
      const response = NextResponse.json({
        success: true,
        role: 'programmer',
        email: cleanEmail,
        displayName: 'Programador Superadmin',
        branchIds: [],
      });
      response.cookies.set('sayta_simulated_role', 'programmer', {
        path: '/',
        maxAge: 604800,
        sameSite: 'lax',
        httpOnly: false,
      });
      response.cookies.set('sayta_user_email', cleanEmail, {
        path: '/',
        maxAge: 604800,
        sameSite: 'lax',
      });
      response.cookies.set('sayta_user_id', 'programmer-root', {
        path: '/',
        maxAge: 604800,
        sameSite: 'lax',
      });
      response.cookies.set('session', 'simulated-session-programmer', {
        path: '/',
        maxAge: 604800,
        sameSite: 'lax',
      });
      return response;
    }

    // ── 1.1 Programadores del Equipo (Registrados en Dashboard) ─────────────
    try {
      const dbProgrammers = await getProgrammersFromDb();
      const foundProgrammer = dbProgrammers.find(
        (p) => p.email.toLowerCase() === cleanEmail
      );

      if (foundProgrammer) {
        if (foundProgrammer.password !== password) {
          return NextResponse.json(
            { error: 'Contraseña incorrecta para la cuenta de programador.' },
            { status: 401 }
          );
        }

        const response = NextResponse.json({
          success: true,
          role: 'programmer',
          email: cleanEmail,
          displayName: foundProgrammer.name || 'Programador del Sistema',
          branchIds: [],
        });
        response.cookies.set('sayta_simulated_role', 'programmer', {
          path: '/',
          maxAge: 604800,
          sameSite: 'lax',
          httpOnly: false,
        });
        response.cookies.set('sayta_user_email', cleanEmail, {
          path: '/',
          maxAge: 604800,
          sameSite: 'lax',
        });
        response.cookies.set('sayta_user_id', foundProgrammer.id, {
          path: '/',
          maxAge: 604800,
          sameSite: 'lax',
        });
        response.cookies.set('session', `simulated-session-${foundProgrammer.id}`, {
          path: '/',
          maxAge: 604800,
          sameSite: 'lax',
        });
        return response;
      }
    } catch (progErr) {
      console.warn('[login] Error verificando programadores en RTDB:', progErr);
    }

    // ── 2. Dueños / Jefes ───────────────────────────────────────────────────
    let allOwners: any[] = [];
    try {
      const rtdbOwners = await getOwnersFromRtdb();
      allOwners = [...(rtdbOwners || [])];
    } catch (e) {
      console.warn('[login] Error consultando dueños en RTDB:', e);
    }

    // Combinar con mockOwnersStore en memoria
    if (Array.isArray(mockOwnersStore)) {
      mockOwnersStore.forEach((mo) => {
        if (!allOwners.some((o) => o.id === mo.id || o.email?.toLowerCase() === mo.email?.toLowerCase())) {
          allOwners.push(mo);
        }
      });
    }

    const foundOwner = allOwners.find((o: any) => {
      const oEmail = (o.email || '').trim().toLowerCase();
      if (oEmail !== cleanEmail) return false;
      const ownerPass = o.initialPassword || o.password || o.temporaryPassword;
      return ownerPass === password;
    });

    if (foundOwner) {
      if (foundOwner.status === 'suspended') {
        return NextResponse.json(
          { error: 'Tu cuenta de dueño está suspendida. Contacta al programador.' },
          { status: 403 }
        );
      }

      const response = NextResponse.json({
        success: true,
        role: 'owner',
        email: cleanEmail,
        displayName: foundOwner.name || cleanEmail.split('@')[0],
        branchIds: foundOwner.branchIds || [],
        storeName: foundOwner.storeName || 'Mi Tienda',
      });
      response.cookies.set('sayta_simulated_role', 'owner', {
        path: '/',
        maxAge: 604800,
        sameSite: 'lax',
        httpOnly: false,
      });
      response.cookies.set('sayta_user_email', cleanEmail, {
        path: '/',
        maxAge: 604800,
        sameSite: 'lax',
      });
      response.cookies.set('sayta_user_id', foundOwner.id || `owner-${Date.now()}`, {
        path: '/',
        maxAge: 604800,
        sameSite: 'lax',
      });
      response.cookies.set('session', `simulated-session-owner-${foundOwner.id}`, {
        path: '/',
        maxAge: 604800,
        sameSite: 'lax',
      });
      return response;
    }

    // ── 3. Empleados / Trabajadores ──────────────────────────────────────────
    let allEmployees: any[] = [];
    try {
      const rtdbEmployees = await getEmployeesFromRtdb();
      allEmployees = [...(rtdbEmployees || [])];
    } catch (e) {
      console.warn('[login] Error consultando empleados en RTDB:', e);
    }

    // Combinar con localEmployees y mock
    const employeeSources = [...(localEmployees || []), ...(INITIAL_EMPLOYEES || [])];
    employeeSources.forEach((emp) => {
      if (!allEmployees.some((e) => e.id === emp.id || e.email?.toLowerCase() === emp.email?.toLowerCase())) {
        allEmployees.push(emp);
      }
    });

    const foundEmployee = allEmployees.find((e: any) => {
      const eEmail = (e.email || '').trim().toLowerCase();
      if (eEmail !== cleanEmail) return false;
      const empPass = e.initialPassword || e.password;
      return empPass === password;
    });

    if (foundEmployee) {
      if (foundEmployee.suspended) {
        return NextResponse.json(
          { error: 'Tu cuenta de empleado ha sido suspendida. Contacta a tu administrador.' },
          { status: 403 }
        );
      }

      const response = NextResponse.json({
        success: true,
        role: 'employee',
        area: foundEmployee.area || 'general',
        branchIds: foundEmployee.branchId ? [foundEmployee.branchId] : (foundEmployee.branchIds || []),
        email: cleanEmail,
        displayName: foundEmployee.displayName || cleanEmail.split('@')[0],
      });
      response.cookies.set('sayta_simulated_role', 'employee', {
        path: '/',
        maxAge: 604800,
        sameSite: 'lax',
        httpOnly: false,
      });
      response.cookies.set('sayta_user_email', cleanEmail, {
        path: '/',
        maxAge: 604800,
        sameSite: 'lax',
      });
      response.cookies.set('sayta_user_id', foundEmployee.id || `emp-${Date.now()}`, {
        path: '/',
        maxAge: 604800,
        sameSite: 'lax',
      });
      response.cookies.set('sayta_user_area', foundEmployee.area || 'general', {
        path: '/',
        maxAge: 604800,
        sameSite: 'lax',
      });
      response.cookies.set('session', `simulated-session-employee-${foundEmployee.id}`, {
        path: '/',
        maxAge: 604800,
        sameSite: 'lax',
      });
      return response;
    }

    // ── 4. Cliente regular (cualquier correo con password ≥ 6) ────────────────
    if (password.length >= 6) {
      const response = NextResponse.json({
        success: true,
        role: 'customer',
        email: cleanEmail,
        displayName: cleanEmail.split('@')[0],
        branchIds: [],
      });
      response.cookies.set('sayta_simulated_role', 'customer', {
        path: '/',
        maxAge: 604800,
        sameSite: 'lax',
        httpOnly: false,
      });
      response.cookies.set('sayta_user_email', cleanEmail, {
        path: '/',
        maxAge: 604800,
        sameSite: 'lax',
      });
      response.cookies.set('session', 'simulated-session-customer', {
        path: '/',
        maxAge: 604800,
        sameSite: 'lax',
      });
      return response;
    }

    return NextResponse.json(
      { error: 'Credenciales inválidas. Verifica tu correo y contraseña.' },
      { status: 401 }
    );
  } catch (error: any) {
    console.error('[API login-email error]:', error);
    return NextResponse.json({ error: error.message || 'Error en el servidor.' }, { status: 500 });
  }
}
