# 🍰 Kiora – Panel Administrativo Frontend

**Sistema integral de gestión para kiosko**  
*Punto de Venta · Inventario · Ventas · Facturación · Usuarios · PWA*

![Astro](https://img.shields.io/badge/Astro-v5.17-BC52EE?style=for-the-badge&logo=astro&logoColor=white)
![React](https://img.shields.io/badge/React-v19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)

**Kiora Admin** es el frontend centralizado para la gestión integral del sistema de microservicios Kiora. Integra módulos de **Administración**, **Inventario**, **Venta Directa (POS)**, **Incidencias** y **Seguridad** bajo una arquitectura moderna de **Astro v5** + **React v19**, totalmente responsivo y con soporte PWA completo.

---

## 📋 Descripción

Centraliza los módulos de **Administración**, **Inventario**, **Punto de Venta (POS)**, **Facturación**, **Incidencias** y **Seguridad** bajo una arquitectura moderna basada en **Astro v5** + **React v19**.

### Características principales

- 🏠 **Dashboard** con resumen de ventas en tiempo real, insights de IA y alertas de stock crítico.
- 📦 **Catálogo de Productos** con gestión de categorías, stock, imágenes y búsqueda inteligente.
- 🛒 **Punto de Venta (POS)** con carrito persistente y validación de stock en tiempo real.
- 📊 **Módulo de Ventas** con historial detallado, estados y exportación a Excel/PDF.
- 🧾 **Facturación Histórica** con registro contable y reportes descargables.
- 👥 **Gestión de Usuarios** con roles (Admin/Operario), reseteo de claves y bloqueos de seguridad.
- 🔧 **Mantenimiento** con reportes de incidencias técnicas y Health Check de servicios.
- 💳 **Integración con Stripe** para pagos electrónicos seguros vía QR/Redirect.
- 📱 **100% Responsivo** — diseñado mobile-first con bottom tab bar en móvil y sidebar en desktop.
- 🌐 **PWA Completa** — instalable, offline-ready, shortcuts de app, push notifications.

---

## 📂 Arquitectura del Proyecto

```
PROYECTO_KIORAPP/
├── public/
│   ├── manifest.webmanifest   # PWA: nombre, íconos, shortcuts, display
│   ├── sw.js                  # Service Worker v3 (Network-First + Cache-First)
│   └── img/                   # Logos e íconos de la marca
│
├── src/
│   ├── components/            # Capa de Presentación (React)
│   │   ├── auth/              # Login, Recuperar contraseña, Verificación
│   │   ├── panel/             # Dashboard Administrativo (módulos dinámicos)
│   │   │   ├── PanelApp.tsx          # Orquestador principal
│   │   │   ├── AdminNavbar.tsx       # Barra superior responsiva
│   │   │   ├── AdminSubNav.tsx       # Sidebar (desktop) / Bottom bar (móvil)
│   │   │   ├── DashboardSection.tsx  # Resumen del día + Insights
│   │   │   ├── ReportsSection.tsx    # Reportes, alertas, incidencias
│   │   │   ├── SettingsSection.tsx   # Ajustes del sistema
│   │   │   ├── PWAInstallPrompt.tsx  # Banner de instalación PWA
│   │   │   ├── OfflineBanner.tsx     # Aviso de conexión perdida
│   │   │   └── ...                   # Otros módulos
│   │   ├── ui/                # Componentes transversales (shadcn/ui)
│   │   └── help/              # Centro de Ayuda (FAQs)
│   │
│   ├── features/              # Módulos de dominio
│   │   ├── users/             # Gestión de usuarios y perfiles
│   │   ├── products/          # Catálogo y categorías
│   │   ├── sales/             # Ventas, POS, Stripe
│   │   └── inventory/         # Inventario y proveedores
│   │
│   ├── core/                  # Infraestructura (HttpClient, interceptores)
│   ├── services/              # Lógica de Negocio (Order, Product, Auth...)
│   ├── store/                 # Estado global (Zustand)
│   ├── hooks/                 # Custom hooks (useAuth, useRealTimeUpdates...)
│   ├── models/                # Interfaces TypeScript (Product, Order, User...)
│   ├── pages/                 # Rutas Astro (.astro)
│   ├── styles/                # Tailwind v4 + CSS global responsivo
│   └── utils/                 # Utilidades (paginación, errores, búsqueda)
│
├── astro.config.mjs           # Configuración Astro + Vite + Sentry
├── Dockerfile                 # Imagen de producción con Nginx
└── nginx.conf                 # Configuración del servidor estático
```

---

## 🚀 Inicio Rápido

Para arquitectura detallada y patrones:
👉 **[src/TECHNICAL_DOCS.md](./src/TECHNICAL_DOCS.md)**  
👉 **[RESPONSIVE_PWA.md](./RESPONSIVE_PWA.md)**  
👉 **[SECURITY.md](./SECURITY.md)**

### Prerrequisitos
- **Node.js** ≥ 18
- **npm** ≥ 9
- Backend de microservicios corriendo (API Gateway en puerto `3000` o según `.env`)

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/juancho-018/PROYECTO_KIORAPP.git
cd PROYECTO_KIORAPP

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env y apuntar PUBLIC_API_URL al Gateway correcto
```

### Desarrollo Local

```bash
npm run dev
# → http://localhost:8080
```

### Docker (Producción)

```bash
docker-compose up -d --build
# Nginx sirve el build estático en el puerto configurado
```

---

## 🛠️ Stack Tecnológico

| Categoría | Tecnología | Versión |
|-----------|-----------|---------|
| **Framework SSR/SSG** | Astro | v5.17 |
| **UI Library** | React | v19.2 |
| **Estilos** | Tailwind CSS | v4.2 |
| **Componentes UI** | shadcn/ui | Latest |
| **Estado Global** | Zustand | v5 |
| **Reportes** | xlsx / jsPDF | Latest |
| **Testing** | Vitest + Testing Library | v4.0 |
| **Búsqueda** | Fuse.js | v7.3 |
| **Pagos** | Stripe Checkout | v3 |
| **Monitoreo** | Sentry | v9 |
| **Gráficas** | Recharts | v2 |

---

## 📱 Responsive Design

La interfaz es **mobile-first** y funciona perfectamente en cualquier pantalla:

| Pantalla | Navegación | Layout |
|----------|-----------|--------|
| **Mobile** (`< 1024px`) | Bottom tab bar fijo | Stack vertical, 2 columnas en stats |
| **Tablet** (`768–1024px`) | Bottom tab bar | Grid intermedio |
| **Desktop** (`≥ 1024px`) | Sidebar vertical izquierdo | Grid completo multi-columna |

Ver detalles completos → **[RESPONSIVE_PWA.md](./RESPONSIVE_PWA.md)**

---

## 📐 Principios de Ingeniería

- **Clean Architecture** – Separación estricta entre UI, servicios e infraestructura.
- **Microservices Oriented** – Comunicación optimizada a través de un API Gateway.
- **Validación Preventiva** – El POS bloquea acciones que excedan el stock físico disponible.
- **PWA (Progressive Web App)** – Instalable, offline-ready con Service Worker v3.
- **Mobile-First** – Diseñado desde el dispositivo más pequeño hacia arriba.
- **Premium UI** – Diseño basado en tokens de marca (Kiora Red `#ec131e`, Brown `#3E2723`).

---

## 🌐 Variables de Entorno

Crea tu archivo `.env` basándote en `.env.example`:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PUBLIC_API_URL` | URL base del API Gateway | `https://api.kiora.app` |
| `PUBLIC_WEGLOT_API_KEY` | Clave de Weglot (opcional) | `wg_xxx...` |
| `SENTRY_AUTH_TOKEN` | Token para Sentry source maps | `sntrys_xxx...` |

---

## 📖 Notas Adicionales

- **API**: El Gateway de microservicios debe estar levantado antes de iniciar el frontend.
- **Incidencias**: Usa el módulo de Soporte para reportar fallos técnicos detectados.
- **Recibos**: Los PDFs de ventas se generan conectando con el `reports-service`.
- **PWA**: El Service Worker se registra automáticamente en producción. En desarrollo, el proxy de Vite intercepta las peticiones a `/api`.
- **Sentry**: Los source maps se suben en el build de producción. Se usan `hidden` sourcemaps para no exponerlos públicamente.
