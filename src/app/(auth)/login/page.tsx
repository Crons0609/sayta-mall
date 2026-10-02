// src/app/(auth)/login/page.tsx
'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/providers/AuthProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Store,
  ChevronLeft,
  CheckCircle2,
  ShoppingBag,
  Zap,
  Phone,
  Smartphone,
  RotateCcw,
  UserCheck,
  Calendar,
  MapPin,
  Home,
  X,
} from 'lucide-react';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const { t } = useLanguage();

  const {
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    completeGoogleProfile,
    needsProfileCompletion,
    sendPhoneVerification,
    confirmPhoneVerification,
  } = useAuth();

  // Estado para el modal de completar perfil de Google
  const [googleProfileData, setGoogleProfileData] = useState({
    age: '',
    phone: '',
    direccion: '',
    referencias: '',
  });
  const [googleProfileLoading, setGoogleProfileLoading] = useState(false);
  const [googleProfileError, setGoogleProfileError] = useState<string | null>(null);

  // Modo: Iniciar sesión, Crear cuenta o Verificación de Teléfono
  const [mode, setMode] = useState<'signin' | 'signup' | 'phone'>('signin');

  // Form states correo
  const [displayName, setDisplayName] = useState('');
  const [age, setAge] = useState('');
  const [direccion, setDireccion] = useState('');
  const [referencias, setReferencias] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form states teléfono
  const [countryCode, setCountryCode] = useState('+505');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [phoneStep, setPhoneStep] = useState<'input' | 'otp' | 'success'>('input');
  const [phoneCountdown, setPhoneCountdown] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [isDevBypass, setIsDevBypass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Temporizador para reenvío SMS
  React.useEffect(() => {
    let t: NodeJS.Timeout;
    if (phoneCountdown > 0) {
      t = setTimeout(() => setPhoneCountdown(phoneCountdown - 1), 1000);
    }
    return () => clearTimeout(t);
  }, [phoneCountdown]);

  const handleRoleRedirect = (role?: string) => {
    if (redirectUrl) {
      router.push(redirectUrl);
      return;
    }

    switch (role) {
      case 'programmer':
        router.push('/programador/dashboard');
        break;
      case 'owner':
        router.push('/dueno/dashboard');
        break;
      case 'employee':
        router.push('/empleado/dashboard');
        break;
      default:
        router.push('/');
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Por favor ingresa tu correo y contraseña.');
      return;
    }

    if (mode === 'signup') {
      if (!displayName.trim()) {
        setErrorMessage('Por favor ingresa tu nombre completo.');
        return;
      }
      if (!age.trim() || parseInt(age, 10) < 12) {
        setErrorMessage('Por favor ingresa una edad válida (mínimo 12 años).');
        return;
      }
      if (!direccion.trim()) {
        setErrorMessage('Por favor ingresa tu dirección de entrega.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('La contraseña debe tener un mínimo de 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Las contraseñas no coinciden.');
        return;
      }
    }

    try {
      setLoading(true);

      if (mode === 'signup') {
        const claims = await signUpWithEmail(email, password, displayName, age, direccion, referencias);
        setSuccessMessage('¡Cuenta creada exitosamente! Redirigiendo...');
        setTimeout(() => {
          handleRoleRedirect(claims?.role);
        }, 800);
      } else {
        const claims = await signInWithEmail(email, password);
        handleRoleRedirect(claims?.role);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error en la autenticación.');
    } finally {
      setLoading(false);
    }
  };

  // Manejo de envío SMS
  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanNum = phoneNumber.replace(/\D/g, '');
    if (cleanNum.length < 8) {
      setErrorMessage('Ingresa un número telefónico de al menos 8 dígitos.');
      return;
    }

    const fullPhone = `${countryCode}${cleanNum}`;

    try {
      setLoading(true);
      const res = await sendPhoneVerification(fullPhone, 'login-recaptcha-container');
      if (res.error) throw new Error(res.error);

      setConfirmationResult(res.confirmationResult || null);
      setIsDevBypass(Boolean(res.devMode));
      setPhoneStep('otp');
      setPhoneCountdown(45);
      setSuccessMessage('Código SMS enviado correctamente.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error enviando código SMS.');
    } finally {
      setLoading(false);
    }
  };

  // Manejo de confirmación OTP
  const handleConfirmPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!otpCode || otpCode.trim().length < 4) {
      setErrorMessage('Ingresa el código de 6 dígitos recibido por SMS.');
      return;
    }

    const fullPhone = `${countryCode}${phoneNumber.replace(/\D/g, '')}`;

    try {
      setLoading(true);
      await confirmPhoneVerification(confirmationResult, otpCode.trim(), fullPhone);
      setPhoneStep('success');
      setSuccessMessage('¡Teléfono verificado! Eres  confirmada.');
      setTimeout(() => {
        handleRoleRedirect();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Código incorrecto o expirado.');
    } finally {
      setLoading(false);
    }
  };

  const [justSignedInWithGoogle, setJustSignedInWithGoogle] = React.useState(false);

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    try {
      setLoading(true);
      setJustSignedInWithGoogle(true);
      await signInWithGoogle();
    } catch (err: any) {
      setJustSignedInWithGoogle(false);
      if (err?.code === 'auth/unauthorized-domain') {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'esta IP';
        setErrorMessage(`El dominio o IP (${host}) no está autorizado en Firebase. Agrégalo en Firebase Console → Authentication → Configuración → Dominios autorizados.`);
      } else if (err?.code === 'auth/popup-blocked') {
        setErrorMessage('Tu navegador bloqueó la ventana emergente de Google. Habilita las ventanas emergentes o ingresa con tu correo.');
      } else {
        setErrorMessage(err?.message || 'No se pudo completar el acceso con Google. Intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Si entró con Google y ya tiene perfil completo → redirigir
  React.useEffect(() => {
    if (justSignedInWithGoogle && !needsProfileCompletion && !loading) {
      router.push(redirectUrl || '/');
    }
  }, [justSignedInWithGoogle, needsProfileCompletion, loading, router, redirectUrl]);

  const handleCompleteGoogleProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setGoogleProfileError(null);
    if (!googleProfileData.age || parseInt(googleProfileData.age, 10) < 12) {
      setGoogleProfileError('Ingresa una edad válida (mínimo 12 años).');
      return;
    }
    const cleanPhone = googleProfileData.phone.replace(/\D/g, '');
    if (cleanPhone.length < 8) {
      setGoogleProfileError('Ingresa un número de teléfono válido (mínimo 8 dígitos).');
      return;
    }
    if (!googleProfileData.direccion.trim()) {
      setGoogleProfileError('Por favor ingresa tu dirección de entrega.');
      return;
    }
    try {
      setGoogleProfileLoading(true);
      await completeGoogleProfile({
        age: parseInt(googleProfileData.age, 10),
        phone: googleProfileData.phone,
        direccion: googleProfileData.direccion,
        referencias: googleProfileData.referencias,
      });
      router.push(redirectUrl || '/');
    } catch (err: any) {
      setGoogleProfileError(err.message || 'Error guardando datos. Intenta de nuevo.');
    } finally {
      setGoogleProfileLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-[#f5f5f7] flex flex-col justify-between relative overflow-hidden">
      {/* ─── MODAL: Completar Perfil Google ─── */}
      {needsProfileCompletion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
          <div className="relative w-full max-w-md bg-[#161617] border border-white/[0.12] rounded-3xl p-7 shadow-2xl animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#2997ff]/20 to-[#30d158]/20 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-[#2997ff]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Completa tu Perfil</h2>
                <p className="text-[11px] text-[#86868b]">Necesitamos unos datos para verificar que eres una persona natural</p>
              </div>
            </div>

            {/* Badge verificación */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#30d158]/10 border border-[#30d158]/20 mb-5 mt-3">
              <ShieldCheck className="w-3.5 h-3.5 text-[#30d158] shrink-0" />
              <span className="text-[11px] text-[#30d158] font-medium">Identidad Verificada · Solo Personas Naturales</span>
            </div>

            {googleProfileError && (
              <div className="mb-4 p-3 rounded-xl bg-[#ff453a]/10 border border-[#ff453a]/25 text-xs text-[#ff453a] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{googleProfileError}</span>
              </div>
            )}

            <form onSubmit={handleCompleteGoogleProfile} className="space-y-4">
              {/* Edad */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#86868b]">Edad <span className="text-[#ff453a]">*</span></label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="number"
                    min="12"
                    max="120"
                    required
                    placeholder="Ej. 28"
                    value={googleProfileData.age}
                    onChange={(e) => setGoogleProfileData((p) => ({ ...p, age: e.target.value }))}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#111318] border border-white/[0.1] text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff] focus:ring-1 focus:ring-[#2997ff]/40 transition-all"
                  />
                </div>
              </div>

              {/* Teléfono */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#86868b]">Número de Teléfono <span className="text-[#ff453a]">*</span></label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    placeholder="Ej. +505 8888 1234"
                    value={googleProfileData.phone}
                    onChange={(e) => setGoogleProfileData((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#111318] border border-white/[0.1] text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff] focus:ring-1 focus:ring-[#2997ff]/40 transition-all"
                  />
                </div>
                <p className="text-[10px] text-[#86868b]">Incluye el código de país. Ej: +505 para Nicaragua.</p>
              </div>

              {/* Dirección */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#86868b]">Dirección de Entrega <span className="text-[#ff453a]">*</span></label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-[#86868b] absolute left-3.5 top-3 pointer-events-none" />
                  <textarea
                    rows={2}
                    required
                    placeholder="Ej. Barrio El Carmen, de la farmacia 2c al norte, casa azul"
                    value={googleProfileData.direccion}
                    onChange={(e) => setGoogleProfileData((p) => ({ ...p, direccion: e.target.value }))}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#111318] border border-white/[0.1] text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#ff9f0a] focus:ring-1 focus:ring-[#ff9f0a]/40 transition-all resize-none"
                  />
                </div>
              </div>

              {/* Referencias */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#86868b]">Referencias del Domicilio <span className="text-[10px] text-[#6e6e73]">(opcional)</span></label>
                <div className="relative">
                  <Home className="w-4 h-4 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Portón negro, muro verde, casa esquinera..."
                    value={googleProfileData.referencias}
                    onChange={(e) => setGoogleProfileData((p) => ({ ...p, referencias: e.target.value }))}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#111318] border border-white/[0.1] text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff] focus:ring-1 focus:ring-[#2997ff]/40 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={googleProfileLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#2997ff] to-[#30d158] text-white text-xs font-semibold flex items-center justify-center gap-2 mt-2 disabled:opacity-60 hover:opacity-90 transition-opacity shadow-lg shadow-[#2997ff]/20"
              >
                {googleProfileLoading ? (
                  <span>Guardando datos...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Guardar y Continuar</span>
                  </>
                )}
              </button>
            </form>

            <p className="text-[10px] text-[#6e6e73] text-center mt-4">
              Tus datos se guardan de forma segura y nunca se comparten con terceros.
            </p>
          </div>
        </div>
      )}

      {/* Contenedor invisible para reCAPTCHA de Firebase */}
      <div id="login-recaptcha-container" />

      {/* Fondo Ambiental Apple */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[#2997ff]/10 via-[#30d158]/5 to-transparent blur-3xl pointer-events-none" />

      {/* Barra Superior con regreso */}
      <header className="relative z-10 px-4 sm:px-8 py-5 flex items-center justify-between max-w-7xl mx-auto w-full">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-[#86868b] hover:text-white transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>{t('login_back_to_store', 'Volver a la tienda')}</span>
        </Link>

        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-xl overflow-hidden shadow-md shadow-purple-500/20 flex-shrink-0">
            <Image
              src="/images/logo.png"
              alt="Sayta Mall"
              width={32}
              height={32}
              className="w-full h-full object-contain rounded-xl"
              priority
            />
          </div>
          <span className="font-semibold text-sm text-white tracking-tight">Sayta Mall</span>
        </div>
      </header>

      {/* Contenedor Principal */}
      <main className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Columna Izquierda: Presentación Premium */}
          <div className="space-y-8 text-left hidden lg:block">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-xs text-[#30d158]">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="font-medium">{t('login_feature_verified', 'Identidad Verificada · Personas Naturales')}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
                {t('hero_title_1', 'Super Ahorro.')} <br />
                <span className="apple-text-gradient">{t('hero_title_2', 'Todo en un solo lugar.')}</span>
              </h1>

              <p className="text-sm text-[#86868b] leading-relaxed max-w-md">
                {t('hero_subtitle', 'Tu gran tienda por departamentos digital. Descubre lo mejor a precios de super ahorro en Córdobas (C$).')}
              </p>
            </div>

            {/* Tarjeta de Beneficios */}
            <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl space-y-4 max-w-md">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#30d158]/15 text-[#30d158] flex items-center justify-center shrink-0 mt-0.5">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">{t('login_feature_phone', 'Verificación por Celular')}</h4>
                  <p className="text-[11px] text-[#86868b] mt-0.5">
                    {t('login_feature_phone_desc', 'Validación por SMS que previene cuentas falsas y garantiza usuarios legítimos.')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#2997ff]/15 text-[#2997ff] flex items-center justify-center shrink-0 mt-0.5">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">{t('login_feature_admin', 'Acceso a Paneles de Gestión')}</h4>
                  <p className="text-[11px] text-[#86868b] mt-0.5">
                    {t('login_feature_admin_desc', 'Dueños y empleados pueden subir y gestionar productos, precios y categorías colaborativamente.')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#ffd60a]/15 text-[#ffd60a] flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">{t('login_feature_discount', 'Descuentos con Autorización')}</h4>
                  <p className="text-[11px] text-[#86868b] mt-0.5">
                    {t('login_feature_discount_desc', 'Rebajas de precio aprobadas directamente por el Dueño o Programador del local.')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Tarjeta de Autenticación */}
          <div className="apple-card p-6 sm:p-10 max-w-md w-full mx-auto bg-[#161617]/95 border-white/[0.1] shadow-2xl rounded-3xl">
            {/* Pestañas: Iniciar Sesión / Crear Cuenta / Teléfono */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-black/40 rounded-2xl border border-white/[0.08] mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMessage(null);
                }}
                className={`py-2 text-[11px] font-semibold rounded-xl transition-all ${mode === 'signin'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-[#86868b] hover:text-white'
                  }`}
              >
                {t('login_tab_signin', 'Ingresar')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMessage(null);
                }}
                className={`py-2 text-[11px] font-semibold rounded-xl transition-all ${mode === 'signup'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-[#86868b] hover:text-white'
                  }`}
              >
                {t('login_tab_signup', 'Registrarse')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('phone');
                  setErrorMessage(null);
                }}
                className={`py-2 text-[11px] font-semibold rounded-xl transition-all flex items-center justify-center gap-1 ${mode === 'phone'
                  ? 'bg-[#30d158] text-black shadow-sm font-bold'
                  : 'text-[#86868b] hover:text-white'
                  }`}
              >
                <Smartphone className="w-3 h-3" />
                <span>{t('login_tab_phone', 'Teléfono')}</span>
              </button>
            </div>

            <div className="mb-5 text-left">
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {mode === 'signin' && t('login_welcome_title', 'Te damos la bienvenida')}
                {mode === 'signup' && t('login_signup_title', 'Crea tu cuenta de cliente')}
                {mode === 'phone' && t('login_phone_title', 'Verificación Móvil')}
              </h3>
              <p className="text-xs text-[#86868b] mt-1">
                {mode === 'signin' && t('login_welcome_sub', 'Ingresa con cualquier correo y contraseña o con Google.')}
                {mode === 'signup' && t('login_signup_sub', 'Regístrate con tu correo para ver precios y comprar en Sayta Mall.')}
                {mode === 'phone' && t('login_phone_sub', 'Verifica tu número telefónico mediante SMS para validar tu cuenta.')}
              </p>
            </div>

            {/* Alerta de Error */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-[#ff453a]/10 border border-[#ff453a]/25 text-xs text-[#ff453a] flex items-center gap-2 animate-fade-in text-left">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Alerta de Éxito */}
            {successMessage && (
              <div className="mb-4 p-3 rounded-xl bg-[#30d158]/10 border border-[#30d158]/25 text-xs text-[#30d158] flex items-center gap-2 animate-fade-in text-left">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* ─── VISTA 1: TELÉFONO () ─── */}
            {mode === 'phone' ? (
              <div className="space-y-4 text-left">
                {phoneStep === 'input' && (
                  <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-white block">
                        Número Celular
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          className="bg-[#111318] border border-white/[0.1] rounded-2xl px-2.5 py-3 text-xs text-white focus:outline-none focus:border-[#30d158]"
                        >
                          <option value="+505">🇳🇮 +505</option>
                          <option value="+506">🇨🇷 +506</option>
                          <option value="+504">🇭🇳 +504</option>
                          <option value="+503">🇸🇻 +503</option>
                          <option value="+502">🇬🇹 +502</option>
                          <option value="+1">🇺🇸 +1</option>
                        </select>
                        <input
                          type="tel"
                          required
                          placeholder="8888 1234"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="flex-1 bg-[#111318] border border-white/[0.1] rounded-2xl px-3.5 py-3 text-sm text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#30d158]"
                        />
                      </div>
                      <p className="text-[11px] text-[#86868b]">
                        Recibirás un código SMS de 6 dígitos para validar que eres una persona real.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full apple-pill-btn apple-btn-primary py-3 text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[#0071e3]/20 disabled:opacity-50"
                    >
                      {loading ? (
                        <span>Enviando SMS...</span>
                      ) : (
                        <>
                          <Smartphone className="w-4 h-4" />
                          <span>Enviar Código SMS</span>
                        </>
                      )}
                    </button>
                  </form>
                )}

                {phoneStep === 'otp' && (
                  <form onSubmit={handleConfirmPhoneOtp} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-white block text-center">
                        Ingresa el código enviado a {countryCode} {phoneNumber}
                      </label>
                      {isDevBypass && (
                        <div className="p-2 rounded-xl bg-[#ffd60a]/10 border border-[#ffd60a]/20 text-[#ffd60a] text-[11px] flex items-center gap-1.5 justify-center">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Código de prueba local: <strong>123456</strong></span>
                        </div>
                      )}
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="123456"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        className="w-full bg-black/60 border border-white/[0.15] rounded-2xl px-4 py-3 text-center text-2xl font-mono tracking-widest text-white focus:outline-none focus:border-[#30d158]"
                        autoFocus
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full apple-pill-btn apple-btn-primary py-3 text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[#0071e3]/20 disabled:opacity-50"
                    >
                      {loading ? (
                        <span>Confirmando...</span>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-[#30d158]" />
                          <span>Confirmar </span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <button
                        type="button"
                        onClick={() => setPhoneStep('input')}
                        className="text-[#86868b] hover:text-white"
                      >
                        Cambiar número
                      </button>
                      {phoneCountdown > 0 ? (
                        <span className="text-[#86868b]">Reenviar en {phoneCountdown}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendPhoneOtp}
                          className="text-[#2997ff] hover:underline"
                        >
                          Reenviar SMS
                        </button>
                      )}
                    </div>
                  </form>
                )}

                {phoneStep === 'success' && (
                  <div className="text-center space-y-4 py-3">
                    <div className="w-12 h-12 rounded-full bg-[#30d158]/20 text-[#30d158] flex items-center justify-center mx-auto">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">¡ Confirmada!</h4>
                      <p className="text-xs text-[#86868b] mt-1">
                        Tu número ha sido verificado satisfactoriamente.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ─── VISTA 2: FORMULARIO CORREO Y CONTRASEÑA ─── */
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Campo Nombre en Registro */}
                {mode === 'signup' && (
                  <div className="space-y-1 text-left animate-fade-in">
                    <label className="text-xs font-medium text-[#86868b]">{t('login_label_name', 'Nombre Completo')}</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                      <input
                        type="text"
                        name="displayName"
                        id="displayName"
                        autoComplete="name"
                        placeholder={t('login_placeholder_name', 'Ej. Juan Pérez')}
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        required
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#111318] border border-white/[0.1] text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff] focus:ring-1 focus:ring-[#2997ff]/50 transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Campo Edad en Registro */}
                {mode === 'signup' && (
                  <div className="space-y-1 text-left animate-fade-in">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-[#86868b]">{t('login_label_age', 'Edad del Cliente')}</label>
                      <span className="text-[10px] text-[#2997ff]">{t('login_label_required', 'Obligatorio')}</span>
                    </div>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                      <input
                        type="number"
                        name="age"
                        id="age"
                        min="12"
                        max="120"
                        placeholder={t('login_placeholder_age', 'Ej. 25 años')}
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        required
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#111318] border border-white/[0.1] text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff] focus:ring-1 focus:ring-[#2997ff]/50 transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Dirección de Entrega (solo en registro) */}
                {mode === 'signup' && (
                  <div className="space-y-1 text-left animate-fade-in">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-[#86868b]">{t('login_label_address', 'Dirección de Entrega')}</label>
                      <span className="text-[10px] text-[#ff9f0a] font-semibold">{t('login_label_required', 'Obligatorio')}</span>
                    </div>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-[#86868b] absolute left-3.5 top-3 pointer-events-none z-10" />
                      <textarea
                        name="direccion"
                        id="direccion"
                        rows={2}
                        placeholder={t('login_placeholder_address', 'Ej. Barrio El Carmen, de la farmacia 2c al norte, casa azul')}
                        value={direccion}
                        onChange={(e) => setDireccion(e.target.value)}
                        required
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#111318] border border-white/[0.1] text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#ff9f0a] focus:ring-1 focus:ring-[#ff9f0a]/50 transition-all resize-none"
                      />
                    </div>
                    <p className="text-[10px] text-[#86868b]">
                      {t('login_address_note', 'Esta dirección se usará para enviarte tus pedidos. Podrás cambiarla al momento de comprar.')}
                    </p>
                  </div>
                )}

                {/* Referencias del domicilio (solo en registro) */}
                {mode === 'signup' && (
                  <div className="space-y-1 text-left animate-fade-in">
                    <label className="text-xs font-medium text-[#86868b]">{t('login_label_reference', 'Referencias del domicilio (opcional)')}</label>
                    <div className="relative">
                      <Home className="w-4 h-4 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                      <input
                        type="text"
                        name="referencias"
                        id="referencias"
                        placeholder={t('login_placeholder_reference', 'Portón negro, muro verde, casa esquinera...')}
                        value={referencias}
                        onChange={(e) => setReferencias(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#111318] border border-white/[0.1] text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff] focus:ring-1 focus:ring-[#2997ff]/50 transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Campo Correo */}
                <div className="space-y-1 text-left">
                  <label className="text-xs font-medium text-[#86868b]">
                    {t('login_label_email', 'Correo Electrónico (Gmail, Outlook, Yahoo o cualquiera)')}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                    <input
                      type="email"
                      name="email"
                      id="email"
                      autoComplete="email"
                      placeholder="tunombre@correo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#111318] border border-white/[0.1] text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff] focus:ring-1 focus:ring-[#2997ff]/50 transition-all"
                    />
                  </div>
                </div>

                {/* Campo Contraseña */}
                <div className="space-y-1 text-left">
                  <label className="text-xs font-medium text-[#86868b]">{t('login_label_password', 'Contraseña')}</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      id="password"
                      autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                      placeholder={t('login_placeholder_password', 'Mínimo 6 caracteres')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#111318] border border-white/[0.1] text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff] focus:ring-1 focus:ring-[#2997ff]/50 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-white transition-colors z-10"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirmar Contraseña en Registro */}
                {mode === 'signup' && (
                  <div className="space-y-1 text-left animate-fade-in">
                    <label className="text-xs font-medium text-[#86868b]">{t('login_label_confirm_password', 'Confirmar Contraseña')}</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        id="confirmPassword"
                        autoComplete="new-password"
                        placeholder="Repite la contraseña"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#111318] border border-white/[0.1] text-xs text-white placeholder-[#6e6e73] focus:outline-none focus:border-[#2997ff] focus:ring-1 focus:ring-[#2997ff]/50 transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Botón de Envío */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full apple-pill-btn apple-btn-primary py-3 text-xs font-semibold flex items-center justify-center gap-2 mt-2 disabled:opacity-50 shadow-lg shadow-[#2997ff]/20"
                >
                  <span>
                    {loading
                      ? t('login_btn_processing', 'Procesando...')
                      : mode === 'signin'
                        ? t('login_btn_signin', 'Iniciar Sesión')
                        : t('login_btn_signup', 'Crear Mi Cuenta')}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Separador */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-white/[0.08]" />
              <span className="text-[10px] text-[#86868b] uppercase tracking-wider">
                {t('login_or_continue_with', 'O también accede con')}
              </span>
              <div className="flex-1 h-px bg-white/[0.08]" />
            </div>

            {/* Botón Google OAuth */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              type="button"
              className="w-full py-2.5 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-medium text-white transition-all flex items-center justify-center gap-2.5 active:scale-[0.99]"
            >
              <GoogleIcon />
              <span>{t('login_btn_google', 'Continuar con Google')}</span>
            </button>

            <p className="text-[10px] text-[#6e6e73] text-center mt-5">
              {t('login_terms_privacy', 'Al continuar aceptas nuestros Términos y Privacidad. Precios expresados en Córdobas (C$ NIO).')}
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-5 text-center text-[11px] text-[#6e6e73] space-y-1">
        <p>© {new Date().getFullYear()} {t('footer_rights', 'Sayta Mall · Super Ahorro Y Todo Aquí')}</p>
        <p className="text-[#86868b]">
          {t('footer_dev', 'Desarrollado por')} <span className="font-semibold text-white">ProLine System</span>
        </p>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#000000] flex items-center justify-center text-xs text-[#86868b]">
          Cargando Sayta Mall...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

