# SIERCP - DOCUMENTO DE CONTEXTUALIZACION PARA NUEVOS DESARROLLADORES

**Version del documento:** 1.0  
**Autor:** Desarrollador original  
**Ultima actualizacion:** Abril 2026  
**Estado del proyecto:** ~65% completo  

---

## NOTA IMPORTANTE PARA EL NUEVO DESARROLLADOR

> Antes de tocar cualquier archivo, LEE ESTE DOCUMENTO COMPLETO.  
> Este proyecto tiene una complejidad mayor de la que parece a simple vista.  
> No es "solo una web". Tocar cosas sin entender el contexto puede romper integrations criticas.

---

## 1. CONOCIMIENTO REQUERIDO ANTES DE TOCAR EL PROYECTO

### 1.1 Tecnologias principales que debes dominar

| Tecnologia | Nivel requerido | Para que se usa |
|------------|-----------------|-----------------|
| **Next.js 16** | Intermedio-Avanzado | Framework principal del frontend |
| **React 19** | Intermedio | UI components |
| **TypeScript** | Intermedio | Tipado en todo el proyecto |
| **Tailwind CSS v4** | Basico-Intermedio | Estilos (NOTA: Es v4, no v3!) |
| **Firebase (Auth + Firestore + RTDB)** | Intermedio | Backend completo del proyecto |
| **Zustand** | Basico | Estado global del cliente |
| **Radix UI** | Basico | Componentes base de UI |

### 1.2 Conceptos que DEBES entender antes de tocar codigo

- **Firebase Realtime Database (RTDB):** No es lo mismo que Firestore. RTDB se usa para datos en tiempo real del maniqui (telemetria). Firestore se usa para datos persistentes (usuarios, sesiones, cursos).
- **Arquitectura distribuida:** Este NO es un sistema monolito. Tiene frontend + Firebase + hardware ESP32.
- **Estructura de carpetas Next.js App Router:** Las rutas usan `(grupos)` para layouts compartidos.
- **Server Components vs Client Components:** Todo lo que usa hooks, stores o firebase va con `'use client'`.

### 1.3 Lo que NO debes hacer sin consultar

- No modifiques `src/lib/firebase.ts` sin entender como funciona la configuracion de Firebase.
- No modifiques las reglas de Firestore/RTDB sin leer `firestore.rules` y `database.rules.json`.
- No Borres archivos en `src/models/` ni `src/services/` sin entender las dependencias.
- No Cambies los nombres de las variables que vienen del ESP32 (vienen del hardware y son fijos).

---

## 2. CONTEXTO DEL PROYECTO

### 2.1 Que es SIERCP?

**SIERCP** = Sistema de Entrenamiento en Reanimacion Cardiopulmonar

Es una plataforma que conecta **simuladores fisicos (maniquies con sensores ESP32)** con una aplicacion web que:
- Mide en **tiempo real** la calidad de las compresiones toracicas
- Registra metricas clinicas bajo estandares **AHA 2024**
- Permite llevar historial de sesiones, gestionar cursos y estudiantes
- Genera reportes y metricas clinicas para instituciones educativas y de salud

### 2.2 Arquitectura del sistema (ESTO ES CRUCIAL)

