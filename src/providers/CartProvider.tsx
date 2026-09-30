// src/providers/CartProvider.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  quantity: number;
  unit: string;
  branchId?: string;
  branchName?: string;
}

interface CartContextValue {
  items: CartItem[];
  isOpen: boolean;
  totalItems: number;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  currency: string;
  freeShippingThreshold: number;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addToCart: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  appliedCoupon: string | null;
  applyCoupon: (code: string, discountPercent?: number) => boolean;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const CART_STORAGE_KEY = 'sayta_cart_items_v2';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [currency, setCurrency] = useState<string>('NIO');
  const [isInitialized, setIsInitialized] = useState(false);

  // Cargar de localStorage sin datos ficticios por defecto
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch {
      // Ignorar errores en SSR
    }
    setIsInitialized(true);
  }, []);

  // Guardar en localStorage
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Fallback
    }
  }, [items, isInitialized]);

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0);
  const discount = discountPercent > 0 ? Math.round(subtotal * (discountPercent / 100)) : 0;
  const shipping = 0; // Se calcula según configuración de la sucursal activa
  const total = Math.max(0, subtotal - discount + shipping);

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);
  const toggleCart = () => setIsOpen((prev) => !prev);

  const addToCart = (product: Omit<CartItem, 'quantity'>, qty = 1) => {
    setItems((prev) => {
      const existsIndex = prev.findIndex((item) => item.id === product.id);
      if (existsIndex >= 0) {
        const next = [...prev];
        next[existsIndex].quantity += qty;
        return next;
      }
      return [...prev, { ...product, quantity: qty }];
    });
    setIsOpen(true);
  };

  const removeFromCart = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const applyCoupon = (code: string, percent = 10) => {
    if (!code.trim()) return false;
    setAppliedCoupon(code.trim().toUpperCase());
    setDiscountPercent(percent);
    return true;
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscountPercent(0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        totalItems,
        subtotal,
        discount,
        shipping,
        total,
        currency,
        freeShippingThreshold: 1000,
        openCart,
        closeCart,
        toggleCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe usarse dentro de un CartProvider');
  }
  return context;
}
