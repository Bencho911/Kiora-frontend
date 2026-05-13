# Plan de Mejora de Lógica y UI: Productos y Proveedores

Este plan aborda los problemas de persistencia en el backend, la lógica de filtrado en el frontend y las mejoras visuales solicitadas.

## User Review Required

> [!IMPORTANT]
> Se requiere que el usuario verifique si tiene acceso a la base de datos para ejecutar las siguientes sentencias SQL, ya que no hay un sistema de migraciones automatizado visible:
> ```sql
> -- Añadir columna tipos_prod a la tabla Producto
> ALTER TABLE Producto ADD COLUMN IF NOT EXISTS tipos_prod TEXT[] DEFAULT '{}';
> 
> -- Añadir columna correo_prov a la tabla Proveedor
> ALTER TABLE Proveedor ADD COLUMN IF NOT EXISTS correo_prov VARCHAR(100);
> ```

## Proposed Changes

### Backend (Kiora-Backend)

#### [MODIFY] [productRepository.js](file:///home/camilo/Escritorio/Kiora/kiora-backend/services/products-service/src/repositories/productRepository.js)
- Incluir `tipos_prod` en las consultas `SELECT`.
- Actualizar `create` y `update` para manejar el campo `tipos_prod`.

#### [MODIFY] [productController.js](file:///home/camilo/Escritorio/Kiora/kiora-backend/services/products-service/src/controllers/productController.js)
- Extraer `tipos_prod` del cuerpo de la petición.
- Realizar `JSON.parse` si viene como string (común en `FormData`).

#### [MODIFY] [inventoryRepository.js](file:///home/camilo/Escritorio/Kiora/kiora-backend/services/inventory-service/src/repositories/inventoryRepository.js)
- Incluir `correo_prov` en `createSupplier` y `updateSupplier`.

#### [MODIFY] [inventoryController.js](file:///home/camilo/Escritorio/Kiora/kiora-backend/services/inventory-service/src/controllers/inventoryController.js)
- Extraer `correo_prov` en `createSupplier`.

---

### Frontend (Proyecto_KioraApp)

#### [MODIFY] [ProductsSection.tsx](file:///home/camilo/Escritorio/Kiora/PROYECTO_KIORAPP/src/components/panel/ProductsSection.tsx)
- **Lógica de Filtrado:** Asegurar que si el producto tiene múltiples tipos, aparezca si se selecciona al menos uno de ellos.
- **UI de Tarjetas:**
    - Aumentar el tamaño relativo de las tarjetas.
    - Aplicar un sombreado (`shadow-xl`) más pronunciado.
    - Mejorar la visualización de los "tags" de tipos.

#### [MODIFY] [MaintenanceSection.tsx](file:///home/camilo/Escritorio/Kiora/PROYECTO_KIORAPP/src/components/panel/MaintenanceSection.tsx)
- Mostrar el correo electrónico y el número de teléfono en la lista de proveedores.

## Verification Plan

### Automated Tests
- Ejecutar `npm run test` si existen pruebas relevantes.
- Verificar compilación con `npx tsc --noEmit`.

### Manual Verification
1.  **Productos:**
    - Crear un producto con múltiples tipos (ej. "ácido" y "dulce").
    - Guardar y recargar la página para verificar que se persisten.
    - Filtrar por "ácido" y verificar que el producto aparece.
    - Filtrar por "dulce" y verificar que el producto aparece.
2.  **Proveedores:**
    - Crear/Editar un proveedor añadiendo correo y teléfono.
    - Verificar que se muestran correctamente en la tabla/lista de mantenimiento.
