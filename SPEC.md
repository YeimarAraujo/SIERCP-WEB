# 📱 SIERCP - Sistema de Entrenamiento RCP
## Especificación de Diseño y Vistas

---

## 🎨 Paleta de Colores

| Color | Hex | Uso |
|-------|-----|-----|
| Primary | `#1800AD` | Botones principales, headers, acentos |
| Secondary | `#0E0080` | Links, acentos secundarios |
| Accent | `#2D1FD4` | Hover states, destacados |
| Background | `#FFFFFF` | Fondo principal |
| Surface | `#E5E7EB` | Fondos secundarios, cards |
| Text | `#1F2937` | Texto principal |
| Text Muted | `#6B7280` | Subtítulos, descripciones |
| Success | `#10B981` | Estados exitosos |
| Warning | `#F59E0B` | Advertencias |
| Error | `#EF4444` | Errores, acciones peligrosas |

---

## 🔤 Tipografía

- **Font Principal:** Inter (Google Fonts)
- **Headings:** Bold, sizes: 32px/24px/20px/16px
- **Body:** Regular 14px/16px
- **Caption:** Light 12px

---

## 📄 VISTAS Y PANTALLAS

### 1. LOGIN (`/login`)
**Propósito:** Autenticación de usuarios

**Elementos:**
- Logo empresarial (centro, 120x120px)
- Título: "SIERCP"
- Subtítulo: "Sistema de Entrenamiento RCP"
- Campo: Email (input con icono de email)
- Campo: Contraseña (input con icono de candado, tipo password)
- Checkbox: "Recordarme"
- Botón: "Iniciar Sesión" (primary, full width)
- Link: "¿Olvidaste tu contraseña?"
- Link: "¿No tienes cuenta? Regístrate"
- Footer pequeño: Copyright

**Estados:**
- Default, Loading (spinner en botón), Error (mensaje rojo bajo campos)

---

### 2. REGISTER (`/register`)
**Propósito:** Registro de nuevos estudiantes

**Elementos:**
- Logo (centro)
- Título: "Crear Cuenta"
- Subtítulo: "Registro de Estudiante"
- Grid 2 columnas: Nombre, Apellido
- Campo: Email
- Campo:.IDentificación
- Campo: Contraseña
- Campo: Confirmar Contraseña
- Checkbox: "Acepto términos y condiciones"
- Botón: "Crear Cuenta"
- Link: "¿Ya tienes cuenta? Inicia sesión"

---

### 3. HOME / DASHBOARD (`/home`)
**Propósito:** Vista principal después del login

**Layout:**
- Sidebar (izquierda, 260px, fijo)
- Header (superior, contenido: título + avatar usuario)
- Contenido principal (scrollable)

**Elementos del Dashboard:**
1. **Tarjeta de Bienvenida**
   - Saludo: "Hola, [Nombre] 👋"
   - Fechaactual
   - Motivación contextual

2. **Stats Grid** (4 columnas en desktop, 2 en mobile)
   - Sesiones Totales (número grande)
   - Sesiones Hoy
   - Puntaje Promedio
   - Mejor Puntaje

3. **Métricas AHA** (gráfico de barras)
   - Profundidad Promedio (mm)
   - Frecuencia Promedio (com/min)
   - Indicador de rango optimal AHA

4. **Sesiones Recientes** (lista)
   - Tarjeta por cada sesión
   - Fecha, paciente, puntuación, duración
   - Click → ir a detalle

---

### 4. COURSES (`/courses`)
**Propósito:** Lista de cursos disponibles

**Elementos:**
- Título: "Mis Cursos" o "Cursos Disponibles"
- Grid de cards de curso (3 columnas)
  - Imagen del curso
  - Título
  - Descripción corta
  - Progreso (barra)
  - Botón: "Iniciar" o "Continuar"

---

### 5. COURSE DETAIL (`/courses/[id]`)
**Propósito:** Detalle de un curso específico

**Elementos:**
- Header con título del curso
- Descripción completa
- Escenarios incluidos (lista)
- Lista de sesiones del curso
- Botón: "Iniciar Práctica"

---

### 6. SESSION PRACTICE (`/session/[id]`)
**Propósito:** Práctica guiada de RCP

**Layout:** Pantalla completa, minimize distracciones

**Elementos:**
- Timer (grande, centro superior)
- Instrucciones del escenario (texto)
- Metrónomo (indicador visual de ritmo)
- Feedback en tiempo real:
  - Profundidad (barras: muy baja/baja/ok/alta)
  - Velocidad (indicador visual)
