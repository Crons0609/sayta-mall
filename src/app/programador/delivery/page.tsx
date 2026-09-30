// src/app/programador/delivery/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DeliveryCompany } from '@/types/delivery.types';
import {
  Truck,
  Plus,
  Search,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  Power,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Package,
  Layers,
  ArrowRight,
  X,
} from 'lucide-react';

export default function ProgrammerDeliveryPage() {
  const [companies, setCompanies] = useState<DeliveryCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal Crear / Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<DeliveryCompany | null>(null);

  // Form State
  const [nombre, setNombre] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [zonasInput, setZonasInput] = useState('');
  const [logo, setLogo] = useState('');
  const [estado, setEstado] = useState(true);

  // Modal Eliminar
  const [companyToDelete, setCompanyToDelete] = useState<DeliveryCompany | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Feedback messages
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Cargar empresas
  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/delivery-companies');
      const data = await res.json();
      if (data.success && Array.isArray(data.companies)) {
        setCompanies(data.companies);
      }
    } catch (e) {
      console.error('Error fetching delivery companies:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const openCreateModal = () => {
    setEditingCompany(null);
    setNombre('');
    setWhatsapp('+505 ');
    setTelefono('');
    setEmail('');
    setZonasInput('Chichigalpa Centro, Reparto San Antonio');
    setLogo('');
    setEstado(true);
    setIsModalOpen(true);
  };

  const openEditModal = (comp: DeliveryCompany) => {
    setEditingCompany(comp);
    setNombre(comp.nombre);
    setWhatsapp(comp.whatsapp);
    setTelefono(comp.telefono || '');
    setEmail(comp.email || '');
    setZonasInput(comp.zonas_cobertura.join(', '));
    setLogo(comp.logo || '');
    setEstado(comp.estado);
    setIsModalOpen(true);
  };

  // Enviar formulario (Crear o Editar)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    const cleanDigits = whatsapp.replace(/\D/g, '');
    if (cleanDigits.length < 8) {
      alert('Por favor ingresa un número de WhatsApp internacional válido (mínimo 8 dígitos).');
      setSubmitting(false);
      return;
    }

    const payload = {
      nombre,
      whatsapp: whatsapp.trim().startsWith('+') ? whatsapp.trim() : `+${cleanDigits}`,
      telefono: telefono || undefined,
      email: email || undefined,
      zonas_cobertura: zonasInput.split(',').map((z) => z.trim()).filter(Boolean),
      costo_envio: 0,
      logo: logo || undefined,
      estado,
    };

    try {
      if (editingCompany) {
        // Actualizar
        const res = await fetch(`/api/delivery-companies/${editingCompany.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || 'Error al actualizar');
        setFeedback({ type: 'success', message: 'Empresa de delivery actualizada exitosamente.' });
      } else {
        // Crear
        const res = await fetch('/api/delivery-companies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || 'Error al registrar');
        setFeedback({ type: 'success', message: 'Empresa de delivery registrada y disponible en checkout.' });
      }

      setIsModalOpen(false);
      fetchCompanies();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error de conexión' });
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Estado Activo / Inactivo
  const handleToggleEstado = async (comp: DeliveryCompany) => {
    const nextEstado = !comp.estado;
    try {
      const res = await fetch(`/api/delivery-companies/${comp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nextEstado }),
      });
      const data = await res.json();
      if (data.success) {
        setCompanies((prev) =>
          prev.map((c) => (c.id === comp.id ? { ...c, estado: nextEstado } : c))
        );
        setFeedback({
          type: 'success',
          message: `${comp.nombre} está ahora ${nextEstado ? 'ACTIVA (visible en checkout)' : 'INACTIVA (oculta en checkout)'}.`,
        });
      }
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message });
    }
  };

  // Confirmar eliminación (Soft delete si hay pedidos)
  const handleDeleteCompany = async () => {
    if (!companyToDelete) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/delivery-companies/${companyToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: data.message });
        setCompanyToDelete(null);
        fetchCompanies();
      } else {
        alert(data.error || 'Error al eliminar');
      }
    } catch (e: any) {
      alert(e.message || 'Error de red');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtrado de empresas
  const filteredCompanies = companies.filter((c) => {
    const matchQuery =
      c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.whatsapp.includes(searchQuery) ||
      c.zonas_cobertura.some((z) => z.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchQuery) return false;
    if (filterStatus === 'active') return c.estado === true;
    if (filterStatus === 'inactive') return c.estado === false;
    return true;
  });

  const totalActivas = companies.filter((c) => c.estado === true).length;
  const totalZonas = new Set(companies.flatMap((c) => c.zonas_cobertura)).size;
  const totalPedidos = companies.reduce((acc, c) => acc + (c.orders_count || 0), 0);

  return (
    <DashboardLayout role="programmer">
      <div className="space-y-6 animate-fade-in pb-12">
        {/* Header Principal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#2997ff]">
                Logística & Distribución
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#30d158]/20 text-[#30d158] border border-[#30d158]/30 font-bold">
                EN VIVO
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1 flex items-center gap-2.5">
              <span>Empresas de Delivery / Envíos</span>
              <Truck className="w-6 h-6 text-[#2997ff]" />
            </h1>
            <p className="text-xs text-[#86868b] mt-1 max-w-2xl">
              Registra y gestiona las empresas de repartos locales. Los clientes podrán seleccionarlas en el checkout
              y enviarles los pedidos directamente a su WhatsApp o canalizarlos por la web.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openCreateModal}
              className="apple-pill-btn apple-btn-primary px-4 py-2.5 text-xs font-semibold flex items-center gap-2 shadow-lg shadow-[#2997ff]/20"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Empresa</span>
            </button>
          </div>
        </div>

        {/* Notificación de Feedback */}
        {feedback && (
          <div
            className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between animate-fade-in ${
              feedback.type === 'success'
                ? 'bg-[#30d158]/10 border-[#30d158]/30 text-[#30d158]'
                : 'bg-[#ff453a]/10 border-[#ff453a]/30 text-[#ff453a]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs opacity-70 hover:opacity-100 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tarjetas de Métricas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="apple-card p-4">
            <div className="flex items-center justify-between text-[#86868b]">
              <span className="text-[11px] font-medium">Total Empresas</span>
              <Truck className="w-4 h-4 text-[#2997ff]" />
            </div>
            <div className="text-2xl font-bold text-white mt-2 font-mono">{companies.length}</div>
            <div className="text-[10px] text-[#86868b] mt-0.5">Registradas en el sistema</div>
          </div>

          <div className="apple-card p-4">
            <div className="flex items-center justify-between text-[#86868b]">
              <span className="text-[11px] font-medium">Activas en Checkout</span>
              <CheckCircle2 className="w-4 h-4 text-[#30d158]" />
            </div>
            <div className="text-2xl font-bold text-[#30d158] mt-2 font-mono">{totalActivas}</div>
            <div className="text-[10px] text-[#86868b] mt-0.5">Disponibles para clientes</div>
          </div>

          <div className="apple-card p-4">
            <div className="flex items-center justify-between text-[#86868b]">
              <span className="text-[11px] font-medium">Zonas Cubiertas</span>
              <MapPin className="w-4 h-4 text-[#ffd60a]" />
            </div>
            <div className="text-2xl font-bold text-white mt-2 font-mono">{totalZonas}</div>
            <div className="text-[10px] text-[#86868b] mt-0.5">Áreas de reparto activas</div>
          </div>

          <div className="apple-card p-4">
            <div className="flex items-center justify-between text-[#86868b]">
              <span className="text-[11px] font-medium">Pedidos Canalizados</span>
              <Package className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-purple-300 mt-2 font-mono">{totalPedidos}</div>
            <div className="text-[10px] text-[#86868b] mt-0.5">Vía Web y WhatsApp</div>
          </div>
        </div>

        {/* Barra de Filtro y Búsqueda */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white/[0.03] border border-white/[0.08] rounded-2xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nombre, WhatsApp o zona..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/[0.08] rounded-xl text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff]"
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-xl border border-white/[0.08] shrink-0">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterStatus === 'all'
                  ? 'bg-white text-black font-semibold'
                  : 'text-[#86868b] hover:text-white'
              }`}
            >
              Todas ({companies.length})
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterStatus === 'active'
                  ? 'bg-[#30d158] text-black font-semibold'
                  : 'text-[#86868b] hover:text-white'
              }`}
            >
              Activas ({totalActivas})
            </button>
            <button
              onClick={() => setFilterStatus('inactive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterStatus === 'inactive'
                  ? 'bg-[#ff453a] text-white font-semibold'
                  : 'text-[#86868b] hover:text-white'
              }`}
            >
              Inactivas ({companies.length - totalActivas})
            </button>
          </div>
        </div>

        {/* Lista de Empresas */}
        {loading ? (
          <div className="p-12 text-center text-xs text-[#86868b] animate-pulse">
            Cargando empresas de delivery...
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="apple-card p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] text-[#86868b] flex items-center justify-center mx-auto">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white">No se encontraron empresas de delivery</h3>
            <p className="text-xs text-[#86868b] max-w-sm mx-auto">
              {searchQuery
                ? 'Ninguna empresa coincide con la búsqueda. Intenta con otro término.'
                : 'Registra tu primera empresa de delivery para que los clientes puedan elegirla al pagar.'}
            </p>
            <button
              onClick={openCreateModal}
              className="apple-pill-btn apple-btn-primary px-4 py-2 text-xs font-semibold inline-flex items-center gap-2 mt-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Empresa Ahora</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCompanies.map((comp) => {
              const cleanWa = comp.whatsapp.replace(/\D/g, '');
              const waTestUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent(
                `Hola ${comp.nombre}, prueba de conexión desde Sayta Mall.`
              )}`;

              return (
                <div
                  key={comp.id}
                  className={`apple-card p-5 space-y-4 transition-all duration-200 hover:border-white/[0.18] flex flex-col justify-between ${
                    !comp.estado ? 'opacity-65 border-white/[0.06]' : 'border-white/[0.1]'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header de la Tarjeta */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {comp.logo ? (
                          <img
                            src={comp.logo}
                            alt={comp.nombre}
                            className="w-12 h-12 rounded-2xl object-cover border border-white/[0.1] bg-black/40 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2997ff]/20 to-[#30d158]/20 border border-white/[0.1] text-[#2997ff] flex items-center justify-center font-bold text-base shrink-0">
                            {comp.nombre.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-white truncate">{comp.nombre}</h3>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold mt-1 ${
                              comp.estado
                                ? 'bg-[#30d158]/15 text-[#30d158] border border-[#30d158]/30'
                                : 'bg-[#ff453a]/15 text-[#ff453a] border border-[#ff453a]/30'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${comp.estado ? 'bg-[#30d158]' : 'bg-[#ff453a]'}`} />
                            <span>{comp.estado ? 'Activa en Checkout' : 'Inactiva (Oculta)'}</span>
                          </span>
                        </div>
                      </div>

                      {/* Tarifa de Envío Variable */}
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-[#86868b] block">Tarifa de Envío</span>
                        <span className="text-xs font-semibold text-[#ffd60a]">
                          Según Destino
                        </span>
                      </div>
                    </div>

                    {/* Datos de Contacto */}
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.06] space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[#86868b] flex items-center gap-1.5">
                          <MessageCircle className="w-3.5 h-3.5 text-[#30d158]" />
                          <span>WhatsApp:</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <strong className="text-white font-mono">{comp.whatsapp}</strong>
                          <a
                            href={waTestUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded-md text-[#30d158] hover:bg-[#30d158]/15 transition-colors"
                            title="Probar chat de WhatsApp"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      {comp.telefono && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[#86868b] flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-[#2997ff]" />
                            <span>Teléfono:</span>
                          </span>
                          <span className="text-white font-mono">{comp.telefono}</span>
                        </div>
                      )}

                      {comp.email && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[#86868b] flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-purple-400" />
                            <span>Email:</span>
                          </span>
                          <span className="text-white truncate max-w-[160px]">{comp.email}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/[0.06]">
                        <span className="text-[#86868b] flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-[#ffd60a]" />
                          <span>Pedidos Asignados:</span>
                        </span>
                        <span className="text-[#ffd60a] font-bold font-mono">
                          {comp.orders_count || 0}
                        </span>
                      </div>
                    </div>

                    {/* Zonas de Cobertura */}
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868b] flex items-center gap-1 mb-1.5">
                        <MapPin className="w-3 h-3 text-[#2997ff]" />
                        <span>Zonas de Cobertura</span>
                      </span>
                      <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                        {comp.zonas_cobertura.length > 0 ? (
                          comp.zonas_cobertura.map((zona, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[10px] text-slate-300"
                            >
                              {zona}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-[#86868b] italic">Sin zonas especificadas</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acciones de Tarjeta */}
                  <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleToggleEstado(comp)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
                        comp.estado
                          ? 'bg-white/[0.06] text-[#86868b] hover:text-[#ff453a] hover:bg-[#ff453a]/15'
                          : 'bg-[#30d158]/20 text-[#30d158] hover:bg-[#30d158]/30'
                      }`}
                    >
                      <Power className="w-3 h-3" />
                      <span>{comp.estado ? 'Desactivar' : 'Activar'}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditModal(comp)}
                        className="p-2 rounded-xl text-[#86868b] hover:text-white hover:bg-white/[0.08] transition-colors"
                        title="Editar datos de la empresa"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setCompanyToDelete(comp)}
                        className="p-2 rounded-xl text-[#86868b] hover:text-[#ff453a] hover:bg-[#ff453a]/15 transition-colors"
                        title="Eliminar o archivar empresa"
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

        {/* Modal Crear / Editar */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
            <div className="apple-card max-w-lg w-full p-6 sm:p-7 bg-[#161617] border border-white/[0.12] rounded-3xl space-y-5 shadow-2xl my-8">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#2997ff]/20 text-[#2997ff]">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {editingCompany ? 'Editar Empresa de Delivery' : 'Registrar Nueva Empresa de Delivery'}
                    </h3>
                    <p className="text-[11px] text-[#86868b]">
                      Configura el WhatsApp y zonas de entrega para la recepción de pedidos.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl text-[#86868b] hover:text-white hover:bg-white/[0.08]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitForm} className="space-y-4">
                {/* Nombre de la Empresa */}
                <div>
                  <label className="block text-xs font-medium text-[#86868b] mb-1">
                    Nombre Comercial de la Empresa *
                  </label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Sayta Express Repartos"
                    className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff]"
                  />
                </div>

                {/* WhatsApp y Teléfono */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#86868b] mb-1">
                      WhatsApp (Recepción Pedidos) *
                    </label>
                    <input
                      type="text"
                      required
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="+50588881234"
                      className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#30d158] font-mono"
                    />
                    <span className="text-[10px] text-[#86868b] mt-0.5 block">
                      Incluye código de país (+505...)
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#86868b] mb-1">
                      Teléfono Fijo / Alternativo
                    </label>
                    <input
                      type="text"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="+505 2345 6789"
                      className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff] font-mono"
                    />
                  </div>
                </div>

                {/* Email de Notificación */}
                <div>
                  <label className="block text-xs font-medium text-[#86868b] mb-1">
                    Email de Notificación (Opcional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="pedidos@empresa.com"
                    className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff]"
                  />
                </div>

                {/* Zonas de Cobertura */}
                <div>
                  <label className="block text-xs font-medium text-[#86868b] mb-1">
                    Zonas de Cobertura (Separadas por coma)
                  </label>
                  <textarea
                    rows={2}
                    value={zonasInput}
                    onChange={(e) => setZonasInput(e.target.value)}
                    placeholder="Chichigalpa Centro, Reparto San Antonio, Zona Ingenio..."
                    className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff]"
                  />
                  <span className="text-[10px] text-[#86868b] mt-0.5 block">
                    Ej: Chichigalpa, Chinandega, Posoltega, Corinto
                  </span>
                </div>

                {/* URL del Logo */}
                <div>
                  <label className="block text-xs font-medium text-[#86868b] mb-1">
                    URL del Logo o Imagen (Opcional)
                  </label>
                  <input
                    type="url"
                    value={logo}
                    onChange={(e) => setLogo(e.target.value)}
                    placeholder="https://.../logo.png"
                    className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff]"
                  />
                </div>

                {/* Estado Activo */}
                <div className="flex items-center gap-3 p-3 bg-black/40 rounded-xl border border-white/[0.08]">
                  <input
                    type="checkbox"
                    id="estado_checkbox"
                    checked={estado}
                    onChange={(e) => setEstado(e.target.checked)}
                    className="w-4 h-4 rounded text-[#30d158] focus:ring-0 bg-transparent border-white/20"
                  />
                  <label htmlFor="estado_checkbox" className="text-xs text-white cursor-pointer select-none">
                    <strong>Habilitar empresa inmediatamente en el checkout</strong>
                    <span className="text-[11px] text-[#86868b] block">
                      Los clientes podrán seleccionarla al confirmar su compra.
                    </span>
                  </label>
                </div>

                {/* Botones */}
                <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs text-[#86868b] hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="apple-pill-btn apple-btn-primary px-5 py-2.5 text-xs font-semibold disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting ? (
                      <span>Guardando...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{editingCompany ? 'Guardar Cambios' : 'Registrar Empresa'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Eliminar Empresa (con aviso de Soft Delete) */}
        {companyToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
            <div className="apple-card max-w-md w-full p-6 bg-[#161617] border border-[#ff453a]/30 rounded-3xl space-y-4 shadow-2xl">
              <div className="flex items-center gap-3 text-[#ff453a]">
                <div className="w-10 h-10 rounded-xl bg-[#ff453a]/15 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">¿Eliminar empresa de delivery?</h3>
                  <p className="text-xs text-[#86868b]">Esta acción afectará las opciones del checkout.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs space-y-1.5">
                <div className="text-white font-bold">{companyToDelete.nombre}</div>
                <div className="text-[#86868b] font-mono text-[11px]">WhatsApp: {companyToDelete.whatsapp}</div>
                <div className="text-[#ffd60a] text-[11px] pt-1">
                  {companyToDelete.orders_count && companyToDelete.orders_count > 0
                    ? `⚠️ Esta empresa tiene ${companyToDelete.orders_count} pedidos asociados. Se aplicará un Soft-Delete (archivado) para preservar el historial.`
                    : 'ℹ️ No tiene pedidos asociados; se eliminará permanentemente.'}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCompanyToDelete(null)}
                  className="px-4 py-2 rounded-xl text-xs text-[#86868b] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteCompany}
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#ff453a] hover:bg-[#ff453a]/80 text-white transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Procesando...' : 'Confirmar Eliminación'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
