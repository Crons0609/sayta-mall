// src/components/delivery/DeliveryLoginForm.tsx
// Formulario inicial: el delivery escribe su nombre y elige su empresa.
'use client';

import React, { useState, useEffect } from 'react';
import { User, Building2, Loader2, ArrowRight } from 'lucide-react';

interface Props {
  onLogin: (nombre: string, empresaDeliveryId: string) => Promise<void>;
}

export function DeliveryLoginForm({ onLogin }: Props) {
  const [nombre, setNombre] = useState('');
  const [empresaId, setEmpresaId] = useState('');
  const [empresas, setEmpresas] = useState<{ id: string; nombre: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/delivery-companies?onlyActive=true')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.companies) {
          setEmpresas(d.companies);
          if (d.companies.length === 1) setEmpresaId(d.companies[0].id);
        }
      })
      .catch(() => setEmpresas([]))
      .finally(() => setLoadingEmpresas(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!nombre.trim()) {
      setError('Por favor escribe tu nombre');
      return;
    }
    if (!empresaId) {
      setError('Selecciona tu empresa de delivery');
      return;
    }
    setLoading(true);
    try {
      await onLogin(nombre.trim(), empresaId);
    } catch (err: any) {
      setError(err.message || 'Error al conectar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-2">
          Tu Nombre Completo
        </label>
        <div className="relative">
          <User className="w-4 h-4 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Carlos Gómez"
            className="w-full pl-10 pr-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-2xl text-sm text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#30d158] transition-colors"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-2">
          Empresa de Delivery
        </label>
        <div className="relative">
          <Building2 className="w-4 h-4 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            required
            value={empresaId}
            onChange={(e) => setEmpresaId(e.target.value)}
            disabled={loadingEmpresas}
            className="w-full pl-10 pr-4 py-3 bg-[#1c1c1e] border border-white/[0.1] rounded-2xl text-sm text-white focus:outline-none focus:border-[#30d158] transition-colors appearance-none cursor-pointer"
          >
            <option value="" disabled>
              {loadingEmpresas ? 'Cargando empresas...' : 'Selecciona tu empresa'}
            </option>
            {empresas.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || loadingEmpresas}
        className="w-full py-4 rounded-2xl bg-[#30d158] hover:bg-[#2dba4e] text-black font-bold text-sm shadow-xl shadow-[#30d158]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <span>Ingresar a Sucursal</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}
