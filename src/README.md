# Source Code (`src/`) - Developer Guide

Esta carpeta contiene el núcleo lógico y visual de la aplicación. Se sigue un patrón de separación de responsabilidades estricto.

## 🚀 Inicio Rápido (Desarrollo)

1.  **Instalación**: `npm install`
2.  **Ejecución**: `npm run dev`
    - La aplicación estará disponible en: **`http://localhost:8080`**
    - Nota: El puerto 8080 está configurado en `astro.config.mjs` para coincidir con el mapeo de Docker.

## Estructura de Directorios

### 📂 [`components/`](./components/)
Contiene todos los componentes de React (`.tsx`, `.jsx`).
- **`auth/`**: Componentes del flujo de seguridad (Login, Password Reset).
- **`panel/`**: Orquestadores del Dashboard administrativo.
- **`inventory/`**: Gestión de stock, proveedores y movimientos.
- **`products/`**: CRUD de productos y categorías.
- **`help/`**: Centro de soporte al usuario.
- **`ui/`**: Componentes transversales y atómicos.

### 📂 [`core/`](./core/)
Abstracciones de infraestructura y herramientas compartidas.
- **`http/`**: Cliente base para comunicaciones con la API (`HttpClient.ts`).
- **`ui/`**: Notificaciones globales y servicios de alerta.

### 📂 [`services/`](./services/)
Lógica de negocio y comunicación con la API.
- **`ProductService.ts`**: Gestión de catálogo y categorías.
- **`InventoryService.ts`**: Control de existencias y proveedores.
- **`OrderService.ts`**: Ventas, facturación y recibos PDF.
- **`IncidentService.ts`**: Gestión de tickets/reportes de fallo.
- **`AuthService.ts`**: Seguridad y sesiones JWT.

### 📂 [`models/`](./models/)
Interfaces y tipos de TypeScript que definen los contratos de datos (Data Models).

### 📂 [`pages/`](./pages/)
Rutas de la aplicación gestionadas por **Astro**. Incluye soporte para PWA mediante el manifiesto.

### 📂 [`styles/`](./styles/)
Configuración global de **Tailwind CSS v4**.

---

## 📘 Documentación Técnica
Para detalles sobre patrones de diseño, servicios y arquitectura modular:
👉 **[TECHNICAL_DOCS.md](./TECHNICAL_DOCS.md)**

---

## 💡 Reglas para Desarrolladores

1.  **Lógica Extraída**: Toda llamada a la API debe vivir en un `Service`, nunca directamente en el componente React.
2.  **Sincronización BE**: Sigue estrictamente los contratos definidos en el backend (ver `setup.ts` para la URL base del Gateway en puerto 3000).
3.  **Tipado**: Usa siempre las interfaces de `models/` para garantizar la consistencia.

