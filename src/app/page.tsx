// src/app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
import { SAYTA_DEPARTMENTS, ADULT_CATEGORY_NAME } from '@/data/saytaCatalog';
import { AgeVerificationModal, hasAgeVerified } from '@/components/auth/AgeVerificationModal';
import { getProductsFromRtdb } from '@/lib/firebase/rtdb';
import {
  ArrowRight,
  MapPin,
  ShoppingBag,
  Store,
  Sparkles,
  Zap,
  ShieldCheck,
  Clock,
  Truck,
  CheckCircle2,
  Search,
  Lock,
  MessageCircle,
  Package,
  Layers,
  Award,
  ChevronRight,
  Tag,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function HomePage() {
  const { branches, currentBranch, branchCount, loading: loadingBranches } = useBranch();
  const { user } = useAuth();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [products, setProducts] = useState<DisplayProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  // Control de sección adultos
  const [isAgeModalOpen, setIsAgeModalOpen] = useState(false);
  const [adultAccessGranted, setAdultAccessGranted] = useState(false);

  // Verifica si ya confirmó en esta sesión al montar
  React.useEffect(() => {
    setAdultAccessGranted(hasAgeVerified());
  }, []);

  // Escucha reactiva de productos reales en Firestore y almacenamiento local
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

  // Si no hay ninguna sucursal registrada en Firestore
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
  const activeProducts: DisplayProduct[] = products.filter(
    (p) => p.category !== ADULT_CATEGORY_NAME
  );
  const adultProducts: DisplayProduct[] = products.filter(
    (p) => p.category === ADULT_CATEGORY_NAME
  );

  // Lista de categorías únicas (sin adultos)
  const categories = [
    'Todos',
    ...Array.from(new Set(activeProducts.map((p) => p.category))),
  ];

  const filteredProducts =
    selectedCategory === 'Todos'
      ? activeProducts
      : activeProducts.filter((p) => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col transition-colors duration-300 selection:bg-[#2997ff]/30 selection:text-[#2997ff]">
      {/* ─── BANNER SUPERIOR INFORMATIVO ─── */}
      <div className="bg-gradient-to-r from-[#0071e3]/20 via-[#30d158]/20 to-[#0071e3]/20 border-b border-white/[0.08] px-4 py-2 text-center text-xs text-[#f5f5f7] flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#30d158] animate-pulse" />
        <span>
          <strong>Sayta Mall:</strong> Herramientas, calzado, moda, fajas, cosméticos, electrónica, bocadillos chinos y hogar en <strong>Córdobas (C$ NIO)</strong>.
        </span>
      </div>

      {/* ─── BARRA DE NAVEGACIÓN ─── */}
      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenBranchModal={() => setIsBranchModalOpen(true)}
      />

      <main className="w-full flex-1">
        {/* ─── HERO SECTION: DISEÑO APPLE PRO ─── */}
        <section className="relative overflow-hidden border-b border-white/[0.08] bg-gradient-to-b from-[var(--hero-from)] via-[var(--hero-via)] to-[var(--hero-to)] transition-colors duration-300">
          {/* Resplandor ambiental de fondo */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[380px] bg-gradient-to-tr from-[#2997ff]/15 via-[#30d158]/10 to-transparent blur-3xl pointer-events-none" />

          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* Columna Izquierda (7 columnas) */}
              <div className="lg:col-span-7 space-y-6 text-left">
                {/* Badge de Sucursal */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-[#86868b] backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-[#30d158]" />
                  <span className="text-white font-medium">
                    {currentBranch?.name || 'Sayta Mall'}
                  </span>
                  <span className="text-[#6e6e73]">· {currentBranch?.city || 'Chichigalpa'}</span>
                  {branchCount >= 2 && (
                    <button
                      onClick={() => setIsBranchModalOpen(true)}
                      className="ml-1 text-[11px] text-[#2997ff] hover:underline"
                    >
                      (Cambiar sucursal)
                    </button>
                  )}
                </div>

                {/* Título Principal */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.06]">
                  Super Ahorro. <br />
                  <span className="apple-text-gradient">Todo en un solo lugar.</span>
                </h1>

                {/* Bajada detallando las categorías reales */}
                <p className="text-sm sm:text-base text-[#86868b] max-w-xl font-normal leading-relaxed">
                  Tu gran tienda por departamentos digital. Descubre lo mejor en <strong>herramientas, calzado, moda, fajas, cosméticos, electrónica, bocadillos chinos importados y hogar</strong> a precios de super ahorro en <strong>Córdobas (C$)</strong>.
                </p>

                {/* Buscador Rápido Integrado en el Hero */}
                <div className="pt-1 max-w-lg">
                  <div
                    onClick={() => setIsSearchOpen(true)}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-xs text-[#86868b] cursor-pointer transition-all shadow-xl"
                  >
                    <Search className="w-4 h-4 text-[#2997ff]" />
                    <span className="flex-1 text-[#86868b]">
                      Buscar taladro, tenis, faja, cosméticos, bocadillos chinos...
                    </span>
                    <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono bg-white/[0.08] text-white rounded border border-white/10">
                      ⌘K
                    </kbd>
                  </div>

                  {/* Etiquetas de departamentos rápidos */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-[11px] text-[#86868b]">
                    <span>Populares:</span>
                    {[
                      'Herramientas',
                      'Calzado',
                      'Fajas',
                      'Cosméticos',
                      'Electrónica',
                      'Bocadillos Chinos',
                      'Hogar',
                    ].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          const match = categories.find((c) =>
                            c.toLowerCase().includes(tag.toLowerCase())
                          );
                          if (match) setSelectedCategory(match);
                          const el = document.getElementById('catalogo');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="px-2 py-0.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-white/70 hover:text-white transition-colors border border-white/[0.04]"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    href="#catalogo"
                    className="apple-pill-btn apple-btn-primary px-6 py-3 text-xs sm:text-sm font-semibold shadow-lg shadow-[#0071e3]/25 flex items-center gap-2"
                  >
                    <span>Ver Catálogo Completo</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>

                  {!user && (
                    <Link
                      href="/login"
                      className="apple-pill-btn apple-btn-secondary px-5 py-3 text-xs sm:text-sm text-white flex items-center gap-2"
                    >
                      <Lock className="w-4 h-4 text-[#ffd60a]" />
                      <span>Iniciar Sesión para Ver Precios</span>
                    </Link>
                  )}
                </div>
              </div>

              {/* Columna Derecha (5 columnas): Imagen de Portada de Departamentos */}
              <div className="lg:col-span-5 relative">
                <div className="relative mx-auto max-w-md lg:max-w-none">
                  {/* Marco con sombra y gradiente */}
                  <div className="relative rounded-3xl overflow-hidden border border-white/[0.12] bg-[#161617]/80 backdrop-blur-xl shadow-2xl group">
                    <img
                      src="/images/sayta-department-showcase.jpg"
                      alt="Sayta Mall Departamentos y Productos"
                      className="w-full h-auto object-cover rounded-3xl group-hover:scale-102 transition-transform duration-700"
                    />

                    {/* Badge Flotante Superior: Variedad de Departamentos */}
                    <div className="absolute top-4 right-4 px-3 py-1.5 rounded-2xl bg-black/75 backdrop-blur-md border border-white/10 text-xs font-semibold text-white flex items-center gap-2 shadow-xl animate-fade-in">
                      <Sparkles className="w-3.5 h-3.5 text-[#2997ff]" />
                      <span>10 Departamentos Activos</span>
                    </div>

                    {/* Badge Flotante Inferior: Precios en C$ */}
                    <div className="absolute bottom-4 left-4 px-3.5 py-2 rounded-2xl bg-black/80 backdrop-blur-md border border-white/10 text-xs font-semibold text-white flex items-center gap-2.5 shadow-xl">
                      <div className="w-6 h-6 rounded-lg bg-[#30d158]/20 text-[#30d158] flex items-center justify-center font-bold text-xs">
                        C$
                      </div>
                      <div>
                        <div className="text-[10px] text-[#86868b] leading-none">Moneda Oficial</div>
                        <div className="text-xs font-bold text-white mt-0.5">Super Ahorro Garantizado</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* â”€â”€â”€ CUADRÃCULA DE DEPARTAMENTOS Y CATEGORÃAS â”€â”€â”€ */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#30d158] block">
                Departamentos Sayta
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Explora por CategorÃ­a
              </h2>
            </div>
            <a href="#catalogo" className="text-xs text-[#2997ff] hover:underline flex items-center gap-1">
              <span>Ver todos los artÃ­culos</span>
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {SAYTA_DEPARTMENTS.map((dept) => {
              const isSelected = selectedCategory === dept.name;
              return (
                <button
                  key={dept.id}
                  onClick={() => {
                    setSelectedCategory(dept.name);
                    const el = document.getElementById('catalogo');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all group flex flex-col justify-between relative ${isSelected
                    ? 'bg-white/[0.08] border-[#2997ff] shadow-lg shadow-[#2997ff]/10'
                    : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/[0.06] hover:border-white/[0.12]'
                    }`}
                >
                  {dept.badge && (
                    <span className="absolute top-3 right-3 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#2997ff]/20 text-[#2997ff] border border-[#2997ff]/30">
                      {dept.badge}
                    </span>
                  )}
                  <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                    {dept.icon}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-[#2997ff] transition-colors leading-tight">
                      {dept.name}
                    </h4>
                    <p className="text-[10px] text-[#86868b] mt-1 line-clamp-1">{dept.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

      {/* ─── SECCIÓN DEL CATÁLOGO DE PRODUCTOS ─── */}
      <section id="catalogo" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#2997ff] block">
              Inventario Disponible
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Catálogo de Productos
            </h2>
            <p className="text-xs text-[#86868b] mt-1">
              {currentBranch
                ? `Mostrando existencias para ${currentBranch.name}`
                : 'Catálogo de novedades y ofertas Sayta Mall'}
            </p>
          </div>

          {/* Chips de Categorías con Scroll Horizontal en Móvil */}
          {categories.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none max-w-full">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${selectedCategory === cat
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'bg-white/[0.05] text-[#86868b] hover:text-white hover:bg-white/[0.08]'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Aviso Informativo si no ha iniciado sesión */}
        {!user && (
          <div className="mb-6 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-[#ffd60a]">
              <Lock className="w-4 h-4 shrink-0" />
              <span>
                <strong>Precios protegidos:</strong> Inicia sesión con cualquier correo o con Google para ver precios exactos en <strong>Córdobas (C$)</strong> y comprar.
              </span>
            </div>
            <Link
              href="/login"
              className="apple-pill-btn apple-btn-primary px-4 py-1.5 text-xs font-semibold shrink-0 text-center"
            >
              Iniciar Sesión / Registrarse
            </Link>
          </div>
        )}

        {/* Grid de Productos */}
        {loadingProducts ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="apple-card p-6 h-64 animate-pulse bg-white/[0.02] rounded-3xl" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center apple-card rounded-3xl border-white/[0.06] space-y-3">
            <Package className="w-8 h-8 mx-auto text-[#86868b]" />
            <h3 className="text-sm font-semibold text-white">
              {products.length === 0
                ? 'No hay productos disponibles por el momento'
                : 'No hay productos en esta categoría'}
            </h3>
            <p className="text-xs text-[#86868b]">
              {products.length === 0
                ? 'Los productos añadidos a la tienda aparecerán aquí automáticamente.'
                : 'Selecciona otra categoría o restablece el filtro para ver todo.'}
            </p>
            {products.length > 0 && selectedCategory !== 'Todos' && (
              <button
                onClick={() => setSelectedCategory('Todos')}
                className="text-xs text-[#2997ff] hover:underline mt-2"
              >
                Ver todos los productos
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* ─── 4 PILARES DE CONFIANZA SAYTA MALL ─── */}
      <section className="w-full border-t border-white/[0.08] bg-[var(--bg-section)] py-16 transition-colors duration-300">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
            <span className="text-[11px] font-semibold text-[#30d158] uppercase tracking-wider">
              Super Ahorro Garantizado
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              ¿Por qué comprar en Sayta Mall?
            </h2>
            <p className="text-xs text-[#86868b]">
              Tu tienda de confianza con la mayor variedad de productos y el mejor trato al cliente.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="apple-card p-6 space-y-3 bg-[#161617]/80">
              <div className="w-10 h-10 rounded-2xl bg-[#ffd60a]/15 text-[#ffd60a] flex items-center justify-center font-bold text-base">
                C$
              </div>
              <h3 className="text-sm font-bold text-white">Precios en Córdobas (C$)</h3>
              <p className="text-xs text-[#86868b] leading-relaxed">
                Precios directos de fábrica e importación sin conversiones sorpresas ni comisiones ocultas.
              </p>
            </div>

            <div className="apple-card p-6 space-y-3 bg-[#161617]/80">
              <div className="w-10 h-10 rounded-2xl bg-[#30d158]/15 text-[#30d158] flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Entregas Rápidas en tu Ciudad</h3>
              <p className="text-xs text-[#86868b] leading-relaxed">
                Despachos inmediatos a domicilio en moto o retiro rápido en sucursal.
              </p>
            </div>

            <div className="apple-card p-6 space-y-3 bg-[#161617]/80">
              <div className="w-10 h-10 rounded-2xl bg-[#2997ff]/15 text-[#2997ff] flex items-center justify-center">
                <Store className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Variedad Multisucursal</h3>
              <p className="text-xs text-[#86868b] leading-relaxed">
                Herramientas, moda, fajas, cosméticos, snacks y tecnología en un solo lugar.
              </p>
            </div>

            <div className="apple-card p-6 space-y-3 bg-[#161617]/80">
              <div className="w-10 h-10 rounded-2xl bg-[#bf5af2]/15 text-[#bf5af2] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Garantía de Satisfacción</h3>
              <p className="text-xs text-[#86868b] leading-relaxed">
                Revisamos cada artículo antes de su entrega para asegurar que recibas calidad al 100%.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── LLAMADO A LA ACCIÓN ─── */}
      {!user && (
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-[#0071e3]/20 via-[#30d158]/15 to-[#0071e3]/20 border border-white/[0.1] text-center space-y-4 relative overflow-hidden">
            <span className="text-[11px] font-semibold text-[#30d158] uppercase tracking-wider">
              Desbloquea Precios Exclusivos
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Crea tu cuenta gratis en Sayta Mall
            </h2>
            <p className="text-xs sm:text-sm text-[#86868b] max-w-lg mx-auto leading-relaxed">
              Regístrate con tu correo o cuenta de Google en menos de 1 minuto y empieza a comprar con precios de super ahorro.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="apple-pill-btn apple-btn-primary px-8 py-3.5 text-xs sm:text-sm font-semibold inline-flex items-center gap-2 shadow-xl shadow-[#0071e3]/25"
              >
                <span>Crear Cuenta Gratis</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── SECCIÓN ADULTOS +18 ─── */}
      <section className="w-full border-t border-[#bf5af2]/15 py-12">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header +18 */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#bf5af2]/15 border border-[#bf5af2]/30 text-[#bf5af2] text-[11px] font-bold mb-2">
                <span>🔞</span>
                <span>Solo +18 · Contenido para Adultos</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Juguetes Sexuales
              </h2>
              <p className="text-xs text-[#86868b] mt-1">
                Artículos íntimos exclusivos para adultos verificados. Registro y confirmación de edad requeridos.
              </p>
            </div>
          </div>

          {/* Gate: No ha iniciado sesión */}
          {!user ? (
            <div className="relative overflow-hidden rounded-3xl border border-[#bf5af2]/20 bg-gradient-to-br from-[#1a0a1e]/80 to-[#0d0010]/80 p-10 text-center space-y-4">
              <div className="absolute inset-0 bg-gradient-to-br from-[#bf5af2]/5 to-transparent opacity-30" />
              <div className="relative z-10 space-y-4">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-[#bf5af2]/20 border border-[#bf5af2]/30 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-[#bf5af2]" />
                </div>
                <h3 className="text-lg font-bold text-white">Acceso Restringido</h3>
                <p className="text-xs text-[#86868b] max-w-sm mx-auto leading-relaxed">
                  Debes <strong className="text-white">crear una cuenta o iniciar sesión</strong> y confirmar tu mayoría de edad para ver esta sección.
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#bf5af2] text-white text-sm font-semibold hover:bg-[#a348d6] transition-colors shadow-lg shadow-[#bf5af2]/30"
                >
                  <span>Iniciar Sesión / Registrarse</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : !adultAccessGranted ? (
            /* Gate: Usuario con sesión pero sin verificar edad */
            <div className="relative overflow-hidden rounded-3xl border border-[#bf5af2]/25 bg-gradient-to-br from-[#1a0a1e]/90 to-[#0d0010]/90 p-10 text-center space-y-4">
              <div className="relative z-10 space-y-4">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-[#bf5af2]/30 to-[#9b3cc7]/20 border border-[#bf5af2]/40 flex items-center justify-center">
                  <span className="text-2xl">🔞</span>
                </div>
                <h3 className="text-lg font-bold text-white">Verifica tu Edad para Continuar</h3>
                <p className="text-xs text-[#86868b] max-w-sm mx-auto leading-relaxed">
                  Esta sección está disponible solo para <strong className="text-white">mayores de 18 años</strong>.
                  Confirma tu edad para acceder a los productos íntimos para adultos.
                </p>
                <button
                  onClick={() => setIsAgeModalOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#bf5af2] text-white text-sm font-semibold hover:bg-[#a348d6] transition-colors shadow-lg shadow-[#bf5af2]/30 active:scale-95"
                >
                  <EyeOff className="w-4 h-4" />
                  <span>Confirmar que soy mayor de 18 años</span>
                </button>
              </div>
            </div>
          ) : (
            /* Contenido adulto desbloqueado */
            <div className="space-y-4">
              {/* Banner verificado */}
              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#bf5af2]/[0.08] border border-[#bf5af2]/20 text-[#bf5af2] text-xs font-medium">
                <Eye className="w-4 h-4 flex-shrink-0" />
                <span>Acceso verificado — Mayor de 18 años. Navega con responsabilidad.</span>
                <button
                  onClick={() => { setAdultAccessGranted(false); sessionStorage.removeItem('sayta_age_verified'); }}
                  className="ml-auto text-[#86868b] hover:text-white transition-colors text-[11px]"
                >
                  Ocultar sección
                </button>
              </div>

              {/* Grid o estado vacío */}
              {loadingProducts ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="apple-card p-6 h-64 animate-pulse bg-white/[0.02] rounded-3xl" />
                  ))}
                </div>
              ) : adultProducts.length === 0 ? (
                <div className="p-12 text-center rounded-3xl border border-[#bf5af2]/15 bg-[#1a0a1e]/40 space-y-3">
                  <Package className="w-8 h-8 mx-auto text-[#bf5af2]/50" />
                  <h3 className="text-sm font-semibold text-white">
                    Próximamente — Categoría en preparación
                  </h3>
                  <p className="text-xs text-[#86868b]">
                    Los productos de esta categoría aparecerán aquí cuando el personal los agregue al inventario.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                  {adultProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Modal de Verificación de Edad */}
      <AgeVerificationModal
        isOpen={isAgeModalOpen}
        onConfirm={() => {
          setAdultAccessGranted(true);
          setIsAgeModalOpen(false);
        }}
        onCancel={() => setIsAgeModalOpen(false)}
      />
    </main>


      {/* ─── FOOTER APPLE STYLE ─── */}
      <footer className="w-full border-t border-white/[0.08] bg-[var(--footer-bg)] py-12 text-xs text-[#86868b] transition-colors duration-300">
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="relative w-7 h-7 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
              <Image
                src="/images/logo.png"
                alt="Sayta Mall"
                width={28}
                height={28}
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <span className="font-bold text-white text-sm">Sayta Mall</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Super Ahorro Y Todo Aquí. Tienda departamental multisucursal: herramientas, calzado, ropa, fajas, cosméticos, electrónica, bocadillos chinos y hogar en Córdobas (C$).
          </p>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-white mb-3">Departamentos Destacados</h4>
          <ul className="space-y-2 text-[11px]">
            <li><a href="#catalogo" className="hover:text-white transition-colors">Herramientas & Ferretería</a></li>
            <li><a href="#catalogo" className="hover:text-white transition-colors">Calzado & Ropa</a></li>
            <li><a href="#catalogo" className="hover:text-white transition-colors">Ropa Íntima & Fajas</a></li>
            <li><a href="#catalogo" className="hover:text-white transition-colors">Cosméticos & Belleza</a></li>
            <li><a href="#catalogo" className="hover:text-white transition-colors">Electrónica & Gadgets</a></li>
            <li><a href="#catalogo" className="hover:text-white transition-colors">Bocadillos Chinos & Snacks</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-white mb-3">Accesos del Sistema</h4>
          <ul className="space-y-2 text-[11px]">
            <li><Link href="/login" className="hover:text-white transition-colors">Iniciar Sesión / Registrarse</Link></li>
            <li><Link href="/dueno/dashboard" className="hover:text-white transition-colors">Portal del Dueño</Link></li>
            <li><Link href="/empleado/dashboard" className="hover:text-white transition-colors">Portal de Empleados</Link></li>
            <li><Link href="/programador/dashboard" className="hover:text-white transition-colors">Consola Superadmin</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-white mb-3">Atención Inmediata</h4>
          <p className="text-[11px] leading-relaxed mb-3">
            ¿Consultas sobre un producto, pedido especial o cotización por mayor? Escríbenos directamente.
          </p>
          <a
            href="https://wa.me/50588880000"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#30d158]/15 text-[#30d158] hover:bg-[#30d158]/25 text-[11px] font-semibold transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp de Pedidos</span>
          </a>
        </div>
      </div>

      <div className="pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#6e6e73]">
        <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-center sm:text-left">
          <p>© {new Date().getFullYear()} Sayta Mall. Super Ahorro Y Todo Aquí. Todos los derechos reservados.</p>
          <span className="hidden sm:inline">·</span>
          <p className="text-[#86868b]">
            Desarrollado por <span className="font-semibold text-white">ProLine System</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span>Moneda Oficial: NIO (C$)</span>
          <span>·</span>
          <a href="#" className="hover:text-white">Términos</a>
          <span>·</span>
          <a href="#" className="hover:text-white">Privacidad</a>
        </div>
      </div>
    </div>
  </footer>

  {/* ─── BOTÓN FLOTANTE DE WHATSAPP (Ajustado para no tapar la barra móvil) ─── */}
  <a
    href="https://wa.me/50588880000"
    target="_blank"
    rel="noopener noreferrer"
    className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40 w-12 h-12 rounded-full bg-[#30d158] text-black flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-transform"
    title="Atención por WhatsApp"
  >
    <MessageCircle className="w-6 h-6 fill-current" />
  </a>

  {/* ─── MODALES DE BÚSQUEDA Y SUCURSAL ─── */ }
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <BranchModal isOpen={isBranchModalOpen} onClose={() => setIsBranchModalOpen(false)} />
      <CartDrawer />
    </div >
  );
}

