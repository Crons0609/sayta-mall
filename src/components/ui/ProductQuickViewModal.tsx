// src/components/ui/ProductQuickViewModal.tsx
'use client';

import React, { useState } from 'react';
import { ProductItem } from '@/data/mockProducts';
import { useCart } from '@/providers/CartProvider';
import { useBranch } from '@/providers/BranchProvider';
import {
  X,
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  Check,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';

interface ProductQuickViewModalProps {
  product: ProductItem | null;
  onClose: () => void;
}

export function ProductQuickViewModal({ product, onClose }: ProductQuickViewModalProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();
  const { currentBranchId } = useBranch();

  if (!product) return null;

  const currentBranchStock =
    product.branchesStock.find((b) => b.branchId === currentBranchId) ||
    product.branchesStock[0];

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      category: product.category,
      unit: 'pieza',
      branchName: currentBranchStock?.branchName,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-12 flex justify-center items-center">
      {/* Fondo difuminado */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl transition-opacity animate-fade-in"
        onClick={onClose}
      />

      <div className="relative w-full max-w-4xl bg-slate-900/95 border border-white/[0.12] rounded-3xl shadow-2xl overflow-hidden backdrop-blur-2xl z-10 animate-fade-in">
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-slate-900/70 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Galería de Imágenes */}
          <div className="p-6 md:p-8 bg-slate-950/40 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/[0.08]">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-900 border border-white/[0.08] mb-4">
              <img
                src={product.gallery[selectedImage] || product.image}
                alt={product.name}
                className="w-full h-full object-cover transition-all duration-300"
              />
              {product.badge && (
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-emerald-500/90 text-slate-950 text-xs font-black shadow-lg">
                  {product.badge}
                </div>
              )}
            </div>

            {/* Miniaturas de la Galería */}
            {product.gallery.length > 1 && (
              <div className="flex gap-2 justify-center">
                {product.gallery.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImage === idx
                        ? 'border-sky-400 scale-105'
                        : 'border-white/10 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Información y Compra */}
          <div className="p-6 md:p-8 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs uppercase font-bold text-sky-400 tracking-wider">
                  {product.category}
                </span>
                <span className="text-slate-500">•</span>
                <div className="flex items-center gap-1 text-xs text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span className="font-bold">{product.rating}</span>
                  <span className="text-slate-400">({product.reviewsCount})</span>
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                {product.name}
              </h2>
              <p className="text-xs text-slate-400 mt-1">{product.tagline}</p>

              {/* Precios */}
              <div className="flex items-baseline gap-3 mt-4">
                <span className="text-3xl font-black text-white font-mono">
                  ${product.price.toLocaleString('es-MX')}
                </span>
                {product.originalPrice > product.price && (
                  <span className="text-base text-slate-400 line-through">
                    ${product.originalPrice}
                  </span>
                )}
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Ahorras ${(product.originalPrice - product.price).toLocaleString('es-MX')}
                </span>
              </div>

              {/* Descripción */}
              <p className="text-xs sm:text-sm text-slate-300 mt-4 leading-relaxed">
                {product.description}
              </p>

              {/* Especificaciones */}
              <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
                {product.specs.map((spec, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                  >
                    <span className="text-slate-400 block text-[10px] uppercase font-medium">
                      {spec.label}
                    </span>
                    <strong className="text-white font-medium">{spec.value}</strong>
                  </div>
                ))}
              </div>

              {/* Disponibilidad por Sucursal */}
              <div className="mt-4 p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Sucursal activa:</span>
                  <span className="font-bold text-white">{currentBranchStock?.branchName}</span>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                    <Check className="w-3.5 h-3.5" /> En Stock ({currentBranchStock?.stock} uds)
                  </span>
                </div>
              </div>
            </div>

            {/* Acciones de Compra */}
            <div className="space-y-3 pt-2 border-t border-white/[0.08]">
              <button
                onClick={handleAddToCart}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-sky-500 via-sky-600 to-emerald-500 hover:opacity-95 shadow-xl shadow-sky-500/25 transition-all duration-200 active:scale-[0.98]"
              >
                {added ? (
                  <>
                    <Check className="w-5 h-5 text-emerald-300" />
                    <span>¡Agregado a la bolsa!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    <span>Añadir a la Bolsa · ${product.price.toLocaleString('es-MX')} MXN</span>
                  </>
                )}
              </button>

              {/* Badges de Confianza */}
              <div className="grid grid-cols-3 gap-2 text-[10px] text-center text-slate-400 pt-1">
                <span className="flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-400" /> Garantía Sayta
                </span>
                <span className="flex items-center justify-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-emerald-400" /> Entrega Express
                </span>
                <span className="flex items-center justify-center gap-1">
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" /> Devolución 30d
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
