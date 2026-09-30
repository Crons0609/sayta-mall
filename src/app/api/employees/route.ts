// src/app/api/employees/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, isFirebaseAdminConfigured } from '@/lib/firebase/admin';
import { INITIAL_EMPLOYEES, EmployeeRecord } from '@/data/mockEmployees';
import { EMPLOYEE_AREAS, EmployeeArea } from '@/lib/constants';
import { saveEmployeeToRtdb, getEmployeesFromRtdb, writeRtdb, deleteFromRtdb } from '@/lib/firebase/rtdb';

// Almacén en memoria para desarrollo local
export let localEmployees: EmployeeRecord[] = [...INITIAL_EMPLOYEES];

export async function GET(request: NextRequest) {
  try {
    // 1. Obtener de Firebase Realtime Database
    const rtdbEmployees = await getEmployeesFromRtdb();

    // 2. Si Firebase Admin está configurado, leer de Firestore
    let firestoreEmployees: EmployeeRecord[] = [];
    if (isFirebaseAdminConfigured && adminDb) {
      try {
        const snapshot = await adminDb
          .collection('users')
          .where('role', '==', 'employee')
          .get();

        if (!snapshot.empty) {
          firestoreEmployees = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              displayName: data.displayName || 'Sin nombre',
              email: data.email,
              role: 'employee',
              area: (data.area as EmployeeArea) || 'general',
              branchId: (data.branchIds && data.branchIds[0]) || 'branch-central',
              branchName: data.branchName || 'Sayta Central',
              suspended: data.suspended === true,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
              phone: data.phone || '',
            };
          });
        }
      } catch (e) {}
    }

    // Combinar sin duplicados
    const map = new Map<string, EmployeeRecord>();
    localEmployees.forEach((e) => map.set(e.id, e));
    firestoreEmployees.forEach((e) => map.set(e.id, e));
    rtdbEmployees.forEach((e) => map.set(e.id, e));

    return NextResponse.json({ success: true, employees: Array.from(map.values()) });
  } catch (error: any) {
    console.error('[API Employees GET] Error:', error);
    return NextResponse.json({ success: true, employees: localEmployees });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { displayName, email, password, area, branchId, branchName, phone } = body;

    // Validaciones
    if (!email || !password || !area || !branchId) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios: correo, contraseña, área y sucursal son requeridos.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres.' },
        { status: 400 }
      );
    }

    if (!area || typeof area !== 'string' || !area.trim()) {
      return NextResponse.json(
        { error: 'Por favor selecciona o ingresa un área de trabajo válida.' },
        { status: 400 }
      );
    }

    let newUid = `emp-${Date.now()}`;

    // Si Firebase Admin está configurado, creamos el usuario en Auth y Firestore
    if (isFirebaseAdminConfigured && adminAuth && adminDb) {
      try {
        const userRecord = await adminAuth.createUser({
          email: email.trim().toLowerCase(),
          password,
          displayName: displayName || email.split('@')[0],
        });
        newUid = userRecord.uid;

        // Custom claims
        await adminAuth.setCustomUserClaims(newUid, {
          role: 'employee',
          branchIds: [branchId],
          area,
          suspended: false,
        });

        // Documento en Firestore
        await adminDb.collection('users').doc(newUid).set({
          uid: newUid,
          email: email.trim().toLowerCase(),
          displayName: displayName || email.split('@')[0],
          photoURL: null,
          role: 'employee',
          branchIds: [branchId],
          branchName: branchName || 'Sayta Central',
          area,
          suspended: false,
          phone: phone || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } catch (authError: any) {
        console.warn('[API Employees POST] Firebase Admin aviso:', authError.message);
      }
    }

    const newEmployee: EmployeeRecord = {
      id: newUid,
      displayName: displayName || email.split('@')[0],
      email: email.trim().toLowerCase(),
      role: 'employee',
      area: area as EmployeeArea,
      branchId,
      branchName: branchName || 'Sayta Central',
      suspended: false,
      createdAt: new Date().toISOString(),
      initialPassword: password,
      phone: phone || '',
    };

    // 1. Guardar en Firebase Realtime Database
    await saveEmployeeToRtdb(newEmployee);

    // 2. Guardar en memoria local
    localEmployees = [newEmployee, ...localEmployees];

    return NextResponse.json({
      success: true,
      message: 'Empleado creado y registrado exitosamente en Firebase.',
      employee: newEmployee,
    });
  } catch (error: any) {
    console.error('[API Employees POST] Error general:', error);
    return NextResponse.json(
      { error: error.message || 'Error procesando el registro del empleado.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, suspended, area, branchId, branchName } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de empleado requerido' }, { status: 400 });
    }

    let updatedEmployee: any = null;

    localEmployees = localEmployees.map((emp) => {
      if (emp.id === id) {
        updatedEmployee = {
          ...emp,
          ...(suspended !== undefined ? { suspended } : {}),
          ...(area ? { area } : {}),
          ...(branchId ? { branchId, branchName: branchName || emp.branchName } : {}),
        };
        return updatedEmployee;
      }
      return emp;
    });

    if (updatedEmployee) {
      await writeRtdb(`employees/${id}`, updatedEmployee);
    }

    return NextResponse.json({ success: true, message: 'Empleado actualizado en Firebase' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID de empleado requerido' }, { status: 400 });
    }

    // 1. Eliminar de memoria local
    localEmployees = localEmployees.filter((emp) => emp.id !== id);

    // 2. Eliminar de Firebase Realtime Database
    await deleteFromRtdb(`employees/${id}`);

    // 3. Eliminar de Firebase Auth y Firestore si está disponible
    if (isFirebaseAdminConfigured && adminAuth && adminDb) {
      try {
        await adminDb.collection('users').doc(id).delete();
      } catch (e) {
        console.warn('[API Employees DELETE] Firestore delete aviso:', e);
      }
      try {
        await adminAuth.deleteUser(id);
      } catch (e) {
        console.warn('[API Employees DELETE] Auth delete aviso:', e);
      }
    }

    return NextResponse.json({ success: true, message: 'Empleado eliminado exitosamente.' });
  } catch (error: any) {
    console.error('[API Employees DELETE] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
