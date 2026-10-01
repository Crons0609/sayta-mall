// src/components/products/SharedProductManager.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useBranch } from '@/providers/BranchProvider';
import { useDashboardPreferences } from '@/providers/DashboardPreferencesProvider';
import { ProductDocument, CategoryDocument } from '@/types/product.types';
import { formatCurrency } from '@/lib/utils/currency';
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import {
  Package,
  Plus,
  Search,
  Tag,
  Percent,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Edit2,
  Trash2,
  Check,
  ShieldAlert,
  Sparkles,
  ShoppingBag,
  DollarSign,
  Layers,
  ArrowRight,
  Filter,
  Eye,
  Info,
  Upload,
  Image as ImageIcon,
  Camera,
  RefreshCw,
  RotateCcw,
  History,
  Barcode,
  TriangleAlert,
} from 'lucide-react';
import {
  convertFileToBinaryDataUrl,
  uploadBinaryImageToFirebase,
  generateStoragePath,
  isBinaryDataUrl,
  validateImageFile,
} from '@/lib/utils/image';
import {
  saveProductToRtdb,
  getProductsFromRtdb,
  deleteProductFromRtdb,
  writeRtdb,
} from '@/lib/firebase/rtdb';
import {
  findDuplicateProduct,
  calculateAutomaticDiscount,
  recordPriceHistory,
  getProductPriceHistory,
  normalizeProductName,
  PriceHistoryRecord,
} from '@/lib/products/pricingEngine';

// Categorías iniciales comunes
const DEFAULT_CATEGORIES = [
  'Herramientas & Ferretería',
  'Calzado & Zapatos',
  'Ropa & Moda',
  'Ropa Íntima & Fajas',
  'Cosméticos & Belleza',
  'Electrónica & Gadgets',
  'Bocadillos Chinos & Snacks',
  'Gorras & Accesorios',
  'Hogar & Cocina',
  'Productos de Temporada',
  'Juguetes Sexuales',
  'General',
];