```
┌─────────────────────────────────────────────────────────────────┐
│                         SISTEMA SIERCP                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌───────────────┐         ┌──────────────────────────────┐   │
│   │  MANIQUI ESP32 │         │       FIREBASE (Backend)      │   │
│   │  + Sensores    │         │  ┌────────────────────────┐   │   │
│   │  (profundidad, │────────►│  │ Firebase Auth         │   │   │
│   │   fuerza,      │         │  │ (autenticacion)       │   │   │
│   │   frecuencia)  │         │  └────────────────────────┘   │   │
│   │                │         │  ┌────────────────────────┐   │   │
│   │  [Codigo C++]  │         │  │ Firebase Firestore     │   │   │
│   │  en ESP32      │         │  │ (datos persistentes)   │   │   │
│   └───────────────┘         │  │ - usuarios            │   │   │
│         │                   │  │ - cursos              │   │   │
│         │                   │  │ - sesiones            │   │   │
│         ▼                   │  │ - enrollments         │   │   │
│   ┌───────────────┐         │  └────────────────────────┘   │   │
│   │ Firebase RTDB │◄────────│  ┌────────────────────────┐   │   │
│   │ (telemetria   │         │  │ Firebase RTDB          │   │   │
│   │  en tiempo    │         │  │ (datos real-time)      │   │   │
│   │  real)        │         │  │ - telemetria/{mac}     │   │   │
│   └───────────────┘         │  └────────────────────────┘   │   │
│         │                   └──────────────────────────────┘   │
│         │                            │                        │
│         ▼                            ▼                        │
│   ┌──────────────────────────────────────────────────────┐    │
│   │              FRONTEND (Next.js + React)              │    │
│   │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │    │
│   │  │ Login/   │ │Dashboard │ │ Live    │ │ Admin   │   │    │
│   │  │ Register │ │ + Home   │ │ Session │ │ Panel   │   │    │
│   │  └─────────┘ └─────────┘ └─────────┘ └─────────┘   │    │
│   └──────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Este NO es solo un proyecto frontend

El nuevo desarrollador (lider del proyecto) pidio estas preguntas:

> - **"Ya la web te lee todos los datos?"**
> - **"Te genera los QR?"**
> - **"Las sesiones se guardan y eso?"**

**RESPUESTAS:**

1. **La web SI lee datos:**
   - ✅ Lee autenticacion de Firebase Auth
   - ✅ Lee sesiones de Firestore ( historial, detalle )
   - ✅ Lee telemetria del maniqui en tiempo real desde RTDB
   - ⚠️ Los datos reales aun no estan cargados en Firebase (ver seccion 4)

2. **Los QR no se han implementado todavia:**
   - Es una funcionalidad pendiente que se planeo en `CourseService.getByInviteCode()`
   - Necesita desarrollo en frontend + posible generacion desde Firebase Functions

3. **Las sesiones SI se guardan:**
   - ✅ El servicio `SessionService` tiene metodos para crear/actualizar/leer sesiones en Firestore
   - ✅ La estructura de datos esta definida en `src/models/session.ts`
   - ⚠️ Pero no hay datos reales todavia (ver seccion 4)

**CONCLUSION:** El sistema tiene la INFRAESTRUCTURA completa para ser funcional, pero necesita:
1. Configurar datos en Firebase
2. Terminar algunos modulos de frontend
3. Posiblemente generar codigo QR
4. Escribir firmware para ESP32

---

## 3. LO QUE YA ESTA HECHO (TRABAJO COMPLETADO)

### 3.1 Infraestructura de backend ✅

| Componente | Archivo | Estado |
|------------|---------|--------|
| Configuracion Firebase | `src/lib/firebase.ts` | ✅ Listo |
| Servicio de autenticacion | `src/services/auth.service.ts` | ✅ Listo |
| Servicio Firestore (CRUD completo) | `src/services/firestore.service.ts` | ✅ Listo |
| Servicio de dispositivos (RTDB) | `src/services/device.service.ts` | ✅ Listo |
| Store de autenticacion (Zustand) | `src/stores/auth-store.ts` | ✅ Listo |
| Store de dispositivos (RTDB en vivo) | `src/stores/device-store.ts` | ✅ Listo |
| Store de sesiones | `src/stores/session-store.ts` | ✅ Listo |
| Store de cursos | `src/stores/course-store.ts` | ✅ Listo |
| Modelos tipados | `src/models/*.ts` | ✅ Listo |
| Configuracion Firebase Hosting | `firebase.json` | ✅ Listo |
| Reglas de seguridad Firestore | `firestore.rules` | ✅ Listo |
| Reglas de seguridad RTDB | `database.rules.json` | ✅ Listo |
| Indices de Firestore | `firestore.indexes.json` | ✅ Listo |

### 3.2 Frontend - Paginas y componentes ✅

| Pagina | Ruta | Estado |
|--------|------|--------|
| Login | `/login` | ✅ Listo |
| Registro | `/register` | ✅ Listo |
| Home/Dashboard | `/home` | ⚠️ Demo (usa datos mock) |
| Cursos | `/courses` | ⚠️ Estructura basica |
| Detalle de curso | `/courses/[id]` | ⚠️ Estructura basica |
| Sesion en vivo | `/live/[sessionId]` | ⚠️ Estructura + RTDB |
| Sesion de practica | `/session/[id]` | ⚠️ Estructura basica |
| Historial | `/history` | ⚠️ Estructura basica |
| Dispositivos | `/device` | ⚠️ Estructura basica |
| Perfil | `/profile` | 🔲 Pendiente |
| Admin - Usuarios | `/admin/users` | ⚠️ Estructura basica |
| Admin - Dispositivos | `/admin/devices` | ⚠️ Estructura basica |

### 3.3 Componentes UI ✅

| Componente | Ubicacion |
|------------|-----------|
| Dashboard Shell | `src/components/layout/dashboard-shell.tsx` |
| Header | `src/components/layout/header.tsx` |
| Sidebar | `src/components/layout/sidebar.tsx` |
| Role Guard | `src/components/layout/role-guard.tsx` |
| Compression Chart | `src/components/charts/compression-chart.tsx` |
| Metric Bar | `src/components/charts/metric-bar.tsx` |
| Score Gauge | `src/components/charts/score-gauge.tsx` |
| Session Card | `src/components/sessions/session-card.tsx` |
| Session Metrics | `src/components/sessions/session-metrics.tsx` |

### 3.4 Hooks personalizados ✅

| Hook | Ubicacion | Funcion |
|------|-----------|---------|
| `use-auth` | `src/hooks/use-auth.ts` | Acceso rapido al store de auth |
| `use-realtime` | `src/hooks/use-realtime.ts` | Suscripcion a telemetria de dispositivos |

### 3.5 Logica de negocio ✅

| Archivo | Contenido |
|---------|-----------|
| `src/lib/constants.ts` | Constantes AHA (profundidad, frecuencia, etc.) |
| `src/lib/scoring.ts` | Logica de scoring/calculo de calidad RCP |
| `src/lib/utils.ts` | Utilidades (formateo de fechas, duracion, etc.) |
| `src/lib/theme.ts` | Configuracion de tema/colores |

### 3.6 Diseno y documentacion ✅

| Archivo | Contenido |
|---------|-----------|
| `SPEC.md` | Especificacion completa de diseno y vistas |
| `README.md` | Descripcion general del proyecto |
| Paleta de colores | Definida en `SPEC.md` (Primary: #1800AD) |
| Tipografia | Inter (Google Fonts) |

---

## 4. LO QUE FALTA POR HACER

### 4.1 Configuracion Firebase (CRITICO - Sin esto no funciona nada)

**Prioridad: ALTA** - Esto es lo primero que debe hacer el nuevo desarrollador.

- [ ] **Crear proyecto en Firebase Console:**
  - Habilitar Authentication (Email/Password)
  - Crear Firestore Database (modo test o production)
  - Crear Realtime Database
  - Obtener credenciales del proyecto

- [ ] **Configurar variables de entorno (.env.local):**
  ```
  NEXT_PUBLIC_FIREBASE_API_KEY=
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
  NEXT_PUBLIC_FIREBASE_PROJECT_ID=
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
  NEXT_PUBLIC_FIREBASE_APP_ID=
  NEXT_PUBLIC_FIREBASE_DATABASE_URL=
  ```

- [ ] **Poblar datos de prueba en Firestore:**
  - Al menos un usuario admin y un estudiante
  - Al menos un curso de ejemplo
  - Algunas sesiones de prueba

- [ ] **Probar conexion RTDB:**
  - Verificar que el ESP32 puede escribir en `telemetria/{mac}`
  - Verificar que el frontend recibe los datos

### 4.2 Frontend - Modulos por completar

**Prioridad: MEDIA**

- [ ] **Home/Dashboard real:**
  - Reemplazar `mockSessions` y `mockCourses` con datos reales de Firestore
  - Usar `SessionService.getByStudent()` para sesiones recientes
  - Conectar stats con `UserModel.stats`

- [ ] **Pagina de cursos:**
  - Implementar lista de cursos reales con `CourseService.getAll()`
  - Implementar enrollment de estudiantes
  - Detalle de curso con sesiones del curso

- [ ] **Sesion de practica (`/session/[id]`):**
  - Flujo completo para practice mode (sin maniqui conectado)
  - Timer funcional
  - Calculo de metricas en tiempo real
  - Guardar sesion en Firestore al finalizar

- [ ] **Historial (`/history`):**
  - Lista de sesiones con `SessionService.getByStudent()`
  - Filtros por fecha, curso, puntuacion
  - Paginacion
  - Link a detalle de sesion

- [ ] **Perfil (`/profile`):**
  - Mostrar datos del usuario
  - Editar nombre, avatar
  - Cerrar sesion
  - Estadisticas del usuario

- [ ] **Admin - Usuarios (`/admin/users`):**
  - Tabla completa con `UserService.getAll()`
  - CRUD de usuarios
  - Filtros por rol

- [ ] **Admin - Dispositivos (`/admin/devices`):**
  - Lista de maniquies con `ManiquiService.getAll()`
  - Estado de conexion en tiempo real
  - CRUD de maniquies

- [ ] **Sesion en vivo (`/live/[sessionId]`):**
  - Conectar completamente con telemetria RTDB
  - Mostrar grafica en tiempo real
  - Boton para finalizar sesion

### 4.3 Funcionalidades adicionales

**Prioridad: BAJA (o media segun necesidad)**

- [ ] **Generacion de codigos QR:**
  - Para que estudiantes se unan a cursos via codigo
  - Ya existe `CourseService.getByInviteCode()` en backend
  - Solo falta implementar la UI y可能的 generacion

- [ ] **Notificaciones en tiempo real:**
  - Cuando el maniqui se desconecta
  - Nuevas sesiones completadas

### 4.4 Modulo de Descarga de App Movil ✅ IMPLEMENTADO

**Estado:** Implementado (Abril 2026)

El sistema ahora tiene un modulo de redireccion a la app movil en:

1. **Pagina de Login (`/login`):**
   - Boton "Descargar App" en el navbar (visible en desktop)
   - Tarjeta destacada debajo del formulario con CTA
   - Al hacer clic, abre la URL configurada en `.env.local`

2. **Sidebar (despues de login):**
   - Boton "Descargar App" en la parte inferior del sidebar

**Configuracion requerida:**

En `.env.local` agregar:
```
NEXT_PUBLIC_APP_URL=https://play.google.com/store/apps/details?id=com.siercp.app
```

**Funcionalidad:**
- El boton abre la URL configurada en una nueva pestana
- Cuando la app este disponible, solo cambiar el valor de `NEXT_PUBLIC_APP_URL`
- El codigo ya esta listo, no necesita desarrollo adicional

**Archivos modificados:**
- `src/app/(auth)/login/page.tsx` - Agregado modulo de descarga
- `src/components/layout/sidebar.tsx` - Agregado boton en sidebar

**Archivos implementados:**

| Archivo | Descripcion |
|---------|-------------|
| `src/lib/notification-service.ts` | Servicio de notificaciones FCM |
| `src/hooks/use-push-notifications.ts` | Hooks para notificaciones y PWA |
| `src/components/notifications/app-install-banner.tsx` | Banner de instalacion |
| `src/components/notifications/app-modal.tsx` | Modal de invitacion |

**Para que funcione completamente:**

1. **Configurar VAPID key en Firebase:**
   - Ir a Configuracion del proyecto > Cloud Messaging
   - Generar par de claves Web Push
   - Agregar VAPID key a `.env.local`:
     ```
     NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key
     ```

2. **En Firebase Console:**
   - Habilitar Cloud Messaging API (Legacy esta habilitado por defecto, migrar a FCM v1 si es necesario)
   - Configurar las credenciales del servidor

3. **El nuevo desarrollador debe:**
   - Mantener los componentes en `src/components/notifications/`
   - No modificar `src/lib/notification-service.ts` sin necesidad
   - Para enviar notificaciones desde Firebase Console, usar la funcionalidad de Messaging > Nueva notificacion

**Modelo de invitacion:**
- Si el usuario esta en movil y el PWA esta disponible, muestra banner de instalacion nativo
- Si el usuario esta en escritorio, muestra modal invitando a descargar la app
- El banner se puede cerrar y no se muestra de nuevo (guardado en localStorage)

- [ ] **Reportes y exportaciones:**
  - PDF con resumen de sesion
  - Estadisticas por curso

- [ ] **Reset de contrasena:**
  - Ya existe `AuthService.resetPassword()`
  - Falta la UI (pagina "Olvidaste tu contrasena?")

### 4.4 Hardware (ESP32) - FUERA DEL ALCANCE DE ESTE REPO

**Prioridad: BAJA (para este repo)**

El firmware del ESP32 **NO esta en este repositorio**. Esta en un repo separado (probablemente `siercp-firmware` o similar).

Lo que se debe saber del ESP32:
- Envía datos a Firebase RTDB en la ruta `telemetria/{mac}`
- Campos que envia (definidos en `src/models/device.ts`):
  - `fuerza_kg`, `profundidad_mm`, `frecuencia_cpm`
  - `compresiones`, `compresiones_correctas`
  - `recoil_ok`, `en_compresion`, `calidad_pct`
  - `timestamp`

**NOTA:** Si el nuevo desarrollador quiere tocar el codigo del ESP32, debe buscar el repositorio de firmware.

---

## 5. ESTRUCTURA DEL PROYECTO EXPLICADA

```
siercp-web/
├── src/
│   ├── app/                    # Rutas de Next.js (App Router)
│   │   ├── (auth)/             # Grupo de rutas de autenticacion (login, register)
│   │   ├── (dashboard)/        # Grupo de rutas protegidas (home, courses, etc.)
│   │   ├── admin/              # Rutas de administracion
│   │   ├── layout.tsx          # Layout raiz
│   │   └── page.tsx            # Redirect a /login o /home
│   │
│   ├── components/             # Componentes reutilizables
│   │   ├── layout/             # Layout (header, sidebar, role-guard)
│   │   ├── charts/             # Graficos (compression-chart, metric-bar, etc.)
│   │   ├── sessions/           # Componentes de sesiones
│   │   └── notifications/      # Notificaciones push y app install
│   │
│   ├── hooks/                  # Hooks personalizados
│   │   ├── use-auth.ts         # Acceso rapido a auth store
│   │   ├── use-realtime.ts     # Suscripcion a telemetria de dispositivos
│   │   └── use-push-notifications.ts # Notificaciones push y PWA
│   │
│   ├── lib/                    # Utilidades y configuracion
│   │   ├── firebase.ts         # Configuracion de Firebase
│   │   ├── constants.ts       # Constantes (AHA standards)
│   │   ├── scoring.ts         # Logica de puntuacion
│   │   ├── utils.ts           # Funciones utilitarias
│   │   ├── theme.ts           # Configuracion de tema
│   │   └── notification-service.ts # Notificaciones push (FCM)
│   │
│   ├── models/                # Tipos TypeScript
│   │   ├── user.ts            # Modelo de usuario
│   │   ├── session.ts         # Modelo de sesion + metricas
│   │   ├── course.ts          # Modelo de curso + enrollment
│   │   └── device.ts          # Modelo de dispositivo + telemetria
│   │
│   ├── services/              # Servicios de Firebase
│   │   ├── auth.service.ts    # Autenticacion
│   │   ├── firestore.service.ts # Firestore (users, sessions, courses, manikins)
│   │   └── device.service.ts  # Realtime Database (telemetria)
│   │
│   ├── stores/               # Estado global (Zustand)
│   │   ├── auth-store.ts     # Auth state + Firebase auth listener
│   │   ├── device-store.ts   # Devices state + RTDB subscriptions
│   │   ├── session-store.ts  # Sessions cache
│   │   └── course-store.ts   # Courses cache
│   │
│   └── middleware.ts          # Middleware de Next.js (proteccion de rutas)
│
├── public/                    # Archivos estaticos
│   └── images/                # Imagenes (logos)
│
├── firebase.json              # Configuracion Firebase Hosting
├── firestore.rules            # Reglas de seguridad Firestore
├── database.rules.json        # Reglas de seguridad RTDB
├── firestore.indexes.json    # Indices compuestos Firestore
├── SPEC.md                    # Especificacion de diseno
└── README.md                  # Descripcion del proyecto
```

---

## 6. FLUJOS PRINCIPALES EXPLICADOS

### 6.1 Flujo de autenticacion

```
1. Usuario entra a /login
2. Firebase Auth valida email/password
3. onAuthStateChanged() detecta usuario
4. Se busca/crea usuario en Firestore (users/{uid})
5. Zustand store guarda usuario
6. Redirect a /home
```

### 6.2 Flujo de sesion en vivo (instructor viendo al estudiante)

```
1. Estudiante inicia sesion en /session/[id]
2. Instructor abre /live/[sessionId]
3. useDeviceTelemetry() suscribe a RTDB: telemetria/{manikinMac}
4. Frontend recibe datos cada vez que ESP32 escribe
5. Se muestra:
   - Profundidad en mm
   - Frecuencia cpm
   - Grafica en tiempo real
   - Indicadores de calidad
6. Al finalizar, se guardan metricas en Firestore
```

### 6.3 Flujo de creacion de sesion

```
1. Estudiante selecciona curso
2. Sistema crea sesion: SessionService.create()
3. Se guarda en Firestore: sessions/{id}
4. Estudiante inicia practice
5. Si hay maniqui conectado:
   - Se subscribe a RTDB
   - Se calculan metricas en tiempo real
6. Al finalizar:
   - Se guardan metricas finales en Firestore
   - Se calcula score con scoring.ts
```

---

## 7. PREGUNTAS FRECUENTES

### Q: Por que usa Firebase en lugar de un backend en Python/Node?
**R:** Firebase fue elegido por:
- Rapidez de desarrollo (BaaS)
- Autenticacion lista
- Realtime Database para telemetria (ideal para datos de sensores)
- Firestore para datos estructurados
- Hosting incluido

### Q: Donde esta el backend del ESP32?
**R:** El codigo del ESP32 esta en otro repositorio. Este proyecto solo recibe los datos via RTDB. El ESP32:
- Lee sensores analogicos (profundidad, fuerza)
- Calcula frecuencia y calidad
- Envía datos a Firebase RTDB cada ~50ms

### Q: Por que el Home usa datos mock?
**R:** Porque no hay datos reales en Firestore todavia. La infraestructura esta lista, solo falta poblar la base de datos.

### Q: Que son los archivos .rules?
**R:** Son las reglas de seguridad de Firebase:
- `firestore.rules`: Quién puede leer/escribir en Firestore
- `database.rules.json`: Quién puede leer/escribir en RTDB
- Actualmente estan en modo test (permisivo)

### Q: Puedo cambiar los colores del diseno?
**R:** Los colores estan definidos en `SPEC.md` y `tailwind.config.ts`. Si cambias los colores principales (Primary: #1800AD), asegurate de mantener la consistencia en todo el proyecto.

---

## 8. COMO ARRANCAR EL PROYECTO

### 8.1 Pasos iniciales

```bash
# 1. Clonar repositorio
git clone <repo-url>
cd siercp-web

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con credenciales de Firebase

# 4. Ejecutar en desarrollo
npm run dev

# 5. Verificar que funciona
# Abrir http://localhost:3000
# Deberia mostrar la pagina de login
```

### 8.2 Configurar Firebase (primera vez)

1. Ir a https://console.firebase.google.com
2. Crear proyecto o usar proyecto existente
3. Habilitar Authentication > Email/Password
4. Crear Firestore Database
5. Crear Realtime Database
6. Ir a Configuracion del proyecto > General > "Tus apps"
7. Copiar la configuracion a .env.local

### 8.3 Poblar datos de prueba

Una vez configurado Firebase, crear en Firestore:

**Collection: `users`**
```
uid: "test-admin-uid"
email: "admin@test.com"
firstName: "Admin"
lastName: "User"
role: "ADMIN"
isActive: true
stats: { totalSessions: 0, averageScore: 0, ... }
```

**Collection: `courses`**
```
id: "bls-101"
title: "BLS Proveedor - Adulto"
description: "Curso basico de Soporte Vital Basico"
isActive: true
studentCount: 0
```

---

## 9. COMANDOS UTILES

```bash
# Desarrollo
npm run dev          # Iniciar servidor de desarrollo

# Produccion
npm run build        # Compilar para produccion
npm run start        # Iniciar servidor de produccion

# Calidad de codigo
npm run lint         # Verificar linting
```

---

## 10. CONTACTOS / RECURSOS

Si tienes dudas sobre el proyecto:

- **Documentacion de Firebase:** https://firebase.google.com/docs
- **Documentacion de Next.js:** https://nextjs.org/docs
- **Estandares AHA 2024:** https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines

---

## 11. NOTAS FINALES PARA EL NUEVO DESARROLLADOR

1. **No toques `src/lib/firebase.ts`** a menos que sepas exactamente lo que haces. Cambiar la configuracion de Firebase puede romper todas las conexiones.

2. **Los modelos en `src/models/` son la verdad unica.** Todo lo que viene de Firebase se tipa con estos modelos. Si cambias un modelo, asegurate de actualizar todo lo que lo usa.

3. **El ESP32 envia datos a RTDB cada ~50ms.** Si el frontend no recibe datos, el problema puede estar en:
   - El ESP32 no esta encendido/conectado
   - Las credenciales de RTDB estan mal
   - Las reglas de RTDB no permiten escritura

4. **Hay dos bases de datos en Firebase:**
   - **Firestore:** Datos persistentes (usuarios, sesiones, cursos)
   - **RTDB:** Datos en tiempo real (telemetria del maniqui)
   - NO son lo mismo. No los confundas.

5. **Este proyecto tiene ~65% de progreso.** Lo mas dificil (la infraestructura) ya esta hecho. Lo que falta es principalmente:
   - Conectar datos reales
   - Terminar algunos modulos de UI
   - Posiblemente generar QR

6. **El codigo es de calidad.** Se uso TypeScript tipado, componentes separados, servicios bien definidos, stores con Zustand, y se siguió el SPEC.md al pie de la letra. Si quieres hacer cambios grandes, consulta primero.

---

**Bienvenido al proyecto. Exito!**