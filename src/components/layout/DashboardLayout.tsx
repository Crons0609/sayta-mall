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
  MessageSquare,
  Settings,
  Sliders,
} from 'lucide-react';
import { SearchModal } from '@/components/ui/SearchModal';
import { PhoneVerificationModal } from '@/components/auth/PhoneVerificationModal';
import { DashboardPreferencesProvider, useDashboardPreferences } from '@/providers/DashboardPreferencesProvider';
import { DashboardSettingsModal } from '@/components/dashboard/DashboardSettingsModal';
import { useTheme } from '@/providers/ThemeProvider';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: 'programmer' | 'owner' | 'employee';
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  return <DashboardLayoutInner role={role}>{children}</DashboardLayoutInner>;
}

function DashboardLayoutInner({ children, role }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, claims, logout, phoneVerified, loading: authLoading } = useAuth();
  const { branches, currentBranch, branchCount, setBranchId, loading: branchLoading } = useBranch();
  const { theme, themeConfig, setSettingsModalOpen, t, language } = useDashboardPreferences();
  const { resolvedTheme } = useTheme();

  const isLight = resolvedTheme === 'light' || theme === 'light';

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

    const activeRole = cookieRole || claims?.role;

    let allowed = false;

    if (role === 'programmer') {
      allowed = activeRole === 'programmer';
    } else if (role === 'owner') {
      allowed =
        activeRole === 'programmer' ||
        activeRole === 'owner' ||
        isImpersonating;
    } else if (role === 'employee') {
      allowed =
        activeRole === 'programmer' ||
        activeRole === 'owner' ||
        activeRole === 'employee';
    }

    if (allowed) {
      setIsAllowed(true);
      setAuthChecked(true);
      return;
    }

    // Si AuthProvider todavía está inicializando la sesión de Firebase, esperar antes de rechazar
    if (authLoading) {
      return;
    }

    // Si terminó de cargar y no está permitido:
    setIsAllowed(false);
    setAuthChecked(true);

    if (activeRole === 'customer') {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}&error=unauthorized_role`);
      return;
    }

    // Redirigir de inmediato al login si no tiene sesión autorizada
    router.replace(`/login?redirect=${encodeURIComponent(pathname)}&error=login_required`);
  }, [role, claims, authLoading, pathname, router]);

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

  // Rol efectivo del usuario autenticado (garantiza que al navegar a módulos compartidos como chat o productos no se pierdan enlaces)
  const effectiveRole: 'programmer' | 'owner' | 'employee' = React.useMemo(() => {
    const cookies = typeof document !== 'undefined' ? document.cookie : '';
    const cookieRole = cookies
      .split('; ')
      .find((c) => c.startsWith('sayta_simulated_role='))
      ?.split('=')[1];

    const isImpersonating = cookies
      .split('; ')
      .some((c) => c.startsWith('sayta_impersonating_owner='));

    if (cookieRole === 'programmer' || cookieRole === 'owner' || cookieRole === 'employee') {
      return cookieRole;
    }
    if (isImpersonating) {
      return 'owner';
    }
    if (claims?.role === 'programmer') {
      return 'programmer';
    }
    if (claims?.role === 'owner') {
      return 'owner';
    }
    if (claims?.role === 'employee') {
      return 'employee';
    }
    return role;
  }, [claims?.role, role]);

  // Enlaces según el rol
  const getNavLinks = () => {
    if (effectiveRole === 'programmer') {
      return [
        { label: t('nav_dashboard_programmer', 'Centro de Comando'), href: '/programador/dashboard', icon: LayoutDashboard },
        { label: t('nav_chat_staff', 'Chat del Personal'), href: '/empleado/chat', icon: MessageSquare, badge: t('badge_live', 'En Vivo') },
        { label: t('nav_delivery', 'Empresas de Delivery'), href: '/programador/delivery', icon: Truck, badge: t('badge_shipping', 'Envíos') },
        { label: t('nav_products', 'Gestión de Productos'), href: '/dueno/productos', icon: Package, badge: t('badge_inventory', 'Inventario') },
        { label: t('nav_categories', 'Categorías'), href: '/programador/categorias', icon: Layers, badge: t('badge_catalog', 'Catálogo') },
        { label: t('nav_owners', 'Dueños de Tienda'), href: '/programador/duenos', icon: Users, badge: t('badge_management', 'Gestión') },
        { label: t('nav_employees', 'Registro de Empleados'), href: '/dueno/empleados', icon: Briefcase },
        { label: t('nav_catalog', 'Catálogo Global'), href: '/catalogo', icon: ShoppingBag },
        { label: t('nav_settings', 'Ajustes de mi Panel'), href: '/programador/ajustes', icon: Settings },
      ];
    }
    if (effectiveRole === 'owner') {
      return [
        { label: t('nav_dashboard_owner', 'Panel Ejecutivo'), href: '/dueno/dashboard', icon: LayoutDashboard },
        { label: t('nav_chat_staff', 'Chat del Personal'), href: '/empleado/chat', icon: MessageSquare, badge: t('badge_live', 'En Vivo') },
        { label: t('nav_products', 'Gestión de Productos'), href: '/dueno/productos', icon: Package, badge: t('badge_inventory', 'Inventario') },
        { label: t('nav_categories', 'Categorías'), href: '/dueno/categorias', icon: Layers, badge: t('badge_catalog', 'Catálogo') },
        { label: t('nav_employees', 'Gestión de Empleados'), href: '/dueno/empleados', icon: Users, badge: t('tab_employees', 'Empleados') },
        { label: t('nav_catalog', 'Catálogo de Productos'), href: '/catalogo', icon: ShoppingBag },
        { label: t('nav_settings', 'Ajustes de mi Panel'), href: '/dueno/ajustes', icon: Settings },
      ];
    }
    return [
      { label: t('nav_dashboard_employee', 'Mi Estación'), href: '/empleado/dashboard', icon: LayoutDashboard },
      { label: t('nav_chat_team', 'Chat del Equipo'), href: '/empleado/chat', icon: MessageSquare, badge: t('badge_live', 'En Vivo') },
      { label: t('nav_products', 'Gestión de Productos'), href: '/empleado/productos', icon: Package, badge: t('badge_inventory', 'Inventario') },
      { label: t('nav_catalog', 'Catálogo de Tienda'), href: '/catalogo', icon: ShoppingBag },
      { label: t('nav_settings', 'Ajustes de mi Panel'), href: '/empleado/ajustes', icon: Settings },
    ];
  };

  const navLinks = getNavLinks();

  // Mientras la autenticación inicial se resuelve
  if (!authChecked || authLoading) {
    return (
      <div className="min-h-screen bg-[#000000] flex flex-col items-center justify-center p-4">
        <div className="apple-card p-8 max-w-sm w-full text-center space-y-4 border-white/[0.08] shadow-2xl animate-fade-in">
          <div className="w-12 h-12 rounded-2xl bg-[#2997ff]/15 border border-[#2997ff]/25 text-[#2997ff] flex items-center justify-center mx-auto animate-pulse">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Cargando Estación
          </h2>
          <p className="text-xs text-[#86868b] leading-relaxed">
            Sincronizando credenciales de trabajo y catálogo...
          </p>
          <div className="w-6 h-6 border-2 border-[#2997ff] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  // Si no está autorizado tras verificar completamente
  if (!isAllowed) {
    return (
      <div className="min-h-screen bg-[#000000] flex flex-col items-center justify-center p-4">
        <div className="apple-card p-8 max-w-sm w-full text-center space-y-4 border-white/[0.08] shadow-2xl animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-500/25 text-purple-300 flex items-center justify-center mx-auto">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Acceso Privado Protegido
          </h2>
          <p className="text-xs text-[#86868b] leading-relaxed">
            Esta sección requiere credenciales autorizadas. Redirigiendo al inicio de sesión seguro...
          </p>
          <div className="w-6 h-6 border-2 border-[#2997ff] border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="pt-2">
            <Link
              href={`/login?redirect=${encodeURIComponent(pathname)}`}
              className="apple-pill-btn apple-btn-primary px-5 py-2 text-xs font-semibold inline-block"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col selection:bg-[#2997ff]/30 selection:text-[#2997ff] transition-colors duration-300 ${
        isLight ? 'bg-[#f5f5f7] text-[#1d1d1f]' : 'text-[#f5f5f7]'
      }`}
      style={{ backgroundColor: isLight ? '#f5f5f7' : themeConfig.previewBg }}
    >
      {/* Banner de Modo Soporte si aplica */}
      {impersonatingOwner && (
        <div className="bg-gradient-to-r from-[#ffd60a]/20 via-[#ff9f0a]/20 to-[#ffd60a]/20 border-b border-[#ffd60a]/30 px-4 py-2 flex items-center justify-between text-xs text-[#ffd60a] z-50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ffd60a] animate-pulse" />
            <span>
              <strong>Modo Soporte Activo:</strong> Estás visualizando el sistema como{' '}
              <strong className={isLight ? 'text-black font-bold' : 'text-white font-bold'}>{impersonatingOwner.name}</strong> ({impersonatingOwner.storeName})
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
      <header className={`sticky top-0 z-40 backdrop-blur-2xl border-b px-4 sm:px-6 h-14 flex items-center justify-between transition-colors ${
        isLight
          ? 'bg-white/90 border-black/[0.08] text-[#1d1d1f]'
          : 'bg-[#000000]/80 border-white/[0.08] text-white'
      }`}>
        <div className="flex items-center gap-3">
          {/* Botón menú móvil */}
          <button
            onClick={() => setSidebarOpen(true)}
            className={`lg:hidden p-2 rounded-xl transition-colors ${
              isLight ? 'text-zinc-700 hover:text-black hover:bg-black/[0.05]' : 'text-[#86868b] hover:text-white hover:bg-white/[0.06]'
            }`}
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
            <span className={`font-semibold text-sm tracking-tight hidden sm:inline ${
              isLight ? 'text-[#1d1d1f]' : 'text-white'
            }`}>
              Sayta Mall
            </span>
          </Link>

          <div className={`h-4 w-px hidden sm:block ${isLight ? 'bg-black/10' : 'bg-white/10'}`} />

          {/* Selector o Indicador de Sucursal */}
          <div className="relative">
            {branchLoading && branchCount === 0 ? (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border animate-pulse ${
                isLight ? 'bg-black/[0.04] text-zinc-700 border-black/[0.08]' : 'bg-white/[0.06] text-[#86868b] border-white/[0.08]'
              }`}>
                <Store className="w-3 h-3 text-[#2997ff] animate-spin" />
                <span>Sincronizando sucursal...</span>
              </span>
            ) : branchCount === 0 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ff453a]/15 text-[#ff453a] text-[11px] font-medium border border-[#ff453a]/25">
                <Store className="w-3 h-3" />
                <span>{t('no_branches', 'Sin sucursales')}</span>
              </span>
            ) : branchCount === 1 ? (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                isLight ? 'bg-black/[0.04] text-zinc-700 border-black/[0.08]' : 'bg-white/[0.06] text-[#86868b] border-white/[0.08]'
              }`}>
                <Store className="w-3 h-3 text-[#30d158]" />
                <span className={`font-medium ${isLight ? 'text-black font-semibold' : 'text-white'}`}>{currentBranch?.name || 'Sucursal Principal'}</span>
              </span>
            ) : (
              // 2 o más sucursales: Dropdown
              <div>
                <button
                  onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl text-xs border transition-all ${
                    isLight
                      ? 'bg-black/[0.04] hover:bg-black/[0.08] text-black border-black/[0.1]'
                      : 'bg-white/[0.06] hover:bg-white/[0.1] text-white border-white/[0.1]'
                  }`}
                >
                  <Store className="w-3.5 h-3.5 text-[#30d158] shrink-0" />
                  <span className="max-w-[80px] xs:max-w-[110px] sm:max-w-[150px] truncate font-medium">
                    {currentBranch?.name || 'Seleccionar sucursal'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-[#86868b] shrink-0" />
                </button>

                {branchDropdownOpen && (
                  <div className={`absolute left-0 mt-2 w-56 rounded-2xl border p-1.5 shadow-2xl z-50 animate-fade-in ${
                    isLight ? 'bg-white border-black/[0.12] text-black shadow-black/10' : 'bg-[#1c1c1e] border-white/[0.12] text-white shadow-2xl'
                  }`}>
                    <span className="block px-2.5 py-1 text-[10px] uppercase font-semibold text-[#86868b] tracking-wider">
                      {t('change_branch', 'Cambiar de Sucursal')}
                    </span>
                    {branches.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => {
                          setBranchId(b.id);
                          setBranchDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                          b.id === currentBranch?.id
                            ? 'bg-[#2997ff] text-white font-medium'
                            : isLight
                              ? 'text-[#515154] hover:text-black hover:bg-black/[0.05]'
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
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition-all ${
              isLight
                ? 'bg-black/[0.04] hover:bg-black/[0.08] border-black/[0.08] text-zinc-700 hover:text-black'
                : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-[#86868b] hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{t('search_placeholder', 'Buscar...')}</span>
            <kbd className={`hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded border ${
              isLight
                ? 'bg-black/[0.06] text-zinc-800 font-semibold border-black/[0.12]'
                : 'bg-white/[0.08] text-[#86868b] border-white/[0.1]'
            }`}>
              ⌘K
            </kbd>
          </button>

          {/* Notificaciones */}
          <button
            title={t('tab_chat', 'Notificaciones')}
            className={`p-2 rounded-xl transition-colors relative ${
              isLight
                ? 'text-zinc-700 hover:text-black hover:bg-black/[0.05]'
                : 'text-[#86868b] hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#2997ff] ring-2 ring-black" />
          </button>

          {/* Ajustes Rápidos del Dashboard (Tema e Idioma) */}
          <button
            onClick={() => setSettingsModalOpen(true)}
            title={t('settings_title', 'Ajustes del Dashboard')}
            className={`p-2 rounded-xl transition-colors relative group ${
              isLight
                ? 'text-zinc-700 hover:text-black hover:bg-black/[0.05]'
                : 'text-[#86868b] hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span className="sr-only">Ajustes</span>
          </button>

          {/* Indicador de Verificación telefónica */}
          {phoneVerified ? (
            <span
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#30d158]/10 text-[#059669] dark:text-[#30d158] border border-[#30d158]/25 text-[11px] font-semibold"
              title="Cuenta con teléfono verificado en Firebase"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verificado</span>
            </span>
          ) : (
            <button
              onClick={() => setPhoneModalOpen(true)}
              className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                isLight
                  ? 'bg-black/[0.04] hover:bg-[#30d158]/15 text-zinc-700 hover:text-[#059669] border border-black/[0.08] hover:border-[#30d158]/30 font-medium'
                  : 'bg-white/[0.04] hover:bg-[#30d158]/15 text-[#86868b] hover:text-[#30d158] border border-white/[0.08] hover:border-[#30d158]/30'
              }`}
              title="Verificar cuenta mediante SMS de Firebase"
            >
              <Smartphone className="w-3 h-3 text-[#30d158]" />
              <span>{t('verify_phone', 'Verificar Celular')}</span>
            </button>
          )}

          {/* Perfil & Salir */}
          <div className={`flex items-center gap-2 pl-2 border-l ${
            isLight ? 'border-black/[0.1]' : 'border-white/[0.08]'
          }`}>
            <div className="text-right hidden sm:block">
              <span className={`block text-xs font-semibold max-w-[120px] truncate ${
                isLight ? 'text-black font-semibold' : 'text-white'
              }`}>
                {user?.displayName || user?.email || 'Administrador'}
              </span>
              <span className={`block text-[10px] uppercase font-semibold tracking-wider ${
                isLight ? 'text-zinc-500' : 'text-[#86868b]'
              }`}>
                {effectiveRole === 'programmer' ? t('superadmin', 'Superadmin') : effectiveRole === 'owner' ? t('role_owner', 'Dueño') : t('role_employee', 'Empleado')}
              </span>
            </div>
            <button
              onClick={() => logout()}
              title={t('logout', 'Cerrar sesión')}
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
          className={`hidden lg:flex flex-col backdrop-blur-xl transition-all duration-300 ${
            collapsed ? 'w-16' : 'w-64'
          } ${
            isLight
              ? 'bg-[#ffffff]/90 border-r border-black/[0.08]'
              : 'bg-[#000000]/60 border-r border-white/[0.08]'
          }`}
        >
          {/* Navegación */}
          <div className="p-3 space-y-1 flex-1">
            {navLinks.map((item) => {
              const active =
                pathname === item.href ||
                (item.href === '/dueno/productos' && pathname === '/empleado/productos') ||
                (item.href === '/dueno/empleados' && pathname === '/programador/empleados');
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-medium transition-all ${
                    active
                      ? isLight
                        ? 'bg-[#0071e3] text-white font-semibold shadow-md shadow-[#0071e3]/20'
                        : 'bg-white text-black font-semibold shadow-sm'
                      : isLight
                        ? 'text-zinc-700 hover:text-black hover:bg-black/[0.05]'
                        : 'text-[#86868b] hover:text-white hover:bg-white/[0.04]'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? (isLight ? 'text-white' : 'text-black') : ''}`} />
                  {!collapsed && (
                    <div className="flex-1 flex items-center justify-between">
                      <span>{item.label}</span>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            active
                              ? isLight ? 'bg-white/20 text-white' : 'bg-black/10 text-black'
                              : isLight ? 'bg-black/[0.06] text-zinc-700 font-semibold border border-black/5' : 'bg-white/[0.08] text-[#86868b]'
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
          <div className={`p-3 border-t ${isLight ? 'border-black/[0.08]' : 'border-white/[0.08]'}`}>
            <Link
              href="/"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-medium transition-colors ${
                isLight
                  ? 'text-zinc-700 hover:text-black hover:bg-black/[0.05]'
                  : 'text-[#86868b] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{t('view_public_store', 'Ver Tienda Pública')}</span>}
            </Link>
          </div>
        </aside>

        {/* Drawer Móvil */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden animate-fade-in">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setSidebarOpen(false)}
            />
            <div className={`fixed left-0 top-0 bottom-0 w-72 p-4 flex flex-col justify-between z-50 animate-slide-in border-r ${
              isLight ? 'bg-white border-black/[0.1] text-black' : 'bg-[#161617] border-white/[0.1] text-white'
            }`}>
              <div className="space-y-4">
                <div className={`flex items-center justify-between pb-3 border-b ${
                  isLight ? 'border-black/[0.08]' : 'border-white/[0.08]'
                }`}>
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
                    <span className={`font-semibold text-sm ${isLight ? 'text-black' : 'text-white'}`}>Sayta Mall</span>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className={`p-1.5 rounded-lg ${isLight ? 'text-black hover:bg-black/[0.05]' : 'text-[#86868b] hover:text-white'}`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-1">
                  {navLinks.map((item) => {
                    const active =
                      pathname === item.href ||
                      (item.href === '/dueno/productos' && pathname === '/empleado/productos') ||
                      (item.href === '/dueno/empleados' && pathname === '/programador/empleados');
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium ${
                          active
                            ? isLight ? 'bg-[#0071e3] text-white font-semibold' : 'bg-white text-black font-semibold'
                            : isLight ? 'text-zinc-700 hover:text-black font-medium' : 'text-[#86868b] hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className={`pt-4 border-t space-y-2 ${isLight ? 'border-black/[0.08]' : 'border-white/[0.08]'}`}>
                <Link
                  href="/"
                  className={`flex items-center gap-2 text-xs px-2 py-1 ${
                    isLight ? 'text-zinc-700 hover:text-black font-medium' : 'text-[#86868b] hover:text-white'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t('back_to_store', 'Volver a la Tienda')}</span>
                </Link>
                <button
                  onClick={() => logout()}
                  className="w-full flex items-center gap-2 text-xs text-[#ff453a] hover:bg-[#ff453a]/10 px-2 py-2 rounded-xl"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('logout', 'Cerrar Sesión')}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Contenido Principal con Centrado y Márgenes adaptados para móviles */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 pb-28 lg:pb-8 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* ─── DOCK / BARRA DE NAVEGACIÓN INFERIOR MÓVIL (NATIVE APP FEEL) ─── */}
      <nav
        aria-label="Navegación móvil inferior"
        className="fixed bottom-0 left-0 right-0 z-40 bg-[#000000]/95 backdrop-blur-2xl border-t border-white/[0.1] lg:hidden safe-bottom px-2 py-1 flex items-center justify-around shadow-2xl"
      >
        {effectiveRole === 'programmer' && (
          <>
            <Link
              href="/programador/dashboard"
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                pathname === '/programador/dashboard'
                  ? 'text-[#2997ff] font-bold'
                  : 'text-[#86868b] hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{t('tab_summary', 'Consola')}</span>
            </Link>

            <Link
              href="/empleado/chat"
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative ${
                pathname === '/empleado/chat'
                  ? 'text-[#30d158] font-bold'
                  : 'text-[#86868b] hover:text-white'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{t('tab_chat', 'Chat')}</span>
              <span className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-[#30d158]" />
            </Link>

            <Link
              href="/programador/duenos"
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                pathname === '/programador/duenos'
                  ? 'text-[#2997ff] font-bold'
                  : 'text-[#86868b] hover:text-white'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{t('tab_owners', 'Dueños')}</span>
            </Link>

            <Link
              href="/programador/delivery"
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                pathname === '/programador/delivery'
                  ? 'text-[#30d158] font-bold'
                  : 'text-[#86868b] hover:text-white'
              }`}
            >
              <Truck className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{t('tab_delivery', 'Delivery')}</span>
            </Link>

            <button
              onClick={() => setSidebarOpen(true)}
              className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[#86868b] hover:text-white transition-all"
            >
              <Menu className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{t('tab_menu', 'Menú')}</span>
            </button>
          </>
        )}

        {effectiveRole === 'owner' && (
          <>
            <Link
              href="/dueno/dashboard"
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                pathname === '/dueno/dashboard'
                  ? 'text-[#2997ff] font-bold'
                  : 'text-[#86868b] hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{t('tab_summary', 'Resumen')}</span>
            </Link>

            <Link
              href="/dueno/productos"
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                pathname === '/dueno/productos'
                  ? 'text-[#2997ff] font-bold'
                  : 'text-[#86868b] hover:text-white'
              }`}
            >
              <Package className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{t('tab_products', 'Productos')}</span>
            </Link>

            <Link
              href="/empleado/chat"
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative ${
                pathname === '/empleado/chat'
                  ? 'text-[#30d158] font-bold'
                  : 'text-[#86868b] hover:text-white'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{t('tab_chat', 'Chat')}</span>
              <span className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-[#30d158]" />
            </Link>

            <Link
              href="/dueno/empleados"
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                pathname === '/dueno/empleados'
                  ? 'text-[#30d158] font-bold'
                  : 'text-[#86868b] hover:text-white'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{t('tab_employees', 'Empleados')}</span>
            </Link>

            <button
              onClick={() => setSidebarOpen(true)}
              className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[#86868b] hover:text-white transition-all"
            >
              <Menu className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{t('tab_menu', 'Más')}</span>
            </button>
          </>
        )}

        {effectiveRole === 'employee' && (
          <>
            <Link
              href="/empleado/dashboard"
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                pathname === '/empleado/dashboard'
                  ? 'text-[#2997ff] font-bold'
                  : 'text-[#86868b] hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{t('tab_station', 'Mi Estación')}</span>
            </Link>

            <Link
              href="/empleado/productos"
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                pathname === '/empleado/productos'
                  ? 'text-[#2997ff] font-bold'
                  : 'text-[#86868b] hover:text-white'
              }`}
            >
              <Package className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{t('tab_products', 'Productos')}</span>
            </Link>

            <Link
              href="/empleado/chat"
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative ${
                pathname === '/empleado/chat'
                  ? 'text-[#30d158] font-bold'
                  : 'text-[#86868b] hover:text-white'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{t('tab_chat', 'Chat')}</span>
              <span className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-[#30d158]" />
            </Link>

            <Link
              href="/catalogo"
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                pathname === '/catalogo'
                  ? 'text-white font-bold'
                  : 'text-[#86868b] hover:text-white'
              }`}
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{t('tab_store', 'Tienda')}</span>
            </Link>

            <button
              onClick={() => setSidebarOpen(true)}
              className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[#86868b] hover:text-white transition-all"
            >
              <Menu className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{t('tab_menu', 'Menú')}</span>
            </button>
          </>
        )}
      </nav>

      {/* Modal de búsqueda rápida (Cmd+K) */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Modal de Verificación Telefónica () */}
      <PhoneVerificationModal isOpen={phoneModalOpen} onClose={() => setPhoneModalOpen(false)} />

      {/* Modal de Ajustes Personales (Tema e Idioma) */}
      <DashboardSettingsModal />
    </div>
  );
}

