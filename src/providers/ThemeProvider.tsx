// src/providers/ThemeProvider.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  resolvedTheme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
});

const STORAGE_KEY = 'sayta_theme';

function applyThemeVars(effectiveTheme: 'light' | 'dark') {
  const root = document.documentElement;
  if (effectiveTheme === 'light') {
    root.style.setProperty('--bg-primary', '#f5f5f7');
    root.style.setProperty('--bg-secondary', '#ffffff');
    root.style.setProperty('--bg-card', '#ffffff');
    root.style.setProperty('--bg-card-hover', '#f0f0f2');
    root.style.setProperty('--bg-section', '#ebebef');
    root.style.setProperty('--hero-from', '#ffffff');
    root.style.setProperty('--hero-via', '#f5f5f7');
    root.style.setProperty('--hero-to', '#ebebef');
    root.style.setProperty('--footer-bg', '#ececee');
    root.style.setProperty('--text-primary', '#1d1d1f');
    root.style.setProperty('--text-secondary', '#515154');
    root.style.setProperty('--text-muted', '#86868b');
    root.style.setProperty('--text-heading', '#1d1d1f');
    root.style.setProperty('--border-subtle', 'rgba(0,0,0,0.08)');
    root.style.setProperty('--border-card', 'rgba(0,0,0,0.08)');
    root.style.setProperty('--chip-bg', 'rgba(0,0,0,0.05)');
    root.style.setProperty('--nav-bg', 'rgba(245,245,247,0.95)');
    root.style.setProperty('--apple-black', '#ffffff');
    root.style.setProperty('--apple-dark-bg', '#f5f5f7');
    root.style.setProperty('--apple-card-bg', '#ffffff');
    root.style.setProperty('--apple-card-border', 'rgba(0,0,0,0.08)');
    root.style.setProperty('--apple-card-hover', 'rgba(0,0,0,0.06)');
    root.style.setProperty('--apple-text-primary', '#1d1d1f');
    root.style.setProperty('--apple-text-secondary', '#4a4a4e');
    root.style.setProperty('--apple-text-tertiary', '#86868b');
  } else {
    root.style.setProperty('--bg-primary', '#000000');
    root.style.setProperty('--bg-secondary', '#0A0B0D');
    root.style.setProperty('--bg-card', '#161617');
    root.style.setProperty('--bg-card-hover', '#1c1c1e');
    root.style.setProperty('--bg-section', 'rgba(12,12,14,0.6)');
    root.style.setProperty('--hero-from', '#0a0a0c');
    root.style.setProperty('--hero-via', '#050507');
    root.style.setProperty('--hero-to', '#000000');
    root.style.setProperty('--footer-bg', '#000000');
    root.style.setProperty('--text-primary', '#f5f5f7');
    root.style.setProperty('--text-secondary', '#86868b');
    root.style.setProperty('--text-muted', '#6e6e73');
    root.style.setProperty('--text-heading', '#ffffff');
    root.style.setProperty('--border-subtle', 'rgba(255,255,255,0.08)');
    root.style.setProperty('--border-card', 'rgba(255,255,255,0.08)');
    root.style.setProperty('--chip-bg', 'rgba(255,255,255,0.05)');
    root.style.setProperty('--nav-bg', 'rgba(10,11,13,0.85)');
    root.style.setProperty('--apple-black', '#000000');
    root.style.setProperty('--apple-dark-bg', '#0A0B0D');
    root.style.setProperty('--apple-card-bg', '#111318');
    root.style.setProperty('--apple-card-border', 'rgba(255,255,255,0.08)');
    root.style.setProperty('--apple-card-hover', 'rgba(255,255,255,0.14)');
    root.style.setProperty('--apple-text-primary', '#F5F7FA');
    root.style.setProperty('--apple-text-secondary', '#9AA3AF');
    root.style.setProperty('--apple-text-tertiary', '#6e6e73');
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('dark');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

  const applyTheme = (targetTheme: ThemeMode) => {
    if (typeof window === 'undefined') return;
    let effectiveTheme: 'light' | 'dark' = 'dark';
    if (targetTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      effectiveTheme = prefersDark ? 'dark' : 'light';
    } else {
      effectiveTheme = targetTheme;
    }
    setResolvedTheme(effectiveTheme);
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(effectiveTheme);
    root.setAttribute('data-theme', effectiveTheme);
    root.style.colorScheme = effectiveTheme;
    applyThemeVars(effectiveTheme);
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      const initial: ThemeMode = stored && ['light', 'dark', 'system'].includes(stored) ? stored : 'dark';
      setThemeState(initial);
      applyTheme(initial);
    } catch {
      applyTheme('dark');
    }
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      try {
        const current = (localStorage.getItem(STORAGE_KEY) as ThemeMode) || 'dark';
        if (current === 'system') applyTheme('system');
      } catch {}
    };
    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, []);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try { localStorage.setItem(STORAGE_KEY, newTheme); } catch {}
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
