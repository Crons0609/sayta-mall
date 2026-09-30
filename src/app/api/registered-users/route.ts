// src/app/api/registered-users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { readRtdb, writeRtdb } from '@/lib/firebase/rtdb';
import { getProgrammersFromDb, ROOT_PROGRAMMER_EMAIL, ROOT_PROGRAMMER_PASSWORD } from '@/lib/firebase/programmers';
import { mockOwnersStore } from '@/app/api/owners/route';
import { localEmployees } from '@/app/api/employees/route';
import { INITIAL_EMPLOYEES } from '@/data/mockEmployees';

export interface FullRegisteredUser {
  uid: string;
  displayName: string;
  email: string;
  role: 'programmer' | 'owner' | 'employee' | 'customer';
  age: number | null;
  direccion: string;
  password?: string;
  passwordModified?: boolean;
  passwordModifiedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  phone?: string;
  branchName?: string;
  area?: string;
}

// Usuarios de muestra con fechas variadas (años y meses) para enriquecer el panel del Programador
const SEED_CUSTOMERS: FullRegisteredUser[] = [
  {
    uid: 'cust-1001',
    displayName: 'Sofía Elena Mendoza',
    email: 'sofia.mendoza@gmail.com',
    role: 'customer',
    age: 27,
    direccion: 'Reparto San Juan, Casa #142, Managua',
    password: 'SofiaPass2026!*',
    passwordModified: true,
    passwordModifiedAt: '2026-03-12T14:30:00.000Z',
    createdAt: '2026-01-10T10:15:00.000Z',
    phone: '+505 8899-1122',
  },
  {
    uid: 'cust-1002',
    displayName: 'Carlos Alberto Rugama',
    email: 'carlos.rugama@yahoo.com',
    role: 'customer',
    age: 34,
    direccion: 'Barrio El Coyolar, del Parque San Juan 2c al lago, León',
    password: 'RugamaLeon99.',
    passwordModified: false,
    passwordModifiedAt: null,
    createdAt: '2026-02-18T16:45:00.000Z',
    phone: '+505 8744-5566',
  },
  {
    uid: 'cust-1003',
    displayName: 'Valeria Beatriz Fonseca',
    email: 'valeria.fonseca@outlook.com',
    role: 'customer',
    age: 22,
    direccion: 'Calle Real Xalteva, de la Capilla 1c al sur, Granada',
    password: 'Granada*2026',
    passwordModified: true,
    passwordModifiedAt: '2026-03-28T09:12:00.000Z',
    createdAt: '2026-03-05T11:20:00.000Z',
    phone: '+505 8655-4433',
  },
  {
    uid: 'cust-1004',
    displayName: 'Marcos Antonio Blandón',
    email: 'marcos.blandon@gmail.com',
    role: 'customer',
    age: 41,
    direccion: 'Costado oeste de la Catedral, Estelí',
    password: 'BlandonEsteli#41',
    passwordModified: false,
    passwordModifiedAt: null,
    createdAt: '2025-11-20T15:10:00.000Z',
    phone: '+505 8233-7788',
  },
  {
    uid: 'cust-1005',
    displayName: 'Daniela Lucia Jarquín',
    email: 'daniela.jarquin@gmail.com',
    role: 'customer',
    age: 29,
    direccion: 'Villa Tiscapa, Módulo C-12, Managua',
    password: 'ManaguaSecure!89',
    passwordModified: true,
    passwordModifiedAt: '2025-12-05T18:22:00.000Z',
    createdAt: '2025-08-14T09:40:00.000Z',
    phone: '+505 8922-3344',
  },
  {
    uid: 'cust-1006',
    displayName: 'José Ricardo Palacios',
    email: 'jose.palacios@hotmail.com',
    role: 'customer',
    age: 38,
    direccion: 'Barrio Monimbó, Frente a la Escuela Folklórica, Masaya',
    password: 'MonimboMasaya#24',
    passwordModified: false,
    passwordModifiedAt: null,
    createdAt: '2025-05-19T13:00:00.000Z',
    phone: '+505 8111-9988',
  },
  {
    uid: 'cust-1007',
    displayName: 'Alejandra María Toruño',
    email: 'alejandra.toruno@gmail.com',
    role: 'customer',
    age: 25,
    direccion: 'Bello Horizonte, VI Etapa, Grupo M, Casa #19, Managua',
    password: 'AleToru2024!',
    passwordModified: false,
    passwordModifiedAt: null,
    createdAt: '2024-10-10T14:00:00.000Z',
    phone: '+505 8777-6655',
  },
  {
    uid: 'cust-1008',
    displayName: 'Kevin Eduardo Zamora',
    email: 'kevin.zamora@gmail.com',
    role: 'customer',
    age: 31,
    direccion: 'Salida a Jinotega, Km 132, Matagalpa',
    password: 'ZamoraMata24..',
    passwordModified: true,
    passwordModifiedAt: '2024-12-02T16:15:00.000Z',
    createdAt: '2024-04-12T10:00:00.000Z',
    phone: '+505 8444-2211',
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filterRole = searchParams.get('role');
    const filterYear = searchParams.get('year');
    const filterMonth = searchParams.get('month');
    const search = searchParams.get('search')?.toLowerCase().trim();

    const userMap = new Map<string, FullRegisteredUser>();

    // 1. Root Programmer Superadmin
    userMap.set('prog-root', {
      uid: 'prog-root-christhiam',
      displayName: 'Christhiam Developer (Superadmin)',
      email: ROOT_PROGRAMMER_EMAIL,
      role: 'programmer',
      age: 26,
      direccion: 'Managua, Nicaragua · Oficina Central de Tecnología',
      password: ROOT_PROGRAMMER_PASSWORD,
      passwordModified: false,
      passwordModifiedAt: null,
      createdAt: '2024-01-10T08:00:00.000Z',
      phone: '+505 8888-0000',
      branchName: 'Sede Central',
      area: 'Desarrollo de Software & Arquitectura',
    });

    // 2. Programadores de RTDB & DB
    try {
      const dbProgs = await getProgrammersFromDb();
      dbProgs.forEach((p) => {
        if (p.email.toLowerCase() !== ROOT_PROGRAMMER_EMAIL.toLowerCase()) {
          const progId = p.id;
          userMap.set(progId, {
            uid: progId,
            displayName: p.name || 'Programador',
            email: p.email,
            role: 'programmer',
            age: 25,
            direccion: 'Sede Sayta Mall · Área de TI',
            password: p.password || 'Prog2026.Sayta',
            passwordModified: false,
            passwordModifiedAt: null,
            createdAt: p.createdAt || '2025-06-01T00:00:00.000Z',
            branchName: 'Sede Central',
            area: p.roleTitle || 'Ingeniería de Software',
          });
        }
      });
    } catch (e) {
      console.warn('Error reading programmers for registry:', e);
    }

    // 3. Dueños / Jefes de RTDB y Store
    try {
      const rtdbOwners = await readRtdb<Record<string, any>>('owners');
      const allOwners = [
        ...(mockOwnersStore || []),
        ...(rtdbOwners ? Object.values(rtdbOwners) : []),
      ];
      allOwners.forEach((o) => {
        const uid = o.uid || o.id || o.email;
        if (!userMap.has(uid)) {
          userMap.set(uid, {
            uid,
            displayName: o.name || o.displayName || 'Dueño de Sucursal',
            email: o.email,
            role: 'owner',
            age: o.age || 38,
            direccion: o.address || o.direccion || (o.storeName ? `Sucursal ${o.storeName}` : 'Managua, Nicaragua'),
            password: o.initialPassword || o.password || o.temporaryPassword || 'Duenno2026!*',
            passwordModified: o.passwordModified || false,
            passwordModifiedAt: o.passwordModifiedAt || null,
            createdAt: o.createdAt || '2025-03-15T10:00:00.000Z',
            phone: o.phone || '',
            branchName: o.storeName || 'Sayta Mall Central',
            area: 'Gerencia y Operaciones',
          });
        }
      });
    } catch (e) {
      console.warn('Error reading owners for registry:', e);
    }

    // 4. Empleados de RTDB y memoria local
    try {
      const rtdbEmployees = await readRtdb<Record<string, any>>('employees');
      const allEmployees = [
        ...(localEmployees || []),
        ...(INITIAL_EMPLOYEES || []),
        ...(rtdbEmployees ? Object.values(rtdbEmployees) : []),
      ];
      allEmployees.forEach((emp) => {
        const uid = emp.uid || emp.id || emp.email;
        if (!userMap.has(uid)) {
          userMap.set(uid, {
            uid,
            displayName: emp.displayName || emp.name || 'Empleado',
            email: emp.email,
            role: 'employee',
            age: emp.age || emp.edad || 28,
            direccion: emp.direccion || emp.address || (emp.branchName ? `Sucursal ${emp.branchName}` : 'Managua, Nicaragua'),
            password: emp.initialPassword || emp.password || 'Empleado2026!',
            passwordModified: emp.passwordModified || false,
            passwordModifiedAt: emp.passwordModifiedAt || null,
            createdAt: emp.createdAt || '2025-04-10T12:00:00.000Z',
            phone: emp.phone || '',
            branchName: emp.branchName || 'Sucursal Principal',
            area: emp.area || 'Ventas',
          });
        }
      });
    } catch (e) {
      console.warn('Error reading employees for registry:', e);
    }

    // 5. Clientes registrados en RTDB
    try {
      const rtdbRegistered = await readRtdb<Record<string, any>>('registered_users');
      if (rtdbRegistered && typeof rtdbRegistered === 'object') {
        Object.values(rtdbRegistered).forEach((u: any) => {
          if (u && (u.uid || u.email)) {
            const uid = u.uid || u.email;
            userMap.set(uid, {
              uid,
              displayName: u.displayName || u.email.split('@')[0],
              email: u.email,
              role: u.role || 'customer',
              age: u.age || null,
              direccion: u.direccion || u.address || 'Sin dirección',
              password: u.password || '••••••••',
              passwordModified: Boolean(u.passwordModified),
              passwordModifiedAt: u.passwordModifiedAt || null,
              createdAt: u.createdAt || new Date().toISOString(),
              phone: u.phone || '',
            });
          }
        });
      }
    } catch (e) {
      console.warn('Error reading registered_users from RTDB:', e);
    }

    // 6. Merge con SEED_CUSTOMERS para garantizar variedad histórica
    SEED_CUSTOMERS.forEach((seed) => {
      if (!userMap.has(seed.uid)) {
        userMap.set(seed.uid, seed);
      }
    });

    let users = Array.from(userMap.values());

    // Filtrar por rol
    if (filterRole && filterRole !== 'all') {
      users = users.filter((u) => u.role === filterRole);
    }

    // Filtrar por año
    if (filterYear && filterYear !== 'all') {
      users = users.filter((u) => {
        if (!u.createdAt) return false;
        const d = new Date(u.createdAt);
        return d.getFullYear().toString() === filterYear;
      });
    }

    // Filtrar por mes (1-12)
    if (filterMonth && filterMonth !== 'all') {
      const mInt = parseInt(filterMonth, 10);
      users = users.filter((u) => {
        if (!u.createdAt) return false;
        const d = new Date(u.createdAt);
        return d.getMonth() + 1 === mInt;
      });
    }

    // Filtrar por búsqueda
    if (search) {
      users = users.filter(
        (u) =>
          u.displayName.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search) ||
          (u.direccion && u.direccion.toLowerCase().includes(search)) ||
          (u.branchName && u.branchName.toLowerCase().includes(search)) ||
          (u.area && u.area.toLowerCase().includes(search))
      );
    }

    // Ordenar de más reciente a más antiguo
    users.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    return NextResponse.json({
      success: true,
      total: users.length,
      users,
    });
  } catch (error: any) {
    console.error('Error in /api/registered-users GET:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener usuarios registrados.' },
      { status: 500 }
    );
  }
}

// Actualizar contraseña de un usuario o marcar modificación
export async function PATCH(req: NextRequest) {
  try {
    const { uid, newPassword } = await req.json();
    if (!uid || !newPassword) {
      return NextResponse.json(
        { error: 'UID y nueva contraseña son obligatorios.' },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();

    // Actualizar en RTDB registered_users
    await writeRtdb(`registered_users/${uid}/password`, newPassword);
    await writeRtdb(`registered_users/${uid}/passwordModified`, true);
    await writeRtdb(`registered_users/${uid}/passwordModifiedAt`, nowIso);
    await writeRtdb(`registered_users/${uid}/updatedAt`, nowIso);

    return NextResponse.json({
      success: true,
      message: 'Contraseña actualizada y registrada como modificada.',
      passwordModifiedAt: nowIso,
    });
  } catch (error: any) {
    console.error('Error in /api/registered-users PATCH:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar contraseña.' },
      { status: 500 }
    );
  }
}
