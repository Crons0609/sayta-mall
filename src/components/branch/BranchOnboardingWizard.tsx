// src/components/branch/BranchOnboardingWizard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Store,
  MapPin,
  Phone,
  Clock,
  Coins,
  Truck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Building2,
  Users,
} from 'lucide-react';
import { db } from '@/lib/firebase/client';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface BranchOnboardingWizardProps {
  onSuccess?: () => void;
  ownerId?: string;
}

export function BranchOnboardingWizard({ onSuccess, ownerId = 'system_owner' }: BranchOnboardingWizardProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('chichigalpa');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [schedule, setSchedule] = useState('Lunes a Sábado: 8:00 AM - 6:00 PM');
  const [currency, setCurrency] = useState('NIO');
  const [deliveryType, setDeliveryType] = useState<'both' | 'pickup' | 'delivery'>('both');

  // Asignación de Dueño / Jefe
  const [owners, setOwners] = useState<Array<{ id: string; name: string; storeName: string; email?: string }>>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>(ownerId);

  useEffect(() => {
    fetch('/api/owners')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.owners)) {
          setOwners(data.owners);
          if (ownerId && ownerId !== 'system_owner') {
            setSelectedOwnerId(ownerId);
          } else if (data.owners.length > 0) {
            setSelectedOwnerId(data.owners[0].id);
          }
        }
      })
      .catch((e) => console.warn('Error fetching owners:', e));
  }, [ownerId]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !address.trim()) {
      setError('Por favor completa el nombre y la dirección de la sucursal.');
      return;
    }

    try {
      setLoading(true);

      const targetOwnerId = selectedOwnerId || ownerId || 'system_owner';
      const selectedOwner = owners.find((o) => o.id === targetOwnerId);

      const branchPayload = {
        name: name.trim(),
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        address: address.trim(),
        city: city.trim(),
        phone: phone.trim() || '+505 2222-0000',
        whatsapp: whatsapp.trim() || phone.trim() || '+505 8888-0000',
        description: `Sucursal principal ${name.trim()}`,
        currency,
        currencySymbol: currency === 'NIO' ? 'C$' : '$',
        taxRate: 15,
        taxIncluded: true,
        pickupEnabled: deliveryType === 'pickup' || deliveryType === 'both',
        deliveryEnabled: deliveryType === 'delivery' || deliveryType === 'both',
        schedule: {
          general: schedule,
        },
        ownerId: targetOwnerId,
        ownerIds: [targetOwnerId],
        ownerName: selectedOwner?.name || '',
        active: true,
        isPublic: true,
      };

      // Intentar primero con la API
      try {
        const res = await fetch('/api/branches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(branchPayload),
        });
        const data = await res.json();
        if (data.success) {
          setSuccess(true);
          setTimeout(() => {
            if (onSuccess) onSuccess();
            window.location.reload();
          }, 1200);
          return;
        }
      } catch (apiErr) {
        console.warn('API error, falling back to client firestore:', apiErr);
      }

      // Fallback a cliente Firestore
      await addDoc(collection(db, 'branches'), {
        ...branchPayload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      console.error('Error al crear primera sucursal:', err);
      setError(err.message || 'No se pudo crear la sucursal. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 sm:p-8 apple-card border border-white/[0.1] bg-[#161617]/90 backdrop-blur-2xl shadow-2xl rounded-3xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2997ff] to-[#30d158] flex items-center justify-center text-white shadow-lg shadow-[#2997ff]/20">
          <Store className="w-6 h-6" />
        </div>
        <div>
          <span className="text-[11px] font-semibold tracking-wider uppercase text-[#30d158] block">
            Paso Esencial de Activación
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Crea tu primera sucursal
          </h2>
          <p className="text-xs text-[#86868b] mt-0.5">
            Activa la tienda física y digital para comenzar a publicar productos y despachar pedidos.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 mb-6 rounded-xl bg-[#ff453a]/10 border border-[#ff453a]/25 text-[#ff453a] text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 mb-6 rounded-xl bg-[#30d158]/10 border border-[#30d158]/25 text-[#30d158] text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <div>
            <strong className="block text-white">¡Sucursal creada exitosamente!</strong>
            <span>La tienda ahora está activa. Redirigiendo al panel...</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Dueño o Jefe Encargado */}
        {owners.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-1.5">
            <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-white">
                <Users className="w-4 h-4 text-[#2997ff]" />
                Dueño o Jefe Encargado de esta Sucursal
              </span>
              <span className="text-[10px] text-[#2997ff] font-normal">Recomendado</span>
            </label>
            <select
              value={selectedOwnerId}
              onChange={(e) => setSelectedOwnerId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-[#2997ff]"
            >
              {owners.map((o) => (
                <option key={o.id} value={o.id} className="bg-[#1c1c1e] text-white">
                  {o.name} — {o.storeName} ({o.email})
                </option>
              ))}
            </select>
            <span className="text-[10px] text-[#86868b] block">
              El dueño asignado gestionará el inventario, catálogo y empleados de esta sucursal.
            </span>
          </div>
        )}

        {/* Nombre y Ciudad */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#86868b] mb-1.5">
              Nombre de la Sucursal *
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-[#86868b] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Sayta Mall Central"
                className="w-full pl-9 pr-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#86868b] mb-1.5">
              Ciudad / Municipio *
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-[#86868b] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ej. chichigalpa, Granada, León"
                className="w-full pl-9 pr-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff]"
              />
            </div>
          </div>
        </div>

        {/* Dirección exacta */}
        <div>
          <label className="block text-xs font-medium text-[#86868b] mb-1.5">
            Dirección Completa *
          </label>
          <input
            type="text"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Ej. Semáforos de Plaza España 2c al lago, Módulo #4"
            className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff]"
          />
        </div>

        {/* Teléfono y WhatsApp */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#86868b] mb-1.5">
              Teléfono de Contacto
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-[#86868b] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+505 2222-0000"
                className="w-full pl-9 pr-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#86868b] mb-1.5">
              WhatsApp de Pedidos
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-[#30d158] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+505 8888-0000"
                className="w-full pl-9 pr-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff]"
              />
            </div>
          </div>
        </div>

        {/* Horario y Moneda */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#86868b] mb-1.5">
              Horario de Atención
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-[#86868b] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                placeholder="Lunes a Sábado: 8:00 AM - 6:00 PM"
                className="w-full pl-9 pr-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#86868b] mb-1.5">
              Moneda Principal
            </label>
            <div className="relative">
              <Coins className="w-4 h-4 text-[#ffd60a] absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#2997ff]"
              >
                <option value="NIO" className="bg-[#1c1c1e] text-white">
                  NIO - Córdoba Nicaragüense (C$) [Por Defecto]
                </option>
                <option value="USD" className="bg-[#1c1c1e] text-white">
                  USD - Dólar Estadounidense ($)
                </option>
                <option value="MXN" className="bg-[#1c1c1e] text-white">
                  MXN - Peso Mexicano ($)
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Modalidades de Entrega */}
        <div>
          <label className="block text-xs font-medium text-[#86868b] mb-1.5">
            Modalidad de Despacho y Entrega
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setDeliveryType('both')}
              className={`p-3 rounded-xl border text-xs text-left transition-all ${deliveryType === 'both'
                  ? 'border-[#2997ff] bg-[#2997ff]/10 text-white font-medium'
                  : 'border-white/[0.08] bg-black/30 text-[#86868b] hover:text-white'
                }`}
            >
              <Truck className="w-4 h-4 mb-1 text-[#2997ff]" />
              <div className="font-semibold text-white">Ambos</div>
              <div className="text-[10px] text-[#86868b]">Pickup & Delivery</div>
            </button>

            <button
              type="button"
              onClick={() => setDeliveryType('pickup')}
              className={`p-3 rounded-xl border text-xs text-left transition-all ${deliveryType === 'pickup'
                  ? 'border-[#30d158] bg-[#30d158]/10 text-white font-medium'
                  : 'border-white/[0.08] bg-black/30 text-[#86868b] hover:text-white'
                }`}
            >
              <Store className="w-4 h-4 mb-1 text-[#30d158]" />
              <div className="font-semibold text-white">Solo Pickup</div>
              <div className="text-[10px] text-[#86868b]">Retiro en sucursal</div>
            </button>

            <button
              type="button"
              onClick={() => setDeliveryType('delivery')}
              className={`p-3 rounded-xl border text-xs text-left transition-all ${deliveryType === 'delivery'
                  ? 'border-[#ffd60a] bg-[#ffd60a]/10 text-white font-medium'
                  : 'border-white/[0.08] bg-black/30 text-[#86868b] hover:text-white'
                }`}
            >
              <Truck className="w-4 h-4 mb-1 text-[#ffd60a]" />
              <div className="font-semibold text-white">Solo Delivery</div>
              <div className="text-[10px] text-[#86868b]">Envío motorizado</div>
            </button>
          </div>
        </div>

        {/* Botón de Envío */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#2997ff] to-[#0071e3] text-white font-semibold text-xs tracking-wide hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#2997ff]/25"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Registrando sucursal y activando catálogo...
              </span>
            ) : (
              <>
                <span>Activar Sucursal e Iniciar Operaciones</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
