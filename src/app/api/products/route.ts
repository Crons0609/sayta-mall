// src/app/api/products/route.ts
// API Route para gestión completa de productos con detección de duplicados y cálculo automático de descuentos.

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserFromRequest } from '@/lib/auth/serverAuth';
import { getProductsFromRtdb, saveProductToRtdb, deleteProductFromRtdb } from '@/lib/firebase/rtdb';
import {
  findDuplicateProduct,
  calculateAutomaticDiscount,
  recordPriceHistory,
  type PriceHistoryRecord,
} from '@/lib/products/pricingEngine';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId') || undefined;
    const category = searchParams.get('category');
    const withDiscount = searchParams.get('withDiscount') === 'true';

    let products = await getProductsFromRtdb(branchId);

    // Filtrar eliminados (soft delete)
    products = products.filter((p) => p.status !== 'deleted' && !p.isDeleted);

    if (category && category !== 'Todos') {
      products = products.filter(
        (p) => (p.categoryName || p.category)?.toLowerCase() === category.toLowerCase()
      );
    }

    if (withDiscount) {
      products = products.filter(
        (p) => p.hasDiscount === true || (p.discountPercent && p.discountPercent > 0)
      );
    }

    return NextResponse.json({
      success: true,
      products,
      total: products.length,
    });
  } catch (error: any) {
    console.error('[API Products GET]', error);
    return NextResponse.json({ error: 'Error obteniendo catálogo de productos.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userInfo = await getAuthenticatedUserFromRequest(request);
    if (!userInfo) {
      return NextResponse.json({ error: 'No autorizado para gestionar productos.' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      sku,
      category,
      price,
      stock = 10,
      description = '',
      tagline = '',
      image,
      branchId = 'branch-central',
      branchName = 'Sayta Central',
      forceUpdateDuplicate = false,
    } = body;

    if (!name || !name.trim() || price === undefined || Number(price) <= 0) {
      return NextResponse.json({ error: 'Nombre y precio válido (> 0) son obligatorios.' }, { status: 400 });
    }

    const priceNum = Math.round(Number(price) * 100) / 100;
    const stockNum = Math.max(0, parseInt(stock, 10) || 0);

    // 1. Obtener productos existentes para búsqueda de duplicados
    const existingProducts = await getProductsFromRtdb(branchId);
    const duplicate = findDuplicateProduct({ sku, name }, existingProducts);

    // 2. Si existe un duplicado
    if (duplicate) {
      const precioOriginal = Number(duplicate.precio_original || duplicate.compareAtPrice || duplicate.price);
      const discountCalc = calculateAutomaticDiscount(precioOriginal, priceNum);

      // Si el precio es menor: aplicar descuento automático
      if (discountCalc.esMenor) {
        const updatedProduct = {
          ...duplicate,
          // Conservar precio original más alto de referencia
          precio_original: precioOriginal,
          compareAtPrice: precioOriginal,
          // Actualizar con el precio actual más económico
          precio_actual: priceNum,
          price: priceNum,
          discountPrice: priceNum,
          // Cálculo automático
          porcentaje_descuento: discountCalc.porcentaje,
          discountPercent: discountCalc.porcentaje,
          tiene_descuento: true,
          hasDiscount: true,
          discountStatus: 'approved',
          stock: duplicate.stock + stockNum, // sumar existencias
          description: description || duplicate.description,
          tagline: tagline || duplicate.tagline,
          image: image || duplicate.image,
          updatedAt: new Date().toISOString(),
          lastUpdatedBy: userInfo.displayName,
          lastUpdatedById: userInfo.userId,
        };

        await saveProductToRtdb(updatedProduct);

        // Registrar en el historial de precios
        const historyRecord: PriceHistoryRecord = {
          id: `ph_${Date.now()}`,
          productId: duplicate.id,
          productName: duplicate.name,
          sku: duplicate.sku || sku,
          precioAnterior: precioOriginal,
          precioNuevo: priceNum,
          porcentajeCambio: -discountCalc.porcentaje,
          tipo: 'descuento_automatico',
          empleadoId: userInfo.userId,
          empleadoNombre: userInfo.displayName,
          fecha: new Date().toISOString(),
          motivo: `Bajada de precio detectada automáticamente. Descuento aplicado: ${discountCalc.porcentaje}%`,
        };
        await recordPriceHistory(historyRecord);

        return NextResponse.json({
          success: true,
          action: 'discount_applied',
          message: `Producto existente detectado. Se conservó el producto original y se aplicó un ${discountCalc.porcentaje}% de descuento automático.`,
          product: updatedProduct,
          discount: discountCalc,
        });
      }

      // Si el precio es igual o mayor
      if (!forceUpdateDuplicate) {
        return NextResponse.json({
          success: false,
          duplicateDetected: true,
          existingProduct: {
            id: duplicate.id,
            name: duplicate.name,
            currentPrice: duplicate.price,
            originalPrice: duplicate.compareAtPrice || duplicate.price,
          },
          message: `El producto "${duplicate.name}" ya existe con precio de C$ ${duplicate.price}. El precio ingresado (C$ ${priceNum}) no es menor. ¿Deseas actualizar el inventario?`,
        }, { status: 409 });
      }
    }

    // 3. Si no existe duplicado, crear producto nuevo normalmente
    const newProductId = `prod_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newProduct = {
      id: newProductId,
      productId: newProductId,
      sku: sku ? sku.trim().toUpperCase() : `SKU-${Date.now().toString().slice(-6)}`,
      name: name.trim(),
      nombre: name.trim(),
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category: category || 'General',
      categoryName: category || 'General',
      // Campos de precio con referencia
      precio_original: priceNum,
      compareAtPrice: priceNum,
      precio_actual: priceNum,
      price: priceNum,
      porcentaje_descuento: 0,
      discountPercent: 0,
      tiene_descuento: false,
      hasDiscount: false,
      discountStatus: 'none',
      stock: stockNum,
      available: stockNum > 0,
      description: description.trim(),
      tagline: tagline.trim(),
      image: image || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80',
      branchId,
      branchName,
      status: 'active',
      estado: true,
      createdBy: userInfo.userId,
      createdByName: userInfo.displayName,
      createdByRole: userInfo.role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveProductToRtdb(newProduct);

    // Historial inicial
    const initialHistory: PriceHistoryRecord = {
      id: `ph_init_${Date.now()}`,
      productId: newProductId,
      productName: newProduct.name,
      sku: newProduct.sku,
      precioAnterior: priceNum,
      precioNuevo: priceNum,
      porcentajeCambio: 0,
      tipo: 'creacion',
      empleadoId: userInfo.userId,
      empleadoNombre: userInfo.displayName,
      fecha: new Date().toISOString(),
      motivo: 'Registro inicial de producto',
    };
    await recordPriceHistory(initialHistory);

    return NextResponse.json({
      success: true,
      action: 'created',
      message: 'Producto creado exitosamente.',
      product: newProduct,
    });
  } catch (error: any) {
    console.error('[API Products POST]', error);
    return NextResponse.json({ error: error.message || 'Error procesando producto.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userInfo = await getAuthenticatedUserFromRequest(request);
    if (!userInfo) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');
    const permanent = searchParams.get('permanent') === 'true';

    if (!productId) {
      return NextResponse.json({ error: 'ID de producto requerido.' }, { status: 400 });
    }

    if (permanent && (userInfo.role === 'owner' || userInfo.role === 'programmer')) {
      await deleteProductFromRtdb(productId);
      return NextResponse.json({ success: true, message: 'Producto eliminado permanentemente.' });
    }

    // Soft delete: marcar como inactivo/eliminado para preservar historial de pedidos
    const existing = await getProductsFromRtdb();
    const product = existing.find((p) => p.id === productId);
    if (product) {
      product.status = 'inactive';
      product.estado = false;
      product.isDeleted = true;
      product.deletedAt = new Date().toISOString();
      product.deletedBy = userInfo.displayName;
      await saveProductToRtdb(product);
    }

    return NextResponse.json({
      success: true,
      message: 'Producto desactivado (conservando historial de pedidos y ventas).',
    });
  } catch (error: any) {
    console.error('[API Products DELETE]', error);
    return NextResponse.json({ error: 'Error eliminando producto.' }, { status: 500 });
  }
}
