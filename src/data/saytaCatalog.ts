// src/data/saytaCatalog.ts

export interface SaytaDepartment {
  id: string;
  name: string;
  icon: string;
  description: string;
  badge?: string;
  /** Si true, solo adultos (+18) registrados pueden ver los productos */
  isAdult?: boolean;
}

export const SAYTA_DEPARTMENTS: SaytaDepartment[] = [
  {
    id: 'herramientas',
    name: 'Herramientas & Ferretería',
    icon: '🔧',
    description: 'Taladros, destornilladores, martillos, llaves y candados',
    badge: 'Popular',
  },
  {
    id: 'calzado',
    name: 'Calzado & Zapatos',
    icon: '👟',
    description: 'Tenis deportivos, sandalias, botas y calzado casual',
  },
  {
    id: 'ropa',
    name: 'Ropa & Moda',
    icon: '👕',
    description: 'Camisas, camisetas, pantalones, conjuntos y vestidos',
  },
  {
    id: 'ropa-intima-fajas',
    name: 'Ropa Íntima & Fajas',
    icon: '👙',
    description: 'Fajas moldeadoras, lencería, bóxers y ropa térmica',
    badge: 'Más Vendido',
  },
  {
    id: 'cosmeticos',
    name: 'Cosméticos & Belleza',
    icon: '💄',
    description: 'Maquillaje, paletas de sombras, labiales y cuidado facial',
  },
  {
    id: 'electronica',
    name: 'Electrónica & Gadgets',
    icon: '🎧',
    description: 'Audífonos bluetooth, cargadores rápidos, cables y smartwatches',
    badge: 'Tendencia',
  },
  {
    id: 'bocadillos-chinos',
    name: 'Bocadillos Chinos & Snacks',
    icon: '🥢',
    description: 'Snacks picantes latiao, ramen asiático, botanas y dulces',
    badge: 'Exclusivo',
  },
  {
    id: 'gorras-accesorios',
    name: 'Gorras & Accesorios',
    icon: '🧢',
    description: 'Gorras snapback, sombreros, cinturones y gafas de sol',
  },
  {
    id: 'hogar-cocina',
    name: 'Hogar & Cocina',
    icon: '🍳',
    description: 'Picadores, sartenes, recipientes, organizadores y menaje',
  },
  {
    id: 'temporada',
    name: 'Productos de Temporada',
    icon: '✨',
    description: 'Luces decorativas, regalos, artículos para verano y festividades',
  },
  {
    id: 'juguetes-sexuales',
    name: 'Juguetes Sexuales',
    icon: '🔞',
    description: 'Artículos íntimos para adultos — Solo mayores de 18 años',
    badge: '+18',
    isAdult: true,
  },
];

