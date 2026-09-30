// src/components/layout/DashboardLayout.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { useBranch } from '@/providers/BranchProvider';
import {
  LayoutDashboard,
  Users,
  Store,
  Briefcase,
  Shield,
  Search,
  Bell,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Sparkles,
  ShoppingBag,
  Clock,
  ArrowLeft,
  LifeBuoy,
  ChevronRight,
  Package,
  Layers,
  Building,
  Smartphone,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { SearchModal } from '@/components/ui/SearchModal';
import { PhoneVerificationModal } from '@/components/auth/PhoneVerificationModal';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: 'programmer' | 'owner' | 'employee';
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, claims, logout, phoneVerified } = useAuth();
  const { branches, currentBranch, branchCount, setBranchId } = useBranch();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [impersonatingOwner, setImpersonatingOwner] = useState<any>(null);
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAllowed, setIsAllowed] = useState(false);

  // Verificación estricta de autorización y permisos de ruta
  useEffect(() => {
    const cookies = typeof document !== 'undefined' ? document.cookie : '';
    const cookieRole = cookies
      .split('; ')
      .find((c) => c.startsWith('sayta_simulated_role='))
      ?.split('=')[1];

    const hasSessionCookie = cookies
      .split('; ')
      .some((c) => c.startsWith('session='));

    const isImpersonating = cookies
      .split('; ')
      .some((c) => c.startsWith('sayta_impersonating_owner='));

    let allowed = false;

    if (role === 'programmer') {
      allowed = cookieRole === 'programmer' || claims?.role === 'programmer';
    } else if (role === 'owner') {
      allowed =
        cookieRole === 'programmer' ||
        cookieRole === 'owner' ||
        claims?.role === 'programmer' ||
        claims?.role === 'owner' ||
        isImpersonating;
    } else if (role === 'employee') {
      allowed =
        cookieRole === 'programmer' ||
        cookieRole === 'owner' ||
        cookieRole === 'employee' ||
        claims?.role === 'programmer' ||
        claims?.role === 'owner' ||
        claims?.role === 'employee';
    }

    if (!allowed && !hasSessionCookie && !cookieRole) {
      setIsAllowed(false);
      setAuthChecked(true);
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}&error=login_required`);
      return;
    }

    if (!allowed && cookieRole === 'customer') {
      setIsAllowed(false);
      setAuthChecked(true);
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}&error=unauthorized_role`);
      return;
    }

    setIsAllowed(allowed);
    setAuthChecked(true);
  }, [role, claims, pathname, router]);

  // Detectar soporte / impersonación desde cookies
  useEffect(() => {
    const cookies = document.cookie.split('; ');
    const impCookie = cookies.find((c) => c.startsWith('sayta_impersonating_owner='));
    if (impCookie) {
      try {
        const val = decodeURIComponent(impCookie.split('=')[1]);
        if (val) {
          setImpersonatingOwner(JSON.parse(val));
        }
      } catch (e) {
        // ignore
      }
    }
  }, [pathname]);

  // Atajo de teclado Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleExitImpersonation = async () => {
    try {
      const res = await fetch('/api/impersonate', { method: 'DELETE' });
      const data = await res.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        window.location.href = '/programador/duenos';
      }
    } catch (e) {
      window.location.href = '/programador/duenos';
    }
  };

  // Enlaces según el rol
  const getNavLinks = () => {
    if (role === 'programmer') {
      return [
        { label: 'Centro de Comando', href: '/programador/dashboard', icon: LayoutDashboard },
        { label: 'Empresas de Delivery', href: '/programador/delivery', icon: Truck, badge: 'Envíos' },
        { label: 'Gestión de Productos', href: '/dueno/productos', icon: Package, badge: 'Inventario' },
        { label: 'Categorías', href: '/programador/categorias', icon: Layers, badge: 'Catálogo' },
        { label: 'Dueños de Tienda', href: '/programador/duenos', icon: Users, badge: 'Gestión' },
        { label: 'Registro de Empleados', href: '/dueno/empleados', icon: Briefcase },
        { label: 'Catálogo Global', href: '/catalogo', icon: ShoppingBag },
      ];
    }
    if (role === 'owner') {
      return [
        { label: 'Panel Ejecutivo', href: '/dueno/dashboard', icon: LayoutDashboard },
        { label: 'Gestión de Productos', href: '/dueno/productos', icon: Package, badge: 'Inventario' },
        { label: 'Categorías', href: '/dueno/categorias', icon: Layers, badge: 'Catálogo' },
        { label: 'Gestión de Empleados', href: '/dueno/empleados', icon: Users, badge: 'Áreas' },
        { label: 'Catálogo de Productos', href: '/catalogo', icon: ShoppingBag },
      ];
    }
    return [
      { label: 'Mi Estación', href: '/empleado/dashboard', icon: LayoutDashboard },
      { label: 'Gestión de Productos', href: '/empleado/productos', icon: Package, badge: 'Inventario' },
      { label: 'Catálogo de Tienda', href: '/catalogo', icon: ShoppingBag },
    ];
  };

  const navLinks = getNavLinks();

  // Si no está verificado o no está autorizado, bloquear renderizado y mostrar pantalla de seguridad
  if (!authChecked || !isAllowed) {
    return (
      <div className="min-h-screen bg-[#000000] flex flex-col items-center justify-center p-4">
        <div className="apple-card p-8 max-w-sm w-full text-center space-y-4 border-white/[0.08] shadow-2xl animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-500/25 text-purple-300 flex items-center justify-center mx-auto animate-pulse">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Acceso Privado Protegido
          </h2>
          <p className="text-xs text-[#86868b] leading-relaxed">
            Esta sección requiere credenciales autorizadas. Verificando sesión y redirigiendo a la pantalla de acceso seguro...
          </p>
          <div className="w-6 h-6 border-2 border-[#2997ff] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] text-[#f5f5f7] flex flex-col selection:bg-[#2997ff]/30 selection:text-[#2997ff]">
      {/* Banner de Modo Soporte si aplica */}
      {impersonatingOwner && (
        <div className="bg-gradient-to-r from-[#ffd60a]/20 via-[#ff9f0a]/20 to-[#ffd60a]/20 border-b border-[#ffd60a]/30 px-4 py-2 flex items-center justify-between text-xs text-[#ffd60a] z-50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ffd60a] animate-pulse" />
            <span>
              <strong>Modo Soporte Activo:</strong> Estás visualizando el sistema como{' '}
              <strong className="text-white">{impersonatingOwner.name}</strong> ({impersonatingOwner.storeName})
            </span>
          </div>
          <button
            onClick={handleExitImpersonation}
            className="px-3 py-1 bg-[#ffd60a] text-black font-semibold rounded-lg hover:bg-white transition-colors"
          >
            Salir de Modo Soporte
          </button>
        </div>
      )}

      {/* Topbar Apple Style */}
      <header className="sticky top-0 z-40 bg-[#000000]/80 backdrop-blur-2xl border-b border-white/[0.08] px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Botón menú móvil */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl text-[#86868b] hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8 rounded-xl overflow-hidden shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
              <Image
                src="/images/logo.png"
                alt="Sayta Mall"
                width={32}
                height={32}
                className="w-full h-full object-contain rounded-xl"
                priority
              />
            </div>
            <span className="font-semibold text-sm tracking-tight text-white hidden sm:inline">
              Sayta Mall
            </span>
          </Link>

          <div className="h-4 w-px bg-white/10 hidden sm:block" />

          {/* Selector o Indicador de Sucursal */}
          <div className="relative">
            {branchCount === 0 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ff453a]/15 text-[#ff453a] text-[11px] font-medium border border-[#ff453a]/25">
                <Store className="w-3 h-3" />
                <span>Sin sucursales</span>
              </span>
            ) : branchCount === 1 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.06] text-[#86868b] text-[11px] font-medium border border-white/[0.08]">
                <Store className="w-3 h-3 text-[#30d158]" />
                <span className="text-white font-medium">{currentBranch?.name || 'Sucursal Principal'}</span>
              </span>
            ) : (
              // 2 o más sucursales: Dropdown
              <div>
                <button
                  onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs text-white border border-white/[0.1] transition-all"
                >
                  <Store className="w-3.5 h-3.5 text-[#30d158]" />
                  <span className="max-w-[130px] truncate font-medium">
                    {currentBranch?.name || 'Seleccionar sucursal'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-[#86868b]" />
                </button>

                {branchDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-56 rounded-2xl bg-[#1c1c1e] border border-white/[0.12] p-1.5 shadow-2xl z-50 animate-fade-in">
                    <span className="block px-2.5 py-1 text-[10px] uppercase font-semibold text-[#86868b] tracking-wider">
                      Cambiar de Sucursal
                    </span>
                    {branches.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => {
                          setBranchId(b.id);
                          setBranchDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${b.id === currentBranch?.id
                            ? 'bg-[#2997ff] text-white font-medium'
                            : 'text-[#86868b] hover:text-white hover:bg-white/[0.06]'
                          }`}
                      >
                        <span className="truncate">{b.name}</span>
                        {b.id === currentBranch?.id && (
                          <span className="text-[10px]">● Activa</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Acciones de la derecha: Buscador Cmd+K, Notificaciones, Perfil */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Botón de búsqueda rápida */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-[#86868b] hover:text-white transition-all"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Buscar...</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white/[0.08] text-[#86868b] rounded border border-white/[0.1]">
              ⌘K
            </kbd>
          </button>

          {/* Notificaciones */}
          <button
            title="Notificaciones"
            className="p-2 rounded-xl text-[#86868b] hover:text-white hover:bg-white/[0.06] transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#2997ff] ring-2 ring-black" />
          </button>

          {/* Indicador de  / Verificación telefónica */}
          {phoneVerified ? (
            <span
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#30d158]/10 text-[#30d158] border border-[#30d158]/25 text-[11px] font-medium"
              title="Cuenta con teléfono verificado en Firebase ()"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span></span>
            </span>
          ) : (
            <button
              onClick={() => setPhoneModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-[#30d158]/15 text-[#86868b] hover:text-[#30d158] border border-white/[0.08] hover:border-[#30d158]/30 text-[11px] font-medium transition-all"
              title="Verificar cuenta mediante SMS de Firebase"
            >
              <Smartphone className="w-3 h-3 text-[#30d158]" />
              <span>Verificar Celular</span>
            </button>
          )}

          {/* Perfil & Salir */}
          <div className="flex items-center gap-2 pl-2 border-l border-white/[0.08]">
            <div className="text-right hidden sm:block">
              <span className="block text-xs font-medium text-white max-w-[120px] truncate">
                {user?.displayName || user?.email || 'Administrador'}
              </span>
              <span className="block text-[10px] uppercase font-semibold text-[#86868b] tracking-wider">
                {role === 'programmer' ? 'Superadmin' : role === 'owner' ? 'Dueño' : 'Empleado'}
              </span>
            </div>
            <button
              onClick={() => logout()}
              title="Cerrar sesión"
              className="p-2 rounded-xl text-[#86868b] hover:text-[#ff453a] hover:bg-[#ff453a]/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Cuerpo principal con Sidebar y Contenido */}
      <div className="flex-1 flex">
        {/* Sidebar Desktop */}
        <aside
          className={`hidden lg:flex flex-col border-r border-white/[0.08] bg-[#000000]/60 backdrop-blur-xl transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'
            }`}
        >
          {/* Navegación */}
          <div className="p-3 space-y-1 flex-1">
            {navLinks.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-medium transition-all ${active
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'text-[#86868b] hover:text-white hover:bg-white/[0.04]'
                    }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-black' : ''}`} />
                  {!collapsed && (
                    <div className="flex-1 flex items-center justify-between">
                      <span>{item.label}</span>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${active
                              ? 'bg-black/10 text-black'
                              : 'bg-white/[0.08] text-[#86868b]'
                            }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Pie de sidebar: Volver a la tienda */}
          <div className="p-3 border-t border-white/[0.08]">
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-medium text-[#86868b] hover:text-white hover:bg-white/[0.04] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Ver Tienda Pública</span>}
            </Link>
          </div>
        </aside>

        {/* Drawer Móvil */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden animate-fade-in">
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed left-0 top-0 bottom-0 w-72 bg-[#161617] border-r border-white/[0.1] p-4 flex flex-col justify-between z-50 animate-slide-in">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2.5">
                    <div className="relative w-8 h-8 rounded-xl overflow-hidden shadow-md shadow-purple-500/20 flex-shrink-0">
                      <Image
                        src="/images/logo.png"
                        alt="Sayta Mall"
                        width={32}
                        height={32}
                        className="w-full h-full object-contain rounded-xl"
                      />
                    </div>
                    <span className="font-semibold text-sm text-white">Sayta Mall</span>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-1.5 rounded-lg text-[#86868b] hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-1">
                  {navLinks.map((item) => {
                    const active = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium ${active
                            ? 'bg-white text-black font-semibold'
                            : 'text-[#86868b] hover:text-white'
                          }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.08] space-y-2">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-xs text-[#86868b] hover:text-white px-2 py-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Volver a la Tienda</span>
                </Link>
                <button
                  onClick={() => logout()}
                  className="w-full flex items-center gap-2 text-xs text-[#ff453a] hover:bg-[#ff453a]/10 px-2 py-2 rounded-xl"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Contenido Principal con Centrado y Márgenes */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Modal de búsqueda rápida (Cmd+K) */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Modal de Verificación Telefónica () */}
      <PhoneVerificationModal isOpen={phoneModalOpen} onClose={() => setPhoneModalOpen(false)} />
    </div>
  );
}
