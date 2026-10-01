// src/providers/LanguageProvider.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export type Language = 'es' | 'en' | 'zh';

export interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
  isZh: boolean;
  isEn: boolean;
  isEs: boolean;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export const DICTIONARY: Record<Language, Record<string, string>> = {
  es: {
    // Top Ticker
    ticker_announcement: 'Sayta Mall: Herramientas, calzado, moda, fajas, cosméticos, electrónica, bocadillos chinos y hogar en Córdobas (C$ NIO).',
    
    // Navbar
    nav_home: 'Inicio',
    nav_catalog: 'Catálogo',
    nav_search: 'Buscar',
    nav_cart: 'Cesta',
    nav_account: 'Mi Cuenta',
    nav_login: 'Entrar',
    nav_logout: 'Cerrar Sesión',
    nav_branch: 'Sucursal',
    nav_change_branch: 'Cambiar',
    nav_theme: 'Tema Visual',
    nav_language: 'Idioma',

    // Hero
    hero_branch_prefix: 'Sucursal activa',
    hero_change_branch: '(Cambiar sucursal)',
    hero_title_1: 'Super Ahorro.',
    hero_title_2: 'Todo en un solo lugar.',
    hero_subtitle: 'Tu gran tienda por departamentos digital. Descubre lo mejor en herramientas, calzado, moda, fajas, cosméticos, electrónica, bocadillos chinos importados y hogar a precios de super ahorro en Córdobas (C$).',
    hero_search_placeholder: 'Buscar taladro, tenis, faja, cosméticos, bocadillos chinos...',
    hero_popular_label: 'Populares:',
    hero_btn_catalog: 'Ver Catálogo Completo',
    hero_btn_login_prices: 'Iniciar Sesión para Ver Precios',
    hero_badge_departments: '10 Departamentos Activos',
    hero_badge_currency_title: 'Moneda Oficial',
    hero_badge_currency_sub: 'Super Ahorro Garantizado',

    // Departments
    dept_header_tag: 'Departamentos Sayta',
    dept_header_title: 'Explora por Categoría',
    dept_view_all: 'Ver todos los artículos',
    dept_all: 'Todos',

    // Departments names
    dept_herramientas: 'Herramientas & Ferretería',
    dept_herramientas_desc: 'Taladros, destornilladores, martillos, llaves y candados',
    dept_calzado: 'Calzado & Zapatos',
    dept_calzado_desc: 'Tenis deportivos, sandalias, botas y calzado casual',
    dept_ropa: 'Ropa & Moda',
    dept_ropa_desc: 'Camisas, camisetas, pantalones, conjuntos y vestidos',
    dept_fajas: 'Ropa Íntima & Fajas',
    dept_fajas_desc: 'Fajas moldeadoras, lencería, bóxers y ropa térmica',
    dept_cosmeticos: 'Cosméticos & Belleza',
    dept_cosmeticos_desc: 'Maquillaje, paletas de sombras, labiales y cuidado facial',
    dept_electronica: 'Electrónica & Gadgets',
    dept_electronica_desc: 'Audífonos bluetooth, cargadores rápidos, cables y smartwatches',
    dept_bocadillos: 'Bocadillos Chinos & Snacks',
    dept_bocadillos_desc: 'Snacks picantes latiao, ramen asiático, botanas y dulces',
    dept_gorras: 'Gorras & Accesorios',
    dept_gorras_desc: 'Gorras snapback, sombreros, cinturones y gafas de sol',
    dept_hogar: 'Hogar & Cocina',
    dept_hogar_desc: 'Picadores, sartenes, recipientes, organizadores y menaje',
    dept_temporada: 'Productos de Temporada',
    dept_temporada_desc: 'Luces decorativas, regalos, artículos para festividades',
    dept_adultos: 'Juguetes Sexuales',
    dept_adultos_desc: 'Artículos íntimos para adultos — Solo mayores de 18 años',

    // Badges
    badge_popular: 'Popular',
    badge_bestseller: 'Más Vendido',
    badge_trending: 'Tendencia',
    badge_exclusive: 'Exclusivo',
    badge_adult: '+18',

    // Catalog Section
    cat_tag: 'Inventario Disponible',
    cat_title: 'Catálogo de Productos',
    cat_stock_for: 'Mostrando existencias para',
    cat_offers_title: 'Catálogo de novedades y ofertas Sayta Mall',
    cat_protected_prices: 'Precios protegidos: Inicia sesión con cualquier correo o con Google para ver precios exactos en Córdobas (C$) y comprar.',
    cat_login_btn: 'Iniciar Sesión / Registrarse',
    cat_empty_title: 'No hay productos disponibles por el momento',
    cat_empty_cat_title: 'No hay productos en esta categoría',
    cat_empty_desc: 'Los productos añadidos a la tienda aparecerán aquí automáticamente.',
    cat_empty_cat_desc: 'Selecciona otra categoría o restablece el filtro para ver todo.',
    cat_btn_see_all: 'Ver todos los productos',

    // Trust Pillars
    trust_tag: 'Super Ahorro Garantizado',
    trust_title: '¿Por qué comprar en Sayta Mall?',
    trust_subtitle: 'Tu tienda de confianza con la mayor variedad de productos y el mejor trato al cliente.',
    trust_p1_title: 'Precios en Córdobas (C$)',
    trust_p1_desc: 'Precios directos de fábrica e importación sin conversiones sorpresas ni comisiones ocultas.',
    trust_p2_title: 'Entregas Rápidas en tu Ciudad',
    trust_p2_desc: 'Despachos inmediatos a domicilio en moto o retiro rápido en sucursal.',
    trust_p3_title: 'Variedad Multisucursal',
    trust_p3_desc: 'Herramientas, moda, fajas, cosméticos, snacks y tecnología en un solo lugar.',
    trust_p4_title: 'Garantía de Satisfacción',
    trust_p4_desc: 'Revisamos cada artículo antes de su entrega para asegurar que recibas calidad al 100%.',

    // CTA
    cta_tag: 'Desbloquea Precios Exclusivos',
    cta_title: 'Crea tu cuenta gratis en Sayta Mall',
    cta_desc: 'Regístrate con tu correo o cuenta de Google en menos de 1 minuto y empieza a comprar con precios de super ahorro.',
    cta_btn: 'Crear Cuenta Gratis',

    // Adults Section
    adult_badge: '🔞 Solo +18 · Contenido para Adultos',
    adult_title: 'Juguetes Sexuales',
    adult_desc: 'Artículos íntimos exclusivos para adultos verificados. Registro y confirmación de edad requeridos.',
    adult_restricted_title: 'Acceso Restringido',
    adult_restricted_desc: 'Debes crear una cuenta o iniciar sesión y confirmar tu mayoría de edad para ver esta sección.',

    // Product Card
    prod_add: 'Agregar',
    prod_added: 'Agregado',
    prod_out_of_stock: 'Agotado',
    prod_login_to_see_price: 'Inicia sesión para ver precio',
    prod_unit: 'C$',

    // Cart Drawer
    cart_title: 'Bolsa de Compras',
    cart_items_selected: 'artículos seleccionados',
    cart_empty: 'Tu bolsa está vacía',
    cart_empty_desc: 'Explora nuestro catálogo y agrega los mejores productos a precios de super ahorro.',
    cart_btn_explore: 'Explorar Tienda',
    cart_subtotal: 'Subtotal de artículos',
    cart_discount: 'Descuento',
    cart_delivery: 'Delivery',
    cart_total: 'Total',
    cart_btn_checkout: 'Comprar',
    cart_order_summary: 'Tu pedido',
    cart_delivery_info: 'Tus datos de entrega',
    cart_name_label: 'Tu Nombre Completo *',
    cart_name_placeholder: 'Ej. María González',
    cart_phone_label: 'Tu Teléfono (WhatsApp) *',
    cart_phone_placeholder: '+505 8888 1234',
    cart_address_label: 'Dirección de Entrega *',
    cart_address_placeholder: 'Calle principal, casa esquinera...',
    cart_reference_label: 'Referencias del domicilio (opcional)',
    cart_reference_placeholder: 'Portón negro, muro verde...',
    cart_confirm_btn: 'Confirmar y Enviar Pedido',
    cart_success_title: '¡Pedido Creado!',
    cart_success_desc: 'Tu pedido quedó registrado en estado pendiente y el stock ha sido reservado. El personal prepara tus artículos y el repartidor se presentará en la sucursal.',
    cart_open_whatsapp: 'Abrir WhatsApp y Enviar Pedido',
    cart_back_to_shop: 'Volver a la Tienda',

    // Catalog Page
    catalog_title: 'Catálogo de Productos',
    catalog_showing_from: 'Mostrando productos de',
    catalog_change: '(Cambiar)',
    catalog_only_stock: 'Solo en stock',
    catalog_sort_featured: 'Destacados',
    catalog_sort_price_asc: 'Menor precio',
    catalog_sort_price_desc: 'Mayor precio',
    catalog_adult_banner: 'Acceso verificado a Juguetes Sexuales (+18). Navega con total privacidad.',
    catalog_adult_lock: 'Bloquear sección',
    catalog_adult_registered_desc: 'La categoría Juguetes Sexuales está estrictamente restringida a personas mayores de 18 años. Debes registrarte o iniciar sesión para acceder.',
    catalog_adult_confirm_notice: 'Para ver el catálogo de productos íntimos debes confirmar bajo tu responsabilidad legal que tienes 18 años o más.',
    catalog_adult_confirm_btn: 'Confirmar que tengo 18 años o más',

    // Age Verification Modal
    age_modal_title: 'Verificación de Edad',
    age_modal_badge: 'Contenido para Adultos — Solo +18',
    age_modal_desc: 'Esta sección contiene productos íntimos exclusivamente para adultos. Para acceder debes confirmar que tienes 18 años o más.',
    age_modal_warning: 'El acceso por menores de 18 años está estrictamente prohibido. Al continuar, confirmas bajo tu responsabilidad que eres mayor de edad.',
    age_modal_checkbox: 'Confirmo que tengo 18 años o más y acepto ver contenido para adultos de carácter íntimo y personal.',
    age_modal_btn_confirm: 'Soy mayor de 18 años — Ingresar',
    age_modal_btn_cancel: 'Cancelar',
    age_modal_disclaimer: 'Sayta Mall promueve el uso responsable y legal de productos para adultos. Esta verificación es de buena fe.',

    // Login Page
    login_back_to_store: 'Volver a la tienda',
    login_tab_signin: 'Ingresar',
    login_tab_signup: 'Registrarse',
    login_tab_phone: 'Teléfono',
    login_welcome_title: 'Te damos la bienvenida',
    login_signup_title: 'Crea tu cuenta de cliente',
    login_phone_title: 'Verificación Móvil',
    login_welcome_sub: 'Ingresa con cualquier correo y contraseña o con Google.',
    login_signup_sub: 'Regístrate con tu correo para ver precios y comprar en Sayta Mall.',
    login_phone_sub: 'Verifica tu número telefónico mediante SMS para validar tu cuenta.',
    login_label_name: 'Nombre Completo',
    login_placeholder_name: 'Ej. Juan Pérez',
    login_label_age: 'Edad del Cliente',
    login_label_required: 'Obligatorio',
    login_placeholder_age: 'Ej. 25 años',
    login_label_address: 'Dirección de Entrega',
    login_placeholder_address: 'Ej. Barrio El Carmen, de la farmacia 2c al norte...',
    login_address_note: 'Esta dirección se usará para enviarte tus pedidos.',
    login_label_reference: 'Referencias del domicilio (opcional)',
    login_placeholder_reference: 'Portón negro, muro verde, casa esquinera...',
    login_label_email: 'Correo Electrónico (Gmail, Outlook o cualquiera)',
    login_label_password: 'Contraseña',
    login_label_confirm_password: 'Confirmar Contraseña',
    login_placeholder_password: 'Mínimo 6 caracteres',
    login_btn_signin: 'Iniciar Sesión',
    login_btn_signup: 'Crear Mi Cuenta',
    login_btn_processing: 'Procesando...',
    login_or_continue_with: 'O también accede con',
    login_btn_google: 'Continuar con Google',
    login_terms_privacy: 'Al continuar aceptas nuestros Términos y Privacidad. Precios en Córdobas (C$ NIO).',
    login_feature_verified: 'Identidad Verificada · Personas Naturales',
    login_feature_phone: 'Verificación por Celular',
    login_feature_phone_desc: 'Validación por SMS que previene cuentas falsas y garantiza usuarios legítimos.',
    login_feature_admin: 'Acceso a Paneles de Gestión',
    login_feature_admin_desc: 'Dueños y empleados pueden gestionar productos, precios y categorías colaborativamente.',
    login_feature_discount: 'Descuentos con Autorización',
    login_feature_discount_desc: 'Rebajas de precio aprobadas directamente por el Dueño o Programador del local.',

    // Footer
    footer_rights: 'Sayta Mall. Super Ahorro Y Todo Aquí. Todos los derechos reservados.',
    footer_dev: 'Desarrollado por',
    footer_official_currency: 'Moneda Oficial: NIO (C$)',
    footer_terms: 'Términos',
    footer_privacy: 'Privacidad',

    // Navbar extra
    nav_subtitle: 'Super Ahorro Y Todo Aquí',
    nav_verified: 'Verificada',
    nav_verify_phone: 'Verificar Celular',
    nav_manage_products: 'Gestión de Productos',
    nav_console_dev: 'Consola Programador',
    nav_portal_owner: 'Portal Dueño',
    nav_my_station: 'Mi Estación',
    nav_theme_light: 'Claro',
    nav_theme_dark: 'Oscuro',
    nav_theme_system: 'Sistema',

    // Branch Modal extra
    branch_currency_label: 'Moneda:',
    branch_footer_note: '📍 El catálogo se adapta automáticamente al stock disponible en tu sucursal.',
    branch_select_title: 'Selecciona tu Sucursal',
    branch_select_sub: 'Elige la tienda más cercana para ver inventario y entregas locales',
    branch_active: 'Activa',
  },

  en: {
    // Top Ticker
    ticker_announcement: 'Sayta Mall: Hardware tools, footwear, fashion, shapewear, cosmetics, electronics, Chinese snacks, and home essentials in Cordobas (C$ NIO).',

    // Navbar
    nav_home: 'Home',
    nav_catalog: 'Catalog',
    nav_search: 'Search',
    nav_cart: 'Cart',
    nav_account: 'My Account',
    nav_login: 'Sign In',
    nav_logout: 'Log Out',
    nav_branch: 'Branch',
    nav_change_branch: 'Change',
    nav_theme: 'Visual Theme',
    nav_language: 'Language',

    // Hero
    hero_branch_prefix: 'Active branch',
    hero_change_branch: '(Change branch)',
    hero_title_1: 'Super Savings.',
    hero_title_2: 'All in one single place.',
    hero_subtitle: 'Your premier digital department store. Discover the finest in hardware tools, footwear, fashion, shapewear, cosmetics, electronics, imported Chinese snacks, and home goods at unbeatable prices in Cordobas (C$).',
    hero_search_placeholder: 'Search drill, sneakers, shapewear, cosmetics, Chinese snacks...',
    hero_popular_label: 'Popular:',
    hero_btn_catalog: 'Explore Full Catalog',
    hero_btn_login_prices: 'Sign In to View Prices',
    hero_badge_departments: '10 Active Departments',
    hero_badge_currency_title: 'Official Currency',
    hero_badge_currency_sub: 'Guaranteed Super Savings',

    // Departments
    dept_header_tag: 'Sayta Departments',
    dept_header_title: 'Browse by Category',
    dept_view_all: 'View all products',
    dept_all: 'All',

    // Departments names
    dept_herramientas: 'Hardware & Tools',
    dept_herramientas_desc: 'Drills, screwdrivers, hammers, wrenches, and locks',
    dept_calzado: 'Footwear & Shoes',
    dept_calzado_desc: 'Athletic sneakers, sandals, boots, and casual shoes',
    dept_ropa: 'Clothing & Fashion',
    dept_ropa_desc: 'Shirts, t-shirts, trousers, sets, and dresses',
    dept_fajas: 'Underwear & Shapewear',
    dept_fajas_desc: 'Body shapers, lingerie, boxers, and thermal wear',
    dept_cosmeticos: 'Cosmetics & Beauty',
    dept_cosmeticos_desc: 'Makeup, eyeshadow palettes, lipsticks, and skincare',
    dept_electronica: 'Electronics & Gadgets',
    dept_electronica_desc: 'Bluetooth earbuds, fast chargers, cables, and smartwatches',
    dept_bocadillos: 'Chinese Snacks & Treats',
    dept_bocadillos_desc: 'Spicy latiao snacks, Asian ramen, munchies, and sweets',
    dept_gorras: 'Caps & Accessories',
    dept_gorras_desc: 'Snapback caps, hats, belts, and sunglasses',
    dept_hogar: 'Home & Kitchen',
    dept_hogar_desc: 'Choppers, frying pans, food containers, and kitchenware',
    dept_temporada: 'Seasonal Goods',
    dept_temporada_desc: 'Decorative lights, gifts, holiday items',
    dept_adultos: 'Adult Novelties',
    dept_adultos_desc: 'Intimate products for adults — 18+ only',

    // Badges
    badge_popular: 'Popular',
    badge_bestseller: 'Bestseller',
    badge_trending: 'Trending',
    badge_exclusive: 'Exclusive',
    badge_adult: '+18',

    // Catalog Section
    cat_tag: 'Available Stock',
    cat_title: 'Product Catalog',
    cat_stock_for: 'Showing inventory for',
    cat_offers_title: 'Sayta Mall new arrivals and deals',
    cat_protected_prices: 'Protected wholesale prices: Sign in with email or Google to unlock exact prices in Cordobas (C$) and shop.',
    cat_login_btn: 'Sign In / Register',
    cat_empty_title: 'No products available right now',
    cat_empty_cat_title: 'No products in this category',
    cat_empty_desc: 'New items added to the catalog will automatically appear here.',
    cat_empty_cat_desc: 'Select another department or reset filter to see all.',
    cat_btn_see_all: 'View all products',

    // Trust Pillars
    trust_tag: 'Super Savings Guaranteed',
    trust_title: 'Why shop at Sayta Mall?',
    trust_subtitle: 'Your trusted department store with the widest variety and customer care.',
    trust_p1_title: 'Transparent Pricing in C$',
    trust_p1_desc: 'Direct import prices with no hidden exchange rate surprises.',
    trust_p2_title: 'Fast Local Delivery',
    trust_p2_desc: 'Instant delivery via motorcycle courier or quick in-store pickup.',
    trust_p3_title: 'Multi-Branch Variety',
    trust_p3_desc: 'Tools, fashion, shapewear, cosmetics, snacks, and tech in one app.',
    trust_p4_title: 'Satisfaction Guaranteed',
    trust_p4_desc: 'Every item is inspected prior to delivery to ensure 100% quality.',

    // CTA
    cta_tag: 'Unlock Member Prices',
    cta_title: 'Create your free account at Sayta Mall',
    cta_desc: 'Sign up with your email or Google account in under 1 minute and start enjoying super savings.',
    cta_btn: 'Create Free Account',

    // Adults Section
    adult_badge: '🔞 18+ Only · Adult Content',
    adult_title: 'Adult Novelties',
    adult_desc: 'Intimate adult items for verified members only. Registration and age verification required.',
    adult_restricted_title: 'Restricted Access',
    adult_restricted_desc: 'You must create an account or sign in and verify your age to enter this section.',

    // Product Card
    prod_add: 'Add to Cart',
    prod_added: 'Added',
    prod_out_of_stock: 'Sold Out',
    prod_login_to_see_price: 'Sign in to see price',
    prod_unit: 'C$',

    // Cart Drawer
    cart_title: 'Shopping Bag',
    cart_items_selected: 'items selected',
    cart_empty: 'Your shopping bag is empty',
    cart_empty_desc: 'Explore our catalog and add top-rated products at super savings prices.',
    cart_btn_explore: 'Explore Store',
    cart_subtotal: 'Items Subtotal',
    cart_discount: 'Discount',
    cart_delivery: 'Delivery',
    cart_total: 'Total',
    cart_btn_checkout: 'Checkout Order',
    cart_order_summary: 'Your Order',
    cart_delivery_info: 'Delivery Details',
    cart_name_label: 'Your Full Name *',
    cart_name_placeholder: 'e.g. John Doe',
    cart_phone_label: 'Your Phone (WhatsApp) *',
    cart_phone_placeholder: '+505 8888 1234',
    cart_address_label: 'Delivery Address *',
    cart_address_placeholder: 'Main street, blue gate...',
    cart_reference_label: 'Address Landmarks (optional)',
    cart_reference_placeholder: 'Near the church, white fence...',
    cart_confirm_btn: 'Confirm and Send Order',
    cart_success_title: 'Order Placed!',
    cart_success_desc: 'Your order has been registered in pending state and stock is reserved. Staff will prepare your items.',
    cart_open_whatsapp: 'Open WhatsApp and Send Order',
    cart_back_to_shop: 'Back to Store',

    // Catalog Page
    catalog_title: 'Product Catalog',
    catalog_showing_from: 'Showing products from',
    catalog_change: '(Change)',
    catalog_only_stock: 'In stock only',
    catalog_sort_featured: 'Featured',
    catalog_sort_price_asc: 'Price: Low to High',
    catalog_sort_price_desc: 'Price: High to Low',
    catalog_adult_banner: 'Verified access to Adult section (+18). Browse with privacy.',
    catalog_adult_lock: 'Lock section',
    catalog_adult_registered_desc: 'The Adult category is strictly restricted to people over 18 years old. You must register or log in to access.',
    catalog_adult_confirm_notice: 'To view intimate adult items you must legally confirm you are 18 years of age or older.',
    catalog_adult_confirm_btn: 'Confirm I am 18 or older',

    // Age Verification Modal
    age_modal_title: 'Age Verification',
    age_modal_badge: 'Adult Content — 18+ Only',
    age_modal_desc: 'This section contains intimate products exclusively for adults. You must confirm you are 18 years of age or older to enter.',
    age_modal_warning: 'Access by minors under 18 is strictly prohibited. By proceeding, you legally confirm you are of legal age.',
    age_modal_checkbox: 'I confirm that I am 18 years of age or older and agree to view adult intimate personal items.',
    age_modal_btn_confirm: 'I am 18+ — Enter',
    age_modal_btn_cancel: 'Cancel',
    age_modal_disclaimer: 'Sayta Mall promotes legal and responsible adult product browsing. This confirmation is made in good faith.',

    // Login Page
    login_back_to_store: 'Back to store',
    login_tab_signin: 'Sign In',
    login_tab_signup: 'Sign Up',
    login_tab_phone: 'Phone',
    login_welcome_title: 'Welcome back',
    login_signup_title: 'Create customer account',
    login_phone_title: 'Phone Verification',
    login_welcome_sub: 'Sign in with any email and password or Google.',
    login_signup_sub: 'Sign up with your email to see wholesale prices and shop at Sayta Mall.',
    login_phone_sub: 'Verify your phone number via SMS to validate your account.',
    login_label_name: 'Full Name',
    login_placeholder_name: 'e.g. John Doe',
    login_label_age: 'Customer Age',
    login_label_required: 'Required',
    login_placeholder_age: 'e.g. 25 years',
    login_label_address: 'Delivery Address',
    login_placeholder_address: 'e.g. Main street, north from pharmacy...',
    login_address_note: 'This address will be used to deliver your orders.',
    login_label_reference: 'Landmarks / References (optional)',
    login_placeholder_reference: 'Black gate, green wall, corner house...',
    login_label_email: 'Email (Gmail, Outlook or any)',
    login_label_password: 'Password',
    login_label_confirm_password: 'Confirm Password',
    login_placeholder_password: 'Minimum 6 characters',
    login_btn_signin: 'Sign In',
    login_btn_signup: 'Create My Account',
    login_btn_processing: 'Processing...',
    login_or_continue_with: 'Or continue with',
    login_btn_google: 'Continue with Google',
    login_terms_privacy: 'By continuing you accept our Terms and Privacy. Prices in Cordobas (C$ NIO).',
    login_feature_verified: 'Verified Identity · Natural Persons',
    login_feature_phone: 'Mobile Verification',
    login_feature_phone_desc: 'SMS verification prevents fake accounts and guarantees legitimate users.',
    login_feature_admin: 'Access Management Panels',
    login_feature_admin_desc: 'Owners and employees can collaboratively manage products, prices, and categories.',
    login_feature_discount: 'Authorized Discounts',
    login_feature_discount_desc: 'Price reductions approved directly by the store owner or developer.',

    // Footer
    footer_rights: 'Sayta Mall. Super Savings & Everything Here. All rights reserved.',
    footer_dev: 'Developed by',
    footer_official_currency: 'Official Currency: NIO (C$)',
    footer_terms: 'Terms',
    footer_privacy: 'Privacy',

    // Navbar extra
    nav_subtitle: 'Super Savings & Everything Here',
    nav_verified: 'Verified',
    nav_verify_phone: 'Verify Phone',
    nav_manage_products: 'Manage Products',
    nav_console_dev: 'Developer Console',
    nav_portal_owner: 'Owner Portal',
    nav_my_station: 'My Station',
    nav_theme_light: 'Light',
    nav_theme_dark: 'Dark',
    nav_theme_system: 'System',

    // Branch Modal extra
    branch_currency_label: 'Currency:',
    branch_footer_note: '📍 The catalog automatically adapts to the available stock at your branch.',
    branch_select_title: 'Select your branch',
    branch_select_sub: 'Choose the nearest branch for real-time inventory and local delivery',
    branch_active: 'Active',
  },

  zh: {
    // Top Ticker
    ticker_announcement: 'Sayta Mall 三泰百货：五金工具、品牌鞋履、时尚服饰、塑身美体、美妆个护、数码家电、精选中国零食及居家百货，官方科多巴 (C$ NIO) 结算。',

    // Navbar
    nav_home: '商城首页',
    nav_catalog: '商品目录',
    nav_search: '搜索商品',
    nav_cart: '购物车',
    nav_account: '我的账户',
    nav_login: '立即登录',
    nav_logout: '退出登录',
    nav_branch: '当前分店',
    nav_change_branch: '切换分店',
    nav_theme: '视觉配色主题',
    nav_language: '显示语言',

    // Hero
    hero_branch_prefix: '当前服务分店',
    hero_change_branch: '(切换分店)',
    hero_title_1: '超级省钱。',
    hero_title_2: '一站式全能购物百货。',
    hero_subtitle: '您的数字化大型连锁百货商城。发现最优质的五金工具、鞋类鞋包、潮流服饰、塑身美体、美妆个护、电子科技、中国特色进口零食和居家生活用品，以超值批发价格为您直供（C$ 科多巴结算）。',
    hero_search_placeholder: '搜索电钻工具、运动鞋、塑身衣、美妆护肤、中国特色零食...',
    hero_popular_label: '热门搜索：',
    hero_btn_catalog: '浏览完整商品目录',
    hero_btn_login_prices: '登录查看专属批发底价',
    hero_badge_departments: '10 大热门品类现货',
    hero_badge_currency_title: '官方结算货币',
    hero_badge_currency_sub: '超级省钱 · 品质保障',

    // Departments
    dept_header_tag: 'Sayta 商城核心品类',
    dept_header_title: '按部门分类选购',
    dept_view_all: '查看全部商品',
    dept_all: '全部商品',

    // Departments names
    dept_herramientas: '五金工具 & 电动器材',
    dept_herramientas_desc: '手电钻、螺丝批套组、五金扳手、重型工具箱',
    dept_calzado: '精选鞋履 & 运动鞋',
    dept_calzado_desc: '潮流运动鞋、慢跑鞋、休闲凉鞋、耐磨工作靴',
    dept_ropa: '时尚服装 & 男装女装',
    dept_ropa_desc: '男女衬衫、休闲T恤、长裤短裤、流行洋装套组',
    dept_fajas: '美体塑身 & 贴身内衣',
    dept_fajas_desc: '强效收腹塑身衣、无痕内衣、透气内裤、保暖内衣',
    dept_cosmeticos: '美妆护肤 & 个人护理',
    dept_cosmeticos_desc: '彩妆粉底、多色眼影盘、持久口红、补水护肤套组',
    dept_electronica: '数码科技 & 潮流配件',
    dept_electronica_desc: '蓝牙耳机、智能手表、快充充电器、多功能数据线',
    dept_bocadillos: '中华精选零食 & 美食',
    dept_bocadillos_desc: '麻辣辣条、正宗即食拉面、中国风味坚果与果脯蜜饯',
    dept_gorras: '潮流帽子 & 时尚配饰',
    dept_gorras_desc: '平沿棒球帽、太阳遮阳帽、真皮腰带、防紫外线太阳镜',
    dept_hogar: '居家生活 & 厨房小家电',
    dept_hogar_desc: '多功能料理器、不粘煎锅、保鲜收纳盒、厨房餐具',
    dept_temporada: '节日精选 & 季节特惠',
    dept_temporada_desc: '节日彩灯、精美礼品、季节限定热卖商品',
    dept_adultos: '成人私密生活用品',
    dept_adultos_desc: '仅限18岁以上成年人验证选购的私密用品',

    // Badges
    badge_popular: '热销爆款',
    badge_bestseller: '全店销量第一',
    badge_trending: '流行趋势',
    badge_exclusive: '独家专供',
    badge_adult: '18禁',

    // Catalog Section
    cat_tag: '现货仓储库存',
    cat_title: '商品目录一览',
    cat_stock_for: '正在显示分店实时库存：',
    cat_offers_title: 'Sayta Mall 新品首发与超级特惠活动',
    cat_protected_prices: '底价保护：请使用任意邮箱或 Google 快速登录，即可解锁精准科多巴 (C$) 批发底价并直接下单。',
    cat_login_btn: '立即登录 / 注册新用户',
    cat_empty_title: '当前暂无在售商品',
    cat_empty_cat_title: '此分类下暂无商品',
    cat_empty_desc: '后台上架的新品将在此处实时自动同步显示。',
    cat_empty_cat_desc: '请选择其他分类或清除筛选查看全部分类商品。',
    cat_btn_see_all: '查看全部分类商品',

    // Trust Pillars
    trust_tag: '超级省钱 · 放心购物',
    trust_title: '为什么选择在 Sayta Mall 购物？',
    trust_subtitle: '您最值得信赖的数字化连锁商场，拥有最齐全的品类和最贴心的客户服务。',
    trust_p1_title: '科多巴 (C$) 本地货币明码标价',
    trust_p1_desc: '一手源头直供与工厂直达价，无汇率隐形差价，无任何隐藏手续费。',
    trust_p2_title: '本地同城极速极简送达',
    trust_p2_desc: '支持专属同城骑手极速送达上门，或直接前往当地分店免排队自提。',
    trust_p3_title: '丰富品类 一站集齐',
    trust_p3_desc: '工具五金、鞋履时尚、塑身衣、美妆数码及中国地道零食，尽在一个平台。',
    trust_p4_title: '100% 正品品质保障',
    trust_p4_desc: '出库备货前经过严格的商品品控检验，确保送达您手中的每一件商品完美无瑕。',

    // CTA
    cta_tag: '解锁专属会员特权底价',
    cta_title: '立即免费创建您的 Sayta Mall 账户',
    cta_desc: '只需 1 分钟即可完成邮箱或 Google 快速注册，畅享超级省钱购物体验。',
    cta_btn: '免费注册新账户',

    // Adults Section
    adult_badge: '🔞 仅限18岁以上成年人 · 私密内容',
    adult_title: '成人私密生活用品',
    adult_desc: '仅供已通过实名年龄确认的成年会员浏览选购。需登录并验证年龄。',
    adult_restricted_title: '受限访问区域',
    adult_restricted_desc: '您必须登录您的账户并确认已满 18 周岁才能浏览此专区。',

    // Product Card
    prod_add: '加入购物车',
    prod_added: '已加入',
    prod_out_of_stock: '暂时缺货',
    prod_login_to_see_price: '登录后查看价格',
    prod_unit: 'C$',

    // Cart Drawer
    cart_title: '我的购物车',
    cart_items_selected: '件已选商品',
    cart_empty: '购物车空空如也',
    cart_empty_desc: '立即探索我们的海量商品目录，将超值好物加入购物车。',
    cart_btn_explore: '开始选购商品',
    cart_subtotal: '商品小计',
    cart_discount: '优惠折扣',
    cart_delivery: '同城配送服务',
    cart_total: '应付总计',
    cart_btn_checkout: '确认下单',
    cart_order_summary: '订单清单',
    cart_delivery_info: '收件配送信息',
    cart_name_label: '收件人姓名 *',
    cart_name_placeholder: '例如：张伟 / María',
    cart_phone_label: '联系电话 (WhatsApp) *',
    cart_phone_placeholder: '+505 8888 1234',
    cart_address_label: '详细收件地址 *',
    cart_address_placeholder: '详细街道、门牌号、附近地标...',
    cart_reference_label: '送货参考说明 (选填)',
    cart_reference_placeholder: '黑门、白色围栏、近教堂...',
    cart_confirm_btn: '确认并提交订单',
    cart_success_title: '订单创建成功！',
    cart_success_desc: '您的订单已成功生成，库存已锁定。分店工作人员将立即为您备货，骑手将到店验码核验。',
    cart_open_whatsapp: '打开 WhatsApp 发送订单详情',
    cart_back_to_shop: '返回商城继续购物',

    // Catalog Page
    catalog_title: '商品目录全览',
    catalog_showing_from: '正在显示分店商品：',
    catalog_change: '(切换)',
    catalog_only_stock: '仅看有现货',
    catalog_sort_featured: '精选推荐',
    catalog_sort_price_asc: '价格：从低到高',
    catalog_sort_price_desc: '价格：从高到低',
    catalog_adult_banner: '已验证进入成人私密专区 (+18)。安全隐私浏览中。',
    catalog_adult_lock: '锁定并退出专区',
    catalog_adult_registered_desc: '成人用品专区严格仅对18岁以上成年人开放。请先注册或登录账户以继续访问。',
    catalog_adult_confirm_notice: '浏览成人私密专区前，您必须在法律层面确认您已年满 18 周岁。',
    catalog_adult_confirm_btn: '我确认我已年满 18 周岁',

    // Age Verification Modal
    age_modal_title: '成年年龄验证',
    age_modal_badge: '成人私密内容 — 仅限18岁以上',
    age_modal_desc: '此专区包含成年人专属私密用品。为了合规访问，您必须确认您已年满 18 周岁。',
    age_modal_warning: '未成年人严禁入内。继续访问即代表您自行承担法律责任，确认已达法定成年年龄。',
    age_modal_checkbox: '我确认已满 18 周岁，自愿浏览成人专属私密商品。',
    age_modal_btn_confirm: '我已满 18 岁 — 进入浏览',
    age_modal_btn_cancel: '取消退出',
    age_modal_disclaimer: 'Sayta Mall 倡导成年人合规与负责任消费。本验证为诚信自律承诺。',

    // Login Page
    login_back_to_store: '返回商城首页',
    login_tab_signin: '账号登录',
    login_tab_signup: '注册新用户',
    login_tab_phone: '手机验证',
    login_welcome_title: '欢迎回来',
    login_signup_title: '创建顾客账户',
    login_phone_title: '手机验证码登录',
    login_welcome_sub: '使用任意邮箱和密码或 Google 快捷登录。',
    login_signup_sub: '注册您的专属顾客账号，畅享批发特权价格及快捷下单。',
    login_phone_sub: '通过短信验证码快速核验您的真实顾客身份。',
    login_label_name: '顾客真实姓名',
    login_placeholder_name: '例如：李明 / Juan Pérez',
    login_label_age: '顾客年龄',
    login_label_required: '必填',
    login_placeholder_age: '例如：25 岁',
    login_label_address: '常用收货地址',
    login_placeholder_address: '例如：中心街区、药店往北两栋、蓝色外墙...',
    login_address_note: '此地址将作为订单配送的默认地址，下单时可随时调整。',
    login_label_reference: '配送详细参考说明 (选填)',
    login_placeholder_reference: '黑门、白色围栏、拐角房屋...',
    login_label_email: '电子邮箱 (Gmail、Outlook 或任意邮箱)',
    login_label_password: '账户密码',
    login_label_confirm_password: '再次确认密码',
    login_placeholder_password: '至少 6 个字符',
    login_btn_signin: '立即登录',
    login_btn_signup: '立即创建我的账户',
    login_btn_processing: '正在处理中...',
    login_or_continue_with: '或者通过以下方式快捷进入',
    login_btn_google: '通过 Google 账户一键登录',
    login_terms_privacy: '继续操作即表示您同意我们的服务条款与隐私政策。所有商品以科多巴 (C$ NIO) 官方结算。',
    login_feature_verified: '实名认证保障 · 真实自然人',
    login_feature_phone: '手机号短信真实验证',
    login_feature_phone_desc: '杜绝虚假账号与机器人，保障合法消费权益。',
    login_feature_admin: '多角色管理后台入口',
    login_feature_admin_desc: '店主与员工可协同管理商品、库存、价格与分类。',
    login_feature_discount: '特权折扣与底价授权',
    login_feature_discount_desc: '由店主或系统主管直接授权审核的专属降价优惠。',

    // Footer
    footer_rights: 'Sayta Mall 三泰百货 · 超级省钱，应有尽有。保留所有权利。',
    footer_dev: '技术支持与开发',
    footer_official_currency: '官方结算币种：NIO (C$ 科多巴)',
    footer_terms: '服务条款',
    footer_privacy: '隐私政策',

    // Navbar extra
    nav_subtitle: '超级省钱 · 应有尽有',
    nav_verified: '已实名认证',
    nav_verify_phone: '手机号验证',
    nav_manage_products: '商品管理',
    nav_console_dev: '开发者控制台',
    nav_portal_owner: '店主管理后台',
    nav_my_station: '我的工作站',
    nav_theme_light: '浅色',
    nav_theme_dark: '深色',
    nav_theme_system: '系统默认',

    // Branch Modal extra
    branch_currency_label: '结算货币：',
    branch_footer_note: '📍 商品目录将自动同步显示您所选分店的实时库存。',
    branch_select_title: '选择您的服务分店',
    branch_select_sub: '选择距离您最近的分店以查看实时库存与同城配送',
    branch_active: '当前选择',
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('es');

  // Inicialización desde localStorage
  useEffect(() => {
    try {
      const saved = (localStorage.getItem('sayta_global_lang') ||
        localStorage.getItem('sayta_dashboard_lang')) as Language;
      if (saved && ['es', 'en', 'zh'].includes(saved)) {
        setLangState(saved);
        if (typeof document !== 'undefined') {
          document.documentElement.lang = saved === 'zh' ? 'zh-CN' : saved;
        }
      }
    } catch {}

    const handleSync = (e: any) => {
      const newLang = e?.detail as Language;
      if (newLang && ['es', 'en', 'zh'].includes(newLang)) {
        setLangState(newLang);
      }
    };

    window.addEventListener('sayta_lang_change', handleSync);
    return () => window.removeEventListener('sayta_lang_change', handleSync);
  }, []);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem('sayta_global_lang', newLang);
      localStorage.setItem('sayta_dashboard_lang', newLang);
      if (typeof document !== 'undefined') {
        document.documentElement.lang = newLang === 'zh' ? 'zh-CN' : newLang;
      }
      window.dispatchEvent(new CustomEvent('sayta_lang_change', { detail: newLang }));
    } catch {}
  }, []);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      const currentDict = DICTIONARY[lang] || DICTIONARY.es;
      if (currentDict && currentDict[key]) {
        return currentDict[key];
      }
      // Fallback al español
      if (DICTIONARY.es && DICTIONARY.es[key]) {
        return DICTIONARY.es[key];
      }
      return fallback || key;
    },
    [lang]
  );

  const value: LanguageContextValue = {
    lang,
    setLang,
    t,
    isZh: lang === 'zh',
    isEn: lang === 'en',
    isEs: lang === 'es',
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    // Si se usa fuera del proveedor, retornar valores por defecto en español
    return {
      lang: 'es',
      setLang: () => {},
      t: (key: string, fallback?: string) => fallback || key,
      isZh: false,
      isEn: false,
      isEs: true,
    };
  }
  return context;
}
