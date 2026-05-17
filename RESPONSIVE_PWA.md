# 📱 Kiora Admin — Guía de Responsividad y PWA

Documento de referencia para desarrolladores sobre cómo está implementado el diseño responsivo y la Progressive Web App (PWA) en el panel administrativo de Kiora.

---

## 1. Estrategia de Responsividad (Mobile-First)

El frontend fue diseñado con enfoque **mobile-first**: los estilos base se definen para pantallas pequeñas y se escalan hacia arriba con breakpoints de Tailwind.

### Breakpoints Usados

| Alias | Ancho mínimo | Uso |
|-------|-------------|-----|
| *(base)* | 0px | Móvil (< 640px) |
| `sm:` | 640px | Móvil grande / Phablet |
| `md:` | 768px | Tablet |
| `lg:` | 1024px | Desktop |
| `xl:` | 1280px | Desktop amplio |

---

## 2. Navegación Responsiva

### `AdminSubNav.tsx` — Dos layouts en uno

**Desktop (`lg:` y mayor)** — Sidebar vertical fijo a la izquierda:
```
┌──┐  ┌────────────────────────────┐
│🏠│  │   Contenido del panel       │
│📦│  │                             │
│💰│  │                             │
│📊│  │                             │
│⚙️│  └────────────────────────────┘
└──┘
(fixed left-4, top-50%, z-60)
```

**Móvil/Tablet (< `lg`)** — Bottom tab bar fijo:
```
┌────────────────────────────────┐
│   Contenido del panel           │
│                                 │
│                                 │
└────────────────────────────────┘
│🏠 Inicio │📦 Prod│💰 Ventas│⚙️│
 ──────────────────────────────────
(fixed bottom-0, z-60, safe-area)
```

El bottom bar:
- Usa `env(safe-area-inset-bottom)` para respetar el notch de iOS.
- Tiene scroll horizontal si hay más ítems de los que caben.
- Muestra un círculo rojo en el ícono activo.

### `AdminNavbar.tsx` — Barra superior adaptativa

| Elemento | Desktop | Móvil |
|----------|---------|-------|
| Logo | Logo + texto "Admin System" | Solo logo |
| Botón POS | Texto "Punto de venta" + ícono | Solo ícono de carrito |
| Notificaciones | Ícono con badge | Ícono con badge |
| Avatar | Avatar circular | Avatar circular (más pequeño) |
| Cerrar sesión | Botón "Salir" con texto | Solo ícono de logout |

---

## 3. Layout del Contenido Principal (`PanelApp.tsx`)

```tsx
<main className="
  mx-auto max-w-[1600px]
  px-4 py-6 pb-28      /* móvil: padding inferior para el bottom bar */
  sm:px-6 sm:py-8
  lg:px-8 lg:pb-10     /* desktop: padding inferior normal */
  lg:pl-20             /* desktop: espacio para el sidebar izquierdo */
">
```

El `pb-28` en móvil garantiza que el contenido no quede tapado por el bottom bar de navegación.  
El `lg:pl-20` en desktop deja espacio para el sidebar de 60px de ancho.

---

## 4. Grids y Layouts Responsivos

### Dashboard — Stats Cards
```tsx
// 2 columnas en móvil, 4 en desktop
<div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
```

### Dashboard — Gráfica de Ventas
```tsx
// 200px en móvil, 300px en desktop
<div className="h-[200px] sm:h-[300px] w-full">
```

### Dashboard — Columnas Laterales
```tsx
// 1 columna en móvil, 3 en desktop (2+1)
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
  <div className="lg:col-span-2"> ... </div>
  <div> ... </div>
</div>
```

### Reportes — Tabs
```tsx
// Scroll horizontal en móvil, labels abreviados
<div className="flex overflow-x-auto pb-2 hide-scrollbar">
  <TabsTrigger className="px-3 sm:px-6 text-[9px] sm:text-[10px]">
    <span className="hidden sm:inline">Guardados </span>({n})
  </TabsTrigger>
```

---

## 5. Utilidades CSS (`global.css`)

```css
/* Ocultar scrollbar en carruseles de tabs */
.hide-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.hide-scrollbar::-webkit-scrollbar { display: none; }

/* Safe area para iOS (notch) */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
}

/* Prevenir scroll horizontal en móvil */
@media (max-width: 1024px) {
  html, body { overflow-x: hidden; }
}
```

---

## 6. PWA — Progressive Web App

### 6.1 Manifest (`public/manifest.webmanifest`)

Configuración completa para instalación nativa:

```json
{
  "name": "Kiora Admin | Panel Administrativo",
  "short_name": "Kiora",
  "display": "standalone",
  "display_override": ["window-controls-overlay", "standalone", "minimal-ui"],
  "theme_color": "#3E2723",
  "background_color": "#f8fafc",
  "start_url": "/panel",
  "scope": "/",
  "shortcuts": [
    { "name": "Panel Principal", "url": "/panel?tab=dashboard" },
    { "name": "Punto de Venta",  "url": "/panel?tab=ventas&pos=true" },
    { "name": "Inventario",      "url": "/panel?tab=inventario" }
  ]
}
```