- Botónes de control:
  - Pausar/Reanudar
  - Terminar Sesión
- Score parcial mientras practicas

---

### 7. LIVE SESSION (`/live/[sessionId]`)
**Propósito:** Sesión en vivo conectadamaniquí

**Layout:** Fullscreen, modo práctica

**Elementos:**
- Timer grande
- Métricas en tiempo real:
  - Profundidad actual
  - Ritmo actual  - Compresiones/min
  - Recomendaciones de voz/texto
- Gráfico en vivo de compresiones
- Indicador de calidad en tiempo real
- Botón emergencia: "Finalizar Sesión"

---

### 8. HISTORY (`/history`)
**Propósito:** Ver historial de sesiones

**Elementos:**
- Filtros (fecha, curso, puntuación)
- Lista de sesiones (tabla o cards)
- Por cada sesión:
  - Fecha y hora
  - Curso/Escenario
  - Puntuación final
  - Duración
  - Link: "Ver Detalle"
- Paginación

---

### 9. DEVICE (`/device`)
**Propósito:** Ver dispositivos conectados

**Elementos:**
- Título: "Dispositivos Conectados"
- Cards de dispositivos (grid)
  - Nombre/MAC del dispositivo  - Estado (conectado/desconectado)
  - Última actividad
  - Batería (si está disponible)
- Indicador de dispositivo activo (en verde)
- Refresh button

---

### 10. PROFILE (`/profile`)
**Propósito:** Ver y editar perfil de usuario

**Elementos:**
- Avatar (editable)
- Nombre completo
- Email (solo lectura)
- Rol
- Stats del usuario
- Botón: "Editar Perfil"
- Botón: "Cerrar Sesión"

---

### 11. ADMIN USERS (`/admin/users`)
**Propósito:** Administración de usuarios (solo admin)

**Elementos:**
- Tabla de usuarios
- Buscador  - Filtros (rol, estado)
- Columns: Nombre, Email, Rol, Estado, Última sesión
- Actions: Editar, Desactivar, Eliminar  - Botón: "Agregar Usuario"
-Modal de editar usuario

---

### 12. ADMIN DEVICES (`/admin/devices`)
**Propósito:** Administración de dispositivos (solo admin)

**Elementos:**
- Lista de dispositivos registrados
- MAC, Modelo, Estado, Última conexión
- Acciones: Activar/Desactivar
- Historial de conexiones

---

### LAYOUTS COMPARTIDOS

#### Sidebar
- Logo SIERCP (superior)
- Navegación:
  - Inicio (home)
  - Cursos
  - Historial
  - Dispositivos
  - Perfil (abajo)
- Para Admin: + Usuarios, + Dispositivos

#### Header
- Título de página
- Avatar usuario (click → dropdown → Perfil/Cerrar sesión)
- Notifications (opcional)

---

## 📱 Responsive Breakpoints

- **Mobile:** < 640px
- **Tablet:** 640px - 1024px
- **Desktop:** > 1024px

---

## ♿ Componentes UI Requeridos

1. Button (primary, secondary, ghost, danger)
2. Input (text, email, password, number)
3. Card
4. Modal
5. Dropdown
6. Tabs
7. Table
8. Badge (status indicators)
9. Progress Bar
10. Avatar
11. Chart (line, bar)
12. Alert/Toast
13. Skeleton (loading states)
## DESIGN QUALITY REQUIREMENTS (VERY IMPORTANT)

The generated UI must feel like a high-end SaaS product, not a basic dashboard.

Avoid generic layouts.

Include:
- Clear visual hierarchy
- Spacious layout with proper padding
- Sticky sidebar navigation
- Top navigation with page title + actions
- Cards with shadows and rounded corners (modern style)
- Data visualization (charts, graphs, progress indicators)
- Trend indicators (up/down percentages)
- Status badges (success, warning, error)
- Empty states and loading states
- Realistic microcopy (no lorem ipsum)

## DOMAIN-SPECIFIC UX (CRITICAL)

This is a CPR (RCP) training platform, so:

- Metrics must feel clinical and precise
- Use units like mm, compressions/min, %
- Highlight "optimal ranges" (AHA standards)
- Use color coding:
  - Green = correct
  - Yellow = warning
  - Red = incorrect
- Real-time feedback should feel urgent and responsive

## DESIGN INSPIRATION

Take inspiration from:
- Stripe Dashboard
- Vercel Analytics
- Linear App
- Notion (clean layout)

Avoid:
- Mobile-style layouts
- Basic bootstrap-looking UI
- Cluttered interfaces