// src/components/ui/ProductCard.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import { useCart } from '@/providers/CartProvider';
import { formatCurrency } from '@/lib/utils/currency';
import { Plus, Check, Lock, LogIn } from 'lucide-react';

import { useLanguage } from '@/providers/LanguageProvider';

export interface DisplayProduct {
  id: string;
  name: string;
  tagline?: string;
  category: string;
  badge?: string;
  image: string;
  price?: number; // Solo presente si el usuario está autenticado
  originalPrice?: number;
  currency?: string;
  available: boolean;
  branchName?: string;
}

interface ProductCardProps {
  product: DisplayProduct;
  onQuickView?: (product: DisplayProduct) => void;
}

export function ProductCard({ product, onQuickView }: ProductCardProps) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { t, isZh } = useLanguage();
  const [added, setAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return; // Forzamos sesión

    if (product.price !== undefined) {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        category: product.category,
        unit: 'pieza',
        branchName: product.branchName,
      });
      setAdded(true);
      setTimeout(() => setAdded(false), 1600);
    }
  };

  return (
    <div
      onClick={() => onQuickView && onQuickView(product)}
      className="apple-card p-4 sm:p-5 flex flex-col justify-between cursor-pointer group transition-all duration-300 hover:border-white/20"
    >
      <div>
        {/* Cabecera de la tarjeta: Badge / Categoría */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[11px] font-medium text-[#2997ff] uppercase tracking-wider truncate">
            {product.category || 'General'}
          </span>
          {product.badge && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#30d158]/15 text-[#30d158] whitespace-nowrap">
              {product.badge}
            </span>
          )}
        </div>

        {/* Imagen del Producto con Aspect Ratio Fijo */}
        <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[#0c0c0e] border border-white/[0.04] mb-3 sm:mb-4 flex items-center justify-center p-2">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500 ease-out"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#6e6e73] text-xs">
              {isZh ? '暂无图片' : 'Sin imagen'}
            </div>
          )}
        </div>

        {/* Info */}
        <h3 className="text-sm font-semibold text-[#f5f5f7] group-hover:text-white line-clamp-1">
          {product.name}
        </h3>
        {product.tagline && (
          <p className="text-xs text-[#86868b] line-clamp-2 mt-1 leading-relaxed">
            {product.tagline}
          </p>
        )}
      </div>

      {/* Precios y Botón de Acción Condicionado a Autenticación */}
      <div className="mt-4 pt-3 border-t border-white/[0.06]">
        {user ? (
          // Usuario Autenticado: Ve el precio real y puede agregar
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-bold text-white font-mono">
                  {formatCurrency(product.price ?? 0, product.currency || 'NIO')}
                </span>
                {product.originalPrice && product.originalPrice > (product.price ?? 0) && (
                  <span className="text-[11px] text-[#6e6e73] line-through">
                    {formatCurrency(product.originalPrice, product.currency || 'NIO')}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-[#30d158] block">
                {product.available
                  ? (isZh ? '● 有现货' : '● En stock')
                  : (isZh ? '○ 暂时缺货' : '○ Agotado')}
              </span>
            </div>

            <button
              onClick={handleAdd}
              disabled={!product.available}
              type="button"
              className={`apple-pill-btn px-3 py-1.5 text-xs ${
                added
                  ? 'bg-[#30d158] text-black font-semibold'
                  : 'apple-btn-primary disabled:opacity-40'
              }`}
              aria-label={`Añadir ${product.name} a la bolsa`}
            >
              {added ? (
                <span className="flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> {t('prod_added', 'Agregado')}
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> {t('prod_add', 'Agregar')}
                </span>
              )}
            </button>
          </div>
        ) : (
          // Visitante Sin Sesión: Ocultar precio de forma estricta
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <Link
              href="/login"
              onClick={(e) => e.stopPropagation()}
              className="text-[11px] text-[#2997ff] hover:underline flex items-center gap-1 font-medium"
            >
              <Lock className="w-3 h-3 text-[#2997ff] flex-shrink-0" />
              <span>{t('prod_login_to_see_price', 'Inicia sesión para ver el precio')}</span>
            </Link>

            <Link
              href="/login"
              onClick={(e) => e.stopPropagation()}
              className="apple-pill-btn apple-btn-secondary px-3 py-1 text-xs text-center flex items-center justify-center gap-1"
            >
              <LogIn className="w-3 h-3" />
              <span>{t('nav_login', 'Acceder')}</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
