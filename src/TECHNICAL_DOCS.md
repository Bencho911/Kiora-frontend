# Documentación Técnica Global — Kiora Admin Frontend

Arquitectura, módulos, patrones técnicos y decisiones de diseño de la aplicación.  
Última actualización: Mayo 2026.

---

## 1. Arquitectura General

La aplicación sigue los principios de **Arquitectura Limpia**, separando la infraestructura de la lógica de negocio para facilitar el mantenimiento y la escalabilidad.

### Estructura de Capas

```
┌─────────────────────────────────────────────┐
│         PRESENTACIÓN (React Components)      │
│   components/panel/  •  features/*/components│
├─────────────────────────────────────────────┤
│         ESTADO GLOBAL (Zustand Stores)       │
│   useAppStore  •  useSalesStore  •  etc.     │
├─────────────────────────────────────────────┤
│         LÓGICA DE NEGOCIO (Services)         │
│   OrderService  •  ProductService  •  etc.   │
├─────────────────────────────────────────────┤
│         INFRAESTRUCTURA (Core)               │
│   HttpClient  •  AlertService                │
└─────────────────────────────────────────────┘
```

- **`src/core/`** — Cliente HTTP con interceptores de seguridad: inyección de token JWT, manejo automático de errores 401 (redirección al login).
- **`src/services/`** — Casos de Uso. Gestión de la comunicación con microservicios y lógica de estados.
- **`src/models/`** — Contratos de datos (Interfaces TypeScript) compartidos en toda la app.
- **`src/components/`** + **`src/features/`** — Capa de presentación modular en React v19.

---

## 2. Módulos Destacados

### 2.1 Panel Principal (`PanelApp.tsx`)

Orquestador central que:
- Valida la sesión del usuario mediante `useAuth`.
- Sincroniza el tab activo con la URL via `usePanelUrlSync`.
- Inicia el monitoreo de sesión (`SessionManager`).
- Persiste el carrito POS en `localStorage` por usuario.
- Renderiza el módulo activo mediante `React.lazy()` + `Suspense` (code splitting automático).
- Monta el `PWAInstallPrompt` para ofrecer la instalación nativa.

### 2.2 Navegación Responsiva

**`AdminSubNav.tsx`** implementa dos layouts en uno:
- **Desktop (`lg:`)** — Sidebar vertical fijo a la izquierda, íconos con tooltips hover.
- **Móvil/Tablet (< `lg`)** — Bottom tab bar fijo al fondo, íconos con labels pequeños, respeta el safe-area de iOS.

**`AdminNavbar.tsx`** — Barra superior que adapta sus botones:
- **Desktop** — "Punto de venta" con texto completo + "Salir" con texto.
- **Móvil** — Íconos compactos para POS, notificaciones, avatar y salir.

### 2.3 Punto de Venta (POS) e Inventario

- **Validación en Cliente**: El `OrderDrawer` implementa validación reactiva de stock. No se permite agregar más unidades de las disponibles físicamente.
- **Carrito Persistente**: Se guarda en `localStorage` con clave `kiora_cart_{userId}`.
- **Stripe QR**: `StripeQRModal` muestra el QR de pago y hace polling para detectar el pago completado.

### 2.4 Gestión de Ventas y Pedidos

- **Integridad de Estados**: Los pedidos "cancelados" entran en estado de solo lectura.
- **Facturación Histórica**: Sub-módulo separado del flujo "live" de pedidos pendientes.
- **Real-Time**: `useRealTimeUpdates` suscribe a Socket.IO para recibir eventos de nuevas ventas y stock.

### 2.5 Reportes y Exportación

- **Motor Excel**: `xlsx` para reportes dinámicos con múltiples hojas.
- **PDFs**: `jsPDF` + `autoTable` para tickets de venta y facturas legales.
- **Exportación Contextual**: Identifica automáticamente el tipo de reporte (ventas, facturas, incidencias) según el tab activo.

### 2.6 PWA (Progressive Web App)

Ver detalles completos en **[../RESPONSIVE_PWA.md](../RESPONSIVE_PWA.md)**.

Resumen técnico:
- **`public/sw.js`** v3 — Network-First para HTML, Cache-First para assets estáticos, soporte de Push Notifications.
- **`public/manifest.webmanifest`** — Nombre, íconos, color, `display_override`, shortcuts de app.
- **`PWAInstallPrompt.tsx`** — Detecta el evento `beforeinstallprompt`, lo difiere y muestra un banner 3s después del primer load. Respeta si el usuario ya descartó la instalación (via `sessionStorage`).

