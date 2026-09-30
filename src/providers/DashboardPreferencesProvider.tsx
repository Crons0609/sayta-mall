// src/providers/DashboardPreferencesProvider.tsx
// Proveedor de preferencias personales (Tema e Idioma) exclusivo para el dashboard de cada colaborador.
// Los cambios se almacenan localmente asociados al ID/Rol del usuario para no afectar a otros usuarios ni a la tienda.

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthProvider';

export type DashboardTheme = 'obsidian' | 'midnight' | 'emerald' | 'purple' | 'titanium';
export type DashboardLanguage = 'es' | 'en';

// Definición de temas
export interface ThemeConfig {
  id: DashboardTheme;
  name: string;
  nameEn: string;
  previewBg: string;
  previewAccent: string;
  cardBg: string;
  borderAccent: string;
  accentColor: string;
  description: string;
  descriptionEn: string;
}

export const DASHBOARD_THEMES: Record<DashboardTheme, ThemeConfig> = {
  obsidian: {
    id: 'obsidian',
    name: 'Obsidian Negro (Apple)',
    nameEn: 'Obsidian Black (Apple)',
    previewBg: '#000000',
    previewAccent: '#2997ff',
    cardBg: '#0d0d10',
    borderAccent: 'rgba(255, 255, 255, 0.08)',
    accentColor: '#2997ff',
    description: 'Negro puro OLED de contraste ultra alto con acentos sutiles.',
    descriptionEn: 'Pure OLED black with high contrast and subtle accents.',
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight Navy (Azul)',
    nameEn: 'Midnight Navy (Blue)',
    previewBg: '#050c18',
    previewAccent: '#38bdf8',
    cardBg: '#081426',
    borderAccent: 'rgba(56, 189, 248, 0.18)',
    accentColor: '#38bdf8',
    description: 'Azul noche espacial con acentos zafiro y tonos neón.',
    descriptionEn: 'Deep cosmic navy with sapphire accents and neon hints.',
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Forest (Verde)',
    nameEn: 'Emerald Forest (Green)',
    previewBg: '#041108',
    previewAccent: '#30d158',
    cardBg: '#081c10',
    borderAccent: 'rgba(48, 209, 88, 0.2)',
    accentColor: '#30d158',
    description: 'Verde esmeralda refinado para máxima claridad y confort visual.',
    descriptionEn: 'Refined emerald green for maximum visual clarity and comfort.',
  },
  purple: {
    id: 'purple',
    name: 'Purple Royal (Púrpura)',
    nameEn: 'Purple Royal (Purple)',
    previewBg: '#0f051a',
    previewAccent: '#bf5af2',
    cardBg: '#180a29',
    borderAccent: 'rgba(191, 90, 242, 0.22)',
    accentColor: '#bf5af2',
    description: 'Púrpura amatista lujoso con reflejos violeta de noche.',
    descriptionEn: 'Luxurious amethyst purple with midnight violet highlights.',
  },
  titanium: {
    id: 'titanium',
    name: 'Titanium Graphite (Gris)',
    nameEn: 'Titanium Graphite (Gray)',
    previewBg: '#121216',
    previewAccent: '#ffd60a',
    cardBg: '#1c1c22',
    borderAccent: 'rgba(255, 255, 255, 0.14)',
    accentColor: '#ffd60a',
    description: 'Gris titanio pulido estilo MacBook Pro con acento ámbar.',
    descriptionEn: 'Polished titanium gray MacBook Pro style with amber touch.',
  },
};

