// src/app/(public)/catalogo/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/ui/Navbar';
import { CartDrawer } from '@/components/ui/CartDrawer';
import { SearchModal } from '@/components/ui/SearchModal';
import { BranchModal } from '@/components/ui/BranchModal';
import { ProductCard, DisplayProduct } from '@/components/ui/ProductCard';
import { StoreInPreparation } from '@/components/branch/StoreInPreparation';
import { useBranch } from '@/providers/BranchProvider';
import { useAuth } from '@/providers/AuthProvider';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { ArrowUpDown, PackageOpen, MapPin, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { ADULT_CATEGORY_NAME } from '@/data/saytaCatalog';
import { AgeVerificationModal, hasAgeVerified } from '@/components/auth/AgeVerificationModal';
import { getProductsFromRtdb } from '@/lib/firebase/rtdb';

export default function CatalogoPage() {
  const { currentBranch, branchCount, loading: loadingBranches } = useBranch();
  const { user } = useAuth();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [products, setProducts] = useState<DisplayProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');
  const [onlyInStock, setOnlyInStock] = useState(false);

  // Verificación de edad para adultos (+18)
  const [isAgeModalOpen, setIsAgeModalOpen] = useState(false);
  const [adultAccessGranted, setAdultAccessGranted] = useState(false);

  useEffect(() => {
    setAdultAccessGranted(hasAgeVerified());
  }, []);

  useEffect(() => {
    const branchId = currentBranch?.id || 'branch-central';
    const branchName = currentBranch?.name || 'Sayta Central';
    const currency = currentBranch?.currency || 'NIO';

    const getLocalProducts = (): DisplayProduct[] => {
      if (typeof window === 'undefined') return [];
      try {
        const stored = localStorage.getItem('sayta_custom_products');
        if (!stored) return [];
        const items = JSON.parse(stored);
        return items
          .filter((p: any) => p.status === 'active' || !p.status)
          .map((data: any) => {
            const isDiscountApproved = data.discountStatus === 'approved' && data.discountPrice;
            return {
              id: data.id,
              name: data.name || 'Producto',
              tagline: data.shortDescription || data.tagline || data.description || '',
              category: data.categoryName || data.category || 'General',
              image: (data.images && data.images[0] ? data.images[0].url : data.image) || '',
              price: user ? (isDiscountApproved ? data.discountPrice : data.price) : undefined,
              originalPrice: user ? (isDiscountApproved ? data.price : data.compareAtPrice) : undefined,
              badge: isDiscountApproved && data.discountPercent ? `-${data.discountPercent}%` : data.badge,
              currency,
              available: (data.stock ?? 0) > 0,
              branchName: data.branchName || branchName,
            };
          });
      } catch (e) {
        return [];
      }
    };

    const updateCombinedProducts = (firestoreItems: DisplayProduct[]) => {
      const local = getLocalProducts();
      const map = new Map<string, DisplayProduct>();
      firestoreItems.forEach((p) => map.set(p.id, p));
      local.forEach((p) => {
        if (!map.has(p.id)) map.set(p.id, p);
      });
      setProducts(Array.from(map.values()));
      setLoadingProducts(false);
    };

    try {
      setLoadingProducts(true);
      const productsRef = collection(db, 'products');
      const q = query(productsRef, where('branchId', '==', branchId));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const loaded: DisplayProduct[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            const isDiscountApproved = data.discountStatus === 'approved' && data.discountPrice;
            loaded.push({
              id: doc.id,
              name: data.name || 'Producto',
              tagline: data.shortDescription || data.tagline || data.description || '',
              category: data.categoryName || data.category || 'General',
              image: (data.images && data.images[0] ? data.images[0].url : data.image) || '',
              price: user ? (isDiscountApproved ? data.discountPrice : data.price) : undefined,
              originalPrice: user ? (isDiscountApproved ? data.price : data.compareAtPrice) : undefined,
              badge: isDiscountApproved && data.discountPercent ? `-${data.discountPercent}%` : data.badge,
              currency,
              available: (data.stock ?? 0) > 0,
              branchName: currentBranch?.name || data.branchName || 'Sayta Central',
            });
          });
          updateCombinedProducts(loaded);
        },
        (error) => {
          updateCombinedProducts([]);
        }
      );

      // Cargar también desde Firebase Realtime Database
      getProductsFromRtdb(branchId).then((rtdbProducts) => {
        if (rtdbProducts && rtdbProducts.length > 0) {
          const loaded: DisplayProduct[] = rtdbProducts.map((data: any) => {
            const isDiscountApproved = data.discountStatus === 'approved' && data.discountPrice;
            return {
              id: data.id,
              name: data.name || 'Producto',
              tagline: data.shortDescription || data.tagline || data.description || '',
              category: data.categoryName || data.category || 'General',
              image: (data.images && data.images[0] ? data.images[0].url : data.image) || '',
              price: user ? (isDiscountApproved ? data.discountPrice : data.price) : undefined,
              originalPrice: user ? (isDiscountApproved ? data.price : data.compareAtPrice) : undefined,
              badge: isDiscountApproved && data.discountPercent ? `-${data.discountPercent}%` : data.badge,
              currency,
              available: (data.stock ?? 0) > 0,
              branchName: currentBranch?.name || data.branchName || 'Sayta Central',
            };
          });
          updateCombinedProducts(loaded);
        }
      }).catch(() => {});

      const handleUpdate = () => {
        updateCombinedProducts([]);
        getProductsFromRtdb(branchId).then((rtdbProducts) => {
          if (rtdbProducts && rtdbProducts.length > 0) {
            const loaded: DisplayProduct[] = rtdbProducts.map((data: any) => {
              const isDiscountApproved = data.discountStatus === 'approved' && data.discountPrice;
              return {
                id: data.id,
                name: data.name || 'Producto',
                tagline: data.shortDescription || data.tagline || data.description || '',
                category: data.categoryName || data.category || 'General',
                image: (data.images && data.images[0] ? data.images[0].url : data.image) || '',
                price: user ? (isDiscountApproved ? data.discountPrice : data.price) : undefined,
                originalPrice: user ? (isDiscountApproved ? data.price : data.compareAtPrice) : undefined,
                badge: isDiscountApproved && data.discountPercent ? `-${data.discountPercent}%` : data.badge,
                currency,
                available: (data.stock ?? 0) > 0,
                branchName: currentBranch?.name || data.branchName || 'Sayta Central',
              };
            });
            updateCombinedProducts(loaded);
          }
        }).catch(() => {});
      };
      window.addEventListener('sayta_products_updated', handleUpdate);

      return () => {
        unsubscribe();
        window.removeEventListener('sayta_products_updated', handleUpdate);
      };
    } catch {
      updateCombinedProducts([]);
    }
  }, [currentBranch?.id, user]);

  if (!loadingBranches && branchCount === 0) {
    return (
      <div className="min-h-screen bg-[#000000] text-[#f5f5f7]">
        <Navbar
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenBranchModal={() => setIsBranchModalOpen(true)}
        />
        <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <StoreInPreparation />
        </main>
      </div>
    );
  }

  // Lista para mostrar: únicamente productos registrados en la base de datos
  const activeProducts: DisplayProduct[] = products;

  // Categorías disponibles (asegurando que aparezca Juguetes Sexuales si hay productos o como opción)
  const rawCategories = Array.from(new Set(activeProducts.map((p) => p.category)));
  if (!rawCategories.includes(ADULT_CATEGORY_NAME)) {
    rawCategories.push(ADULT_CATEGORY_NAME);
  }
  const categories = ['Todos', ...rawCategories];

  const isAdultCategorySelected = selectedCategory === ADULT_CATEGORY_NAME;

  const filteredProducts = activeProducts
    .filter((product) => {
      const isAdultProduct = product.category === ADULT_CATEGORY_NAME;

      // En 'Todos', ocultar productos para adultos a menos que el usuario esté registrado y verificado
      if (selectedCategory === 'Todos') {
        if (isAdultProduct && (!user || !adultAccessGranted)) {
          return false;
        }
      } else {
        if (product.category !== selectedCategory) return false;
      }

      if (onlyInStock && !product.available) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return (a.price ?? 0) - (b.price ?? 0);
      if (sortBy === 'price-desc') return (b.price ?? 0) - (a.price ?? 0);
      return 0;
    });

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    if (cat === ADULT_CATEGORY_NAME && user && !adultAccessGranted) {
      setIsAgeModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300">
      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenBranchModal={() => setIsBranchModalOpen(true)}
      />

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="mb-8 text-left">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Catálogo de Productos
          </h1>
          {currentBranch && (
            <p className="text-xs sm:text-sm text-[#86868b] mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#30d158]" />
              <span>Mostrando productos de <strong>{currentBranch.name}</strong></span>
              {branchCount >= 2 && (
                <button
                  onClick={() => setIsBranchModalOpen(true)}
                  className="text-[#2997ff] hover:underline ml-2"
                >
                  (Cambiar)
                </button>
              )}
            </p>
          )}
        </div>

        {/* Barra de Filtros */}
        <div className="p-4 rounded-2xl bg-[#161617] border border-white/[0.08] mb-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Chips de Categorías */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {categories.map((cat) => {
              const isAdultChip = cat === ADULT_CATEGORY_NAME;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => handleCategorySelect(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? isAdultChip
                        ? 'bg-[#bf5af2] text-white font-semibold shadow-lg shadow-[#bf5af2]/30'
                        : 'bg-white text-black font-semibold'
                      : isAdultChip
                      ? 'bg-[#bf5af2]/10 text-[#bf5af2] border border-[#bf5af2]/30 hover:bg-[#bf5af2]/20'
                      : 'bg-white/[0.04] text-[#86868b] hover:text-[#f5f5f7]'
                  }`}
                >
                  {isAdultChip && <span>🔞</span>}
                  <span>{cat}</span>
                  {isAdultChip && (
                    <span className="text-[10px] px-1 py-0.2 rounded bg-[#bf5af2]/30 text-white font-bold">
                      +18
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Opciones de Disponibilidad y Orden */}
          <div className="flex items-center justify-between md:justify-end gap-4 pt-2 md:pt-0 border-t md:border-t-0 border-white/[0.06]">
            <label className="flex items-center gap-2 text-xs text-[#86868b] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyInStock}
                onChange={(e) => setOnlyInStock(e.target.checked)}
                className="w-4 h-4 rounded bg-white/10 border-white/20 text-[#2997ff]"
              />
              <span>Solo en stock</span>
            </label>

            {user && (
              <div className="flex items-center gap-1.5 bg-white/[0.04] px-3 py-1.5 rounded-xl border border-white/[0.08] text-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#86868b]" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-white focus:outline-none cursor-pointer"
                >
                  <option value="featured" className="bg-[#1c1c1e] text-white">Destacados</option>
                  <option value="price-asc" className="bg-[#1c1c1e] text-white">Menor precio</option>
                  <option value="price-desc" className="bg-[#1c1c1e] text-white">Mayor precio</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Vista Protegida para Categoría de Adultos */}
        {isAdultCategorySelected && !user ? (
          <div className="apple-card p-12 text-center max-w-lg mx-auto space-y-5 my-8 border border-[#bf5af2]/30 bg-gradient-to-br from-[#1a0a1e]/90 to-[#0d0010]/90 shadow-2xl shadow-[#bf5af2]/10 rounded-3xl">
            <div className="w-16 h-16 rounded-2xl bg-[#bf5af2]/20 border border-[#bf5af2]/40 flex items-center justify-center mx-auto text-2xl shadow-lg shadow-[#bf5af2]/20">
              <Lock className="w-7 h-7 text-[#bf5af2]" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#bf5af2]/15 border border-[#bf5af2]/30 text-[#bf5af2] text-xs font-bold">
              <span>🔞</span>
              <span>Solo +18 · Contenido Exclusivo para Adultos</span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">Acceso Solo para Usuarios Registrados</h3>
            <p className="text-xs text-[#86868b] leading-relaxed">
              La categoría <strong className="text-white">Juguetes Sexuales</strong> está estrictamente restringida a personas mayores de 18 años. Debes registrarte o iniciar sesión para acceder.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="apple-pill-btn px-6 py-3 text-xs sm:text-sm font-semibold inline-flex items-center gap-2 bg-[#bf5af2] text-white hover:bg-[#a348d6] transition-all shadow-xl shadow-[#bf5af2]/30"
              >
                <span>Iniciar Sesión / Registrarse</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : isAdultCategorySelected && !adultAccessGranted ? (
          <div className="apple-card p-12 text-center max-w-lg mx-auto space-y-5 my-8 border border-[#bf5af2]/30 bg-gradient-to-br from-[#1a0a1e]/90 to-[#0d0010]/90 shadow-2xl shadow-[#bf5af2]/10 rounded-3xl">
            <div className="w-16 h-16 rounded-2xl bg-[#bf5af2]/20 border border-[#bf5af2]/40 flex items-center justify-center mx-auto text-3xl shadow-lg shadow-[#bf5af2]/20">
              🔞
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">Confirmación de Mayoría de Edad</h3>
            <p className="text-xs text-[#86868b] leading-relaxed">
              Para ver el catálogo de productos íntimos debes confirmar bajo tu responsabilidad legal que tienes <strong className="text-white">18 años o más</strong>.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setIsAgeModalOpen(true)}
                className="apple-pill-btn px-6 py-3 text-xs sm:text-sm font-semibold inline-flex items-center gap-2 bg-[#bf5af2] text-white hover:bg-[#a348d6] transition-all shadow-xl shadow-[#bf5af2]/30 active:scale-95"
              >
                <EyeOff className="w-4 h-4" />
                <span>Confirmar que tengo 18 años o más</span>
              </button>
            </div>
          </div>
        ) : (
          /* Grilla Responsive de Productos */
          <>
            {isAdultCategorySelected && adultAccessGranted && (
              <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-[#bf5af2]/10 border border-[#bf5af2]/20 text-[#bf5af2] text-xs font-medium mb-6">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#bf5af2]" />
                  <span>Acceso verificado a Juguetes Sexuales (+18). Navega con total privacidad.</span>
                </div>
                <button
                  onClick={() => {
                    setAdultAccessGranted(false);
                    sessionStorage.removeItem('sayta_age_verified');
                    setSelectedCategory('Todos');
                  }}
                  className="text-[#86868b] hover:text-white transition-colors text-xs font-normal"
                >
                  Bloquear sección
                </button>
              </div>
            )}

            {loadingProducts ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="apple-card p-4 h-72 animate-pulse bg-white/[0.02]" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="apple-card p-12 text-center max-w-md mx-auto space-y-4 my-8">
                <PackageOpen className="w-12 h-12 text-[#6e6e73] mx-auto" />
                <h3 className="text-lg font-semibold text-white">
                  {isAdultCategorySelected ? 'Próximamente en esta categoría' : 'Aún no hay productos publicados'}
                </h3>
                <p className="text-xs text-[#86868b] leading-relaxed">
                  {isAdultCategorySelected
                    ? 'Los artículos para adultos aparecerán aquí cuando sean agregados al inventario.'
                    : 'No se encontraron productos disponibles con los filtros seleccionados.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {user && <CartDrawer />}

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectProduct={() => {}}
      />

      <BranchModal
        isOpen={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
      />

      <AgeVerificationModal
        isOpen={isAgeModalOpen}
        onConfirm={() => {
          setAdultAccessGranted(true);
          setIsAgeModalOpen(false);
          setSelectedCategory(ADULT_CATEGORY_NAME);
        }}
        onCancel={() => setIsAgeModalOpen(false)}
      />
    </div>
  );
}
