// src/components/ui/Navbar.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { useCart } from '@/providers/CartProvider';
import { useBranch } from '@/providers/BranchProvider';
import { useTheme, ThemeMode } from '@/providers/ThemeProvider';
import {
  ShoppingBag,
  Search,
  MapPin,
  User,
  ChevronDown,
  Menu,
  X,
  LogIn,
  Package,
  Smartphone,
  ShieldCheck,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { PhoneVerificationModal } from '@/components/auth/PhoneVerificationModal';

interface NavbarProps {
  onOpenSearch: () => void;
  onOpenBranchModal: () => void;
}

export function Navbar({ onOpenSearch, onOpenBranchModal }: NavbarProps) {
  const pathname = usePathname();
  const { user, claims, logout, phoneVerified } = useAuth();
  const { totalItems, toggleCart } = useCart();
  const { currentBranch, branchCount } = useBranch();
  const { theme, setTheme, resolvedTheme, toggleTheme } = useTheme();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);

  const themeOptions = [
    { value: 'light', label: 'Modo Claro', icon: Sun },
    { value: 'dark', label: 'Modo Oscuro', icon: Moon },
    { value: 'system', label: 'Predeterminado del Sistema', icon: Monitor },
  ];

  const navLinks = [
    { label: 'Inicio', href: '/' },
    { label: 'Catálogo', href: '/catalogo' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full apple-nav">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between gap-4">
        {/* Logo Sayta Mall */}
        <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <div className="relative w-8 h-8 rounded-xl overflow-hidden shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform">
            <Image
              src="/images/logo.png"
              alt="Sayta Mall"
              width={32}
              height={32}
              className="w-full h-full object-contain rounded-xl"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-[#f5f5f7] group-hover:text-white transition-colors leading-none">
              Sayta Mall
            </span>
            <span className="text-[9px] text-[#86868b] tracking-wider hidden sm:inline">
              Super Ahorro Y Todo Aquí
            </span>
          </div>
        </Link>

        {/* Enlaces Centrales estilo Apple */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`text-xs transition-colors ${isActive
                    ? 'text-[#f5f5f7] font-medium'
                    : 'text-[#86868b] hover:text-[#f5f5f7]'
                  }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Acciones Derecha */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Indicador de Sucursal: Solo si hay sucursales registradas */}
          {branchCount > 0 && currentBranch && (
            branchCount >= 2 ? (
              <button
                onClick={onOpenBranchModal}
                type="button"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-[11px] text-[#86868b] hover:text-[#f5f5f7] transition-all"
                title="Cambiar sucursal"
              >
                <MapPin className="w-3 h-3 text-[#30d158]" />
                <span className="max-w-[100px] truncate">{currentBranch.name}</span>
                <ChevronDown className="w-3 h-3 text-[#6e6e73]" />
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-1 text-[11px] text-[#86868b] px-2 py-0.5">
                <MapPin className="w-3 h-3 text-[#30d158]" />
                <span className="truncate">{currentBranch.name}</span>
              </div>
            )
          )}

          {/* Buscador */}
          <button
            onClick={onOpenSearch}
            type="button"
            className="p-1.5 text-[#86868b] hover:text-[#f5f5f7] transition-colors"
            aria-label="Buscar productos"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Selector de Tema: Rápido, Directo y Visible con 1 Clic */}
          <div className="flex items-center bg-white/[0.06] p-0.5 rounded-full border border-white/[0.1] backdrop-blur-md">
            <button
              onClick={() => setTheme('light')}
              type="button"
              className={`p-1.5 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                theme === 'light'
                  ? 'bg-white text-black shadow-md font-bold'
                  : 'text-[#86868b] hover:text-[#f5f5f7]'
              }`}
              title="Modo Claro"
              aria-label="Modo Claro"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme('dark')}
              type="button"
              className={`p-1.5 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                theme === 'dark'
                  ? 'bg-[#1c1c1e] text-white shadow-md font-bold border border-white/10'
                  : 'text-[#86868b] hover:text-[#f5f5f7]'
              }`}
              title="Modo Oscuro"
              aria-label="Modo Oscuro"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme('system')}
              type="button"
              className={`p-1.5 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                theme === 'system'
                  ? 'bg-[#2997ff]/20 text-[#2997ff] border border-[#2997ff]/30 font-bold'
                  : 'text-[#86868b] hover:text-[#f5f5f7]'
              }`}
              title="Predeterminado del Sistema"
              aria-label="Predeterminado del Sistema"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Bolsa de compras: solo activa para usuarios autenticados */}
          {user ? (
            <button
              onClick={toggleCart}
              type="button"
              className="relative p-1.5 text-[#86868b] hover:text-[#f5f5f7] transition-colors"
              aria-label="Bolsa de compras"
            >
              <ShoppingBag className="w-4 h-4" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[15px] h-[15px] px-1 rounded-full text-[9px] font-bold bg-[#0071e3] text-white">
                  {totalItems}
                </span>
              )}
            </button>
          ) : null}

          {/* Usuario / Login */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                type="button"
                className="flex items-center gap-1.5 p-1 text-[#86868b] hover:text-[#f5f5f7] text-xs transition-colors"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt=""
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4" />
                )}
                <ChevronDown className="w-3 h-3 text-[#6e6e73]" />
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 rounded-2xl bg-[#1c1c1e] border border-white/[0.1] shadow-2xl p-2 z-50 animate-fade-in"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-white/[0.08] mb-1">
                    <p className="text-xs font-medium text-white truncate">
                      {user.displayName || 'Usuario'}
                    </p>
                    <p className="text-[10px] text-[#86868b] truncate">{user.email}</p>
                  </div>
                  {/* Estatus  / Verificación Telefónica */}
                  <div className="py-1">
                    {phoneVerified ? (
                      <div className="px-3 py-1 text-[11px] text-[#30d158] font-semibold flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span> Verificada</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          setPhoneModalOpen(true);
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-[#ffd60a] hover:bg-white/[0.08] transition-colors flex items-center gap-1.5"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Verificar Celular</span>
                      </button>
                    )}
                  </div>

                  {/* Acceso a Gestión de Productos para personal */}
                  {(claims?.role === 'programmer' || claims?.role === 'owner') && (
                    <Link
                      href="/dueno/productos"
                      className="block px-3 py-1.5 rounded-lg text-xs text-white hover:bg-white/[0.08] transition-colors"
                    >
                      Gestión de Productos
                    </Link>
                  )}
                  {claims?.role === 'employee' && (
                    <Link
                      href="/empleado/productos"
                      className="block px-3 py-1.5 rounded-lg text-xs text-white hover:bg-white/[0.08] transition-colors"
                    >
                      Gestión de Productos
                    </Link>
                  )}

                  {claims?.role === 'programmer' && (
                    <Link
                      href="/programador/dashboard"
                      className="block px-3 py-1.5 rounded-lg text-xs text-[#2997ff] hover:bg-white/[0.08] transition-colors"
                    >
                      Consola Programador
                    </Link>
                  )}
                  {claims?.role === 'owner' && (
                    <Link
                      href="/dueno/dashboard"
                      className="block px-3 py-1.5 rounded-lg text-xs text-[#30d158] hover:bg-white/[0.08] transition-colors"
                    >
                      Portal Dueño
                    </Link>
                  )}
                  {claims?.role === 'employee' && (
                    <Link
                      href="/empleado/dashboard"
                      className="block px-3 py-1.5 rounded-lg text-xs text-[#2997ff] hover:bg-white/[0.08] transition-colors"
                    >
                      Mi Estación
                    </Link>
                  )}
                  <button
                    onClick={() => logout()}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition-colors mt-1"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="apple-pill-btn apple-btn-primary px-3 py-1 text-xs font-medium flex items-center gap-1"
            >
              <LogIn className="w-3 h-3" />
              <span>Entrar</span>
            </Link>
          )}

          {/* Menú móvil */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            type="button"
            className="md:hidden p-1.5 text-[#86868b] hover:text-[#f5f5f7]"
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Menú móvil expandido */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#000000] border-b border-white/[0.08] px-6 py-4 space-y-3 animate-fade-in">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-[#86868b] hover:text-[#f5f5f7] py-1"
            >
              {link.label}
            </Link>
          ))}
          {branchCount >= 2 && (
            <div className="pt-2 border-t border-white/[0.08]">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenBranchModal();
                }}
                className="flex items-center justify-between w-full text-xs text-[#86868b] py-2"
              >
                <span>Sucursal: {currentBranch?.name}</span>
                <span className="text-[#2997ff]">Cambiar</span>
              </button>
            </div>
          )}

          {/* Selector de tema en móvil */}
          <div className="pt-3 border-t border-white/[0.08]">
            <p className="text-[10px] font-semibold text-[#86868b] uppercase tracking-wider mb-2">
              Tema Visual
            </p>
            <div className="grid grid-cols-3 gap-2">
              {themeOptions.map(({ value, label, icon: Icon }) => {
                const isSelected = theme === value;
                return (
                  <button
                    key={value}
                    onClick={() => setTheme(value as ThemeMode)}
                    type="button"
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl text-xs transition-all ${isSelected
                        ? 'bg-white/[0.15] text-white font-semibold border border-white/20'
                        : 'bg-white/[0.04] text-[#86868b] hover:text-white'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[10px] text-center leading-tight">
                      {value === 'light' ? 'Claro' : value === 'dark' ? 'Oscuro' : 'Sistema'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Verificación Telefónica () */}
      <PhoneVerificationModal
        isOpen={phoneModalOpen}
        onClose={() => setPhoneModalOpen(false)}
      />
    </header>
  );
}
