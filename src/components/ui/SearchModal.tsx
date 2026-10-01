// src/components/ui/SearchModal.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useBranch } from '@/providers/BranchProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useCart } from '@/providers/CartProvider';
import { formatCurrency } from '@/lib/utils/currency';
import { collection, query as firestoreQuery, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Search, X, Plus, Sparkles, Lock } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/providers/LanguageProvider';

interface SearchProduct {
  id: string;
  name: string;
  category: string;
  image: string;
  price?: number;
  available: boolean;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct?: (product: any) => void;
}

export function SearchModal({ isOpen, onClose, onSelectProduct }: SearchModalProps) {
  const { currentBranch } = useBranch();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { t, isZh, isEn } = useLanguage();

  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !currentBranch?.id) return;

    try {
      const ref = collection(db, 'products');
      const q = firestoreQuery(
        ref,
        where('branchId', '==', currentBranch.id),
        where('status', '==', 'active')
      );

      const unsub = onSnapshot(q, (snapshot) => {
        const loaded: SearchProduct[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          loaded.push({
            id: doc.id,
            name: data.name || 'Producto',
            category: data.categoryName || 'General',
            image: data.images && data.images[0] ? data.images[0].url : '',
            price: user ? data.price : undefined, // Precio solo para usuarios autenticados
            available: (data.stock ?? 0) > 0,
          });
        });
        setProducts(loaded);
      });

      return () => unsub();
    } catch {
      setProducts([]);
    }
  }, [isOpen, currentBranch?.id, user]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20 flex justify-center items-start">
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-xl transition-opacity animate-fade-in"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-[#161617] border border-white/[0.12] rounded-3xl shadow-2xl overflow-hidden backdrop-blur-2xl z-10 animate-fade-in">
        <div className="flex items-center px-4 py-3.5 border-b border-white/[0.08]">
          <Search className="w-5 h-5 text-[#2997ff] ml-1 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              currentBranch
                ? (isZh ? `在 ${currentBranch.name} 中搜索商品...` : isEn ? `Search products in ${currentBranch.name}...` : `Buscar productos en ${currentBranch.name}...`)
                : (isZh ? '搜索商品...' : isEn ? 'Search products...' : 'Buscar productos...')
            }
            className="w-full bg-transparent text-sm sm:text-base text-white placeholder-[#86868b] focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-[#86868b] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline ml-3 px-2 py-1 text-[10px] font-mono text-[#86868b] bg-white/10 rounded-md">
            ESC
          </kbd>
        </div>

        <div className="max-h-96 overflow-y-auto p-3 space-y-2">
          {filteredProducts.length === 0 ? (
            <div className="py-12 text-center text-[#86868b]">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-[#6e6e73] opacity-60" />
              <p className="text-sm font-medium text-[#f5f5f7]">
                {products.length === 0
                  ? (isZh ? '此分店暂未上架商品' : isEn ? 'No products published in this branch yet' : 'Aún no hay productos publicados en esta sucursal')
                  : (isZh ? `未找到与 “${query}” 相关的商品` : isEn ? `No products found matching "${query}"` : `No encontramos productos con "${query}"`)}
              </p>
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div
                key={product.id}
                className="group flex items-center justify-between p-2.5 rounded-2xl hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] transition-all cursor-pointer"
                onClick={() => {
                  onSelectProduct && onSelectProduct(product);
                  onClose();
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/40 border border-white/[0.06] flex-shrink-0 flex items-center justify-center">
                    {product.image ? (
                      <img src={product.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-[#6e6e73]">{isZh ? '无图片' : isEn ? 'No image' : 'Sin foto'}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-semibold text-[#2997ff] uppercase tracking-wider block">
                      {product.category}
                    </span>
                    <h4 className="text-xs sm:text-sm font-medium text-white truncate">
                      {product.name}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-3 pl-3 flex-shrink-0">
                  {user ? (
                    <>
                      <span className="text-xs sm:text-sm font-bold text-white font-mono">
                        {formatCurrency(product.price ?? 0, currentBranch?.currency || 'NIO')}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (product.price !== undefined) {
                            addToCart({
                              id: product.id,
                              name: product.name,
                              price: product.price,
                              image: product.image,
                              category: product.category,
                              unit: 'pieza',
                            });
                            onClose();
                          }
                        }}
                        className="p-2 rounded-xl bg-white/[0.08] hover:bg-[#0071e3] text-white transition-colors"
                        title={isZh ? '加入购物车' : isEn ? 'Add to bag' : 'Agregar a la bolsa'}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <Link
                      href="/login"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                      }}
                      className="text-xs text-[#2997ff] hover:underline flex items-center gap-1"
                    >
                      <Lock className="w-3 h-3" />
                      <span>{isZh ? '登录看价' : isEn ? 'View price' : 'Ver precio'}</span>
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
