// src/data/mockProducts.ts

export interface ProductItem {
  id: string;
  name: string;
  tagline: string;
  price: number;
  originalPrice: number;
  category: 'Tecnología' | 'Hogar Inteligente' | 'Gourmet' | 'Moda & Estilo';
  rating: number;
  reviewsCount: number;
  isNew?: boolean;
  isHot?: boolean;
  badge?: string;
  image: string;
  gallery: string[];
  description: string;
  specs: { label: string; value: string }[];
  branchesStock: {
    branchId: string;
    branchName: string;
    stock: number;
    available: boolean;
  }[];
}

export const CATEGORIES = [
  'Todos',
  'Tecnología',
  'Hogar Inteligente',
  'Gourmet',
  'Moda & Estilo',
] as const;

export const MOCK_BRANCHES = [
  {
    id: 'branch-central',
    name: 'Sayta Central',
    type: 'Almacén Principal & Tienda',
    address: 'Av. Las Palmas #450, Centro Financiero',
    hours: 'Lun - Dom: 07:00 - 23:00',
    phone: '+52 (55) 8800-0101',
    isOpen: true,
    pickupReadyMinutes: 15,
    deliveryFee: 0,
    tags: ['Entrega Inmediata', 'Almacén Completo', 'Pick-up Auto'],
  },
  {
    id: 'branch-norte',
    name: 'Sayta Norte',
    type: 'Plaza San Pedro',
    address: 'Blvd. San Pedro #1200, Local 18',
    hours: 'Lun - Dom: 08:00 - 22:00',
    phone: '+52 (55) 8800-0102',
    isOpen: true,
    pickupReadyMinutes: 20,
    deliveryFee: 49,
    tags: ['Tech Zone', 'Cafetería Gourmet', 'Pick-up Express'],
  },
  {
    id: 'branch-sur',
    name: 'Sayta Sur',
    type: 'Corredor Comercial Coyoacán',
    address: 'Calzada del Valle #880',
    hours: 'Lun - Dom: 08:00 - 21:30',
    phone: '+52 (55) 8800-0103',
    isOpen: true,
    pickupReadyMinutes: 25,
    deliveryFee: 49,
    tags: ['Productos Frescos', 'Zona Verde', 'Pick-up'],
  },
  {
    id: 'branch-express',
    name: 'Sayta Express Mini',
    type: 'Punto de Entrega Flash',
    address: 'Paseo de la Reforma #210',
    hours: 'Lun - Sáb: 09:00 - 20:00',
    phone: '+52 (55) 8800-0104',
    isOpen: true,
    pickupReadyMinutes: 10,
    deliveryFee: 29,
    tags: ['Entregas en 30 min', 'Solo Pick-up & Flash Delivery'],
  },
];

