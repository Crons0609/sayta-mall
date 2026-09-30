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

export function BranchProvider({ children }: { children: ReactNode }) {
  const [branches, setBranches] = useState<BranchDocument[]>([]);
  const [currentBranchId, setCurrentBranchIdState] = useState<string | null>(null);
  const [currentBranch, setCurrentBranch] = useState<BranchDocument | null>(null);
  const [loading, setLoading] = useState(true);

  // Suscripción en tiempo real a las sucursales públicas activas en Firestore
  useEffect(() => {
    try {
      const branchesRef = collection(db, 'branches');
      // Filtramos por active == true
      const q = query(branchesRef, where('active', '==', true));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const loadedBranches: BranchDocument[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            // Solo incluimos sucursales públicas si está definido, o si active es true
            if (data.isPublic !== false) {
              loadedBranches.push({ id: doc.id, ...data } as BranchDocument);
            }
          });

          setBranches(loadedBranches);

          if (loadedBranches.length === 0) {
            fetch('/api/branches')
              .then((r) => r.json())
              .then((data) => {
                if (data.branches && data.branches.length > 0) {
                  setBranches(data.branches);
                  setCurrentBranch(data.branches[0]);
                  setCurrentBranchIdState(data.branches[0].id);
                } else {
                  setCurrentBranch(null);
                  setCurrentBranchIdState(null);
                }
              })
              .catch(() => {
                setCurrentBranch(null);
                setCurrentBranchIdState(null);
              });
          } else if (loadedBranches.length === 1) {
            setCurrentBranch(loadedBranches[0]);
            setCurrentBranchIdState(loadedBranches[0].id);
          } else {
            const saved = localStorage.getItem(BRANCH_STORAGE_KEY);
            const found = loadedBranches.find((b) => b.id === saved) || loadedBranches[0];
            setCurrentBranch(found);
            setCurrentBranchIdState(found.id);
          }

          setLoading(false);
        },
        (error) => {
          console.warn('[BranchProvider] Escucha de sucursales:', error.message);
          fetch('/api/branches')
            .then((r) => r.json())
            .then((data) => {
              if (data.branches && data.branches.length > 0) {
                setBranches(data.branches);
                setCurrentBranch(data.branches[0]);
                setCurrentBranchIdState(data.branches[0].id);
              } else {
                setBranches([]);
                setCurrentBranch(null);
                setCurrentBranchIdState(null);
              }
            })
            .catch(() => {
              setBranches([]);
              setCurrentBranch(null);
              setCurrentBranchIdState(null);
            })
            .finally(() => setLoading(false));
        }
      );

      return () => unsubscribe();
    } catch (e) {
      fetch('/api/branches')
        .then((r) => r.json())
        .then((data) => {
          if (data.branches && data.branches.length > 0) {
            setBranches(data.branches);
            setCurrentBranch(data.branches[0]);
            setCurrentBranchIdState(data.branches[0].id);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, []);

  const setBranchId = (id: string) => {
    localStorage.setItem(BRANCH_STORAGE_KEY, id);
    setCurrentBranchIdState(id);
    const found = branches.find((b) => b.id === id);
    if (found) setCurrentBranch(found);
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
