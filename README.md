# 🍰 Kiora – Panel Administrativo Frontend

**Sistema integral de gestión para kiosko**  
*Punto de Venta · Inventario · Ventas · Facturación · Usuarios*

![Astro](https://img.shields.io/badge/Astro-v5.17-BC52EE?style=for-the-badge&logo=astro&logoColor=white)
![React](https://img.shields.io/badge/React-v19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-v4-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)

**Kiora** es el ecosistema frontend centralizado para la gestión integral del sistema de microservicios. Esta aplicación integra los módulos de **Administración**, **Inventario**, **Venta Directa (Kiosk)**, **Incidencias** y **Seguridad** bajo una arquitectura robusta de **Astro v5** y **React v19**.

---

## 📋 Descripción

Centraliza los módulos de **Administración**, **Inventario**, **Punto de Venta (POS)**, **Facturación**, **Incidencias** y **Seguridad** bajo una arquitectura moderna basada en **Astro v5** + **React v19**.

### Características principales

- 🏠 **Dashboard** con resumen de ventas en tiempo real, insights de IA y alertas de stock crítico.
- 📦 **Catálogo de Productos** con gestión de categorías, stock, imágenes y búsqueda inteligente.
- 🛒 **Punto de Venta (POS)** con carrito persistente y **validación de stock en tiempo real**.
- 📊 **Módulo de Ventas** con historial detallado, gestión de estados y **exportación a Excel/PDF**.
- 🧾 **Facturación Histórica** con registro contable y reportes descargables.
- 👥 **Gestión de Usuarios** con roles (Admin/Operario), reseteo de claves administrativo y bloqueos de seguridad.
- 🔧 **Mantenimiento** con reportes de incidencias técnicas y Health Check de servicios.
- 💳 **Integración con Stripe** para pagos electrónicos seguros.
- 🌐 **PWA** con soporte offline, manifest y etiquetas meta optimizadas.

---

## 📂 Arquitectura del Proyecto

```
src/
├── components/                # Capa de Presentación (React)
│   ├── auth/                  # Login, Recuperar contraseña, Verificación
│   ├── panel/                 # Dashboard Administrativo (Módulos dinámicos)
│   │   ├── PanelApp.tsx       # Orquestador principal del panel
│   │   ├── DashboardSection   # Resumen del día + Insights IA
│   │   ├── ProductsSection    # Catálogo CRUD con búsqueda difusa
│   │   ├── InventarioSection  # Control de stock, movimientos y alertas
│   │   ├── OrdersSection      # Historial de pedidos y Facturación Histórica
│   │   └── ...                # Otros módulos
│   ├── ui/                    # Componentes transversales (Loader, Icons)
│   └── help/                  # Centro de Ayuda (FAQs)
├── core/                      # Infraestructura (HttpClient con interceptors)
├── services/                  # Lógica de Negocio (Order, Product, Inventory...)
├── models/                    # Interfaces TypeScript (Product, Order, User...)
├── pages/                     # Rutas Astro (.astro)
├── styles/                    # Tailwind v4 + CSS global
└── utils/                     # Utilidades (paginación, errores, búsqueda)
```

---

## 🚀 Inicio Rápido

Para una explicación profunda de la arquitectura y patrones utilizados, consulta:
👉 **[TECHNICAL_DOCS.md](./src/TECHNICAL_DOCS.md)**  
👉 **[Seguridad y Modelos de Amenaza](./SECURITY.md)**

### Prerrequisitos
- **Node.js** ≥ 18
- **npm** ≥ 9
- Backend de microservicios corriendo (API Gateway en puerto `3000` o según configuración)

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-org/kiora-frontend.git
cd kiora-frontend

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Asegúrate de que PUBLIC_API_URL apunte al Gateway correcto
```

### Desarrollo Local

```bash
npm run dev
# → http://localhost:8080
```

### Docker

```bash
docker-compose up -d --build
```

---

## 🛠️ Stack Tecnológico

| Categoría | Tecnología | Versión |
|-----------|-----------|---------|
| **Framework SSR** | Astro | v5.17 |
| **UI Library** | React | v19.2 |
| **Estilos** | Tailwind CSS | v4.2 |
| **Reportes** | xlsx / jsPDF | Latest |
| **Testing** | Vitest + Testing Library | v4.0 |
| **Búsqueda** | Fuse.js | v7.3 |
| **PWA** | @vite-pwa/astro | v1.2 |

---

## 📐 Principios de Ingeniería

- **Clean Architecture** – Separación estricta entre UI, servicios e infraestructura.
- **Microservices Oriented** – Comunicación optimizada a través de un API Gateway.
- **Validación Preventiva** – El POS bloquea acciones que excedan el stock físico disponible.
- **PWA (Progressive Web App)** – Soporte nativo para instalación y funcionamiento offline.
- **Premium UI** – Diseño consistente basado en tokens de marca (Kiora Red `#ec131e`).

---

## 📖 Notas Adicionales

- **API**: El Gateway de microservicios (Puerto 3000) debe estar levantado.
- **Incidencias**: Usa el módulo de Soporte para reportar fallos técnicos detectados.
- **Recibos**: Los PDFs de ventas se generan dinámicamente conectando con el `reports-service`.
