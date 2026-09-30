// src/app/api/categories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeRtdb, readRtdb, deleteRtdb } from '@/lib/firebase/rtdb';
import { adminDb } from '@/lib/firebase/admin';

export interface CategoryRecord {
  id: string;
  name: string;
  icon: string;
  description: string;
  badge?: string;
  isCustom: boolean;
  branchId?: string;
  createdAt: string;
  updatedAt: string;
}

// Categorías base del sistema (no editables desde aquí)
const BASE_CATEGORIES: CategoryRecord[] = [
  { id: 'herramientas', name: 'Herramientas & Ferretería', icon: '🔧', description: 'Taladros, martillos, llaves y más', isCustom: false, createdAt: '', updatedAt: '' },
  { id: 'calzado', name: 'Calzado & Zapatos', icon: '👟', description: 'Tenis, sandalias, botas', isCustom: false, createdAt: '', updatedAt: '' },
  { id: 'ropa', name: 'Ropa & Moda', icon: '👕', description: 'Camisas, pantalones, vestidos', isCustom: false, createdAt: '', updatedAt: '' },
  { id: 'ropa-intima-fajas', name: 'Ropa Íntima & Fajas', icon: '👙', description: 'Fajas moldeadoras, lencería', badge: 'Más Vendido', isCustom: false, createdAt: '', updatedAt: '' },
  { id: 'cosmeticos', name: 'Cosméticos & Belleza', icon: '💄', description: 'Maquillaje, labiales, cuidado facial', isCustom: false, createdAt: '', updatedAt: '' },
  { id: 'electronica', name: 'Electrónica & Gadgets', icon: '🎧', description: 'Audífonos, cargadores, smartwatches', badge: 'Tendencia', isCustom: false, createdAt: '', updatedAt: '' },
  { id: 'bocadillos-chinos', name: 'Bocadillos Chinos & Snacks', icon: '🥢', description: 'Snacks asiáticos, ramen, dulces', badge: 'Exclusivo', isCustom: false, createdAt: '', updatedAt: '' },
  { id: 'accesorios', name: 'Accesorios & Joyería', icon: '💍', description: 'Aretes, collares, pulseras', isCustom: false, createdAt: '', updatedAt: '' },
  { id: 'hogar', name: 'Hogar & Decoración', icon: '🏠', description: 'Utensilios, cojines, lámparas', isCustom: false, createdAt: '', updatedAt: '' },
  { id: 'deportes', name: 'Deportes & Fitness', icon: '⚽', description: 'Equipos deportivos, ropa fitness', isCustom: false, createdAt: '', updatedAt: '' },
  { id: 'juguetes', name: 'Juguetes & Entretenimiento', icon: '🧸', description: 'Juguetes infantiles, juegos de mesa', isCustom: false, createdAt: '', updatedAt: '' },
  { id: 'mascotas', name: 'Mascotas & Accesorios', icon: '🐾', description: 'Alimento, juguetes y accesorios para mascotas', isCustom: false, createdAt: '', updatedAt: '' },
];

export async function GET() {
  try {
    const rtdbData = await readRtdb<Record<string, CategoryRecord>>('categories');
    const customCategories: CategoryRecord[] = rtdbData
      ? Object.values(rtdbData).filter((c) => c && c.id)
      : [];

    // Combinar base + custom (sin duplicar)
    const map = new Map<string, CategoryRecord>();
    BASE_CATEGORIES.forEach((c) => map.set(c.id, c));
    customCategories.forEach((c) => map.set(c.id, c));

    return NextResponse.json({
      success: true,
      categories: Array.from(map.values()),
      customCount: customCategories.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, icon, description, badge, branchId } = body;

    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: 'El nombre de la categoría es obligatorio.' }, { status: 400 });
    }

    const id = `cat-${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now()}`;
    const now = new Date().toISOString();

    const category: CategoryRecord = {
      id,
      name: name.trim(),
      icon: icon?.trim() || '📦',
      description: description?.trim() || '',
      badge: badge?.trim() || undefined,
      isCustom: true,
      branchId: branchId || undefined,
      createdAt: now,
      updatedAt: now,
    };

    await writeRtdb(`categories/${id}`, category);

    if (adminDb) {
      try {
        await adminDb.collection('categories').doc(id).set(category);
      } catch (e) {
        console.warn('[Categories API] Firestore fallback:', e);
      }
    }

    return NextResponse.json({ success: true, category, message: 'Categoría creada exitosamente.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, icon, description, badge } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID de categoría requerido.' }, { status: 400 });
    }

    const current = await readRtdb<CategoryRecord>(`categories/${id}`);
    if (!current) {
      return NextResponse.json({ success: false, error: 'Categoría no encontrada.' }, { status: 404 });
    }

    const updated: CategoryRecord = {
      ...current,
      name: name?.trim() || current.name,
      icon: icon?.trim() || current.icon,
      description: description?.trim() || current.description,
      badge: badge?.trim() || current.badge,
      updatedAt: new Date().toISOString(),
    };

    await writeRtdb(`categories/${id}`, updated);

    return NextResponse.json({ success: true, category: updated, message: 'Categoría actualizada.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID de categoría requerido.' }, { status: 400 });
    }

    // No se pueden eliminar categorías base del sistema
    if (BASE_CATEGORIES.find((c) => c.id === id)) {
      return NextResponse.json({ success: false, error: 'Las categorías del sistema no se pueden eliminar.' }, { status: 403 });
    }

    await deleteRtdb(`categories/${id}`);

    if (adminDb) {
      try {
        await adminDb.collection('categories').doc(id).delete();
      } catch (e) {}
    }

    return NextResponse.json({ success: true, message: 'Categoría eliminada exitosamente.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
