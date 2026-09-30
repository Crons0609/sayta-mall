# 🏪 Sayta Mall

**Super Ahorro Y Todo Aquí** — Sistema completo de gestión de tienda multisucursal.

> Stack: Next.js 14 · TypeScript · Tailwind CSS · Firebase (Auth + Firestore + Storage) · Render

---

## 📋 Índice

1. [Descripción del Proyecto](#descripción-del-proyecto)
2. [Roles y Permisos](#roles-y-permisos)
3. [Requisitos Previos](#requisitos-previos)
4. [Instalación Local](#instalación-local)
5. [Configurar Firebase](#configurar-firebase)
6. [Variables de Entorno](#variables-de-entorno)
7. [Despliegue en Render](#despliegue-en-render)
8. [Emuladores de Firebase](#emuladores-de-firebase)
9. [Estructura del Proyecto](#estructura-del-proyecto)
10. [Fases de Desarrollo](#fases-de-desarrollo)
11. [Decisiones de Arquitectura](#decisiones-de-arquitectura)

---

## Descripción del Proyecto

Sayta Mall es una plataforma web completa para la gestión de una tienda multisucursal. Incluye:

- Catálogo público con restricción estricta de precios para visitantes (ocultos hasta iniciar sesión)
- Moneda por defecto configurable: Córdobas Nicaragüenses (`C$ / NIO`) con formato `Intl.NumberFormat`
- Regla estricta de sucursales: 0 sucursales activa "Tienda en preparación" y wizard guiado; 1 sucursal opera sin selector; 2+ activa selector dinámico
- Login unificado (Google OAuth + Correo y Contraseña) con resolución automática de roles
- Consola de Programador (`/programador/duenos`): invitaciones de 7 días, modo soporte/impersonación y eliminación auditada
- Portal del Dueño (`/dueno/empleados`): alta con correo, contraseña y asignación de área (Caja, Bodega, Ventas, Limpieza, Atención, General)
- Estación operativa de Empleado (`/empleado/dashboard`): interfaces dedicadas por área
- DashboardLayout compartido con diseño Apple, barra de búsqueda con atajo `Cmd+K` / `Ctrl+K`, drawer responsive y notificaciones
- PWA instalable en móvil y responsive en 375px, 768px y 1440px

---

## Roles y Permisos

| Rol | Acceso |
|---|---|
| **Programador** | Acceso total, todas las sucursales, seed de datos |
| **Dueño** | Sus sucursales: empleados, reportes, configuración |
| **Empleado** | Su sucursal: productos, inventario, pedidos, tareas |
| **Cliente** | Catálogo con precios, carrito, pedidos, reseñas |
| **Visitante** | Solo catálogo público sin precios |

Los roles se implementan con **Firebase Custom Claims** y se verifican en:
- El middleware de Next.js (protección de rutas)
- Las API routes (Admin SDK)
- Las Firestore Security Rules

---

## Requisitos Previos

- Node.js 18+ (recomendado: 20 LTS)
- npm 9+
- Una cuenta en Firebase (gratis en el plan Spark para desarrollo)
- Una cuenta en Render (gratis para el plan starter)

---

## Instalación Local

```bash
# 1. Clonar el repositorio
git clone <tu-repositorio>
cd sayta-mall

# 2. Instalar dependencias
npm install

# 3. Copiar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Firebase

# 4. Iniciar el servidor de desarrollo
npm run dev
```

La aplicación estará en: http://localhost:3000

---

## Configurar Firebase

### 1. Crear el proyecto Firebase

1. Ve a https://console.firebase.google.com
2. Haz clic en **"Agregar proyecto"**
3. Nombre: `sayta-mall` (o el que prefieras)
4. Desactiva Google Analytics si no lo necesitas
5. Haz clic en **"Crear proyecto"**

### 2. Activar Authentication con Google

1. En el panel lateral: **Authentication** → **Comenzar**
2. Pestaña **Proveedores de acceso**
3. Clic en **Google** → Activar
4. Configura el correo de soporte del proyecto
5. Guarda

> ⚠️ **Importante:** Agrega `localhost` y tu dominio de Render en **Authentication → Settings → Dominios autorizados**.

### 3. Crear Firestore

1. En el panel: **Firestore Database** → **Crear base de datos**
2. Selecciona **"Iniciar en modo de producción"**
3. Elige la ubicación más cercana a tus usuarios (ej: `us-central1`)
4. Confirmar

### 4. Activar Storage

1. En el panel: **Storage** → **Comenzar**
2. Modo de producción
3. Misma ubicación que Firestore

### 5. Obtener credenciales del SDK cliente

1. **Configuración del proyecto** (ícono ⚙️) → **Tus apps**
2. Clic en el ícono `</>` (Web)
3. Nombre de la app: `sayta-mall-web`
4. **No** actives Firebase Hosting
5. Copia el objeto `firebaseConfig` y pega los valores en `.env.local`

### 6. Crear Service Account (Admin SDK)

1. **Configuración del proyecto** → **Cuentas de servicio**
2. Clic en **"Generar nueva clave privada"**
3. Descarga el archivo JSON
4. **NUNCA lo subas al repositorio**
5. Convierte el JSON a string y ponlo en `FIREBASE_SERVICE_ACCOUNT_JSON`:
   ```bash
   # En PowerShell:
   (Get-Content service-account.json -Raw) | ConvertFrom-Json | ConvertTo-Json -Compress
   ```
6. Pega el resultado (una sola línea) en `.env.local`

### 7. Desplegar las reglas de Firestore y Storage

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Vincular al proyecto
firebase use --add
# Selecciona tu proyecto y ponle el alias "default"

# Desplegar reglas
firebase deploy --only firestore:rules,firestore:indexes,storage:rules
```

---

## Variables de Entorno

Copia `.env.example` como `.env.local` y rellena:

| Variable | Descripción | Ejemplo |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | API Key del SDK cliente | `AIzaSy...` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Dominio de Auth | `tu-proyecto.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ID del proyecto | `sayta-mall-prod` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Bucket de Storage | `sayta-mall-prod.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Sender ID | `123456789` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | App ID | `1:123:web:abc` |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | JSON del Service Account | `{"type":"service_account"...}` |
| `PROGRAMMER_EMAILS` | Correos del superadmin | `admin@ejemplo.com,otro@ejemplo.com` |
| `NEXT_PUBLIC_APP_URL` | URL de la app | `https://sayta-mall.onrender.com` |
| `SESSION_SECRET` | Secret para cookies | String aleatorio de 32+ chars |

---

## Despliegue en Render

### 1. Preparar el repositorio

```bash
git add .
git commit -m "feat: Fase 1 — estructura base y autenticación"
git push origin main
```

### 2. Crear el Web Service en Render

1. Ve a https://render.com → **New** → **Web Service**
2. Conecta tu repositorio de GitHub/GitLab
3. Configuración:
   - **Name:** `sayta-mall`
   - **Region:** Oregon (US West)
   - **Branch:** `main`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Free (para desarrollo)

### 3. Configurar variables de entorno en Render

En el dashboard de Render → tu servicio → **Environment**:

Agrega **todas** las variables del archivo `.env.example` con sus valores reales.

> ⚠️ Para `FIREBASE_SERVICE_ACCOUNT_JSON`, pega el JSON completo como **una sola línea**. Render lo maneja correctamente.

### 4. Autorizar el dominio en Firebase

1. Firebase Console → Authentication → Settings → **Dominios autorizados**
2. Agrega: `tu-servicio.onrender.com`

### 5. Desplegar

El primer despliegue tarda ~5-10 minutos. Los siguientes son automáticos con cada push a `main`.

---

## Emuladores de Firebase

Para desarrollo local sin afectar la base de datos de producción:

```bash
# Instalar Firebase CLI (si no lo tienes)
npm install -g firebase-tools

# Inicializar emuladores (la primera vez)
firebase init emulators
# Seleccionar: Authentication, Firestore, Storage

# Iniciar emuladores
firebase emulators:start

# La UI del emulador estará en: http://localhost:4000
```

Para conectar la app a los emuladores, agrega en `.env.local`:
```
NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true
```

> *(La lógica de conexión a emuladores se agrega en la Fase 3)*

---

## Estructura del Proyecto

```
sayta-mall/
├── firebase/               # Rules y configuración de Firebase
│   ├── firestore.rules     # Reglas de seguridad Firestore
│   ├── storage.rules       # Reglas de seguridad Storage
│   └── firestore.indexes.json
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── (auth)/         # Rutas de autenticación
│   │   ├── (public)/       # Rutas públicas (catálogo, producto)
│   │   ├── (cliente)/      # Rutas del cliente registrado
│   │   ├── (empleado)/     # Panel del empleado
│   │   ├── (dueno)/        # Panel del dueño
│   │   ├── (programador)/  # Superadmin
│   │   └── api/            # API Routes (server-side)
│   ├── components/         # Componentes React reutilizables
│   ├── lib/                # Lógica de negocio
│   │   ├── firebase/       # Client y Admin SDK
│   │   ├── auth/           # Roles y claims
│   │   └── constants.ts    # Constantes del sistema
│   ├── providers/          # Context Providers (Auth, Branch, Theme)
│   └── types/              # Tipos TypeScript
├── docs/                   # Documentación adicional
├── .env.example            # Plantilla de variables de entorno
├── render.yaml             # Configuración de Render
└── README.md
```

---

## Fases de Desarrollo

| Fase | Contenido | Estado |
|---|---|---|
| **1** | Estructura, Firebase, Auth Google, Roles, Rules | ✅ Completada |
| **2** | Sucursales, empleados, invitaciones, panel dueño | 🔜 Siguiente |
| **3** | Productos, imágenes, inventario, catálogo público | ⏳ Pendiente |
| **4** | Carrito, pedidos, notificaciones | ⏳ Pendiente |
| **5** | Tareas, días libres, asistencia, anuncios | ⏳ Pendiente |
| **6** | Chat interno en tiempo real | ⏳ Pendiente |
| **7** | POS, promociones, reseñas, transferencias | ⏳ Pendiente |
| **8** | Dashboards, reportes, auditoría, PWA, SEO | ⏳ Pendiente |
| **9** | Seed de datos, pruebas, despliegue final | ⏳ Pendiente |

---

## Decisiones de Arquitectura

| # | Decisión | Motivo |
|---|---|---|
| 1 | API Routes de Next.js en lugar de Express separado | Un solo servicio en Render, menos complejidad |
| 2 | Precio en subcolección `products/{id}/pricing/data` | Permite bloquear a visitantes en Firestore Rules |
| 3 | Custom claims verificados en server + rules | Nunca confiar solo en el frontend |
| 4 | Compresión de imágenes en el cliente | Reduce ancho de banda y costos de Storage |
| 5 | Invitaciones por email | El empleado no necesita existir en Auth antes de ser invitado |
| 6 | `branchIds[]` en el claim | Un dueño puede tener múltiples sucursales sin consultas extra |
| 7 | `jose` para verificar JWT en middleware | El Admin SDK no es compatible con el Edge Runtime de Next.js |
| 8 | Soft delete de usuarios | Conservar historial de auditoría + anonimizar datos personales |

---

## Licencia

Proyecto privado — Todos los derechos reservados.
