// src/components/ui/BranchModal.tsx
'use client';

import React from 'react';
import { useBranch } from '@/providers/BranchProvider';
import { MapPin, X, Clock, Phone, Check, Navigation, Store } from 'lucide-react';

interface BranchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BranchModal({ isOpen, onClose }: BranchModalProps) {
  const { branches, currentBranchId, setBranchId, branchCount } = useBranch();

  if (!isOpen || branchCount <= 1) return null;

  const handleSelect = (id: string) => {
    setBranchId(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-16 flex justify-center items-center">
      {/* Fondo difuminado */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-xl transition-opacity animate-fade-in"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl bg-[#161617] border border-white/[0.12] rounded-3xl shadow-2xl overflow-hidden backdrop-blur-2xl z-10 animate-fade-in">
        {/* Cabecera */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#30d158]/15 border border-[#30d158]/30 text-[#30d158]">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white tracking-tight">
                Selecciona tu Sucursal
              </h3>
              <p className="text-xs text-[#86868b]">
                Elige la tienda más cercana para ver inventario y entregas locales
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#86868b] hover:text-white hover:bg-white/[0.08] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de Sucursales Reales */}
        <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
          {branches.map((branch) => {
            const isSelected = branch.id === currentBranchId;

            return (
              <div
                key={branch.id}
                onClick={() => handleSelect(branch.id)}
                className={`group p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'bg-[#30d158]/10 border-[#30d158]/40 shadow-lg shadow-[#30d158]/10'
                    : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12]'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#30d158] text-black text-[10px] font-bold">
                    <Check className="w-3 h-3" /> Activa
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 p-2 rounded-xl border ${
                      isSelected
                        ? 'bg-[#30d158]/20 border-[#30d158]/40 text-[#30d158]'
                        : 'bg-white/[0.05] border-white/[0.08] text-[#86868b] group-hover:text-white'
                    }`}
                  >
                    <Navigation className="w-4 h-4" />
                  </div>
                  <div className="flex-1 pr-12">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-white group-hover:text-[#30d158] transition-colors">
                        {branch.name}
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.06] text-[#86868b] font-medium">
                        {branch.city || 'Principal'}
                      </span>
                    </div>

                    <p className="text-xs text-[#86868b] mt-1">{branch.address}</p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5 text-[11px] text-[#86868b]">
                      {branch.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-[#30d158]" /> {branch.phone}
                        </span>
                      )}
                      <span className="text-[#30d158] font-medium">
                        Moneda: {branch.currency || 'NIO'} ({branch.currencySymbol || 'C$'})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white/[0.02] border-t border-white/[0.06] text-center text-xs text-[#86868b]">
          📍 El catálogo se adapta automáticamente al stock disponible en tu sucursal.
        </div>
      </div>
    </div>
  );
}
