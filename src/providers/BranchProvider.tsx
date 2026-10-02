// src/providers/BranchProvider.tsx
'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { BranchDocument } from '@/types/branch.types';

interface BranchContextValue {
  branches: BranchDocument[];
  currentBranch: BranchDocument | null;
  currentBranchId: string | null;
  loading: boolean;
  branchCount: number;
  setBranchId: (id: string) => void;
}

const BranchContext = createContext<BranchContextValue | null>(null);
const BRANCH_STORAGE_KEY = 'sayta_current_branch_id_v2';
const CACHE_BRANCHES_KEY = 'sayta_cached_branches_v2';
const CACHE_CURRENT_BRANCH_KEY = 'sayta_cached_current_branch_v2';

export function BranchProvider({ children }: { children: ReactNode }) {
  const [branches, setBranches] = useState<BranchDocument[]>([]);
  const [currentBranchId, setCurrentBranchIdState] = useState<string | null>(null);
  const [currentBranch, setCurrentBranch] = useState<BranchDocument | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Hidratación instantánea desde caché local para mostrar sucursales en 0ms
  useEffect(() => {
    try {
      const cachedRaw = localStorage.getItem(CACHE_BRANCHES_KEY);
      const savedBranchId = localStorage.getItem(BRANCH_STORAGE_KEY);
      if (cachedRaw) {
        const parsed: BranchDocument[] = JSON.parse(cachedRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setBranches(parsed);
          const found = (savedBranchId && parsed.find((b) => b.id === savedBranchId)) || parsed[0];
          setCurrentBranch(found);
          setCurrentBranchIdState(found.id);
          setLoading(false);
        }
      }
    } catch {}
  }, []);

  // Función auxiliar para actualizar y persistir en caché
  const updateBranchesData = (loadedBranches: BranchDocument[]) => {
    if (!Array.isArray(loadedBranches)) return;
    setBranches(loadedBranches);
    try {
      localStorage.setItem(CACHE_BRANCHES_KEY, JSON.stringify(loadedBranches));
    } catch {}

    if (loadedBranches.length === 0) {
      setCurrentBranch(null);
      setCurrentBranchIdState(null);
    } else {
      const saved = typeof window !== 'undefined' ? localStorage.getItem(BRANCH_STORAGE_KEY) : null;
      const found = (saved && loadedBranches.find((b) => b.id === saved)) || loadedBranches[0];
      setCurrentBranch(found);
      setCurrentBranchIdState(found.id);
      try {
        localStorage.setItem(BRANCH_STORAGE_KEY, found.id);
        localStorage.setItem(CACHE_CURRENT_BRANCH_KEY, JSON.stringify(found));
      } catch {}
    }
    setLoading(false);
  };

  // 2. Sincronización rápida vía API y tiempo real vía Firestore
  useEffect(() => {
    let isMounted = true;

    // A. Llamada inmediata a la API de sucursales (consulta RTDB + Firestore en el backend sin delay)
    fetch('/api/branches')
      .then((r) => r.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && Array.isArray(data.branches) && data.branches.length > 0) {
          updateBranchesData(data.branches);
        }
      })
      .catch((e) => {
        console.warn('[BranchProvider] Fetch API branches:', e);
      });

    // B. Listener en tiempo real de Firestore para actualizaciones en vivo
    try {
      const branchesRef = collection(db, 'branches');
      const q = query(branchesRef, where('active', '==', true));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!isMounted) return;
          const loaded: BranchDocument[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.isPublic !== false) {
              loaded.push({ id: doc.id, ...data } as BranchDocument);
            }
          });

          if (loaded.length > 0) {
            updateBranchesData(loaded);
          } else {
            // Si Firestore aún no tiene o está vacío, asegurarse con la API
            fetch('/api/branches')
              .then((r) => r.json())
              .then((d) => {
                if (!isMounted) return;
                if (d.success && Array.isArray(d.branches) && d.branches.length > 0) {
                  updateBranchesData(d.branches);
                } else {
                  setLoading(false);
                }
              })
              .catch(() => setLoading(false));
          }
        },
        (error) => {
          if (!isMounted) return;
          console.warn('[BranchProvider] Firestore snapshot fallback:', error.message);
          // Si las reglas de Firestore restringen la lectura directa del cliente, la API de backend resuelve
          fetch('/api/branches')
            .then((r) => r.json())
            .then((d) => {
              if (!isMounted) return;
              if (d.success && Array.isArray(d.branches)) {
                updateBranchesData(d.branches);
              }
            })
            .catch(() => {})
            .finally(() => {
              if (isMounted) setLoading(false);
            });
        }
      );

      return () => {
        isMounted = false;
        unsubscribe();
      };
    } catch (e) {
      return () => {
        isMounted = false;
      };
    }
  }, []);

  const setBranchId = (id: string) => {
    localStorage.setItem(BRANCH_STORAGE_KEY, id);
    setCurrentBranchIdState(id);
    const found = branches.find((b) => b.id === id);
    if (found) {
      setCurrentBranch(found);
      try {
        localStorage.setItem(CACHE_CURRENT_BRANCH_KEY, JSON.stringify(found));
      } catch {}
    }
  };

  return (
    <BranchContext.Provider
      value={{
        branches,
        currentBranch,
        currentBranchId,
        loading,
        branchCount: branches.length,
        setBranchId,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch(): BranchContextValue {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranch debe usarse dentro de <BranchProvider>');
  }
  return context;
}