// Diccionario de traducciones
const TRANSLATIONS: Record<DashboardLanguage, Record<string, string>> = {
  es: {
    // Navegación
    nav_dashboard_programmer: 'Centro de Comando',
    nav_dashboard_owner: 'Panel Ejecutivo',
    nav_dashboard_employee: 'Mi Estación',
    nav_chat_team: 'Chat del Equipo',
    nav_chat_staff: 'Chat del Personal',
    nav_products: 'Gestión de Productos',
    nav_categories: 'Categorías',
    nav_owners: 'Dueños de Tienda',
    nav_employees: 'Gestión de Empleados',
    nav_delivery: 'Empresas de Delivery',
    nav_catalog: 'Catálogo de Tienda',
    nav_settings: 'Ajustes de mi Panel',

    // Ajustes
    settings_title: 'Ajustes del Dashboard',
    settings_subtitle: 'Personaliza el tema visual y el idioma exclusivamente para tu sesión.',
    settings_notice: 'Estas configuraciones se aplican solo a tu cuenta y no modifican el diseño de la tienda pública ni el panel de tus compañeros.',
    settings_theme_label: 'Tema Visual del Panel',
    settings_lang_label: 'Idioma de tu Dashboard',
    settings_lang_es: 'Español (Latinoamérica)',
    settings_lang_en: 'English (United States)',
    settings_applied: '¡Preferencias actualizadas con éxito!',

    // Acciones y estados comunes
    btn_save: 'Guardar Ajustes',
    btn_close: 'Cerrar',
    btn_open_chat: 'Abrir Mensajería',
    btn_copy_link: 'Copiar Enlace',
    btn_pause_shift: 'Pausar Turno',
    btn_resume_shift: 'Reanudar Turno',
    status_on_duty: 'En Servicio',
    status_paused: 'En Pausa',
    status_connected: 'En Línea',
    search_placeholder: 'Buscar...',
    logout: 'Cerrar Sesión',
  },
  en: {
    // Navigation
    nav_dashboard_programmer: 'Command Center',
    nav_dashboard_owner: 'Executive Dashboard',
    nav_dashboard_employee: 'My Station',
    nav_chat_team: 'Team Chat',
    nav_chat_staff: 'Staff Chat',
    nav_products: 'Product Management',
    nav_categories: 'Categories',
    nav_owners: 'Store Owners',
    nav_employees: 'Employee Management',
    nav_delivery: 'Delivery Companies',
    nav_catalog: 'Store Catalog',
    nav_settings: 'Dashboard Settings',

    // Settings
    settings_title: 'Dashboard Settings',
    settings_subtitle: 'Customize the visual theme and language exclusively for your session.',
    settings_notice: 'These settings apply only to your account and do not affect the public storefront or other staff members.',
    settings_theme_label: 'Dashboard Visual Theme',
    settings_lang_label: 'Dashboard Language',
    settings_lang_es: 'Spanish (Latin America)',
    settings_lang_en: 'English (United States)',
    settings_applied: 'Preferences saved successfully!',

    // Common actions and status
    btn_save: 'Save Settings',
    btn_close: 'Close',
    btn_open_chat: 'Open Messenger',
    btn_copy_link: 'Copy Link',
    btn_pause_shift: 'Pause Shift',
    btn_resume_shift: 'Resume Shift',
    status_on_duty: 'On Duty',
    status_paused: 'On Pause',
    status_connected: 'Online',
    search_placeholder: 'Search...',
    logout: 'Sign Out',
  },
};

interface DashboardPreferencesContextValue {
  theme: DashboardTheme;
  language: DashboardLanguage;
  setTheme: (theme: DashboardTheme) => void;
  setLanguage: (lang: DashboardLanguage) => void;
  t: (key: string, fallback?: string) => string;
  themeConfig: ThemeConfig;
  settingsModalOpen: boolean;
  setSettingsModalOpen: (open: boolean) => void;
}

const DashboardPreferencesContext = createContext<DashboardPreferencesContextValue | null>(null);

export function DashboardPreferencesProvider({ children }: { children: ReactNode }) {
  const { user, claims } = useAuth();

  const userKey = user?.uid || (claims as any)?.area || 'default_user';
  const storageThemeKey = `sayta_dash_theme_${userKey}`;
  const storageLangKey = `sayta_dash_lang_${userKey}`;

  const [theme, setThemeState] = useState<DashboardTheme>('obsidian');
  const [language, setLanguageState] = useState<DashboardLanguage>('es');
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // Cargar preferencias guardadas del usuario
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(storageThemeKey) as DashboardTheme;
      if (savedTheme && DASHBOARD_THEMES[savedTheme]) {
        setThemeState(savedTheme);
      }
      const savedLang = localStorage.getItem(storageLangKey) as DashboardLanguage;
      if (savedLang && TRANSLATIONS[savedLang]) {
        setLanguageState(savedLang);
      }
    } catch {}
  }, [storageThemeKey, storageLangKey]);

  // Cambiar tema
  const setTheme = useCallback((newTheme: DashboardTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(storageThemeKey, newTheme);
    } catch {}
  }, [storageThemeKey]);

  // Cambiar idioma
  const setLanguage = useCallback((newLang: DashboardLanguage) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(storageLangKey, newLang);
    } catch {}
  }, [storageLangKey]);

  // Función de traducción
  const t = useCallback((key: string, fallback?: string): string => {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS.es;
    return langDict[key] || fallback || key;
  }, [language]);

  const themeConfig = DASHBOARD_THEMES[theme] || DASHBOARD_THEMES.obsidian;

  return (
    <DashboardPreferencesContext.Provider
      value={{
        theme,
        language,
        setTheme,
        setLanguage,
        t,
        themeConfig,
        settingsModalOpen,
        setSettingsModalOpen,
      }}
    >
      {children}
    </DashboardPreferencesContext.Provider>
  );
}

export function useDashboardPreferences() {
  const context = useContext(DashboardPreferencesContext);
  if (!context) {
    return {
      theme: 'obsidian' as DashboardTheme,
      language: 'es' as DashboardLanguage,
      setTheme: () => {},
      setLanguage: () => {},
      t: (key: string, fallback?: string) => fallback || key,
      themeConfig: DASHBOARD_THEMES.obsidian,
      settingsModalOpen: false,
      setSettingsModalOpen: () => {},
    };
  }
  return context;
}
