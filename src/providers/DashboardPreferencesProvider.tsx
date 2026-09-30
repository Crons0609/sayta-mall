// src/providers/DashboardPreferencesProvider.tsx
// Proveedor de preferencias personales (Tema e Idioma) exclusivo para el dashboard de cada colaborador.
// Los cambios se almacenan localmente asociados al ID/Rol del usuario para no afectar a otros usuarios ni a la tienda.

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthProvider';

export type DashboardTheme = 'obsidian' | 'midnight' | 'emerald' | 'purple' | 'titanium';
export type DashboardLanguage = 'es' | 'en' | 'zh';

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
    settings_lang_zh: '中文简体 (Chino Simplificado)',
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

    // Dock Móvil y Badges
    tab_summary: 'Resumen',
    tab_products: 'Productos',
    tab_chat: 'Chat',
    tab_owners: 'Dueños',
    tab_delivery: 'Delivery',
    tab_menu: 'Menú',
    tab_station: 'Mi Estación',
    tab_store: 'Tienda',
    tab_employees: 'Empleados',
    back_to_store: 'Volver a la Tienda',
    view_public_store: 'Ver Tienda Pública',
    collapse_sidebar: 'Colapsar barra lateral',
    expand_sidebar: 'Expandir barra lateral',
    superadmin: 'Superadmin',
    role_owner: 'Dueño',
    role_employee: 'Empleado',
    badge_live: 'En Vivo',
    badge_inventory: 'Inventario',
    badge_catalog: 'Catálogo',
    badge_management: 'Gestión',
    badge_shipping: 'Envíos',
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
    settings_lang_zh: 'Chinese Simplified (中文简体)',
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

    // Mobile Dock and Badges
    tab_summary: 'Summary',
    tab_products: 'Products',
    tab_chat: 'Chat',
    tab_owners: 'Owners',
    tab_delivery: 'Delivery',
    tab_menu: 'Menu',
    tab_station: 'My Station',
    tab_store: 'Store',
    tab_employees: 'Employees',
    back_to_store: 'Back to Store',
    view_public_store: 'View Public Store',
    collapse_sidebar: 'Collapse sidebar',
    expand_sidebar: 'Expand sidebar',
    superadmin: 'Superadmin',
    role_owner: 'Owner',
    role_employee: 'Employee',
    badge_live: 'Live',
    badge_inventory: 'Inventory',
    badge_catalog: 'Catalog',
    badge_management: 'Management',
    badge_shipping: 'Shipping',
  },
  zh: {
    // Navigation
    nav_dashboard_programmer: '开发控制中心',
    nav_dashboard_owner: '管理执行面板',
    nav_dashboard_employee: '员工工作台',
    nav_chat_team: '团队通讯聊天',
    nav_chat_staff: '员工沟通频道',
    nav_products: '商品与折扣管理',
    nav_categories: '商品分类体系',
    nav_owners: '分店店长管理',
    nav_employees: '员工岗位管理',
    nav_delivery: '配送合作企业',
    nav_catalog: '商城商品目录',
    nav_settings: '工作台个人设置',

    // Settings
    settings_title: '工作台偏好设置',
    settings_subtitle: '专为您当前的账号配置视觉主题与系统显示语言。',
    settings_notice: '此设置完全独立，仅对您个人界面生效，绝不会影响商城公开端或其他同事的工作面板。',
    settings_theme_label: '面板视觉配色主题',
    settings_lang_label: '系统显示语言',
    settings_lang_es: '西班牙语 (Español)',
    settings_lang_en: '英语 (English)',
    settings_lang_zh: '中文简体 (Simplified Chinese)',
    settings_applied: '个人偏好设置已成功保存！',

    // Common actions and status
    btn_save: '保存偏好设置',
    btn_close: '关闭窗口',
    btn_open_chat: '打开即时聊天',
    btn_copy_link: '复制推广链接',
    btn_pause_shift: '暂停当前班次',
    btn_resume_shift: '恢复工作班次',
    status_on_duty: '正在当班',
    status_paused: '暂时离岗',
    status_connected: '在线状态',
    search_placeholder: '搜索商品、人员或记录...',
    logout: '退出账号登录',

    // Mobile Dock and Badges
    tab_summary: '概览',
    tab_products: '商品',
    tab_chat: '聊天',
    tab_owners: '店长',
    tab_delivery: '配送',
    tab_menu: '菜单',
    tab_station: '工作台',
    tab_store: '商城',
    tab_employees: '员工',
    back_to_store: '返回公开商城',
    view_public_store: '浏览商城首页',
    collapse_sidebar: '收起侧边栏',
    expand_sidebar: '展开侧边栏',
    superadmin: '超级管理员',
    role_owner: '分店店长',
    role_employee: '正式员工',
    badge_live: '实时',
    badge_inventory: '库存',
    badge_catalog: '目录',
    badge_management: '管理',
    badge_shipping: '物流',
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
      const savedLang = (localStorage.getItem(storageLangKey) || localStorage.getItem('sayta_global_lang')) as DashboardLanguage;
      if (savedLang && TRANSLATIONS[savedLang]) {
        setLanguageState(savedLang);
        if (typeof document !== 'undefined') {
          document.documentElement.lang = savedLang === 'zh' ? 'zh-CN' : savedLang;
        }
      }
    } catch {}
  }, [storageThemeKey, storageLangKey]);

  // Sincronizar evento de cambio de idioma global
  useEffect(() => {
    const handleGlobalLangChange = (e: any) => {
      const newLang = e?.detail as DashboardLanguage;
      if (newLang && TRANSLATIONS[newLang] && newLang !== language) {
        setLanguageState(newLang);
      }
    };
    window.addEventListener('sayta_lang_change', handleGlobalLangChange);
    return () => window.removeEventListener('sayta_lang_change', handleGlobalLangChange);
  }, [language]);

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
      localStorage.setItem('sayta_global_lang', newLang);
      localStorage.setItem('sayta_dashboard_lang', newLang);
      if (typeof document !== 'undefined') {
        document.documentElement.lang = newLang === 'zh' ? 'zh-CN' : newLang;
        window.dispatchEvent(new CustomEvent('sayta_lang_change', { detail: newLang }));
      }
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