export const MOCK_PRODUCTS: ProductItem[] = [
  {
    id: 'prod-1',
    name: 'Sayta Sound Pro Max ANC',
    tagline: 'Cancelación activa de ruido híbrida y audio espacial inmersivo.',
    price: 899,
    originalPrice: 1299,
    category: 'Tecnología',
    rating: 4.9,
    reviewsCount: 342,
    isHot: true,
    badge: 'Más Vendido',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80',
    ],
    description:
      'Diseñado con precisión acústica y materiales aeroespaciales. Diafragmas de titanio de 40mm, cancelación activa de hasta 42dB, batería de 60 horas continuas y carga rápida vía USB-C.',
    specs: [
      { label: 'Autonomía', value: '60 horas de reproducción' },
      { label: 'Conectividad', value: 'Bluetooth 5.3 + Jack 3.5mm' },
      { label: 'Cancelación', value: 'Híbrida ANC de 42dB' },
      { label: 'Garantía', value: '2 años Sayta Care' },
    ],
    branchesStock: [
      { branchId: 'branch-central', branchName: 'Sayta Central', stock: 24, available: true },
      { branchId: 'branch-norte', branchName: 'Sayta Norte', stock: 12, available: true },
      { branchId: 'branch-sur', branchName: 'Sayta Sur', stock: 8, available: true },
      { branchId: 'branch-express', branchName: 'Sayta Express', stock: 5, available: true },
    ],
  },
  {
    id: 'prod-2',
    name: 'Sayta Watch Ultra Titanium',
    tagline: 'Caja de titanio de grado aeroespacial y pantalla OLED Always-On.',
    price: 1499,
    originalPrice: 1999,
    category: 'Tecnología',
    rating: 4.8,
    reviewsCount: 189,
    isNew: true,
    badge: 'Novedad',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80',
    ],
    description:
      'El smartwatch definitivo para salud, rendimiento atlético y conectividad multisucursal. Sensor de oxígeno en sangre, ECG, GPS de doble frecuencia y resistencia al agua 50m.',
    specs: [
      { label: 'Caja', value: 'Titanio 49mm' },
      { label: 'Pantalla', value: 'OLED Retina 2000 nits' },
      { label: 'Batería', value: 'Hasta 72 horas' },
      { label: 'Resistencia', value: 'IP68 / 5 ATM' },
    ],
    branchesStock: [
      { branchId: 'branch-central', branchName: 'Sayta Central', stock: 18, available: true },
      { branchId: 'branch-norte', branchName: 'Sayta Norte', stock: 6, available: true },
      { branchId: 'branch-sur', branchName: 'Sayta Sur', stock: 4, available: true },
      { branchId: 'branch-express', branchName: 'Sayta Express', stock: 2, available: true },
    ],
  },
  {
    id: 'prod-3',
    name: 'Café de Especialidad Orgánico Arábica 500g',
    tagline: 'Tostado artesanal medio con notas de cacao, avellana y caramelo.',
    price: 189,
    originalPrice: 240,
    category: 'Gourmet',
    rating: 5.0,
    reviewsCount: 420,
    badge: 'Favorito Gourmet',
    image: 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&auto=format&fit=crop&q=80',
    ],
    description:
      'Cultivado en altura a más de 1,600 msnm. Granos 100% arábica estrictamente cosechados a mano. Certificación orgánica internacional y trazabilidad directa de pequeños productores.',
    specs: [
      { label: 'Origen', value: 'Chiapas, Altura 1650m' },
      { label: 'Tueste', value: 'Medio / Artesanal' },
      { label: 'Presentación', value: 'Grano o Molido (500g)' },
      { label: 'Certificación', value: 'Orgánico SAGARPA / USDA' },
    ],
    branchesStock: [
      { branchId: 'branch-central', branchName: 'Sayta Central', stock: 85, available: true },
      { branchId: 'branch-norte', branchName: 'Sayta Norte', stock: 40, available: true },
      { branchId: 'branch-sur', branchName: 'Sayta Sur', stock: 32, available: true },
      { branchId: 'branch-express', branchName: 'Sayta Express', stock: 20, available: true },
    ],
  },
  {
    id: 'prod-4',
    name: 'Lámpara Ambient Halo Minimalista',
    tagline: 'Iluminación biodinámica con control táctil y carga inalámbrica Qi.',
    price: 649,
    originalPrice: 899,
    category: 'Hogar Inteligente',
    rating: 4.7,
    reviewsCount: 96,
    badge: 'Diseño Apple-Style',
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80',
    ],
    description:
      'Cuerpo de aluminio anodizado mate y base con almohadilla de carga inalámbrica rápida de 15W. Ajusta la temperatura de color de 2700K a 6500K con una caricia en su halo magnético.',
    specs: [
      { label: 'Material', value: 'Aluminio aeroespacial anodizado' },
      { label: 'Carga Qi', value: '15W Fast Charge' },
      { label: 'Temperatura', value: '2700K - 6500K regulable' },
      { label: 'Eficiencia', value: 'LED Clase A++' },
    ],
    branchesStock: [
      { branchId: 'branch-central', branchName: 'Sayta Central', stock: 15, available: true },
      { branchId: 'branch-norte', branchName: 'Sayta Norte', stock: 8, available: true },
      { branchId: 'branch-sur', branchName: 'Sayta Sur', stock: 5, available: true },
      { branchId: 'branch-express', branchName: 'Sayta Express', stock: 0, available: false },
    ],
  },
  {
    id: 'prod-5',
    name: 'Aceite de Oliva Extra Virgen Reserva 750ml',
    tagline: 'Prensado en frío en las primeras 6 horas de cosecha.',
    price: 269,
    originalPrice: 320,
    category: 'Gourmet',
    rating: 4.9,
    reviewsCount: 150,
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&auto=format&fit=crop&q=80',
    ],
    description:
      'Acidez máxima de 0.2%. Producido exclusivamente con aceitunas Arbequina y Picual seleccionadas. Botella de vidrio oscuro con protección UV para conservar sus polifenoles y sabor original.',
    specs: [
      { label: 'Extracción', value: 'En frío mecánica a 21°C' },
      { label: 'Acidez', value: '< 0.2%' },
      { label: 'Botella', value: '750ml con dosificador anti-goteo' },
      { label: 'Cosecha', value: 'Reserva Especial 2026' },
    ],
    branchesStock: [
      { branchId: 'branch-central', branchName: 'Sayta Central', stock: 60, available: true },
      { branchId: 'branch-norte', branchName: 'Sayta Norte', stock: 25, available: true },
      { branchId: 'branch-sur', branchName: 'Sayta Sur', stock: 30, available: true },
      { branchId: 'branch-express', branchName: 'Sayta Express', stock: 14, available: true },
    ],
  },
  {
    id: 'prod-6',
    name: 'Mochila Urbana Tech Waterproof 22L',
    tagline: 'Compartimento acolchado para MacBook 16" y puerto magnético MagSafe.',
    price: 799,
    originalPrice: 1199,
    category: 'Moda & Estilo',
    rating: 4.8,
    reviewsCount: 112,
    badge: '-33% Descuento',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
    ],
    description:
      'Fabricada en poliéster reciclado Cordura impermeable grado balístico. Cremalleras impermeables YKK y distribución ergonómica con soporte lumbar transpirable para largas jornadas.',
    specs: [
      { label: 'Capacidad', value: '22 Litros' },
      { label: 'Compatibilidad', value: 'Laptops hasta 16 pulgadas' },
      { label: 'Material', value: 'Cordura Reciclada Waterproof' },
      { label: 'Bolsillos', value: '14 organizadores internos' },
    ],
    branchesStock: [
      { branchId: 'branch-central', branchName: 'Sayta Central', stock: 20, available: true },
      { branchId: 'branch-norte', branchName: 'Sayta Norte', stock: 10, available: true },
      { branchId: 'branch-sur', branchName: 'Sayta Sur', stock: 7, available: true },
      { branchId: 'branch-express', branchName: 'Sayta Express', stock: 3, available: true },
    ],
  },
  {
    id: 'prod-7',
    name: 'Teclado Mecánico Slim Wireless Sayta Studio',
    tagline: 'Switches mecánicos táctiles de bajo perfil y chasis de aluminio.',
    price: 999,
    originalPrice: 1399,
    category: 'Tecnología',
    rating: 4.9,
    reviewsCount: 88,
    isNew: true,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
    ],
    description:
      'Elegancia minimalista inspirada en la tipografía y arquitectura moderna. Iluminación blanca sutil que se activa por proximidad, conectividad triple multidispositivo (Mac/Windows/iOS/Android).',
    specs: [
      { label: 'Switches', value: 'Low-profile Tactile Quiet' },
      { label: 'Conexión', value: '3 dispositivos Bluetooth + 2.4GHz USB' },
      { label: 'Batería', value: 'Hasta 5 meses con una carga' },
      { label: 'Chasis', value: 'Aluminio anodizado espacial' },
    ],
    branchesStock: [
      { branchId: 'branch-central', branchName: 'Sayta Central', stock: 14, available: true },
      { branchId: 'branch-norte', branchName: 'Sayta Norte', stock: 9, available: true },
      { branchId: 'branch-sur', branchName: 'Sayta Sur', stock: 4, available: true },
      { branchId: 'branch-express', branchName: 'Sayta Express', stock: 2, available: true },
    ],
  },
  {
    id: 'prod-8',
    name: 'Purificador de Aire Sayta Air Pure Mini',
    tagline: 'Filtro True HEPA H13, sensor de partículas láser y modo silencioso 19dB.',
    price: 1199,
    originalPrice: 1599,
    category: 'Hogar Inteligente',
    rating: 4.8,
    reviewsCount: 74,
    badge: 'Hogar Saludable',
    image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&auto=format&fit=crop&q=80',
    ],
    description:
      'Purifica estancias de hasta 35 m² en solo 12 minutos. Captura el 99.97% de polvo fino, polen, alérgenos y olores con carbón activado de alta densidad. Luz nocturna suave con atenuación.',
    specs: [
      { label: 'Filtro', value: 'True HEPA H13 + Carbón Activo' },
      { label: 'Área', value: 'Hasta 35 m²' },
      { label: 'Ruido', value: 'Ultra silencioso (19dB)' },
      { label: 'Consumo', value: 'Solo 18W a máxima potencia' },
    ],
    branchesStock: [
      { branchId: 'branch-central', branchName: 'Sayta Central', stock: 11, available: true },
      { branchId: 'branch-norte', branchName: 'Sayta Norte', stock: 6, available: true },
      { branchId: 'branch-sur', branchName: 'Sayta Sur', stock: 3, available: true },
      { branchId: 'branch-express', branchName: 'Sayta Express', stock: 0, available: false },
    ],
  },
];
