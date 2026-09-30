// src/components/dashboard/ProgrammerManager.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Code,
  UserPlus,
  Shield,
  Trash2,
  Lock,
  Mail,
  User,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  Search,
  X,
  Laptop,
} from 'lucide-react';

interface Programmer {
  id: string;
  name: string;
  email: string;
  roleTitle?: string;
  createdAt?: string;
  isRoot?: boolean;
}

export function ProgrammerManager() {
  const [programmers, setProgrammers] = useState<Programmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [roleTitle, setRoleTitle] = useState('Desarrollador de Software');

  // Action status
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProgrammers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/programmers');
      const data = await res.json();
      if (data.success && Array.isArray(data.programmers)) {
        setProgrammers(data.programmers);
      }
    } catch (err) {
      console.error('Error fetching programmers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgrammers();
  }, []);

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    let generated = 'DevSayta!';
    for (let i = 0; i < 6; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(generated);
    setShowPassword(true);
  };

  const handleCreateProgrammer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name.trim() || !email.trim() || !password) {
      setErrorMessage('Por favor completa todos los campos requeridos.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/programmers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          roleTitle: roleTitle.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error al registrar programador.');
      }

      setSuccessMessage(`Programador ${name} registrado con éxito.`);
      setName('');
      setEmail('');
      setPassword('');
      setIsModalOpen(false);
      fetchProgrammers();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error de conexión.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProgrammer = async (id: string) => {
    try {
      setDeleting(true);
      const res = await fetch(`/api/programmers?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setProgrammers((prev) => prev.filter((p) => p.id !== id));
        setSuccessMessage('Acceso de programador revocado exitosamente.');
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage(data.error || 'Error al revocar acceso.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error de conexión.');
    } finally {
      setDeleting(false);
      setDeleteConfirmId(null);
    }
  };

  const handleCopyCredentials = (prog: Programmer) => {
    const text = `Credenciales de Desarrollador Sayta Mall:\nUsuario: ${prog.email}\nRol: Programador / ${prog.roleTitle || 'Developer'}\nAcceso: /programador/dashboard`;
    navigator.clipboard.writeText(text);
    setCopiedId(prog.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filteredProgrammers = programmers.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      (p.roleTitle || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#2997ff]">
              Control de Accesos Técnicos
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
              DESARROLLADORES
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1 flex items-center gap-2">
            <Code className="w-5 h-5 text-[#2997ff]" />
            <span>Equipo de Programadores</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#86868b] mt-1 max-w-2xl">
            Registra nuevos desarrolladores con su propio correo y contraseña para que puedan acceder al panel de control maestro.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="apple-pill-btn apple-btn-primary px-4 py-2.5 text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#2997ff]/20 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Agregar Programador</span>
        </button>
      </div>

      {/* Alertas */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-[#30d158]/10 border border-[#30d158]/30 text-xs sm:text-sm text-[#30d158] flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs sm:text-sm text-rose-400 flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tarjetas de Estadísticas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="apple-card p-4">
          <span className="text-[11px] text-[#86868b] uppercase tracking-wider block font-medium">
            Total Desarrolladores
          </span>
          <span className="text-2xl font-bold text-white mt-1 block">
            {programmers.length}
          </span>
          <span className="text-[11px] text-[#2997ff] mt-1 block">Con acceso a consola</span>
        </div>

        <div className="apple-card p-4">
          <span className="text-[11px] text-[#86868b] uppercase tracking-wider block font-medium">
            Superadmin Principal
          </span>
          <span className="text-sm font-semibold text-white mt-1 block truncate">
            christhiam@ghost.com
          </span>
          <span className="text-[11px] text-purple-400 mt-1 block">Protegido de eliminación</span>
        </div>

        <div className="apple-card p-4">
          <span className="text-[11px] text-[#86868b] uppercase tracking-wider block font-medium">
            Permisos de Sistema
          </span>
          <span className="text-sm font-semibold text-[#30d158] mt-1 block">
            Control Maestro Activo
          </span>
          <span className="text-[11px] text-[#86868b] mt-1 block">Dueños, Delivery, Empleados</span>
        </div>
      </div>

      {/* Búsqueda y Recarga */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#86868b] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar programador por nombre o correo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff]"
          />
        </div>

        <button
          onClick={fetchProgrammers}
          className="p-2.5 rounded-xl text-[#86868b] hover:text-white bg-white/[0.05] border border-white/[0.08] flex items-center justify-center self-end sm:self-auto"
          title="Recargar programadores"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabla / Lista */}
      <div className="apple-card overflow-hidden">
        <table className="w-full text-left text-xs text-[#86868b]">
          <thead className="bg-white/[0.02] border-b border-white/[0.06] text-[#f5f5f7] uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3.5 px-4 font-semibold">Programador</th>
              <th className="py-3.5 px-4 font-semibold">Especialidad / Cargo</th>
              <th className="py-3.5 px-4 font-semibold">Nivel de Acceso</th>
              <th className="py-3.5 px-4 font-semibold">Fecha Registro</th>
              <th className="py-3.5 px-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {filteredProgrammers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-xs text-[#6e6e73]">
                  No se encontraron programadores registrados.
                </td>
              </tr>
            ) : (
              filteredProgrammers.map((prog) => (
                <tr key={prog.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        prog.isRoot ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-[#2997ff]/20 text-[#2997ff]'
                      }`}>
                        {prog.isRoot ? <Shield className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-semibold text-[#f5f5f7] flex items-center gap-1.5">
                          <span>{prog.name}</span>
                          {prog.isRoot && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-purple-500/25 text-purple-300">
                              ROOT
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#86868b] font-mono">{prog.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-[#f5f5f7]">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.06] text-xs">
                      {prog.roleTitle || 'Programador de Software'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                        prog.isRoot
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-[#30d158]/15 text-[#30d158]'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${prog.isRoot ? 'bg-purple-400' : 'bg-[#30d158]'}`} />
                      {prog.isRoot ? 'Superadmin Raíz' : 'Programador Autorizado'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-[#86868b]">
                    {prog.createdAt ? new Date(prog.createdAt).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    }) : 'Inicial'}
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <button
                      onClick={() => handleCopyCredentials(prog)}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-[#f5f5f7] text-[11px] transition-all"
                      title="Copiar datos de acceso"
                    >
                      {copiedId === prog.id ? 'Copiado ✓' : 'Copiar'}
                    </button>
                    {!prog.isRoot && (
                      <button
                        onClick={() => setDeleteConfirmId(prog.id)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                        title="Revocar acceso de programador"
                      >
                        Revocar
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Registrar Nuevo Programador */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="apple-card p-6 max-w-lg w-full space-y-5 border-[#2997ff]/30 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#2997ff]" />
                <h3 className="text-base font-bold text-white">Agregar Nuevo Programador</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#86868b] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProgrammer} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#f5f5f7] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#86868b]" /> Nombre del Programador
                </label>
                <input
                  type="text"
                  placeholder="Ej. Roberto Sánchez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-xs sm:text-sm text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#f5f5f7] flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#86868b]" /> Correo Electrónico
                </label>
                <input
                  type="email"
                  placeholder="programador@saytamall.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-xs sm:text-sm text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff]"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[#f5f5f7] flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#86868b]" /> Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[11px] text-[#2997ff] hover:underline"
                  >
                    Generar Segura
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-xs sm:text-sm text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff] font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#f5f5f7] flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-[#86868b]" /> Especialidad / Cargo
                </label>
                <select
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1c1c1e] border border-white/[0.1] text-xs sm:text-sm text-white focus:outline-none focus:border-[#2997ff] cursor-pointer"
                >
                  <option value="Desarrollador de Software">Desarrollador de Software General</option>
                  <option value="Backend Developer (APIs & Base de Datos)">Backend Developer (APIs & Base de Datos)</option>
                  <option value="Frontend Developer (UI/UX & Next.js)">Frontend Developer (UI/UX & Next.js)</option>
                  <option value="DevOps & Infraestructura">DevOps & Infraestructura</option>
                  <option value="Soporte Técnico Especializado">Soporte Técnico Especializado</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#86868b] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="apple-pill-btn apple-btn-primary px-5 py-2.5 text-xs font-semibold disabled:opacity-50"
                >
                  {submitting ? 'Registrando...' : 'Otorgar Acceso de Programador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Revocar Acceso */}
      {deleteConfirmId && (() => {
        const target = programmers.find((p) => p.id === deleteConfirmId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="apple-card p-6 max-w-sm w-full space-y-4 border-red-500/30 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-500/15 flex items-center justify-center text-red-400">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Revocar Acceso</h3>
                  <p className="text-[11px] text-[#86868b]">Acción permanente</p>
                </div>
              </div>
              <p className="text-xs text-[#86868b] leading-relaxed">
                ¿Estás seguro de que deseas revocar el acceso de programador a{' '}
                <strong className="text-white">{target?.name || target?.email}</strong>? Ya no podrá acceder al panel de control.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-2 rounded-xl text-xs font-medium text-[#86868b] bg-white/[0.06] hover:bg-white/[0.1]"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeleteProgrammer(deleteConfirmId)}
                  disabled={deleting}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 disabled:opacity-50"
                >
                  {deleting ? 'Revocando...' : 'Sí, Revocar'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