// Presets de imágenes de stock rápidas para agilizar la carga
const SAMPLE_IMAGES = [
  { label: 'Herramientas', url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80' },
  { label: 'Calzado', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80' },
  { label: 'Ropa', url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80' },
  { label: 'Fajas / Moda', url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop&q=80' },
  { label: 'Cosméticos', url: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&auto=format&fit=crop&q=80' },
  { label: 'Electrónica', url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80' },
  { label: 'Snacks / Alimentos', url: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=600&auto=format&fit=crop&q=80' },
  { label: 'Hogar / Cocina', url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80' },
  { label: 'Luces / Temporada', url: 'https://images.unsplash.com/photo-1549490349-8643362247b5?w=600&auto=format&fit=crop&q=80' },
];

interface SharedProductManagerProps {
  userRole: 'owner' | 'employee' | 'programmer';
}

export function SharedProductManager({ userRole }: SharedProductManagerProps) {
  const { user, claims } = useAuth();
  const { currentBranch } = useBranch();
  const { t } = useDashboardPreferences();

  // Estados de datos
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [discountFilter, setDiscountFilter] = useState<'all' | 'pending' | 'discounted'>('all');

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // Formulario Producto
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formCategory, setFormCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [formPrice, setFormPrice] = useState<number | ''>('');
  const [formStock, setFormStock] = useState<number | ''>(10);
  const [formDescription, setFormDescription] = useState('');
  const [formTagline, setFormTagline] = useState('');
  const [formImage, setFormImage] = useState(SAMPLE_IMAGES[0].url);
  const [imageBinarySize, setImageBinarySize] = useState<number | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Descuento Formulario
  const [hasDiscount, setHasDiscount] = useState(false);
  const [discountPercent, setDiscountPercent] = useState<number>(10);
  const [discountReason, setDiscountReason] = useState('');

  // Detección de duplicados y descuento automático
  const [duplicateDetected, setDuplicateDetected] = useState<any | null>(null);
  const [autoDiscountInfo, setAutoDiscountInfo] = useState<{ porcentaje: number; ahorro: number } | null>(null);
  const [duplicateModalMode, setDuplicateModalMode] = useState<'lower_price' | 'higher_price' | null>(null);
  const [pendingSavePayload, setPendingSavePayload] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Historial de precios
  const [priceHistoryModal, setPriceHistoryModal] = useState<{ open: boolean; productId: string; productName: string; records: PriceHistoryRecord[] } | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Formulario Nueva Categoría
  const [newCategoryName, setNewCategoryName] = useState('');

  // Mensajes y alertas
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const canAuthorizeDiscounts = userRole === 'owner' || userRole === 'programmer';

  // 1. Cargar productos desde Firestore y LocalStorage sincronizado
  useEffect(() => {
    const loadProducts = () => {
      setLoading(true);
      try {
        const branchId = currentBranch?.id || 'branch-central';
        const productsRef = collection(db, 'products');
        const q = query(productsRef, where('branchId', '==', branchId));

        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const firestoreItems: any[] = [];
            snapshot.forEach((d) => {
              firestoreItems.push({ id: d.id, ...d.data() });
            });

            // Combinar con almacenamiento local si existe
            let localItems: any[] = [];
            if (typeof window !== 'undefined') {
              try {
                const stored = localStorage.getItem('sayta_custom_products');
                if (stored) localItems = JSON.parse(stored);
              } catch (e) {}
            }

            // Unir sin duplicados
            const map = new Map<string, any>();
            firestoreItems.forEach((p) => map.set(p.id, p));
            localItems.forEach((p) => {
              if (!map.has(p.id)) map.set(p.id, p);
            });

            const merged = Array.from(map.values());
            setProducts(merged);
            setLoading(false);
          },
          (err) => {
            console.warn('[SharedProductManager] Usando almacenamiento local:', err.message);
            // Fallback a localStorage
            let localItems: any[] = [];
            if (typeof window !== 'undefined') {
              try {
                const stored = localStorage.getItem('sayta_custom_products');
                if (stored) localItems = JSON.parse(stored);
              } catch (e) {}
            }
            setProducts(localItems);
            setLoading(false);
          }
        );

        // Cargar también desde Firebase Realtime Database
        getProductsFromRtdb(branchId).then((rtdbItems) => {
          if (rtdbItems && rtdbItems.length > 0) {
            setProducts((prev) => {
              const map = new Map<string, any>();
              prev.forEach((p) => map.set(p.id, p));
              rtdbItems.forEach((p) => map.set(p.id, p));
              return Array.from(map.values());
            });
            setLoading(false);
          }
        }).catch(() => {});

        return () => unsubscribe();
      } catch (e) {
        setLoading(false);
      }
    };

    const unsub = loadProducts();
    return () => {
      if (unsub) unsub();
    };
  }, [currentBranch?.id]);

  // 2. Cargar categorías desde Firebase RTDB mediante API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (data.success && Array.isArray(data.categories)) {
          const names = data.categories.map((c: any) => c.name);
          setCategories(Array.from(new Set([...DEFAULT_CATEGORIES, ...names])));
        }
      } catch (e) {
        console.warn('Error fetching categories from API:', e);
      }
    };
    fetchCategories();
  }, []);

  // Notificación con autocierre
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Manejador de subida de archivo binario / Data URL
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      showNotification('error', validation.error || 'Archivo inválido');
      return;
    }

    try {
      setIsProcessingImage(true);
      const { dataUrl, sizeKB } = await convertFileToBinaryDataUrl(file);
      setFormImage(dataUrl);
      setImageBinarySize(sizeKB);
      showNotification('success', `Imagen convertida a cadena binaria WebP (${sizeKB} KB) correctamente.`);
    } catch (err: any) {
      showNotification('error', err.message || 'Error al procesar la imagen binaria.');
    } finally {
      setIsProcessingImage(false);
    }
  };

  // Abrir modal de creación
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormName('');
    setFormSku('');
    setFormCategory(categories[0] || 'General');
    setFormPrice('');
    setFormStock(10);
    setFormDescription('');
    setFormTagline('');
    setFormImage(SAMPLE_IMAGES[0].url);
    setImageBinarySize(null);
    setHasDiscount(false);
    setDiscountPercent(10);
    setDiscountReason('');
    setDuplicateDetected(null);
    setAutoDiscountInfo(null);
    setIsModalOpen(true);
  };

  // Abrir modal de edición
  const handleOpenEdit = (product: any) => {
    setEditingProduct(product);
    setFormName(product.name || '');
    setFormSku(product.sku || product.barcode || product.codigo || '');
    setFormCategory(product.categoryName || product.category || 'General');
    setFormPrice(product.compareAtPrice || (product.price ?? ''));
    setFormStock(product.stock ?? 10);
    setFormDescription(product.description || '');
    setFormTagline(product.tagline || product.shortDescription || '');
    const currentImg = product.images?.[0]?.url || product.image || SAMPLE_IMAGES[0].url;
    setFormImage(currentImg);
    if (isBinaryDataUrl(currentImg)) {
      setImageBinarySize(Math.round((currentImg.length * 3) / 4 / 1024));
    } else {
      setImageBinarySize(null);
    }

    if (product.discountPercent || product.discountStatus) {
      setHasDiscount(product.discountStatus !== 'none');
      setDiscountPercent(product.discountPercent || 10);
      setDiscountReason(product.discountReason || '');
    } else {
      setHasDiscount(false);
      setDiscountPercent(10);
      setDiscountReason('');
    }
    setDuplicateDetected(null);
    setAutoDiscountInfo(null);
    setIsModalOpen(true);
  };

  // Ver historial de precios
  const handleViewHistory = async (product: any) => {
    setLoadingHistory(true);
    const records = await getProductPriceHistory(product.id);
    setPriceHistoryModal({ open: true, productId: product.id, productName: product.name, records });
    setLoadingHistory(false);
  };

  // Restaurar precio original (quitar descuento automático)
  const handleRestoreOriginalPrice = async (product: any) => {
    if (!product.compareAtPrice && !product.precioOriginal) {
      showNotification('error', 'Este producto no tiene un precio original guardado para restaurar.');
      return;
    }
    const originalPrice = product.compareAtPrice || product.precioOriginal;
    const updated = {
      ...product,
      price: originalPrice,
      compareAtPrice: undefined,
      discountPercent: 0,
      discountPrice: undefined,
      hasDiscount: false,
      discountStatus: 'none',
      updatedAt: new Date().toISOString(),
    };
    try {
      try { await setDoc(doc(db, 'products', product.id), updated, { merge: true }); } catch {}
      let localItems: any[] = [];
      try { localItems = JSON.parse(localStorage.getItem('sayta_custom_products') || '[]'); } catch {}
      const idx = localItems.findIndex((p) => p.id === product.id);
      if (idx >= 0) { localItems[idx] = updated; localStorage.setItem('sayta_custom_products', JSON.stringify(localItems)); }
      window.dispatchEvent(new Event('sayta_products_updated'));
      setProducts((prev) => prev.map((p) => (p.id === product.id ? updated : p)));
      // Registrar en historial
      await recordPriceHistory({
        id: `ph_${Date.now()}`,
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        precioAnterior: product.price,
        precioNuevo: originalPrice,
        porcentajeCambio: 0,
        tipo: 'restauracion',
        empleadoId: user?.uid || 'local',
        empleadoNombre: user?.displayName || user?.email || 'Empleado',
        fecha: new Date().toISOString(),
        motivo: 'Restauración manual del precio original',
      });
      // Auditoría
      writeRtdb(`audit_logs/${Date.now()}`, { action: 'restore_price', productId: product.id, productName: product.name, by: user?.email || 'local', role: userRole, timestamp: new Date().toISOString() }).catch(() => {});
      showNotification('success', `✅ Precio restaurado a ${formatCurrency(originalPrice, 'NIO')}. El descuento fue eliminado.`);
    } catch (err: any) {
      showNotification('error', 'Error al restaurar precio: ' + err.message);
    }
  };

  // Detección de duplicados al escribir nombre o SKU
  useEffect(() => {
    if (!formName.trim() && !formSku.trim()) {
      setDuplicateDetected(null);
      setAutoDiscountInfo(null);
      return;
    }
    const found = findDuplicateProduct(
      { sku: formSku, name: formName, id: editingProduct?.id },
      products
    );
    if (found) {
      setDuplicateDetected(found);
      if (formPrice !== '' && Number(formPrice) > 0) {
        const existingPrice = found.compareAtPrice || found.price;
        const result = calculateAutomaticDiscount(existingPrice, Number(formPrice));
        setAutoDiscountInfo(result.esMenor ? { porcentaje: result.porcentaje, ahorro: result.ahorro } : null);
      } else {
        setAutoDiscountInfo(null);
      }
    } else {
      setDuplicateDetected(null);
      setAutoDiscountInfo(null);
    }
  }, [formName, formSku, formPrice, products, editingProduct?.id]);

  // Función interna para persistir el producto y registrar auditoría
  const persistProduct = async (productPayload: any, isEdit: boolean, priceChanged?: { anterior: number; nuevo: number }) => {
    try {
      try { await saveProductToRtdb(productPayload); } catch {}
      try { await setDoc(doc(db, 'products', productPayload.id), productPayload, { merge: true }); } catch {}

      let localItems: any[] = [];
      try { localItems = JSON.parse(localStorage.getItem('sayta_custom_products') || '[]'); } catch {}
      const idx = localItems.findIndex((p: any) => p.id === productPayload.id);
      if (idx >= 0) { localItems[idx] = { ...localItems[idx], ...productPayload }; } else { localItems.unshift(productPayload); }
      localStorage.setItem('sayta_custom_products', JSON.stringify(localItems));
      window.dispatchEvent(new Event('sayta_products_updated'));

      setProducts((prev) => {
        const existing = prev.findIndex((p) => p.id === productPayload.id);
        if (existing >= 0) { const next = [...prev]; next[existing] = { ...next[existing], ...productPayload }; return next; }
        return [productPayload, ...prev];
      });

      // Registrar auditoría
      const auditEntry = {
        action: isEdit ? 'edit_product' : 'create_product',
        productId: productPayload.id,
        productName: productPayload.name,
        sku: productPayload.sku,
        price: productPayload.price,
        discountPercent: productPayload.discountPercent,
        by: user?.email || 'local',
        byName: user?.displayName || 'Empleado',
        role: userRole,
        timestamp: new Date().toISOString(),
        ...(priceChanged ? { precioAnterior: priceChanged.anterior, precioNuevo: priceChanged.nuevo } : {}),
      };
      writeRtdb(`audit_logs/${Date.now()}`, auditEntry).catch(() => {});
      // También en localStorage para el programador
      try {
        const auditLocal = JSON.parse(localStorage.getItem('sayta_audit_logs') || '[]');
        auditLocal.unshift(auditEntry);
        localStorage.setItem('sayta_audit_logs', JSON.stringify(auditLocal.slice(0, 200)));
      } catch {}

      if (priceChanged) {
        const porcentaje = Math.round(((priceChanged.anterior - priceChanged.nuevo) / priceChanged.anterior) * 10000) / 100;
        await recordPriceHistory({
          id: `ph_${Date.now()}`,
          productId: productPayload.id,
          productName: productPayload.name,
          sku: productPayload.sku,
          precioAnterior: priceChanged.anterior,
          precioNuevo: priceChanged.nuevo,
          porcentajeCambio: porcentaje,
          tipo: 'descuento_automatico',
          empleadoId: user?.uid || 'local',
          empleadoNombre: user?.displayName || user?.email || 'Empleado',
          fecha: new Date().toISOString(),
          motivo: 'Descuento automático por precio menor detectado',
        });
      }
    } catch (err: any) {
      throw err;
    }
  };

  // Guardar Producto — con detección de duplicados y descuento automático
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim() || formPrice === '' || Number(formPrice) <= 0) {
      showNotification('error', 'Por favor ingresa un nombre y precio válido.');
      return;
    }

    const priceNum = Number(formPrice);
    const stockNum = Number(formStock) || 0;
    const branchId = currentBranch?.id || 'branch-central';
    const branchName = currentBranch?.name || 'Sayta Central';
    const isEditMode = !!editingProduct;

    // ── Detección de Duplicado (solo al crear, no al editar el mismo producto) ──
    if (!isEditMode) {
      const duplicate = findDuplicateProduct({ sku: formSku, name: formName, id: undefined }, products);
      if (duplicate) {
        const existingOriginalPrice = duplicate.compareAtPrice || duplicate.price;
        const discountCalc = calculateAutomaticDiscount(existingOriginalPrice, priceNum);

        if (discountCalc.esMenor) {
          // Precio nuevo < precio existente → aplicar descuento automático
          setDuplicateModalMode('lower_price');
          setDuplicateDetected(duplicate);
          setAutoDiscountInfo({ porcentaje: discountCalc.porcentaje, ahorro: discountCalc.ahorro });
          // Preparar payload para cuando el usuario confirme
          setPendingSavePayload({ duplicate, priceNum, stockNum, branchId, branchName });
          return; // Esperar confirmación
        } else if (discountCalc.esMayor || discountCalc.esIgual) {
          // Precio nuevo >= precio existente → advertir
          setDuplicateModalMode('higher_price');
          setDuplicateDetected(duplicate);
          setPendingSavePayload({ duplicate, priceNum, stockNum, branchId, branchName });
          return; // Esperar decisión del empleado
        }
      }
    }

    await doSaveProduct(priceNum, stockNum, branchId, branchName, isEditMode);
  };

  // Confirmar descuento automático (modal de duplicado lower_price)
  const handleConfirmAutoDiscount = async () => {
    if (!pendingSavePayload || !duplicateDetected || !autoDiscountInfo) return;
    const { duplicate, priceNum, stockNum, branchId, branchName } = pendingSavePayload;
    const originalPrice = duplicate.compareAtPrice || duplicate.price;

    setIsSaving(true);
    try {
      // Actualizar el producto existente con el descuento calculado
      const updated = {
        ...duplicate,
        price: priceNum,
        compareAtPrice: originalPrice,
        discountPercent: autoDiscountInfo.porcentaje,
        discountPrice: priceNum,
        hasDiscount: true,
        discountStatus: canAuthorizeDiscounts ? 'approved' : 'pending',
        stock: stockNum > 0 ? stockNum : duplicate.stock,
        updatedAt: new Date().toISOString(),
        discountReason: discountReason.trim() || 'Descuento automático por bajada de precio',
        ...(canAuthorizeDiscounts
          ? { discountApprovedBy: { uid: user?.uid, name: user?.displayName || 'Auth', role: userRole, date: new Date().toISOString() } }
          : { discountRequestedBy: { uid: user?.uid, name: user?.displayName || 'Empleado', role: userRole, date: new Date().toISOString() } }),
      };
      await persistProduct(updated, true, { anterior: originalPrice, nuevo: priceNum });
      setDuplicateModalMode(null);
      setDuplicateDetected(null);
      setAutoDiscountInfo(null);
      setPendingSavePayload(null);
      setIsModalOpen(false);
      showNotification('success', `✅ Descuento del ${autoDiscountInfo.porcentaje}% aplicado automáticamente a "${duplicate.name}".`);
    } catch (err: any) {
      showNotification('error', 'Error aplicando descuento: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Confirmar actualización de precio (modal higher_price)
  const handleConfirmPriceUpdate = async () => {
    if (!pendingSavePayload || !duplicateDetected) return;
    const { priceNum, stockNum, branchId, branchName } = pendingSavePayload;
    setIsSaving(true);
    try {
      const updated = {
        ...duplicateDetected,
        price: priceNum,
        compareAtPrice: undefined,
        discountPercent: 0,
        discountPrice: undefined,
        hasDiscount: false,
        discountStatus: 'none',
        stock: stockNum > 0 ? stockNum : duplicateDetected.stock,
        updatedAt: new Date().toISOString(),
      };
      await persistProduct(updated, true);
      setDuplicateModalMode(null);
      setDuplicateDetected(null);
      setPendingSavePayload(null);
      setIsModalOpen(false);
      showNotification('success', `✅ Precio actualizado correctamente a ${formatCurrency(priceNum, 'NIO')}.`);
    } catch (err: any) {
      showNotification('error', 'Error actualizando precio: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Guardar como producto nuevo (ignorar duplicado)
  const handleSaveAsNew = async () => {
    if (!pendingSavePayload) return;
    const { priceNum, stockNum, branchId, branchName } = pendingSavePayload;
    setDuplicateModalMode(null);
    setDuplicateDetected(null);
    setPendingSavePayload(null);
    await doSaveProduct(priceNum, stockNum, branchId, branchName, false, true);
  };

  // Función central de guardado
  const doSaveProduct = async (
    priceNum: number,
    stockNum: number,
    branchId: string,
    branchName: string,
    isEditMode: boolean,
    forceNew = false
  ) => {
    setIsSaving(true);
    let finalDiscountStatus: 'none' | 'pending' | 'approved' | 'rejected' = 'none';
    let discountPriceNum: number | undefined;

    if (hasDiscount && discountPercent > 0) {
      discountPriceNum = Math.round(priceNum * (1 - discountPercent / 100));
      finalDiscountStatus = canAuthorizeDiscounts ? 'approved' : 'pending';
    }

    const productId = isEditMode ? editingProduct.id : `prod_${Date.now()}`;
    let finalImageUrl = formImage || SAMPLE_IMAGES[0].url;
    let storagePath = '';

    if (isBinaryDataUrl(formImage)) {
      storagePath = generateStoragePath('products', branchId, productId);
      try {
        const uploadResult = await uploadBinaryImageToFirebase(formImage, storagePath);
        finalImageUrl = uploadResult.url;
      } catch (e) {
        finalImageUrl = formImage;
      }
    }

    const productPayload: any = {
      id: productId,
      productId,
      branchId,
      branchName,
      name: formName.trim(),
      sku: formSku.trim() || undefined,
      slug: formName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category: formCategory,
      categoryName: formCategory,
      price: priceNum,
      compareAtPrice: hasDiscount ? priceNum : undefined,
      discountPercent: hasDiscount ? discountPercent : undefined,
      discountPrice: hasDiscount ? discountPriceNum : undefined,
      discountReason: hasDiscount ? discountReason.trim() : undefined,
      discountStatus: finalDiscountStatus,
      stock: stockNum,
      available: stockNum > 0,
      description: formDescription.trim(),
      shortDescription: formTagline.trim(),
      tagline: formTagline.trim(),
      image: finalImageUrl,
      images: [{ url: finalImageUrl, storagePath: storagePath || undefined, order: 0 }],
      status: 'active',
      updatedAt: new Date().toISOString(),
    };

    if (finalDiscountStatus === 'pending') {
      productPayload.discountRequestedBy = { uid: user?.uid || 'emp-local', name: user?.displayName || user?.email || 'Empleado de Tienda', role: userRole, date: new Date().toISOString() };
    } else if (finalDiscountStatus === 'approved') {
      productPayload.discountApprovedBy = { uid: user?.uid || 'auth-local', name: user?.displayName || 'Dueño/Programador', role: userRole, date: new Date().toISOString() };
    }

    if (!isEditMode) {
      productPayload.createdBy = user?.uid || 'user-local';
      productPayload.createdByName = user?.displayName || user?.email || 'Personal de Tienda';
      productPayload.createdByRole = userRole;
      productPayload.createdAt = new Date().toISOString();
    }

    try {
      const previousPrice = isEditMode ? (editingProduct.compareAtPrice || editingProduct.price) : undefined;
      const priceActuallyChanged = isEditMode && previousPrice !== undefined && previousPrice !== priceNum;
      await persistProduct(productPayload, isEditMode, priceActuallyChanged ? { anterior: previousPrice, nuevo: priceNum } : undefined);
      setIsModalOpen(false);
      if (hasDiscount && finalDiscountStatus === 'pending') {
        showNotification('success', `¡Producto guardado! El descuento del ${discountPercent}% quedó en espera de autorización.`);
      } else {
        showNotification('success', isEditMode ? '¡Producto actualizado exitosamente!' : '¡Producto publicado en el catálogo!');
      }
    } catch (err: any) {
      showNotification('error', 'Error guardando producto: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Aprobar descuento (Dueño o Programador)
  const handleApproveDiscount = async (product: any) => {
    if (!canAuthorizeDiscounts) {
      showNotification('error', 'Solo el Dueño o Programador tienen autorización para aprobar descuentos.');
      return;
    }

    const updated = {
      ...product,
      discountStatus: 'approved',
      discountApprovedBy: {
        uid: user?.uid || 'auth-local',
        name: user?.displayName || 'Dueño/Programador',
        role: userRole,
        date: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    };

    try {
      try {
        const prodRef = doc(db, 'products', product.id);
        await updateDoc(prodRef, {
          discountStatus: 'approved',
          discountApprovedBy: updated.discountApprovedBy,
        });
      } catch (e) {}

      // Actualizar localStorage
      let localItems: any[] = [];
      try {
        const stored = localStorage.getItem('sayta_custom_products');
        if (stored) localItems = JSON.parse(stored);
      } catch (e) {}
      const idx = localItems.findIndex((p) => p.id === product.id);
      if (idx >= 0) {
        localItems[idx] = updated;
        localStorage.setItem('sayta_custom_products', JSON.stringify(localItems));
      }

      window.dispatchEvent(new Event('sayta_products_updated'));

      setProducts((prev) => prev.map((p) => (p.id === product.id ? updated : p)));
      showNotification('success', `¡Descuento aprobado para "${product.name}"! Ahora está publicado en la tienda con descuento.`);
    } catch (err: any) {
      showNotification('error', 'Error al aprobar descuento: ' + err.message);
    }
  };

  // Rechazar descuento
  const handleRejectDiscount = async (product: any) => {
    if (!canAuthorizeDiscounts) {
      showNotification('error', 'Solo el Dueño o Programador pueden rechazar descuentos.');
      return;
    }

    const updated = {
      ...product,
      discountStatus: 'rejected',
      updatedAt: new Date().toISOString(),
    };

    try {
      try {
        const prodRef = doc(db, 'products', product.id);
        await updateDoc(prodRef, { discountStatus: 'rejected' });
      } catch (e) {}

      // Actualizar localStorage
      let localItems: any[] = [];
      try {
        const stored = localStorage.getItem('sayta_custom_products');
        if (stored) localItems = JSON.parse(stored);
      } catch (e) {}
      const idx = localItems.findIndex((p) => p.id === product.id);
      if (idx >= 0) {
        localItems[idx] = updated;
        localStorage.setItem('sayta_custom_products', JSON.stringify(localItems));
      }

      window.dispatchEvent(new Event('sayta_products_updated'));

      setProducts((prev) => prev.map((p) => (p.id === product.id ? updated : p)));
      showNotification('success', `Se ha rechazado la solicitud de descuento para "${product.name}".`);
    } catch (err: any) {
      showNotification('error', 'Error al rechazar descuento: ' + err.message);
    }
  };

  // Eliminar producto (soft delete si hay pedidos, hard delete si no)
  const handleDeleteProduct = async (product: any) => {
    if (!window.confirm(`¿Seguro que deseas eliminar "${product.name}" del inventario? Esta acción es irreversible si el producto no tiene pedidos asociados.`)) return;

    try {
      // Soft delete: marcar como eliminado en lugar de borrar físicamente
      const softDeleted = { ...product, status: 'inactive', isDeleted: true, deletedAt: new Date().toISOString(), deletedBy: user?.email || 'local' };
      try { await setDoc(doc(db, 'products', product.id), softDeleted, { merge: true }); } catch {}
      try { await deleteProductFromRtdb(product.id); } catch {}

      let localItems: any[] = [];
      try { localItems = JSON.parse(localStorage.getItem('sayta_custom_products') || '[]'); } catch {}
      localItems = localItems.filter((p) => p.id !== product.id);
      localStorage.setItem('sayta_custom_products', JSON.stringify(localItems));

      window.dispatchEvent(new Event('sayta_products_updated'));
      setProducts((prev) => prev.filter((p) => p.id !== product.id));

      // Auditoría de eliminación
      const auditEntry = { action: 'delete_product', productId: product.id, productName: product.name, by: user?.email || 'local', byName: user?.displayName || 'Empleado', role: userRole, timestamp: new Date().toISOString() };
      writeRtdb(`audit_logs/${Date.now()}`, auditEntry).catch(() => {});
      try {
        const auditLocal = JSON.parse(localStorage.getItem('sayta_audit_logs') || '[]');
        auditLocal.unshift(auditEntry);
        localStorage.setItem('sayta_audit_logs', JSON.stringify(auditLocal.slice(0, 200)));
      } catch {}

      showNotification('success', `"${product.name}" eliminado correctamente del inventario.`);
    } catch (err: any) {
      showNotification('error', 'Error eliminando producto.');
    }
  };

  // Crear nueva categoría
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newCategoryName.trim();
    if (!clean) return;

    if (!categories.includes(clean)) {
      const updated = [...categories, clean];
      setCategories(updated);
      setFormCategory(clean);

      // Persistir en Firebase RTDB mediante API
      try {
        await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: clean,
            icon: '📦',
            description: `Categoría creada para sucursal ${currentBranch?.name || ''}`,
          }),
        });
      } catch (err) {
        console.warn('Error guardando categoría en Firebase:', err);
      }

      try {
        localStorage.setItem('sayta_custom_categories', JSON.stringify(updated));
      } catch (e) {}

      showNotification('success', `¡Categoría "${clean}" guardada en Firebase correctamente!`);
    }

    setNewCategoryName('');
    setIsCategoryModalOpen(false);
  };

  // Filtrado de productos
  const pendingDiscountsCount = products.filter((p) => p.discountStatus === 'pending').length;

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      searchQuery === '' ||
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'Todos' ||
      p.category === selectedCategory ||
      p.categoryName === selectedCategory;

    const matchesDiscount =
      discountFilter === 'all' ||
      (discountFilter === 'pending' && p.discountStatus === 'pending') ||
      (discountFilter === 'discounted' && p.discountStatus === 'approved');

    return matchesSearch && matchesCategory && matchesDiscount;
  });

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Alerta flotante */}
      {notification && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-xl animate-fade-in ${
            notification.type === 'success'
              ? 'bg-[#30d158]/15 border border-[#30d158]/30 text-[#30d158]'
              : 'bg-[#ff453a]/15 border border-[#ff453a]/30 text-[#ff453a]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-white/60 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── BANNER SUPERIOR INFORMATIVO ─── */}
      <div className="p-6 rounded-3xl apple-card bg-gradient-to-r from-white/[0.04] via-white/[0.02] to-transparent border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#2997ff]">
              {t('prod_module_badge', 'Módulo de Inventario Unificado')}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.08] text-[#86868b]">
              {userRole === 'owner' ? t('role_owner', 'Dueño') : userRole === 'programmer' ? t('role_programmer', 'Programador') : t('role_employee', 'Empleado')}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
            {t('prod_management_title', 'Gestión de Productos y Descuentos')}
          </h1>
          <p className="text-xs text-[#86868b] mt-1 max-w-2xl leading-relaxed">
            {t('prod_management_desc', 'Dueño y empleados pueden subir productos con sus precios, descripciones y categorías. Los descuentos propuestos por empleados requieren autorización del Dueño o Programador antes de mostrarse en la tienda pública.')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="apple-pill-btn apple-btn-secondary px-4 py-2.5 text-xs font-semibold flex items-center gap-2"
          >
            <Layers className="w-4 h-4 text-[#bf5af2]" />
            <span>{t('prod_btn_new_category', 'Nueva Categoría')}</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="apple-pill-btn apple-btn-primary px-5 py-2.5 text-xs font-semibold flex items-center gap-2 shadow-lg shadow-[#0071e3]/25"
          >
            <Plus className="w-4 h-4" />
            <span>{t('prod_btn_add_product', 'Agregar Producto')}</span>
          </button>
        </div>
      </div>

      {/* ─── BANNER DE AUTORIZACIÓN DE DESCUENTOS PENDIENTES ─── */}
      {pendingDiscountsCount > 0 && (
        <div className="p-5 rounded-3xl bg-[#ffd60a]/10 border border-[#ffd60a]/25 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-[#ffd60a] animate-ping" />
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{t('prod_pending_discounts_title', 'Solicitudes de Descuento Pendientes de Autorización')}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#ffd60a] text-black font-extrabold">
                  {pendingDiscountsCount}
                </span>
              </h3>
            </div>
            {canAuthorizeDiscounts ? (
              <span className="text-xs text-[#ffd60a] font-medium hidden sm:inline">
                {t('prod_can_authorize', 'Tienes permisos para aprobar o rechazar estas rebajas')}
              </span>
            ) : (
              <span className="text-xs text-[#ffd60a] font-medium hidden sm:inline">
                {t('prod_waiting_review', 'En espera de revisión por el Dueño o Programador')}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {products
              .filter((p) => p.discountStatus === 'pending')
              .map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-black/60 border border-white/[0.1] space-y-3 flex flex-col justify-between"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={p.image || p.images?.[0]?.url || SAMPLE_IMAGES[0].url}
                      alt={p.name}
                      className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-white truncate">{p.name}</h4>
                      <p className="text-[10px] text-[#86868b] truncate">{p.categoryName || p.category}</p>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-xs font-mono line-through text-[#86868b]">
                          {formatCurrency(p.price, currentBranch?.currency || 'NIO')}
                        </span>
                        <span className="text-xs font-mono font-bold text-[#30d158]">
                          {formatCurrency(p.discountPrice || p.price, currentBranch?.currency || 'NIO')}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#ff3b30]/20 text-[#ff3b30]">
                          -{p.discountPercent}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {p.discountReason && (
                    <p className="text-[11px] text-[#ffd60a] bg-[#ffd60a]/10 px-2.5 py-1.5 rounded-xl border border-[#ffd60a]/20">
                      <strong>{t('prod_discount_reason', 'Motivo')}:</strong> {p.discountReason}
                    </p>
                  )}

                  <div className="text-[10px] text-[#86868b]">
                    {t('prod_proposed_by', 'Propuesto por')}: <strong className="text-white">{p.discountRequestedBy?.name || t('role_employee', 'Empleado')}</strong>
                  </div>

                  {/* Acciones de autorización */}
                  {canAuthorizeDiscounts ? (
                    <div className="flex gap-2 pt-1 border-t border-white/[0.08]">
                      <button
                        onClick={() => handleApproveDiscount(p)}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-[#30d158] hover:bg-[#30d158]/90 text-black text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{t('prod_btn_approve', 'Aprobar Descuento')}</span>
                      </button>
                      <button
                        onClick={() => handleRejectDiscount(p)}
                        className="py-1.5 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs text-[#ff453a] font-semibold transition-colors"
                      >
                        {t('prod_btn_reject', 'Rechazar')}
                      </button>
                    </div>
                  ) : (
                    <div className="p-2 rounded-xl bg-white/[0.04] text-[11px] text-center text-[#ffd60a] font-medium">
                      🟡 {t('prod_pending_badge', 'Pendiente de autorización')}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ─── BARRA DE BÚSQUEDA Y FILTROS ─── */}
      <div className="p-4 rounded-2xl bg-[#161617] border border-white/[0.08] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('prod_search_placeholder', 'Buscar por nombre, categoría o descripción...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/[0.1] text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro de categoría */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-black/40 border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2997ff]"
          >
            <option value="Todos">{t('prod_filter_all_cats', 'Todas las categorías')}</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Filtro de descuento */}
          <select
            value={discountFilter}
            onChange={(e) => setDiscountFilter(e.target.value as any)}
            className="bg-black/40 border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2997ff]"
          >
            <option value="all">{t('prod_filter_all_status', 'Todos los estados')}</option>
            <option value="discounted">{t('prod_filter_discounted', 'Con descuento activo')}</option>
            <option value="pending">{t('prod_filter_pending', 'Descuentos pendientes')}</option>
          </select>
        </div>
      </div>

      {/* ─── GRID DE PRODUCTOS ─── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 apple-card p-4 animate-pulse bg-white/[0.02]" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-16 text-center apple-card rounded-3xl border-white/[0.06] space-y-4">
          <Package className="w-10 h-10 text-[#86868b] mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-white">{t('prod_empty_title', 'No hay productos en esta vista')}</h3>
            <p className="text-xs text-[#86868b]">
              {t('prod_empty_desc', 'Puedes agregar nuevos productos con precios, descripciones y categorías usando el botón superior.')}
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="apple-pill-btn apple-btn-primary px-5 py-2.5 text-xs font-semibold inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>{t('prod_btn_add_first', 'Agregar Primer Producto')}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((p) => {
            const isDiscountApproved = p.discountStatus === 'approved';
            const isDiscountPending = p.discountStatus === 'pending';

            return (
              <div
                key={p.id}
                className="apple-card p-4 rounded-3xl border-white/[0.08] hover:border-white/[0.15] bg-[#161617]/80 flex flex-col justify-between transition-all group relative overflow-hidden"
              >
                <div className="space-y-3">
                  {/* Imagen y Badges */}
                  <div className="relative rounded-2xl overflow-hidden aspect-square bg-black/40 border border-white/[0.06]">
                    <img
                      src={p.image || p.images?.[0]?.url || SAMPLE_IMAGES[0].url}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Badge de Categoría */}
                    <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-medium text-white">
                      {p.categoryName || p.category || 'General'}
                    </div>

                    {/* Badge de Descuento si está aprobado */}
                    {isDiscountApproved && p.discountPercent && (
                      <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-[#ff3b30] text-white text-[10px] font-extrabold shadow-lg">
                        -{p.discountPercent}%
                      </div>
                    )}

                    {/* Badge de Descuento pendiente */}
                    {isDiscountPending && (
                      <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-[#ffd60a] text-black text-[10px] font-extrabold shadow-lg flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Pendiente</span>
                      </div>
                    )}
                  </div>

                  {/* Nombre y Tagline */}
                  <div>
                    <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-[#2997ff] transition-colors">
                      {p.name}
                    </h3>
                    <p className="text-[11px] text-[#86868b] line-clamp-2 mt-1">
                      {p.tagline || p.shortDescription || p.description || 'Sin descripción adicional.'}
                    </p>
                  </div>
                </div>

                {/* Precios, Stock y Acciones */}
                <div className="mt-4 pt-3 border-t border-white/[0.06] space-y-3">
                  <div className="flex items-baseline justify-between">
                    <div>
                      {isDiscountApproved && p.discountPrice ? (
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-[#86868b] line-through font-mono">
                            {formatCurrency(p.price, currentBranch?.currency || 'NIO')}
                          </span>
                          <div className="text-base font-bold text-[#30d158] font-mono">
                            {formatCurrency(p.discountPrice, currentBranch?.currency || 'NIO')}
                          </div>
                        </div>
                      ) : (
                        <div className="text-base font-bold text-white font-mono">
                          {formatCurrency(p.price, currentBranch?.currency || 'NIO')}
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-[#86868b] block">Stock</span>
                      <span
                        className={`text-xs font-semibold ${
                          (p.stock ?? 0) > 0 ? 'text-[#30d158]' : 'text-[#ff453a]'
                        }`}
                      >
                        {(p.stock ?? 0) > 0 ? `${p.stock} unid.` : 'Agotado'}
                      </span>
                    </div>
                  </div>

                  {/* Subido por */}
                  <div className="text-[10px] text-[#6e6e73] flex items-center justify-between">
                    <span>Subido por: {p.createdByName || 'Personal'}</span>
                    {p.status === 'active' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#30d158]" title="Activo en catálogo" />
                    )}
                  </div>

                  {/* Botones de acción */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="flex-1 min-w-0 py-1.5 px-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-white flex items-center justify-center gap-1 transition-colors border border-white/[0.06]"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-[#2997ff] shrink-0" />
                      <span className="truncate">Editar</span>
                    </button>
                    <button
                      onClick={() => handleViewHistory(p)}
                      className="p-2 rounded-xl bg-white/[0.04] hover:bg-purple-500/20 text-[#86868b] hover:text-purple-300 transition-colors border border-white/[0.06]"
                      title="Historial de precios"
                    >
                      <History className="w-3.5 h-3.5" />
                    </button>
                    {(p.compareAtPrice || p.precioOriginal) && p.discountStatus !== 'none' && (
                      <button
                        onClick={() => handleRestoreOriginalPrice(p)}
                        className="p-2 rounded-xl bg-white/[0.04] hover:bg-[#ffd60a]/20 text-[#86868b] hover:text-[#ffd60a] transition-colors border border-white/[0.06]"
                        title="Restaurar precio original"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteProduct(p)}
                      className="p-2 rounded-xl bg-white/[0.04] hover:bg-[#ff453a]/20 text-[#86868b] hover:text-[#ff453a] transition-colors border border-white/[0.06]"
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── MODAL CREAR / EDITAR PRODUCTO ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto apple-card p-6 sm:p-8 bg-[#161617] border-white/[0.1] rounded-3xl shadow-2xl space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  {editingProduct ? 'Editar Producto' : 'Subir Nuevo Producto'}
                </h3>
                <p className="text-xs text-[#86868b] mt-0.5">
                  Ingresa el nombre, precio en Córdobas (C$), categoría y descripción para el catálogo.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full bg-white/[0.04] hover:bg-white/[0.1] text-[#86868b] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-5">
              {/* Nombre del Producto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white block">Nombre del Producto *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Taladro Percutor 21V con Maletín y Brocas"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-black/50 border border-white/[0.1] rounded-2xl px-4 py-3 text-sm text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white block flex items-center gap-1.5">
                    <Barcode className="w-3.5 h-3.5 text-[#86868b]" />
                    Código SKU / Referencia
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. TAL-21V-001"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full bg-black/50 border border-white/[0.1] rounded-2xl px-4 py-3 text-sm text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff] font-mono"
                  />
                  <p className="text-[10px] text-[#6e6e73]">Identificador único para detectar duplicados con precisión</p>
                </div>
              </div>
              {/* Alerta de duplicado detectado (en tiempo real) */}
              {duplicateDetected && !duplicateModalMode && (
                <div className="p-3 rounded-xl bg-[#ffd60a]/10 border border-[#ffd60a]/30 flex items-start gap-2.5 animate-fade-in">
                  <TriangleAlert className="w-4 h-4 text-[#ffd60a] shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-[#ffd60a]">Producto similar detectado: "{duplicateDetected.name}"</p>
                    <p className="text-[#86868b] mt-0.5">
                      Precio existente: <span className="text-white font-mono">{formatCurrency(duplicateDetected.compareAtPrice || duplicateDetected.price, 'NIO')}</span>
                      {autoDiscountInfo && (
                        <span className="ml-2 text-[#30d158] font-semibold">→ Se aplicará -{autoDiscountInfo.porcentaje}% al guardar</span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Categoría y Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-white">Categoría *</label>
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(true)}
                      className="text-[11px] text-[#2997ff] hover:underline"
                    >
                      + Crear nueva
                    </button>
                  </div>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-black/50 border border-white/[0.1] rounded-2xl px-3.5 py-3 text-xs text-white focus:outline-none focus:border-[#2997ff]"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white block">Stock Inicial (Unidades) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="10"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-black/50 border border-white/[0.1] rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#2997ff]"
                  />
                </div>
              </div>

              {/* Precio Regular en Córdobas */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white block">
                  Precio Regular en Córdobas (C$ NIO) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#30d158]">
                    C$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="850.00"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full pl-12 pr-4 py-3 bg-black/50 border border-white/[0.1] rounded-2xl text-sm font-mono text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff]"
                  />
                </div>
              </div>

              {/* ─── SECCIÓN DE DESCUENTO CON AUTORIZACIÓN ─── */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-[#ffd60a]" />
                    <span className="text-xs font-bold text-white">
                      ¿Deseas aplicar una oferta o descuento a este producto?
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={hasDiscount}
                    onChange={(e) => setHasDiscount(e.target.checked)}
                    className="w-4 h-4 accent-[#30d158] cursor-pointer rounded"
                  />
                </div>

                {hasDiscount && (
                  <div className="space-y-4 pt-2 border-t border-white/[0.06] animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-[#86868b]">
                          Porcentaje de Rebaja (% Descuento)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="5"
                            max="70"
                            step="5"
                            value={discountPercent}
                            onChange={(e) => setDiscountPercent(Number(e.target.value))}
                            className="flex-1 accent-[#30d158]"
                          />
                          <span className="text-sm font-bold text-[#ffd60a] font-mono w-12 text-right">
                            {discountPercent}%
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-[#86868b]">Precio Final con Rebaja</label>
                        <div className="text-sm font-bold text-[#30d158] font-mono py-2.5 px-3 rounded-xl bg-black/40 border border-white/[0.08]">
                          {formPrice !== ''
                            ? formatCurrency(
                                Math.round(Number(formPrice) * (1 - discountPercent / 100)),
                                currentBranch?.currency || 'NIO'
                              )
                            : 'C$ 0.00'}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#86868b]">
                        Motivo / Justificación del Descuento
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Promoción de fin de semana, liquidación de lote, oferta de verano"
                        value={discountReason}
                        onChange={(e) => setDiscountReason(e.target.value)}
                        className="w-full bg-black/50 border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#ffd60a]"
                      />
                    </div>

                    {/* Mensaje de Regla de Autorización */}
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-[#2997ff] shrink-0 mt-0.5" />
                      {canAuthorizeDiscounts ? (
                        <span className="text-[#86868b]">
                          🟢 <strong className="text-white">Autorización Automática:</strong> Al ser Dueño o Programador, el descuento quedará activo inmediatamente en la tienda pública.
                        </span>
                      ) : (
                        <span className="text-[#86868b]">
                          🟡 <strong className="text-white">Requiere Autorización:</strong> Al ser colaborador/empleado, el producto se creará al precio normal y el descuento entrará en espera de aprobación del Dueño o Programador antes de mostrarse en la web pública.
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Tagline / Resumen breve */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white block">
                  Descripción Corta / Características Clave
                </label>
                <input
                  type="text"
                  placeholder="Ej. Batería de litio recargable, luz LED de trabajo y 2 velocidades"
                  value={formTagline}
                  onChange={(e) => setFormTagline(e.target.value)}
                  className="w-full bg-black/50 border border-white/[0.1] rounded-2xl px-4 py-3 text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff]"
                />
              </div>

              {/* Descripción Detallada */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white block">Descripción Detallada</label>
                <textarea
                  rows={3}
                  placeholder="Especificaciones completas del producto, garantía, instrucciones de uso y recomendaciones..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-black/50 border border-white/[0.1] rounded-2xl p-4 text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff]"
                />
              </div>

              {/* Imagen del Producto: Subida Binaria / Data URL */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white block">
                    Fotografía del Producto (Cadena Binaria / Data URL)
                  </label>
                  {isBinaryDataUrl(formImage) && imageBinarySize && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#30d158]/20 text-[#30d158] border border-[#30d158]/30 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Binaria Optimizada: {imageBinarySize} KB
                    </span>
                  )}
                </div>

                {/* Input de archivo oculto */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* Vista previa y zona de subida */}
                {formImage ? (
                  <div className="p-3 rounded-2xl bg-black/40 border border-white/[0.1] flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-black/60 border border-white/[0.1] shrink-0">
                      <img
                        src={formImage}
                        alt="Vista previa"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 space-y-2 text-center sm:text-left w-full">
                      <div className="text-xs font-medium text-white flex items-center justify-center sm:justify-start gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-[#30d158]" />
                        <span>Foto cargada para Firebase</span>
                      </div>
                      <p className="text-[11px] text-[#86868b] leading-tight">
                        {isBinaryDataUrl(formImage)
                          ? 'Se enviará como cadena binaria Data URL optimizada a Firebase sin pérdidas.'
                          : 'Imagen seleccionada de la biblioteca o URL externa.'}
                      </p>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isProcessingImage}
                          className="px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-[11px] font-semibold text-white flex items-center gap-1.5 transition-colors"
                        >
                          <Camera className="w-3.5 h-3.5 text-[#2997ff]" />
                          <span>Cambiar Foto</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFormImage('');
                            setImageBinarySize(null);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#ff453a]/10 hover:bg-[#ff453a]/20 text-[11px] font-semibold text-[#ff453a] transition-colors"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer border-2 border-dashed border-white/[0.15] hover:border-[#2997ff]/60 rounded-2xl p-6 text-center bg-black/30 hover:bg-white/[0.02] transition-all group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#2997ff]/10 text-[#2997ff] flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                      {isProcessingImage ? (
                        <RefreshCw className="w-6 h-6 animate-spin text-[#2997ff]" />
                      ) : (
                        <Upload className="w-6 h-6" />
                      )}
                    </div>
                    <p className="text-xs font-semibold text-white">
                      {isProcessingImage
                        ? 'Convirtiendo imagen a cadena binaria...'
                        : 'Toca aquí para subir foto desde tu teléfono o PC'}
                    </p>
                    <p className="text-[11px] text-[#86868b] mt-1">
                      Soporta Cámara, Galería, JPG, PNG o WebP. Se convertirá a Data URL binaria ultraligera.
                    </p>
                  </div>
                )}

                {/* Alternativas: Fotos sugeridas o URL manual */}
                <details className="text-xs group">
                  <summary className="text-[#86868b] hover:text-white cursor-pointer py-1 list-none flex items-center gap-1">
                    <span className="text-[11px]">▶ Opciones avanzadas (Fotos de muestra o URL)</span>
                  </summary>
                  <div className="mt-2 space-y-3 p-3 rounded-xl bg-black/30 border border-white/[0.06]">
                    <div className="space-y-1">
                      <label className="text-[11px] text-[#86868b]">O ingresa una URL manualmente:</label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={isBinaryDataUrl(formImage) ? '' : formImage}
                        onChange={(e) => {
                          setFormImage(e.target.value);
                          setImageBinarySize(null);
                        }}
                        className="w-full bg-black/50 border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff]"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-[#86868b] block mb-1.5">O elige una foto sugerida:</span>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {SAMPLE_IMAGES.map((img) => (
                          <button
                            key={img.label}
                            type="button"
                            onClick={() => {
                              setFormImage(img.url);
                              setImageBinarySize(null);
                            }}
                            className={`p-1.5 rounded-xl border text-left transition-all ${
                              formImage === img.url
                                ? 'border-[#2997ff] bg-[#2997ff]/20'
                                : 'border-white/[0.08] hover:border-white/[0.2] bg-black/30'
                            }`}
                          >
                            <img src={img.url} alt={img.label} className="w-full h-12 object-cover rounded-lg mb-1" />
                            <span className="text-[10px] text-white block truncate text-center">{img.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </details>
              </div>

              {/* Botón Guardar */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-[#86868b] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="apple-pill-btn apple-btn-primary px-6 py-2.5 text-xs font-semibold shadow-lg shadow-[#0071e3]/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {editingProduct ? 'Guardar Cambios' : 'Publicar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL CONFIRMACIÓN DUPLICADO: PRECIO MENOR → DESCUENTO AUTOMÁTICO ─── */}
      {duplicateModalMode === 'lower_price' && duplicateDetected && autoDiscountInfo && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md apple-card p-6 bg-[#161617] border-[#ffd60a]/30 rounded-3xl shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#ffd60a]/15 flex items-center justify-center shrink-0">
                <Percent className="w-6 h-6 text-[#ffd60a]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Descuento Automático Detectado</h3>
                <p className="text-xs text-[#86868b] mt-0.5">Este producto ya existe en el inventario</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-black/50 border border-white/[0.08] space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={duplicateDetected.image || duplicateDetected.images?.[0]?.url || SAMPLE_IMAGES[0].url}
                  alt={duplicateDetected.name}
                  className="w-14 h-14 rounded-xl object-cover border border-white/10"
                />
                <div>
                  <p className="text-sm font-bold text-white">{duplicateDetected.name}</p>
                  <p className="text-xs text-[#86868b]">{duplicateDetected.categoryName || duplicateDetected.category}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-white/[0.03]">
                  <div className="text-[#86868b] text-[10px]">Precio original</div>
                  <div className="font-mono font-bold text-white mt-0.5">{formatCurrency(duplicateDetected.compareAtPrice || duplicateDetected.price, 'NIO')}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03]">
                  <div className="text-[#86868b] text-[10px]">Precio nuevo</div>
                  <div className="font-mono font-bold text-[#30d158] mt-0.5">{formatCurrency(pendingSavePayload?.priceNum, 'NIO')}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#ff3b30]/10 border border-[#ff3b30]/20">
                  <div className="text-[#86868b] text-[10px]">Descuento</div>
                  <div className="font-bold text-[#ff3b30] text-base mt-0.5">-{autoDiscountInfo.porcentaje}%</div>
                </div>
              </div>
              <p className="text-xs text-[#86868b] leading-relaxed">
                El sistema actualizará el precio de <strong className="text-white">"{duplicateDetected.name}"</strong> y conservará el precio original como referencia. Se guardará un registro en el historial de precios.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setDuplicateModalMode(null); setDuplicateDetected(null); setPendingSavePayload(null); }}
                className="flex-1 py-2.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-[#86868b] hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveAsNew}
                className="flex-1 py-2.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-white transition-colors border border-white/[0.08]"
              >
                Crear como Nuevo
              </button>
              <button
                onClick={handleConfirmAutoDiscount}
                disabled={isSaving}
                className="flex-1 py-2.5 rounded-2xl bg-[#ffd60a] hover:bg-[#ffd60a]/90 text-black text-xs font-bold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Aplicar -{autoDiscountInfo.porcentaje}%
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL ADVERTENCIA DUPLICADO: PRECIO MAYOR O IGUAL ─── */}
      {duplicateModalMode === 'higher_price' && duplicateDetected && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md apple-card p-6 bg-[#161617] border-[#2997ff]/30 rounded-3xl shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#2997ff]/15 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 text-[#2997ff]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Producto ya registrado</h3>
                <p className="text-xs text-[#86868b] mt-0.5">¿Qué deseas hacer?</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-black/50 border border-white/[0.08] space-y-2">
              <p className="text-xs text-[#86868b]">
                Ya existe <strong className="text-white">"{duplicateDetected.name}"</strong> con precio{' '}
                <span className="font-mono text-white">{formatCurrency(duplicateDetected.compareAtPrice || duplicateDetected.price, 'NIO')}</span>.
                El precio nuevo <span className="font-mono text-[#ffd60a]">{formatCurrency(pendingSavePayload?.priceNum, 'NIO')}</span> es mayor o igual.
              </p>
              <p className="text-xs text-[#86868b]">Si actualizas el precio, se registrará el cambio en el historial y se eliminará cualquier descuento previo.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setDuplicateModalMode(null); setDuplicateDetected(null); setPendingSavePayload(null); }}
                className="flex-1 py-2.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-[#86868b] hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveAsNew}
                className="flex-1 py-2.5 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-xs font-semibold text-white hover:bg-white/[0.1]"
              >
                Crear como Nuevo
              </button>
              <button
                onClick={handleConfirmPriceUpdate}
                disabled={isSaving}
                className="flex-1 py-2.5 rounded-2xl bg-[#2997ff] hover:bg-[#2997ff]/90 text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Actualizar Precio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL HISTORIAL DE PRECIOS ─── */}
      {priceHistoryModal?.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg apple-card p-6 bg-[#161617] border-white/[0.1] rounded-3xl shadow-2xl space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2.5">
                <History className="w-4 h-4 text-purple-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Historial de Precios</h3>
                  <p className="text-[11px] text-[#86868b]">{priceHistoryModal.productName}</p>
                </div>
              </div>
              <button onClick={() => setPriceHistoryModal(null)} className="p-1.5 rounded-full bg-white/[0.04] text-[#86868b] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 space-y-2 pr-1">
              {loadingHistory ? (
                <div className="text-center py-8 text-[#86868b] text-xs">Cargando historial...</div>
              ) : priceHistoryModal.records.length === 0 ? (
                <div className="text-center py-8">
                  <History className="w-8 h-8 text-[#86868b] mx-auto mb-2" />
                  <p className="text-xs text-[#86868b]">Sin historial de cambios de precio registrado aún.</p>
                </div>
              ) : (
                priceHistoryModal.records.map((record, i) => (
                  <div key={record.id || i} className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        record.tipo === 'descuento_automatico' ? 'bg-[#ff3b30]/15 text-[#ff3b30]' :
                        record.tipo === 'restauracion' ? 'bg-[#30d158]/15 text-[#30d158]' :
                        record.tipo === 'creacion' ? 'bg-[#2997ff]/15 text-[#2997ff]' :
                        'bg-white/[0.08] text-white'
                      }`}>
                        {record.tipo === 'descuento_automatico' ? '🔻 Descuento Auto' :
                         record.tipo === 'restauracion' ? '🔄 Restaurado' :
                         record.tipo === 'creacion' ? '🆕 Creación' : '✏️ Ajuste'}
                      </span>
                      <span className="text-[10px] text-[#6e6e73]">{new Date(record.fecha).toLocaleString('es-NI')}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-mono text-[#86868b] line-through">{formatCurrency(record.precioAnterior, 'NIO')}</span>
                      <ArrowRight className="w-3 h-3 text-[#86868b]" />
                      <span className="font-mono font-bold text-white">{formatCurrency(record.precioNuevo, 'NIO')}</span>
                      {record.porcentajeCambio !== 0 && (
                        <span className={`font-bold ${record.porcentajeCambio < 0 ? 'text-[#30d158]' : 'text-[#ff453a]'}`}>
                          {record.porcentajeCambio > 0 ? '+' : ''}{record.porcentajeCambio}%
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[#6e6e73]">Por: <strong className="text-white">{record.empleadoNombre}</strong>{record.motivo && ` · ${record.motivo}`}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL CREAR NUEVA CATEGORÍA ─── */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div
            className="relative w-full max-w-md apple-card p-6 bg-[#161617] border-white/[0.1] rounded-3xl shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-lg font-bold text-white">Crear Nueva Categoría</h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1.5 rounded-full bg-white/[0.04] text-[#86868b] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white block">Nombre de la Categoría</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Joyería & Relojes, Mascotas, Juguetería..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full bg-black/50 border border-white/[0.1] rounded-2xl px-4 py-3 text-sm text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff]"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="w-full apple-pill-btn apple-btn-primary py-3 text-xs font-semibold shadow-lg shadow-[#0071e3]/20"
              >
                Crear y Asignar Categoría
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
