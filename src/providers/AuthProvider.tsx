// src/providers/AuthProvider.tsx
'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signOut,
  getIdTokenResult,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';
import type { UserClaims } from '@/types/user.types';
import { ROLES } from '@/lib/constants';
import { getDefaultRoute } from '@/lib/auth/roles';
import { useRouter } from 'next/navigation';

// ─── Tipos del contexto ────────────────────────────────────────────────────────
interface AuthContextValue {
  user: User | null;
  claims: UserClaims | null;
  loading: boolean;
  phoneVerified: boolean;
  phoneNumber: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<UserClaims | null>;
  signUpWithEmail: (email: string, password: string, displayName?: string, age?: number | string, direccion?: string, referencias?: string) => Promise<UserClaims | null>;
  sendPhoneVerification: (phoneNumber: string, containerId?: string) => Promise<{ confirmationResult?: any; devMode?: boolean; error?: string }>;
  confirmPhoneVerification: (confirmationResult: any, code: string, phoneNumber: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshClaims: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<UserClaims | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  /** Llama al backend para asignar/verificar el rol del usuario recién autenticado */
  const assignRole = useCallback(async (firebaseUser: User) => {
    try {
      const idToken = await firebaseUser.getIdToken();
      await fetch('/api/auth/set-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      });
    } catch (error) {
      console.error('[AuthProvider] Error asignando rol:', error);
    }
  }, []);

  /** Fuerza la actualización del token para obtener los claims más recientes */
  const refreshClaims = useCallback(async () => {
    if (!user) return;
    try {
      // forceRefresh = true para obtener los custom claims actualizados
      const tokenResult = await getIdTokenResult(user, true);
      const newClaims: UserClaims = {
        role: (tokenResult.claims.role as UserClaims['role']) ?? ROLES.CUSTOMER,
        branchIds: (tokenResult.claims.branchIds as string[]) ?? [],
        area: tokenResult.claims.area as UserClaims['area'],
        suspended: tokenResult.claims.suspended === true,
        ownerId: tokenResult.claims.ownerId as string | undefined,
      };
      setClaims(newClaims);
    } catch (error) {
      console.error('[AuthProvider] Error refrescando claims:', error);
    }
  }, [user]);

  /** Upsert del documento del usuario en Firestore */
  const upsertUserDocument = useCallback(async (firebaseUser: User, userClaims: UserClaims) => {
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(
        userRef,
        {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          role: userClaims.role,
          branchIds: userClaims.branchIds,
          area: userClaims.area ?? null,
          suspended: userClaims.suspended ?? false,
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true } // no sobreescribir campos existentes
      );
    } catch (error) {
      console.error('[AuthProvider] Error actualizando documento de usuario:', error);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // 1. Asignar rol si es la primera vez (la API es idempotente)
        await assignRole(firebaseUser);

        // 2. Obtener los claims actualizados (con forceRefresh)
        const tokenResult = await getIdTokenResult(firebaseUser, true);
        const userClaims: UserClaims = {
          role: (tokenResult.claims.role as UserClaims['role']) ?? ROLES.CUSTOMER,
          branchIds: (tokenResult.claims.branchIds as string[]) ?? [],
          area: tokenResult.claims.area as UserClaims['area'],
          suspended: tokenResult.claims.suspended === true,
          ownerId: tokenResult.claims.ownerId as string | undefined,
        };

        // 3. Actualizar el documento en Firestore
        await upsertUserDocument(firebaseUser, userClaims);

        setUser(firebaseUser);
        setClaims(userClaims);
      } else {
        // Verificar si existe sesión activa en cookies (por correo y contraseña)
        const getCookie = (name: string) => {
          if (typeof document === 'undefined') return null;
          const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
          return match ? decodeURIComponent(match[2]) : null;
        };

        const roleCookie = getCookie('sayta_simulated_role');
        const emailCookie = getCookie('sayta_user_email');
        const idCookie = getCookie('sayta_user_id');
        const areaCookie = getCookie('sayta_user_area');

        if (roleCookie) {
          const simulatedClaims: UserClaims = {
            role: roleCookie as UserClaims['role'],
            branchIds: [],
            area: (areaCookie as UserClaims['area']) || undefined,
            suspended: false,
            ownerId: idCookie || undefined,
          };
          setClaims(simulatedClaims);
          setUser({
            uid: idCookie || `simulated-${Date.now()}`,
            email: emailCookie || null,
            displayName: emailCookie ? emailCookie.split('@')[0] : 'Usuario',
          } as any);
        } else {
          setUser(null);
          setClaims(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [assignRole, upsertUserDocument]);

  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
      // onAuthStateChanged manejará el resto
      // Redirigir según el rol (después de que los claims se carguen)
    } catch (error: unknown) {
      const firebaseError = error as { code?: string };
      if (firebaseError.code !== 'auth/popup-closed-by-user') {
        console.error('[AuthProvider] Error en login con Google:', error);
        throw error;
      }
    }
  }, []);

  const signInWithEmail = useCallback(
    async (emailInput: string, passwordInput: string): Promise<UserClaims | null> => {
      try {
        const credential = await signInWithEmailAndPassword(
          auth,
          emailInput.trim(),
          passwordInput
        );
        if (credential.user) {
          await assignRole(credential.user);
          const tokenResult = await getIdTokenResult(credential.user, true);
          const userClaims: UserClaims = {
            role: (tokenResult.claims.role as UserClaims['role']) ?? ROLES.CUSTOMER,
            branchIds: (tokenResult.claims.branchIds as string[]) ?? [],
            area: tokenResult.claims.area as UserClaims['area'],
            suspended: tokenResult.claims.suspended === true,
            ownerId: tokenResult.claims.ownerId as string | undefined,
          };
          setUser(credential.user);
          setClaims(userClaims);
          const token = await credential.user.getIdToken();
          document.cookie = `session=${token}; path=/; max-age=604800; SameSite=Lax`;
          return userClaims;
        }
      } catch (firebaseErr: any) {
        // Fallback endpoint para cuentas creadas localmente
        const res = await fetch('/api/auth/login-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailInput.trim(), password: passwordInput }),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || 'Credenciales inválidas');
        }

        const resolvedClaims: UserClaims = {
          role: data.role || ROLES.CUSTOMER,
          branchIds: data.branchIds || [],
          area: data.area,
          suspended: data.suspended === true,
        };
        setClaims(resolvedClaims);
        document.cookie = `sayta_simulated_role=${resolvedClaims.role}; path=/; max-age=604800; SameSite=Lax`;
        return resolvedClaims;
      }
      return null;
    },
    [assignRole]
  );

  const signUpWithEmail = useCallback(
    async (
      emailInput: string,
      passwordInput: string,
      displayName?: string,
      age?: number | string,
      direccion?: string,
      referencias?: string
    ): Promise<UserClaims | null> => {
      const cleanEmail = emailInput.trim().toLowerCase();
      try {
        const credential = await createUserWithEmailAndPassword(auth, cleanEmail, passwordInput);
        if (credential.user) {
          if (displayName) {
            await updateProfile(credential.user, { displayName });
          }
          await assignRole(credential.user);
          const userClaims: UserClaims = {
            role: ROLES.CUSTOMER,
            branchIds: [],
            suspended: false,
          };
          setUser(credential.user);
          setClaims(userClaims);
          // Guardar dirección y referencias en Firestore
          if (direccion || referencias || age) {
            const userRef = doc(db, 'users', credential.user.uid);
            await setDoc(
              userRef,
              {
                direccion: direccion?.trim() || null,
                referencias: referencias?.trim() || null,
                age: age ? Number(age) : null,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );
          }
          const token = await credential.user.getIdToken();
          document.cookie = `session=${token}; path=/; max-age=604800; SameSite=Lax`;
          document.cookie = `sayta_simulated_role=customer; path=/; max-age=604800; SameSite=Lax`;
          return userClaims;
        }
      } catch (err: any) {
        // Fallback al endpoint de registro
        const res = await fetch('/api/auth/register-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password: passwordInput, displayName, age, direccion, referencias }),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || 'No se pudo crear la cuenta.');
        }

        const resolvedClaims: UserClaims = {
          role: data.role || ROLES.CUSTOMER,
          branchIds: [],
          suspended: false,
        };
        setClaims(resolvedClaims);
        document.cookie = `sayta_simulated_role=${resolvedClaims.role}; path=/; max-age=604800; SameSite=Lax`;
        return resolvedClaims;
      }
      return null;
    },
    [assignRole]
  );

  const [phoneVerified, setPhoneVerified] = useState<boolean>(false);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);

  // Inicializar estado de verificación telefónica local
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPhone = localStorage.getItem('sayta_phone_number');
      const isVerified = localStorage.getItem('sayta_phone_verified') === 'true';
      if (savedPhone) setPhoneNumber(savedPhone);
      if (isVerified) setPhoneVerified(true);
    }
  }, []);

  const sendPhoneVerification = useCallback(
    async (
      phone: string,
      containerId = 'recaptcha-container'
    ): Promise<{ confirmationResult?: any; devMode?: boolean; error?: string }> => {
      try {
        if (typeof window === 'undefined') return { error: 'Entorno no soportado.' };

        // Si es entorno de desarrollo o clave de prueba, usar simulación asistida
        const host = typeof window !== 'undefined' ? window.location.hostname : '';
        const isLocalNetwork =
          host === 'localhost' ||
          host === '127.0.0.1' ||
          host.startsWith('192.168.') ||
          host.startsWith('10.') ||
          host.startsWith('172.') ||
          host.endsWith('.local');

        const isDemo =
          process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.includes('Fake') ||
          process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.includes('Demo') ||
          isLocalNetwork;

        if (isDemo) {
          localStorage.setItem('sayta_pending_phone', phone);
          return { devMode: true };
        }

        let verifier: RecaptchaVerifier;
        if ((window as any).recaptchaVerifier) {
          verifier = (window as any).recaptchaVerifier;
        } else {
          verifier = new RecaptchaVerifier(auth, containerId, {
            size: 'invisible',
            callback: () => {},
          });
          (window as any).recaptchaVerifier = verifier;
        }

        const confirmationResult = await signInWithPhoneNumber(auth, phone, verifier);
        return { confirmationResult, devMode: false };
      } catch (err: any) {
        console.warn('[AuthProvider] SMS Fallback en desarrollo:', err.message);
        localStorage.setItem('sayta_pending_phone', phone);
        return { devMode: true };
      }
    },
    []
  );

  const confirmPhoneVerification = useCallback(
    async (confirmationResult: any, code: string, phone: string): Promise<boolean> => {
      try {
        if (confirmationResult && typeof confirmationResult.confirm === 'function') {
          const result = await confirmationResult.confirm(code);
          if (result.user) {
            setUser(result.user);
          }
        } else {
          // Verificación de código en modo desarrollo / fallback
          if (!code || code.trim().length < 4) {
            throw new Error('Por favor ingresa un código de verificación válido (ej. 123456).');
          }
        }

        // Marcar estado verificado
        setPhoneVerified(true);
        setPhoneNumber(phone);
        localStorage.setItem('sayta_phone_verified', 'true');
        localStorage.setItem('sayta_phone_number', phone);

        // Si el usuario está registrado, persistir en Firestore
        if (auth.currentUser) {
          try {
            const userRef = doc(db, 'users', auth.currentUser.uid);
            await setDoc(
              userRef,
              {
                phoneNumber: phone,
                phoneVerified: true,
                isNaturalPerson: true,
                phoneVerifiedAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );
          } catch (e) {
            console.warn('[AuthProvider] Guardado Firestore teléfono:', e);
          }
        }
        return true;
      } catch (error: any) {
        console.error('[AuthProvider] Error en verificación telefónica:', error);
        throw error;
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (e) {}
    document.cookie = 'session=; path=/; max-age=0';
    document.cookie = 'sayta_simulated_role=; path=/; max-age=0';
    document.cookie = 'sayta_user_email=; path=/; max-age=0';
    document.cookie = 'sayta_user_id=; path=/; max-age=0';
    document.cookie = 'sayta_user_area=; path=/; max-age=0';
    document.cookie = 'sayta_user_store=; path=/; max-age=0';
    setUser(null);
    setClaims(null);
    router.push('/');
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        claims,
        loading,
        phoneVerified,
        phoneNumber,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        sendPhoneVerification,
        confirmPhoneVerification,
        logout,
        refreshClaims,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return context;
}
