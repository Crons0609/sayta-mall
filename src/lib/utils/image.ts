// src/lib/utils/image.ts
// Procesamiento de imágenes en formato binario y Data URL para subidas de empleados a Firebase.

import imageCompression from 'browser-image-compression';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/client';
import { LIMITS } from '@/lib/constants';

export interface CompressedImage {
  file: File;
  previewUrl: string;
  originalSizeKB: number;
  compressedSizeKB: number;
}

/**
 * Convierte cualquier archivo de imagen (File) a una cadena binaria Data URL (Base64)
 * optimizada mediante HTML5 Canvas, reduciendo peso y dimensiones para transmisión ultrarrápida.
 */
export async function convertFileToBinaryDataUrl(
  file: File,
  maxWidth = 1000,
  maxHeight = 1000,
  quality = 0.82
): Promise<{ dataUrl: string; sizeKB: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Error leyendo el archivo de imagen.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('No se pudo procesar el formato de la imagen.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const rawDataUrl = e.target?.result as string;
          resolve({
            dataUrl: rawDataUrl,
            sizeKB: Math.round((rawDataUrl.length * 3) / 4 / 1024),
            width: img.width,
            height: img.height,
          });
          return;
        }

        // Fondo transparente o blanco si fuera necesario
        ctx.drawImage(img, 0, 0, width, height);

        let dataUrl = canvas.toDataURL('image/webp', quality);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        const sizeKB = Math.round((dataUrl.length * 3) / 4 / 1024);
        resolve({
          dataUrl,
          sizeKB,
          width,
          height,
        });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Sube una imagen en cadena binaria / Data URL a Firebase Storage.
 * Retorna la URL pública de Storage si está disponible, o la Data URL binaria directa.
 */
export async function uploadBinaryImageToFirebase(
  dataUrl: string,
  storagePath: string
): Promise<{ url: string; isStorage: boolean }> {
  try {
    if (!storage || !storagePath) {
      return { url: dataUrl, isStorage: false };
    }

    const storageRef = ref(storage, storagePath);
    const mimeMatch = dataUrl.match(/^data:([^;]+);base64,/);
    const contentType = mimeMatch ? mimeMatch[1] : 'image/webp';

    await uploadString(storageRef, dataUrl, 'data_url', {
      contentType,
    });

    const downloadUrl = await getDownloadURL(storageRef);
    return { url: downloadUrl, isStorage: true };
  } catch (error) {
    console.warn('[Firebase Storage] Subida a bucket omitida (usando cadena binaria Data URL directa):', error);
    return { url: dataUrl, isStorage: false };
  }
}

/**
 * Verifica si una cadena es una Data URL binaria
 */
export function isBinaryDataUrl(str?: string | null): boolean {
  if (!str) return false;
  return str.startsWith('data:image/');
}

/**
 * Comprime una imagen para subida a Storage.
 * Máx: 800KB y 1200px de ancho. Convierte a WebP si el navegador lo soporta.
 */
export async function compressImage(file: File): Promise<CompressedImage> {
  const originalSizeKB = file.size / 1024;

  const options = {
    maxSizeMB: LIMITS.MAX_COMPRESSED_SIZE_KB / 1024, // 0.8 MB
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.85,
    onProgress: undefined,
  };

  const compressedFile = await imageCompression(file, options);
  const compressedSizeKB = compressedFile.size / 1024;

  const previewUrl = await imageCompression.getDataUrlFromFile(compressedFile);

  return {
    file: compressedFile,
    previewUrl,
    originalSizeKB,
    compressedSizeKB,
  };
}

/**
 * Valida que el archivo sea una imagen válida y no exceda el tamaño máximo.
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Solo se permiten imágenes JPG, PNG, WebP o GIF.' };
  }

  const sizeInMB = file.size / (1024 * 1024);
  if (sizeInMB > LIMITS.MAX_IMAGE_SIZE_MB) {
    return {
      valid: false,
      error: `La imagen no puede superar ${LIMITS.MAX_IMAGE_SIZE_MB}MB. Tamaño actual: ${sizeInMB.toFixed(1)}MB`,
    };
  }

  return { valid: true };
}

/**
 * Genera una ruta única para la imagen en Firebase Storage.
 * Formato: products/{branchId}/{productId}/{timestamp}_{filename}
 */
export function generateStoragePath(
  folder: 'products' | 'branches' | 'categories' | 'chat',
  ...segments: string[]
): string {
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.webp`;
  return [folder, ...segments, filename].join('/');
}