/** Categoría de contenido para adultos */
export const ADULT_CATEGORY_ID = 'juguetes-sexuales';
export const ADULT_CATEGORY_NAME = 'Juguetes Sexuales';
export const SAYTA_SHOWCASE_PRODUCTS: any[] = [];
/*
  // ─── 1. Herramientas & Ferretería ───
  {
    id: 'sayta-taladro-21v',
    name: 'Taladro Percutor Inalámbrico 21V con Kit de Brocas y Maletín',
    tagline: '2 velocidades variables, luz LED y 2 baterías recargables de litio',
    category: 'Herramientas & Ferretería',
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80',
    price: 1450.0,
    originalPrice: 1650.0,
    available: true,
  },
  {
    id: 'sayta-herramientas-set',
    name: 'Set de Herramientas Mecánicas y Destornilladores (108 Piezas)',
    tagline: 'Acero cromo vanadio forjado de alta resistencia con estuche rígido',
    category: 'Herramientas & Ferretería',
    image: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=600&auto=format&fit=crop&q=80',
    price: 890.0,
    originalPrice: 990.0,
    available: true,
  },

  // ─── 2. Calzado & Zapatos ───
  {
    id: 'sayta-tenis-running',
    name: 'Tenis Deportivos Transpirables Running Pro Unisex',
    tagline: 'Suela amortiguada antideslizante con malla ultraligera de aire',
    category: 'Calzado & Zapatos',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
    price: 720.0,
    originalPrice: 850.0,
    available: true,
  },
  {
    id: 'sayta-sandalias-confort',
    name: 'Sandalias Ergonómicas Confort Suave para Dama y Caballero',
    tagline: 'Plantilla anatómica en espuma EVA de máxima amortiguación',
    category: 'Calzado & Zapatos',
    image: 'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=600&auto=format&fit=crop&q=80',
    price: 340.0,
    originalPrice: 390.0,
    available: true,
  },

  // ─── 3. Ropa & Moda ───
  {
    id: 'sayta-camisetas-pack',
    name: 'Pack x3 Camisetas Básicas de Algodón Peinado Premium',
    tagline: 'Cuello redondo reforzado, corte ergonómico y colores surtidos',
    category: 'Ropa & Moda',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80',
    price: 450.0,
    originalPrice: 520.0,
    available: true,
  },
  {
    id: 'sayta-conjunto-deportivo',
    name: 'Conjunto Deportivo Fitness Seamless (Top + Leggings Cintura Alta)',
    tagline: 'Tejido elástico de compresión transpirable que moldea la figura',
    category: 'Ropa & Moda',
    image: 'https://images.unsplash.com/photo-1518458028785-8fbcd101ebb9?w=600&auto=format&fit=crop&q=80',
    price: 520.0,
    originalPrice: 620.0,
    available: true,
  },

  // ─── 4. Ropa Íntima & Fajas ───
  {
    id: 'sayta-faja-moldeadora',
    name: 'Faja Reductora Colombiana de Alta Compresión / Avispa',
    tagline: 'Broches triples ajustables, soporte lumbar y control de abdomen',
    category: 'Ropa Íntima & Fajas',
    image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80',
    price: 480.0,
    originalPrice: 580.0,
    available: true,
  },
  {
    id: 'sayta-boxers-pack',
    name: 'Pack x4 Bóxers de Microfibra Elástica sin Costuras',
    tagline: 'Comodidad total con pretina ancha anti-rozaduras',
    category: 'Ropa Íntima & Fajas',
    image: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600&auto=format&fit=crop&q=80',
    price: 290.0,
    originalPrice: 340.0,
    available: true,
  },

  // ─── 5. Cosméticos & Belleza ───
  {
    id: 'sayta-paleta-sombras',
    name: 'Paleta de Sombras de Ojos 18 Tonos Glamour & Nude',
    tagline: 'Alta pigmentación, acabado mate y metálico con espejo integrado',
    category: 'Cosméticos & Belleza',
    image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&auto=format&fit=crop&q=80',
    price: 260.0,
    originalPrice: 310.0,
    available: true,
  },
  {
    id: 'sayta-set-brochas',
    name: 'Set Profesional de 14 Brochas de Maquillaje con Estuche',
    tagline: 'Cerdas sintéticas ultrasuaves para base, rubor y contorno',
    category: 'Cosméticos & Belleza',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80',
    price: 320.0,
    originalPrice: 380.0,
    available: true,
  },

  // ─── 6. Electrónica & Gadgets ───
  {
    id: 'sayta-audifonos-tws',
    name: 'Audífonos Inalámbricos Bluetooth 5.3 con Estuche de Carga Digital',
    tagline: 'Sonido estéreo de alta fidelidad con display LED de batería y micrófono',
    category: 'Electrónica & Gadgets',
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80',
    price: 390.0,
    originalPrice: 480.0,
    available: true,
  },
  {
    id: 'sayta-smartwatch',
    name: 'Smartwatch Deportivo Inteligente con Pulsómetro y Notificaciones',
    tagline: 'Monitoreo de pasos, sueño y llamadas Bluetooth compatible con iOS y Android',
    category: 'Electrónica & Gadgets',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
    price: 590.0,
    originalPrice: 690.0,
    available: true,
  },

  // ─── 7. Bocadillos Chinos & Snacks ───
  {
    id: 'sayta-latiao-spicy',
    name: 'Bocadillos Chinos Picantes Latiao Spicy Strips (Pack Familiar 5 uds)',
    tagline: 'Famoso snack asiático con textura masticable y toque de pimienta de Sichuan',
    category: 'Bocadillos Chinos & Snacks',
    image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&auto=format&fit=crop&q=80',
    price: 150.0,
    originalPrice: 180.0,
    available: true,
  },
  {
    id: 'sayta-ramen-pack',
    name: 'Ramen Instantáneo Asiático Master Pack x5 Variedades',
    tagline: 'Fideos gourmet con caldos espesos, verduras deshidratadas y picante ajustable',
    category: 'Bocadillos Chinos & Snacks',
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80',
    price: 240.0,
    originalPrice: 280.0,
    available: true,
  },

  // ─── 8. Gorras & Accesorios ───
  {
    id: 'sayta-gorra-snapback',
    name: 'Gorra Urbana Ajustable Snapback Bordada Premium 3D',
    tagline: 'Visera plana con diseño moderno estructurado y cierre snapback',
    category: 'Gorras & Accesorios',
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&auto=format&fit=crop&q=80',
    price: 250.0,
    originalPrice: 290.0,
    available: true,
  },
  {
    id: 'sayta-lentes-sol',
    name: 'Lentes de Sol Polarizados Protección UV400 Estilo Aviador',
    tagline: 'Marco liviano metálico con funda de protección y paño de microfibra',
    category: 'Gorras & Accesorios',
    image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80',
    price: 220.0,
    originalPrice: 270.0,
    available: true,
  },

  // ─── 9. Hogar & Cocina ───
  {
    id: 'sayta-picador-multifuncion',
    name: 'Picador y Cortador de Verduras Multifunción 12 en 1 con Recipiente',
    tagline: 'Cuchillas de acero inoxidable para picar en cubos, rebanar y rallar al instante',
    category: 'Hogar & Cocina',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80',
    price: 380.0,
    originalPrice: 450.0,
    available: true,
  },
  {
    id: 'sayta-sartenes-granito',
    name: 'Set de Sartenes Antiadherentes de Granito Ecológico (Set x3)',
    tagline: 'Cocina sin aceite con mango ergonómico imitación madera antiquemaduras',
    category: 'Hogar & Cocina',
    image: 'https://images.unsplash.com/photo-1584990347449-397a6d810a97?w=600&auto=format&fit=crop&q=80',
    price: 850.0,
    originalPrice: 980.0,
    available: true,
  },

  // ─── 10. Productos de Temporada ───
  {
    id: 'sayta-luces-rgb',
    name: 'Tira de Luces LED Inteligentes RGB 5 Metros con Control Remoto',
    tagline: 'Sincronización con música, múltiples efectos dinámicos y adhesivo 3M',
    category: 'Productos de Temporada',
    image: 'https://images.unsplash.com/photo-1549490349-8643362247b5?w=600&auto=format&fit=crop&q=80',
    price: 280.0,
    originalPrice: 340.0,
    available: true,
  },
];
*/

