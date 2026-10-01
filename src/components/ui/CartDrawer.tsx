// src/components/ui/CartDrawer.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/providers/CartProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useBranch } from '@/providers/BranchProvider';
import { doc, getDoc } from 'firebase/firestore';
import { db, getAuthToken } from '@/lib/firebase/client';
import { DeliveryCompany, DeliveryOrder } from '@/types/delivery.types';
import { useLanguage } from '@/providers/LanguageProvider';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Truck,
  CheckCircle,
  Tag,
  MessageCircle,
  MapPin,
  ChevronLeft,
  AlertCircle,
  Phone,
  User,
  Home,
  ShieldCheck,
} from 'lucide-react';

export function CartDrawer() {
  const {
    isOpen,
    closeCart,
    items,
    totalItems,
    subtotal,
    discount,
    updateQuantity,
    removeFromCart,
    clearCart,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const { user } = useAuth();
  const { currentBranch } = useBranch();
  const { t, isZh } = useLanguage();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'checkout' | 'success'>('cart');

  // Empresa de delivery activa (seleccionada automáticamente)
  const [activeDelivery, setActiveDelivery] = useState<DeliveryCompany | null>(null);
  const [loadingDelivery, setLoadingDelivery] = useState(false);

  // Formulario del cliente
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [clienteDireccion, setClienteDireccion] = useState('');
  const [clienteReferencias, setClienteReferencias] = useState('');

  // Estado de envío
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  // Cargar empresa de delivery activa al abrir carrito
  useEffect(() => {
    if (isOpen) {
      setLoadingDelivery(true);
      fetch('/api/delivery-companies?onlyActive=true')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.companies) && data.companies.length > 0) {
            setActiveDelivery(data.companies[0]);
          } else {
            setActiveDelivery(null);
          }
        })
        .catch(() => setActiveDelivery(null))
        .finally(() => setLoadingDelivery(false));
    }
  }, [isOpen]);

  // Pre-llenar datos del usuario autenticado + dirección guardada en Firestore
  useEffect(() => {
    if (user && isOpen) {
      if (user.displayName && !clienteNombre) setClienteNombre(user.displayName);
      if (user.phoneNumber && !clienteTelefono) setClienteTelefono(user.phoneNumber);

      // Cargar dirección y referencias guardadas en Firestore
      if (user.uid && !clienteDireccion) {
        getDoc(doc(db, 'users', user.uid))
          .then((snap) => {
            if (snap.exists()) {
              const data = snap.data();
              if (data.direccion && !clienteDireccion) setClienteDireccion(data.direccion);
              if (data.referencias && !clienteReferencias) setClienteReferencias(data.referencias);
              if (data.phoneNumber && !clienteTelefono) setClienteTelefono(data.phoneNumber);
            }
          })
          .catch(() => {});
      }
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const totalAPagar = Math.max(0, subtotal - discount);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput) return;
    const ok = applyCoupon(couponInput);
    if (!ok) {
      setCouponError(true);
      setTimeout(() => setCouponError(false), 3000);
    } else {
      setCouponInput('');
    }
  };

  // Procesar orden y generar link WhatsApp
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError(null);

    if (!clienteNombre.trim() || !clienteDireccion.trim()) {
      setOrderError('Por favor completa tu nombre y dirección de entrega.');
      return;
    }

    if (!activeDelivery) {
      setOrderError('No hay servicio de delivery disponible en este momento. Contáctanos directamente.');
      return;
    }

    if (!user) {
      setOrderError('Debes iniciar sesión para realizar tu pedido.');
      return;
    }

    try {
      setSubmittingOrder(true);
      const idToken = await getAuthToken();

      const payload = {
        cliente: {
          nombre: clienteNombre.trim(),
          telefono: clienteTelefono.trim(),
          direccion: clienteDireccion.trim(),
          referencias: clienteReferencias.trim() || undefined,
        },
        items: items.map((it) => ({
          productId: it.id,
          name: it.name,
          quantity: it.quantity,
          price: it.price,
          image: it.image,
        })),
        empresaDeliveryId: activeDelivery.id,
        sucursalId: currentBranch?.id || 'branch-central',
        descuento: discount,
      };

      const res = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error procesando el pedido');
      }

      setOrderId(data.orderNumber || data.orderId);
      const targetWaUrl = data.whatsappDeliveryUrl || data.whatsappUrl;
      setWhatsappUrl(targetWaUrl);
      setCheckoutStep('success');

      // Abrir WhatsApp automáticamente
      if (targetWaUrl) {
        try {
          window.open(targetWaUrl, '_blank');
        } catch {
          // El navegador puede bloquear popups; el botón lo mostrará igual
        }
      }
    } catch (err: any) {
      setOrderError(err.message || 'Error de conexión. Intenta de nuevo.');
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleResetCheckout = () => {
    clearCart();
    setCheckoutStep('cart');
    setWhatsappUrl(null);
    setOrderId(null);
    closeCart();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Telón de Fondo */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-md transition-opacity duration-300"
        onClick={() => {
          if (checkoutStep !== 'success') closeCart();
        }}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md sm:max-w-lg bg-[#121316] text-[#f5f5f7] border-l border-white/[0.1] shadow-2xl backdrop-blur-2xl flex flex-col justify-between">

          {/* ─── HEADER ─── */}
          <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between bg-black/40">
            <div className="flex items-center gap-2.5">
              {checkoutStep === 'checkout' ? (
                <button
                  onClick={() => setCheckoutStep('cart')}
                  className="p-1.5 rounded-xl text-[#86868b] hover:text-white hover:bg-white/[0.06] transition-colors flex items-center gap-1 text-xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Volver a la cesta</span>
                </button>
              ) : (
                <>
                  <div className="p-2 rounded-xl bg-[#2997ff]/15 border border-[#2997ff]/30 text-[#2997ff]">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white tracking-tight">
                      {checkoutStep === 'success' ? t('cart_success_title') : t('cart_title')}
                    </h2>
                    <p className="text-xs text-[#86868b]">
                      {checkoutStep === 'success'
                        ? (isZh ? '订单已生成并已发送给骑手' : 'Tu pedido fue enviado al delivery')
                        : `${totalItems} ${t('cart_items_selected')}`}
                    </p>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => {
                if (checkoutStep === 'success') handleResetCheckout();
                else closeCart();
              }}
              type="button"
              className="p-2 rounded-xl text-[#86868b] hover:text-white hover:bg-white/[0.08] transition-all"
              aria-label="Cerrar bolsa"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ─── VISTA ÉXITO ─── */}
          {checkoutStep === 'success' ? (
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center animate-fade-in overflow-y-auto">
              <div className="w-20 h-20 rounded-3xl bg-[#30d158]/20 border border-[#30d158]/40 text-[#30d158] flex items-center justify-center mb-5 shadow-xl shadow-[#30d158]/10">
                <CheckCircle className="w-10 h-10" />
              </div>

              <span className="text-[11px] font-bold uppercase tracking-widest text-[#30d158] mb-2">
                ¡Pedido Creado!
              </span>
              <h3 className="text-2xl font-black text-white mb-2 tracking-tight">
                Orden #{orderId}
              </h3>
              <p className="text-xs text-[#86868b] mb-6 max-w-xs leading-relaxed">
                Tu pedido quedó registrado en estado <strong className="text-[#ffd60a]">pendiente</strong> y el stock ha sido reservado. El personal prepara tus artículos y el repartidor de <strong className="text-white">{activeDelivery?.nombre || 'Delivery'}</strong> se presentará en la sucursal para validar la compra escaneando el código QR.
              </p>

              {/* Botón principal WhatsApp */}
              {whatsappUrl && (
                <div className="w-full mb-4">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 px-4 rounded-2xl font-bold text-black bg-[#30d158] hover:bg-[#2dba4e] shadow-xl shadow-[#30d158]/25 transition-all flex items-center justify-center gap-2.5 text-sm"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>{t('cart_open_whatsapp')}</span>
                  </a>
                  <span className="text-[10px] text-[#86868b] mt-2 block text-center">
                    {isZh ? '包含您所购商品的清单已准备好发送。' : 'El mensaje con todos tus productos ya está listo para enviar.'}
                  </span>
                </div>
              )}

              {/* Preview del mensaje */}
              <div className="w-full p-4 rounded-2xl bg-[#1c1c1e] border border-white/[0.08] text-left text-xs mb-5 space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-[#86868b] font-semibold mb-2">Vista previa del mensaje</p>
                <p className="text-white/80 leading-relaxed whitespace-pre-line">
                  {`¡Hola! Soy ${clienteNombre} y quisiera hacer el siguiente pedido en la sucursal ${currentBranch?.name || 'nuestra tienda'}:\n\n📋 Lista de compras:\n${items.map(i => `${i.quantity} ${i.name}`).join('\n')}\n\n📍 Dirección de entrega: ${clienteDireccion}${clienteReferencias ? `\n🏠 Referencias: ${clienteReferencias}` : ''}\n\n¡Muchas gracias! 😊`}
                </p>
              </div>

              <button
                onClick={handleResetCheckout}
                className="w-full py-3 rounded-xl font-semibold text-xs text-white bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] transition-all"
              >
                {t('cart_back_to_shop')}
              </button>
            </div>

          ) : checkoutStep === 'checkout' ? (
            /* ─── VISTA CHECKOUT ─── */
            <form onSubmit={handlePlaceOrder} className="flex-1 flex flex-col justify-between overflow-hidden animate-fade-in">
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 custom-scrollbar">

                {/* Error */}
                {orderError && (
                  <div className="p-3.5 rounded-xl bg-[#ff453a]/15 border border-[#ff453a]/30 text-[#ff453a] text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{orderError}</span>
                  </div>
                )}

                {/* Info delivery automático */}
                {loadingDelivery ? (
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-[#86868b] flex items-center gap-2 animate-pulse">
                    <Truck className="w-4 h-4 text-[#2997ff]" />
                    <span>Verificando servicio de delivery...</span>
                  </div>
                ) : activeDelivery ? (
                  <div className="p-3.5 rounded-xl bg-[#30d158]/10 border border-[#30d158]/30 text-xs flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#30d158]/20 flex items-center justify-center text-[#30d158] shrink-0">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-white">{activeDelivery.nombre}</p>
                      <p className="text-[#86868b] mt-0.5">Tu pedido será enviado por WhatsApp al repartidor 🛵</p>
                    </div>
                    <ShieldCheck className="w-4 h-4 text-[#30d158] shrink-0 ml-auto" />
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-[#ffd60a]/10 border border-[#ffd60a]/30 text-[#ffd60a] text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>No hay servicio de delivery disponible ahora. Contáctanos directamente.</span>
                  </div>
                )}

                {/* Resumen de productos */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-[#2997ff]" />
                    <span>{t('cart_order_summary')} ({items.length} {isZh ? '件商品' : items.length === 1 ? 'producto' : 'productos'})</span>
                  </label>
                  <div className="rounded-2xl bg-white/[0.02] border border-white/[0.07] divide-y divide-white/[0.05] overflow-hidden">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 px-3 py-2.5">
                        <span className="text-[#2997ff] font-bold text-xs font-mono w-5 text-center shrink-0">{item.quantity}x</span>
                        <span className="text-white text-xs flex-1 truncate">{item.name}</span>
                        <span className="text-[#86868b] text-xs font-mono shrink-0">C$ {(item.price * item.quantity).toLocaleString('es-NI')}</span>
                      </div>
                    ))}
                    <div className="flex justify-between px-3 py-2.5 bg-white/[0.03]">
                      <span className="text-xs font-bold text-white">{t('cart_total')}</span>
                      <span className="text-xs font-bold text-[#30d158] font-mono">C$ {totalAPagar.toLocaleString('es-NI')} NIO</span>
                    </div>
                  </div>
                </div>

                {/* Datos de entrega */}
                <div className="space-y-3 pt-1 border-t border-white/[0.08]">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 pt-1">
                    <MapPin className="w-3.5 h-3.5 text-[#ffd60a]" />
                    <span>{t('cart_delivery_info')}</span>
                  </span>

                  <div>
                    <label className="block text-[11px] font-medium text-[#86868b] mb-1">
                      {t('cart_name_label')}
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-[#86868b] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={clienteNombre}
                        onChange={(e) => setClienteNombre(e.target.value)}
                        placeholder={t('cart_name_placeholder')}
                        className="w-full pl-8 pr-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#86868b] mb-1">
                      {t('cart_phone_label')}
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-[#86868b] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="tel"
                        value={clienteTelefono}
                        onChange={(e) => setClienteTelefono(e.target.value)}
                        placeholder={t('cart_phone_placeholder')}
                        className="w-full pl-8 pr-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff] font-mono transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#86868b] mb-1">
                      {t('cart_address_label')}
                    </label>
                    <div className="relative">
                      <Home className="w-3.5 h-3.5 text-[#86868b] absolute left-3 top-3 pointer-events-none" />
                      <textarea
                        rows={2}
                        required
                        value={clienteDireccion}
                        onChange={(e) => setClienteDireccion(e.target.value)}
                        placeholder={t('cart_address_placeholder')}
                        className="w-full pl-8 pr-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff] transition-colors resize-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#86868b] mb-1">
                      {t('cart_reference_label')}
                    </label>
                    <input
                      type="text"
                      value={clienteReferencias}
                      onChange={(e) => setClienteReferencias(e.target.value)}
                      placeholder={t('cart_reference_placeholder')}
                      className="w-full px-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff] transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* PIE: total + botón comprar */}
              <div className="p-4 sm:p-5 border-t border-white/[0.08] bg-black/60 backdrop-blur-xl space-y-3">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-[#86868b]">
                    <span>Subtotal de productos:</span>
                    <span className="font-mono">C$ {subtotal.toLocaleString('es-NI')} NIO</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-[#30d158]">
                      <span>Descuento aplicado:</span>
                      <span className="font-mono">-C$ {discount.toLocaleString('es-NI')} NIO</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#ffd60a]">
                    <span className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5" />
                      <span>Envío:</span>
                    </span>
                    <span className="font-semibold">A coordinar con repartidor</span>
                  </div>
                  <div className="pt-2 border-t border-white/[0.08] flex justify-between items-baseline font-bold">
                    <span className="text-sm text-white">Total Productos:</span>
                    <span className="text-lg text-white font-mono">
                      C$ {totalAPagar.toLocaleString('es-NI')}{' '}
                      <span className="text-xs font-normal text-[#86868b]">NIO</span>
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingOrder || !activeDelivery}
                  className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 shadow-xl transition-all bg-[#30d158] hover:bg-[#2dba4e] text-black shadow-[#30d158]/25 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  {submittingOrder ? (
                    <span>Preparando tu pedido...</span>
                  ) : (
                    <>
                      <MessageCircle className="w-5 h-5" />
                      <span>Comprar — Enviar por WhatsApp</span>
                    </>
                  )}
                </button>
                <p className="text-[10px] text-[#86868b] text-center">
                  Al tocar Comprar, se abrirá WhatsApp con tu pedido listo para enviar.
                </p>
              </div>
            </form>

          ) : (
            /* ─── VISTA BOLSA DE PRODUCTOS ─── */
            <>
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 custom-scrollbar">
                {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-[#86868b] py-12">
                    <div className="w-16 h-16 rounded-3xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-4 text-[#86868b]">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                    <h3 className="text-base font-semibold text-white mb-1">Tu bolsa está vacía</h3>
                    <p className="text-xs text-[#86868b] max-w-[220px] mb-6">
                      Explora el catálogo y agrega productos para recibirlos en tu casa.
                    </p>
                    <button
                      onClick={closeCart}
                      className="px-5 py-2.5 rounded-full text-xs font-semibold text-black bg-white hover:bg-slate-200 transition-all"
                    >
                      Explorar Catálogo
                    </button>
                  </div>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3.5 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] transition-all"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover bg-black/40 border border-white/[0.08]"
                      />
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-[10px] uppercase font-semibold text-[#2997ff] tracking-wider truncate block">
                              {item.category}
                            </span>
                            <h4 className="text-xs sm:text-sm font-semibold text-white truncate">
                              {item.name}
                            </h4>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-[#86868b] hover:text-[#ff453a] transition-colors p-1"
                            title="Eliminar producto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs sm:text-sm font-bold text-white font-mono">
                            C$ {item.price.toLocaleString('es-NI')}
                          </span>

                          <div className="flex items-center gap-2 bg-white/[0.06] rounded-lg px-2 py-1 border border-white/[0.08]">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="text-[#86868b] hover:text-white transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-mono font-bold text-white min-w-[14px] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="text-[#86868b] hover:text-white transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pie de la Bolsa */}
              {items.length > 0 && (
                <div className="p-4 sm:p-5 border-t border-white/[0.08] bg-black/60 backdrop-blur-xl space-y-4">
                  {/* Cupón */}
                  <div className="space-y-1.5">
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#30d158]/10 border border-[#30d158]/20 text-xs text-[#30d158]">
                        <span className="flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5" /> Cupón <strong>{appliedCoupon}</strong> aplicado (-10%)
                        </span>
                        <button
                          onClick={removeCoupon}
                          className="text-[#86868b] hover:text-[#ff453a] text-[11px] font-semibold"
                        >
                          Quitar
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleApplyCoupon} className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            placeholder="Código de cupón (ej. SAYTAPRO)"
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.1] text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff]"
                          />
                        </div>
                        <button
                          type="submit"
                          className="px-3 py-2 rounded-xl bg-white/[0.1] hover:bg-white/[0.15] text-xs font-semibold text-white transition-all"
                        >
                          Aplicar
                        </button>
                      </form>
                    )}
                    {couponError && (
                      <p className="text-[11px] text-[#ff453a]">
                        Cupón no válido o vencido.
                      </p>
                    )}
                  </div>

                  {/* Resumen */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-[#86868b]">
                      <span>{t('cart_subtotal')}</span>
                      <span className="font-mono text-white">C$ {subtotal.toLocaleString('es-NI')} NIO</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-[#30d158]">
                        <span>{t('cart_discount')}</span>
                        <span className="font-mono">-C$ {discount.toLocaleString('es-NI')} NIO</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[#86868b]">
                      <span className="flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-[#2997ff]" />
                        <span>{t('cart_delivery')}</span>
                      </span>
                      <span className="text-[#ffd60a] font-semibold">
                        {loadingDelivery ? (isZh ? '核验中...' : 'Verificando...') : activeDelivery ? activeDelivery.nombre : (isZh ? '暂无服务' : 'No disponible')}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-white/[0.08] flex justify-between items-baseline">
                      <span className="text-sm font-bold text-white">{t('cart_total')}</span>
                      <span className="text-lg font-black text-white font-mono">
                        C$ {(subtotal - discount).toLocaleString('es-NI')}{' '}
                        <span className="text-xs font-normal text-[#86868b]">NIO</span>
                      </span>
                    </div>
                  </div>

                  {/* Botón Comprar */}
                  <button
                    onClick={() => setCheckoutStep('checkout')}
                    className="w-full group relative flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm text-black bg-[#30d158] hover:bg-[#2dba4e] shadow-xl shadow-[#30d158]/25 transition-all duration-200 active:scale-[0.98]"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>{t('cart_btn_checkout')}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

