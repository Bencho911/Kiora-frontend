# Source Code (`src/`) — Developer Guide

Esta carpeta contiene el núcleo lógico y visual de la aplicación Kiora Admin. Se sigue un patrón de separación de responsabilidades estricto inspirado en **Clean Architecture**.

---

## 🚀 Inicio Rápido (Desarrollo)

1. **Instalación**: `npm install`
2. **Ejecución**: `npm run dev`
   - La aplicación estará disponible en: **`http://localhost:8080`**
   - El puerto 8080 está configurado en `astro.config.mjs` para coincidir con el mapeo de Docker.
3. **Type-check**: `npx tsc --noEmit`
4. **Tests**: `npm run test`

---

## Estructura de Directorios

### 📂 [`components/`](./components/)
Contiene todos los componentes de React (`.tsx`). Dividido en subdominios:

- **`auth/`** — Flujo de seguridad: Login, recuperación de contraseña, verificación de código.
- **`panel/`** — Orquestadores del Dashboard administrativo:
  - `PanelApp.tsx` — Punto de entrada; gestiona rutas de tabs, drawers y autenticación.
  - `AdminNavbar.tsx` — Barra superior responsiva con notificaciones, POS y perfil.
  - `AdminSubNav.tsx` — **Bottom bar en móvil / Sidebar en desktop** (ver RESPONSIVE_PWA.md).
  - `DashboardSection.tsx` — Resumen del día, gráfica semanal, ventas recientes y stock bajo.
  - `ReportsSection.tsx` — Reportes, alertas de stock/vencimiento, incidencias técnicas.
  - `SettingsSection.tsx` — Configuración del sistema (perfil, idioma, ayuda, legal).
  - `PWAInstallPrompt.tsx` — Banner de instalación PWA (se muestra automáticamente).
  - `OfflineBanner.tsx` — Aviso sticky cuando el dispositivo pierde conexión.
- **`help/`** — Centro de Ayuda con preguntas frecuentes.
- **`ui/`** — Componentes atómicos de shadcn/ui (Button, Card, Badge, Tabs...).

### 📂 [`features/`](./features/)
Módulos de dominio con lógica, componentes y hooks propios:

- **`users/`** — `UserList`, `UserDrawer`, `ProfileDrawer`, `SecurityDrawer`, hooks de gestión.
- **`products/`** — `ProductsSection`, `CategoriasSection` con CRUD y búsqueda difusa (Fuse.js).
- **`sales/`** — `SalesSection`, `OrderDrawer` (POS), `StripeQRModal`.
- **`inventory/`** — `InventarioSection`, control de proveedores y movimientos de stock.

### 📂 [`core/`](./core/)
Abstracciones de infraestructura compartidas:
- **`http/`** — `HttpClient.ts`: cliente base con interceptores de autenticación JWT y manejo de errores 401.
- **`ui/`** — Notificaciones globales y servicios de alerta (`AlertService`).

### 📂 [`services/`](./services/)
Lógica de negocio y comunicación con la API. **Todas las llamadas HTTP deben pasar por aquí**, nunca directamente desde componentes.

| Servicio | Responsabilidad |
|----------|----------------|
| `ProductService` | Catálogo, categorías, búsqueda |
| `InventoryService` | Existencias, proveedores, movimientos |
| `OrderService` | Ventas, POS, Stripe, recibos PDF |
| `ReportService` | Reportes, exportación Excel/PDF, incidencias |
| `AuthService` | Sesiones JWT, login, logout, refresh |
| `UserService` | CRUD de usuarios, cambio de contraseña |

### 📂 [`store/`](./store/)
Estado global con **Zustand** (sin Redux, sin Context innecesario):

- `useAppStore` — Tab activo del panel.
- `useSalesStore` — Carrito POS, drawer de pedidos, estado Stripe.
- `useInventoryStore` — Items de stock bajo, sincronización.
- `useNotificationStore` — Notificaciones en tiempo real del sistema.

### 📂 [`hooks/`](./hooks/)
Custom hooks que encapsulan lógica reutilizable:

- `useAuth` — Carga y valida la sesión del usuario.
- `usePanelUrlSync` — Sincroniza el tab activo con la URL (`?tab=ventas`).
- `useRealTimeUpdates` — Suscripción a eventos Socket.IO para sincronización en vivo.
- `useReportsManager` — Lógica completa del módulo de reportes.

### 📂 [`models/`](./models/)
Interfaces y tipos TypeScript que definen los contratos de datos. Siempre úsalas para garantizar la consistencia entre frontend y backend.

### 📂 [`pages/`](./pages/)
Rutas de la aplicación gestionadas por **Astro**:

| Ruta | Descripción |
|------|-------------|
| `/` → `/login` | Redirección al login |
| `/login` | Formulario de autenticación |
| `/panel` | Dashboard administrativo (protegido) |
| `/recuperar-contrasena` | Solicitud de reset de contraseña |
| `/reset-password` | Formulario de nueva contraseña |
| `/ayuda` | Centro de ayuda público |
| `/payment-success` | Callback de pago exitoso (Stripe) |
| `/payment-cancel` | Callback de pago cancelado (Stripe) |

### 📂 [`styles/`](./styles/)
`global.css` — Tailwind CSS v4 + variables de diseño, fixes mobile y utilidades.

### 📂 [`config/`](./config/)
- `setup.ts` — Inicialización de todos los servicios (DI container manual).
- `theme.ts` — Tokens de color y diseño de la marca Kiora.

---

## 💡 Reglas para Desarrolladores

1. **Lógica Extraída**: Toda llamada a la API debe vivir en un `Service`, nunca directamente en el componente React.
2. **Sincronización BE**: Sigue estrictamente los contratos definidos en el backend (ver `setup.ts` para la URL base del Gateway).
3. **Tipado**: Usa siempre las interfaces de `models/` para garantizar consistencia.
4. **Estado Global**: Usa los stores de Zustand. Evita `useState` para estado que múltiples componentes necesiten.
5. **Responsividad**: Todo componente nuevo debe ser probado en móvil (360px), tablet (768px) y desktop (1280px).
6. **PWA**: Si agregas nuevas rutas importantes, agrégalas al manifest `shortcuts` y al array `STATIC_ASSETS` del service worker.

---

## 📘 Documentación Técnica

- 👉 **[TECHNICAL_DOCS.md](./TECHNICAL_DOCS.md)** — Arquitectura, patrones y módulos.
- 👉 **[../RESPONSIVE_PWA.md](../RESPONSIVE_PWA.md)** — Guía completa de responsividad y PWA.
- 👉 **[../SECURITY.md](../SECURITY.md)** — Modelo de amenazas y seguridad.
