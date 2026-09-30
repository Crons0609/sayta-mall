// src/app/api/orders/route.ts
// API para registrar y consultar pedidos con atribución a Empresas de Delivery y selección de canal.

import { NextRequest, NextResponse } from 'next/server';
import {
  getDeliveryCompanyById,
  saveDeliveryOrderToDb,
  getDeliveryOrdersFromDb,
} from '@/lib/firebase/delivery';
import { buildWhatsAppOrderUrl } from '@/lib/whatsapp-order';
import { DeliveryOrder, OrderChannel } from '@/types/delivery.types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId') || undefined;

    const orders = await getDeliveryOrdersFromDb(companyId);

    return NextResponse.json({
      success: true,
      orders,
      total: orders.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error consultando pedidos.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      cliente,
      items,
      empresa_delivery_id,
      canal_pedido = 'web',
      metodo_pago = 'efectivo',
      moneda = 'NIO',
      descuento = 0,
      sucursal_nombre,
    } = body;

    // ── 1. Validaciones del cliente ──────────────────────────────────────────
    if (!cliente || !cliente.nombre || !cliente.telefono || !cliente.direccion) {
      return NextResponse.json(
        { error: 'Datos de entrega incompletos: Nombre, Teléfono y Dirección son requeridos.' },
        { status: 400 }
      );
    }

    // ── 2. Validaciones de items ─────────────────────────────────────────────
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'La cesta de compras no contiene productos válidos.' },
        { status: 400 }
      );
    }

    // ── 3. Validar Empresa de Delivery ──────────────────────────────────────
    if (!empresa_delivery_id) {
      return NextResponse.json(
        { error: 'Por favor selecciona una empresa de delivery para la entrega.' },
        { status: 400 }
      );
    }

    const company = await getDeliveryCompanyById(empresa_delivery_id);
    if (!company) {
      return NextResponse.json(
        { error: 'La empresa de delivery seleccionada no existe.' },
        { status: 404 }
      );
    }

    if (!company.estado || company.deleted) {
      return NextResponse.json(
        { error: 'La empresa de delivery seleccionada no se encuentra activa en este momento.' },
        { status: 400 }
      );
    }

    // ── 4. Calcular Totales ──────────────────────────────────────────────────
    const subtotal = items.reduce(
      (sum: number, it: any) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1),
      0
    );
    const costo_envio = Number(company.costo_envio) || 0;
    const desc = Number(descuento) || 0;
    const total = Math.max(0, subtotal - desc + costo_envio);

    // ── 5. Generar Código Único de Pedido ────────────────────────────────────
    const orderNumber = Math.floor(10000 + Math.random() * 90000);
    const orderId = `SAYTA-${orderNumber}`;

    const newOrder: DeliveryOrder = {
      id: orderId,
      cliente: {
        nombre: cliente.nombre.trim(),
        telefono: cliente.telefono.trim(),
        direccion: cliente.direccion.trim(),
        referencias: cliente.referencias ? cliente.referencias.trim() : undefined,
        ciudad: cliente.ciudad ? cliente.ciudad.trim() : undefined,
        notas: cliente.notas ? cliente.notas.trim() : undefined,
      },
      empresa_delivery_id: company.id,
      empresa_delivery_nombre: company.nombre,
      empresa_delivery_whatsapp: company.whatsapp,
      sucursal_nombre: sucursal_nombre || undefined,
      canal_pedido: (canal_pedido as OrderChannel) || 'web',
      items: items.map((it: any) => ({
        productId: it.productId || it.id,
        name: it.name,
        quantity: Number(it.quantity) || 1,
        price: Number(it.price) || 0,
        subtotal: (Number(it.price) || 0) * (Number(it.quantity) || 1),
        image: it.image,
      })),
      subtotal,
      costo_envio,
      descuento: desc,
      total,
      moneda,
      metodo_pago,
      estado: canal_pedido === 'whatsapp' ? 'enviado_a_empresa' : 'pendiente',
      notificado_empresa: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Generar URL estructurada de WhatsApp
    const whatsappUrl = buildWhatsAppOrderUrl(newOrder);
    newOrder.whatsapp_url = whatsappUrl;

    // ── 6. Guardar en Base de Datos ─────────────────────────────────────────
    await saveDeliveryOrderToDb(newOrder);

    // ── 7. Simular Notificación para pedidos realizados por la Web ───────────
    if (canal_pedido === 'web') {
      console.log(`[DELIVERY NOTIFICATION] Pedido #${orderId} registrado desde la Web.`);
      console.log(`-> Empresa destino: ${company.nombre} (Email: ${company.email || 'N/A'}, WhatsApp: ${company.whatsapp})`);
      console.log(`-> Cliente: ${cliente.nombre} (${cliente.telefono})`);
      console.log(`-> Dirección: ${cliente.direccion}`);
      console.log(`-> Total a cobrar: C$${total} ${moneda}`);
    }

    return NextResponse.json({
      success: true,
      message:
        canal_pedido === 'whatsapp'
          ? 'Pedido generado con éxito. Redirigiendo a WhatsApp de la empresa de delivery...'
          : 'Pedido registrado con éxito. La empresa de delivery ha sido notificada.',
      orderId,
      order: newOrder,
      whatsappUrl,
      empresa: {
        id: company.id,
        nombre: company.nombre,
        whatsapp: company.whatsapp,
        costo_envio: company.costo_envio,
      },
    });
  } catch (error: any) {
    console.error('[API Orders POST] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error procesando el pedido.' },
      { status: 500 }
    );
  }
}
