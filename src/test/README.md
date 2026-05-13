# Suite de Pruebas de Kiora (Front-end)

Este directorio contiene la infraestructura y los archivos de prueba para garantizar la calidad técnica y visual de la aplicación Kiora.

## Tecnologías Utilizadas
- **Vitest**: Motor de ejecución de pruebas de alto rendimiento.
- **React Testing Library**: Para pruebas de componentes centradas en el usuario.
- **Vitest-Axe**: Auditoría de accesibilidad automatizada (WCAG).
- **JSDOM**: Entorno de simulación de navegador.

## Estructura de Directorios
- `src/test/setup.js`: Configuración global, extensiones de `expect` y mocks de APIs del navegador.
- `src/test/services/`: Pruebas unitarias para la capa de datos (HttpClient, ProductService, InventoryService, OrderService).
- `src/test/components/`: Pruebas de renderizado, interacción y accesibilidad de componentes React.

## Cómo Ejecutar las Pruebas

### Ejecución Única:
```bash
npm run test
```

### Modo Observador (Watch):
```bash
npx vitest
```

### Verificación de Tipos (TypeScript):
```bash
npx tsc --noEmit
```

## Reporte Final de Ejecución (Resultados)

| Módulo | Pruebas Ejecutadas | Aprobadas | Rechazadas | Estado |
| :--- | :---: | :---: | :---: | :---: |
| **Servicios de Datos** | 11 | 11 | 0 | ✅ OK |
| **Componentes UI (React)** | 6 | 6 | 0 | ✅ OK |
| **Utilidades y HttpClient** | 10 | 10 | 0 | ✅ OK |
| **Accesibilidad (WCAG)** | 2 | 2 | 0 | ✅ OK |
| **TOTAL** | **29** | **29** | **0** | **✅ EXITOSO** |

## Riesgos Potenciales Identificados ⚠️

1. **Latencia de Red (Microservicios)**: Al ser una arquitectura distribuida, la latencia entre contenedores puede afectar tiempos de respuesta en el Dashboard si no se implementan mecanismos de caché (Redis ya está en uso pero debe monitorearse).
2. **Consistencia Eventual**: La sincronización entre el microservicio de Inventario y el de Órdenes depende de la rapidez del procesamiento. Se recomienda auditoría periódica de stock vs ventas.
3. **Dependencia de `host.docker.internal`**: El despliegue local en Docker depende de que el host resuelva correctamente esta dirección para que Nginx se comunique con el Gateway.
4. **Almacenamiento Persistente**: Los volúmenes de Docker deben estar correctamente montados para evitar pérdida de datos en reinicios de contenedores de bases de datos.

## Pruebas Incluidas
1. **Lógica de Negocio**: Validación de consumo de APIs, manejo de errores y transformación de datos en los servicios.
2. **Interactividad**: Verificación de formularios (Login, Recuperación), Drawers y filtrado de tablas.
3. **Accesibilidad**: Cada componente crítico pasa por una auditoría de `axe-core` para asegurar el cumplimiento de estándares de inclusión.
4. **Integridad de Tipos**: Auditoría estática para prevenir errores de referencia (`null/undefined`) en tiempo de ejecución.