### 2.7 Seguridad Administrativa

- **Reseteo de Credenciales**: Administradores pueden forzar reseteo de contraseñas con flujo de confirmación.
- **Bloqueo de Usuarios**: `onToggleBlock` bloquea/desbloquea acceso de operarios.
- **AuthService**: Persistencia de tokens JWT, manejo de sesión expirada con `SessionManager`.

---

## 3. Patrones de Diseño

### Inversión de Dependencias (DI Manual)
Los servicios se inicializan en `src/config/setup.ts`. Los componentes consumen instancias únicas y configuradas, facilitando mocks en testing.

```ts
// src/config/setup.ts
export const httpClient = new HttpClient(PUBLIC_API_URL, { apiKey: PUBLIC_API_KEY });
export const productService = new ProductService(httpClient);
export const orderService = new OrderService(httpClient);
// ...
```

### Saga y Compensación (Integración)
El frontend respeta la lógica de **Saga** del backend. Si el backend falla al descontar stock durante una transición a "completada", se captura el error (409) y se notifica al usuario para evitar inconsistencias visuales.

### Lazy Loading con Code Splitting
Todos los módulos pesados del panel se cargan on-demand:
```tsx
const DashboardSection = lazy(() => import('./DashboardSection'));
const ReportsSection   = lazy(() => import('./ReportsSection'));
// ...
```

### Zustand como Single Source of Truth
Estado global sin boilerplate. Cada dominio tiene su store independiente:
- **`useAppStore`** → tab activo.
- **`useSalesStore`** → carrito, drawer POS, Stripe.
- **`useInventoryStore`** → stock bajo, sincronización.
- **`useNotificationStore`** → notificaciones en tiempo real.

---

## 4. Real-Time y Sincronización

El hook `useRealTimeUpdates` se conecta al backend via **Socket.IO** y escucha eventos:

| Evento | Acción |
|--------|--------|
| `nueva-venta` | Incrementa `salesSyncVersion` → recarga ventas |
| `stock-actualizado` | Incrementa `stockSyncVersion` → recarga inventario |
| `orden-pagada` | Marca orden como completada y dispara notificación |

---

## 5. Tecnologías y Estándares

### 5.1 UI y Estilos

- **Tailwind CSS v4** — Motor de utilidades. Configurado con `@theme` para tokens de la marca.
- **shadcn/ui** — Componentes accesibles: `Button`, `Card`, `Badge`, `Tabs`, `Dialog`.
- **SweetAlert2** — Confirmaciones y alertas de sistema unificadas.
- **Recharts** — Gráfica de área para evolución de ventas en el Dashboard.
- **Tokens de Diseño**:
  - Brand Red: `#ec131e` (`--color-kiora-red`)
  - Brand Brown: `#3E2723` (navbar y sidebar)
  - Surface: `#f8fafc`
  - Tipografía: Geist Variable (principal) + Inter (UI)

### 5.2 Accesibilidad (a11y)

- Todos los botones interactivos tienen `aria-label` o texto visible.
- El panel de notificaciones tiene roles ARIA correctos.
- El bottom bar en móvil usa `role="navigation"`.
- Focus visible en todos los elementos interactivos.

---

## 6. Mantenimiento y Buenas Prácticas

1. **Lógica en Servicios**: Las llamadas a la API están prohibidas dentro de los componentes. Siempre a través de un `Service`.
2. **Consistencia Visual**: Utilizar los tokens de color de `global.css` y `theme.ts`.
3. **Manejo de Errores**: Usar `getErrorMessage(err, fallback)` para parsear respuestas del servidor.
4. **Protección de Estados Finales**: Cambios destructivos requieren confirmación vía `AlertService`.
5. **Rendimiento**: `useCallback` en cargadores, `React.memo` en listas largas, `lazy()` en módulos pesados.
6. **Responsividad**: Probar en 360px (mobile), 768px (tablet) y 1280px (desktop) antes de hacer merge.
7. **PWA**: Si agregas nuevas rutas, actualiza `manifest.webmanifest` shortcuts y `sw.js` STATIC_ASSETS.