Los `shortcuts` aparecen como acciones rápidas en Android al mantener pulsado el ícono de la app.

### 6.2 Service Worker (`public/sw.js`) — v3

Estrategia dual de caché:

| Tipo de recurso | Estrategia | Razón |
|----------------|-----------|-------|
| HTML (navegación) | **Network-First** | Siempre obtener la última versión |
| Imágenes, fonts, JS, CSS | **Cache-First** | Carga instantánea offline |
| Peticiones `/api/*` | **Sin interceptar** | Los datos deben ser frescos |
| Recursos externos | **Sin interceptar** | Solo mismo origen |

**Fallbacks offline:**
- Si el usuario navega y no hay red → sirve la versión cacheada de la página.
- Si no hay caché → redirige a `/panel`.

**Push Notifications:**
```js
self.addEventListener('push', event => {
  // Muestra notificación nativa con título, cuerpo, ícono y acciones
  // Acción "open" → abre el panel
  // Acción "dismiss" → cierra sin acción
});
```

### 6.3 Banner de Instalación (`PWAInstallPrompt.tsx`)

Flujo:
1. El navegador dispara `beforeinstallprompt` → se difiere.
2. Después de **3 segundos**, se muestra el banner en la esquina inferior.
3. Si el usuario hace clic en "Instalar" → se llama `deferredPrompt.prompt()`.
4. Si hace clic en "×" → se guarda en `sessionStorage` para no molestar de nuevo en esa sesión.
5. Si la app ya está instalada (`display-mode: standalone`) → el banner nunca se muestra.

**Posicionamiento:**
- **Móvil**: Centrado, justo sobre el bottom bar (`bottom-20`).
- **Desktop**: Esquina inferior derecha (`bottom-6 right-6`).

### 6.4 Meta Tags PWA (en `mainlayout.astro`)

```html
<!-- Manifest -->
<link rel="manifest" href="/manifest.webmanifest" />
<meta name="theme-color" content="#3E2723" />

<!-- Apple / iOS -->
<link rel="apple-touch-icon" href="/img/logo-kiora-vectorizado.png" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Kiora" />

<!-- Android -->
<meta name="mobile-web-app-capable" content="yes" />

<!-- Windows (MS Tiles) -->
<meta name="msapplication-TileColor" content="#3E2723" />
<meta name="msapplication-TileImage" content="/img/logo-kiora-vectorizado.png" />
```

> **Nota iOS**: Safari no soporta el evento `beforeinstallprompt`. El usuario debe instalarlo manualmente via "Compartir → Añadir a pantalla de inicio". El `apple-mobile-web-app-capable` garantiza que funcione correctamente en modo standalone.

---

## 7. Checklist de Compatibilidad

| Plataforma | Navegador | Estado |
|-----------|-----------|--------|
| Android | Chrome 90+ | ✅ Instalable, PWA completa |
| Android | Firefox | ✅ Responsivo (sin instalación PWA) |
| iOS 16.4+ | Safari | ✅ Instalable via "Añadir a pantalla" |
| iOS < 16.4 | Safari | ⚠️ Responsivo (sin PWA install) |
| Desktop | Chrome/Edge | ✅ Instalable, window controls overlay |
| Desktop | Firefox | ✅ Responsivo (sin instalación) |
| Desktop | Safari | ✅ Responsivo (sin instalación) |

---

## 8. Pruebas de Responsividad

Para verificar el diseño en distintas pantallas:

```bash
# Iniciar servidor de desarrollo
npm run dev

# En Chrome DevTools:
# F12 → Toggle Device Toolbar (Ctrl+Shift+M)
# Probar en: iPhone SE (375px), iPhone 14 (390px), iPad (768px), Desktop (1280px)
```

**Puntos críticos a verificar:**
- [ ] Bottom bar visible y funcional en móvil.
- [ ] Sidebar oculto en móvil (`hidden lg:flex`).
- [ ] Stats del dashboard en 2 columnas en móvil.
- [ ] Gráfica de ventas con altura reducida en móvil.
- [ ] Tabs de reportes con scroll horizontal.
- [ ] Panel de notificaciones no se sale de la pantalla.
- [ ] Contenido no queda tapado por el bottom bar (`pb-28`).
- [ ] Banner PWA posicionado correctamente en cada dispositivo.

---

## 9. Guía para Agregar Nuevos Módulos

Al agregar un nuevo tab/módulo al panel:

1. **Agregar ítem a `AdminSubNav.tsx`** — Incluir en el array `items`.
2. **Renderizar en `PanelApp.tsx`** — Agregar condición `activeTab === 'nuevo-tab'`.
3. **Actualizar `manifest.webmanifest`** — Si es importante, agregar a `shortcuts`.
4. **Verificar responsividad** — El bottom bar tiene scroll horizontal automático si hay muchos ítems.
5. **Testing** — Probar en 360px, 768px y 1280px.
