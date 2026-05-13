# Seguridad — Kiora Frontend

Este documento describe el modelo de seguridad, controles de acceso y políticas de protección de datos del frontend de Kiora.

La aplicación es un sitio estático con React en el cliente. La autorización definitiva reside en el **API Gateway (Puerto 3000)** y los microservicios individuales. El frontend gestiona la experiencia de usuario y oculta rutas según el rol, pero no sustituye la validación del lado del servidor.

---

## 1. Control de Acceso y Roles

El sistema implementa una verificación de roles basada en JWT:
- **Admin**: Acceso completo a gestión de usuarios, reseteo de claves, edición de inventario y exportación de reportes contables.
- **Cliente / Operador**: Acceso limitado al Punto de Venta (POS) y visualización básica. No puede modificar roles ni resetear contraseñas de terceros.

**Nota Crítica:** La autorización visual en el frontend es una medida de UX. El **API Gateway** y los microservicios realizan la validación definitiva de permisos en cada petición.

---

## 2. Gestión de Credenciales Administrativas

Se ha implementado un módulo de **Reseteo Administrativo de Contraseñas**:
- Solo accesible para usuarios con rol `admin`.
- Requiere una confirmación explícita mediante un diálogo de seguridad antes de proceder.
- Utiliza un endpoint dedicado (`/auth/users/:id/password`) que invoca el endpoint administrativo del microservicio de autenticación.

---

## 3. Integridad de Datos en Ventas

Para prevenir el fraude o errores operativos, el sistema aplica reglas de integridad:
- **Estados Inmutables**: Una vez que una venta se marca como `cancelada`, el frontend bloquea cualquier cambio posterior de estado.
- **Validación de Inventario**: El Punto de Venta (POS) impide la creación de pedidos con cantidades que excedan el stock validado, reduciendo el riesgo de sobreventa.

---

## 4. Almacenamiento y Sesión

- **JWT (JSON Web Token)**: Actualmente almacenado en `localStorage` para facilitar el soporte de PWA. Se recomienda para producción el uso de cookies `HttpOnly` para mitigar riesgos de XSS.
- **Monitoreo de Inactividad**: El `SessionManager` cierra la sesión automáticamente tras periodos de inactividad, limpiando datos sensibles.
- **Sanitización**: Se evita el uso de `dangerouslySetInnerHTML` para prevenir ataques de inyección de scripts (XSS).

---

## 5. Integración con el API Gateway

- Todas las peticiones pasan por el **API Gateway**.
- La identidad del usuario se propaga mediante cabeceras `Authorization: Bearer <token>`.
- El frontend no almacena secretos del backend ni claves de API sensibles.

---

## 6. Recomendaciones de Despliegue

1.  **HTTPS Obligatorio**: Nunca desplegar la aplicación sobre HTTP.
2.  **CSP (Content Security Policy)**: Configurar cabeceras CSP estrictas en el servidor web (Nginx) para mitigar intentos de inyección.
3.  **Auditoría de Roles**: Verificar periódicamente que los permisos asignados en el microservicio de usuarios coincidan con las necesidades operativas.

---

## 7. Componentes de Seguridad Clave
- Cliente HTTP: `src/core/http/HttpClient.ts`
- Gestión de Incidencias: `src/services/IncidentService.ts`
- Autenticación: `src/services/AuthService.ts`
- Gestor de Sesiones: `src/services/SessionManager.ts`
